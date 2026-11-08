// ============================================================================
// 瓦片缓存开关：把设置状态同步给 Service Worker
// ============================================================================
// 瓦片缓存完全由 sw.js 管，这里只把开关状态推过去（SW 读不到 localStorage）。
//
// ⚠️ 早先这里覆写过 Resource._Implementations.loadWithXhr，理由是「SW 拦不到 XHR」——
//    那个前提是错的：实测 Chromium / Android WebView 里纯 XHR 的响应同样进 Cache Storage，
//    拦不到的只有 WebSocket 与 EventSource。那层包装只增加升级引擎的复核成本，
//    还逼得开关在页面与 SW 各写一遍（正是「关掉开关仍在缓存」的根源）。
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
