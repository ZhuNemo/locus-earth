import { 
            Viewer,
            SceneMode,
            IonImageryProvider,
            ScreenSpaceEventHandler,
            ScreenSpaceEventType,
            Cartesian3, 
        } from 'cesium'; 

export function initViewer(containerId, terrainProvider) {
    const viewer = new Viewer(containerId, {
        terrainProvider: terrainProvider,
        baseLayerPicker: true,
        infoBox: false,
        sceneModePicker: false,
        sceneMode: SceneMode.SCENE3D,
        locale: 'zh-CN',
    });

    // 设置哨兵2底图
    const viewModels = viewer.baseLayerPicker.viewModel.imageryProviderViewModels;
        let sentinelViewModel = null;
        for (const vm of viewModels) {
            if (vm.name.includes('Sentinel-2')) {
                sentinelViewModel = vm;
                break;
            }
        }
        if (sentinelViewModel) {
            viewer.baseLayerPicker.viewModel.selectedImagery = sentinelViewModel;
        } else {
            console.warn('⚠️ 未找到哨兵 2 图源');
        }

        // ----- 移动端/触屏手感优化 -----
        const controller = viewer.scene.screenSpaceCameraController;

        controller.inertia = {
            zoom: 0.75,    // 缩放惯性
            rotate: 0.85,  // 旋转惯性
            tilt: 0.85     // 俯仰惯性
        };

        controller.enableCollisionDetection = true;


        // 启用双击放大（自定义）
        const handler = new ScreenSpaceEventHandler(viewer.canvas);
        handler.setInputAction((click) => {
            // 如果点击到标记实体，不触发放大（避免干扰）
            const picked = viewer.scene.pick(click.position);
            if (picked && picked.id && picked.id._isBookmark) {
                return;
            }
            // 拾取地面位置
            const cartesian = viewer.camera.pickEllipsoid(click.position, viewer.scene.globe.ellipsoid);
            if (!cartesian) return;

            const carto = viewer.camera.positionCartographic;
            const newHeight = carto.height * 0.5;
            if (newHeight < 10) return;
            viewer.camera.flyTo({
                destination: Cartesian3.fromRadians(carto.longitude, carto.latitude, newHeight),
                duration: 0.5
            });
        }, ScreenSpaceEventType.LEFT_DOUBLE_CLICK);


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
