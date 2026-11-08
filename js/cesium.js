// ⚠️ 不要用 importmap！鸿蒙 / Chromium 132（2026-10-21 实测）是假支持：
//    HTMLScriptElement.supports('importmap') 返回 true，但裸标识符 `from 'cesium'`
//    直接抛 Failed to resolve module specifier —— main.js 是模块图入口，一崩全崩，
//    页面停在「正在加载地球数据…」遮罩上。统一走本地相对路径转发。
//
// ⚠️ 升级引擎必须同时改三处、且用同一补丁号：这里的 URL、index.html 的 modulepreload、
//    sw.js 的 CESIUM_VERSION。写 @1.118 会被 unpkg 302 到 1.118.2，modulepreload 键对不上，白下 4 MB。
export * from 'https://unpkg.com/cesium@1.118.2/Build/Cesium/index.js';
