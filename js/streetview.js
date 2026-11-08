import { ScreenSpaceEventHandler, ScreenSpaceEventType, Cartographic, Math as CesiumMath } from './cesium.js';
import { showToast } from './utils.js';
import { wgs84ToGcj02, outOfChina } from './coord-transform.js';
import { registerTool, claim, release } from './tool-modes.js';
import { isTapSuppressed } from './context-menu.js';

// ============================================================================
// 腾讯街景：入口按钮 + 取点跳转
// ----------------------------------------------------------------------------
// 只做新标签页跳转：不引腾讯 SDK（抢 WebGL 上下文、劫持触摸），不用 iframe（手势冲突）。
// 官方网页街景已不可用，改跳社区查看器 qq-map.netlify.app。
// ⚠️ 跳转前打 sv.map.qq.com/xf 反查 svid 才能直达；接口要 GCJ-02，先 wgs84ToGcj02()。
// ⚠️ 非公开接口，三态：found 直达 / none 不跳 / unknown 降级。详见 docs/pitfalls.md 7.1。
//
// 按钮在中国大陆范围内出现，与「高精度建模」互斥占位。
// ============================================================================

// 中国大陆判定框（与 coord-transform.js 的 outOfChina 同源，略放宽以覆盖边缘城市）
const CHINA_BOUNDS = { minLng: 73.0, maxLng: 135.5, minLat: 18.0, maxLat: 54.0 };

// 第三方查看器（社区维护，非腾讯官方）
const VIEWER_BASE = 'https://qq-map.netlify.app/';

// 腾讯街景「按坐标反查最近场景点」接口。
// ⚠️ 非公开接口（社区逆向），响应为 GBK 编码。
const SV_LOOKUP_URL = 'https://sv.map.qq.com/xf';

// 反查超时。超过就放弃、走降级——不能为了精确度让用户干等。
const LOOKUP_TIMEOUT_MS = 4000;

let viewerInstance = null;
let streetviewBtn = null;
let isInChina = false;
let lastCheckTime = 0;

/**
 * 判断给定坐标是否在中国大陆范围内（腾讯街景覆盖区判定）。
 * @param {number} lng 经度
 * @param {number} lat 纬度
 * @returns {boolean}
 */
export function isInChinaMainland(lng, lat) {
    return (
        lng >= CHINA_BOUNDS.minLng &&
        lng <= CHINA_BOUNDS.maxLng &&
        lat >= CHINA_BOUNDS.minLat &&
        lat <= CHINA_BOUNDS.maxLat
    );
}

/**
 * 拼接 qq-map 查看器 URL。
 *
 * ⚠️ center 是「纬度,经度」，与常见的「经度,纬度」相反；入参必须是 GCJ-02。
 *
 * 参数（取自该站 URLSearchParams）：base 底图类型（roadmap / satellite / hybrid /
 * terrain / google）/ cov 覆盖层（all = 腾讯采集线 + 社区补生成线；可选 qqcached /
 * ccf / 空）/ zoom 缩放级别（该站默认 4，这里 18）/ pano 场景 ID（可选，不带只开地图）。
 *
 * @param {number} gcjLng
 * @param {number} gcjLat
 * @param {{pano?: string, heading?: number, pitch?: number}} [opts]
 * @returns {string} 可直接 window.open 的 URL
 */
export function buildStreetViewUrl(gcjLng, gcjLat, { pano = '', heading = 0, pitch = 0 } = {}) {
    const lat = gcjLat.toFixed(6);
    const lng = gcjLng.toFixed(6);
    let url =
        `${VIEWER_BASE}#base=roadmap&cov=all&zoom=18` +
        `&center=${lat},${lng}`;
    if (pano) {
        url += `&pano=${pano}&heading=${heading}&pitch=${pitch}&svz=0`;
    }
    return url;
}

/**
 * 由 WGS84 坐标直接生成街景 URL（内部完成 GCJ-02 加密）。
 *
 * @param {number} lng WGS84 经度
 * @param {number} lat WGS84 纬度
 * @param {{pano?: string, heading?: number, pitch?: number}} [opts]
 * @returns {string} 街景 URL
 */
export function buildStreetViewUrlFromWgs84(lng, lat, opts) {
    const [gcjLng, gcjLat] = wgs84ToGcj02(lng, lat);
    return buildStreetViewUrl(gcjLng, gcjLat, opts);
}

/**
 * 反查结果状态。
 * ⚠️ 三态含义不同，不能合并：
 *   found   确认有街景，可带 pano 直达
 *   none    接口正常但附近确实没采集点 ⇒ 不跳转（跳过去只有空白）
 *   unknown 超时 / 失败 / 改版 ⇒ 覆盖未知，降级跳转
 */
export const LookupStatus = {
    FOUND: 'found',
    NONE: 'none',
    UNKNOWN: 'unknown',
};

/**
 * 按 GCJ-02 坐标反查最近街景点。
 *
 * ⚠️ 响应体是 GBK，直接 .json() 会乱码：先 arrayBuffer 再 TextDecoder('gbk')。
 * ⚠️ 非公开接口，调用方按 status 决定跳不跳。
 *
 * @param {number} gcjLng
 * @param {number} gcjLat
 * @param {number} [radius=200] 搜索半径（米），接口上限 200
 * @returns {Promise<{status: 'found'|'none'|'unknown', svid?: string, road?: string}>}
 */
export async function lookupPano(gcjLng, gcjLat, radius = 200) {
    const url =
        `${SV_LOOKUP_URL}?lat=${gcjLat.toFixed(6)}&lng=${gcjLng.toFixed(6)}` +
        `&r=${radius}&output=json`;

    // 超时保护：AbortController + setTimeout
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), LOOKUP_TIMEOUT_MS);

    try {
        const res = await fetch(url, { signal: controller.signal });
        if (!res.ok) return { status: LookupStatus.UNKNOWN };

        const buf = await res.arrayBuffer();
        const text = new TextDecoder('gbk').decode(buf);
        const data = JSON.parse(text);

        const detail = data && data.detail;
        // detail 存在但 svid 为空 = 接口明确告诉我们「这里没有采集点」
        if (!detail || !detail.svid) return { status: LookupStatus.NONE };

        return {
            status: LookupStatus.FOUND,
            svid: detail.svid,
            road: detail.road_name || '',
        };
    } catch (e) {
        // 网络失败 / 超时 / 接口改版 / GBK 解码失败 —— 覆盖情况未知，走降级
        console.warn('街景反查失败，降级为坐标跳转:', e);
        return { status: LookupStatus.UNKNOWN };
    } finally {
        clearTimeout(timer);
    }
}

// 地表拾取：与 bookmarks.js / measure.js 一致，用 globe.pick（真实地形）。
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
        // 地形瓦片未加载完等情况会抛错，走兜底
    }
    const fallback = camera.pickEllipsoid(windowPosition, scene.globe.ellipsoid);
    return fallback ? { cartesian: fallback, onSurface: false } : null;
}

/**
 * 在指定屏幕位置打开街景。
 * 取点 → 转 GCJ-02 → 反查 svid → 分流：found 直达 / none 只提示 / unknown 降级跳转。
 *
 * @param {import('cesium').Cartesian2} windowPosition
 */
async function openStreetViewAt(windowPosition) {
    const picked = pickSurfacePoint(windowPosition);
    if (!picked) {
        showToast('⚠️ 未能定位到地表位置');
        return;
    }

    const carto = Cartographic.fromCartesian(picked.cartesian);
    const lng = CesiumMath.toDegrees(carto.longitude);
    const lat = CesiumMath.toDegrees(carto.latitude);

    if (outOfChina(lng, lat)) {
        showToast('⚠️ 该位置在中国境外，腾讯街景暂无覆盖');
        return;
    }

    const [gcjLng, gcjLat] = wgs84ToGcj02(lng, lat);

    // 无图标：不为单个 emoji 新增 SVG（全站约定）
    showToast('正在查找最近的街景点…');
    const result = await lookupPano(gcjLng, gcjLat);

    // 情形一：确认无街景 —— 不跳转，只提示（过去也只有空白，像功能坏了）。
    if (result.status === LookupStatus.NONE) {
        // 同上，不新增 SVG
        showToast('该位置附近没有街景覆盖，换个靠近道路的位置试试');
        return;
    }

    const url = buildStreetViewUrl(gcjLng, gcjLat, {
        pano: result.status === LookupStatus.FOUND ? result.svid : '',
    });
    window.open(url, '_blank', 'noopener,noreferrer');

    if (result.status === LookupStatus.FOUND) {
        // 情形二：反查成功，直达全景
        showToast(result.road ? `🧭 已打开街景（${result.road}）` : '🧭 已在新标签页打开街景');
    } else {
        // 情形三：查询失败，覆盖未知 —— 仍跳转做降级，措辞不承诺有蓝线。
        // 同上
        showToast('未能确认街景覆盖，已打开地图视图');
    }
}

// ---------- 覆盖区检测：进入中国境内则显示按钮 ----------
// 与相机解耦的纯状态函数，便于单测直接驱动（等价于 hd-layers.js 导出按钮引用的做法）
function applyCoverage(lng, lat) {
    const inChina = isInChinaMainland(lng, lat);
    if (inChina === isInChina) return; // 状态未变，不做任何 DOM 操作
    isInChina = inChina;

    if (streetviewBtn) {
        // 空字符串 = 撤掉内联 display:none，让 .action-btn 的 flex 生效
        streetviewBtn.style.display = inChina ? '' : 'none';
    }
    // 按钮被隐藏时，若正处于取点模式，一并退出（避免留下看不见的激活态）
    if (!inChina && pickModeArmed) {
        deactivatePickMode();
        release('streetview');
    }
}

function checkCoverage() {
    if (!viewerInstance) return;
    if (window._isGoogleMode) return;

    const now = Date.now();
    if (now - lastCheckTime < 200) return;
    lastCheckTime = now;

    const carto = viewerInstance.camera.positionCartographic;
    if (!carto) return;

    applyCoverage(
        CesiumMath.toDegrees(carto.longitude),
        CesiumMath.toDegrees(carto.latitude)
    );
}

/**
 * 测试 / 调试钩子：绕过相机，直接按经纬度驱动按钮显隐。
 * @param {number} lng
 * @param {number} lat
 */
export function applyCoverageForTest(lng, lat) {
    applyCoverage(lng, lat);
}

/**
 * 初始化街景功能。
 * @param {import('cesium').Viewer} viewer
 */
export function initStreetView(viewer) {
    viewerInstance = viewer;
    streetviewBtn = document.getElementById('streetviewBtn');
    if (!streetviewBtn) {
        console.warn('未找到 streetviewBtn，街景功能未启用');
        return;
    }

    // 点击 = 切换取点模式（与「标记」一致：开→蓝、关→灰）
    streetviewBtn.addEventListener('click', () => {
        if (pickModeArmed) {
            deactivatePickMode();
            release('streetview');
            showToast('🧭 已取消街景取点');
        } else {
            activatePickMode();
        }
    });

    // 注册到互斥中心：被标记/测量挤掉时，由它来调我们的停用回调
    registerTool('streetview', deactivatePickMode);

    // 相机移动时检测覆盖范围
    viewer.camera.changed.addEventListener(checkCoverage);
    // 初始对齐一次（启动视角在北京上空，应立即显示）
    setTimeout(checkCoverage, 1200);
}

// ---------- 取点模式（可开关） ----------
let pickModeArmed = false;
let pickHandler = null;

/** 进入取点模式：按钮变蓝、光标十字、开始监听下一次点击。 */
function activatePickMode() {
    claim('streetview'); // 先把标记/测量停掉，避免抢点击
    pickModeArmed = true;
    if (streetviewBtn) streetviewBtn.classList.add('active');
    viewerInstance.canvas.style.cursor = 'crosshair';
    showToast('🧭 点击中国任意位置查看街景');

    if (!pickHandler) {
        pickHandler = new ScreenSpaceEventHandler(viewerInstance.canvas);
        let downPos = null;

        pickHandler.setInputAction((e) => {
            downPos = e.position;
        }, ScreenSpaceEventType.LEFT_DOWN);

        pickHandler.setInputAction((e) => {
            if (!pickModeArmed) return;
            const up = e.position;
            if (!downPos) return;
            // 长按菜单的收尾抬手不算取点（见 js/context-menu.js 的 isTapSuppressed）
            if (isTapSuppressed()) return;
            const dx = downPos.x - up.x;
            const dy = downPos.y - up.y;
            if (Math.sqrt(dx * dx + dy * dy) >= 5) return; // 拖动，不算点击

            // 先退出取点模式，避免异步反查期间重复触发。deactivatePickMode 不调
            // release，所以这里显式释放互斥锁。
            deactivatePickMode();
            release('streetview');

            // 反查 + 打开（内部已做异常兜底，不会 reject）
            openStreetViewAt(up);
        }, ScreenSpaceEventType.LEFT_UP);
    }
}

/**
 * 退出取点模式：撤销高亮、恢复光标。
 * ⚠️ 约定：本函数会被互斥中心回调，**不能**再反过来调 release()，
 * 否则 A→B→A 会递归。release() 统一放在 toggle 分支里做。
 */
function deactivatePickMode() {
    if (!pickModeArmed) return;
    pickModeArmed = false;
    if (streetviewBtn) streetviewBtn.classList.remove('active');
    if (viewerInstance) viewerInstance.canvas.style.cursor = 'default';
}

// 兜底超时：避免"武装"状态长时间挂着（原本的 12s 会自动解除）
export function isStreetViewActive() {
    return pickModeArmed;
}
