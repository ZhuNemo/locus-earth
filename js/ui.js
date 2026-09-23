import { Cartesian3, Math as CesiumMath } from 'cesium';

export function initUI(viewer, {
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
    timeControl,
}) {

    // =============================================
    // 0. 悬浮头部 & 可展开面板控制
    // =============================================
    const toggleHeaderBtn = document.getElementById('toggleHeaderBtn');
    const expandablePanel = document.getElementById('expandablePanel');
    const panelHandle = document.getElementById('panelHandle');

    function openPanel() {
        expandablePanel.classList.add('expanded');
        toggleHeaderBtn.classList.add('rotated');
    }

    function closePanel() {
        expandablePanel.classList.remove('expanded');
        toggleHeaderBtn.classList.remove('rotated');
    }

    function togglePanel() {
        if (expandablePanel.classList.contains('expanded')) {
            closePanel();
        } else {
            openPanel();
        }
    }

    toggleHeaderBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        togglePanel();
    });

    if (panelHandle) {
        panelHandle.addEventListener('click', (e) => {
            e.stopPropagation();
            togglePanel();
        });

        let touchStartY = null;
        panelHandle.addEventListener('touchstart', (e) => {
            touchStartY = e.touches[0].clientY;
        }, { passive: true });
        panelHandle.addEventListener('touchend', (e) => {
            if (touchStartY === null) return;
            const deltaY = e.changedTouches[0].clientY - touchStartY;
            if (Math.abs(deltaY) > 12) {
                if (deltaY < 0 && !expandablePanel.classList.contains('expanded')) {
                    openPanel();
                } else if (deltaY > 0 && expandablePanel.classList.contains('expanded')) {
                    closePanel();
                }
            }
            touchStartY = null;
        }, { passive: true });
    }

    // 点击面板外部自动收起
    document.addEventListener('click', (e) => {
        if (expandablePanel.classList.contains('expanded') &&
            !expandablePanel.contains(e.target) &&
            !toggleHeaderBtn.contains(e.target)) {
            closePanel();
        }
    });

    // 辅助：先收起面板，延迟后再执行回调（用于打开弹窗）
    function closePanelThen(callback) {
        closePanel();
        setTimeout(callback, 220);
    }

    // =============================================
    // 1. 光照控制（开关形式）
    // =============================================
    const modeToggle = document.getElementById('modeToggleBtn');
    let isLightingEnabled = false;

    function switchLighting(enableLighting) {
        isLightingEnabled = enableLighting;
        viewer.scene.globe.enableLighting = enableLighting;
        viewer.scene.sun.show = enableLighting;
        viewer.scene.moon.show = enableLighting;
        viewer.clock.shouldAnimate = enableLighting;
        timeControl?.setVisible(enableLighting);
        if (enableLighting) {
            modeToggle.classList.add('active');
        } else {
            modeToggle.classList.remove('active');
        }
    }

    modeToggle.addEventListener('click', () => {
        switchLighting(!isLightingEnabled);
    });

    // 初始化：默认关闭真实光照
    switchLighting(false);

    // =============================================
    // 2. 建筑白模切换（开关形式）
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
                showToast('🏙️ 高精度已关闭，建筑白模已开启');
            }
            return;
        }

        if (!buildingsPrimitive) return;
        const newState = !state.buildingsVisible;
        setBuildingsVisible(newState);

        if (newState) {
            toggleBuildingsBtn.classList.add('active');
        } else {
            toggleBuildingsBtn.classList.remove('active');
        }

        if (isInHdArea) {
            if (newState) {
                hdToggleBtn.disabled = true;
                hdToggleBtn.style.opacity = '0.5';
                hdToggleBtn.style.cursor = 'not-allowed';
                if (hdTilesetsVisible) {
                    setHdTilesetsVisible(false);
                    hdTilesetsVisible = false;
                    hdToggleBtn.textContent = '🏙️ 高精度建模（关闭）';
                    hdToggleBtn.classList.remove('active');
                }
            } else {
                hdToggleBtn.disabled = false;
                hdToggleBtn.style.opacity = '1';
                hdToggleBtn.style.cursor = 'pointer';
            }
        }
    });

    // =============================================
    // 3. 设置按钮（先收起面板，再跳转）
    // =============================================
    document.getElementById('settingsBtn').addEventListener('click', () => {
        closePanel();
        setTimeout(() => {
            window.location.href = './settings';
        }, 220);
    });

    // =============================================
    // 4. 关于弹窗
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

    infoBtn.addEventListener('click', () => {
        closePanelThen(openInfo);
    });
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

