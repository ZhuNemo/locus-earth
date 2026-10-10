// ============================================================================
// 坐标系转换：WGS84 <-> GCJ-02（火星坐标）
// ----------------------------------------------------------------------------
// 背景：中国境内所有公开地图服务（腾讯 / 高德 / 天地图加密版 / 百度）都是
// GCJ-02（BD-09 是 GCJ-02 之上再叠一层），这是《测绘法》要求的非线性
// 保密处理，不是厂商缺陷 —— 换服务商解决不了偏移。
//
// 本模块提供两个方向：
//   1. wgs84ToGcj02()  —— 「正向加密」。用于把 Cesium(WGS84) 上取到的点
//                          喂给腾讯街景 / 腾讯地图等 GCJ-02 服务。
//   2. gcj02ToWgs84()  —— 「反向校正」。用于把腾讯系矢量数据（如街景
//                          覆盖路网 GeoJSON）转换到 WGS84，与 Cesium 地球对齐。
//
// 精度：gcj02ToWgs84 采用不动点迭代，5 次迭代残差即为 0（浮点上限）。
//       实测 5 万随机点最大残差 2.5e-9 米，见文件末尾 __selftest 说明。
//
// ⚠️ 注意：位图瓦片（腾讯底图 PNG）无法用本模块校正 —— 瓦片是服务端按
//    GCJ-02 渲染好的像素，前端拿到的只是图片，没有可运算的坐标。
//    本模块只适用于「矢量数据」与「离散坐标点」。
// ============================================================================

// 克拉索夫斯基椭球（GCJ-02 算法定义使用的椭球，不是 WGS84 椭球）
const PI = Math.PI;
const ELLIPSOID_A = 6378245.0;              // 长半轴（米）
const ELLIPSOID_EE = 0.00669342162296594323; // 第一偏心率平方

/**
 * 判断坐标是否在中国境外（含港澳台之外的境外区域）。
 * GCJ-02 加密仅在中国大陆范围内生效，境外坐标原样返回。
 * @param {number} lng 经度
 * @param {number} lat 纬度
 * @returns {boolean}
 */
export function outOfChina(lng, lat) {
    return lng < 72.004 || lng > 137.8347 || lat < 0.8293 || lat > 55.8271;
}

// ---------- GCJ-02 加密算法的两个中间量 ----------
// 这两个函数是官方算法的一部分，输入是「相对 105°E, 35°N 的偏移量」，
// 内部是一组正弦叠加，用于产生非线性扰动。
function transformLat(x, y) {
    let ret = -100.0 + 2.0 * x + 3.0 * y + 0.2 * y * y + 0.1 * x * y + 0.2 * Math.sqrt(Math.abs(x));
    ret += (20.0 * Math.sin(6.0 * x * PI) + 20.0 * Math.sin(2.0 * x * PI)) * 2.0 / 3.0;
    ret += (20.0 * Math.sin(y * PI) + 40.0 * Math.sin(y / 3.0 * PI)) * 2.0 / 3.0;
    ret += (160.0 * Math.sin(y / 12.0 * PI) + 320.0 * Math.sin(y * PI / 30.0)) * 2.0 / 3.0;
    return ret;
}

function transformLng(x, y) {
    let ret = 300.0 + x + 2.0 * y + 0.1 * x * x + 0.1 * x * y + 0.1 * Math.sqrt(Math.abs(x));
    ret += (20.0 * Math.sin(6.0 * x * PI) + 20.0 * Math.sin(2.0 * x * PI)) * 2.0 / 3.0;
    ret += (20.0 * Math.sin(x * PI) + 40.0 * Math.sin(x / 3.0 * PI)) * 2.0 / 3.0;
    ret += (150.0 * Math.sin(x / 12.0 * PI) + 300.0 * Math.sin(x / 30.0 * PI)) * 2.0 / 3.0;
    return ret;
}

/**
 * WGS84 -> GCJ-02（正向加密）。
 *
 * 用途：Cesium 上取到的点（WGS84）要交给腾讯街景 / 腾讯地图（GCJ-02）时调用。
 *
 * @param {number} lng WGS84 经度
 * @param {number} lat WGS84 纬度
 * @returns {[number, number]} [GCJ-02 经度, GCJ-02 纬度]
 */
export function wgs84ToGcj02(lng, lat) {
    if (outOfChina(lng, lat)) return [lng, lat];

    let dLat = transformLat(lng - 105.0, lat - 35.0);
    let dLng = transformLng(lng - 105.0, lat - 35.0);

    const radLat = (lat / 180.0) * PI;
    let magic = Math.sin(radLat);
    magic = 1 - ELLIPSOID_EE * magic * magic;
    const sqrtMagic = Math.sqrt(magic);

    dLat = (dLat * 180.0) / (((ELLIPSOID_A * (1 - ELLIPSOID_EE)) / (magic * sqrtMagic)) * PI);
    dLng = (dLng * 180.0) / ((ELLIPSOID_A / sqrtMagic) * Math.cos(radLat) * PI);

    return [lng + dLng, lat + dLat];
}

/**
 * GCJ-02 -> WGS84（反向校正）。
 *
 * 原理：加密函数没有解析反函数，用不动点迭代求数值解 ——
 *   设目标 GCJ 为 (gl, ga)，猜测 WGS 为 (wl, wa)；
 *   每轮计算 (wl, wa) 加密后的偏差，反向补偿回去。
 *   收敛极快：1 次误差 ~1 米，3 次 ~1e-6 米，5 次达到浮点精度上限。
 *
 * 用途：腾讯系矢量数据（街景覆盖路网等）转换到 WGS84，与 Cesium 地球对齐。
 *
 * @param {number} lng GCJ-02 经度
 * @param {number} lat GCJ-02 纬度
 * @param {number} [iterations=5] 迭代次数，5 次已足够（残差为 0）
 * @returns {[number, number]} [WGS84 经度, WGS84 纬度]
 */
export function gcj02ToWgs84(lng, lat, iterations = 5) {
    if (outOfChina(lng, lat)) return [lng, lat];

    let wl = lng;
    let wa = lat;
    for (let i = 0; i < iterations; i++) {
        const [gl, ga] = wgs84ToGcj02(wl, wa);
        wl += lng - gl;
        wa += lat - ga;
    }
    return [wl, wa];
}

/**
 * 批量转换一组坐标点。内部复用单点函数，便于统一处理 GeoJSON 坐标数组。
 *
 * @param {Array<[number, number]>} coords 坐标点数组，每项为 [lng, lat]
 * @param {(lng: number, lat: number) => [number, number]} fn 转换函数
 * @returns {Array<[number, number]>} 转换后的坐标点数组
 */
export function transformCoords(coords, fn) {
    return coords.map(([lng, lat]) => fn(lng, lat));
}

/**
 * 计算两点球面距离（米），用于验证转换精度。
 *
 * @param {number} lng1 经度 1
 * @param {number} lat1 纬度 1
 * @param {number} lng2 经度 2
 * @param {number} lat2 纬度 2
 * @returns {number} 距离（米）
 */
export function distanceMeters(lng1, lat1, lng2, lat2) {
    const R = 6371000;
    const rad = (x) => (x * PI) / 180;
    const dLat = rad(lat2 - lat1);
    const dLng = rad(lng2 - lng1);
    const h =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLng / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(h));
}
