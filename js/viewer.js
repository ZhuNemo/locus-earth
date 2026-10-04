import * as Cesium from 'cesium';

export function initViewer(containerId, terrainProvider) {
    const viewer = new Cesium.Viewer(containerId, {
        terrainProvider: terrainProvider,
        // 底图选择 UI 已由 basemap-picker.js 接管（右侧偏上的自定义控件），
        // 图源清单与切换逻辑在 imagery.js
        baseLayerPicker: false,
        // 默认底图：Sentinel-2（Ion 资产 3954）。
        // 异步工厂 + ImageryLayer 包装：元数据就绪前 Viewer 照常创建
        baseLayer: Cesium.ImageryLayer.fromProviderAsync(
            Cesium.IonImageryProvider.fromAssetId(3954)
        ),

        animation: false,
        timeline: false,
        geocoder: false,
        homeButton: false,
        navigationHelpButton: false,
        fullscreenButton: false,
        infoBox: false,
        sceneModePicker: false,
        sceneMode: Cesium.SceneMode.SCENE3D,
        locale: 'zh-CN',
    });

    const handler = new Cesium.ScreenSpaceEventHandler(viewer.canvas);

    function zoomAtPosition(position) {
        const picked = viewer.scene.pick(position);
        if (picked && picked.id && picked.id._isBookmark) {
            return;
        }

        const cartesian = viewer.camera.pickEllipsoid(position, viewer.scene.globe.ellipsoid);
        if (!cartesian) return;

        const carto = Cesium.Cartographic.fromCartesian(cartesian);
        const currentCarto = viewer.camera.positionCartographic;
        const newHeight = Math.max(currentCarto.height * 0.5, 10);
        if (newHeight < 10) return;

        viewer.camera.flyTo({
            destination: Cesium.Cartesian3.fromRadians(carto.longitude, carto.latitude, newHeight),
            duration: 0.5
        });
    }

        // ----- 移动端/触屏手感优化 -----
        const controller = viewer.scene.screenSpaceCameraController;

        controller.inertia = {
            zoom: 0.75,    // 缩放惯性
            rotate: 0.85,  // 旋转惯性
            tilt: 0.85     // 俯仰惯性
        };

        controller.enableCollisionDetection = true;


        let hasMovedSincePointerDown = false;
        let hasMovedSinceTouchStart = false;

        viewer.canvas.addEventListener('pointerdown', () => {
            hasMovedSincePointerDown = false;
        }, { passive: true });

        viewer.canvas.addEventListener('pointermove', () => {
            hasMovedSincePointerDown = true;
        }, { passive: true });

        viewer.canvas.addEventListener('pointerup', () => {
            hasMovedSincePointerDown = false;
        }, { passive: true });

        viewer.canvas.addEventListener('pointercancel', () => {
            hasMovedSincePointerDown = false;
        }, { passive: true });

        handler.setInputAction((click) => {
            if (hasMovedSincePointerDown) {
                return;
            }

            zoomAtPosition(click.position);
        }, Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK);

        // iOS Safari does not reliably dispatch a touch double-click to Cesium.
        let lastTouch = null;
        viewer.canvas.style.touchAction = 'none';

        viewer.canvas.addEventListener('touchstart', () => {
            hasMovedSinceTouchStart = false;
        }, { passive: true });

        viewer.canvas.addEventListener('touchmove', () => {
            hasMovedSinceTouchStart = true;
        }, { passive: true });

        viewer.canvas.addEventListener('touchend', (event) => {
            if (event.changedTouches.length !== 1 || event.touches.length !== 0) {
                lastTouch = null;
                hasMovedSinceTouchStart = false;
                return;
            }

            if (hasMovedSinceTouchStart) {
                lastTouch = null;
                hasMovedSinceTouchStart = false;
                return;
            }

            const touch = event.changedTouches[0];
            const now = Date.now();
            const bounds = viewer.canvas.getBoundingClientRect();
            const position = {
                x: touch.clientX - bounds.left,
                y: touch.clientY - bounds.top
            };
            const isDoubleTap = lastTouch &&
                now - lastTouch.time < 350 &&
                Math.hypot(position.x - lastTouch.x, position.y - lastTouch.y) < 30;

            if (isDoubleTap) {
                event.preventDefault();
                zoomAtPosition(position);
                lastTouch = null;
                hasMovedSinceTouchStart = false;
            } else {
                lastTouch = { ...position, time: now };
            }
        }, { passive: false });


        // ----- 光照控制 -----
        let isLightingEnabled = false;
        viewer.scene.globe.enableLighting = false;
        viewer.imageryLayers.enablePickFeatures = false; 
        viewer.scene.globe.showWaterEffect = true;
        viewer.scene.screenSpaceCameraController.minimumZoomDistance = 50;

                
        // ----- 动态分辨率：按帧率调整渲染缩放 -----
        // 两处防抖，避免在阈值附近反复抖动：
        //  1) 迟滞：只有明显偏低（<35）才降档，明显偏高（>58）才升档。
        //     原先 40/55 的窄死区会让画面在相邻两档之间来回变糊/变清晰。
        //  2) 冷却：切换 resolutionScale 会重建帧缓冲、拉低当帧帧率，
        //     若立刻继续采样，就会把这次开销误判成“帧率不足”而继续降档。
        const MIN_SCALE = 1.0;
        const LOW_FPS = 35;
        const HIGH_FPS = 58;
        const SCALE_STEP = 0.1;
        const COOLDOWN_SAMPLES = 2;
        const maxScale = () => Math.min(window.devicePixelRatio, 2);

        let fpsCheckCounter = 0;
        let lastFpsTime = performance.now();
        let currentScale = Math.min(window.devicePixelRatio, 2);
        let fpsCooldown = 0;

        viewer.resolutionScale = currentScale;

        viewer.scene.postRender.addEventListener(() => {
            fpsCheckCounter++;
            const now = performance.now();
            if (now - lastFpsTime < 1000) return;

            const fps = fpsCheckCounter;
            fpsCheckCounter = 0;
            lastFpsTime = now;

            // 调档后的冷却期内只丢弃采样，不再改档
            if (fpsCooldown > 0) {
                fpsCooldown--;
                return;
            }

            // 取整到 0.1，避免浮点累加漂移（如 1.5000000000000002）
            if (fps < LOW_FPS && currentScale > MIN_SCALE) {
                currentScale = Math.round(Math.max(MIN_SCALE, currentScale - SCALE_STEP) * 10) / 10;
                viewer.resolutionScale = currentScale;
                fpsCooldown = COOLDOWN_SAMPLES;
            } else if (fps > HIGH_FPS && currentScale < maxScale()) {
                currentScale = Math.round(Math.min(maxScale(), currentScale + SCALE_STEP) * 10) / 10;
                viewer.resolutionScale = currentScale;
                fpsCooldown = COOLDOWN_SAMPLES;
            }
        });

        return viewer;

    }