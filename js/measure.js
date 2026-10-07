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
} from 'cesium';

export function initMeasureTools(viewer) {

    let handler = null;
    let activePoints = [];
    let mode = null; 
    let currentEntity = null;

    // 格式化距离
    function formatDistance(meters) {
        if (!meters || meters < 0) return '0 米';
        if (meters < 1000) return meters.toFixed(1) + ' 米';
        return (meters / 1000).toFixed(2) + ' 公里';
    }

    // 计算地表距离
    function calculateSurfaceDistance(p1, p2) {
        const c1 = viewer.scene.globe.ellipsoid.cartesianToCartographic(p1);
        const c2 = viewer.scene.globe.ellipsoid.cartesianToCartographic(p2);
        const geodesic = new EllipsoidGeodesic(c1, c2);
        return geodesic.surfaceDistance;
    }

    // 计算总距离
    function calculateTotalDistance() {
        let totalDist = 0;
        for (let i = 0; i < activePoints.length - 1; i++) {
            totalDist += calculateSurfaceDistance(activePoints[i], activePoints[i + 1]);
        }
        return totalDist;
    }

    // 计算球面面积（近似）
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

    // 生成标签文字
    function getMeasurementText() {
        if (mode === 'distance') {
            if (activePoints.length === 0) return '轻触地图添加起点';
            if (activePoints.length === 1) return '继续轻触添加第二个点';
            let text = '总距离: ' + formatDistance(calculateTotalDistance());
            if (activePoints.length > 2) {
                text += '\n';
                for (let i = 0; i < activePoints.length - 1; i++) {
                    text += `\n第${i+1}段: ${formatDistance(calculateSurfaceDistance(activePoints[i], activePoints[i+1]))}`;
                }
            }
            return text;
        } else if (mode === 'area') {
            if (activePoints.length === 0) return '轻触地图添加第一个点';
            if (activePoints.length < 3) return `继续添加点 (${activePoints.length}/3)`;
            const area = calculateSurfaceArea(activePoints);
            return `面积: ${(area / 1000000).toFixed(2)} 平方公里`;
        }
        return '';
    }

    // 清理测量
    function clearMeasurement() {
        if (currentEntity) {
            viewer.entities.remove(currentEntity);
            currentEntity = null;
        }
        activePoints = [];
        mode = null;
        viewer.canvas.style.cursor = 'default';
        if (handler) {
            handler.destroy();
            handler = null;
        }
    }

    // 创建实体
    function createEntity() {
        if (currentEntity) return;
        const material = mode === 'distance' 
            ? new Color(0.0, 0.8, 0.8, 0.8)
            : new Color(0.8, 0.8, 0.0, 0.4);

        const labelPos = new CallbackProperty(() => {
            if (activePoints.length === 0) return undefined;
            return BoundingSphere.fromPoints(activePoints).center;
        }, false);

        currentEntity = viewer.entities.add({
            position: labelPos,
            polyline: {
                positions: new CallbackProperty(() => activePoints, false),
                width: 2,
                material: material,

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
                // 于是「填充贴着地形、轮廓悬在上/下方」在倾斜视角下沿边界拉开，
                // 就是截图里那种轮廓与色块分离的现象。
                //
                // clampToGround: true 把折线交给 GroundPolylinePrimitive，
                // 与多边形共用同一套贴地逻辑，边界严格重合。
                // 支持任意像素宽度（width 照常生效）。
                // 若当前场景不支持（GroundPolylinePrimitive.isSupported 为 false），
                // Cesium 会自动退回普通渲染，不报错、不崩溃。
                clampToGround: true
            },
            // 说明：这个多边形刻意不设 height / extrudedHeight / perPositionHeight，
            // 以保持「贴地形渲染」。若将来要给多边形加高度，折线也必须同步处理，
            // 否则又会回到轮廓与填充错位的状态。
            polygon: mode === 'area' ? {
                hierarchy: new CallbackProperty(() => new PolygonHierarchy(activePoints), false),
                material: material
            } : undefined,
            label: {
                text: new CallbackProperty(getMeasurementText, false),
                font: '14px sans-serif',
                fillColor: Color.WHITE,
                showBackground: true,
                backgroundColor: new Color(0, 0, 0, 0.7),
                verticalOrigin: VerticalOrigin.BOTTOM,
                pixelOffset: new Cartesian2(0, -20),
                disableDepthTestDistance: 50000
            }
        });
    }

    // ---------- 拾取地表点 ----------
    // ⚠️ 不能用 camera.pickEllipsoid()：它求的是视线与椭球面（高度恒为 0）
    // 的交点，完全无视地形高程 —— 而地形层（Cesium World Terrain）默认开启。
    // 于是会出现两个互相叠加的错位：
    //   1) 椭圆交点落在「错误经纬度」上，把该点贴到真实地形后，
    //      屏幕位置与鼠标点击处错开，错开量 ≈ 地形高程 / tan(视线俯角)；
    //   2) 折线用 h=0 的裸坐标绘制，多边形则贴在地形表面渲染，
    //      同一经纬度、不同高度，在倾斜视角下同样表现为「轮廓与填充错位」。
    // 这与图钉（bookmarks.js）之前的偏移是同一个根因，修法也一致。
    //
    // globe.pick() 直接与真实渲染出来的地形网格求交，返回的就是屏幕上
    // 看到的那个点（高度 = 地形高程），折线与多边形因此落在同一高度上。
    // 地形关闭时它自动退化成椭球面交点，两种模式下都正确。
    // 瓦片尚未加载等情况下返回 undefined，此时回退到椭球面交点。
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

    // 开启测量模式
    function setupHandler(type) {
        clearMeasurement();
        mode = type;
        activePoints = [];
        viewer.canvas.style.cursor = 'crosshair';

        handler = new ScreenSpaceEventHandler(viewer.canvas);

        // 移动端防误触：记录按下和松开的位置，距离小于5像素才视为点击
        let mouseDownPos = null;
        let mouseUpPos = null;

        handler.setInputAction((event) => {
            mouseDownPos = event.position;
        }, ScreenSpaceEventType.LEFT_DOWN);

        handler.setInputAction((event) => {
            mouseUpPos = event.position;
            if (mouseDownPos && mouseUpPos) {
                const dx = mouseDownPos.x - mouseUpPos.x;
                const dy = mouseDownPos.y - mouseUpPos.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < 5) {
                    const cartesian = pickSurfacePoint(event.position);
                    if (!cartesian) return;
                    activePoints.push(cartesian);
                    createEntity();
                }
            }
            mouseDownPos = null;
            mouseUpPos = null;
        }, ScreenSpaceEventType.LEFT_UP);
    }

    // 键盘快捷键（桌面端保留）
    document.addEventListener('keydown', (e) => {
        if (e.key === 'm' || e.key === 'M') setupHandler('distance');
        if (e.key === 'n' || e.key === 'N') setupHandler('area');
        if (e.key === 'Escape') clearMeasurement();
    });

    // 返回接口给 main.js 调用
    return {
        startDistance: () => setupHandler('distance'),
        startArea: () => setupHandler('area'),
        clear: clearMeasurement
    };
}