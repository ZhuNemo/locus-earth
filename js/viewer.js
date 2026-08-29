import { 
            Viewer,
            SceneMode,
            IonImageryProvider,
            ScreenSpaceEventHandler,
            ScreenSpaceEventType,
            Cartesian3,
            Cartographic,
            createDefaultImageryProviderViewModels,
        } from 'cesium'; 

export function initViewer(containerId, terrainProvider) {
    const defaultImageryProviders = createDefaultImageryProviderViewModels();

    const sentinelViewModel = defaultImageryProviders.find(vm => vm.name.includes('Sentinel-2'));

    const viewer = new Viewer(containerId, {
        terrainProvider: terrainProvider,
        baseLayerPicker: true, 
        imageryProviderViewModels: defaultImageryProviders, 
        selectedImageryProviderViewModel: sentinelViewModel, 
        
        infoBox: false,
        sceneModePicker: false,
        sceneMode: SceneMode.SCENE3D,
        locale: 'zh-CN',
    });

        const handler = new ScreenSpaceEventHandler(viewer.canvas);

        function zoomAtPosition(position) {
            const picked = viewer.scene.pick(position);
            if (picked && picked.id && picked.id._isBookmark) {
                return;
            }

            const cartesian = viewer.camera.pickEllipsoid(position, viewer.scene.globe.ellipsoid);
            if (!cartesian) return;

            const carto = Cartographic.fromCartesian(cartesian);
            const currentCarto = viewer.camera.positionCartographic;
            const newHeight = Math.max(currentCarto.height * 0.5, 10);
            if (newHeight < 10) return;

            viewer.camera.flyTo({
                destination: Cartesian3.fromRadians(carto.longitude, carto.latitude, newHeight),
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


        // 只有在两次都完全静止的点击/轻触时，才允许放大。
        // 一旦本次点击/触摸发生任何移动，就直接禁用双击放大。
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
        }, ScreenSpaceEventType.LEFT_DOUBLE_CLICK);

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

        viewer.timeline.container.style.display = 'none';
        viewer.animation.container.style.display = 'none';

        return viewer;
        
    }