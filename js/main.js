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
import { initMeasureTools } from './measure.js';

        Ion.defaultAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJub25jZSI6IjhaYXJfQnUwc0QtUl85TXkiLCJqdGkiOiI3MGY5OGU2Yy1lZTcxLTRhNDUtOTJlNC1hZjNkNzQ3M2VlZGEiLCJpZCI6NDUyMzc2LCJzdWIiOiJaaHVOZW1vIiwiaXNzIjoiaHR0cHM6Ly9hcGkuY2VzaXVtLmNvbSIsImF1ZCI6IkxvY3VzIEVhcnRoIiwiaWF0IjoxNzg3NzQxOTMyfQ.v2F2V2G6J2yQiV3JTGGFfzwYJxKdQJQyXxWCcSyHN7A';


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

        // 在初始化时读取用户设置
        const terrainEnabled = localStorage.getItem('terrainEnabled') !== 'false';
        if (terrainEnabled) {
            CesiumTerrainProvider.fromIonAssetId(1, {
                requestVertexNormals: true,
                requestWaterMask: true
            }).then(provider => {
                if (localStorage.getItem('terrainEnabled') !== 'false') {
                    viewer.terrainProvider = provider;
                }
            }).catch(e => {
                console.warn('⚠️ 地形加载失败，已继续使用默认椭球体地形', e);
            });
        } else {
            viewer.terrainProvider = new EllipsoidTerrainProvider();
        }

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
        

        // 初始化测量工具，拿到控制句柄
        const measureTools = initMeasureTools(viewer);

        // --- 测量悬浮窗交互逻辑 ---
        const measureToolbar = document.getElementById('measureToolbar');
        const measureFloatingBtn = document.getElementById('measureFloatingBtn');

        // 1. 打开测量菜单
        document.getElementById('measureBtn').addEventListener('click', () => {
            document.getElementById('sideMenu').classList.remove('active');
            measureToolbar.style.display = 'flex';
            measureFloatingBtn.style.display = 'none';
            showToast('📏 选择测量方式');
        });

        // 2. 测面积、测距离、清除按钮
        document.getElementById('toolbarAreaBtn').addEventListener('click', () => {
            measureTools.startArea();
            showToast('📐 请在地图上轻触添加点');
        });
        document.getElementById('toolbarDistBtn').addEventListener('click', () => {
            measureTools.startDistance();
            showToast('📏 请在地图上轻触添加点');
        });
        document.getElementById('toolbarClearBtn').addEventListener('click', () => {
            measureTools.clear();
            showToast('🧹 已清除测量数据');
        });

        // 3. 收起菜单，变为浮动圆钮
        function collapseToolbar() {
            measureToolbar.style.display = 'none';
            measureFloatingBtn.style.display = 'flex';
            measureFloatingBtn.style.top = '';
            measureFloatingBtn.style.right = '';
            measureFloatingBtn.style.left = '';
            measureFloatingBtn.style.transform = '';
        }

        document.getElementById('toolbarBackBtn').addEventListener('click', collapseToolbar);

        document.getElementById('toolbarExitBtn').addEventListener('click', () => {
            // 1. 清除当前的测量线段/面积
            measureTools.clear();
            
            // 2. 隐藏顶部的工具栏
            measureToolbar.style.display = 'none';
            
            // 3. 隐藏浮动小圆球
            measureFloatingBtn.style.display = 'none';
            
            // 4. 恢复鼠标指针
            viewer.canvas.style.cursor = 'default';
            
            // 5. 提示用户
            showToast('✅ 已退出测量模式');
        });


        // 5. 浮动圆钮拖拽功能
        let isDragging = false;
        let hasDragged = false;
        let suppressClick = false; 
        let startX, startY, initialLeft, initialTop;

        // 安全获取坐标
        function getClientPos(e) {
            if (e.clientX !== undefined) return { x: e.clientX, y: e.clientY };
            if (e.touches && e.touches.length > 0) return { x: e.touches[0].clientX, y: e.touches[0].clientY };
            return { x: 0, y: 0 };
        }

        function startDrag(e) {
            isDragging = true;
            hasDragged = false;
            e.preventDefault(); 
            const pos = getClientPos(e);
            startX = pos.x;
            startY = pos.y;
            initialLeft = measureFloatingBtn.offsetLeft;
            initialTop = measureFloatingBtn.offsetTop;
            
            measureFloatingBtn.style.transform = 'none';
            measureFloatingBtn.style.left = initialLeft + 'px';
            measureFloatingBtn.style.top = initialTop + 'px';
            measureFloatingBtn.style.right = 'auto'; 
        }

        function drag(e) {
            if (!isDragging) return;
            e.preventDefault(); 
            
            const pos = getClientPos(e);
            const dx = pos.x - startX;
            const dy = pos.y - startY;

            if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
                hasDragged = true;
                suppressClick = true; 
            }

            const btnWidth = measureFloatingBtn.offsetWidth;
            const btnHeight = measureFloatingBtn.offsetHeight;
            const maxLeft = window.innerWidth - btnWidth - 10; 
            const maxTop = window.innerHeight - btnHeight - 10;
            
            let newLeft = initialLeft + dx;
            let newTop = initialTop + dy;

            newLeft = Math.max(10, Math.min(newLeft, maxLeft));
            newTop = Math.max(10, Math.min(newTop, maxTop));

            measureFloatingBtn.style.left = newLeft + 'px';
            measureFloatingBtn.style.top = newTop + 'px';
        }

        function endDrag() {
            isDragging = false;
            startX = null;
            startY = null;
            setTimeout(() => { suppressClick = false; hasDragged = false; }, 100);
        }

        measureFloatingBtn.addEventListener('mousedown', startDrag);
        measureFloatingBtn.addEventListener('touchstart', startDrag, {passive: false});

        document.addEventListener('mousemove', drag);
        document.addEventListener('touchmove', drag, {passive: false});

        document.addEventListener('mouseup', endDrag);
        document.addEventListener('touchend', endDrag);

        measureFloatingBtn.addEventListener('click', (e) => {
            if (suppressClick || hasDragged) return;
            measureFloatingBtn.style.display = 'none';
            measureToolbar.style.display = 'flex';
        });

        // 调用 initUI，传入所有需要的依赖
        initUI(viewer, {
            ...hdLayers,
            showToast,
            closeInfo,
            closeIterlog,
        });
