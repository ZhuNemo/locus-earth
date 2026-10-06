import { getBasemaps, getCurrentBasemapId, setBasemap } from './imagery.js';
import { showToast } from './utils.js';

// ============================================================================
// 自定义底图选择器
//
// 按钮与右下角相机控件（#camera-controls .ctrl-btn）同规格：48×48 玻璃按钮，
// 挂载于相机控件列顶部（见 css/basemap-picker.css）；
// 点击后菜单在整列按钮的左侧展开，高度随内容自适应、超出可滚动。
// 菜单展开期间给宿主列加 .basemap-open，把整列抬到最上层避免被遮挡。
// ============================================================================

// 按钮图标：层叠底图（线性风格，与头部/功能栏的 SVG 图标一致）
const BTN_ICON_SVG = `
<svg viewBox="0 0 24 24" width="24" height="24" fill="none"
     stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path d="m12 2 9 5-9 5-9-5 9-5Z"/>
    <path d="m3 12 9 5 9-5"/>
    <path d="m3 17 9 5 9-5"/>
</svg>`;

let pickerRoot = null;
let menuEl = null;
let buttonEl = null;
let hostEl = null; // 宿主容器（#camera-controls，菜单展开时在其上加 .basemap-open）
let isOpen = false;

// ---------- 选中态 ----------
function refreshSelected() {
    const current = getCurrentBasemapId();
    menuEl.querySelectorAll('.basemap-item').forEach((item) => {
        item.classList.toggle('selected', item.dataset.id === current);
    });
}

// ---------- 开合 ----------
function openMenu() {
    isOpen = true;
    menuEl.classList.add('open');
    buttonEl.classList.add('active');
    buttonEl.setAttribute('aria-expanded', 'true');
    // 展开期间把宿主列抬到最上层，避免菜单被头部/展开面板遮挡
    if (hostEl) hostEl.classList.add('basemap-open');
    refreshSelected();
    // 展开后如果菜单超出视口底部，让当前选中项滚进可视区
    requestAnimationFrame(() => {
        const selected = menuEl.querySelector('.basemap-item.selected');
        if (selected) selected.scrollIntoView({ block: 'nearest' });
    });
}

function closeMenu() {
    isOpen = false;
    menuEl.classList.remove('open');
    buttonEl.classList.remove('active');
    buttonEl.setAttribute('aria-expanded', 'false');
    if (hostEl) hostEl.classList.remove('basemap-open');
}

function toggleMenu() {
    isOpen ? closeMenu() : openMenu();
}

// ---------- 切换底图 ----------
function selectBasemap(item, id) {
    closeMenu();
    if (id === getCurrentBasemapId()) return;

    item.classList.add('loading');
    setBasemap(id)
        .then(() => {
            refreshSelected();
        })
        .catch(() => {
            showToast('⚠️ 底图切换失败，请检查网络后重试');
        })
        .finally(() => {
            item.classList.remove('loading');
        });
}

// ---------- 构建 DOM ----------
function buildMenu() {
    menuEl = document.createElement('div');
    menuEl.className = 'basemap-menu';
    menuEl.setAttribute('role', 'menu');
    menuEl.id = 'basemapMenu';

    for (const basemap of getBasemaps()) {
        const item = document.createElement('button');
        item.type = 'button';
        item.className = 'basemap-item';
        item.dataset.id = basemap.id;
        item.title = basemap.tooltip;
        item.setAttribute('role', 'menuitemradio');
        item.setAttribute('aria-label', basemap.name);

        const icon = document.createElement('img');
        icon.className = 'basemap-item-icon';
        icon.src = basemap.icon;
        icon.alt = '';
        icon.draggable = false;
        icon.loading = 'lazy';

        const name = document.createElement('span');
        name.className = 'basemap-item-name';
        name.textContent = basemap.name;

        item.appendChild(icon);
        item.appendChild(name);
        item.addEventListener('click', () => selectBasemap(item, basemap.id));
        menuEl.appendChild(item);
    }
}

export function initBasemapPicker() {
    if (pickerRoot) return;

    pickerRoot = document.createElement('div');
    pickerRoot.id = 'basemapPicker';

    buttonEl = document.createElement('button');
    buttonEl.type = 'button';
    buttonEl.id = 'basemapBtn';
    buttonEl.title = '底图选择';
    buttonEl.setAttribute('aria-label', '选择底图');
    buttonEl.setAttribute('aria-expanded', 'false');
    buttonEl.setAttribute('aria-controls', 'basemapMenu');
    buttonEl.innerHTML = BTN_ICON_SVG;

    buildMenu();

    pickerRoot.appendChild(buttonEl);
    pickerRoot.appendChild(menuEl);
    // 挂载到右下角相机控件列顶部，与指南针等按钮纵向对齐、间距一致
    const cameraControls = document.getElementById('camera-controls');
    hostEl = cameraControls || document.body;
    if (cameraControls) {
        cameraControls.insertBefore(pickerRoot, cameraControls.firstChild);
    } else {
        document.body.appendChild(pickerRoot);
    }

    buttonEl.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleMenu();
    });

    // 点击外部关闭（捕获阶段，避免被全局 contextmenu/其他处理器干扰）
    document.addEventListener('pointerdown', (e) => {
        if (isOpen && pickerRoot && !pickerRoot.contains(e.target)) {
            closeMenu();
        }
    }, true);

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && isOpen) {
            closeMenu();
        }
    });

    refreshSelected();
}

// ---------- 供 google-mode 隐藏/恢复 ----------
export function setBasemapPickerVisible(visible) {
    if (pickerRoot) {
        pickerRoot.style.display = visible ? '' : 'none';
        if (!visible) closeMenu();
    }
}
