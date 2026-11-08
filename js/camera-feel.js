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
// 相机手感：手势映射 / 惯性 / 双击缩放 / 动态分辨率
// ----------------------------------------------------------------------------
// ⚠️ 惯性是三个标量 inertiaSpin / inertiaZoom / inertiaTranslate，没有 inertia 对象。
// ⚠️ PINCH 默认同时出现在 zoomEventTypes 与 tiltEventTypes 里：双指会顺带自转 + 俯仰，
//    且原始触点无死区。两处都摘掉，双指全走本模块自研。
// 分工：两指距离 → 缩放；连线角度 → 航向；纵向平移 → 俯仰。
// 取舍依据与实测数据：docs/pitfalls.md（第 2 节）
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

// ---------- 双指三自由度 ----------
// 死区：5.7° 约为人手无意识抖动的上限，12px 同理。太小抽搐，太大发黏。
const TWIST_DEADZONE = 0.10;              // rad（≈5.7°）两指连线的角度死区
const TILT_DEADZONE = 12;                 // px  两指中点的纵向死区
const TWIST_GAIN = 1.0;                   // 手指转多少度，画面转多少度
const TILT_RADIANS_PER_SCREEN = 3.0;      // 拖动满一屏高 ≈ 3.0 rad（≈172°）
// 3.0：手机上一段 300px 竖滑约 74°，正好从俯视推到接近地平线。
//
// ⚠️ 不做 EMA 平滑：事件稀疏时（浏览器会合并 touchmove）会吃掉角度，
//    实测 40° 扭转只落地 25°。抖动已由死区挡住，增量 1:1 应用。
//
// 锁轴判据用**累积**缩放比例 > 10%，不能用单帧距离变化：
// 触点取整的 ±1px 抖动在 120px 间距上就是 0.8%，会误判成缩放。
//
// 缩放常驻、不参与锁轴，这是刻意的不对称：
//   旋转起手 + 中途张指 = 边转边缩放；捏合起手 = 本次不再转。
const ZOOM_LATCH_LIMIT = 0.10;

// ---------- 松手后的滑行 ----------
// exp(-t/TAU) 衰减，约 0.35 秒停住。角速度低于 INERTIA_MIN_START 不启动（慢拖不该滑）。
const INERTIA_TAU = 0.10;
const INERTIA_MAX_OMEGA = 2.5;   // rad/s，防止甩动过猛
const INERTIA_MIN_START = 0.5;   // rad/s，低于此值不启动滑行（慢拖不该有惯性）
const INERTIA_STOP = 0.02;       // rad/s，低于此值结束滑行

// 两指几乎重合时，距离/角度都没有意义，忽略这次手势
const MIN_PINCH_DISTANCE = 8;

// ---------- 边捏边转 ----------
// false（默认）：旋转与俯仰先越过死区者胜，互不污染。
// true：两轴独立锁轴、可同时生效（旋转与俯仰是正交轴上的刚性旋转，可叠加）。
// 运行时可在控制台用 __locusSetMultiAxis(true/false) 切换，方便真机试手感。
let allowMultiAxis = false;

/**
 * 开关"边捏边转"（旋转与俯仰同时生效）。
 * @param {boolean} enabled
 */
export function setMultiAxisEnabled(enabled) {
    allowMultiAxis = enabled === true;
}
// 俯仰夹紧：Cesium 里俯视为负，-90° 垂直俯视，0 平视。
// ⚠️ 下限必须是 -π/2（留 1e-6 避开正交点）。收一点如 -89.9° 会在启动视角
//    把相机硬顶一下，表现为「没拖，画面却跳」。
const MIN_PITCH = -Math.PI / 2 + 1e-6;
const MAX_PITCH = -0.02;

// ---------- 惯性 ----------
// decay(t, c) = exp(-(1-c) * 25 * t)：0.90 时 1 秒后剩 8%（Cesium 默认，偏飘），0.82 剩 1%。
// 缩放单独调低：否则松手后继续钻地，撞 minimumZoomDistance 被钳回，观感是「弹一下」。
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
// 必须连续多秒同向越界才改档：单次越界就改会在「糊→清→糊」之间以 ~1Hz 横跳。
const MIN_SCALE = 1.0;
const LOWER_FPS = 34;
const UPPER_FPS = 57;
// 降档步长 > 升档：性能不够时尽快让出帧率；升档慢，避免刚升上去又掉帧。
const SCALE_STEP_DOWN = 0.2;
const SCALE_STEP_UP = 0.1;
const SAMPLES_TO_LOWER = 2;    // 连续 2 秒低于 LOWER_FPS
const SAMPLES_TO_RAISE = 4;    // 连续 4 秒高于 UPPER_FPS
const GESTURE_COOLDOWN_MS = 700;

const round1 = (value) => Math.round(value * 10) / 10;

/**
 * 动态分辨率的单次采样决策（纯函数）。
 *
 * 迟滞：连续多次同向越界才改档，避免在阈值附近横跳。
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

    // 双指手势自管，禁止浏览器把触摸当页面缩放/滚动
    canvas.style.touchAction = 'none';

    // ----- 1. 事件映射：摘掉 PINCH，桌面滚轮 / 右键拖拽 / 中键仍交给 Cesium -----
    controller.zoomEventTypes = ZOOM_EVENT_TYPES;
    controller.tiltEventTypes = TILT_EVENT_TYPES;

    // ----- 2. 惯性（三个标量） -----
    controller.inertiaSpin = INERTIA_SPIN;
    controller.inertiaZoom = INERTIA_ZOOM;
    controller.inertiaTranslate = INERTIA_TRANSLATE;

    // ----- 3. 缩放下限 -----
    // 50 m。贴到该高度时相机会被地形高度钳制，每加载一块瓦片都可能修正一次高度：
    // 那部分顿挫来自 Cesium 的 adjustHeightForTerrain，不是手势问题。
    controller.minimumZoomDistance = 50;

    // ----- 4. 手势状态 -----
    // ⚠️ 按 pointer 计数，归零才算结束：双指抬起一根不算松手，
    //    否则第二根还在动时就被判定「已松手」，分辨率趁这半秒改档。
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
    // 收 up/cancel：手指滑出画布再抬起也能配对。
    // ⚠️ 必须挂**捕获阶段**：任何下游 stopPropagation 都会让计数减不到 0，
    //    于是 gestureActive 恒为 true、分辨率再不采样（表现为一直糊）。
    window.addEventListener('pointerup', releasePointer, { passive: true, capture: true });
    window.addEventListener('pointercancel', releasePointer, { passive: true, capture: true });

    // 无 Pointer Events 的老内核兜底（Cesium 自己也会退回 touch）
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

    // ----- 5. 地表拾取（与 bookmarks / streetview 同一约定） -----
    // ⚠️ 必须 getPickRay + globe.pick。pickEllipsoid 求的是 h≡0 椭球面，有地形时点会偏。
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
            // flyTo 默认 QUINTIC_IN_OUT 起步很肉；双击要立刻回应，换二次缓出。
            easingFunction: EasingFunction.QUADRATIC_OUT,
        });
    }

    // ----- 6. 桌面双击 -----
    // ⚠️ 拖动守卫只能在 pointerdown 重置，不能用 pointerup 清：
    //    LEFT_DOUBLE_CLICK 在所有 up 之后才派发，清掉等于守卫恒为 false。
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
            // 多指落下 ⇒ 作废待判定的双击，否则「单击 → 捏合 → 抬起一根」会被误判。
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

    // ----- 8. 双指三自由度（缩放 / 航向 / 俯仰） -----
    // ⚠️ 旋转与俯仰都是把**整台相机**（position + direction + up）绕锚点做刚性旋转，
    //    不是原地改朝向。锚点 = 手势开始时两指中点下方的地面点，落在旋转轴上，
    //    所以它的屏幕位置不动 —— 视觉上是地表在手指底下倾斜/转动。
    //    只改 pitch/heading 的写法观感是「相机原地扭头、地表滑走」，已废弃。
    // 俯仰轴取 camera.right，航向轴取锚点处的地表法线。

    const wrapAngle = (a) => {
        while (a > Math.PI) a -= Math.PI * 2;
        while (a < -Math.PI) a += Math.PI * 2;
        return a;
    };

    /** 触摸点 → canvas 局部坐标（全屏画布时相同，但不假设）。 */
    function toCanvasPoint(touch) {
        const rect = canvas.getBoundingClientRect();
        return { x: touch.clientX - rect.left, y: touch.clientY - rect.top };
    }

    /** 取两指的距离、连线角度、中点。 */
    function measurePinch(event) {
        // ⚠️ 按 identifier 固定两指顺序：TouchList 按落指先后排列，
        //    顺序翻转会让 atan2 的角度瞬间跳 180°。
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
     * 相机整体绕过 anchor、方向 axis 的直线刚性旋转。
     * anchor 在轴上 ⇒ 其屏幕位置不动，看起来是地表在手指下转。
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
     * 绕锚点处的地表法线旋转 ⇒ 航向变化。
     * 顺时针转手指 ⇒ 相机逆时针绕轴 ⇒ 画面顺时针转。
     */
    function rotateHeading(anchor, angle) {
        if (!anchor) return;
        scene.globe.ellipsoid.geodeticSurfaceNormal(anchor, rotScratch.axis);
        rotateAround(anchor, rotScratch.axis, angle);
    }

    /**
     * 绕 camera.right 旋转 ⇒ 俯仰变化（地表「立起来」）。
     * 无滚转时绕 right 转多少 pitch 就变多少，可据此夹紧。
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
     * 沿两指中点推进/后退相机。指数映射：两指距离翻倍 = 高度减半。
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
    // exp(-t/TAU) 衰减，约 0.35 秒停住。只在快速划动时启动（omega 超过阈值），慢拖不滑。
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
            // 两指几乎重合：距离/角度/比例都无意义，忽略
            pinch = null;
            return;
        }
        pinch = {
            distance: s.distance,
            angle: s.angle,
            midY: s.midY,
            // 锚点：手势开始时两指中点下方的地面点，全程固定
            // （缩放沿这条射线推进，它不会跑）。
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

    /** 角速度 EMA 平滑：单帧 d/dt 噪声大，直接用于滑行会甩得突兀。 */
    function trackOmega(key, value) {
        if (!pinch) return;
        pinch[key] += (value - pinch[key]) * 0.35;
    }

    canvas.addEventListener('touchstart', (event) => {
        beginPinch(event);
    }, { passive: true });

    canvas.addEventListener('touchmove', (event) => {
        if (!event.touches || event.touches.length !== 2) {
            return;
        }

        // 两指落下时若几乎重合（< MIN_PINCH_DISTANCE），beginPinch 会拒绝建立；
        // 这里在张开后补建，否则整次捏合白费。
        if (!pinch) {
            if (measurePinch(event).distance < MIN_PINCH_DISTANCE) return;
            beginPinch(event);
            if (!pinch) return;
        }

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

        // ⚠️ 刻意的不对称，别当 bug 改：
        //    旋转起手 ⇒ 轴先锁 ⇒ 张开/收拢两指时旋转与缩放并行（缩放不参与锁轴）；
        //    捏合起手 ⇒ 累积比例已超阈值 ⇒ 本次不再开始旋转。
        //    放开的话，捏合途中地球会突然转起来。测试 7.9 / 7.10 钉住。
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
            // 死区只用于确认意图；越过后把扣掉的那段补回，否则发闷
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
        const remaining = event.touches ? event.touches.length : 0;

        // 还有两指按着 ⇒ 手势没结束
        if (remaining === 2) {
            // ⚠️ 3 指回到 2 指：3 指落下时 beginPinch 已把 pinch 清空，
            //    这里不重建，双指手势会失效到下次重新触摸。
            if (!pinch) beginPinch(event);
            return;
        }

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

        // 手势中 / 刚松手：这段时间帧率不具代表性（瓦片涌入、帧缓冲重建），
        // 不采样也不改档。
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

    // ----- 10. 调试句柄（只读，不挂整个 viewer） -----
    window.__locusCameraFeel = controller;
    window.__locusCameraView = () => {
        const c = viewer.camera;
        return {
            heading: c.heading,
            pitch: c.pitch,
            height: c.positionCartographic.height,
            // ECEF 坐标：俯视时水平拖动只改位置，heading/height 不变，判断「是否真拖动」只看它。
            position: { x: c.positionWC.x, y: c.positionWC.y, z: c.positionWC.z },
        };
    };
    // 真机上调"边捏边转"用：__locusSetMultiAxis(true)
    window.__locusSetMultiAxis = setMultiAxisEnabled;
}
