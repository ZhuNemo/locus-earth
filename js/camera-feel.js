import {
    ScreenSpaceEventHandler,
    ScreenSpaceEventType,
    CameraEventType,
    KeyboardEventModifier,
    Cartesian3,
    Cartographic,
    EasingFunction,
    Math as CesiumMath,
} from 'cesium';

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
const ZOOM_LATCH_LIMIT = 0.10;
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
    // 设计要点见文件头。这里的分工是：
    //   距离 → 缩放（指数映射，朝两指中点推进，和 Google Earth 一致）
    //   角度 → 航向（顺时针转手指 ⇒ 画面顺时针转）
    //   纵向 → 俯仰（向上拖 ⇒ 视线抬向地平线）
    // 三者都做死区 + 锁轴：一次手势里，旋转和俯仰**只会有一个生效**，
    // 先越过死区者胜出。缩放不受锁轴限制，始终可用。

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

    // 手势状态：null = 当前不是双指手势
    let pinch = null;

    function beginPinch(event) {
        if (!event.touches || event.touches.length !== 2) {
            pinch = null;
            return;
        }
        const s = measurePinch(event);
        if (s.distance < 8) {
            // 两指几乎重合：距离太小，角度和比例都没有意义，忽略这次手势
            pinch = null;
            return;
        }
        pinch = {
            distance: s.distance,
            angle: s.angle,
            midY: s.midY,
            axis: null,          // null | 'twist' | 'tilt'
            accumTwist: 0,
            accumTilt: 0,
            cumRatio: 1,         // 手势内累积缩放比例，用于判断"这是不是一次缩放"
            // 锁轴那一刻的朝向快照。之后由手势自己累计，不再回读 camera.heading。
            heading: 0,
            pitch: 0,
        };
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

    /**
     * 在**原地**改朝向：位置不动，只换 heading / pitch。
     * 用 setView 而不是 camera.rotate，是因为 rotate 绕的是"参考系原点"，
     * transform 为单位阵时那是地心 —— 会把相机绕地球转一大圈。
     *
     * ⚠️ 传入的是**绝对**朝向，由手势自己累计（见 pinch.heading / pinch.pitch）。
     *    不要在这里读 camera.heading 再累加：俯仰接近 -90° 时 heading 是病态的，
     *    setView → 读回 的往返会丢角度（实测 40° 的扭转只落地 25°）。
     */
    function applyOrientation(heading, pitch) {
        const camera = viewer.camera;
        const carto = camera.positionCartographic;
        camera.setView({
            destination: Cartesian3.fromRadians(carto.longitude, carto.latitude, carto.height),
            orientation: {
                heading,
                pitch: Math.min(MAX_PITCH, Math.max(MIN_PITCH, pitch)),
                roll: 0,
            },
        });
    }

    canvas.addEventListener('touchstart', (event) => {
        beginPinch(event);
    }, { passive: true });

    canvas.addEventListener('touchmove', (event) => {
        if (!pinch) return;
        if (!event.touches || event.touches.length !== 2) return;

        const s = measurePinch(event);
        if (s.distance < 8 || pinch.distance < 8) return;

        // ---- 缩放：始终生效 ----
        const ratio = s.distance / pinch.distance;
        applyPinchZoom(ratio, s.midX, s.midY);

        // ---- 旋转 / 俯仰：先锁轴，再应用 ----
        const dAngle = wrapAngle(s.angle - pinch.angle);
        const dMidY = s.midY - pinch.midY;

        // 全程累计（不能因为"这一帧像缩放"就跳过，那样会丢角度）
        pinch.accumTwist += dAngle;
        pinch.accumTilt += dMidY;
        pinch.cumRatio *= ratio;

        if (!pinch.axis) {
            if (Math.abs(pinch.cumRatio - 1) > ZOOM_LATCH_LIMIT) {
                // 已经明显在缩放 ⇒ 这次手势就是缩放，清空角度证据，
                // 免得后面某帧突然被误锁成旋转
                pinch.accumTwist = 0;
                pinch.accumTilt = 0;
            } else if (Math.abs(pinch.accumTwist) > TWIST_DEADZONE) {
                pinch.axis = 'twist';
                pinch.heading = viewer.camera.heading;
                pinch.pitch = viewer.camera.pitch;
                // 死区只是"用来确认意图"，越过之后要把扣掉的那段还给用户，
                // 否则转 40° 只走 34°，手感会显得发闷。
                const excess = pinch.accumTwist - Math.sign(pinch.accumTwist) * TWIST_DEADZONE;
                pinch.heading -= excess * TWIST_GAIN;
                applyOrientation(pinch.heading, pinch.pitch);
                // 本帧的 dAngle 已计入 accumTwist，重设基准避免重复应用
                pinch.distance = s.distance;
                pinch.angle = s.angle;
                pinch.midY = s.midY;
                return;
            } else if (Math.abs(pinch.accumTilt) > TILT_DEADZONE) {
                pinch.axis = 'tilt';
                pinch.heading = viewer.camera.heading;
                pinch.pitch = viewer.camera.pitch;
                const excess = pinch.accumTilt - Math.sign(pinch.accumTilt) * TILT_DEADZONE;
                pinch.pitch -= (excess / canvas.clientHeight) * TILT_RADIANS_PER_SCREEN;
                applyOrientation(pinch.heading, pinch.pitch);
                pinch.distance = s.distance;
                pinch.angle = s.angle;
                pinch.midY = s.midY;
                return;
            }
        } else if (pinch.axis === 'twist') {
            // 顺时针转手指（dAngle>0）⇒ 画面顺时针转 ⇒ 航向减小
            pinch.heading -= dAngle * TWIST_GAIN;
            applyOrientation(pinch.heading, pinch.pitch);
        } else {
            // 向上拖（dMidY<0）⇒ 视线抬向地平线 ⇒ pitch 增大
            pinch.pitch -= (dMidY / canvas.clientHeight) * TILT_RADIANS_PER_SCREEN;
            applyOrientation(pinch.heading, pinch.pitch);
        }

        pinch.distance = s.distance;
        pinch.angle = s.angle;
        pinch.midY = s.midY;
    }, { passive: true });

    canvas.addEventListener('touchend', (event) => {
        if (!event.touches || event.touches.length !== 2) pinch = null;
    }, { passive: true });
    canvas.addEventListener('touchcancel', () => { pinch = null; }, { passive: true });

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
}
