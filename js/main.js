const themeSettings = JSON.parse(localStorage.getItem('locus-settings') || '{}');
const isDark = themeSettings.followSystem === false 
    ? (themeSettings.colorMode === 'dark') 
    : window.matchMedia('(prefers-color-scheme: dark)').matches;
document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');

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
            document.documentElement.style.colorScheme = theme === 'dark' ? 'dark' : 'light';
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

        window.addEventListener('storage', function(e) {
            if (e.key === 'locus-settings' && e.newValue) {
                try {
                    const settings = JSON.parse(e.newValue);
                    const theme = settings.followSystem !== false 
                        ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
                        : (settings.colorMode || 'light');
                    document.documentElement.setAttribute('data-theme', theme);
                    const meta = document.querySelector('meta[name="theme-color"]');
                    if (meta) {
                        meta.content = theme === 'dark' ? '#1a1a1a' : '#ffffff';
                    }
                    console.log('🌓 主题已从设置页面同步:', theme);
                } catch {}
            }
        });
        
        // ----- 初始化 viewer 并异步加载地形 -----
        const terrainEnabled = localStorage.getItem('terrainEnabled') !== 'false';
        const viewer = initViewer('cesiumContainer', new EllipsoidTerrainProvider());
        const loadingOverlay = document.getElementById('loadingOverlay');


        function applyTerrainSetting(enabled) {
            if (enabled) {
                CesiumTerrainProvider.fromIonAssetId(1, {
                    requestVertexNormals: true,
                    requestWaterMask: true
                }).then(provider => {
                    if (localStorage.getItem('terrainEnabled') !== 'false') {
                        viewer.terrainProvider = provider;
                    } else {
                        viewer.terrainProvider = new EllipsoidTerrainProvider();
                    }
                }).catch(e => console.warn('地形加载失败，保持平滑球体', e));
            } else {
                viewer.terrainProvider = new EllipsoidTerrainProvider();
                viewer.scene.requestRender();
            }
        }

        window.addEventListener('storage', (e) => {
            if (e.key === 'terrainEnabled') {
                const enabled = e.newValue === 'true';
                applyTerrainSetting(enabled);
            }
        });


        viewer.camera.setView({
            destination: Cartesian3.fromDegrees(116.4, 39.9, 1000000)
        });

        let loadingTimeout = setTimeout(() => {
            removeLoadingOverlay();
        }, 5000);

        function removeLoadingOverlay() {
            if (loadingOverlay.style.display === 'none') return; 
            loadingOverlay.style.opacity = '0';
            setTimeout(() => {
                loadingOverlay.style.display = 'none';
            }, 800); 
        }

        const removeListener = viewer.scene.globe.tileLoadProgressEvent.addEventListener(() => {
            if (viewer.scene.globe.tilesLoaded) {
                removeListener(); 
                clearTimeout(loadingTimeout);
                removeLoadingOverlay(); 
            }
        });

        CesiumTerrainProvider.fromIonAssetId(1, {
            requestVertexNormals: true,
            requestWaterMask: true
        }).then(provider => {
            viewer.terrainProvider = provider;
        }).catch(e => {
            console.warn('⚠️ 地形加载失败，已继续使用默认椭球体地形', e);
        });

        console.log('🌍 Locus Earth 启动成功！');
        console.log('💡 高精度联动已启用：进入丹佛/华盛顿DC/华盛顿州/悉尼/波士顿区域自动切换。');

        document.addEventListener('dragstart', function(e) {
        if (e.target.tagName === 'IMG' || e.target.tagName === 'A') {
            e.preventDefault();
        }
        });


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
