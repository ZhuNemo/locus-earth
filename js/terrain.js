import { CesiumTerrainProvider, EllipsoidTerrainProvider } from './cesium.js';

// ============================================================================
// 地形：ion 世界地形（资产 1）的创建、切换与复用
// ----------------------------------------------------------------------------
// 1. requestVertexNormals / requestWaterMask 一律关。这两项会让每块 quantized-mesh
//    额外带法线扩展与一张水面遮罩图，单块体积明显变大；而全仓用到地形法线的只有
//    「光照」开关 —— 代价是开光照后山体阴影偏平（椭球法线），水面不出高光。
//    换来的是地形流量显著下降（ion 计费按流式数据量），默认就这么开着。
// 2. provider 只建一次并缓存。换 provider 会让引擎丢掉已缓存的瓦片、整屏重新请求，
//    所以来回切地形开关时复用同一个实例，而不是每次重建。
// 3. ⚠️ 别在这里加「高保真」运行时切换：同一份地形用不同扩展请求，等于把已下载的
//    瓦片全部作废。要改就走这里改常量，让用户下次进入页面时生效。
// ============================================================================

const TERRAIN_KEY = 'terrainEnabled';

let viewerRef = null;
let ionTerrain = null;
let pending = null;

export function isTerrainEnabled() {
    try {
        return localStorage.getItem(TERRAIN_KEY) !== 'false';
    } catch {
        return true;
    }
}

function createIonTerrain() {
    if (!pending) {
        pending = CesiumTerrainProvider.fromIonAssetId(1, {
            requestVertexNormals: false,
            requestWaterMask: false,
        })
            .then((provider) => {
                ionTerrain = provider;
                return provider;
            })
            .catch((error) => {
                // 失败后清掉 pending，下次切开关还能重试
                pending = null;
                throw error;
            });
    }
    return pending;
}

/**
 * 应用地形开关（设置页 / 其他标签页触发）。
 * @param {boolean} enabled
 * @returns {Promise<void>}
 */
export function applyTerrainSetting(enabled) {
    if (!viewerRef) return Promise.resolve();

    if (!enabled) {
        viewerRef.terrainProvider = new EllipsoidTerrainProvider();
        return Promise.resolve();
    }

    return createIonTerrain()
        .then((provider) => {
            // 网络慢时用户可能已经又把开关关了
            if (isTerrainEnabled()) viewerRef.terrainProvider = provider;
        })
        .catch((error) => console.warn('地形加载失败，保持平滑球体', error));
}

/** 启动时调用一次：按已保存的开关决定是否装 ion 地形（异步，不阻塞首屏）。 */
export function initTerrain(viewer) {
    viewerRef = viewer;
    return applyTerrainSetting(isTerrainEnabled());
}
