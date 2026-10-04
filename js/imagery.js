import * as Cesium from 'cesium';
import { showToast } from './utils.js';
import { CONFIG } from './config.js';

// ============================================================================
// 底图管理：底图清单、切换、天地图路网叠加层自动控制
// 选择 UI 由 basemap-picker.js 渲染，本模块只负责数据与切换逻辑。
// ============================================================================

// Cesium 官方图源预览图标（与引擎同版本，避免跨版本失效）
const CESIUM_WIDGET_IMAGES = 'https://unpkg.com/cesium@1.118.2/Build/Cesium/Widgets/Images/ImageryProviders';

// ---------- 模块状态 ----------
let viewerInstance = null;
let currentBaseLayer = null;      // 当前底图图层引用（切换 / 清空时要用）
let currentBasemapId = 'sentinel-2';
let overlayLayer = null;          // 天地图地名路网叠加层
let previousIsTDT = false;
let tencentProvider = null;
let tiandituProvider = null;
let tiandituLabelProvider = null;

// ---------- 底图清单（basemap-picker.js 据此渲染菜单） ----------
// icon 使用 2x 源图，CSS 里缩到 56px，高分屏依然锐利
export const BASEMAPS = [
    {
        id: 'sentinel-2',
        name: 'Sentinel-2',
        icon: `${CESIUM_WIDGET_IMAGES}/sentinel-2.png`,
        tooltip: 'Sentinel-2（欧洲空间局提供的卫星影像）',
        create: () => Cesium.IonImageryProvider.fromAssetId(3954),
    },
    {
        id: 'blue-marble',
        name: 'Blue Marble',
        icon: `${CESIUM_WIDGET_IMAGES}/blueMarble.png`,
        tooltip: 'Blue Marble（NASA提供的卫星影像）',
        create: () => Cesium.IonImageryProvider.fromAssetId(3845),
    },
    {
        id: 'earth-at-night',
        name: 'Earth at Night',
        icon: `${CESIUM_WIDGET_IMAGES}/earthAtNight.png`,
        tooltip: 'Earth at Night（NASA提供的夜间影像）',
        create: () => Cesium.IonImageryProvider.fromAssetId(3812),
    },
    {
        id: 'tencent',
        name: '腾讯地图',
        icon: './icons/tencent.png',
        tooltip: '腾讯电子地图',
        warning: '腾讯地图使用火星坐标系，存在偏移，建议浏览时隐藏标记、关闭设置路网及叠加层以避免出现错位',
        create: () => tencentProvider,
    },
    {
        id: 'tianditu',
        name: '天地图卫星',
        icon: './icons/tianditu.png',
        tooltip: '天地图卫星影像',
        create: () => tiandituProvider,
    },
];

export function getBasemaps() {
    return BASEMAPS;
}

export function getCurrentBasemapId() {
    return currentBasemapId;
}

// ---------- 图源懒构建（依赖 CONFIG 密钥，首次切换时才创建） ----------
function ensureProviders() {
    if (tencentProvider) return;

    tencentProvider = new Cesium.UrlTemplateImageryProvider({
        url: 'https://rt{s}.map.gtimg.com/tile?z={z}&x={x}&y={reverseY}&type=vector&styleid=1&key=' + CONFIG.qqKey,
        subdomains: ['0', '1', '2', '3'],
        minimumLevel: 3,
        maximumLevel: 18,
    });

    tiandituProvider = new Cesium.UrlTemplateImageryProvider({
        url: 'https://t{s}.tianditu.gov.cn/img_w/wmts?service=wmts&request=GetTile&version=1.0.0&LAYER=img&tileMatrixSet=w&TileMatrix={z}&TileRow={y}&TileCol={x}&style=default&format=tiles&tk=' + CONFIG.tiandituKey,
        subdomains: ['0', '1', '2', '3', '4', '5', '6', '7'],
        maximumLevel: 18,
    });

    // 天地图地名路网叠加层
    tiandituLabelProvider = new Cesium.UrlTemplateImageryProvider({
        url: 'https://t{s}.tianditu.gov.cn/cia_w/wmts?service=wmts&request=GetTile&version=1.0.0&LAYER=cia&tileMatrixSet=w&TileMatrix={z}&TileRow={y}&TileCol={x}&style=default&format=tiles&tk=' + CONFIG.tiandituKey,
        subdomains: ['0', '1', '2', '3', '4', '5', '6', '7'],
        maximumLevel: 18,
    });
}

// ---------- 天地图路网叠加层自动控制 ----------
// 进入天地图自动开叠加层，离开自动关（设置页开关可覆盖，
// localStorage 'overlayEnabled' 为最终事实，跨标签页通过 storage 事件同步）
function updateOverlay() {
    if (!viewerInstance) return;

    const isTDT = currentBasemapId === 'tianditu';

    if (isTDT && !previousIsTDT) {
        localStorage.setItem('overlayEnabled', 'true');
        showToast('路网及叠加层已开启，可在设置页关闭');
    } else if (!isTDT && previousIsTDT) {
        localStorage.setItem('overlayEnabled', 'false');
        showToast('路网及叠加层已关闭，可在设置页开启');
    }
    previousIsTDT = isTDT;

    const overlayEnabled = localStorage.getItem('overlayEnabled') === 'true';
    if (overlayEnabled) {
        if (!overlayLayer) {
            overlayLayer = viewerInstance.imageryLayers.addImageryProvider(tiandituLabelProvider, 0);
            viewerInstance.imageryLayers.raiseToTop(overlayLayer);
        }
    } else if (overlayLayer) {
        viewerInstance.imageryLayers.remove(overlayLayer, true);
        overlayLayer = null;
    }
}

// ---------- 初始化 ----------
export function initImagery(viewer) {
    viewerInstance = viewer;
    ensureProviders();

    // viewer.js 以 Sentinel-2（Ion 3954）作为 baseLayer 创建，
    // 这里把引用接过来，供后续切换时移除
    currentBaseLayer = viewer.imageryLayers.get(0) || null;
    currentBasemapId = 'sentinel-2';
    previousIsTDT = false;

    // 任何原因导致图层离开集合时（例如谷歌模式里的 imageryLayers.removeAll()），
    // 必须把引用置空。否则 updateOverlay() 会以为叠加层仍然存在，
    // 既不重新添加也不清理，路网叠加层就此永久失效；底图引用同理。
    viewer.imageryLayers.layerRemoved.addEventListener(() => {
        if (overlayLayer && !viewer.imageryLayers.contains(overlayLayer)) {
            overlayLayer = null;
        }
        if (currentBaseLayer && !viewer.imageryLayers.contains(currentBaseLayer)) {
            currentBaseLayer = null;
        }
    });

    // 设置页开关 / 其他标签页同步
    window.addEventListener('storage', (e) => {
        if (e.key === 'overlayEnabled') {
            updateOverlay();
        }
    });

    // 初始状态对齐一次（不弹提示：previousIsTDT 已按当前底图初始化）
    const overlayEnabled = localStorage.getItem('overlayEnabled') === 'true';
    if (overlayEnabled) {
        overlayLayer = viewer.imageryLayers.addImageryProvider(tiandituLabelProvider, 0);
        viewer.imageryLayers.raiseToTop(overlayLayer);
    }
}

// ---------- 切换底图 ----------
// 换图顺序与原生 BaseLayerPicker 一致（BaseLayerPickerViewModel.js:212-226）：
// 先移除旧底图，再把新图层插到 index 0 垫底。
export function setBasemap(id) {
    const entry = BASEMAPS.find((b) => b.id === id);
    if (!entry) return Promise.reject(new Error(`未知底图: ${id}`));
    if (!viewerInstance) return Promise.reject(new Error('viewer 尚未初始化'));
    if (id === currentBasemapId) return Promise.resolve();

    return Promise.resolve()
        .then(() => entry.create())
        .then((provider) => {
            const layers = viewerInstance.imageryLayers;
            if (currentBaseLayer) {
                layers.remove(currentBaseLayer, true);
            }
            currentBaseLayer = layers.addImageryProvider(provider, 0);
            currentBasemapId = id;
            updateOverlay();
            if (entry.warning) {
                showToast(entry.warning);
            }
        })
        .catch((e) => {
            console.error(`底图「${entry.name}」加载失败:`, e);
            throw e;
        });
}

// ---------- 恢复默认底图 ----------
// 谷歌模式退出 / 降级时调用：进入谷歌模式会 imageryLayers.removeAll()，
// 所以这里必须重建底图并复位内部状态，否则会留下全黑的球。
export function restoreDefaultBasemap() {
    if (!viewerInstance) return Promise.resolve();
    const layers = viewerInstance.imageryLayers;
    layers.removeAll(true);
    overlayLayer = null;
    currentBaseLayer = null;
    currentBasemapId = 'sentinel-2';

    return Cesium.IonImageryProvider.fromAssetId(3954)
        .then((provider) => {
            currentBaseLayer = layers.addImageryProvider(provider, 0);
            previousIsTDT = false;
            updateOverlay();
            console.log('已恢复哨兵2底图');
        })
        .catch((e) => {
            console.error('哨兵2底图恢复失败:', e);
        });
}
