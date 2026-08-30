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
        
        import { initMeasureTools } from './measure.js';
        initMeasureTools(viewer);

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
measureFloatingBtn.addEventListener('click', (e) => {
    if (window._isDraggingMeasure) return;
    measureFloatingBtn.style.display = 'none';
    measureToolbar.style.display = 'flex';
    measureToolbar.style.top = '';
    measureToolbar.style.left = '';
    measureToolbar.style.transform = '';
});

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

// 4. 点击浮动按钮，重新展开菜单（并回到顶部）
measureFloatingBtn.addEventListener('click', (e) => {
    // 如果是在拖拽后的点击，需要先排除拖拽
    if (window._isDraggingMeasure) return;
    measureFloatingBtn.style.display = 'none';
    measureToolbar.style.display = 'flex';
    // 展开时让工具栏也回到顶部
    measureToolbar.style.top = '80px'; 
    measureToolbar.style.left = '50%';
    measureToolbar.style.transform = 'translateX(-50%)';
});

// 5. 浮动圆钮拖拽功能（兼容移动端和PC端）
let isDragging = false;
let startX, startY, initialLeft, initialTop;

measureFloatingBtn.addEventListener('mousedown', startDrag);
measureFloatingBtn.addEventListener('touchstart', startDrag, {passive: false});

document.addEventListener('mousemove', drag);
document.addEventListener('touchmove', drag, {passive: false});

document.addEventListener('mouseup', endDrag);
document.addEventListener('touchend', endDrag);

function startDrag(e) {
    isDragging = false;
    const clientX = e.clientX || e.touches[0].clientX;
    const clientY = e.clientY || e.touches[0].clientY;
    startX = clientX;
    startY = clientY;
    initialLeft = measureFloatingBtn.offsetLeft;
    initialTop = measureFloatingBtn.offsetTop;
    
    // 移除初始的居中 transform，改用 left/top 定位
    measureFloatingBtn.style.transform = 'none';
    measureFloatingBtn.style.left = initialLeft + 'px';
    measureFloatingBtn.style.top = initialTop + 'px';

    window._isDraggingMeasure = false;
}

function drag(e) {
    if (!startX) return;
    e.preventDefault();
    const clientX = e.clientX || e.touches[0].clientX;
    const clientY = e.clientY || e.touches[0].clientY;

    const dx = clientX - startX;
    const dy = clientY - startY;

    // 位移大于5像素才算拖拽，防止误触点击事件
    if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
        isDragging = true;
        window._isDraggingMeasure = true;
    }

    measureFloatingBtn.style.left = (initialLeft + dx) + 'px';
    measureFloatingBtn.style.top = (initialTop + dy) + 'px';
}

function endDrag() {
    startX = null;
    startY = null;
    // 如果拖拽了，松开时保持原位，不触发点击事件
    if (isDragging) {
        setTimeout(() => { window._isDraggingMeasure = false; }, 100);
    }
}
        // 调用 initUI，传入所有需要的依赖
        initUI(viewer, {
            ...hdLayers,
            showToast,
            closeInfo,
            closeIterlog,
        });
