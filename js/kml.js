// ============================================================================
// 收藏夹导出 / 导入（KML）
// ----------------------------------------------------------------------------
// 为什么用 KML 而不是自定义 XML：
//   · KML 本身就是 XML（XML 1.0 + OGC 命名空间），满足「导入导出为 XML」；
//   · 它是 Google Earth / QGIS / 各类 GIS 都认的标准格式，导出的文件不止能在
//     本应用里回灌，还能直接在地球软件里查看；
//   · 点 / 折线 / 多边形三种几何刚好一一对应本应用的
//     「标记」/「轨迹」/「图形」，不需要在 XML 里自造几何方言。
//
// 本应用特有的类型信息放在 ExtendedData 里（KML 规定的扩展位点），
// name = "locus:type"，value 取 marker / track / shape。
// 缺失时按几何形状反推，所以外部生成的普通 KML 也能导进来。
//
// 约定：所有坐标一律 WGS84（本项目的「一本账」，见 js/coord-transform.js），
// KML 也用 WGS84，因此两边无需换算。
// ============================================================================

const KML_NS = 'http://www.opengis.net/kml/2.2';

/** XML 文本转义（属性值不单列，本文件的动态值只出现在元素文本里） */
function esc(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

/** 单个坐标点 → "lon,lat,height" */
function coordOf(point) {
    const lon = Number(point.lon);
    const lat = Number(point.lat);
    const h = Number(point.height);
    const alt = Number.isFinite(h) ? h.toFixed(2) : '0';
    return `${lon.toFixed(7)},${lat.toFixed(7)},${alt}`;
}

/**
 * 折线 / 多边形环的坐标串。
 * @param {Array<{lon:number,lat:number,height?:number}>} points
 * @param {boolean} closeRing 多边形必须首尾闭合（KML 的硬性要求）
 */
function coordList(points, closeRing) {
    const list = points.map(coordOf);
    if (closeRing && list.length > 1 && list[0] !== list[list.length - 1]) {
        list.push(list[0]);
    }
    return list.join(' ');
}

function extendedType(type) {
    return `      <ExtendedData><Data name="locus:type"><value>${type}</value></Data></ExtendedData>`;
}

/**
 * 生成 KML 文本。
 *
 * @param {object} data
 * @param {Array<{name:string,lon:number,lat:number,height?:number}>} [data.markers] 标记
 * @param {Array<{type:string,name:string,points:Array}>} [data.shapes] 轨迹 / 图形
 * @returns {string}
 */
export function buildKml({ markers = [], shapes = [] } = {}) {
    const out = [];
    out.push('<?xml version="1.0" encoding="UTF-8"?>');
    out.push(`<kml xmlns="${KML_NS}">`);
    out.push('  <Document>');
    out.push('    <name>Locus Earth 收藏夹</name>');
    out.push('    <description>由 Locus Earth 导出：标记 / 轨迹 / 图形，坐标为 WGS84。</description>');

    for (const marker of markers) {
        out.push('    <Placemark>');
        out.push(`      <name>${esc(marker.name)}</name>`);
        out.push(extendedType('marker'));
        out.push(`      <Point><coordinates>${coordOf(marker)}</coordinates></Point>`);
        out.push('    </Placemark>');
    }

    for (const shape of shapes) {
        const points = Array.isArray(shape.points) ? shape.points : [];
        if (points.length < 2) continue;

        out.push('    <Placemark>');
        out.push(`      <name>${esc(shape.name)}</name>`);
        if (shape.type === 'area') {
            out.push(extendedType('shape'));
            out.push('      <Polygon>');
            out.push('        <outerBoundaryIs><LinearRing>');
            out.push(`          <coordinates>${coordList(points, true)}</coordinates>`);
            out.push('        </LinearRing></outerBoundaryIs>');
            out.push('        <altitudeMode>clampToGround</altitudeMode>');
            out.push('      </Polygon>');
        } else {
            out.push(extendedType('track'));
            out.push('      <LineString>');
            out.push('        <tessellate>1</tessellate>');
            out.push('        <altitudeMode>clampToGround</altitudeMode>');
            out.push(`        <coordinates>${coordList(points, false)}</coordinates>`);
            out.push('      </LineString>');
        }
        out.push('    </Placemark>');
    }

    out.push('  </Document>');
    out.push('</kml>');
    return out.join('\n');
}

/**
 * 生成只含单个轨迹 / 图形的 KML 文本。
 * 与 buildKml 共用同一套序列化逻辑，只是 Document 里只有一个 Placemark，
 * 供右键 / 长按菜单里的「导出为单独 KML」使用。
 *
 * @param {{type:string,name:string,points:Array}} shape
 * @returns {string}
 */
export function buildSingleKml(shape) {
    const out = [];
    out.push('<?xml version="1.0" encoding="UTF-8"?>');
    out.push(`<kml xmlns="${KML_NS}">`);
    out.push('  <Document>');
    out.push(`    <name>${esc(shape.name)}</name>`);
    out.push('    <description>由 Locus Earth 导出，坐标为 WGS84。</description>');

    const points = Array.isArray(shape.points) ? shape.points : [];
    out.push('    <Placemark>');
    out.push(`      <name>${esc(shape.name)}</name>`);
    if (shape.type === 'area') {
        out.push(extendedType('shape'));
        out.push('      <Polygon>');
        out.push('        <outerBoundaryIs><LinearRing>');
        out.push(`          <coordinates>${coordList(points, true)}</coordinates>`);
        out.push('        </LinearRing></outerBoundaryIs>');
        out.push('        <altitudeMode>clampToGround</altitudeMode>');
        out.push('      </Polygon>');
    } else {
        out.push(extendedType('track'));
        out.push('      <LineString>');
        out.push('        <tessellate>1</tessellate>');
        out.push('        <altitudeMode>clampToGround</altitudeMode>');
        out.push(`        <coordinates>${coordList(points, false)}</coordinates>`);
        out.push('      </LineString>');
    }
    out.push('    </Placemark>');

    out.push('  </Document>');
    out.push('</kml>');
    return out.join('\n');
}

// ---------------------------------------------------------------------------
// 解析
// ---------------------------------------------------------------------------

/** 直接子元素里按 localName 找文本（避免误取 ExtendedData 里同名的 name） */
function childText(node, localName) {
    if (!node || !node.children) return '';
    for (const child of node.children) {
        if (child.localName === localName) return (child.textContent || '').trim();
    }
    return '';
}

/** 读 ExtendedData 里指定 Data/@name 的 value */
function dataValue(node, dataName) {
    if (!node) return '';
    const dataNodes = node.getElementsByTagNameNS('*', 'Data');
    for (const data of dataNodes) {
        if (data.getAttribute('name') !== dataName) continue;
        const value = data.getElementsByTagNameNS('*', 'value')[0];
        return (value?.textContent || '').trim();
    }
    return '';
}

/** "lon,lat[,alt] lon,lat[,alt] …" → 点数组（过滤非法值） */
function parseCoordinates(text) {
    const points = [];
    if (!text) return points;

    for (const token of text.trim().split(/\s+/)) {
        if (!token) continue;
        const parts = token.split(',');
        if (parts.length < 2) continue;

        const lon = Number(parts[0]);
        const lat = Number(parts[1]);
        const height = parts.length > 2 ? Number(parts[2]) : 0;

        if (!Number.isFinite(lon) || !Number.isFinite(lat)) continue;
        if (lon < -180 || lon > 180 || lat < -90 || lat > 90) continue;

        points.push({
            lon,
            lat,
            height: Number.isFinite(height) ? height : 0,
        });
    }
    return points;
}

/** 多边形环首尾重合 → 去掉末尾那个重复点（本应用内部按「不闭合」存） */
function openRing(points) {
    if (points.length < 2) return points;
    const first = points[0];
    const last = points[points.length - 1];
    if (first.lon === last.lon && first.lat === last.lat) return points.slice(0, -1);
    return points;
}

/**
 * 解析 KML / 任意 XML 文本。
 *
 * @param {string} text
 * @returns {{markers: Array<{name:string,lon:number,lat:number,height:number}>,
 *            shapes: Array<{type:string,name:string,points:Array}>}}
 * @throws {Error} XML 语法错误时抛出
 */
export function parseKml(text) {
    const doc = new DOMParser().parseFromString(String(text ?? ''), 'application/xml');

    // 各浏览器对解析失败的表示不统一：统一的可靠判据是存在 parsererror 元素
    const parseError = doc.getElementsByTagName('parsererror')[0];
    if (parseError) throw new Error('XML 语法错误');

    const placemarks = Array.from(doc.getElementsByTagNameNS('*', 'Placemark'));
    const markers = [];
    const shapes = [];

    for (const node of placemarks) {
        const name = childText(node, 'name') || '未命名';
        const declared = dataValue(node, 'locus:type');

        const pointNode = node.getElementsByTagNameNS('*', 'Point')[0];
        const lineNode = node.getElementsByTagNameNS('*', 'LineString')[0];
        const polygonNode = node.getElementsByTagNameNS('*', 'Polygon')[0];

        // 标记：点几何（一条 Placemark 里可能同时有多个几何，按优先级取第一个）
        if (pointNode) {
            const coords = pointNode.getElementsByTagNameNS('*', 'coordinates')[0];
            const [point] = parseCoordinates(coords?.textContent);
            if (point) markers.push({ name, ...point });
            continue;
        }

        if (polygonNode) {
            const coords = polygonNode.getElementsByTagNameNS('*', 'coordinates')[0];
            const points = openRing(parseCoordinates(coords?.textContent));
            if (points.length >= 3) shapes.push({ type: 'area', name, points });
            continue;
        }

        if (lineNode) {
            const coords = lineNode.getElementsByTagNameNS('*', 'coordinates')[0];
            const points = parseCoordinates(coords?.textContent);
            if (points.length >= 2) shapes.push({ type: 'distance', name, points });
            continue;
        }

        // 没有几何但声明了类型：忽略（无坐标无法渲染）
        if (declared) continue;
    }

    return { markers, shapes };
}

/**
 * 粗判一段文本是不是 XML（用于导入时在 KML 与旧版 CSV 之间分流）。
 * 只看开头，足够区分——CSV 的首字符不可能是 '<'。
 */
export function looksLikeXml(text) {
    return /^\s*(<\?xml|<kml|<Km[lL]|<Document)/i.test(String(text ?? ''));
}
