# Locus Earth 开发笔记

<div align="left">
🌐 语言 / Language:
<a>简体中文</a> | <a href="dev-notes-en.md">English</a>
</div>

> 给要改这个仓库的人看的。README 只回答「怎么用」；这里记的是实现取舍、踩过的坑，以及线上出问题时怎么查。
>
> 想直接跑起来：仓库没有 `package.json`、没有构建步骤，用任意静态服务器打开根目录即可。

- 声明：本文含 AI 生成内容

## 目录

- 引擎与模块解析
- 缓存与离线
- 渲染与性能
- 内核兼容
- 仓库约定
- 线上问题怎么查
- 看着像 bug，但不是

---

## 引擎与模块解析

所有模块统一这样引引擎：

```js
import { Viewer, Cartesian3 } from './cesium.js';
```

`js/cesium.js` 只有一行：

```js
export * from 'https://unpkg.com/cesium@1.118.2/Build/Cesium/index.js';
```

**为什么不用 import maps。** 早期版本用 `<script type="importmap">` 把裸标识符 `cesium` 映射到 unpkg，
各模块写 `from 'cesium'`。桌面 Chrome / Edge 上一切正常，但在**华为那一系内核**上整站起不来：
它并不真正解析 import map，可 `HTMLScriptElement.supports('importmap')` 照样返回 `true`（假支持）。
于是 `import ... from 'cesium'` 抛 `Failed to resolve module specifier`，`main.js` 作为模块图入口一崩，
整张图里的模块全部连带失败，页面永远停在「正在加载地球数据…」的遮罩上。
2026-10-21 在 Chromium 132 / HarmonyOS（自带浏览器与 App 内 WebView 同一套引擎）上实测定位。

相对路径解析是任何 ESM 引擎都必须支持的能力，所以改成上面那一行 `export *` 转发，既不依赖 import map，
也仍然只有一个地方写引擎地址。

**新代码不要写裸标识符 `'cesium'`。** `index.html` / `settings.html` 里那段 importmap 还留着，
但只有唯一用途：发版后的过渡期里，Cache Storage 可能还是上一版模块（它们写着裸标识符），留着不至于又断一次。

护栏（本机自检，`tests/` 在 .gitignore 里、不进仓库）：`node tests/no-bare-imports.test.mjs`。
它扫 `js/` 和根目录两个页面，会先剥掉 JS / HTML 注释再匹配，所以说明文字里的示例不会被误抓；
`js/settings.js` 里那句 `await import('cesium')` 是「兼容性诊断」故意写的探测，在脚本的白名单里 ——
新增白名单必须写清理由。脚本自带自测，护栏本身失效会先报错而不是假通过。

**升级引擎要同时改三处**（必须是同一个补丁号）：
`js/cesium.js` 的 URL、`index.html` 的 `modulepreload`、`sw.js` 的 `CESIUM_VERSION`。
写 `@1.118` 会被 unpkg 302 到 `1.118.2`，modulepreload 的键就对不上了，等于白下 4 MB。

---

## 缓存与离线

全部由 [`sw.js`](../sw.js) 管，分五层：

| 层 | 缓存名 | 策略 |
|---|---|---|
| 应用外壳（HTML / CSS / JS / 图标） | `locus-earth-app-cache-<版本>` | 缓存优先 + 后台更新，重复进入几十毫秒出页面 |
| Cesium 引擎 | `locus-earth-cesium-<引擎版本>` | 缓存优先，升级引擎时整代淘汰 |
| ion 资产接口（`/v1/assets/<id>/endpoint`） | 与引擎同一个缓存 | 45 分钟内缓存优先 + 后台换新，过期才网络优先、失败退回旧的那份 |
| 底图瓦片 | `locus-earth-tiles-v1` | 缓存优先且命中后**不再回源**，浏览过的区域断网也能看；超 2400 片按先进先出裁剪 |
| 开关状态 | `locus-earth-flags-v1` | 几十字节，只存「缓存地图瓦片」的开 / 关 |

几个容易踩的点：

1. **ion endpoint 是离线能力的必要条件。** 拿不到它，Cesium 建不出影像图层——瓦片缓存里躺着图也是全黑的。
   所以它在网络失败时必须回退到旧的那份（带 `x-locus-cached-at` 时间戳判断是否过期）。
2. **Service Worker 拦得到 XHR。**「SW 拦不到 XHR」是常见误传——拦不到的是 WebSocket 和 EventSource。
   Chromium / Android WebView 里，纯 XHR 的响应同样会进 Cache Storage，所以 Cesium 用 XHR 取瓦片
   完全不影响缓存。早期版本曾据此去覆写 `Resource._Implementations.loadWithXhr`，实测后已删除：
   那层包装只会增加升级引擎时的风险，还逼得开关在页面和 SW 各写一遍——正是「关掉开关仍然在缓存」的根源。
3. **瓦片回源显式带 `cache: 'no-store'`。** 否则同一张图在浏览器 HTTP 缓存里再存一份，而那份网页
   既查不到也删不掉——用户点「清除瓦片缓存」后觉得"占用没降"，多半就是它在作祟。
4. **开关由 SW 执行，不由页面执行。** SW 读不到 localStorage，所以页面用 `postMessage` 把状态推过去，
   SW 落盘到 `locus-earth-flags-v1`（SW 会被回收重启，必须持久化）。关掉之后瓦片请求整条放行，
   不读缓存、不写缓存、也不碰 HTTP 缓存。
5. **导航是缓存优先 + 后台更新**（SWR）。换来的代价是：改完 HTML，用户第一次进入仍是旧版，第二次才更新。
   要立刻看到新版，走设置页「清除应用缓存」。

---

## 渲染与性能

3D 场景关闭了 WebGL 自带的 MSAA，改用 FXAA 后处理抗锯齿。

MSAA 在移动端代价偏高：GPU 不支持硬件 MSAA 的设备上，Chromium 可能退化成软件 MSAA（每像素多次采样，
填充率明显下降），支持的设备也要额外付出带宽和显存；而 FXAA 只是一次全屏 pass，不额外占用显存。

两个开关都在 `js/viewer.js`（`contextOptions.webgl.antialias` 与 `scene.postProcessStages.fxaa.enabled`）。
低端机上如果觉得卡，把 FXAA 那行改成 `false` 即可，没有其它影响；**不要改回默认的 MSAA**。

冷启动的大头是 Cesium 那个约 4 MB 的 ESM 包（下载 + 解析），网页层能做的只有：
把版本钉到补丁号（省一次 302）、`modulepreload` 提前拉、以及让导航和 endpoint 走缓存。

### 线上 LCP / INP 的两个坑（2026-10-30 按 Cloudflare Web Analytics 报告修）

**外链样式表会把首屏一起拖住。** `widgets.css` 原来是条普通的 `<link rel="stylesheet">`
（unpkg，跨域）。渲染阻塞样式表只要回包慢一点，浏览器就一帧都不画 —— 连加载遮罩的黑底和 logo
都出不来，于是 LCP 元素变成了遮罩里的 logo：P75 2054ms、P99 6217ms，「元素渲染延迟」占 32%。
对照组很干净：settings.html 不引这张表，LCP 100% 落在良好。
现在改成 `rel="preload" as="style"` + `onload` 再挂成 stylesheet，并留了
`window.__cesiumCssReady` 让 `js/main.js` 建 Viewer 之前先等它（3s 兜底；控件没样式会散架，
样式晚到还会带出一波 CLS）。**不要改回阻塞式 `<link rel="stylesheet">`**，也不要「顺手」给它
加 `crossorigin` —— 请求模式跟 preload 对不上，会下两遍。

**整页换主题不能塞进交互帧里。** 设置页的底是 `background-attachment: fixed` 的渐变，
外加一层层 backdrop-filter 玻璃面板，`data-theme` 一改就要整页重算样式再重绘，手机上这一帧的
呈现延迟能到 90ms 以上（报告里 `#colorMode` 的 INP 264ms，事件处理本身只有 6ms）。
`js/settings.js` 现在统一走 `applyThemeDeferred()`：先画便宜的反馈（菜单收起、触发按钮文字更新），
把 `applyTheme` 推到 `rAF` 之后的 `setTimeout` 里，差一帧用户看不出来。
注意 `saveSettings()` 会**同步**派发 StorageEvent，本页的 storage 监听器就在同一个调用栈里跑，
那里也必须走延迟通道，否则等于没改。

TTFB 那 1057ms（占 LCP 46%）不在仓库能改的范围内：pages.dev 的 HTML 不走 CDN 长时间缓存，
境外/跨境访问的第一跳就是这个量级。重复访问由 SW 的缓存优先兜掉了（TTFB ≈ 0），
首访只能靠把阻塞资源清干净来减少「TTFB 之后」的那一段。

---

## 内核兼容

- **需要 WebGL 2**：Cesium 1.102 起就只支持 WebGL 2。拿不到 WebGL 2 上下文的设备，地球渲染不出来，
  且没有降级方案（除非把引擎降到 1.101，那要改不少东西）。
- **华为那一系内核**要注意两点：import maps 是假支持（见上）；`MAX_TEXTURE_SIZE` 可能只有 4096，
  超大分辨率屏上要注意纹理尺寸。
- **Android 壳里的 WebView 与同机浏览器是两个内核实例**：同一台手机上 Chrome / Edge 能跑，不代表
  App 里的 WebView 能跑。判断问题在哪边，必须分别在两边测。

---

## 仓库约定

- **零构建**：没有 `package.json`、没有 Vite / Webpack / Rollup，浏览器直接跑源码 ESM。
  不存在「设置 build.target」这回事；也不要为了转译去引入打包器。
- **改 `sw.js` 必须同时把 `CACHE_VERSION` 加一**，否则新 SW 不会重跑 `install`，`SHELL_URLS` 里的
  新文件就进不了缓存。**挑版本号前先看远端**（本地与远端撞过号）。
- **改首屏引用的文件时，同步更新 `SHELL_URLS`**，漏一个就会在离线时断在第一个请求上。
- 首页与设置页引用的第三方 URL 保持一致（`widgets.css`、`modulepreload`、importmap）。
- `androidapk/` 的出包走 GitHub Actions（`.github/workflows/android.yml`），不在开发机上配 Android 环境。

---

## 线上问题怎么查

**1. 设置页的「兼容性诊断」**（App 内唯一能跑脚本的地方）

设置 → 拉到最下方 → 开始检测。它会按主页面启动顺序逐级测：
WebGL 2 → ES Module → Cesium 入口 → Viewer 初始化，哪一步先红就是哪一步。
壳里没有地址栏、调试器也连不上，这是最快的现场取数方式。

**2. 局域网镜像页**（手机浏览器 / WebView 都能用）

把 `index.html` 原文另存一份，在 `<body>` 后插一个普通脚本，做四件事：

- 打印 UA、`isSecureContext`、SW 与 `caches` 支持情况
- 监听 `error`（capture）与 `unhandledrejection`
- 定时快照 `#loadingOverlay` 的 `opacity/display` 和 `#cesiumContainer canvas` 是否存在
- 逐个 `import()` 探测：引擎入口 + 每个本地模块，报 OK / 失败原因

面板的 `z-index` 要压过加载遮罩（`9999`），然后用 `python -m http.server` 起个服务，
手机打开 `http://<电脑IP>:<端口>/你的文件.html` 即可。

用局域网 http 还有个附带好处：**http 不是安全上下文，SW 装不上**，所以它天然是
「同一份代码、没有 SW」的对照组，可以把「JS / 引擎问题」和「SW / 缓存问题」分开。

**3. Android 壳的调试限制**

release 包默认不开放 WebView 调试（`WebView.setWebContentsDebuggingEnabled` 只在 `BuildConfig.DEBUG`
里调用），所以 `edge://inspect` 看不到页面。真要上调试器，得给出包流程加一个 Gradle 属性开关，
或改用 debug 包（签名不同，装之前要卸载，会丢缓存）。

---

## 看着像 bug，但不是

- **「清除瓦片缓存」后系统显示的占用没降**：`navigator.storage.estimate()` 是懒统计，
  删完不会立刻下降，甚至可能先涨。判断是否真清空，看 `caches` 里的条目数，别看数字。
- **改完 HTML 第一次进入仍是旧版**：导航是缓存优先 + 后台更新，第二次才更新，属预期。
- **离线只有影像能看**：缓存的是已浏览区域的影像瓦片，地形、3D 建筑、搜索仍然需要联网。
- **中文界面里个别按钮显示英文**：多半是第三方控件（Cesium 自带部件）没接 i18n，不是漏翻。
