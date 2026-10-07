import { Cartesian3, Math as CesiumMath } from 'cesium';

// =============================================
// 面板收起工具（模块级，导出）
// ---------------------------------------------
// 放在 initUI 之外导出，是为了让 measure-ui.js 等模块也能复用，
// 而不必依赖 initUI 的调用时机 —— main.js 里 initMeasureUI() 早于 initUI()。
// 元素按 id 实时查询、不缓存引用，避免拿到过期节点。
//
// options.waitForTransition = true 时等面板收起动画走完再执行回调，
// 用于「先收起主面板、功能条再出现」这类有先后顺序的需求。
export function collapsePanelThen(callback, { waitForTransition = false } = {}) {
    const panel = document.getElementById('expandablePanel');
    const headerBtn = document.getElementById('toggleHeaderBtn');
    if (!panel) {
        callback();
        return;
    }

    const wasExpanded = panel.classList.contains('expanded');
    panel.classList.remove('expanded');
    headerBtn?.classList.remove('rotated');

    // 本来就没展开 → 不产生过渡，下一帧直接执行
    if (!wasExpanded) {
        requestAnimationFrame(callback);
        return;
    }

    if (!waitForTransition) {
        setTimeout(callback, 220);
        return;
    }

    const ms = panelCollapseDuration(panel);
    setTimeout(callback, ms > 0 ? ms : 240);
}

/**
 * 读取面板当前「transform 过渡」的声明时长（桌面 0.28s / 移动端 0.42s）。
 *
 * 这里刻意不监听 transitionend：它在下面几种情况下根本不会触发，
 * 回调就会被永久卡住 ——
 *   · 浏览器跳过该属性的动画（元素不可见、后台标签页、无合成器）；
 *   · 过渡被后续状态变更打断；
 *   · 起止值相同（例如面板高度为 0）。
 * 实测 headless Chrome 里 transitionstart 会晚到 500ms 以上，
 * transitionend 更是不可靠。改用样式表里声明的时长做延迟：
 * 时长本身就是"视觉上收完"的定义，改 CSS 也不必改 JS。
 */
function panelCollapseDuration(panel) {
    const cs = getComputedStyle(panel);
    const props = cs.transitionProperty.split(',');
    const durs = cs.transitionDuration.split(',');
    let ms = 0;
    for (let i = 0; i < props.length; i++) {
        const prop = props[i].trim();
        if (prop !== 'transform' && prop !== 'all') continue;
        const raw = (durs[i] ?? durs[0] ?? '').trim();
        if (!raw) continue;
        const n = parseFloat(raw) || 0;
        ms = Math.max(ms, raw.endsWith('ms') ? n : n * 1000);
    }
    return ms;
}

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
            // 拖拽手势结束后的 click 不应再触发一次 toggle，故在此拦截
            if (suppressClick) {
                suppressClick = false;
                e.preventDefault();
                return;
            }
            togglePanel();
        });

        // ------------------------------------------------------------------
        // 移动端托盘：连续拖拽手势（下滑收起 / 上滑展开）
        // ------------------------------------------------------------------
        // 设计要点：
        //   · 只用 touch 事件（桌面鼠标不参与），避免误伤点击。
        //   · 拖拽期间写 --drag-y 让面板 1:1 跟手（CSS 里 .dragging 关掉了过渡）。
        //   · 松开时按"位移 + 速度"决定吸附到展开还是收起，手感更自然。
        //   · 展开态起始只能往上顶一点点（阻尼），主体是下滑；收起态反之。
        const collapsedOffset = () => panelHandle.getBoundingClientRect().height; // 收起时露出的手柄高
        let dragging = false;
        let startY = 0;
        let startDragY = 0;
        let lastY = 0;
        let lastT = 0;
        let velocity = 0;
        let suppressClick = false;
        let dragMoved = false;

        const panelHeight = () => expandablePanel.getBoundingClientRect().height;

        function setDragY(px) {
            expandablePanel.style.setProperty('--drag-y', `${px}px`);
        }

        function onTouchStart(e) {
            if (e.touches.length !== 1) return;
            // 只在移动端托盘布局下启用（桌面端面板不在底部，无需拖拽）
            if (window.matchMedia('(min-width: 601px)').matches) return;

            dragging = true;
            dragMoved = false;
            startY = e.touches[0].clientY;
            lastY = startY;
            lastT = e.timeStamp;
            velocity = 0;
            startDragY = 0;
            expandablePanel.classList.add('dragging');
        }

        function onTouchMove(e) {
            if (!dragging) return;
            const y = e.touches[0].clientY;
            let dy = y - startY;
            const isExpanded = expandablePanel.classList.contains('expanded');

            // 阻尼：展开态往上拖（会顶出屏幕）限制得很小；收起态往下拖限制也很小，
            // 让手势方向与预期一致，反向只给"橡皮筋"反馈。
            if (isExpanded) {
                if (dy < 0) dy *= 0.18;
                // 下滑不超过自身高度
                if (dy > panelHeight()) dy = panelHeight();
            } else {
                // 收起态：上滑展开，dy 为负；向下拖几乎不动（已经到底了）
                if (dy > 0) dy *= 0.18;
                else {
                    const max = panelHeight() - collapsedOffset();
                    if (dy < -max) dy = -max;
                }
            }

            startDragY = dy;
            setDragY(dy);

            // 速度采样（px/ms）
            const dt = e.timeStamp - lastT;
            if (dt > 0) velocity = (y - lastY) / dt;
            lastY = y;
            lastT = e.timeStamp;

            if (Math.abs(dy) > 6) dragMoved = true;
            // 阻止页面滚动/下拉刷新（非 passive 监听才有意义）
            if (dragMoved) e.preventDefault();
        }

        function onTouchEnd() {
            if (!dragging) return;
            dragging = false;
            expandablePanel.classList.remove('dragging');

            const isExpanded = expandablePanel.classList.contains('expanded');
            const dy = startDragY;
            const h = panelHeight();
            const span = h - collapsedOffset();   // 收起态要移动的总距离
            const VEL = 0.45;                     // 速度阈值 px/ms

            // 决策：速度优先，其次看位移是否超过阈值
            let shouldClose;
            if (Math.abs(velocity) > VEL) {
                shouldClose = velocity > 0;       // 快速下滑=收起；快速上滑=展开
            } else {
                shouldClose = isExpanded ? dy > span * 0.28 : !(dy < -span * 0.28);
            }

            // 先清掉拖拽位移，再切换 expanded，让 CSS 过渡做吸附动画
            setDragY(0);
            if (shouldClose) {
                // 快速下滑的强手势即使面板未展开也保持收起
                closePanel();
            } else {
                openPanel();
            }

            // 只要发生过拖动就吞掉随后的 click，避免"拖完又 toggle 一次"
            suppressClick = dragMoved;
            dragMoved = false;
            velocity = 0;
        }

        panelHandle.addEventListener('touchstart', onTouchStart, { passive: true });
        // touchmove 必须 passive:false 才能调用 preventDefault 阻止页面滚动
        panelHandle.addEventListener('touchmove', onTouchMove, { passive: false });
        panelHandle.addEventListener('touchend', onTouchEnd, { passive: true });
        panelHandle.addEventListener('touchcancel', onTouchEnd, { passive: true });
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
    // 实现见模块顶部的 collapsePanelThen（同时供 measure-ui.js 复用）
    const closePanelThen = collapsePanelThen;

    // =============================================
    // 1. 光照控制（开关形式）
    // =============================================
    const modeToggle = document.getElementById('modeToggleBtn');
    let isLightingEnabled = false;

    // deferTimeControl：只推迟「时间/光照控制条」的显隐，
    // 光照本身与开关高亮仍然立即生效 —— 让点击有即时反馈，
    // 又不会让控制条与主面板同屏压叠。
    function switchLighting(enableLighting, { deferTimeControl = false } = {}) {
        isLightingEnabled = enableLighting;
        viewer.scene.globe.enableLighting = enableLighting;
        viewer.scene.sun.show = enableLighting;
        viewer.scene.moon.show = enableLighting;
        viewer.clock.shouldAnimate = enableLighting;
        if (!deferTimeControl) timeControl?.setVisible(enableLighting);
        if (enableLighting) {
            modeToggle.classList.add('active');
        } else {
            modeToggle.classList.remove('active');
        }
    }

    // pending 序号：面板收起期间若用户又点了一次开关，
    // 旧回调不能再把时间条弹出来（否则会出现"已关闭但控制条还在"）。
    let lightingToggleSeq = 0;

    modeToggle.addEventListener('click', () => {
        if (isLightingEnabled) {
            // 关闭：光照与时间条一起收掉，无需等待面板动画
            lightingToggleSeq++;
            switchLighting(false);
            return;
        }

        const seq = ++lightingToggleSeq;
        // 开启：开关先亮、光照立即生效，时间控制条等主面板收起后再出现
        switchLighting(true, { deferTimeControl: true });
        collapsePanelThen(() => {
            if (seq !== lightingToggleSeq || !isLightingEnabled) return;
            timeControl?.setVisible(true);
        }, { waitForTransition: true });
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

