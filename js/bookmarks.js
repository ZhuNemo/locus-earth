import {
    ScreenSpaceEventHandler,
    ScreenSpaceEventType,
    Cartesian3,
    Math as CesiumMath,
    VerticalOrigin,
    HorizontalOrigin,
    Color,
    Cartesian2,
    HeightReference,
} from 'cesium';

// ---------- 状态 ----------
let isMarkingMode = false;
let bookmarks = [];
let viewerInstance = null;
let iconPath = '/icons/pin.png';
let markersVisible = true;

// ---------- DOM 引用 ----------
let panel = null;
let listContainer = null;
let closeBtn = null;
let bookmarksBtn = null;

// ---------- 初始化 ----------
export function initBookmarks(viewer, iconPathParam = '/icons/pin.png') {
    viewerInstance = viewer;
    iconPath = iconPathParam;

    // 获取 DOM 元素
    panel = document.getElementById('bookmarksPanel');
    listContainer = document.getElementById('bookmarksList');
    closeBtn = document.getElementById('closeBookmarksBtn');
    bookmarksBtn = document.getElementById('bookmarksBtn');

    // 如果缺少必要元素，给出警告
    if (!panel || !listContainer || !closeBtn || !bookmarksBtn) {
        console.warn('收藏夹面板元素不完整，请检查 HTML');
        return;
    }

    // 加载已保存的标记
    loadBookmarksFromStorage();

    // 绑定事件
    setupEventHandlers();

    // 设置标记模式按钮
    setupToolbarButton();

    // 设置面板底部按钮（隐藏/显示标记）
    setupFooterButton();
    
    // 跨标签页同步：其他标签页（或设置页）改动了 bookmarks 键。
    // 注意：正常保存与「清除收藏夹」都会触发本事件，
    // 必须用 e.newValue 区分二者，否则一次正常保存就会清空本页数据。
    window.addEventListener('storage', (e) => {
        if (e.key !== 'bookmarks') return;

        removeAllBookmarkEntities();
        bookmarks = [];

        // e.newValue 为 null（removeItem）才是真正的清除指令；
        // 其余情况是别处保存了新数据，必须重新加载而不是丢弃。
        if (e.newValue !== null && e.newValue !== undefined) {
            loadBookmarksFromStorage();
        }

        if (panel && panel.classList.contains('active')) {
            renderBookmarksList();
        }

        console.log(e.newValue === null
            ? '📌 所有收藏标记已从内存和地图中清除'
            : '📌 收藏标记已从其他标签页同步');
    });
}

// ---------- 事件绑定 ----------
function setupEventHandlers() {
    // 打开收藏夹
    bookmarksBtn.addEventListener('click', openBookmarksPanel);

    // 关闭收藏夹
    closeBtn.addEventListener('click', closeBookmarksPanel);
    // 点击面板外部关闭
    document.addEventListener('click', (e) => {
        if (panel && !panel.contains(e.target) && !bookmarksBtn.contains(e.target)) {
            closeBookmarksPanel();
        }
    });

    // 导出按钮
    document.getElementById('exportBookmarksBtn').addEventListener('click', exportBookmarks);

    // 导入按钮 → 触发文件选择
    document.getElementById('importBookmarksBtn').addEventListener('click', () => {
        document.getElementById('importFileInput').click();
    });

    // 文件选择后的处理
    document.getElementById('importFileInput').addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        importBookmarks(file);
        // 重置 input，以便重复选择同一文件
        e.target.value = '';
    });

    // 点击地球事件（标记模式 + Shift）
    const handler = new ScreenSpaceEventHandler(viewerInstance.canvas);
    let mouseDownPos = null;
    let mouseUpPos = null;

    handler.setInputAction((event) => {
        mouseDownPos = event.position;
    }, ScreenSpaceEventType.LEFT_DOWN);

    handler.setInputAction((event) => {
        mouseUpPos = event.position;
        if (mouseDownPos && mouseUpPos) {
            const dx = mouseDownPos.x - mouseUpPos.x;
            const dy = mouseDownPos.y - mouseUpPos.y;
            const dist = Math.sqrt(dx*dx + dy*dy);
            if (dist < 5) {
                handleClick(event.position, event.shiftKey);
            }
        }
        mouseDownPos = null;
        mouseUpPos = null;
    }, ScreenSpaceEventType.LEFT_UP);
}

function setupFooterButton() {
    const btn = document.getElementById('toggleMarkersBtn');
    if (!btn) return;
    // 初始化文本
    btn.textContent = markersVisible ? '隐藏标记' : '显示标记';
    btn.addEventListener('click', (e) => {
        e.stopPropagation();
        setMarkersVisible(!markersVisible);
    });
}

// ---------- 打开/关闭收藏夹 ----------
function openBookmarksPanel() {
    if (!panel) return;
    renderBookmarksList();
    panel.classList.add('active');
}

function closeBookmarksPanel() {
    if (!panel) return;
    panel.classList.remove('active');
}

// ---------- 渲染列表 ----------
function renderBookmarksList() {
    if (!listContainer) return;
    if (bookmarks.length === 0) {
        listContainer.innerHTML = '<div class="empty-message">暂无收藏标记<br>利用浏览器本地缓存存储，删除缓存即导致数据丢失</div>';
        return;
    }

    let html = '';
    bookmarks.forEach((item, index) => {
        const lonStr = item.lon.toFixed(6);
        const latStr = item.lat.toFixed(6);
        html += `
            <div class="bookmark-item" data-index="${index}">
                <div class="info">
                    <div class="name">${escapeHtml(item.name)}</div>
                    <div class="coords">经度: ${lonStr}° 纬度: ${latStr}°</div>
                </div>
                <div class="actions">
                    <button class="locate-btn" data-index="${index}" title="定位">定位</button>
                    <button class="delete-btn" data-index="${index}" title="删除">删除</button>
                </div>
            </div>
        `;
    });
    listContainer.innerHTML = html;

    // 绑定事件
    listContainer.querySelectorAll('.locate-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const idx = parseInt(btn.dataset.index);
            flyToBookmark(idx);
        });
    });

    listContainer.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const idx = parseInt(btn.dataset.index);
            deleteBookmark(idx);
        });
    });

    // 点击整行定位
    listContainer.querySelectorAll('.bookmark-item').forEach(item => {
        item.addEventListener('click', (e) => {
            if (e.target.closest('button')) return;
            const idx = parseInt(item.dataset.index);
            flyToBookmark(idx);
        });
    });
}

// ---------- 工具：转义 HTML ----------
function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

// ---------- 定位到标记 ----------
function flyToBookmark(index) {
    const item = bookmarks[index];
    if (!item) return;
    const cartesian = Cartesian3.fromDegrees(item.lon, item.lat, 5000);
    viewerInstance.camera.flyTo({
        destination: cartesian,
        duration: 1.5
    });
    closeBookmarksPanel(); // 定位后自动关闭面板
}

// ---------- 删除标记 ----------
function deleteBookmark(index) {
    if (!confirm(`确定要删除标记“${bookmarks[index].name}”吗？`)) return;
    const item = bookmarks[index];
    // 从视图中移除实体：用 entityId 精确定位。
    // 旧实现按 name 匹配，遇到同名标记会删错实体并在图上留下孤儿图钉。
    const entityToRemove = viewerInstance.entities.getById(item.entityId);
    if (entityToRemove) {
        viewerInstance.entities.remove(entityToRemove);
    } else {
        console.warn('未找到对应的标记实体，可能已被移除:', item.name);
    }

    // 从数组中移除
    bookmarks.splice(index, 1);

    // 更新存储
    saveBookmarksToStorage();

    // 刷新列表
    renderBookmarksList();
}

// ---------- 处理点击事件（标记模式 + Shift） ----------
function handleClick(mousePosition, shiftKey) {
    if (!isMarkingMode && !shiftKey) return;

    const cartesian = viewerInstance.camera.pickEllipsoid(mousePosition, viewerInstance.scene.globe.ellipsoid);
    if (!cartesian) return;

    const cartographic = viewerInstance.scene.globe.ellipsoid.cartesianToCartographic(cartesian);
    const lon = CesiumMath.toDegrees(cartographic.longitude);
    const lat = CesiumMath.toDegrees(cartographic.latitude);
    const height = cartographic.height || 0;

    const defaultName = `标记 ${bookmarks.length + 1}`;
    const name = prompt('为这个位置命名：', defaultName);
    if (name === null) return;
    if (name.trim() === '') {
        alert('名称不能为空');
        return;
    }

    // 创建图钉实体
    const entity = createPin(cartesian, name);

    // 保存数据
    const newBookmark = {
        id: newBookmarkId(),
        name: name,
        lon: lon,
        lat: lat,
        height: height,
        entityId: entity.id // 存储实体 id 方便删除
    };
    bookmarks.push(newBookmark);
    saveBookmarksToStorage();

    // 如果收藏夹面板打开，刷新列表
    if (panel && panel.classList && panel.classList.contains('active')) {
        renderBookmarksList();
    }

    if (isMarkingMode) {
        toggleMarkingMode(false);
    }
}

// ---------- 创建图钉实体 ----------
function createPin(cartesian, name) {
    const entity = viewerInstance.entities.add({
        position: cartesian,
        name: name,
        billboard: {
            image: iconPath,
            width: 32,
            height: 32,
            verticalOrigin: VerticalOrigin.BOTTOM,
            pixelOffset: new Cartesian2(0, 2), 
            heightReference: HeightReference.CLAMP_TO_GROUND,
        },
        label: {
            text: name,
            font: '14px sans-serif',
            fillColor: Color.BLACK,
            backgroundColor: new Color(1, 1, 1, 0.7),
            pixelOffset: new Cartesian2(0, -38),
            showBackground: true,
            horizontalOrigin: HorizontalOrigin.CENTER,
        },
        _isBookmark: true
    });
    // 遵循当前显示状态
    try { entity.show = markersVisible; } catch (e) { /* ignore */ }
    return entity;
}

// 切换书签实体的显示状态
function setMarkersVisible(visible) {
    markersVisible = visible;
    // 更新所有标记实体的 show 属性
    const entities = viewerInstance.entities.values;
    for (const e of entities) {
        if (e._isBookmark) {
            try { e.show = visible; } catch (err) { /* ignore */ }
        }
    }
    // 更新底部按钮文本（如果存在）
    const btn = document.getElementById('toggleMarkersBtn');
    if (btn) btn.textContent = visible ? '隐藏标记' : '显示标记';
}

// ---------- 工具：生成唯一 id ----------
function newBookmarkId() {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return crypto.randomUUID();
    }
    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

// ---------- 工具：移除地图上所有标记实体 ----------
function removeAllBookmarkEntities() {
    const entities = viewerInstance.entities.values;
    for (let i = entities.length - 1; i >= 0; i--) {
        if (entities[i]._isBookmark) {
            viewerInstance.entities.remove(entities[i]);
        }
    }
}

// ---------- 存储相关 ----------
function saveBookmarksToStorage() {
    const data = bookmarks.map(b => ({
        id: b.id,
        name: b.name,
        lon: b.lon,
        lat: b.lat,
        height: b.height,
        entityId: b.entityId
    }));
    localStorage.setItem('bookmarks', JSON.stringify(data));
}

function loadBookmarksFromStorage() {
    const raw = localStorage.getItem('bookmarks');
    if (!raw) return;
    try {
        const data = JSON.parse(raw);
        data.forEach(item => {
            const cartesian = Cartesian3.fromDegrees(item.lon, item.lat, item.height || 0);
            const entity = createPin(cartesian, item.name);
            bookmarks.push({
                id: item.id,
                name: item.name,
                lon: item.lon,
                lat: item.lat,
                height: item.height || 0,
                entityId: entity.id
            });
        });
    } catch (e) {
        console.warn('加载收藏数据失败:', e);
    }
}

// ---------- 标记模式切换 ----------
function toggleMarkingMode(enable) {
    isMarkingMode = enable;
    const btn = document.getElementById('markModeBtn');
    if (btn) {
        btn.classList.toggle('active', enable);
        viewerInstance.canvas.style.cursor = enable ? 'crosshair' : 'default';
    }
}

// ---------- 工具栏按钮设置 ----------
function setupToolbarButton() {
    const markBtn = document.getElementById('markModeBtn');
    if (markBtn) {
        markBtn.addEventListener('click', () => {
            toggleMarkingMode(!isMarkingMode);
        });
    } else {
        console.warn('未找到 markModeBtn，请在 HTML 中添加按钮');
    }
}

// 导出 toggle 函数
export { toggleMarkingMode, isMarkingMode };

// =============================================
// 导出 / 导入 收藏夹
// =============================================

/**
 * CSV 字段转义：含逗号、双引号或换行的字段用双引号包裹，内部双引号翻倍。
 * 不加转义时，名称里带逗号的标记导出后会多出一列，再导入时被静默跳过。
 */
function csvEscape(value) {
    const s = String(value ?? '');
    return /[",\r\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}

/**
 * 导出当前所有标记为 CSV 字符串
 */
function exportBookmarksToCSV() {
    if (bookmarks.length === 0) {
        alert('没有可导出的标记');
        return null;
    }
    let header = '# Locus Earth 收藏夹导出\n# 格式: 名称,经度,纬度\n';
    const rows = bookmarks.map(b => `${csvEscape(b.name)},${b.lon},${b.lat}`);
    return header + rows.join('\n');
}

/**
 * 下载 CSV 文件
 */
export function exportBookmarks() {
    const csv = exportBookmarksToCSV();
    if (!csv) return;
    // 前置 UTF-8 BOM，避免 Excel 打开时中文名称乱码
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.setAttribute('download', 'locus-earth-bookmarks.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

/**
 * 解析 CSV 文本为二维数组。
 * 支持双引号包裹的字段，字段内可含逗号、换行，以及转义的双引号（""）。
 * 不能用 split(',') / split('\n')：那样会切断被引号包裹的字段。
 */
function parseCsvRows(text) {
    const rows = [];
    let row = [];
    let field = '';
    let inQuotes = false;

    for (let i = 0; i < text.length; i++) {
        const ch = text[i];

        if (inQuotes) {
            if (ch === '"') {
                if (text[i + 1] === '"') {
                    field += '"';
                    i++;
                } else {
                    inQuotes = false;
                }
            } else {
                field += ch;
            }
            continue;
        }

        if (ch === '"') {
            inQuotes = true;
        } else if (ch === ',') {
            row.push(field);
            field = '';
        } else if (ch === '\n' || ch === '\r') {
            if (ch === '\r' && text[i + 1] === '\n') i++;
            row.push(field);
            rows.push(row);
            row = [];
            field = '';
        } else {
            field += ch;
        }
    }

    if (field !== '' || row.length > 0) {
        row.push(field);
        rows.push(row);
    }

    return rows;
}

/**
 * 解析 CSV 内容，返回标记对象数组
 * 格式: 名称,经度,纬度
 * 忽略空行和以 # 开头的注释行
 */
function parseBookmarksFromCSV(text) {
    // 去掉导出时写入的 UTF-8 BOM
    if (text.charCodeAt(0) === 0xfeff) {
        text = text.slice(1);
    }

    const result = [];
    for (const row of parseCsvRows(text)) {
        if (row.length === 1 && row[0].trim() === '') continue;  // 空行
        if (row[0].trimStart().startsWith('#')) continue;        // 注释行

        if (row.length !== 3) {
            console.warn('跳过无效行:', row.join(','));
            continue;
        }

        const name = row[0].trim();
        const lon = parseFloat(row[1].trim());
        const lat = parseFloat(row[2].trim());

        // Number.isFinite 同时排除 NaN 与 Infinity
        if (!Number.isFinite(lon) || !Number.isFinite(lat) ||
            lon < -180 || lon > 180 || lat < -90 || lat > 90) {
            console.warn('跳过坐标无效的行:', row.join(','));
            continue;
        }

        result.push({ name: name || '未命名标记', lon, lat });
    }
    return result;
}

/**
 * 导入收藏夹：从文件读取并批量添加
 */
export function importBookmarks(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
        const text = e.target.result;
        const items = parseBookmarksFromCSV(text);
        if (items.length === 0) {
            alert('文件中未找到有效标记数据，请检查格式（名称,经度,纬度）');
            return;
        }
        // 确认导入
        if (!confirm(`找到 ${items.length} 个标记，确认导入？`)) return;

        let addedCount = 0;
        items.forEach(item => {
            const cartesian = Cartesian3.fromDegrees(item.lon, item.lat, 0);
            const entity = createPin(cartesian, item.name);
            bookmarks.push({
                id: newBookmarkId(),
                name: item.name,
                lon: item.lon,
                lat: item.lat,
                height: 0,
                entityId: entity.id
            });
            addedCount++;
        });
        saveBookmarksToStorage();
        // 如果收藏夹面板打开，刷新列表
        if (panel && panel.classList && panel.classList.contains('active')) {
            renderBookmarksList();
        }
        alert(`成功导入 ${addedCount} 个标记`);
    };
    reader.onerror = function() {
        alert('读取文件失败，请重试');
    };
    reader.readAsText(file, 'UTF-8');
}