// js/ui.js
import { Cartesian3, Math as CesiumMath } from 'cesium';

export function initUI(viewer, {
    // 从 main.js 传入的共享状态和方法
    buildingsPrimitive,
    state,
    setBuildingsVisible,
    showToast,
    isInHdArea,
    hdTilesetsVisible,
    setHdTilesetsVisible,
    hdToggleBtn,
    toggleBuildingsBtn,
    closeInfo,     
    closeIterlog,  
}) {

    // ---------- 侧滑菜单控制 ----------
    const menuToggleBtn = document.getElementById('menuToggleBtn');
    const sideMenu = document.getElementById('sideMenu');
    const closeMenuBtn = document.getElementById('closeMenuBtn');
    const menuItems = sideMenu.querySelectorAll('.menu-btn');

    // 创建遮罩层
    const overlay = document.createElement('div');
    overlay.className = 'menu-overlay';
    document.body.appendChild(overlay);

    function openMenu() {
        sideMenu.classList.add('open');
        overlay.classList.add('show');
        document.body.style.overflow = 'hidden'; // 禁止滚动
    }

    function closeMenu() {
        sideMenu.classList.remove('open');
        overlay.classList.remove('show');
        document.body.style.overflow = '';
    }

    // 汉堡按钮点击切换
    menuToggleBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (sideMenu.classList.contains('open')) {
            closeMenu();
        } else {
            openMenu();
        }
    });

    // 关闭按钮
    closeMenuBtn.addEventListener('click', closeMenu);

    // 点击遮罩关闭
    overlay.addEventListener('click', closeMenu);

    // 点击菜单项关闭菜单
    menuItems.forEach(btn => {
        btn.addEventListener('click', () => {
            setTimeout(closeMenu, 150);
        });
    });

    // 按 ESC 键关闭
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && sideMenu.classList.contains('open')) {
            closeMenu();
        }
    });

    // 窗口大小变化时，保持菜单关闭
    window.addEventListener('resize', () => {
        if (window.innerWidth > 700 && sideMenu.classList.contains('open')) {
            closeMenu();
        }
    });

    // =============================================
    // 1. 光照控制
    // =============================================
    const toggleBtn = document.getElementById('modeToggleBtn');
    let isLightingEnabled = false;

    function switchLighting(enableLighting) {
        isLightingEnabled = enableLighting;
        viewer.scene.globe.enableLighting = enableLighting;
        if (enableLighting) {
            viewer.timeline.container.style.display = 'block';
            viewer.animation.container.style.display = 'block';
            toggleBtn.textContent = '🌍 真实光照';
            toggleBtn.classList.remove('active');
        } else {
            viewer.timeline.container.style.display = 'none';
            viewer.animation.container.style.display = 'none';
            toggleBtn.textContent = '☀️ 亮白模式';
            toggleBtn.classList.add('active');
        }
    }
    toggleBtn.addEventListener('click', () => {
        switchLighting(!isLightingEnabled);
    });

    // =============================================
    // 2. 3D建筑切换（完整互斥逻辑）
    // =============================================
    toggleBuildingsBtn.addEventListener('click', () => {
        if (isInHdArea && hdTilesetsVisible) {
            setHdTilesetsVisible(false);
            hdTilesetsVisible = false;
            hdToggleBtn.textContent = '🏙️ 高精度建模（关闭）';
            hdToggleBtn.classList.remove('active');
            if (!state.buildingsVisible && buildingsPrimitive) {
                setBuildingsVisible(true);
                hdToggleBtn.disabled = true;
                hdToggleBtn.style.opacity = '0.5';
                hdToggleBtn.style.cursor = 'not-allowed';
                showToast('🏙️ 高精度已关闭，3D建筑已开启');
            }
            return;
        }

        if (!buildingsPrimitive) return;
        const newState = !state.buildingsVisible;
        setBuildingsVisible(newState);

        if (isInHdArea) {
            if (newState) {
                // 3D建筑开启 → 高精度按钮变灰
                hdToggleBtn.disabled = true;
                hdToggleBtn.style.opacity = '0.5';
                hdToggleBtn.style.cursor = 'not-allowed';
                // 如果高精度是开启的，强制关闭
                if (hdTilesetsVisible) {
                    setHdTilesetsVisible(false);
                    hdTilesetsVisible = false;
                    hdToggleBtn.textContent = '🏙️ 高精度建模（关闭）';
                    hdToggleBtn.classList.remove('active');
                }
            } else {
                // 3D建筑关闭 → 高精度按钮可点击
                hdToggleBtn.disabled = false;
                hdToggleBtn.style.opacity = '1';
                hdToggleBtn.style.cursor = 'pointer';
            }
        }
    });

    // =============================================
    // 3. 重置视角
    // =============================================
    const resetBtn = document.getElementById('resetViewBtn');
    resetBtn.addEventListener('click', () => {
        const cartographic = viewer.camera.positionCartographic;
        viewer.camera.flyTo({
            destination: Cartesian3.fromRadians(
                cartographic.longitude,
                cartographic.latitude,
                cartographic.height
            ),
            orientation: {
                heading: 0,
                pitch: -CesiumMath.PI_OVER_TWO,
                roll: 0
            },
            duration: 1.2
        });
    });

    // =============================================
    // 4. 信息弹窗（普通关于）
    // =============================================
    const infoBtn = document.getElementById('infoBtn');
    const infoModal = document.getElementById('infoModal');
    const closeInfoBtn = document.getElementById('closeInfoBtn');
    const openTipsBtn = document.getElementById('openTipsBtn');
    const openIterlogBtn = document.getElementById('openIterlogBtn');
    const tipsModal = document.getElementById('tipsModal');
    const closeTipsBtn = document.getElementById('closeTipsBtn');

    function openInfo() {
        infoModal.classList.add('active');
    }
    function openTips() {
        tipsModal.classList.add('active');
    }
    function closeTips() {
        tipsModal.classList.remove('active');
    }
    // closeInfo 由外部传入（与 main.js 共享）
    infoBtn.addEventListener('click', openInfo);
    closeInfoBtn.addEventListener('click', closeInfo);
    infoModal.addEventListener('click', (e) => {
        if (e.target === infoModal) closeInfo();
    });
    if (openTipsBtn) {
        openTipsBtn.addEventListener('click', openTips);
    }
    if (openIterlogBtn) {
        openIterlogBtn.addEventListener('click', openIterlog);
    }
    if (closeTipsBtn) {
        closeTipsBtn.addEventListener('click', closeTips);
    }
    if (tipsModal) {
        tipsModal.addEventListener('click', (e) => {
            if (e.target === tipsModal) closeTips();
        });
    }

    // =============================================
    // 5. 谷歌模式关于弹窗
    // =============================================
    const closeInfoGoogleBtn = document.getElementById('closeInfoGoogleBtn');
    const infoModalGoogle = document.getElementById('infoModalGoogle');
    if (closeInfoGoogleBtn && infoModalGoogle) {
        closeInfoGoogleBtn.addEventListener('click', function() {
            infoModalGoogle.classList.remove('active');
        });
        infoModalGoogle.addEventListener('click', function(e) {
            if (e.target === infoModalGoogle) {
                infoModalGoogle.classList.remove('active');
            }
        });
    }

    // =============================================
    // 6. 迭代记录弹窗
    // =============================================
    const iterlogModal = document.getElementById('iterlogModal');
    const closeIterlogBtn = document.getElementById('closeIterlogBtn');

    function openIterlog() {
        iterlogModal.classList.add('active');
    }
    // closeIterlog 由外部传入
    if (closeIterlogBtn) {
        closeIterlogBtn.addEventListener('click', closeIterlog);
    }
    if (iterlogModal) {
        iterlogModal.addEventListener('click', (e) => {
            if (e.target === iterlogModal) closeIterlog();
        });
    }

    // 返回关闭弹窗的方法
    return { openInfo, closeInfo, openIterlog, closeIterlog };
}