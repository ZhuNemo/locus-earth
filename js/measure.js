import {
    ScreenSpaceEventHandler,
    ScreenSpaceEventType,
    Cartesian3,
    Cartesian2,
    Color,
    VerticalOrigin,
    CallbackProperty,
    PolygonHierarchy,
    EllipsoidGeodesic,
    BoundingSphere,
    HeadingPitchRange,
} from './cesium.js';
import { showToast, saveBlobFile, safeFileName } from './utils.js';
import { registerEntityDeleter, registerEntityExporter } from './context-menu.js';
import { buildSingleKml } from './kml.js';
import { isDialogOpen } from './dialogs.js';

// ============================================================================
// 测量（测距 = 轨迹 / 测面积 = 图形）
// ----------------------------------------------------------------------------
// 状态分两层：
//   · draft  —— 正在画的那一条：点存在内存里，实体用 CallbackProperty 每帧重算，
//               所以拖动视角时标签与几何始终跟着最新点集。
//   · shapes —— 已保存到收藏夹的测量：实体一次性建好（静态坐标），
//               数据写进 localStorage，可导出 / 导入 / 单独删除。
//
// 之前只有一个 currentEntity，画完就再也留不住；现在两者分开，
// 「完成」按钮把 draft 落成 shape，之后可以继续画下一条。
//
// ⚠️ 贴地约定（与多边形成对）：多边形不设 height / extrudedHeight、也不开
//    perPositionHeight ⇒ 走 GroundPrimitive 贴地形渲染；配对折线必须显式
//    clampToGround: true，否则折线是顶点之间的弦，倾斜视角下轮廓与填充脱节。
// ============================================================================

const STORAGE_KEY = 'measureShapes';

/** Cesium viewer（initMeasureTools 时注入） */
let viewer = null;
/** 已保存的测量：{ id, type, name, points:[{lon,lat,height}], entityId } */
let shapes = [];
/** 正在画的那一条：{ type, positions: Cartesian3[], entity } */
let draft = null;
/** 草稿状态变化回调（measure-ui 用它控制「完成」按钮） */
let draftListener = null;
/** 当前拾取 handler */
let handler = null;

// ---------------------------------------------------------------------------
// 几何计算
// ---------------------------------------------------------------------------

function formatDistance(meters) {
    if (!meters || meters < 0) return '0 米';
    if (meters < 1000) return meters.toFixed(1) + ' 米';
    return (meters / 1000).toFixed(2) + ' 公里';
}

function calculateSurfaceDistance(p1, p2) {
    const c1 = viewer.scene.globe.ellipsoid.cartesianToCartographic(p1);
    const c2 = viewer.scene.globe.ellipsoid.cartesianToCartographic(p2);
    const geodesic = new EllipsoidGeodesic(c1, c2);
    return geodesic.surfaceDistance;
}

function calculateTotalDistance(positions) {
    let total = 0;
    for (let i = 0; i < positions.length - 1; i++) {
        total += calculateSurfaceDistance(positions[i], positions[i + 1]);
    }
    return total;
}

// 球面面积（近似）
function calculateSurfaceArea(points) {
    if (points.length < 3) return 0;
    const radii = viewer.scene.globe.ellipsoid.maximumRadius;
    const cartographics = points.map(p => viewer.scene.globe.ellipsoid.cartesianToCartographic(p));
    let total = 0;
    for (let i = 0; i < cartographics.length; i++) {
        const p1 = cartographics[i];
        const p2 = cartographics[(i + 1) % cartographics.length];
        const deltaLon = p2.longitude - p1.longitude;
        total += deltaLon * (2 + Math.sin(p1.latitude) + Math.sin(p2.latitude));
    }
    total = Math.abs(total * radii * radii / 2.0);
    return total;
}

function toCartesians(points) {
    return (points || []).map(p => Cartesian3.fromDegrees(p.lon, p.lat, p.height || 0));
}

/** 已保存测量的「值」文案，列表与标签共用 */
export function measureShapeSummary(shape) {
    if (!viewer || !shape) return '';
    const positions = toCartesians(shape.points);
    if (shape.type === 'area') {
        return `${positions.length} 个点 · ${(calculateSurfaceArea(positions) / 1000000).toFixed(2)} 平方公里`;
    }
    return `${positions.length} 个点 · ${formatDistance(calculateTotalDistance(positions))}`;
}

/** 地图标签文案：名称 + 值，两行 */
function shapeLabelText(shape) {
    if (!viewer) return shape.name;
    const positions = toCartesians(shape.points);
    const value = shape.type === 'area'
        ? `面积: ${(calculateSurfaceArea(positions) / 1000000).toFixed(2)} 平方公里`
        : `总距离: ${formatDistance(calculateTotalDistance(positions))}`;
    return `${shape.name}\n${value}`;
}

/** 草稿的实时标签 */
function draftLabelText() {
    if (!draft) return '';
    const points = draft.positions;
    if (draft.type === 'distance') {
        if (points.length === 0) return '轻触地图添加起点';
        if (points.length === 1) return '继续轻触添加第二个点';
        let text = '总距离: ' + formatDistance(calculateTotalDistance(points));
        if (points.length > 2) {
            for (let i = 0; i < points.length - 1; i++) {
                text += `\n第${i + 1}段: ${formatDistance(calculateSurfaceDistance(points[i], points[i + 1]))}`;
            }
        }
        return text;
    }
    if (points.length === 0) return '轻触地图添加第一个点';
    if (points.length < 3) return `继续添加点 (${points.length}/3)`;
    return `面积: ${(calculateSurfaceArea(points) / 1000000).toFixed(2)} 平方公里`;
}

// ---------------------------------------------------------------------------
// 实体
// ---------------------------------------------------------------------------

function shapeMaterial(type) {
    return type === 'distance'
        ? new Color(0.0, 0.8, 0.8, 0.8)
        : new Color(0.8, 0.8, 0.0, 0.4);
}

/** 为「已保存」的测量建实体（静态坐标，不随任何状态变化） */
function createShapeEntity(shape) {
    const positions = toCartesians(shape.points);
    if (positions.length < 2) return null;

    const center = BoundingSphere.fromPoints(positions).center;

    const entity = viewer.entities.add({
        position: center,
        name: shape.name,
        polyline: {
            positions,
            width: 2,
            material: shapeMaterial(shape.type),
            // 与多边形贴地渲染成对，见文件头的说明
            clampToGround: true,
        },
        polygon: shape.type === 'area' ? {
            hierarchy: new PolygonHierarchy(positions),
            material: shapeMaterial(shape.type),
        } : undefined,
        label: {
            text: shapeLabelText(shape),
            font: '14px sans-serif',
            fillColor: Color.WHITE,
            showBackground: true,
            backgroundColor: new Color(0, 0, 0, 0.7),
            verticalOrigin: VerticalOrigin.BOTTOM,
            pixelOffset: new Cartesian2(0, -12),
            disableDepthTestDistance: 50000,
        },
        // 供右键/长按菜单识别
        _locusKind: 'measure',
        _measureType: shape.type,
        _measureId: shape.id,
    });

    shape.entityId = entity.id;
    return entity;
}

/** 草稿实体（用 CallbackProperty 实时重算） */
function ensureDraftEntity() {
    if (!draft || draft.entity) return;
    const type = draft.type;
    const material = shapeMaterial(type);

    const labelPos = new CallbackProperty(() => {
        if (!draft || draft.positions.length === 0) return undefined;
        return BoundingSphere.fromPoints(draft.positions).center;
    }, false);

    draft.entity = viewer.entities.add({
        position: labelPos,
        polyline: {
            positions: new CallbackProperty(() => (draft ? draft.positions : []), false),
            width: 2,
            material,

            // ⚠️ 必须与多边形的贴地渲染方式保持一致，否则填充与轮廓会错位。
            //
            // 两条渲染路径本来就不一样：
            //   • 多边形：没有 height/extrudedHeight、也没开 perPositionHeight
            //     ⇒ 走 GroundPrimitive，**贴地形表面渲染**，顶点高度被忽略，
            //       边界会跟着地形起伏走。
            //   • 折线：默认是普通渲染，把顶点**连成直线**。即使顶点高度
            //     取自真实地形（见 pickSurfacePoint），两个顶点之间也只是一条
            //     弦，不会跟着中间的地形起伏 —— 相当于仍是一块悬空的平面。
            //
            // clampToGround: true 把折线交给 GroundPolylinePrimitive，
            // 与多边形共用同一套贴地逻辑，边界严格重合。
            // 若当前场景不支持，Cesium 会自动退回普通渲染，不报错、不崩溃。
            clampToGround: true,
        },
        polygon: type === 'area' ? {
            hierarchy: new CallbackProperty(
                () => new PolygonHierarchy(draft ? draft.positions : []),
                false
            ),
            material,
        } : undefined,
        label: {
            text: new CallbackProperty(draftLabelText, false),
            font: '14px sans-serif',
            fillColor: Color.WHITE,
            showBackground: true,
            backgroundColor: new Color(0, 0, 0, 0.7),
            verticalOrigin: VerticalOrigin.BOTTOM,
            pixelOffset: new Cartesian2(0, -20),
            disableDepthTestDistance: 50000,
        },
        // 草稿也能被右键菜单删（等价于「清除」）
        _locusKind: 'measure',
        _measureType: type,
        _measureId: null,
    });
}

// ---------------------------------------------------------------------------
// 拾取地表点
// ---------------------------------------------------------------------------
// ⚠️ 不能用 camera.pickEllipsoid()：它求的是视线与椭球面（高度恒为 0）的交点，
// 完全无视地形高程 —— 而地形层（Cesium World Terrain）默认开启。
// globe.pick() 直接与真实渲染出来的地形网格求交，返回的就是屏幕上看到的那个点。
// 地形关闭时它自动退化成椭球面交点，两种模式下都正确。
function pickSurfacePoint(windowPosition) {
    const scene = viewer.scene;
    const camera = viewer.camera;
    try {
        const ray = camera.getPickRay(windowPosition);
        if (ray) {
            const hit = scene.globe.pick(ray, scene);
            if (hit) return hit;
        }
    } catch (e) {
        // 个别场景模式下求交会抛错，走下面的兜底
    }
    return camera.pickEllipsoid(windowPosition, scene.globe.ellipsoid);
}

// ---------------------------------------------------------------------------
// 草稿状态
// ---------------------------------------------------------------------------

/** 草稿是否已满足保存条件：测距 ≥2 点 / 测面积 ≥3 点 */
function isDraftReady() {
    if (!draft) return false;
    const count = draft.positions.length;
    return draft.type === 'distance' ? count >= 2 : count >= 3;
}

function draftState() {
    if (!draft) return { ready: false, type: null, points: 0 };
    return { ready: isDraftReady(), type: draft.type, points: draft.positions.length };
}

function notifyDraft() {
    if (draftListener) draftListener(draftState());
}

/** 丢弃正在画的测量（含拆 handler），不影响已保存的图形 */
function discardDraft() {
    if (draft && draft.entity) {
        viewer.entities.remove(draft.entity);
    }
    draft = null;
    if (handler) {
        handler.destroy();
        handler = null;
    }
    if (viewer) viewer.canvas.style.cursor = 'default';
    notifyDraft();
}

/** 开始一条新测量（放弃上一条没保存的草稿） */
function setupHandler(type) {
    discardDraft();
    draft = { type, positions: [], entity: null };
    viewer.canvas.style.cursor = 'crosshair';

    handler = new ScreenSpaceEventHandler(viewer.canvas);

    // 移动端防误触：记录按下和松开的位置，距离小于 5 像素才视为点击
    let mouseDownPos = null;

    handler.setInputAction((event) => {
        mouseDownPos = event.position;
    }, ScreenSpaceEventType.LEFT_DOWN);

    handler.setInputAction((event) => {
        const mouseUpPos = event.position;
        if (mouseDownPos && mouseUpPos) {
            const dx = mouseDownPos.x - mouseUpPos.x;
            const dy = mouseDownPos.y - mouseUpPos.y;
            if (Math.sqrt(dx * dx + dy * dy) < 5) {
                const cartesian = pickSurfacePoint(event.position);
                if (cartesian && draft) {
                    draft.positions.push(cartesian);
                    ensureDraftEntity();
                    notifyDraft();
                }
            }
        }
        mouseDownPos = null;
    }, ScreenSpaceEventType.LEFT_UP);
}

// ---------------------------------------------------------------------------
// 保存 / 删除 / 定位
// ---------------------------------------------------------------------------

function newShapeId() {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return crypto.randomUUID();
    }
    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

/** 建议的默认名称：按类型递增，避开已占用的名字 */
function suggestDraftName() {
    const type = draft ? draft.type : 'distance';
    const label = type === 'area' ? '图形' : '轨迹';
    const used = new Set(shapes.filter(s => s.type === type).map(s => s.name));
    let index = used.size + 1;
    while (used.has(`${label} ${index}`)) index++;
    return `${label} ${index}`;
}

/**
 * 把当前草稿保存成一条正式测量。
 * @param {string} name 名称（空则用建议名）
 * @returns {object|null} 保存后的 shape
 */
function saveDraft(name) {
    if (!isDraftReady()) return null;

    const points = draft.positions.map((position) => {
        const cartographic = viewer.scene.globe.ellipsoid.cartesianToCartographic(position);
        return {
            lon: cartographic.longitude * 180 / Math.PI,
            lat: cartographic.latitude * 180 / Math.PI,
            height: cartographic.height || 0,
        };
    });

    const shape = {
        id: newShapeId(),
        type: draft.type,
        name: (name || '').trim() || suggestDraftName(),
        points,
    };

    // 草稿实体被正式实体取代：先删后建，避免两条几何短暂重叠
    if (draft.entity) viewer.entities.remove(draft.entity);
    draft = null;

    // 收尾：拆掉拾取 handler，光标还原。
    // 与「清除」一致 —— 想再画一条就再点一次「测距 / 测面积」，
    // 否则保存完继续点地图会出现"点了没反应"的困惑（草稿已被置空）。
    if (handler) {
        handler.destroy();
        handler = null;
    }
    viewer.canvas.style.cursor = 'default';

    shapes.push(shape);
    createShapeEntity(shape);
    persist();
    notifyDraft();

    return shape;
}

function removeShape(id) {
    const index = shapes.findIndex(s => s.id === id);
    if (index < 0) return null;

    const [removed] = shapes.splice(index, 1);
    if (removed.entityId) {
        const entity = viewer.entities.getById(removed.entityId);
        if (entity) viewer.entities.remove(entity);
    }
    persist();
    return removed;
}

/**
 * 右键 / 长按菜单的删除入口。
 * 草稿（_measureId 为空）等同于「清除」；已保存的按 id 精确删除。
 */
function deleteMeasureEntity(entity) {
    if (!viewer) return;

    if (!entity._measureId) {
        discardDraft();
        showToast('🧹 已清除当前测量', 2600, 'success');
        return;
    }

    const removed = removeShape(entity._measureId);
    if (!removed) return;
    showToast(
        `🧹 已删除${removed.type === 'area' ? '图形' : '轨迹'}「${removed.name}」`,
        3000,
        'success'
    );
}

/**
 * 右键 / 长按菜单的「导出为单独 KML」入口。
 * 已保存的图形按 id 精确导出；草稿（_measureId 为空）直接从 draft 取点导出，
 * 命名用建议名，行为与「保存」一致、只是不落盘。
 */
async function exportMeasureEntity(entity) {
    if (!viewer) return;

    let shape;
    if (entity._measureId) {
        shape = shapes.find(s => s.id === entity._measureId);
    } else if (draft && draft.positions.length >= (draft.type === 'area' ? 3 : 2)) {
        const points = draft.positions.map((position) => {
            const cartographic = viewer.scene.globe.ellipsoid.cartesianToCartographic(position);
            return {
                lon: cartographic.longitude * 180 / Math.PI,
                lat: cartographic.latitude * 180 / Math.PI,
                height: cartographic.height || 0,
            };
        });
        shape = { type: draft.type, name: suggestDraftName(), points };
    }
    if (!shape) return;

    const typeLabel = shape.type === 'area' ? '图形' : '轨迹';
    const xml = buildSingleKml(shape);
    // 文件名用图形名清洗（去掉路径分隔符 / 禁用字符），避免非法文件名
    const filename = `${safeFileName(shape.name, 'shape')}.kml`;

    try {
        const result = await saveBlobFile(
            new Blob([xml], { type: 'application/vnd.google-earth.kml+xml' }),
            filename,
            `${typeLabel}「${shape.name}」`
        );
        if (result === 'shared' || result === 'downloaded') {
            showToast(`📤 已导出${typeLabel}「${shape.name}」`, 2600, 'success');
        }
    } catch (e) {
        console.warn('导出单个 KML 失败:', e);
        showToast('⚠️ 导出失败', 2600, 'error');
    }
}

// ---------------------------------------------------------------------------
// 持久化
// ---------------------------------------------------------------------------

function persist() {
    try {
        const data = shapes.map(s => ({
            id: s.id,
            type: s.type,
            name: s.name,
            points: s.points,
        }));
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
        console.warn('保存测量数据失败:', e);
    }
}

function loadShapes() {
    let raw = null;
    try {
        raw = localStorage.getItem(STORAGE_KEY);
    } catch (e) {
        return;
    }
    if (!raw) return;

    try {
        const data = JSON.parse(raw);
        if (!Array.isArray(data)) return;

        for (const item of data) {
            const points = Array.isArray(item.points) ? item.points : [];
            const type = item.type === 'area' ? 'area' : 'distance';
            const minPoints = type === 'area' ? 3 : 2;
            if (points.length < minPoints) continue;

            const shape = {
                id: item.id || newShapeId(),
                type,
                name: item.name || '未命名',
                points: points.map(p => ({
                    lon: Number(p.lon),
                    lat: Number(p.lat),
                    height: Number(p.height) || 0,
                })),
            };
            shapes.push(shape);
            createShapeEntity(shape);
        }
    } catch (e) {
        console.warn('加载测量数据失败:', e);
    }
}

// ---------------------------------------------------------------------------
// 对外接口（收藏夹列表 / 导入导出用）
// ---------------------------------------------------------------------------

/** 所有已保存的测量（数据快照，供导出与列表渲染） */
export function getMeasureShapes() {
    return shapes.map(s => ({ id: s.id, type: s.type, name: s.name, points: s.points }));
}

/** 批量导入（收藏夹导入用）。返回实际加入的条数 */
export function addMeasureShapes(list) {
    if (!viewer || !Array.isArray(list)) return 0;

    let added = 0;
    for (const item of list) {
        const type = item.type === 'area' ? 'area' : 'distance';
        const points = Array.isArray(item.points) ? item.points : [];
        if (points.length < (type === 'area' ? 3 : 2)) continue;

        const shape = {
            id: newShapeId(),
            type,
            name: item.name || (type === 'area' ? '图形' : '轨迹'),
            points: points.map(p => ({
                lon: Number(p.lon),
                lat: Number(p.lat),
                height: Number(p.height) || 0,
            })),
        };
        shapes.push(shape);
        createShapeEntity(shape);
        added++;
    }

    if (added > 0) persist();
    return added;
}

/** 收藏夹列表里的删除（带确认后由外部调用） */
export function removeMeasureShape(id) {
    return removeShape(id);
}

/** 定位到某个测量（按包围球飞过去） */
export function flyToMeasureShape(id) {
    if (!viewer) return;
    const shape = shapes.find(s => s.id === id);
    if (!shape) return;

    const positions = toCartesians(shape.points);
    if (positions.length === 0) return;

    const boundingSphere = BoundingSphere.fromPoints(positions);
    const radius = Math.max(boundingSphere.radius, 200);
    viewer.camera.flyToBoundingSphere(boundingSphere, {
        duration: 1.2,
        offset: new HeadingPitchRange(0, -Math.PI / 2, radius * 3),
    });
}

// ---------------------------------------------------------------------------
// 初始化
// ---------------------------------------------------------------------------

export function initMeasureTools(viewerInstance) {
    viewer = viewerInstance;

    // 右键 / 长按菜单的删除回调
    // ⚠️ 菜单按「可删除对象的种类」查表，轨迹与图形是两个不同的 key
    //    （菜单文案要区分「删除轨迹」/「删除图形」），两者共用同一个删除实现。
    registerEntityDeleter('measure-track', deleteMeasureEntity);
    registerEntityDeleter('measure-shape', deleteMeasureEntity);

    // 「导出为单独 KML」：同样按轨迹 / 图形两个 key 登记，共用一个实现
    registerEntityExporter('measure-track', exportMeasureEntity);
    registerEntityExporter('measure-shape', exportMeasureEntity);

    loadShapes();

    // 键盘快捷键（桌面端保留）
    document.addEventListener('keydown', (e) => {
        // 弹窗打开时（命名框里要输入 m / n）与输入框内不响应快捷键
        if (isDialogOpen()) return;
        const target = e.target;
        if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
            return;
        }
        if (e.key === 'm' || e.key === 'M') setupHandler('distance');
        if (e.key === 'n' || e.key === 'N') setupHandler('area');
        if (e.key === 'Escape') discardDraft();
    });

    return {
        startDistance: () => setupHandler('distance'),
        startArea: () => setupHandler('area'),
        clear: discardDraft,
        saveDraft,
        suggestName: suggestDraftName,
        /** 注册草稿状态监听；注册时立即回调一次，便于同步按钮初始状态 */
        onDraftChange(fn) {
            draftListener = fn;
            notifyDraft();
        },
    };
}
