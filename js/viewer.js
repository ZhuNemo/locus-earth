import * as Cesium from './cesium.js';
import { initCameraFeel } from './camera-feel.js';

// 画质档位：决定 globe 的瓦片细分精度（maximumScreenSpaceError）。
// 数值越小越清晰、瓦片数越多（流量与 GPU 开销同步上涨）。
// 省流量档 3 相比引擎默认的 2 约少一半瓦片，近距离放大后照样会细化到高清层。
export const QUALITY_KEY = 'highQuality';

export function applyRenderQuality(viewer) {
    const high = localStorage.getItem(QUALITY_KEY) === 'true';
    viewer.scene.globe.maximumScreenSpaceError = high ? 2 : 3;
    return high;
}

/**
 * @param {string} containerId
 * @param {object} options
 * @param {import('./cesium.js').TerrainProvider} options.terrainProvider
 * @param {Promise<import('./cesium.js').ImageryProvider>} options.baseLayerProvider
 *        必须由调用方给（imagery.js 的 createInitialBasemap）：底图可能是 ion 资产、
 *        也可能是天地图/腾讯，viewer 不再自己钉死某一个。
 */
export function initViewer(containerId, { terrainProvider, baseLayerProvider } = {}) {
    if (!baseLayerProvider) {
        throw new Error('initViewer 需要 baseLayerProvider（见 imagery.js 的 createInitialBasemap）');
    }

    const viewer = new Cesium.Viewer(containerId, {
        terrainProvider: terrainProvider,
        // 底图选择 UI 已由 basemap-picker.js 接管（右侧偏上的自定义控件），
        // 图源清单与切换逻辑在 imagery.js
        baseLayerPicker: false,
        baseLayer: Cesium.ImageryLayer.fromProviderAsync(baseLayerProvider),

        animation: false,
        timeline: false,
        geocoder: false,
        homeButton: false,
        navigationHelpButton: false,
        fullscreenButton: false,
        infoBox: false,
        sceneModePicker: false,
        sceneMode: Cesium.SceneMode.SCENE3D,
        locale: 'zh-CN',

        // ================= 抗锯齿：关 MSAA，改用 FXAA =================
        // 不写这项时 WebGL 默认 antialias=true。Chromium 在无硬件 MSAA 的设备上可能退化成
        // 软件 MSAA（每像素多次采样，填充率崩），支持硬件的则拿 4x MSAA，带宽与显存都不低。
        // 对连续拖动的地球来说掉帧比锯齿更显眼，所以显式关掉，交给下面的 FXAA。
        contextOptions: {
            webgl: {
                antialias: false
            }
        }
    });

    // FXAA：一次全屏廉价 pass，不额外占显存。
    // ⚠️ 开了它 Cesium 走后处理纹理路径，此时起作用的是 scene.msaaSamples（默认 1=关），
    //    不再是上下文自带的 antialias。低端机卡就把这一行改 false，无其它牵连。
    viewer.scene.postProcessStages.fxaa.enabled = true;

    // ----- 禁用「双击追踪实体」 -----
    // ⚠️ Viewer 构造时内部注册 LEFT_DOUBLE_CLICK：实体有 position 就设 trackedEntity，
    //    相机进入绕该实体旋转的追踪模式，很难退出。
    //    必须摘掉而不是让 camera-feel 覆盖：ScreenSpaceEventHandler 每实例一份，
    //    两个 handler 会同时响应同一次双击。双击缩放仍由 camera-feel 独占。
    viewer.screenSpaceEventHandler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK);

    // ----- 相机手感（手势 / 惯性 / 双击缩放 / 动态分辨率），逻辑全在 camera-feel.js -----
    // ⚠️ 别在这里写 controller.inertia = {...}：Cesium 1.118 没有该属性，
    //    惯性是 inertiaSpin / inertiaZoom / inertiaTranslate 三个标量。
    initCameraFeel(viewer);

    // ----- 光照控制 -----
    let isLightingEnabled = false;
    viewer.scene.globe.enableLighting = false;
    viewer.imageryLayers.enablePickFeatures = false; 
    // 地形不含水面遮罩（见 terrain.js），水高光没有依据，关掉
    viewer.scene.globe.showWaterEffect = false;

    applyRenderQuality(viewer);

    return viewer;
}