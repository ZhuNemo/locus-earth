import { Cartesian3, IonGeocoderService, GeocoderService } from 'cesium';
import { showToast } from './utils.js';

// ============================================================================
// 地点搜索
// ----------------------------------------------------------------------------
// 位于可展开面板内部、两个开关的上方，圆角横向长搜索栏（宽度自适应）。
//
// 数据源：Cesium ion 官方地理编码服务（IonGeocoderService → 内部转发到
// PeliasGeocoderService，底层为 Pelias/OSM），复用项目已有的
// CONFIG.cesiumToken，无需额外密钥。
//
// 返回值注意（已按 Cesium 1.118 源码核对，不是想当然）：
//   · 结果对象字段是 displayName（Pelias 的 properties.label 整串），
//     并没有 name / description 两个字段；
//   · destination 多数情况下是 Rectangle（由 feature.bbox 构造），
//     只有无 bbox 时才是 Cartesian3。所以定位必须分情况处理：
//     Rectangle → camera.flyTo({ destination: rectangle }) 自动取景；
//     Cartesian3 → 再叠一个高度，否则会贴在球面上。
//
// 与 Google 地球模式的关系：Google 模式虽然把相机送到固定坐标（香港），
// 但搜索是独立相机操作，不受底图/地形影响，因此在 Google 模式下
// 搜索仍然可用（搜到后按同一套飞行逻辑过去，平滑脱离模式预设视角）。
// ============================================================================

const SEARCH_ICON_SVG = `
<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor"
     stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">
    <circle cx="11" cy="11" r="7"/>
    <path d="m20 20-3.6-3.6"/>
</svg>`;

const CLEAR_ICON_SVG = `
<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor"
     stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">
    <path d="M18 6 6 18M6 6l12 12"/>
</svg>`;

// 输入防抖：避免每敲一个字都打一次网络请求
const DEBOUNCE_MS = 420;

// 无 bbox 时（Cartesian3 结果）补的高度
const POINT_FALLBACK_HEIGHT = 40000;

let viewerRef = null;
let service = null;

// DOM
let rootEl = null;
let inputEl = null;
let clearBtnEl = null;
let listEl = null;

// 状态
let items = [];
let activeIndex = -1;
let debounceTimer = null;
let requestSeq = 0;      // 递增序号，丢弃过期响应

// ---------- 结果字段读取（兼容 displayName / name 两种形态）----------
function getResultLabel(item) {
    return item?.displayName || item?.name || '未命名地点';
}

// ---------- 本地地名匹配（中文输入时 ion 覆盖较差，做一层兜底）----------
// 只是一个"常用地名速查表"，命中即本地定位、不发请求；
// 未命中则走 ion 官方服务，两者互不干扰。
// destination 统一存 Cartesian3 并显式带高度。
const LOCAL_PLACES = [
    { keys: ['北京', 'beijing'], name: '北京', lon: 116.4074, lat: 39.9042, height: 40000 },
    { keys: ['上海', 'shanghai'], name: '上海', lon: 121.4737, lat: 31.2304, height: 40000 },
    { keys: ['广州', 'guangzhou'], name: '广州', lon: 113.2644, lat: 23.1291, height: 40000 },
    { keys: ['深圳', 'shenzhen'], name: '深圳', lon: 114.0579, lat: 22.5431, height: 40000 },
    { keys: ['香港', 'hong kong'], name: '中国香港', lon: 114.1694, lat: 22.3193, height: 30000 },
    { keys: ['澳门', 'macao', 'macau'], name: '中国澳门', lon: 113.5439, lat: 22.1987, height: 20000 },
    { keys: ['台北', 'taipei'], name: '中国台湾 · 台北', lon: 121.5654, lat: 25.033, height: 30000 },
    { keys: ['成都', 'chengdu'], name: '成都', lon: 104.0665, lat: 30.5723, height: 40000 },
    { keys: ['杭州', 'hangzhou'], name: '杭州', lon: 120.1551, lat: 30.2741, height: 40000 },
    { keys: ['西安', 'xian', "xi'an"], name: '西安', lon: 108.9398, lat: 34.3416, height: 40000 },
    { keys: ['重庆', 'chongqing'], name: '重庆', lon: 106.5516, lat: 29.563, height: 40000 },
    { keys: ['南京', 'nanjing'], name: '南京', lon: 118.7969, lat: 32.0603, height: 40000 },
    { keys: ['武汉', 'wuhan'], name: '武汉', lon: 114.3055, lat: 30.5928, height: 40000 },
    { keys: ['东京', 'tokyo'], name: '东京', lon: 139.6917, lat: 35.6895, height: 40000 },
    { keys: ['纽约', 'new york'], name: '纽约', lon: -74.006, lat: 40.7128, height: 40000 },
    { keys: ['伦敦', 'london'], name: '伦敦', lon: -0.1276, lat: 51.5072, height: 40000 },
    { keys: ['巴黎', 'paris'], name: '巴黎', lon: 2.3522, lat: 48.8566, height: 40000 },
    { keys: ['悉尼', 'sydney'], name: '悉尼', lon: 151.2093, lat: -33.8688, height: 40000 },
    { keys: ['丹佛', 'denver'], name: '丹佛', lon: -104.9903, lat: 39.7392, height: 40000 },
    { keys: ['旧金山', 'san francisco'], name: '旧金山', lon: -122.4194, lat: 37.7749, height: 40000 },
    { keys: ['波士顿', 'boston'], name: '波士顿', lon: -71.0589, lat: 42.3601, height: 40000 },
];

function findLocalPlaces(query) {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return LOCAL_PLACES
        .filter((p) => p.keys.some((k) => k === q || k.startsWith(q) || q.startsWith(k)))
        .map((p) => ({
            displayName: p.name,
            destination: Cartesian3.fromDegrees(p.lon, p.lat, p.height),
        }));
}

// ---------- 下拉列表渲染 ----------
function closeList() {
    if (!listEl) return;
    listEl.classList.remove('open');
    listEl.innerHTML = '';
    // 清掉上一次按视口计算的内联 max-height，交回 CSS 兜底
    listEl.style.maxHeight = '';
    activeIndex = -1;
}

// 根据当前视口，把下拉的可用高度限制在「搜索框下方 → 视口底部」之间。
//
// 为什么必须在运行时算，而不是写死一个 CSS max-height：
//   移动端托盘贴底、搜索栏位于托盘顶部，下拉是向下展开的。
//   视口高度、托盘内容高度一变，"搜索框到屏幕底"的剩余空间就变，
//   写死的 252px 在 852 高的屏幕上只有 164px 可用，于是下拉底部
//   冲到屏幕外、结果被裁剪且无法触达。这里实测后取内联值，
//   保证下拉始终整块可见，超出的条目在下拉内部滚动。
function fitListHeight() {
    if (!listEl || !inputEl) return;
    const field = inputEl.parentElement;          // .search-field
    const fieldBottom = field.getBoundingClientRect().bottom;
    const gap = 6;                                // 与 CSS 的 top: calc(100% + 6px) 对齐
    const dropTop = fieldBottom + gap;
    const margin = 16;                            // 距视口底留白
    // 用可视视口高度（移动端浏览器地址栏收起/展开时 visualViewport 才准）
    const viewportH = (window.visualViewport && window.visualViewport.height) || window.innerHeight;
    const available = viewportH - dropTop - margin;
    // 下限 120px：即使空间很紧也保证能看到 3 条并能滚动
    listEl.style.maxHeight = `${Math.max(120, Math.floor(available))}px`;
}

function renderList(list) {
    items = list;
    activeIndex = -1;

    if (!list.length) {
        closeList();
        return;
    }

    listEl.innerHTML = '';
    list.forEach((item, i) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'search-result-item';
        btn.dataset.index = String(i);

        const icon = document.createElement('span');
        icon.className = 'search-result-icon';
        icon.innerHTML = SEARCH_ICON_SVG;

        const text = document.createElement('span');
        text.className = 'search-result-text';
        text.textContent = getResultLabel(item);

        btn.appendChild(icon);
        btn.appendChild(text);
        listEl.appendChild(btn);
    });

    listEl.classList.add('open');
    // 展开后按当前视口收紧高度，避免超出屏幕底部
    fitListHeight();
}

function highlightActive() {
    if (!listEl) return;
    const nodes = listEl.querySelectorAll('.search-result-item');
    nodes.forEach((n, i) => n.classList.toggle('active', i === activeIndex));
    if (activeIndex >= 0 && nodes[activeIndex]) {
        nodes[activeIndex].scrollIntoView({ block: 'nearest' });
    }
}

// ---------- 飞行到目标 ----------
// destination 可能是 Rectangle（有 bbox，交给 Cesium 自动取景）
// 或 Cartesian3（无 bbox 的点，需要补高度，否则贴球面）
function flyToDestination(destination, label) {
    if (!viewerRef || !destination) return;

    const isPoint = destination instanceof Cartesian3;
    const options = {
        duration: 2,
        complete: () => viewerRef.scene.requestRender?.(),
    };

    if (isPoint) {
        // 点结果：抬高一层，避免直接糊在地表
        const carto = viewerRef.scene.globe.ellipsoid.cartesianToCartographic(destination);
        options.destination = Cartesian3.fromRadians(
            carto.longitude,
            carto.latitude,
            POINT_FALLBACK_HEIGHT
        );
    } else {
        // Rectangle：Cesium 会自动把整个范围框进视野
        options.destination = destination;
    }

    viewerRef.camera.flyTo(options);
    closeList();
    if (label) showToast(`已定位到 ${label}`, 2600, 'pin');
}

// ---------- 官方地理编码查询 ----------
async function queryRemote(query) {
    // service 无法创建时（无 token / 网络受限）静默降级为仅本地匹配
    if (!service) return [];

    const seq = ++requestSeq;
    const results = await service.geocode(query);

    // 丢弃过期响应（用户已继续输入）
    if (seq !== requestSeq) return null;

    return results.map((r) => ({
        displayName: r.displayName,
        destination: r.destination,   // Rectangle 或 Cartesian3，原样交给 flyTo
    }));
}

function setClearVisible(visible) {
    if (clearBtnEl) clearBtnEl.classList.toggle('show', visible);
}

function loading(show) {
    if (rootEl) rootEl.classList.toggle('loading', show);
}

async function runSearch(rawQuery) {
    const query = rawQuery.trim();
    if (!query) {
        closeList();
        return;
    }

    // 1. 本地速查表优先（中文常用地名即时命中，零延迟）
    const local = findLocalPlaces(query);
    if (local.length) {
        renderList(local);
        return;
    }

    // 2. 官方服务
    loading(true);
    try {
        const remote = await queryRemote(query);
        if (remote === null) return;   // 已被更新的请求取代
        if (!remote.length) {
            closeList();
            showToast(`未找到「${query}」相关地点`, 2600, 'info');
            return;
        }
        renderList(remote.slice(0, 8));
    } catch (err) {
        console.warn('地点搜索失败:', err);
        closeList();
        showToast('地点搜索失败，请检查网络环境', 3000, 'warn');
    } finally {
        loading(false);
    }
}

function scheduleSearch() {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => runSearch(inputEl.value), DEBOUNCE_MS);
}

// ---------- 构建 DOM ----------
function buildDOM() {
    rootEl = document.createElement('div');
    rootEl.id = 'searchBox';

    const field = document.createElement('div');
    field.className = 'search-field';

    const leading = document.createElement('span');
    leading.className = 'search-leading';
    leading.innerHTML = SEARCH_ICON_SVG;

    inputEl = document.createElement('input');
    inputEl.id = 'searchInput';
    inputEl.type = 'search';
    inputEl.className = 'search-input';
    inputEl.placeholder = '搜索地点…';
    inputEl.autocomplete = 'off';
    inputEl.spellcheck = false;
    inputEl.setAttribute('aria-label', '搜索地点');

    clearBtnEl = document.createElement('button');
    clearBtnEl.type = 'button';
    clearBtnEl.className = 'search-clear';
    clearBtnEl.setAttribute('aria-label', '清空搜索');
    clearBtnEl.innerHTML = CLEAR_ICON_SVG;

    listEl = document.createElement('div');
    listEl.className = 'search-results';
    listEl.setAttribute('role', 'listbox');

    field.appendChild(leading);
    field.appendChild(inputEl);
    field.appendChild(clearBtnEl);
    rootEl.appendChild(field);
    rootEl.appendChild(listEl);

    return rootEl;
}

// ---------- 事件 ----------
function bindEvents() {
    inputEl.addEventListener('input', () => {
        setClearVisible(inputEl.value.length > 0);
        scheduleSearch();
    });

    inputEl.addEventListener('focus', () => {
        if (items.length && listEl.children.length) {
            listEl.classList.add('open');
            fitListHeight();
        }
    });

    // 回车：直接用第一条结果
    inputEl.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            if (items.length) {
                const idx = activeIndex >= 0 ? activeIndex : 0;
                const picked = items[idx];
                flyToDestination(picked.destination, getResultLabel(picked));
            } else {
                // 结果还没回来：立即触发一次查询
                clearTimeout(debounceTimer);
                runSearch(inputEl.value);
            }
            return;
        }

        if (e.key === 'Escape') {
            if (listEl.classList.contains('open')) {
                closeList();
            } else {
                inputEl.blur();
            }
            return;
        }

        if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
            if (!items.length) return;
            e.preventDefault();
            const dir = e.key === 'ArrowDown' ? 1 : -1;
            activeIndex = (activeIndex + dir + items.length) % items.length;
            highlightActive();
        }
    });

    clearBtnEl.addEventListener('click', (e) => {
        e.stopPropagation();
        inputEl.value = '';
        setClearVisible(false);
        items = [];
        closeList();
        inputEl.focus();
    });

    // 点击结果项
    listEl.addEventListener('click', (e) => {
        const btn = e.target.closest('.search-result-item');
        if (!btn) return;
        const picked = items[Number(btn.dataset.index)];
        if (picked) flyToDestination(picked.destination, getResultLabel(picked));
    });

    // 点击外部关闭下拉
    document.addEventListener('pointerdown', (e) => {
        if (rootEl && !rootEl.contains(e.target)) closeList();
    }, true);

    // 阻止面板/地图的快捷键抢走输入
    rootEl.addEventListener('keydown', (e) => e.stopPropagation());
    rootEl.addEventListener('pointerdown', (e) => e.stopPropagation());

    // 视口变化（移动端地址栏伸缩、横竖屏切换）时重新收紧下拉高度
    const refit = () => {
        if (listEl && listEl.classList.contains('open')) fitListHeight();
    };
    window.addEventListener('resize', refit, { passive: true });
    window.addEventListener('orientationchange', refit, { passive: true });
    if (window.visualViewport) {
        window.visualViewport.addEventListener('resize', refit, { passive: true });
    }
}

// ---------- 初始化 ----------
export function initSearch(viewer) {
    if (rootEl) return;

    viewerRef = viewer;

    // 官方地理编码服务：复用已有 Cesium ion token
    try {
        service = new IonGeocoderService({ scene: viewer.scene });
    } catch (err) {
        console.warn('地理编码服务初始化失败，搜索降级为本地地名:', err);
        service = null;
    }

    const panel = document.getElementById('expandablePanel');
    if (!panel) {
        console.warn('未找到可展开面板，搜索框未挂载');
        return;
    }

    buildDOM();
    bindEvents();

    // 插入位置：面板内部的「两个开关之上」，但必须排在手柄（.panel-handle）之后。
    //
    // 为什么不能直接用 panel.firstChild：
    //   移动端底部托盘收起时用 translateY(calc(100% - var(--mobile-bar-h)))
    //   把「整块下移自身高度，只留第一个子元素（手柄）」露在视口里。
    //   一旦把搜索栏插到 firstChild 之前，首个子元素就不再是手柄，
    //   收起后露出来的会是搜索栏的一条，位置完全错乱。
    //   因此这里锚定到手柄之后。
    const handle = panel.querySelector('.panel-handle');
    const anchorRow = panel.querySelector('.panel-row.switches');

    if (anchorRow) {
        // 首选：插到开关行之前（视觉上仍在开关上方，且在手柄之后）
        panel.insertBefore(rootEl, anchorRow);
    } else if (handle) {
        // 兜底：紧跟在手柄后面
        handle.insertAdjacentElement('afterend', rootEl);
    } else {
        panel.insertBefore(rootEl, panel.firstChild);
    }

    // 暴露给调试（可选）
    if (typeof window !== 'undefined') {
        window.__locusGeocoder = service;
        window.__GeocoderService = GeocoderService;  // 便于二次开发时替换服务
    }
}
