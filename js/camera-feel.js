import {
    ScreenSpaceEventHandler,
    ScreenSpaceEventType,
    CameraEventType,
    KeyboardEventModifier,
    Cartesian3,
    Cartographic,
    Matrix3,
    Quaternion,
    EasingFunction,
} from './cesium.js';

// ============================================================================
// 相机手感调校 —— 目标是让地球的操作反馈尽量接近 Google Earth
// ----------------------------------------------------------------------------
// ⚠️ 两个「看着在调、其实没生效」的坑（2026-10-25 对照运行时 Cesium 1.118.2
//    源码逐条核实，不是猜的）：
//
//   1. 惯性是三个**独立标量** inertiaSpin / inertiaTranslate / inertiaZoom，
//      根本**没有** inertia 对象。写 `controller.inertia = { zoom, rotate, tilt }`
//      只是挂了个没人读的自定义属性，等于什么都没做（旧代码正是如此，
//      所以之前调的手感一直没生效）。另外 `rotate` 也不是合法键名。
//
//   2. PINCH 默认**同时**出现在 zoomEventTypes 和 tiltEventTypes 里
//      （1.118.2：tiltEventTypes=[MIDDLE_DRAG, PINCH, {LEFT_DRAG,CTRL}, {RIGHT_DRAG,CTRL}]）。
//      于是双指缩放时 Cesium 还会顺带做两件事：
//        · rotate3D 的 phi ← 「两指连线角度的变化」⇒ 绕 UNIT_Z 自转（earth 乱滚）
//        · rotate3D 的 theta ← 「两指中点 Y 的位移」⇒ 俯仰
//      真手指再稳也有 1~2° 的角度抖动，投到球面上就是明显的乱转/抽搐；
//      松手后还被 inertiaSpin（默认 0.9，衰减时间常数 0.4s）接着滚一段。
//
// 结论：**双指手势整个由本模块接管**，PINCH 从 zoom / tilt 两处都摘掉。
// 三个自由度分开驱动，各自有死区与软启动，互不串扰：
//
//   两指距离    → 缩放（指数映射，朝两指中点推进）
//   两指连线角度 → 航向旋转（顺时针转手指 ⇒ 画面顺时针转）
//   两指纵向平移 → 俯仰（向上拖 ⇒ 视线抬向地平线）
//
// 为什么要自己写而不是复用 Cesium：
//   Cesium 的 pinch 把「角度」和「中点位移」都塞进同一个 angleAndHeight 里，
//   源数据是原始触点坐标、**没有死区**，而我们无法在它内部插一脚做过滤。
//   与其保留一个必然抖的通道，不如整条链路自己做，才能做到"丝滑"。
// ============================================================================

// ---------- 手势映射 ----------
// ⚠️ 双指缩放也自己做，所以 PINCH 不再出现在任何 Cesium 事件列表里。
//    桌面端的滚轮 / 右键拖拽缩放、中键俯仰仍然由 Cesium 负责，不受影响。
const ZOOM_EVENT_TYPES = [
    CameraEventType.RIGHT_DRAG,
    CameraEventType.WHEEL,
];

/** 俯仰：**刻意不含 PINCH**（双指俯仰见下方自定义手势）。 */
const TILT_EVENT_TYPES = [
    CameraEventType.MIDDLE_DRAG,
    { eventType: CameraEventType.LEFT_DRAG, modifier: KeyboardEventModifier.CTRL },
    { eventType: CameraEventType.RIGHT_DRAG, modifier: KeyboardEventModifier.CTRL },
];

// ---------- 双指三自由度手势 ----------
// 这三个数决定"丝滑"的成败，改动前先想清楚：
//   死区太小 → 手指微抖就被当成意图（就是抽搐）
//   死区太大 → 明显转了才动，手感"黏"
// 5.7° 大约是人手能无意识抖出的角度上限；12px 同理。
const TWIST_DEADZONE = 0.10;              // rad（≈5.7°）两指连线的角度死区
const TILT_DEADZONE = 12;                 // px  两指中点的纵向死区
const TWIST_GAIN = 1.0;                   // 手指转多少度，画面转多少度
const TILT_RADIANS_PER_SCREEN = 3.0;      // 拖动满一屏高 ≈ 3.0 rad（≈172°）
// 3.0 的依据：手机上一段舒服的竖滑约 300px，屏高 700px ⇒ 300/700*3.0 ≈ 1.29 rad
// ≈ 74°，正好从俯视推到接近地平线。给 1.6 的话滑满全屏才 92°，实际很难用完。
//
// ⚠️ 这里**不做 EMA 平滑**。试过：按 0.55 的系数对每帧增量做指数平滑，
//    在事件稀疏时（浏览器会合并 touchmove）会实打实吃掉角度 ——
//    实测 40° 的扭转只落地 25°，而且越快的甩动丢得越多。
//    抖动已经由死区挡住，增量直接 1:1 应用才既跟手又准确。
//
// 手势锁轴判据：**累积**缩放比例超过 10% 就认定"这是一次缩放手势"。
// ⚠️ 不能用「单帧距离变化」判断。触点坐标取整会带来 ±1px 抖动，在 120px
//    的两指间距上就是 0.8%，很容易越过单帧阈值 —— 实测那样会让扭转的前几帧
//    被跳过累计，锁轴变晚、角度凭空少掉 7°（16 帧里只落地 10 帧）。
//
// 缩放的定位是"常驻"：它**不参与锁轴**，每一帧都生效。于是——
//   旋转起手 + 中途张指 = 边转边缩放（实测手感良好，用户确认不抽搐）
//   捏合起手 = 本次手势只缩放，不会突然开始转
// 这个不对称是刻意的，详见 touchmove 里的说明。
const ZOOM_LATCH_LIMIT = 0.10;

// ---------- 松手后的滑行 ----------
// 只是"余味"：按 exp(-t/TAU) 衰减，TAU=0.13s ⇒ 约 0.35 秒停住。
// 阈值有下限：慢拖松手时角速度本来就小，不该滑。
const INERTIA_TAU = 0.10;
const INERTIA_MAX_OMEGA = 2.5;   // rad/s，防止甩动过猛
const INERTIA_MIN_START = 0.5;   // rad/s，低于此值不启动滑行（慢拖不该有惯性）
const INERTIA_STOP = 0.02;       // rad/s，低于此值结束滑行

// 两指几乎重合时，距离/角度都没有意义，忽略这次手势
const MIN_PINCH_DISTANCE = 8;

// ---------- 是否允许"边捏边转" ----------
// false（默认）：一次手势里旋转与俯仰只有一个生效，先越过死区者胜 —— 最稳，
//                三种意图绝不会互相污染。
// true：两个轴各自独立锁轴、可同时生效。因为旋转/俯仰本来就是两个正交轴上的
//       刚性旋转（见 rotateAround），叠加起来天然成立，不需要额外几何处理。
// 运行时可在控制台用 __locusSetMultiAxis(true/false) 切换，方便真机试手感。
let allowMultiAxis = false;

/**
 * 开关"边捏边转"（旋转与俯仰同时生效）。
 * @param {boolean} enabled
 */
export function setMultiAxisEnabled(enabled) {
    allowMultiAxis = enabled === true;
}
// 俯仰夹紧：Cesium 里俯视为负角，-90° 是垂直俯视，0 是平视地平线。
// ⚠️ 下限必须就是 -90°（留 1e-6 避开正交点），不能"再收一点"：
//    启动视角本身就接近 -90°，若下限设成 -89.9°，第一次改朝向就会把相机
//    硬顶上去一点 —— 表现为"什么都没拖，画面却跳了一下"（实测踩过）。
const MIN_PITCH = -Math.PI / 2 + 1e-6;
const MAX_PITCH = -0.02;

// ---------- 惯性 ----------
// decay(t, c) = exp(-(1-c) * 25 * t)，c 越大滑得越远。
//   0.90 → 时间常数 0.40s，1 秒后还剩 8%   （Cesium 默认，偏"飘"）
//   0.82 → 1 秒后剩 1% 左右                （接近 Google Earth 的停手即停）
// 缩放单独调低：缩放的惯性会在松手后继续往地面里钻，很容易撞到
// minimumZoomDistance 再被地形钳回来，观感就是"弹一下"。
const INERTIA_SPIN = 0.82;
const INERTIA_ZOOM = 0.64;
const INERTIA_TRANSLATE = 0.82;

// ---------- 双击 / 双指双击缩放 ----------
const DOUBLE_CLICK_ZOOM_DURATION = 0.45;
const ZOOM_STEP_RATIO = 0.5;   // 每次缩到当前高度的 1/2
const DRAG_TOLERANCE_PX = 6;   // 鼠标：按下到松手位移超过此值就不算点击
const TAP_TOLERANCE_PX = 10;   // 触摸：同上（手指比鼠标抖）
const DOUBLE_TAP_MS = 320;
const DOUBLE_TAP_RADIUS_PX = 30;

// ---------- 动态分辨率 ----------
// 旧实现的问题：任何一秒帧率偏低（多半是瓦片正在下载）就降档，下一秒回升再升档，
// 于是画面在"糊→清→糊"之间以 ~1Hz 反复横跳 —— 双指缩放时最明显。
// 现在改为：必须**连续若干秒**偏低才降，且手势进行中/刚结束时一律不动档。
const MIN_SCALE = 1.0;
const LOWER_FPS = 34;
const UPPER_FPS = 57;
// 降档步长大于升档：性能不够时要尽快让出帧率（宁可糊一点），
// 升档要慢，否则刚升上去又掉帧，就是"反复横跳"。
const SCALE_STEP_DOWN = 0.2;
const SCALE_STEP_UP = 0.1;
const SAMPLES_TO_LOWER = 2;    // 连续 2 秒低于 LOWER_FPS
const SAMPLES_TO_RAISE = 4;    // 连续 4 秒高于 UPPER_FPS
const GESTURE_COOLDOWN_MS = 700;

const round1 = (value) => Math.round(value * 10) / 10;

/**
 * 动态分辨率的单次采样决策（纯函数，便于测试）。
 *
 * 迟滞逻辑：必须连续多次同向越界才改档，避免在阈值附近来回横跳。
 * 这正是旧版"画面糊→清→糊"的根源 —— 它只要单次越界就立刻改档。
 *
 * @param {number} fps 本秒帧数
 * @param {number} currentScale 当前分辨率缩放
 * @param {number} maxScale 上限（通常 min(devicePixelRatio, 2)）
 * @param {number} lowStreak 已连续低帧秒数
 * @param {number} highStreak 已连续高帧秒数
 * @returns {{scale: number, lowStreak: number, highStreak: number}}
 */
export function evaluateFpsSample(fps, currentScale, maxScale, lowStreak, highStreak) {
    let scale = currentScale;

    if (fps < LOWER_FPS) {
        lowStreak += 1;
        highStreak = 0;
    } else if (fps > UPPER_FPS) {
        highStreak += 1;
        lowStreak = 0;
    } else {
        lowStreak = 0;
        highStreak = 0;
    }

    if (lowStreak >= SAMPLES_TO_LOWER && currentScale > MIN_SCALE) {
        scale = round1(Math.max(MIN_SCALE, currentScale - SCALE_STEP_DOWN));
        lowStreak = 0;
    } else if (highStreak >= SAMPLES_TO_RAISE && currentScale < maxScale) {
        scale = round1(Math.min(maxScale, currentScale + SCALE_STEP_UP));
        highStreak = 0;
    }

    return { scale, lowStreak, highStreak };
}

/**
 * 初始化相机手感。
 *
 * @param {import('cesium').Viewer} viewer
 */
export function initCameraFeel(viewer) {
    const scene = viewer.scene;
    const controller = scene.screenSpaceCameraController;
    const canvas = viewer.canvas;

    // 触摸事件由我们自己管，禁止浏览器把双指当作页面缩放/滚动
    canvas.style.touchAction = 'none';

    // ----- 1. 手势映射：双指只缩放，不顺带自转/俯仰 -----
    controller.zoomEventTypes = ZOOM_EVENT_TYPES;
    controller.tiltEventTypes = TILT_EVENT_TYPES;

    // ----- 2. 惯性（注意是三个标量，不是对象） -----
    controller.inertiaSpin = INERTIA_SPIN;
    controller.inertiaZoom = INERTIA_ZOOM;
    controller.inertiaTranslate = INERTIA_TRANSLATE;

    // ----- 3. 缩放下限 -----
    // 保持与旧版一致的 50 m（Google Earth 也能贴到很近，不该替用户收窄）。
    // 注意：接近这些高度时相机会被地形高度钳制，每加载一块地形瓦片都可能
    // 修正一次高度 —— 这部分顿挫来自 Cesium 的 adjustHeightForTerrain，
    // 不是手势问题，调手势参数治不了。
    controller.minimumZoomDistance = 50;

    // ----- 4. 手势状态（供分辨率调节判断"是否正在操作"） -----
    // ⚠️ 双指缩放时抬起**一根**手指，并不代表手势结束。按 pointer 计数，
    //    归零才算结束；否则第二根手指还在动的时候就被判定"已松手"，
    //    分辨率会在这半秒里偷偷改档，正是要避免的时机。
    let gestureActive = false;
    let gestureEndAt = 0;
    let activePointers = 0;
    let wheelTimer = null;

    function beginGesture() {
        gestureActive = true;
    }
    function endGesture() {
        gestureActive = false;
        gestureEndAt = performance.now();
    }

    canvas.addEventListener('pointerdown', () => {
        activePointers++;
        beginGesture();
    }, { passive: true });

    const releasePointer = () => {
        activePointers = Math.max(0, activePointers - 1);
        if (activePointers === 0) endGesture();
    };
    // 在 window 上收 up/cancel：手指滑出画布再抬起也能配对
    window.addEventListener('pointerup', releasePointer, { passive: true });
    window.addEventListener('pointercancel', releasePointer, { passive: true });

    // 没有 Pointer Events 的老内核兜底（Cesium 自己也会退回 touch）
    canvas.addEventListener('touchstart', beginGesture, { passive: true });
    canvas.addEventListener('touchend', (event) => {
        if (event.touches.length === 0) endGesture();
    }, { passive: true });
    canvas.addEventListener('touchcancel', endGesture, { passive: true });

    canvas.addEventListener('wheel', () => {
        beginGesture();
        clearTimeout(wheelTimer);
        wheelTimer = setTimeout(endGesture, 220);
    }, { passive: true });

    // ----- 5. 地表拾取（与 bookmarks / streetview 同一套约定） -----
    // 必须 getPickRay + globe.pick（真实地形）；pickEllipsoid 求的是 h≡0 椭球面，
    // 有地形时双击点会偏。
    function pickSurface(windowPosition) {
        try {
            const ray = viewer.camera.getPickRay(windowPosition);
            if (ray) {
                const hit = scene.globe.pick(ray, scene);
                if (hit) return hit;
            }
        } catch (e) {
            // 地形瓦片未就绪等情况会抛错，走兜底
        }
        return viewer.camera.pickEllipsoid(windowPosition, scene.globe.ellipsoid);
    }

    /** 朝屏幕上的某一点拉近一倍。 */
    function zoomAtPosition(position) {
        const picked = scene.pick(position);
        // 点到收藏标记时不缩放，避免"想点标记却把镜头拉走"
        if (picked && picked.id && picked.id._isBookmark) return;

        const cartesian = pickSurface(position);
        if (!cartesian) return;

        const carto = Cartographic.fromCartesian(cartesian);
        const currentHeight = viewer.camera.positionCartographic.height;
        const newHeight = Math.max(
            currentHeight * ZOOM_STEP_RATIO,
            controller.minimumZoomDistance
        );
        if (newHeight >= currentHeight) return;

        viewer.camera.flyTo({
            destination: Cartesian3.fromRadians(carto.longitude, carto.latitude, newHeight),
            duration: DOUBLE_CLICK_ZOOM_DURATION,
            // flyTo 默认是 QUINTIC_IN_OUT（起步很肉）。双击要的是"立刻回应"，
            // 所以换成二次缓出。
            easingFunction: EasingFunction.QUADRATIC_OUT,
        });
    }

    // ----- 6. 桌面双击 -----
    // ⚠️ 旧实现用 pointerup 把 hasMovedSincePointerDown 清成 false，
    // 而 LEFT_DOUBLE_CLICK 是在所有 up 之后才派发的 ⇒ 守卫永远读到 false，
    // 等于「拖完一段再双击」也会触发缩放。改成只在 pointerdown 重置、
    // 由 pointerup 之后仍然保留判定结果。
    const handler = new ScreenSpaceEventHandler(canvas);
    let pointerDownAt = null;
    let pointerDragged = false;

    canvas.addEventListener('pointerdown', (event) => {
        if (event.pointerType === 'touch') return;
        pointerDownAt = { x: event.clientX, y: event.clientY };
        pointerDragged = false;
    }, { passive: true });

    canvas.addEventListener('pointermove', (event) => {
        if (!pointerDownAt || pointerDragged) return;
        if (Math.hypot(event.clientX - pointerDownAt.x, event.clientY - pointerDownAt.y) > DRAG_TOLERANCE_PX) {
            pointerDragged = true;
        }
    }, { passive: true });

    handler.setInputAction((click) => {
        if (pointerDragged) return;
        zoomAtPosition(click.position);
    }, ScreenSpaceEventType.LEFT_DOUBLE_CLICK);

    // ----- 7. 触屏双击 -----
    // iOS Safari 不保证把 touch 双击派发成 Cesium 的 LEFT_DOUBLE_CLICK，所以自己判。
    let lastTap = null;
    let touchStartAt = null;
    let touchDragged = false;

    canvas.addEventListener('touchstart', (event) => {
        if (event.touches.length === 1) {
            const t = event.touches[0];
            touchStartAt = { x: t.clientX, y: t.clientY };
            touchDragged = false;
        } else {
            // 多指落下 ⇒ 这是缩放/其它手势，立即作废待判定的双击，
            // 否则「刚单击过 → 双指捏一下 → 抬起一根」会被误判成双击。
            touchStartAt = null;
            touchDragged = false;
            lastTap = null;
        }
    }, { passive: true });

    canvas.addEventListener('touchmove', (event) => {
        if (!touchStartAt || touchDragged) return;
        if (event.touches.length !== 1) return;
        const t = event.touches[0];
        if (Math.hypot(t.clientX - touchStartAt.x, t.clientY - touchStartAt.y) > TAP_TOLERANCE_PX) {
            touchDragged = true;
        }
    }, { passive: true });

    canvas.addEventListener('touchend', (event) => {
        // 还有手指留在屏幕上 ⇒ 手势未结束
        if (event.touches.length !== 0) {
            lastTap = null;
            return;
        }
        if (!touchStartAt || touchDragged) {
            lastTap = null;
            touchStartAt = null;
            return;
        }

        const touch = event.changedTouches[0];
        const bounds = canvas.getBoundingClientRect();
        const position = {
            x: touch.clientX - bounds.left,
            y: touch.clientY - bounds.top,
        };
        const now = Date.now();
        const isDoubleTap =
            lastTap &&
            now - lastTap.time < DOUBLE_TAP_MS &&
            Math.hypot(position.x - lastTap.x, position.y - lastTap.y) < DOUBLE_TAP_RADIUS_PX;

        touchStartAt = null;

        if (isDoubleTap) {
            event.preventDefault();
            zoomAtPosition(position);
            lastTap = null;
        } else {
            lastTap = { ...position, time: now };
        }
    }, { passive: false });

    // ----- 8. 双指三自由度手势（缩放 / 航向旋转 / 俯仰） -----
    // 分工：
    //   两指距离     → 缩放（指数映射，沿两指中点推进）
    //   两指连线角度 → 绕「手指下方那个地面点」的**竖直轴**旋转
    //   两指纵向平移 → 绕「手指下方那个地面点」的**水平轴**俯仰
    //
    // ⚠️ 核心设计：旋转/俯仰都是把**整台相机**（位置 + 朝向）绕一个"锚点"做
    //    刚性旋转，而不是在原地改朝向。
    //    锚点取手势开始时两指中点下方的地面点 —— 它落在旋转轴上，所以屏幕位置
    //    一动不动，视觉上是"地球表面在手指底下倾斜/转动"。
    //    早期版本用 setView 原地改 pitch/heading，观感是"相机在原地扭头、地表滑走"，
    //    不符合操作直觉，已废弃。
    //
    // 死区 + 锁轴：默认一次手势里旋转与俯仰只有一个生效（先越过死区者胜），
    // 缩放始终可用；allowMultiAxis 打开后两者可同时生效。

    const wrapAngle = (a) => {
        while (a > Math.PI) a -= Math.PI * 2;
        while (a < -Math.PI) a += Math.PI * 2;
        return a;
    };

    /** 把触摸点换算到 canvas 局部坐标（全屏画布时两者相同，但别假设）。 */
    function toCanvasPoint(touch) {
        const rect = canvas.getBoundingClientRect();
        return { x: touch.clientX - rect.left, y: touch.clientY - rect.top };
    }

    /** 取两指的距离、连线角度、中点。 */
    function measurePinch(event) {
        // ⚠️ 按 identifier 固定两指的先后顺序。TouchList 的顺序由"手指落下的先后"
        // 决定，一旦顺序翻过来，atan2 算出的角度会瞬间跳 180°，画面直接翻转。
        const t0 = event.touches[0];
        const t1 = event.touches[1];
        const [first, second] = t0.identifier <= t1.identifier ? [t0, t1] : [t1, t0];

        const a = toCanvasPoint(first);
        const b = toCanvasPoint(second);
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        return {
            distance: Math.hypot(dx, dy),
            angle: Math.atan2(dy, dx),
            midX: (a.x + b.x) / 2,
            midY: (a.y + b.y) / 2,
        };
    }

    /** 拾取屏幕点下方的地面点，作为手势旋转的锚点。 */
    function pickGround(x, y) {
        try {
            const ray = viewer.camera.getPickRay({ x, y });
            if (ray) {
                const hit = scene.globe.pick(ray, scene);
                if (hit) return hit;
            }
        } catch (e) {
            // 地形瓦片未就绪时会抛错，走兜底
        }
        return viewer.camera.pickEllipsoid({ x, y }, scene.globe.ellipsoid);
    }

    // 旋转用的临时量（避免每帧分配）
    const rotScratch = {
        quat: new Quaternion(),
        mat: new Matrix3(),
        offset: new Cartesian3(),
        position: new Cartesian3(),
        direction: new Cartesian3(),
        up: new Cartesian3(),
        axis: new Cartesian3(),
    };

    /**
     * 把相机整体绕「过 anchor、方向为 axis 的直线」刚性旋转 angle。
     * anchor 在轴上 ⇒ 它的屏幕位置完全不动，看起来就是地表在手指下转。
     */
    function rotateAround(anchor, axis, angle) {
        if (!anchor || !Number.isFinite(angle) || Math.abs(angle) < 1e-9) return;

        const camera = viewer.camera;

        Quaternion.fromAxisAngle(axis, angle, rotScratch.quat);
        Matrix3.fromQuaternion(rotScratch.quat, rotScratch.mat);

        Cartesian3.subtract(camera.positionWC, anchor, rotScratch.offset);
        Matrix3.multiplyByVector(rotScratch.mat, rotScratch.offset, rotScratch.offset);
        Cartesian3.add(anchor, rotScratch.offset, rotScratch.position);

        Matrix3.multiplyByVector(rotScratch.mat, camera.directionWC, rotScratch.direction);
        Matrix3.multiplyByVector(rotScratch.mat, camera.upWC, rotScratch.up);

        camera.setView({
            destination: rotScratch.position,
            orientation: { direction: rotScratch.direction, up: rotScratch.up },
        });
    }

    /**
     * 绕锚点处的竖直轴旋转（地表法线方向）⇒ 航向变化。
     * 顺时针转手指 ⇒ 相机逆时针绕轴 ⇒ 画面顺时针转。
     */
    function rotateHeading(anchor, angle) {
        if (!anchor) return;
        scene.globe.ellipsoid.geodeticSurfaceNormal(anchor, rotScratch.axis);
        rotateAround(anchor, rotScratch.axis, angle);
    }

    /**
     * 绕相机的 right 轴（水平、垂直于视线）旋转 ⇒ 俯仰变化，相当于"地表立起来"。
     * 绕 right 转多少，pitch 就变多少（无滚转时二者严格相等），因此可以据此夹紧。
     */
    function rotatePitch(anchor, angle) {
        if (!anchor) return;
        const camera = viewer.camera;
        const next = camera.pitch + angle;
        const clamped = Math.min(MAX_PITCH, Math.max(MIN_PITCH, next));
        const applied = clamped - camera.pitch;
        if (Math.abs(applied) < 1e-6) return;

        Cartesian3.normalize(camera.rightWC, rotScratch.axis);
        rotateAround(anchor, rotScratch.axis, applied);
    }

    /**
     * 沿两指中点推进/后退相机。比例是**指数**映射：
     * 两指距离翻倍 = 高度减半，符合"捏多大幅度就缩放多少"的直觉。
     */
    function applyPinchZoom(ratio, midX, midY) {
        if (!Number.isFinite(ratio) || ratio <= 0) return;

        const camera = viewer.camera;
        const height = camera.positionCartographic.height;
        if (!Number.isFinite(height) || height <= 0) return;

        const targetHeight = height / ratio;
        if (targetHeight < controller.minimumZoomDistance) return; // 已经贴到下限，别再推
        if (Math.abs(height - targetHeight) < 1e-3) return;

        const ray = camera.getPickRay({ x: midX, y: midY });
        if (!ray) return;

        // move 的方向是"相机朝向"，正数前进 ⇒ 高度下降
        camera.move(ray.direction, height - targetHeight);
    }

    // ---------- 松手后的滑行 ----------
    // 很短的余韵：角速度按 exp(-t/TAU) 衰减，TAU=0.13s ⇒ 约 0.35s 停住。
    // ⚠️ 只在"刚才是快速划动"时触发（omega 超过阈值），慢拖松手不会滑。
    let inertiaFrame = 0;

    function stopInertia() {
        if (inertiaFrame) {
            cancelAnimationFrame(inertiaFrame);
            inertiaFrame = 0;
        }
    }

    function startInertia(state) {
        stopInertia();
        if (!state || !state.target) return;

        // 没锁过的轴不该滑
        let omegaHeading = state.twistLatched ? state.omegaHeading : 0;
        let omegaPitch = state.tiltLatched ? state.omegaPitch : 0;

        const clampOmega = (v) => Math.min(INERTIA_MAX_OMEGA, Math.max(-INERTIA_MAX_OMEGA, v));
        omegaHeading = clampOmega(omegaHeading);
        omegaPitch = clampOmega(omegaPitch);

        if (Math.abs(omegaHeading) < INERTIA_MIN_START && Math.abs(omegaPitch) < INERTIA_MIN_START) {
            return;
        }

        const anchor = state.target;
        let last = performance.now();

        const step = (now) => {
            // 限幅：标签页切回来时 dt 可能很大，别一下甩飞
            const dt = Math.min((now - last) / 1000, 0.05);
            last = now;

            if (Math.abs(omegaHeading) > 1e-4) rotateHeading(anchor, omegaHeading * dt);
            if (Math.abs(omegaPitch) > 1e-4) rotatePitch(anchor, omegaPitch * dt);

            const decay = Math.exp(-dt / INERTIA_TAU);
            omegaHeading *= decay;
            omegaPitch *= decay;

            if (Math.abs(omegaHeading) < INERTIA_STOP && Math.abs(omegaPitch) < INERTIA_STOP) {
                inertiaFrame = 0;
                return;
            }
            inertiaFrame = requestAnimationFrame(step);
        };

        inertiaFrame = requestAnimationFrame(step);
    }

    // 手势状态：null = 当前不是双指手势
    let pinch = null;

    function beginPinch(event) {
        stopInertia();

        if (!event.touches || event.touches.length !== 2) {
            pinch = null;
            return;
        }
        const s = measurePinch(event);
        if (s.distance < MIN_PINCH_DISTANCE) {
            // 两指几乎重合：距离太小，角度和比例都没有意义，忽略这次手势
            pinch = null;
            return;
        }
        pinch = {
            distance: s.distance,
            angle: s.angle,
            midY: s.midY,
            // 旋转锚点：手势开始时两指中点下方的地面点。
            // 整个手势期间固定不变（缩放是沿这条射线推进，锚点不会跑）。
            target: pickGround(s.midX, s.midY),
            twistLatched: false,
            tiltLatched: false,
            accumTwist: 0,   // rad
            accumTilt: 0,    // px
            cumRatio: 1,     // 手势内累积缩放比例，用于判断"这是不是一次缩放"
            omegaHeading: 0, // rad/s
            omegaPitch: 0,   // rad/s
            lastAt: performance.now(),
        };
    }

    /** 滑动角速度估计：单帧 d/dt 噪声大，用 EMA 压一压，滑行才不会甩得突兀。 */
    function trackOmega(key, value) {
        if (!pinch) return;
        pinch[key] += (value - pinch[key]) * 0.35;
    }

    canvas.addEventListener('touchstart', (event) => {
        beginPinch(event);
    }, { passive: true });

    canvas.addEventListener('touchmove', (event) => {
        if (!pinch) return;
        if (!event.touches || event.touches.length !== 2) return;

        const s = measurePinch(event);
        if (s.distance < MIN_PINCH_DISTANCE || pinch.distance < MIN_PINCH_DISTANCE) return;

        const now = performance.now();
        const dt = Math.max((now - pinch.lastAt) / 1000, 1e-3);
        pinch.lastAt = now;

        // ---- 缩放：始终生效 ----
        const ratio = s.distance / pinch.distance;
        applyPinchZoom(ratio, s.midX, s.midY);
        pinch.cumRatio *= ratio;

        // ---- 旋转 / 俯仰 ----
        const dAngle = wrapAngle(s.angle - pinch.angle);
        const dMidY = s.midY - pinch.midY;
        const dTilt = -(dMidY / canvas.clientHeight) * TILT_RADIANS_PER_SCREEN;

        // 累积缩放超过阈值 ⇒ 这是一次缩放手势，别把抖动当旋转。
        // 已经锁定的轴不受影响（继续跟随手指）。
        //
        // ⚠️ 这里有一个**刻意保留的不对称**，是实测手感最好的形态，别当 bug 改掉：
        //    · 以旋转起手 ⇒ 轴先锁上 ⇒ 之后张开/收拢两指，旋转与缩放**并行**
        //      （缩放从不参与锁轴，每帧都生效）
        //    · 以捏合起手 ⇒ 累积比例已超阈值 ⇒ 本次手势不会再突然开始旋转
        //    一句话："旋转要先起手，缩放随叫随到"。
        //    反过来放开的话，捏合途中地球会突然转起来，那才是真正让人懵的。
        //    对应测试：7.9「先转后捏」/ 7.10「先捏后转」。
        const zoomGesture = Math.abs(pinch.cumRatio - 1) > ZOOM_LATCH_LIMIT;
        if (zoomGesture) {
            if (!pinch.twistLatched) pinch.accumTwist = 0;
            if (!pinch.tiltLatched) pinch.accumTilt = 0;
        } else {
            pinch.accumTwist += dAngle;
            pinch.accumTilt += dMidY;
        }

        const twistAllowed = allowMultiAxis || !pinch.tiltLatched;
        const tiltAllowed = allowMultiAxis || !pinch.twistLatched;

        // 扭转
        if (pinch.twistLatched) {
            rotateHeading(pinch.target, dAngle * TWIST_GAIN);
            trackOmega('omegaHeading', (dAngle * TWIST_GAIN) / dt);
        } else if (twistAllowed && Math.abs(pinch.accumTwist) > TWIST_DEADZONE) {
            pinch.twistLatched = true;
            // 死区只用来"确认意图"，越过之后把扣掉的那段还给用户，否则发闷
            const excess = pinch.accumTwist - Math.sign(pinch.accumTwist) * TWIST_DEADZONE;
            rotateHeading(pinch.target, excess * TWIST_GAIN);
            trackOmega('omegaHeading', (excess * TWIST_GAIN) / dt);
        }

        // 俯仰
        if (pinch.tiltLatched) {
            rotatePitch(pinch.target, dTilt);
            trackOmega('omegaPitch', dTilt / dt);
        } else if (tiltAllowed && Math.abs(pinch.accumTilt) > TILT_DEADZONE) {
            pinch.tiltLatched = true;
            const excessPx = pinch.accumTilt - Math.sign(pinch.accumTilt) * TILT_DEADZONE;
            const excessRad = -(excessPx / canvas.clientHeight) * TILT_RADIANS_PER_SCREEN;
            rotatePitch(pinch.target, excessRad);
            trackOmega('omegaPitch', excessRad / dt);
        }

        pinch.distance = s.distance;
        pinch.angle = s.angle;
        pinch.midY = s.midY;
    }, { passive: true });

    canvas.addEventListener('touchend', (event) => {
        // 还有两指按着 ⇒ 手势没结束
        if (event.touches && event.touches.length === 2) return;
        if (pinch) startInertia(pinch);
        pinch = null;
    }, { passive: true });

    canvas.addEventListener('touchcancel', () => {
        stopInertia();
        pinch = null;
    }, { passive: true });

    // ----- 9. 动态分辨率（带手势抑制） -----
    const maxScale = () => Math.min(window.devicePixelRatio || 1, 2);
    let currentScale = maxScale();
    let frameCount = 0;
    let lastSampleAt = performance.now();
    let lowStreak = 0;
    let highStreak = 0;

    viewer.resolutionScale = currentScale;

    scene.postRender.addEventListener(() => {
        frameCount++;
        const now = performance.now();
        if (now - lastSampleAt < 1000) return;

        const fps = frameCount;
        frameCount = 0;
        lastSampleAt = now;

        // 正在操作、或刚松手 ⇒ 这段时间的帧率不具代表性（瓦片正涌进来、
        // 帧缓冲刚重建），不采样也不改档，避免"糊→清"反复横跳。
        if (gestureActive || now - gestureEndAt < GESTURE_COOLDOWN_MS) {
            lowStreak = 0;
            highStreak = 0;
            return;
        }

        const next = evaluateFpsSample(fps, currentScale, maxScale(), lowStreak, highStreak);
        lowStreak = next.lowStreak;
        highStreak = next.highStreak;

        if (next.scale !== currentScale) {
            currentScale = next.scale;
            viewer.resolutionScale = currentScale;
        }
    });

    // ----- 10. 调试句柄 -----
    // 与 search.js 的 window.__locusGeocoder 同一性质：便于二次开发与线上排查。
    // 只挂 controller + 一个只读视图取值器，不挂整个 viewer。
    window.__locusCameraFeel = controller;
    window.__locusCameraView = () => {
        const c = viewer.camera;
        return {
            heading: c.heading,
            pitch: c.pitch,
            height: c.positionCartographic.height,
        };
    };
    // 真机上调"边捏边转"用：__locusSetMultiAxis(true)
    window.__locusSetMultiAxis = setMultiAxisEnabled;
}
