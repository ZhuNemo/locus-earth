// ============================================================================
// Locus Earth Service Worker
// ============================================================================
// 缓存策略
//   · 导航请求        → 网络优先；失败时回退缓存（忽略查询串），
//                       仍未命中则返回可读的离线提示页，而不是空响应
//   · 应用外壳资源    → 缓存优先，未命中时回源并写入
//   · Cesium 引擎资源 → 缓存优先，写入带版本号的独立缓存（随版本自动淘汰）
//   · 其他请求        → 网络优先，失败时回退缓存
//
// 维护提示
//   · 改动 index.html / settings.html 引用的资源时，必须同步更新 SHELL_URLS
//   · 升级 Cesium 时，必须同时更新 index.html 的 importmap 与 CESIUM_VERSION
// ============================================================================

const CACHE_VERSION = 'v11';
const APP_CACHE_NAME = `locus-earth-app-cache-${CACHE_VERSION}`;

// Cesium 引擎缓存：把版本号写进缓存名，升级后旧缓存会在 activate 时被淘汰，
// 不再像过去那样在同一个缓存里无限累积。
// 该值需与 index.html 的 importmap 保持一致。
const CESIUM_VERSION = '1.118';
const CESIUM_CACHE_NAME = `locus-earth-cesium-${CESIUM_VERSION}`;

// 本应用所有缓存名的前缀。activate 只清理这个前缀，避免影响同一域名下
// 其他项目的缓存（例如共享的 <user>.github.io）。
const CACHE_PREFIX = 'locus-earth-';

// 首屏完整资源清单。
// 这是 index.html 与 settings.html 首屏真正会请求到的全部文件：
// 15 个 CSS、17 个 JS、3 个图标、3 个 favicon、2 个 PWA 图标与 manifest。
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

// 只缓存引擎脚本类资源，避免把瓦片图片等大体积二进制塞进缓存。
// 相比旧版补上了 css —— 原先漏掉了 unpkg 上的 widgets.css。
const ENGINE_FILE_PATTERN = /\.(js|css|wasm|data|json)$/;

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

// 依次尝试候选路径，全部落空才返回离线提示页。
function matchCachedNavigation(request) {
  const url = new URL(request.url);
  return navigationCandidates(url.pathname)
    .reduce(
      (chain, path) =>
        chain.then(hit => hit || caches.match(url.origin + path, { ignoreSearch: true })),
      Promise.resolve(undefined)
    )
    // 命中后必须清洗：导航请求的 redirect 模式是 manual，
    // 直接返回带 redirected 标记的缓存响应会整页失败。
    .then(hit => (hit ? cleanRedirect(hit) : createOfflineResponse()));
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

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(precacheShell());
});

self.addEventListener('activate', event => {
  const keep = [APP_CACHE_NAME, CESIUM_CACHE_NAME];
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
  if (event.data && event.data.type === 'REPOPULATE_SHELL') {
    event.waitUntil(precacheShell());
  }
});

self.addEventListener('fetch', event => {
  const request = event.request;

  // 只处理 GET：Cache.put 对非 GET 会拒绝并抛 TypeError。
  if (request.method !== 'GET') return;

  const requestURL = new URL(request.url);
  const sameOrigin = requestURL.origin === self.location.origin;

  // ---- 1. 导航请求：网络优先，失败时回退缓存 ----
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => matchCachedNavigation(request))
    );
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

  // ---- 4. 其他请求：网络优先，失败时回退缓存 ----
  // 这里刻意不写入缓存：外壳清单已经覆盖首屏，
  // 无差别写入只会让应用缓存无限膨胀。
  event.respondWith(
    fetch(request).catch(() =>
      caches.match(request).then(cached =>
        cached ? cleanRedirect(cached) : new Response('', { status: 408, statusText: 'Offline' })
      )
    )
  );
});
