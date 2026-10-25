import * as Cesium from './cesium.js';
import { showToast } from './utils.js';
import { initCameraFeel } from './camera-feel.js';

export function initViewer(containerId, terrainProvider) {
    // 默认底图：Sentinel-2（Ion 资产 3954）。
    // 异步工厂 + ImageryLayer 包装：元数据就绪前 Viewer 照常创建。
    //
    // 离线时这一步可能失败（拿不到 ion 的 endpoint JSON），后果是图层空着 ——
    // 表现就是"界面都在、地球全黑"。这里显式提示一句，别让用户对着黑球猜；
    // 正常情况下 SW 会用缓存里的那份 endpoint 顶上，根本走不到 catch。
    const baseLayerProvider = Cesium.IonImageryProvider.fromAssetId(3954).catch((error) => {
        console.warn('默认底图（Sentinel-2）加载失败，可能是离线或 ion 不可达:', error);
        showToast('底图未能加载：离线时只显示已经缓存过的区域');
        throw error;
    });

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

        // ================= 抗锯齿：刻意关掉 MSAA，改用 FXAA =================
        // 背景：这一项**不写**的话，浏览器按 WebGL 规范默认 antialias=true。
        // 而 Chromium 在 GPU 不支持硬件 MSAA 的设备上可能退化成"软件 MSAA"
        // —— 按像素多次采样，填充率直接崩（Cocos Creator 当年就是被这个坑到
        // 强制关掉的）。支持硬件 MSAA 的设备则会拿到 4x MSAA，带宽和显存代价
        // 同样不低。两种结果对"连续拖动的地球"都不划算：掉帧比锯齿更显眼。
        // 所以这里显式关掉上下文自带的 MSAA，抗锯齿交给下面的 FXAA。
        contextOptions: {
            webgl: {
                antialias: false
            }
        }
    });

    // ----- 抗锯齿：FXAA（后处理） -----
    // 代价只有一次全屏廉价 pass，不额外占显存，对标记点、折线这类细边缘有效。
    // 要知道的副作用：开了它 Cesium 会走后处理纹理路径（先画离屏纹理再 blit 到屏幕），
    // 此时起作用的是 scene.msaaSamples（默认 1 = 关）而不是上下文自带的 antialias。
    // 低端机上如果觉得变卡，把这一行改成 false 即可，没有其它牵连。
    viewer.scene.postProcessStages.fxaa.enabled = true;

    // ----- 相机手感（手势映射 / 惯性 / 双击缩放 / 动态分辨率）-----
    // 全部逻辑集中在 camera-feel.js，这里只负责交接。
    // ⚠️ 别在这里再写 controller.inertia = {...}：Cesium 1.118 没有这个属性，
    //    惯性是 inertiaSpin / inertiaZoom / inertiaTranslate 三个标量。
    initCameraFeel(viewer);

    // ----- 光照控制 -----
    let isLightingEnabled = false;
    viewer.scene.globe.enableLighting = false;
    viewer.imageryLayers.enablePickFeatures = false; 
    viewer.scene.globe.showWaterEffect = true;

    return viewer;
}