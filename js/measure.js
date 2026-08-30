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
                material: material
            },
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
                disableDepthTestDistance: Number.POSITIVE_INFINITY
            }
        });
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
                    const cartesian = viewer.camera.pickEllipsoid(event.position, viewer.scene.globe.ellipsoid);
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