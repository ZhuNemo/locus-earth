import {
    ScreenSpaceEventHandler,
    ScreenSpaceEventType,
    Cartesian3,
    Cartographic,
    ConstantPositionProperty,
    sampleTerrainMostDetailed,
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
let markersVisible = true;

// ---------- DOM 引用 ----------
let panel = null;
let listContainer = null;
let closeBtn = null;
let bookmarksBtn = null;

// ---------- 初始化 ----------
// 图钉由 getPinCanvas() 运行时用 Canvas 绘制，不再依赖图标文件。
export function initBookmarks(viewer) {
    viewerInstance = viewer;

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

    // 地形开关切换后重新锁定所有图钉高度（椭球 ↔ 地形，锚点需要重算）
    viewerInstance.scene.terrainProviderChanged.addEventListener(() => reanchorAllBookmarks());

    // 明暗主题切换后同步标签配色。
    // main.js / settings.js 都通过改 html 的 data-theme 生效（含系统主题变化、
    // 设置页改动、其他标签页同步），监听属性即可覆盖全部入口。
    new MutationObserver(refreshBookmarkLabelTheme)
        .observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    
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

// ---------- 拾取地表点 ----------
/**
 * 取「当前渲染出来的地表」与视线的交点。
 *
 * 不能用 camera.pickEllipsoid()：它算的是视线与椭球面（高度恒为 0）的交点，
 * 完全无视地形。倾斜视角下，该交点与用户眼睛看到的地面点相差约
 * 「地形高程 / tan(视线俯角)」—— 山区可达数公里，图钉会落到别的山头上。
 *
 * globe.pick() 与真实渲染的地形网格求交，返回的就是屏幕上那个点；
 * 地形关闭时它自动退化成椭球面交点，因此两种模式下都正确。
 *
 * @returns {{cartesian: Cartesian3, onSurface: boolean}|null}
 *          onSurface=false 表示退化成了椭球面（该处地形瓦片尚未加载）
 */
function pickSurfacePoint(windowPosition) {
    const scene = viewerInstance.scene;
    const camera = viewerInstance.camera;

    try {
        const ray = camera.getPickRay(windowPosition);
        if (ray) {
            const hit = scene.globe.pick(ray, scene);
            if (hit) return { cartesian: hit, onSurface: true };
        }
    } catch (e) {
        // 个别场景模式下求交会抛错，走下面的兜底
    }

    const fallback = camera.pickEllipsoid(windowPosition, scene.globe.ellipsoid);
    return fallback ? { cartesian: fallback, onSurface: false } : null;
}

// ---------- 处理点击事件（标记模式 + Shift） ----------
function handleClick(mousePosition, shiftKey) {
    if (!isMarkingMode && !shiftKey) return;

    const picked = pickSurfacePoint(mousePosition);
    if (!picked) return;
    const cartesian = picked.cartesian;

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

    // 创建图钉实体（拾取到的是真实地表点时直接锁定，不再去查高程）
    const entity = createPin(cartesian, name, picked.onSurface);

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

/**
 * 用 Canvas 绘制 Google Maps 风格的标准图钉（只绘制一次并缓存）。
 * 画布仍是 2x 的 80x100、billboard 显示 40x50，只调整内部图形比例：
 *   · 圆头直径 28（正圆，宽高比 1:1，无椭圆拉伸）
 *   · 尾巴长度 11 ≈ 圆头直径的 39%（短尾，平滑收束，无细长尖刺）
 *   · 圆头直径 : 总高 = 28 : 39 ≈ 1 : 1.39（落在 1.3~1.4 区间）
 * 圆头到尾巴用贝塞尔曲线过渡，且在圆的两侧切点处与圆弧相切（G1 连续）。
 * 尖端即锚点，压缩高度不会让它脱离地表。
 */
let pinCanvas = null;
function getPinCanvas() {
    if (pinCanvas) return pinCanvas;

    const c = document.createElement('canvas');
    c.width = 80;
    c.height = 100;
    const ctx = c.getContext('2d');
    ctx.scale(2, 2); // 之后全部按 1x 坐标绘制

    const cx = 20;
    const headY = 16;   // 钉头圆心
    const headR = 14;   // 钉头半径（直径 28）
    const tipY = 41;    // 尖端（对齐锚点；尾巴 = 41 - 30 = 11）

    // 由尖端向圆作切线，求两侧切点：贝塞尔在这里与圆弧相切，过渡无折角
    const dist = tipY - headY;                                        // 圆心到尖端的距离
    const offY = headR * headR / dist;                                // 切点相对圆心的纵向偏移
    const offX = headR * Math.sqrt(1 - (headR / dist) * (headR / dist)); // 横向偏移
    const leftX = cx - offX, rightX = cx + offX, tangentY = headY + offY;

    // 控制点沿切线方向内缩，保证与圆弧平滑相接
    const ease = 0.3;
    const leftCpX = leftX + (cx - leftX) * ease;
    const leftCpY = tangentY + (tipY - tangentY) * ease;
    const rightCpX = rightX + (cx - rightX) * ease;
    const rightCpY = tangentY + (tipY - tangentY) * ease;

    ctx.beginPath();
    // 尖端 → 左切点（贝塞尔，尖端附近略微外扩，避免形成细长尖刺）
    ctx.moveTo(cx, tipY);
    ctx.bezierCurveTo(cx - 0.7, tipY - 5.5, leftCpX, leftCpY, leftX, tangentY);
    // 左切点 → 右切点：绕钉头上半圈（正圆）
    ctx.arc(cx, headY, headR, Math.atan2(offY, -offX), Math.atan2(offY, offX), false);
    // 右切点 → 尖端
    ctx.bezierCurveTo(rightCpX, rightCpY, cx + 0.7, tipY - 5.5, cx, tipY);
    ctx.closePath();

    // 轻微投影，让图钉在卫星影像上有立体感
    ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
    ctx.shadowBlur = 5;
    ctx.shadowOffsetY = 2;
    ctx.fillStyle = '#EA4335';
    ctx.fill();
    // 不加白描边：卫星影像下白圈显得突兀，保留纯红主体

    // 钉头中心白点
    ctx.beginPath();
    ctx.arc(cx, headY, 4.8, 0, Math.PI * 2);
    ctx.fillStyle = '#FFFFFF';
    ctx.fill();

    pinCanvas = c;
    return c;
}

// ---------- 标签配色：跟随明暗主题 ----------
// 浅色模式：深字 + 白色半透明底；深色模式：浅字 + 深色半透明底。
const LABEL_THEME = {
    light: {
        fillColor: new Color(0.07, 0.09, 0.11, 1),
        backgroundColor: new Color(1, 1, 1, 0.9),
    },
    dark: {
        fillColor: new Color(0.98, 0.98, 0.98, 1),
        backgroundColor: new Color(0.09, 0.11, 0.15, 0.85),
    },
};

function currentThemeKey() {
    return document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
}

// 把当前主题的文字/底色写回某个标签
function applyLabelTheme(entity, key = currentThemeKey()) {
    const theme = LABEL_THEME[key] || LABEL_THEME.light;
    if (!entity || !entity.label) return;
    entity.label.fillColor = theme.fillColor;
    entity.label.backgroundColor = theme.backgroundColor;
}

// 主题切换后刷新地图上所有书签标签
function refreshBookmarkLabelTheme() {
    if (!viewerInstance) return;
    const key = currentThemeKey();
    for (const e of viewerInstance.entities.values) {
        if (e._isBookmark) applyLabelTheme(e, key);
    }
}

// ---------- 高程兜底：仅在拾取退化成椭球面时使用 ----------
/**
 * 正常情况下 createPin() 直接锁定点击到的地表点，不会走到这里。
 * 只有当该处地形瓦片尚未加载、拾取退化成椭球面（高度 0）时，
 * 才去问地形服务要真实高程，避免图钉陷进地里。
 *
 * 不能用 heightReference: CLAMP_TO_GROUND 来兜底：它会在
 * Billboard._updateClamping() 里每帧调 scene.getHeight() 读「当前已加载
 * 瓦片」的高度，而且会把图钉吸到 3D 建筑屋顶上 —— 缩放时 LOD 一变、
 * 建筑一加载，高度就变，这正是早先「图钉漂移」的根源。
 * 这里取回高程后写死进 entity.position 并切回 NONE，之后高度恒定。
 *
 * 采样顺序（都只取地形，不含 3D 建筑）：
 *   1. sampleTerrainMostDetailed() —— 直接问地形服务要最精细高程，
 *      与相机位置、当前 LOD、是否在视野内全部无关
 *   2. scene.sampleHeightMostDetailed() —— 场景采样兜底
 *   3. globe.getHeight() —— 同步兜底
 *   4. 0 —— 椭球面（地形关闭时的正确值）
 */
async function refineTerrainHeight(entity, cartesian) {
    const scene = viewerInstance && viewerInstance.scene;
    if (!scene) return;

    const base = Cartographic.fromCartesian(cartesian);
    if (!base) return;
    const lon = base.longitude;
    const lat = base.latitude;

    const applyHeight = (h) => {
        if (!Number.isFinite(h)) h = 0;
        entity.position = new ConstantPositionProperty(Cartesian3.fromRadians(lon, lat, h));
        if (entity.billboard) entity.billboard.heightReference = HeightReference.NONE;
        if (entity.label) entity.label.heightReference = HeightReference.NONE;
    };

    // 1. 地形服务直查（最可靠）
    //    椭球 provider 没有 availability，直接按 0（椭球面）处理，
    //    避免无谓的采样请求和告警噪音 —— 地形关闭时 0 就是正确高度。
    try {
        const provider = scene.terrainProvider;
        if (provider && provider.availability && typeof sampleTerrainMostDetailed === 'function') {
            const sampled = await sampleTerrainMostDetailed(
                provider,
                [Cartographic.fromRadians(lon, lat, 0)]
            );
            const hit = sampled && sampled[0];
            if (hit && Number.isFinite(hit.height)) {
                applyHeight(hit.height);
                return;
            }
        }
    } catch (e) {
        console.warn('书签地形高程查询失败，改用场景采样：', e);
    }

    // 2. 场景采样兜底
    try {
        if (typeof scene.sampleHeightMostDetailed === 'function') {
            const sampled = await scene.sampleHeightMostDetailed(
                [Cartographic.fromRadians(lon, lat, 0)]
            );
            const hit = sampled && sampled[0];
            if (hit && Number.isFinite(hit.height)) {
                applyHeight(hit.height);
                return;
            }
        }
    } catch (e) {
        console.warn('书签场景高程采样失败，改用同步取值：', e);
    }

    // 3. 同步兜底：当前已加载瓦片的高度（地形关闭时为 0）
    let syncHeight;
    try {
        syncHeight = scene.globe && scene.globe.getHeight
            ? scene.globe.getHeight(Cartographic.fromRadians(lon, lat, 0))
            : undefined;
    } catch (e) {
        syncHeight = undefined;
    }

    // 4. 都没有就用椭球面高度 0
    applyHeight(Number.isFinite(syncHeight) ? syncHeight : 0);
}

// 地形开关切换后重新锁定所有图钉的高度
function reanchorAllBookmarks() {
    for (const item of bookmarks) {
        const entity = viewerInstance.entities.getById(item.entityId);
        if (!entity) continue;
        const base = Cartesian3.fromDegrees(item.lon, item.lat, 0);
        refineTerrainHeight(entity, base).catch(() => {});
    }
}

function createPin(cartesian, name, onSurface = true) {
    // ---------- 尖端对齐（本文件的核心坑）----------
    // Cesium 的 pixelOffset 是「屏幕像素偏移」：负 y = 屏幕向上
    // （_computeScreenSpacePosition 直接在 y 轴朝下的窗口坐标上相加，
    //   着色器里再乘以 mpp 转成眼空间米数，而 mpp = czm_metersPerPixel 正比于深度）。
    // 也就是说：像素偏移在屏幕上是常量，换算到地面却正比于相机距离 ——
    // 相机越高，同样的 N 像素对应的地面距离越大。
    //
    // verticalOrigin BOTTOM 把图片底边（1x 坐标 y=50）对齐到位置点；
    // 画布里尖端在 y=41，即本来就在锚点上方 9px，
    // 所以这里必须用 +9（向下 9px）把尖端压回锚点。
    // 之前写成 -9，等于把尖端又抬高了 9px，合计离锚点 18px：
    // 表现为「尖端浮在点击点上方，相机越高浮得越远，拉到最近才看似归位」。
    //
    // 图片内部 9px 与 pixelOffset 9px 同属屏幕空间，二者在任意深度下精确抵消，
    // 不存在透视误差（billboard 尺寸本身也是按 mpp 缩放的屏幕常量）。
    const entity = viewerInstance.entities.add({
        position: cartesian,
        name: name,
        billboard: {
            image: getPinCanvas(),
            width: 40,
            height: 50,
            verticalOrigin: VerticalOrigin.BOTTOM,
            pixelOffset: new Cartesian2(0, 9),
            // 位置一次性写死，不做每帧贴地：
            // CLAMP_TO_GROUND 会把图钉吸到 3D 建筑屋顶，并随地形 LOD 变化上下跳。
            heightReference: HeightReference.NONE,
            // 有限深度豁免：相机距离 < 5 万米时图钉不被地形/建筑遮挡；
            // 超过 5 万米恢复深度测试，全球视角下仍会被地球正确遮挡（保留地平线剔除）。
            disableDepthTestDistance: 50000,
        },
        label: {
            text: name,
            font: '600 13px system-ui, sans-serif',
            fillColor: LABEL_THEME[currentThemeKey()].fillColor,
            showBackground: true,
            backgroundColor: LABEL_THEME[currentThemeKey()].backgroundColor,
            backgroundPadding: new Cartesian2(7, 4),
            horizontalOrigin: HorizontalOrigin.CENTER,
            verticalOrigin: VerticalOrigin.BOTTOM,
            // 图钉顶端在锚点上方 39px，-46（向上 46px）让标签底边再高出 7px，
            // 避免卫星影像下标签背景压住图钉头顶
            pixelOffset: new Cartesian2(0, -46),
            // 与 billboard 共用同一个位置，锁定后两者永不分离
            heightReference: HeightReference.NONE,
            disableDepthTestDistance: 50000,
        },
        _isBookmark: true
    });
    // 遵循当前显示状态
    try { entity.show = markersVisible; } catch (e) { /* ignore */ }
    // 只有拾取退化成椭球面（该处地形瓦片还没加载）时才去查真实高程，
    // 免得图钉陷进地里；否则直接锁定点击到的表面点，尖端与点击处严丝合缝。
    if (!onSurface) {
        entity.billboard.heightReference = HeightReference.CLAMP_TO_GROUND;
        entity.label.heightReference = HeightReference.CLAMP_TO_GROUND;
        refineTerrainHeight(entity, cartesian).catch(() => {});
    }
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