import { Cartesian3, Math as CesiumMath } from 'cesium';

export function initUI(viewer, {
    hd,
    showToast,
    closeInfo,
    closeIterlog,
    timeControl,
}) {

    // hd 是 hd-layers.js 返回的整个对象：稳定的引用在这里解构一次，
    // 而 isInHdArea / hdTilesetsVisible 必须每次通过 hd.xxx 读取。
    // 它们是用 getter 暴露的实时值，一旦解构就会退化成一次性快照。
    const {
        buildingsPrimitive,
        state,
        setBuildingsVisible,
        setHdTilesetsVisible,
        hdToggleBtn,
        toggleBuildingsBtn,
    } = hd;

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
        // #buildingsToggleBtn 是 <div>，不具备原生 disabled 语义：
        // 给它赋 .disabled 只是挂了个普通属性，浏览器不会拦截点击，
        // :disabled 选择器也匹配不到它，所以灰化只是视觉效果。
        // 高精度建模开启期间必须在这里真正拦住。
        // 该标志由 hd-layers.js 的 setBuildingsBtnEnabled() 统一维护。
        if (toggleBuildingsBtn.disabled) return;

        if (hd.isInHdArea && hd.hdTilesetsVisible) {
            setHdTilesetsVisible(false);
            // 状态只改 .active；该按钮内部是内联 SVG + 文本的结构，
            // 写 textContent 会把图标抹掉（同排其余五个按钮同理）。
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

        if (hd.isInHdArea) {
            if (newState) {
                hdToggleBtn.disabled = true;
                hdToggleBtn.style.opacity = '0.5';
                hdToggleBtn.style.cursor = 'not-allowed';
                if (hd.hdTilesetsVisible) {
                    setHdTilesetsVisible(false);
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
            // 用带扩展名的真实文件路径：Service Worker 预缓存的正是
            // './settings.html'，无扩展名的 './settings' 是另一个缓存键，
            // 离线时会未命中（虽然 GitHub Pages 在线时会 200 重定向到它）。
            window.location.href = './settings.html';
        }, 220);
    });

    // =============================================
    // 4. 关于弹窗
    // =============================================
    const infoBtn = document.getElementById('infoBtn');
    const infoModal = document.getElementById('infoModal');
    // 谷歌模式下的“关于”弹窗：提前取引用，供下面的点击处理器判断当前模式。
    const infoModalGoogle = document.getElementById('infoModalGoogle');
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

    // 谷歌模式下“关于”按钮指向另一个弹窗。
    // 这里用单一处理器读取当前模式，而不是替换 DOM 节点：
    // 替换节点（cloneNode + replaceWith）会丢掉该元素上已注册的监听器，
    // 并且会绕过 closePanelThen，导致面板不收起来。
    infoBtn.addEventListener('click', () => {
        if (window._isGoogleMode && infoModalGoogle) {
            infoModalGoogle.classList.add('active');
        } else {
            closePanelThen(openInfo);
        }
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

