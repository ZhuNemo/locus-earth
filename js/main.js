import {
            Viewer,
            createOsmBuildingsAsync,
            Cartesian3,
            Ion,
            CesiumTerrainProvider,
            SceneMode,
            Math as CesiumMath,
            Cesium3DTileset,
            IonImageryProvider,
            GeographicTilingScheme,
            EllipsoidTerrainProvider,
            Color, 
        } from 'cesium';

import { initViewer } from './viewer.js';
import { initUI } from './ui.js';
import { initBookmarks } from './bookmarks.js';
import { initCompass } from './compass.js';
import { showToast, closeInfo, closeIterlog } from './utils.js';
import { initHdLayers } from './hd-layers.js';
import { initGoogleMode } from './google-mode.js';

        Ion.defaultAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJjMjgxOGI5ZS1lYzQ1LTRkN2ItYWRmYy05YzllOTNhYWZjYzQiLCJpZCI6NDUyMzc2LCJzdWIiOiJaaHVOZW1vIiwiaXNzIjoiaHR0cHM6Ly9hcGkuY2VzaXVtLmNvbSIsImF1ZCI6IlpodU5lbW9fZGVmYXVsdCIsImlhdCI6MTc4MzIyMzUwOX0.HdLWoiGJw7McbyHwjra0Bx7J57pVrZGIJfNk0AZjQBU';


        (function initTheme() {
        const STORAGE_KEY = 'locus-settings';
        function getSystemTheme() {
            return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        }
        function applyTheme(theme) {
            document.documentElement.setAttribute('data-theme', theme);
            const meta = document.querySelector('meta[name="theme-color"]');
            if (meta) {
                meta.content = theme === 'dark' ? '#1a1a1a' : '#ffffff';
            }
        }
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (raw) {
                const settings = JSON.parse(raw);
                if (settings.followSystem !== false) {
                    applyTheme(getSystemTheme());
                } else {
                    applyTheme(settings.colorMode || 'light');
                }
            }
        } catch {}
    })();

        const terrainProvider = await CesiumTerrainProvider.fromIonAssetId(1, {
            requestVertexNormals: true,
            requestWaterMask: true
        });

        export const viewer = initViewer('cesiumContainer', terrainProvider);

        // ----- 初始飞向北京 -----
        viewer.camera.flyTo({
            destination: Cartesian3.fromDegrees(116.4, 39.9, 1000000),
            duration: 3
        });

        console.log('🌍 Locus Maps 启动成功！');
        console.log('💡 高精度联动已启用：进入丹佛/华盛顿DC/华盛顿州/悉尼/波士顿区域自动切换。');



        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('sw.js')
                .then(reg => console.log('SW registered:', reg))
                .catch(err => console.log('SW registration failed:', err));
        }
        

        const hdLayers = await initHdLayers(viewer, showToast);
        const googleMode = initGoogleMode(viewer, showToast, closeInfo, closeIterlog);
        const compass = initCompass(viewer, showToast);

        
        initBookmarks(viewer, 'icons/pin.png');
        
        // 调用 initUI，传入所有需要的依赖
        initUI(viewer, {
            ...hdLayers,
            showToast,
            closeInfo,
            closeIterlog,
        });