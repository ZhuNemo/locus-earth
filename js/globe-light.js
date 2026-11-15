// ============================================================================
// 地球光照：真实光照开 / 关
// ----------------------------------------------------------------------------
// 界面上的开关只有一个：主页面的「真实光照」（月亮按钮，ui.js 的 switchLighting）。
// 它落到引擎上是两条互相独立的线：
//
//   ① globe.enableLighting —— 地表（含地形）有没有昼夜分界
//   ② scene.light          —— 所有受光几何体（地表、建筑、3D Tiles）用哪盏灯
//
//   开 → ① true  ② 太阳
//   关 → ① false ② 机头灯：整球均匀受光，模型不被单向照黑
//
// ⚠️ 昼夜分界不是直接取太阳方向，而是取 scene.light 的漫反射
//    （GlobeFS：`diffuseIntensity = clamp(czm_getLambertDiffuse(czm_lightDirectionEC, n) * 5 + 0.3, 0, 1)`）。
//
// ⚠️ 关光照时必须换 ②：只关 ① 的话太阳方向照旧打在建筑 / 3D Tiles 上，朝向太阳的反面一片黑。
//    `scene.light = undefined` 没用 —— UniformState 是 `frameState.light ?? defaultLight`，
//    会退回到内置的 SunLight。
//
// ⚠️ 淡出距离与地面大气必须成对改动，见 apply()。
// ============================================================================

import { Cartesian3, DirectionalLight } from './cesium.js';

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

/**
 * 真实光照开关（ui.js 的 switchLighting 调用）。
 * @param {object} viewer Cesium Viewer
 * @param {boolean} enabled
 */
export function setRealLighting(viewer, enabled) {
    realLighting = !!enabled;
    apply();
}

function setSceneLight(light) {
    if (scene.light !== light) scene.light = light;
}

/** 把当前开关状态写进引擎。任何变化都走这里。 */
function apply() {
    if (!scene) return;

    const globe = scene.globe;

    // ① 地表昼夜分界
    globe.enableLighting = realLighting;

    // ② 淡出距离 + 地面大气成对处理：
    //    引擎默认 1e7 / 2e7 米，相机低于一万公里时分界就被拉平成「全亮」。
    //    这里顶死 fade（fadeOut = -1、fadeIn = 0 ⇒ fade = 距离 + 1 ≥ 1），让分界任何高度都在。
    //    ⚠️ 但 `fade` 同一个量还控制「地面大气」分支（`mix(finalColor, finalAtmosphereColor, fade)`，
    //    里面还有一道 1-exp(-x) 色调重映射）。只顶死 fade 不关大气，近地整幅图会被洗亮掉色：
    //    1000 km 同机位实测 RGB 70/77/59、饱和度 41% → 110/127/118、24%。
    //    所以顶死的同时必须把 `showGroundAtmosphere` 关掉，地表只剩「影像 × 灯色 × 漫反射」，
    //    与关光照时逐像素一致。行星边缘的蓝色光晕来自 scene.atmosphere，不受影响。
    if (realLighting) {
        globe.lightingFadeOutDistance = -1;
        globe.lightingFadeInDistance = 0;
        globe.showGroundAtmosphere = false;
    } else {
        globe.lightingFadeOutDistance = defaultFadeOut;
        globe.lightingFadeInDistance = defaultFadeIn;
        globe.showGroundAtmosphere = defaultGroundAtmosphere;
    }

    // ③ 模型的灯
    setSceneLight(realLighting ? sunLight : headlight);

    // ④ 分界要跟着真实时间走，否则页面开久了会停在打开那一刻
    viewerRef.clock.shouldAnimate = realLighting;
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

    // 每帧：机头灯跟随相机（只有关光照时才用它）
    scene.preRender.addEventListener(() => {
        if (!realLighting) {
            Cartesian3.clone(scene.camera.directionWC, headlight.direction);
        }
    });

    apply();

    // 调试句柄：自动化测试读光照终态（与 camera-feel.js 的 __locusCameraView 同一套路）。
    // 只读，不提供改状态的入口。
    window.__locusGlobeLight = () => ({
        realLighting,
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
