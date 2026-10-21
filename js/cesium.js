/**
 * Cesium 的唯一入口（本地 shim）。
 *
 * 为什么需要这个文件
 * ------------------
 * 项目原先用 <script type="importmap"> 把裸标识符 'cesium' 映射到 unpkg，
 * 各模块写 `import { ... } from 'cesium'`。在桌面 Chrome / Edge 上一切正常，
 * 但在**华为那一系内核**（HarmonyOS 自带浏览器，以及 App 内 WebView 用的同一套
 * 引擎）上会整站起不来：它并不真正解析 import map —— 虽然
 * `HTMLScriptElement.supports('importmap')` 返回 true —— 于是裸标识符直接抛
 *
 *     Uncaught TypeError: Failed to resolve module specifier "cesium".
 *     Relative references must start with either "/", "./", or "../".
 *
 * main.js 是模块图的入口，它一崩，整张图里的模块全部跟着失败，页面就永远停在
 * 「正在加载地球数据…」的遮罩上（2026-10-21 实测定位，Chromium 132 / HarmonyOS）。
 *
 * 所以改成一条纯 ESM 的 `export *` 转发：各模块都 import 本地相对路径
 * `./cesium.js`，相对路径解析是浏览器本来就必须支持的能力，不依赖 import map。
 * 引擎仍从 unpkg 取（Service Worker 的引擎缓存那条链路完全不变）。
 *
 * 升级引擎时改这里的版本号，并同步 index.html 的 modulepreload 与 sw.js 的
 * CESIUM_VERSION —— 三处必须是同一个补丁号（用 @1.118 会被 unpkg 302 到
 * 1.118.2，modulepreload 的键就对不上了）。
 */
export * from 'https://unpkg.com/cesium@1.118.2/Build/Cesium/index.js';
