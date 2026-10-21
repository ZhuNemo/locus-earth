// ============================================================================
// Locus Earth Service Worker
// ============================================================================
// 缓存策略
//   · 导航请求        → 缓存优先 + 后台更新（有缓存立刻出页面，网络回来的
//                       副本写回缓存给下次用）；连缓存都没有才等网络，
//                       仍失败则返回可读的离线提示页，而不是空响应
//   · 应用外壳资源    → 缓存优先 + 后台回源更新，未命中时等回源结果
//   · Cesium 引擎资源 → 缓存优先，写入带版本号的独立缓存（随版本自动淘汰）
//   · 底图瓦片（图片）→ 独立缓存，缓存优先且命中后不再回源（离线可看），
//                       容量超限时按先进先出裁剪；开关由设置页控制，
//                       关掉时原样放行（不读也不写）
//   · ion 资产接口    → 缓存优先（45 分钟内）+ 后台换新，离线时用旧票据兜底
//   · 其他请求        → 网络优先，失败时回退缓存
//
// 一个容易搞错的事实（2026-10-18 实测确认）：**Service Worker 拦得到 XHR**。
// 「SW 拦不到 XHR」是常见的误传 —— 拦不到的是 WebSocket 与 EventSource。
// Chromium / Android WebView 里，纯 XHR 的响应同样会进 Cache Storage，
// 所以 Cesium 用 XHR 取瓦片完全不影响缓存，不需要去改引擎的私有实现。
//
// 维护提示
//   · 改动 index.html / settings.html 引用的资源时，必须同步更新 SHELL_URLS
//   · 升级 Cesium 时，必须同时更新 index.html 的 importmap 与 CESIUM_VERSION
//   · 改动本文件后必须把 CACHE_VERSION 加一，否则新 Service Worker 不会重跑
//     install，SHELL_URLS 里的新文件也就不会进缓存
// ============================================================================

// 版本号必须比**已经部署过的**都大，否则装了更高号缓存的用户不会换缓存。
// 历史：v31（改造前）→ 远端那条线 v33 → 合并 v34 → 修复 v35 → 设置页诊断 v36
// → 去掉 importmap 依赖 v37。
const CACHE_VERSION = 'v37';
const APP_CACHE_NAME = `locus-earth-app-cache-${CACHE_VERSION}`;

// Cesium 引擎缓存：把版本号写进缓存名，升级后旧缓存会在 activate 时被淘汰，
// 不再像过去那样在同一个缓存里无限累积。
// 必须与 index.html 的 importmap 完全一致 —— 那边现在钉的是补丁号 1.118.2，
// 不是 1.118（`@1.118` 会被 unpkg 302 到 1.118.2，白白多一跳；钉死之后
// modulepreload 的键也和 import 的键对得上，才能真正提前下载）。
const CESIUM_VERSION = '1.118.2';
const CESIUM_CACHE_NAME = `locus-earth-cesium-${CESIUM_VERSION}`;

// 底图瓦片缓存。
//
// 为什么需要它：瓦片是浏览体验里体积最大的一类资源，但浏览器自带的 HTTP 缓存
// 完全由内核按响应头自己管，网页既查不到也删不掉，离线更是碰运气。放进 Cache
// Storage 之后这三件事都变成了我们能控制的：命中与否、占多少、清不清。
//
// 缓存名刻意不带 CACHE_VERSION —— 瓦片内容和代码版本无关，每发一次版就丢掉用户
// 攒下来的离线区域太浪费。只有在「设置 → 清除瓦片缓存」或容量裁剪时才会减少。
const TILE_CACHE_NAME = 'locus-earth-tiles-v1';

// 容量上限（按条目数，而非字节数：Cache Storage 不提供单条大小，逐条读
// content-length 会让每次写入都变慢）。按每片 15–60 KB 估算，2400 片约
// 40–140 MB，足够覆盖几个城市的中高缩放级别，又不至于撑爆移动端配额。
const TILE_MAX_ENTRIES = 2400;
// 超限后裁到上限的这个比例，避免每次写入都触发一轮裁剪。
const TILE_PRUNE_RATIO = 0.8;
// 每写入这么多片才检查一次总量。
const TILE_PRUNE_INTERVAL = 150;

// ----------------------------------------------------------------------------
// 瓦片缓存开关（由设置页推过来）
// ----------------------------------------------------------------------------
// Service Worker 读不到 localStorage，所以状态只能由页面 postMessage 告知。
// 但消息只在页面加载那一刻发一次，而 SW 空闲会被系统回收、重启后内存是空的 ——
// 因此还得有个地方把值存下来。这里开一个几十字节的小缓存专门放它：
// 不参与瓦片裁剪，也不随 CACHE_VERSION 清理（换版本不该改变用户的偏好）。
const FLAGS_CACHE_NAME = 'locus-earth-flags-v1';
const TILE_SWITCH_URL = self.location.origin + '/__locus-tile-switch';

let tileCacheEnabled = true;      // 默认开；消息到达前用它兜底
let tileSwitchLoaded = null;      // 每个 SW 生命周期只读一次盘

function loadTileSwitch() {
  if (!tileSwitchLoaded) {
    tileSwitchLoaded = caches
      .open(FLAGS_CACHE_NAME)
      .then(cache => cache.match(TILE_SWITCH_URL))
      .then(response => (response ? response.text() : ''))
      .then(text => {
        if (text === 'on') tileCacheEnabled = true;
        else if (text === 'off') tileCacheEnabled = false;
      })
      .catch(() => {});
  }
  return tileSwitchLoaded;
}

function saveTileSwitch(enabled) {
  tileCacheEnabled = enabled;
  return caches
    .open(FLAGS_CACHE_NAME)
    .then(cache =>
      cache.put(
        TILE_SWITCH_URL,
        new Response(enabled ? 'on' : 'off', { headers: { 'Content-Type': 'text/plain' } })
      )
    )
    .catch(() => {});
}

// 本应用所有缓存名的前缀。activate 只清理这个前缀，避免影响同一域名下
// 其他项目的缓存（例如共享的 <user>.github.io）。
const CACHE_PREFIX = 'locus-earth-';

// 首屏完整资源清单。
// 这是 index.html 与 settings.html 首屏真正会请求到的全部文件：
// 15 个 CSS、23 个 JS、3 个图标、3 个 favicon、2 个 PWA 图标与 manifest。
// 刻意不含 screenshot-*.png（各约 1–2 MB，只被 manifest 的安装界面使用）。
const SHELL_URLS = [
  './',
  './index.html',
  './settings.html',
  './manifest.json',

  // 样式
  './css/base.css',
  './css/layout.css',
  './css/controls.css',
  './css/basemap-picker.css',
  './css/menu.css',
  './css/buttons.css',
  './css/modals.css',
  './css/bookmarks.css',
  './css/search.css',
  './css/toast.css',
  './css/themes.css',
  './css/measure.css',
  './css/components.css',
  './css/logo.css',
  './css/settings.css',

  // 脚本：main.js 及其整个模块图，外加设置页脚本
  // cesium.js 是引擎的本地入口（export * 转发到 unpkg），所有模块都 import 它，
  // 不能漏 —— 漏了离线时整张模块图会在第一步就断。
  './js/cesium.js',
  './js/main.js',
  './js/icons.js',
  './js/search.js',
  './js/viewer.js',
  './js/imagery.js',
  './js/basemap-picker.js',
  './js/ui.js',
  './js/bookmarks.js',
  './js/hd-layers.js',
  './js/google-mode.js',
  './js/measure.js',
  './js/measure-ui.js',
  './js/compass.js',
  './js/time-control.js',
  './js/utils.js',
  './js/config.js',
  './js/coord-transform.js',
  './js/tool-modes.js',
  './js/streetview.js',
  './js/tile-cache.js',
  './js/settings.js',

  // 图标与 PWA 资源
  './icons/tencent.png',
  './icons/tianditu.png',
  './favicon.ico',
  './favicon-16x16.png',
  './favicon-32x32.png',
  './android-chrome-192x192.png',
  './android-chrome-512x512.png',
  './apple-touch-icon.png'
];

// URL 解析会消掉路径里的 './'，所以绝不能用
// pathname.includes('./index.html') 这类原始字符串比较 —— 那永远不成立，
// 预缓存会形同虚设。这里预先规范化成 pathname 集合。
const SHELL_PATHS = new Set(
  SHELL_URLS.map(url => new URL(url, self.location.href).pathname)
);

function isShellRequest(requestURL) {
  return SHELL_PATHS.has(requestURL.pathname);
}

// 不能用 hostname.includes('cesium.com')，那会把 cesium.com.evil.example 也算进来。
function hostMatches(hostname, domain) {
  return hostname === domain || hostname.endsWith('.' + domain);
}

function isCesiumHost(hostname) {
  return (
    hostMatches(hostname, 'cesium.com') ||
    hostMatches(hostname, 'unpkg.com') ||
    hostMatches(hostname, 'cdnjs.cloudflare.com')
  );
}

// 只缓存引擎脚本类资源，避免把瓦片图片等大体积二进制塞进引擎缓存
// （瓦片有它自己的缓存，见 TILE_CACHE_NAME）。
// 相比旧版补上了 css —— 原先漏掉了 unpkg 上的 widgets.css。
const ENGINE_FILE_PATTERN = /\.(js|css|wasm|data|json)$/;

// ----------------------------------------------------------------------------
// 瓦片识别
// ----------------------------------------------------------------------------
// 只认「跨域的、看起来是栅格图片」的请求。三条线索按可靠性排列：
//   1. 请求由 <img> 发出（destination === 'image'）—— 绝大多数影像瓦片
//   2. 路径以图片扩展名结尾 —— 经 fetch 取回的瓦片（见 js/tile-cache.js）
//   3. 路径或查询串带瓦片模板特征 —— 例如腾讯 /tile?z=..&x=..、天地图 WMTS
// 明确排除脚本/样式/JSON/字体：3D Tiles（.b3dm/.json）、地形（.terrain）都不该
// 进瓦片缓存，它们的体积和使用模式完全不同。
const TILE_EXTENSION = /\.(png|jpe?g|webp|avif|bmp|gif)$/i;
const NON_TILE_EXTENSION = /\.(js|mjs|css|wasm|json|html?|xml|txt|woff2?|ttf|otf|b3dm|glb|terrain)$/i;
const TILE_PATH_HINT = /(?:^|\/)(?:tiles?|wmts|tms)(?:\/|$)|GetTile/i;
const TILE_QUERY_HINT = /[?&](?:x|y|z|tilematrix|tilerow|tilecol|level|zoom)=/i;

function isTileRequest(request, requestURL) {
  if (requestURL.origin === self.location.origin) return false;
  if (NON_TILE_EXTENSION.test(requestURL.pathname)) return false;
  if (request.destination === 'image') return true;
  if (TILE_EXTENSION.test(requestURL.pathname)) return true;
  return (
    TILE_PATH_HINT.test(requestURL.pathname) ||
    TILE_QUERY_HINT.test(requestURL.search)
  );
}

// 缓存键归一化。
//
// Cesium ion 的资产地址会把 access_token 之类的短期票据拼在查询串里，同一块
// 瓦片每次会话的 URL 都不一样。原样当键的话，缓存既命中不了（离线白搭），
// 又会随票据刷新不断堆积重复副本。这里只剔除明确属于「每次请求都可能变」的
// 参数，天地图的 tk、腾讯的 key 之类稳定的业务参数保持原样。
const VOLATILE_TILE_PARAMS = ['access_token', 'accessToken', 'token', 'expires', '_'];

function tileCacheKey(requestURL) {
  const url = new URL(requestURL.href);
  url.hash = '';
  let changed = false;
  VOLATILE_TILE_PARAMS.forEach(name => {
    if (url.searchParams.has(name)) {
      url.searchParams.delete(name);
      changed = true;
    }
  });
  return changed ? url.href : requestURL.href;
}

// Cesium ion 资产接口：/v1/assets/<id>/endpoint。
//
// 这份 JSON 是影像图层的前置条件 —— Cesium 先要到它才知道瓦片地址模板。
// 离线时若它拿不到，整个影像图层都建不出来，瓦片缓存里躺着整片城市也显示
// 不出来。它只有几百字节，缓存它的收益是"离线能看见地图"与"离线全黑"的差别。
// 注意里面带的令牌会过期，所以不能像瓦片那样"缓存优先、命中就永不回源"。
//
// 但「每次都先等网络」在弱网下会让地球迟迟不出影像，离线时更是直接一片黑。
// 折中：缓存 45 分钟内直接用它（省掉一个往返，也让离线可用），同时在后台换新；
// 超过 45 分钟才网络优先 —— ion 的 endpoint 里带的是短期票据，太久不换会让
// 新区域的瓦片被拒。
const ION_ENDPOINT_PATH = /^\/v1\/assets\/[^/]+\/endpoint$/;

function isIonEndpoint(requestURL) {
  return hostMatches(requestURL.hostname, 'cesium.com') && ION_ENDPOINT_PATH.test(requestURL.pathname);
}

// 缓存 45 分钟内直接用（省一个往返、离线可用），后台顺手换新；
// 过期才网络优先，失败退回旧的那份。
const ION_ENDPOINT_TTL = 45 * 60 * 1000;
const ENDPOINT_STAMP_HEADER = 'x-locus-cached-at';

function endpointAge(response) {
  const stamp = Number(response.headers.get(ENDPOINT_STAMP_HEADER));
  return Number.isFinite(stamp) && stamp > 0 ? Date.now() - stamp : Infinity;
}

// 存的时候打上时间戳。Response 的头部是只读的，只能重建一个。
function storeEndpoint(cache, request, response) {
  const headers = new Headers(response.headers);
  headers.set(ENDPOINT_STAMP_HEADER, String(Date.now()));
  return response
    .blob()
    .then(body => cache.put(request, new Response(body, {
      status: response.status,
      statusText: response.statusText,
      headers
    })))
    .catch(() => {});
}

function serveIonEndpoint(event, request) {
  return caches.open(CESIUM_CACHE_NAME).then(cache =>
    cache.match(request).then(cached => {
      const refresh = () =>
        fetch(request, { cache: 'no-store' }).then(response => {
          if (response && response.ok) {
            event.waitUntil(storeEndpoint(cache, request, response.clone()));
          }
          return response;
        });

      if (cached && endpointAge(cached) < ION_ENDPOINT_TTL) {
        // 命中且还新：立刻返回，后台顺手换成最新的给下次用
        event.waitUntil(refresh().catch(() => {}));
        return cached;
      }

      // 过期或没缓存：等网络；失败就退回旧票据（离线时这是唯一的活路）
      return refresh().catch(() =>
        cached || new Response('', { status: 408, statusText: 'Offline' })
      );
    })
  );
}

function createOfflineResponse() {
  const html =
    '<!doctype html><html lang="zh-CN"><head><meta charset="utf-8">' +
    '<meta name="viewport" content="width=device-width,initial-scale=1">' +
    '<title>离线中 · Locus Earth</title></head>' +
    '<body style="margin:0;display:flex;min-height:100vh;align-items:center;' +
    'justify-content:center;font-family:system-ui,-apple-system,sans-serif;' +
    'background:#111;color:#eee;text-align:center">' +
    '<div><h1 style="font-weight:600">当前处于离线状态</h1>' +
    '<p style="color:#999">该页面尚未被缓存，请连接网络后重试。</p></div>' +
    '</body></html>';
  return new Response(html, {
    status: 503,
    statusText: 'Offline',
    headers: { 'Content-Type': 'text/html; charset=utf-8' }
  });
}

// 抹掉响应上的“经过重定向”标记。
//
// 静态托管常把带扩展名的地址规范化重定向到无扩展名形式，例如本地服务器：
//     /settings.html → 301 → /settings
//     /index.html    → 301 → /index
// 被跟随过重定向的响应带有 redirected 标记。而导航请求的 redirect 模式是
// "manual"，对这种请求返回一个 redirected 响应会被浏览器直接判为网络错误
// （整页 ERR_FAILED），控制台报：
//     a redirected response was used for a request whose redirect mode is not "follow"
// 因此返回缓存前必须重建一个普通响应把该标记去掉。
//
// 同时剔除 content-encoding 与 content-length：响应体已是解码后的内容，
// 保留这两个头会造成头部与实体不一致。
function cleanRedirect(response) {
  if (!response || !response.redirected) return Promise.resolve(response);

  const headers = new Headers(response.headers);
  headers.delete('content-encoding');
  headers.delete('content-length');

  const status = response.status >= 200 && response.status <= 599 ? response.status : 200;

  return response.blob().then(body =>
    new Response(body, {
      status,
      statusText: response.statusText,
      headers
    })
  );
}

// 导航的离线回退候选路径。
// 静态托管（GitHub Pages、本地静态服务器）普遍支持无扩展名访问：
// 请求 /settings 实际返回的是 settings.html，但缓存的键是 '/settings.html'，
// 直接匹配必然落空，于是离线时误报“该页面尚未被缓存”。
function navigationCandidates(pathname) {
  const candidates = [pathname];
  const trimmed = pathname.replace(/\/+$/, '');

  // 目录访问 → 目录下的 index.html
  if (pathname.endsWith('/')) {
    candidates.push(pathname + 'index.html');
  }

  // 无扩展名的末段 → 补 .html（末段为空表示访问的是根或目录，跳过）
  const lastSegment = trimmed.split('/').pop();
  if (lastSegment && !/\.[a-zA-Z0-9]+$/.test(lastSegment)) {
    candidates.push(trimmed + '.html');
  }

  return candidates;
}

// 依次尝试候选路径，全部落空返回 undefined（由调用方决定怎么兜底）。
function matchNavigationCache(request) {
  const url = new URL(request.url);
  return navigationCandidates(url.pathname).reduce(
    (chain, path) =>
      chain.then(hit => hit || caches.match(new URL(path, url.origin).href, { ignoreSearch: true })),
    Promise.resolve(undefined)
  );
}

// 写缓存统一走这里，用 event.waitUntil 保证写入不会被提前终止。
function cachePut(event, cacheName, request, response) {
  if (!response || !response.ok) return;
  event.waitUntil(
    // 存入前先清洗，避免把 redirected 响应写进缓存，
    // 之后任何读取都不必再为此付出代价。
    cleanRedirect(response.clone()).then(clean =>
      caches.open(cacheName).then(cache => cache.put(request, clean))
    )
  );
}

// 预热应用外壳。install 与「设置页清除缓存后」都会调用。
function precacheShell() {
  return caches.open(APP_CACHE_NAME).then(cache =>
    // 逐条取回而非 cache.addAll：addAll 是原子的，任何一个 URL 非 2xx
    // 都会让整个 install 失败，新 Service Worker 将永远无法激活。
    // 也不用 cache.add —— 它会把重定向后的响应原样存下（带 redirected 标记），
    // 而 cache: 'reload' 能确保拿到最新内容而不是 HTTP 缓存里的旧副本。
    Promise.allSettled(
      SHELL_URLS.map(url =>
        fetch(url, { cache: 'reload' })
          .then(response => {
            if (!response.ok) throw new Error('HTTP ' + response.status);
            return cleanRedirect(response).then(clean => cache.put(url, clean));
          })
      )
    ).then(results => {
      results.forEach((result, index) => {
        if (result.status === 'rejected') {
          console.warn('预缓存失败:', SHELL_URLS[index], result.reason);
        }
      });
    })
  );
}

// ----------------------------------------------------------------------------
// 瓦片缓存：读
// ----------------------------------------------------------------------------
// 入口。开关状态下才进缓存逻辑；关掉时整条请求原样放行 —— 不查缓存、不写缓存，
// 也不干预 HTTP 缓存（用户要的就是每次都从网络拿，这时替他省流量是违背意愿的）。
function handleTileRequest(event, request, requestURL) {
  return loadTileSwitch().then(() => {
    if (!tileCacheEnabled) {
      // 关掉开关：整条放行，并且**连 HTTP 缓存也不碰**。
      // 不这么做的话，用户明明关掉了缓存，占用还是会一点点涨（浏览器自己在
      // 存），看起来就像"开关没用"。no-store 的含义正好是"不用缓存也不用存"。
      return fetch(request, { cache: 'no-store' });
    }
    return serveTile(event, request, requestURL);
  });
}

// 缓存优先，命中就直接返回、**不再回源**。这一点和外壳资源不同：外壳需要后台
// 回源来跟进版本，而影像瓦片基本不变，回源只会白白消耗流量，还会让"离线可看"
// 变成"离线看运气"。真要更新影像，走设置页的「清除瓦片缓存」。
//
// 回源时显式带 cache: 'no-store'：否则浏览器还会在 HTTP 缓存里存一份同样的
// 图片，占用翻倍，而那份网页既查不到也删不掉 —— 用户点「清除瓦片缓存」后
// 看到占用没怎么降，多半就是它在作祟。这样瓦片只存在于我们自己的缓存里，
// 删了就真的删了。
function serveTile(event, request, requestURL) {
  const key = tileCacheKey(requestURL);

  return caches.open(TILE_CACHE_NAME).then(cache =>
    cache.match(key).then(cached => {
      // 不透明响应不能回给 cors 模式的请求，浏览器会直接判为网络错误。
      // 现在的写入路径只存 2xx 的可读响应，这里只是兜底。
      const usable = cached && !(cached.type === 'opaque' && request.mode === 'cors');
      if (usable) return cached;

      return fetch(request, { cache: 'no-store' })
        .then(response => {
          if (response && response.ok) {
            event.waitUntil(storeTile(cache, key, response.clone()));
          }
          return response;
        })
        .catch(() =>
          // 离线且没有缓存：给一个明确的失败，让 Cesium 按"瓦片加载失败"处理，
          // 而不是返回一张假图把错误藏起来。
          cached || new Response('', { status: 408, statusText: 'Offline' })
        );
    })
  );
}

let tileWritesSincePrune = 0;
let tileStoreWarned = false;

function storeTile(cache, key, response) {
  return cache
    .put(key, response)
    .then(() => {
      tileWritesSincePrune++;
      if (tileWritesSincePrune < TILE_PRUNE_INTERVAL) return undefined;
      tileWritesSincePrune = 0;
      return pruneIfNeeded(cache);
    })
    .catch(error => {
      // 配额不足（QuotaExceededError）或响应带 Vary: *。前者靠裁剪自救，
      // 后者只能放弃这一片；都只提示一次，避免刷屏。
      if (!tileStoreWarned) {
        tileStoreWarned = true;
        console.warn('瓦片写入缓存失败，已跳过（可能存储空间不足）:', error);
      }
      // 配额有可能在远没到 TILE_MAX_ENTRIES 时就被撑满（大尺寸瓦片、设备空间紧），
      // 所以这里不能等"超上限"的判断，直接砍到当前的一半再继续。
      if (error && error.name === 'QuotaExceededError') {
        return pruneTo(cache, 0.5);
      }
      return undefined;
    });
}

// 超过上限时裁到 TILE_PRUNE_RATIO。Cache.keys() 在主流实现里按插入顺序返回，
// 因此效果是先进先出（FIFO）：先被访问过的区域先被淘汰。没有做真正的 LRU ——
// 每次命中都重写一遍缓存条目，代价远高于它能省下的那点空间。
function pruneIfNeeded(cache) {
  return cache
    .keys()
    .then(keys => {
      if (keys.length <= TILE_MAX_ENTRIES) return undefined;
      const target = Math.floor(TILE_MAX_ENTRIES * TILE_PRUNE_RATIO);
      const excess = keys.slice(0, keys.length - target);
      return Promise.all(excess.map(key => cache.delete(key)));
    })
    .catch(() => undefined);
}

// 按当前条目的比例裁剪，供配额不足时兜底。
function pruneTo(cache, ratio) {
  return cache
    .keys()
    .then(keys => {
      const target = Math.max(64, Math.floor(keys.length * ratio));
      const excess = keys.slice(0, Math.max(0, keys.length - target));
      return Promise.all(excess.map(key => cache.delete(key)));
    })
    .catch(() => undefined);
}

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(precacheShell());
});

self.addEventListener('activate', event => {
  const keep = [APP_CACHE_NAME, CESIUM_CACHE_NAME, TILE_CACHE_NAME, FLAGS_CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          // 只清理本应用的缓存。caches.keys() 返回的是整个域名下的所有缓存，
          // 本项目部署在共享域名（例如 <user>.github.io）上时，
          // 不能删除同域名下其他项目的缓存。
          .filter(cacheName => cacheName.startsWith(CACHE_PREFIX) && !keep.includes(cacheName))
          .map(cacheName => caches.delete(cacheName))
      );
    }).then(() => self.clients.claim())
  );
});

// 设置页清除应用缓存后会发消息请求重新预热。
// Service Worker 已安装时不会重跑 install，若不主动重建，
// 离线能力会一直缺失到 sw.js 下次变更为止。
self.addEventListener('message', event => {
  const data = event.data || {};

  if (data.type === 'REPOPULATE_SHELL') {
    event.waitUntil(precacheShell());
    return;
  }

  // 设置页 / 主页面推过来的瓦片缓存开关。
  // 必须落盘：SW 会被系统回收，下次醒来内存是空的，只能靠这份小文件恢复。
  if (data.type === 'TILE_CACHE_SWITCH') {
    event.waitUntil(saveTileSwitch(data.enabled !== false));
  }
});

// 导航：缓存优先 + 后台更新。
//
// 旧版是网络优先，每次刷新都要先等一个网络往返才能出 HTML —— 这正是"刷新
// 网页慢"和"地铁里进不去"的主因。改成缓存优先后，重复进入是纯本地读取，
// 通常几十毫秒就出页面；后台那次回源不阻塞渲染，拿到的副本写给下次用。
//
// 代价：HTML 改动后的第一次进入仍会看到上一版，第二次起才是最新 —— 与外壳
// 资源原本的取舍一致。要立刻拿到新版，用设置页的「清除应用缓存」。
function handleNavigation(event, request) {
  return matchNavigationCache(request).then(cached => {
    // 网络响应用一个外部变量兜住：即便它不是 2xx（404、502 之类），也应当
    // 原样交给浏览器显示，而不是被误当成"离线"换成提示页。
    let networkResponse;
    const revalidate = fetch(request)
      .then(response => {
        networkResponse = response;
        if (response && response.ok) {
          return cleanRedirect(response.clone()).then(clean =>
            caches.open(APP_CACHE_NAME).then(cache => cache.put(request, clean))
          );
        }
        return undefined;
      })
      // 离线时后台更新失败属正常，静默忽略，避免未捕获的 Promise 拒绝。
      .catch(() => undefined);
    event.waitUntil(revalidate);

    if (cached) return cleanRedirect(cached);

    // 首次访问或缓存被清：这次只能等网络，拿不到就走离线提示页。
    return revalidate.then(() => {
      if (networkResponse) return networkResponse;
      return matchNavigationCache(request).then(fresh =>
        fresh ? cleanRedirect(fresh) : createOfflineResponse()
      );
    });
  });
}

self.addEventListener('fetch', event => {
  const request = event.request;

  // 只处理 GET：Cache.put 对非 GET 会拒绝并抛 TypeError。
  if (request.method !== 'GET') return;

  const requestURL = new URL(request.url);
  const sameOrigin = requestURL.origin === self.location.origin;

  // ---- 1. 导航请求：缓存优先，后台更新 ----
  if (request.mode === 'navigate') {
    event.respondWith(handleNavigation(event, request));
    return;
  }

  // ---- 2. 应用外壳资源：缓存优先 + 后台回源更新 ----
  // 命中缓存时立即返回（保留缓存优先的速度），同时在后台回源刷新缓存。
  // 后台回源这一步是必要的：install 只在 sw.js 自身内容变化时才会重跑，
  // 因此若只改动了某个 CSS / JS，仅靠 install 预热会永远拿不到新版本。
  // 代价：资源变更后的第一次加载仍会看到上一版，第二次起为最新。
  if (sameOrigin && isShellRequest(requestURL)) {
    event.respondWith(
      caches.match(request).then(cached => {
        const revalidate = fetch(request)
          .then(response => {
            if (response && response.ok) {
              // 同样先清洗再写入，避免以后每次读取都要处理 redirected 标记
              return cleanRedirect(response.clone()).then(clean =>
                caches.open(APP_CACHE_NAME).then(cache => cache.put(request, clean))
              );
            }
          })
          // 离线时后台更新失败属正常，静默忽略，避免未捕获的 Promise 拒绝。
          .catch(() => {});
        event.waitUntil(revalidate);

        if (cached) return cleanRedirect(cached);
        // 未命中（首次访问或缓存被清）：等回源结果，失败则明确报离线
        return revalidate.then(() =>
          caches.match(request).then(fresh =>
            fresh ? cleanRedirect(fresh) : new Response('', { status: 504, statusText: 'Offline' })
          )
        );
      })
    );
    return;
  }

  // ---- 3. Cesium 引擎资源：缓存优先，缓存名带版本号 ----
  if (isCesiumHost(requestURL.hostname) && ENGINE_FILE_PATTERN.test(requestURL.pathname)) {
    event.respondWith(
      caches.match(request).then(cached => {
        if (cached) return cached;
        return fetch(request)
          .then(response => {
            cachePut(event, CESIUM_CACHE_NAME, request, response);
            return response;
          })
          .catch(error => {
            console.error('Cesium 引擎资源请求失败:', error, requestURL.href);
            throw error;
          });
      })
    );
    return;
  }

  // ---- 4. Cesium ion 资产接口：网络优先，失败回退缓存 ----
  // 放在瓦片之前：它的 URL 既不带图片扩展名也不带瓦片参数，本来不会被误判，
  // 但顺序上明确一点更好读，也避免以后放宽瓦片规则时抢走它。
  if (isIonEndpoint(requestURL)) {
    event.respondWith(serveIonEndpoint(event, request));
    return;
  }

  // ---- 5. 底图瓦片：独立缓存，缓存优先（开关关闭时整条放行）----
  if (isTileRequest(request, requestURL)) {
    event.respondWith(handleTileRequest(event, request, requestURL));
    return;
  }

  // ---- 6. 其他请求：网络优先，失败时回退缓存 ----
  // 这里刻意不写入缓存：外壳清单已经覆盖首屏，瓦片另有专属缓存，
  // 无差别写入只会让应用缓存无限膨胀。
  event.respondWith(
    fetch(request).catch(() =>
      caches.match(request).then(cached =>
        cached ? cleanRedirect(cached) : new Response('', { status: 408, statusText: 'Offline' })
      )
    )
  );
});
