import { showToast } from './utils.js';

export function initMeasureUI(viewer, measureTools) {
    const measureToolbar = document.getElementById('measureToolbar');
    const measureFloatingBtn = document.getElementById('measureFloatingBtn');

    function getFloatingButtonPosition() {
        const left = Number.parseFloat(measureFloatingBtn.style.left) || measureFloatingBtn.offsetLeft || 16;
        const top = Number.parseFloat(measureFloatingBtn.style.top) || measureFloatingBtn.offsetTop || 80;
        return { left, top };
    }

    // 1. 打开测量菜单
    document.getElementById('measureBtn').addEventListener('click', () => {
        document.getElementById('sideMenu').classList.remove('active');
        measureFloatingBtn.style.display = 'none';
        showToolbarAtButtonPosition();
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

    // 3. 展开/收起动画
    function showToolbarAtButtonPosition() {
        const { left: buttonLeft, top: buttonTop } = getFloatingButtonPosition();
        const left = Math.max(12, Math.min(buttonLeft, window.innerWidth - measureToolbar.offsetWidth - 12));
        const top = Math.max(80, Math.min(buttonTop, window.innerHeight - measureToolbar.offsetHeight - 12));
        measureToolbar.style.left = `${left}px`;
        measureToolbar.style.top = `${top}px`;
        measureToolbar.style.right = 'auto';
        measureToolbar.style.display = 'flex';
        measureToolbar.classList.remove('is-closing');
        measureToolbar.classList.remove('is-opening');
        void measureToolbar.offsetWidth;
        measureToolbar.classList.add('is-opening');
        setTimeout(() => measureToolbar.classList.remove('is-opening'), 240);
    }

    function collapseToolbar() {
        measureToolbar.classList.remove('is-opening');
        measureToolbar.classList.add('is-closing');
        const toolbarLeft = measureToolbar.offsetLeft || 16;
        const toolbarTop = measureToolbar.offsetTop || 80;
        measureFloatingBtn.style.left = `${toolbarLeft}px`;
        measureFloatingBtn.style.top = `${toolbarTop}px`;
        measureFloatingBtn.style.right = 'auto';
        measureFloatingBtn.style.transform = 'none';
        measureFloatingBtn.style.display = 'flex';
        setTimeout(() => {
            measureToolbar.style.display = 'none';
            measureToolbar.classList.remove('is-closing');
        }, 220);
    }

    document.getElementById('toolbarBackBtn').addEventListener('click', collapseToolbar);

    document.getElementById('toolbarExitBtn').addEventListener('click', () => {
        measureTools.clear();
        measureToolbar.classList.remove('is-opening');
        measureToolbar.classList.add('is-closing');
        setTimeout(() => {
            measureToolbar.style.display = 'none';
            measureToolbar.classList.remove('is-closing');
        }, 220);
        measureFloatingBtn.style.display = 'none';
        viewer.canvas.style.cursor = 'default';
        showToast('✅ 已退出测量模式');
    });

    // 4. 拖拽功能
    let isDragging = false;
    let hasDragged = false;
    let suppressClick = false; 
    let startX, startY, initialLeft, initialTop;

    function getClientPos(e) {
        if (e.clientX !== undefined) return { x: e.clientX, y: e.clientY };
        if (e.touches && e.touches.length > 0) return { x: e.touches[0].clientX, y: e.touches[0].clientY };
        return { x: 0, y: 0 };
    }

    function startDrag(e) {
        isDragging = true;
        hasDragged = false;
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
        if (hasDragged) {
            setTimeout(() => { suppressClick = false; hasDragged = false; }, 100);
        }
    }

    measureFloatingBtn.addEventListener('mousedown', startDrag);
    measureFloatingBtn.addEventListener('touchstart', startDrag, {passive: false});
    document.addEventListener('mousemove', drag);
    document.addEventListener('touchmove', drag, {passive: false});
    document.addEventListener('mouseup', endDrag);
    document.addEventListener('touchend', endDrag);

    measureFloatingBtn.addEventListener('click', () => {
        if (suppressClick) return;
        measureFloatingBtn.style.display = 'none';
        showToolbarAtButtonPosition();
    });
}