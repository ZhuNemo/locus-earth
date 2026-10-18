// ============================================================================
// 瓦片缓存开关：把设置状态同步给 Service Worker
// ============================================================================
// 早先这个文件覆写过 Cesium 的 Resource._Implementations.loadWithXhr，理由是
// 「Service Worker 拦不到 XHR」。**那个前提是错的**：实测（Chromium / Android
// WebView）纯 XHR 的响应同样会进 Cache Storage —— 拦不到的只有 WebSocket 和
// EventSource。也就是说只要 sw.js 里认得出瓦片 URL，缓存本来就成立，不需要碰
// 引擎的私有 API。那层包装只会带来两件事：升级 Cesium 时要复核，以及开关必须
// 在页面侧和 SW 侧各写一遍（正是之前「关掉开关仍然在缓存」的原因）。
//
// 现在瓦片缓存完全归 sw.js 管，这里只做一件事：把开关状态推给它。
// SW 读不到 localStorage，所以必须由页面主动告知；消息到达前 SW 用默认值（开）。
// ============================================================================

// 与设置页共用同一个键（settings.js 是普通脚本，无法 import 本模块，
// 那边内联了一份等价读写 + 同样的 postMessage，改动时两边一起改）。
const STORAGE_KEY = 'tileCacheEnabled';
const SW_MESSAGE = 'TILE_CACHE_SWITCH';

export function isTileCachingEnabled() {
    try {
        return localStorage.getItem(STORAGE_KEY) !== 'false';
    } catch {
        // 隐私模式下 localStorage 可能不可用，按默认（开）处理
        return true;
    }
}

export function syncTileCacheSwitch(enabled = isTileCachingEnabled()) {
    if (!('serviceWorker' in navigator)) return;
    // 用 getRegistration() 而不是 ready：后者在尚未注册时会一直挂起
    navigator.serviceWorker
        .getRegistration()
        .then((registration) => {
            const target = navigator.serviceWorker.controller || (registration && registration.active);
            if (target) target.postMessage({ type: SW_MESSAGE, enabled });
        })
        .catch(() => {});
}

export function setTileCachingEnabled(enabled) {
    try {
        localStorage.setItem(STORAGE_KEY, enabled ? 'true' : 'false');
    } catch {}
    syncTileCacheSwitch(enabled);
}

/**
 * 在主页面启动时调用一次：
 *   · 立即把当前状态推给 SW（SW 可能刚重启，内存里还是默认值）
 *   · SW 换代（controllerchange）后再推一次，新 SW 才知道用户的选择
 *   · 设置页改开关（另一个文档写 localStorage）时跟着推
 */
export function initTileCacheSwitch() {
    syncTileCacheSwitch();

    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.addEventListener('controllerchange', () => syncTileCacheSwitch());
    }

    window.addEventListener('storage', (event) => {
        if (event.key === STORAGE_KEY) syncTileCacheSwitch();
    });
}
