import * as Cesium from 'cesium';
import { showToast } from './utils.js';
import { CONFIG } from './config.js';

export function initCustomImagery(imageryProviders, viewer) {
    const ViewModelClass = imageryProviders[0].constructor;

    // ----- 腾讯地图底图 -----
    const QQ_KEY = CONFIG.qqKey; 
    const tencentProvider = new Cesium.UrlTemplateImageryProvider({
        url: 'https://rt{s}.map.gtimg.com/tile?z={z}&x={x}&y={reverseY}&type=vector&styleid=1&key=' + QQ_KEY,
        subdomains: ['0', '1', '2', '3'],
        minimumLevel: 3,
        maximumLevel: 18
    });
    const tencentViewModel = new ViewModelClass({
        name: '腾讯地图',
        iconUrl: './icons/tencent.png', 
        tooltip: '腾讯地图',
        creationFunction: () => {
            showToast('⚠️ 腾讯地图使用火星坐标系，存在偏移，建议浏览时隐藏标记、关闭设置路网及叠加层以避免出现错位');
            return tencentProvider;
        }
    });
    imageryProviders.push(tencentViewModel);

    // ----- 天地图卫星影像底图 -----
    const TDT_KEY = CONFIG.tiandituKey;

    const tiandituProvider = new Cesium.UrlTemplateImageryProvider({
        url: 'https://t{s}.tianditu.gov.cn/img_w/wmts?service=wmts&request=GetTile&version=1.0.0&LAYER=img&tileMatrixSet=w&TileMatrix={z}&TileRow={y}&TileCol={x}&style=default&format=tiles&tk=' + TDT_KEY,
        subdomains: ['0', '1', '2', '3', '4', '5', '6', '7'],
        maximumLevel: 18 
    });

    // 天地图地名路网叠加层
    const tiandituLabelProvider = new Cesium.UrlTemplateImageryProvider({
        url: 'https://t{s}.tianditu.gov.cn/cia_w/wmts?service=wmts&request=GetTile&version=1.0.0&LAYER=cia&tileMatrixSet=w&TileMatrix={z}&TileRow={y}&TileCol={x}&style=default&format=tiles&tk=' + TDT_KEY,
        subdomains: ['0', '1', '2', '3', '4', '5', '6', '7'],
        maximumLevel: 18 
    });

    const tiandituViewModel = new ViewModelClass({
        name: '天地图卫星',
        iconUrl: './icons/tianditu.png', 
        tooltip: '天地图卫星影像',
        creationFunction: () => tiandituProvider
    });
    imageryProviders.push(tiandituViewModel);

    // ============================================
    // 叠加层自动控制逻辑
    // ============================================
    let overlayLayer = null;
    let previousIsTDT = false;

    function notifyOverlayChange(message) {
        if (typeof showToast === 'function') {
            showToast(message);
        }
        if (typeof window !== 'undefined') {
            window.showToast = showToast;
        }
    }

    function updateOverlay() {
        // 1. 获取当前底图名称
        const currentImagery = viewer.baseLayerPicker.viewModel.selectedImagery;
        let currentName = '';
        if (currentImagery && typeof currentImagery === 'object') {
            currentName = currentImagery.name || currentImagery.peek?.().name || '';
        }
        const isTDT = currentName.includes('天地图');

        // 2. 自动判断进入/离开天地图
        if (isTDT && !previousIsTDT) {
            localStorage.setItem('overlayEnabled', 'true');
            notifyOverlayChange('📍 路网及叠加层已开启，可在设置页关闭');
        } else if (!isTDT && previousIsTDT) {
            // 刚刚离开天地图：自动关闭并提示
            localStorage.setItem('overlayEnabled', 'false');
            notifyOverlayChange('📍 路网及叠加层已关闭，可在设置页开启');
        }
        previousIsTDT = isTDT;

        // 3. 根据最终设置状态，决定叠加层显示还是隐藏
        const overlayEnabled = localStorage.getItem('overlayEnabled') === 'true';
        if (overlayEnabled) {
            if (!overlayLayer) {
                overlayLayer = viewer.imageryLayers.addImageryProvider(tiandituLabelProvider, 0);
                viewer.imageryLayers.raiseToTop(overlayLayer);
            }
        } else {
            if (overlayLayer) {
                viewer.imageryLayers.remove(overlayLayer, true);
                overlayLayer = null;
            }
        }
    }

    if (viewer.baseLayerPicker && viewer.baseLayerPicker.viewModel) {
        const pickerViewModel = viewer.baseLayerPicker.viewModel;

        if (pickerViewModel.selectedImagery && typeof pickerViewModel.selectedImagery.subscribe === 'function') {
            pickerViewModel.selectedImagery.subscribe(updateOverlay);
        }

        else if (pickerViewModel.selectedImagery && pickerViewModel.selectedImagery.changed && typeof pickerViewModel.selectedImagery.changed.addEventListener === 'function') {
            pickerViewModel.selectedImagery.changed.addEventListener(updateOverlay);
        }

        else {
            let lastImageryName = '';
            setInterval(() => {
                const curr = pickerViewModel.selectedImagery;
                const newName = curr && (curr.name || curr.peek?.().name) || '';
                if (newName !== lastImageryName) {
                    lastImageryName = newName;
                    updateOverlay();
                }
            }, 300);
        }
    }

    window.addEventListener('storage', (e) => {
        if (e.key === 'overlayEnabled') {
            updateOverlay();
        }
    });

    updateOverlay();
}