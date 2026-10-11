import { ScreenSpaceEventHandler, ScreenSpaceEventType, Cartographic, Math as CesiumMath } from 'cesium';
import { showToast } from './utils.js';
import { wgs84ToGcj02, outOfChina } from './coord-transform.js';
import { registerTool, claim, release } from './tool-modes.js';

// ============================================================================
// 腾讯街景：入口按钮 + 取点跳转
// ----------------------------------------------------------------------------
// 设计取舍（详见项目记忆 2026-10-10）：
//   · 只做「新标签页跳转」，不引入腾讯 JS SDK（会与 Cesium 争 WebGL 上下文、
//     劫持触摸/窗口事件），也不用 iframe（移动端手势冲突且跨域不可控）。
//   · ⚠️ 腾讯官方网页街景 `map.qq.com/?type=street` 已基本不可用（实测任何坐标
//     都是空白；Bellingcat 记载 "street view available in mobile app only"）。
//     因此改跳 **qq-map.netlify.app** —— 社区维护的第三方查看器（非官方），
//     它用 three.js 自己渲染腾讯全景瓦片，实测可用。
//   · 跳转前先调 `sv.map.qq.com/xf` **反查最近街景点 svid**，带上 pano 参数
//     即可直达街景画面（否则只能落到地图视图，用户还得自己点蓝线）。
//     该接口自带 `Access-Control-Allow-Origin: *`，纯前端可直接 fetch。
//   · 关键：反查接口要的是 GCJ-02，而 Cesium 取到的是 WGS84，
//     因此要用 coord-transform.js 的**正向加密** wgs84ToGcj02()。
//
// ⚠️ 反查用的是**社区逆向出的非公开接口**，无稳定性承诺（随时可能加签名/下线）。
//    因此全程「尽力而为」，并区分三种结果（见 LookupStatus）：
//      found   → 带 pano 直达全景
//      none    → 接口明确说「这里没有采集点」⇒ **不跳转**，只提示（跳过去也没东西看）
//      unknown → 查询失败、覆盖未知 ⇒ 降级跳转，提示措辞不承诺有蓝线
//
// 显示逻辑：进入中国大陆范围（腾讯街景覆盖区）时按钮出现，
// 与「高精度建模」按钮互斥占位（两者不会同时出现）。
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
 * ⚠️ center 参数是「纬度,经度」顺序，与常见的「经度,纬度」相反。
 * ⚠️ 输入必须是 GCJ-02；若传入的是 WGS84，请先调用 wgs84ToGcj02()。
 *
 * 参数说明（均来自该站源码的 URLSearchParams 解析）：
 *   base  底图类型（roadmap / satellite / hybrid / terrain / google）
 *   cov   覆盖层：all = 腾讯采集线 + 社区补生成线 / qqcached / ccf / 空
 *   zoom  地图缩放级别（该站默认 4，这里给 18 = 街道级）
 *   pano  街景场景 ID。**可选**：不带则只打开地图视图，用户需自己点蓝线。
 *
 * @param {number} gcjLng GCJ-02 经度
 * @param {number} gcjLat GCJ-02 纬度
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
 * ⚠️ 必须区分这三种情形——它们对用户的含义完全不同：
 *   'found'    确认有街景，可带 pano 直达全景
 *   'none'     接口正常应答但附近**确实没有**采集点 → 该处真的没蓝线可点，
 *              不该跳转（跳过去只会看到一个空白区域，让用户以为功能坏了）
 *   'unknown'  超时 / 网络失败 / 接口改版 → 覆盖情况**未知**，保留跳转做降级
 */
export const LookupStatus = {
    FOUND: 'found',
    NONE: 'none',
    UNKNOWN: 'unknown',
};

/**
 * 按 GCJ-02 坐标反查最近街景点。
 *
 * ⚠️ 响应体是 **GBK** 编码（`Content-Type: application/javascript;charset=GBK`），
 *    直接用 `.json()` 会得到乱码，必须先取 arrayBuffer 再 TextDecoder('gbk')。
 * ⚠️ 非公开接口。调用方应依据返回的 status 决定「跳转 / 不跳转」。
 *
 * @param {number} gcjLng GCJ-02 经度
 * @param {number} gcjLat GCJ-02 纬度
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

// 复用的地表拾取：与 bookmarks.js / measure.js 完全一致，
// 必须用 globe.pick（真实地形），不能用 pickEllipsoid（椭球面）。
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
 *
 * 流程：取点 → 转 GCJ-02 → 反查 svid → 按结果分流：
 *   · found   → 带 pano 新标签页直达全景
 *   · none    → **不跳转**，只提示「该处暂无覆盖」
 *   · unknown → 降级跳转（不带 pano），提示措辞避免误导
 *
 * @param {import('cesium').Cartesian2} windowPosition 屏幕坐标
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

    // 不带图标：原放大镜 emoji 全站仅此一处，按约定直接删除、不为它新增 SVG。
    showToast('正在查找最近的街景点…');
    const result = await lookupPano(gcjLng, gcjLat);

    // 情形一：确认无街景 —— 不跳转。跳过去也只是一片没有蓝线的空白区域，
    // 反而让用户怀疑功能坏了；留在地图上、给一句明确提示更有用。
    if (result.status === LookupStatus.NONE) {
        // 同上：原禁止 emoji 仅此一处，删除、不新增 SVG
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
        // 情形三：查询失败（网络/超时/接口变更），覆盖情况未知 —— 仍跳转做降级，
        // 但不说"可点击蓝色路线"，因为我们也无法保证那里有路线。
        // 同上：原地图 emoji 仅此一处，删除、不新增 SVG
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
            const dx = downPos.x - up.x;
            const dy = downPos.y - up.y;
            if (Math.sqrt(dx * dx + dy * dy) >= 5) return; // 拖动，不算点击

            // 先退出取点模式：pickModeArmed 置 false 后，后续点击会被上面的
            // 守卫拦掉，不会在反查（异步）期间重复触发。
            // deactivatePickMode 不调 release，所以这里要显式释放互斥锁。
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
