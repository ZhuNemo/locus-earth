import * as Cesium from 'cesium';

// ============================================================================
// 底图瓦片缓存：把瓦片请求从 XHR 改道到 fetch
// ============================================================================
// 为什么需要这一步
// ---------------
// Service Worker 只能拦截 fetch 和 <img> 这一类「资源获取」，**拦不到
// XMLHttpRequest**。而 Cesium 1.118 取影像瓦片走的正是 XHR：
//
//   ImageryProvider.loadImage(url)
//     → Resource.fetchImage({ preferImageBitmap: true })
//       → Resource._Implementations.createImage(...)
//         → Resource._Implementations.loadWithXhr(url, 'blob', 'GET', ...)
//
// 也就是说，只在 sw.js 里写瓦片缓存是彻底的死代码 —— 请求根本不会进 SW。
//
// 做法
// ----
// 替换 Resource._Implementations.loadWithXhr：只把两类请求改成 fetch ——
//   1. 影像瓦片（responseType 为 blob）
//   2. ion 资产接口 /v1/assets/<id>/endpoint（responseType 为 json）
// 其余（地形 arraybuffer、3D Tiles、其他 JSON 等）原样交给 Cesium 自己的实现。
// 改道之后请求才进得了 sw.js，缓存与离线才成立。
//
// 为什么不干脆换成 <img> 加载（loadImage 里 preferImageBitmap: false）
// -----------------------------------------------------------------
// 那样确实也能被 SW 拦到，但拿到的是 HTMLImageElement 而不是 ImageBitmap，
// 纹理上传的 flipY 语义随之改变，整张影像有上下翻转的风险。这里保留
// ImageBitmap 路径：字节流照样经过 SW，解码方式一点没变。
// ============================================================================

// 与设置页共用同一个存储键（settings.js 是普通脚本，无法 import 本模块，
// 那边内联了一份等价读写，两处必须保持一致）。
const STORAGE_KEY = 'tileCacheEnabled';

export function isTileCachingEnabled() {
    try {
        return localStorage.getItem(STORAGE_KEY) !== 'false';
    } catch {
        // 隐私模式下 localStorage 可能不可用，按默认（开）处理
        return true;
    }
}

export function setTileCachingEnabled(enabled) {
    try {
        localStorage.setItem(STORAGE_KEY, enabled ? 'true' : 'false');
    } catch {}
}

// ---- 瓦片 URL 特征：与 sw.js 里的 isTileRequest 保持同一套判断 ----
const TILE_EXTENSION = /\.(png|jpe?g|webp|avif|bmp|gif)$/i;
const NON_TILE_EXTENSION = /\.(js|mjs|css|wasm|json|html?|xml|txt|b3dm|glb|terrain)$/i;
const TILE_PATH_HINT = /(?:^|\/)(?:tiles?|wmts|tms)(?:\/|$)|GetTile/i;
const TILE_QUERY_HINT = /[?&](?:x|y|z|tilematrix|tilerow|tilecol|level|zoom)=/i;

function looksLikeTileUrl(url) {
    let parsed;
    try {
        parsed = new URL(url, self.location.href);
    } catch {
        return false;
    }

    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return false;
    // 同源图片（本站图标等）走外壳缓存，不进瓦片缓存
    if (parsed.origin === self.location.origin) return false;
    if (NON_TILE_EXTENSION.test(parsed.pathname)) return false;

    if (TILE_EXTENSION.test(parsed.pathname)) return true;
    return TILE_PATH_HINT.test(parsed.pathname) || TILE_QUERY_HINT.test(parsed.search);
}

// 只有「看起来是瓦片 / 是 ion 资产接口 + 开关打开」才改道；
// 其余一律落到 Cesium 原来的实现，行为与未安装本模块时完全一致。
//
// 第二条规则（ion endpoint）是离线能不能看见地图的关键：Cesium 要先取到
// https://api.cesium.com/v1/assets/<id>/endpoint 这份 JSON，才知道瓦片的
// 地址模板。离线时这一步失败，影像图层根本建不出来 —— 瓦片缓存里躺着
// 一整片城市的图也显示不出来。把它也改道到 fetch，Service Worker 才有机会
// 在断网时用缓存里的那份 JSON 顶上。
function routeKind(url, responseType, method, data) {
    if (data) return null;
    if ((method || 'GET').toUpperCase() !== 'GET') return null;
    if (!isTileCachingEnabled()) return null;

    if (responseType === 'blob' && looksLikeTileUrl(url)) return 'blob';
    if (responseType === 'json' && looksLikeIonEndpoint(url)) return 'json';
    return null;
}

const ION_ENDPOINT_PATH = /^\/v1\/assets\/[^/]+\/endpoint$/;

function looksLikeIonEndpoint(url) {
    let parsed;
    try {
        parsed = new URL(url, self.location.href);
    } catch {
        return false;
    }
    return (
        (parsed.hostname === 'cesium.com' || parsed.hostname.endsWith('.cesium.com')) &&
        ION_ENDPOINT_PATH.test(parsed.pathname)
    );
}

let installed = false;

/**
 * 安装改道钩子。必须在使用 viewer 之前调用一次（main.js 顶部）。
 * @returns {boolean} 是否安装成功；失败时应用照常运行，只是没有瓦片缓存。
 */
export function installTileInterceptor() {
    if (installed) return true;

    // 这是 Cesium 的私有实现表，不属于公开 API，升级引擎时可能改名或消失。
    // 因此每一步都做存在性检查，拿不到就安静降级，绝不让缓存功能拖垮页面。
    const implementations = Cesium.Resource && Cesium.Resource._Implementations;
    if (!implementations || typeof implementations.loadWithXhr !== 'function') {
        console.warn('瓦片缓存：当前 Cesium 版本未暴露 _Implementations.loadWithXhr，已跳过改道');
        return false;
    }
    if (implementations.__locusTileFetch) {
        installed = true;
        return true;
    }

    const originalLoadWithXhr = implementations.loadWithXhr;

    implementations.loadWithXhr = function (
        url,
        responseType,
        method,
        data,
        headers,
        deferred,
        overrideMimeType
    ) {
        const kind = routeKind(url, responseType, method, data);
        if (!kind) {
            return originalLoadWithXhr.apply(this, arguments);
        }

        const controller = new AbortController();

        fetch(url, {
            method: 'GET',
            headers: headers || undefined,
            // 与 Cesium 的 XHR 对齐：默认不带凭据（它只在信任域名上开 withCredentials）
            credentials: 'same-origin',
            mode: 'cors',
            signal: controller.signal
        })
            .then((response) => {
                if (!response.ok) {
                    throw new Error(`请求失败：HTTP ${response.status}`);
                }
                // 返回值类型必须与 Cesium 期望的 responseType 一致，
                // 否则拿到的对象和它内部的处理分支对不上
                return kind === 'json' ? response.json() : response.blob();
            })
            .then((result) => {
                if (kind === 'blob' && (!result || result.size === 0)) {
                    throw new Error('瓦片响应为空');
                }
                deferred.resolve(result);
            })
            .catch((error) => {
                // 离线或 AbortController 取消都会到这里，交给 Cesium 按失败处理
                try {
                    deferred.reject(error);
                } catch {}
            });

        // Cesium 在瓦片滚出视野时会调用 cancelFunction（即这里的 abort）
        return {
            abort() {
                try {
                    controller.abort();
                } catch {}
            }
        };
    };

    implementations.__locusTileFetch = true;
    installed = true;
    return true;
}
