// ============================================================================
// 地球光照：真实光照 / 太空昼夜遮罩 / 均匀受光
// ----------------------------------------------------------------------------
// 状态只有两个来源：真实光照开关（UI 上的月亮按钮）与设置页的「太空昼夜遮罩」。
// 落到引擎上则是两条互相独立的线：
//
//   ① globe.enableLighting —— 地表（含地形、大气）有没有昼夜分界
//   ② scene.light          —— 所有受光几何体（地表、建筑、3D Tiles）用哪盏灯
//
//   真实光照 ON             → ① true  ② 太阳   （分界任何高度都在）
//   真实光照 OFF + 遮罩 ON  → ① true  ② 太阳   （同上；模型也跟着太阳）
//   真实光照 OFF + 遮罩 OFF → ① false ② 机头灯 整球均匀受光，模型不被单向照黑
//
// ⚠️ 昼夜分界不是直接取太阳方向，而是取 scene.light 的漫反射
//    （GlobeFS：`diffuseIntensity = clamp(czm_getLambertDiffuse(czm_lightDirectionEC, n) * 5 + 0.3, 0, 1)`）。
//    所以「假遮罩」也必须留着太阳当灯，不能换成机头灯 —— 换了就没有分界了。
//
// ⚠️ 关真实光照时必须换 ②：只关 ① 的话太阳方向照旧打在建筑 / 3D Tiles 上，
//    朝向太阳的反面一片黑。scene.light = undefined 也没用 ——
//    UniformState 会退回到内置的 SunLight（`frameState.light ?? defaultLight`）。
//
// ⚠️ 分界要「任何高度都在」，只能把淡出距离顶死（fadeOut = -1 / fadeIn = 0 ⇒ fade = dist + 1 ≥ 1），
//    但 `fade` 同一个量还控制「地面大气」分支（`mix(finalColor, finalAtmosphereColor, fade)`，
//    里面还有一道 `1-exp(-x)` 色调重映射）。顶死 fade 而不动大气，近地整幅图会被洗亮掉色：
//    1000 km 同机位实测 RGB 70/77/59、饱和度 41% → 110/127/118、24%。
//    所以开光照 / 遮罩时连 `globe.showGroundAtmosphere` 一起关掉，地表只剩
//    「影像 × 灯色 × 漫反射」，与关光照时颜色一致（实测完全复原）；行星边缘的蓝色光晕
//    来自 scene.atmosphere，不受影响。
//    ⚠️ 关光照时必须把淡出距离与大气开关都还原，否则默认模式自己在近地也会被洗白。
// ============================================================================

import { Cartesian3, DirectionalLight } from './cesium.js';

/** 设置页的键；settings.html 的普通脚本里另存了一份字面量，改动时两边一起改 */
export const DAY_NIGHT_MASK_KEY = 'dayNightMask';

let viewerRef = null;
let scene = null;

/** 太阳灯：Cesium 默认的 scene.light，切走之前先存下来 */
let sunLight = null;
/** 机头灯：方向永远跟着相机，任何一个可见面都有光 */
let headlight = null;

/** 引擎原本的淡出距离与地面大气开关，关光照时要还回去 */
let defaultFadeOut = null;
let defaultFadeIn = null;
let defaultGroundAtmosphere = null;

let realLighting = false;
let maskEnabled = false;

/** 真实光照开关（ui.js 的 switchLighting 调用） */
export function setRealLighting(viewer, enabled) {
    realLighting = !!enabled;
    apply();
}

/** 当前是否开着真实光照 */
export function isRealLighting() {
    return realLighting;
}

function setSceneLight(light) {
    if (scene.light !== light) scene.light = light;
}

/** 按 (真实光照, 遮罩) 把最终状态写进引擎。任何一项变化都走这里。 */
function apply() {
    if (!scene) return;

    const globe = scene.globe;
    const maskActive = !realLighting && maskEnabled;

    // ① 地表昼夜分界
    globe.enableLighting = realLighting || maskActive;

    // ①b 淡出距离 + 地面大气成对处理，理由见文件头：
    //     顶死 fade 保证分界任何高度都在；同时关掉地面大气，避免近地被大气分支洗白。
    if (globe.enableLighting) {
        globe.lightingFadeOutDistance = -1;
        globe.lightingFadeInDistance = 0;
        globe.showGroundAtmosphere = false;
    } else {
        globe.lightingFadeOutDistance = defaultFadeOut;
        globe.lightingFadeInDistance = defaultFadeIn;
        globe.showGroundAtmosphere = defaultGroundAtmosphere;
    }

    // ② 模型的灯。⚠️ 遮罩模式必须用太阳：分界就是这盏灯的漫反射，换成机头灯
    //    等于「每个可见面都是正对光源」，近地立刻没有明暗分界。
    //    代价是遮罩打开时模型也跟太阳走 —— 只有「遮罩关 + 光照关」才是干净的头灯。
    setSceneLight(globe.enableLighting ? sunLight : headlight);

    // ③ 分界要跟着真实时间走，否则页面开久了会停在打开那一刻。
    //    真实光照与遮罩都需要；两者都关时冻结时钟，省掉每分钟一次的界面刷新。
    viewerRef.clock.shouldAnimate = globe.enableLighting;
}

/**
 * 挂载。必须在 initUI 之前调用 —— initUI 里会立刻 switchLighting(false)。
 * @param {object} viewer Cesium Viewer
 */
export function initGlobeLighting(viewer) {
    if (!viewer || viewerRef) return;

    viewerRef = viewer;
    scene = viewer.scene;

    // 默认就是 SunLight 实例；万一被别处换过，退回 scene.sun
    sunLight = scene.light || scene.sun;
    defaultFadeOut = scene.globe.lightingFadeOutDistance;
    defaultFadeIn = scene.globe.lightingFadeInDistance;
    defaultGroundAtmosphere = scene.globe.showGroundAtmosphere;

    headlight = new DirectionalLight({
        // 首帧之前 camera.directionWC 可能还没算出来；方向不能是零向量，构造会抛
        direction: viewer.camera.directionWC && !Cartesian3.equals(viewer.camera.directionWC, Cartesian3.ZERO)
            ? viewer.camera.directionWC
            : new Cartesian3(0, 0, -1),
        // 与太阳灯同色同强度：换灯只换方向，不改整体亮度标定
        // （SunLight 默认 intensity 是 2，不是 1）
        color: sunLight.color,
        intensity: sunLight.intensity
    });

    // 每帧：机头灯跟随相机（只有「遮罩关 + 光照关」时才用它）
    scene.preRender.addEventListener(() => {
        if (!realLighting && !maskEnabled) {
            Cartesian3.clone(scene.camera.directionWC, headlight.direction);
        }
    });

    maskEnabled = localStorage.getItem(DAY_NIGHT_MASK_KEY) === 'true';
    apply();

    // 设置页在另一个标签页里改完会派发 storage（同页派发的那份收不到也不影响，
    // 设置页是整页跳转打开的，下次进来自然读新值）
    window.addEventListener('storage', (event) => {
        if (event.key !== DAY_NIGHT_MASK_KEY) return;
        maskEnabled = localStorage.getItem(DAY_NIGHT_MASK_KEY) === 'true';
        apply();
    });

    // 调试句柄：自动化测试读光照终态（与 camera-feel.js 的 __locusCameraView 同一套路）。
    // 只读，不提供改状态的入口。
    window.__locusGlobeLight = () => ({
        realLighting,
        maskEnabled,
        globeLighting: scene.globe.enableLighting,
        light: scene.light === sunLight ? 'sun' : 'headlight',
        // 机头灯方向应与相机朝向一致（着色器取的是它的反方向）。
        // SunLight 没有 direction 字段（只有 directionWC），此时给 null。
        lightDirection: scene.light.direction
            ? { x: scene.light.direction.x, y: scene.light.direction.y, z: scene.light.direction.z }
            : null,
        cameraDirection: {
            x: scene.camera.directionWC.x,
            y: scene.camera.directionWC.y,
            z: scene.camera.directionWC.z
        },
        lightIntensity: scene.light.intensity,
        // 着色器实际拿到的光方向（czm_lightDirectionWC = -light.direction）。
        // 模型与地表都用它，所以这一项能证明「机头灯真的进了渲染管线」。
        uniformLightDirection: scene.context.uniformState.lightDirectionWC
            ? {
                x: scene.context.uniformState.lightDirectionWC.x,
                y: scene.context.uniformState.lightDirectionWC.y,
                z: scene.context.uniformState.lightDirectionWC.z
            }
            : null,
        fadeOut: scene.globe.lightingFadeOutDistance,
        fadeIn: scene.globe.lightingFadeInDistance,
        groundAtmosphere: scene.globe.showGroundAtmosphere,
        shouldAnimate: viewerRef.clock.shouldAnimate,
        height: scene.camera.positionCartographic.height
    });
}
