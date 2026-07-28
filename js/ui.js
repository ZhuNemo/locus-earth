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

    function openInfo() {
        infoModal.classList.add('active');
    }
    // closeInfo 由外部传入（与 main.js 共享）
    infoBtn.addEventListener('click', openInfo);
    closeInfoBtn.addEventListener('click', closeInfo);
    infoModal.addEventListener('click', (e) => {
        if (e.target === infoModal) closeInfo();
    });

    // =============================================
    // 5. 谷歌模式关于弹窗（关闭逻辑）
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
    const iterlogBtn = document.getElementById('iterlogBtn');
    const iterlogModal = document.getElementById('iterlogModal');
    const closeIterlogBtn = document.getElementById('closeIterlogBtn');

    function openIterlog() {
        iterlogModal.classList.add('active');
    }
    // closeIterlog 由外部传入
    iterlogBtn.addEventListener('click', openIterlog);
    closeIterlogBtn.addEventListener('click', closeIterlog);
    iterlogModal.addEventListener('click', (e) => {
        if (e.target === iterlogModal) closeIterlog();
    });

    // 返回关闭弹窗的方法
    return { openInfo, closeInfo, openIterlog, closeIterlog };
}