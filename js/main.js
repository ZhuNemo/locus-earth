import {
            Viewer,
            createOsmBuildingsAsync,
            Cartesian3,
            Ion,
            CesiumTerrainProvider,
            SceneMode,
            Math as CesiumMath,
            Cesium3DTileset,
            IonImageryProvider,
            GeographicTilingScheme,
            EllipsoidTerrainProvider
        } from 'cesium';

import { initViewer } from './viewer.js';

import { initUI } from './ui.js';

        Ion.defaultAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiI3MGY5OGU2Yy1lZTcxLTRhNDUtOTJlNC1hZjNkNzQ3M2VlZGEiLCJpZCI6NDUyMzc2LCJzdWIiOiJaaHVOZW1vIiwiaXNzIjoiaHR0cHM6Ly9hcGkuY2VzaXVtLmNvbSIsImF1ZCI6IkxvY3VzIE1hcHMiLCJpYXQiOjE3ODUwNDE3NTB9.AS3v82gVfiQzkfgaJ-GVK_ly4RymaRyaJ9f9ol94AuU';

        const terrainProvider = await CesiumTerrainProvider.fromIonAssetId(1, {
            requestVertexNormals: true,
            requestWaterMask: true
        });

        const viewer = initViewer('cesiumContainer', terrainProvider);

        // ----- 覆盖区域定义 -----
        const hdAreas = [
            { name: '丹佛',   lon: -104.9903, lat: 39.7392, radius: 10000 },
            { name: '华盛顿D.C.', lon: -77.0369, lat: 38.9072, radius: 10000 },
            { name: '华盛顿州', lon: -122.3321, lat: 47.6062, radius: 30000 },
            { name: '悉尼',   lon: 151.2093, lat: -33.8688, radius: 12000 },
            { name: '波士顿', lon: -71.0589, lat: 42.3601, radius: 8000 },
            { name: '墨尔本', lon: 144.9219, lat: -37.8136, radius: 8000 },
            { name: '旧金山', lon: -122.4194, lat: 37.7749, radius: 8000 },
        ];

        
        // ----- OSM 建筑控制 -----
        let buildingsPrimitive = null;
        const state = {
            buildingsVisible: false
        };
        const toggleBuildingsBtn = document.getElementById('buildingsToggleBtn');
        const hdToggleBtn = document.getElementById('hdToggleBtn');
        const toast = document.getElementById('toastMessage');
        let toastTimeout = null;
        let isInHdArea = false;
        let wasOsmDisabledByHd = false;
        let osmBuildingsWasVisible = true;
        let hdTilesetsVisible = false; 

        function showToast(text, duration = 4000) {
            toast.textContent = text;
            toast.classList.add('show');
            clearTimeout(toastTimeout);
            toastTimeout = setTimeout(() => {
                toast.classList.remove('show');
            }, duration);
        }

        function setBuildingsVisible(visible) {
            if (!buildingsPrimitive) return;
            state.buildingsVisible = visible;
            buildingsPrimitive.show = visible;
            if (visible) {
                toggleBuildingsBtn.textContent = '🏢 3D建筑';
                toggleBuildingsBtn.classList.add('active');
            } else {
                toggleBuildingsBtn.textContent = '🏚️ 建筑隐藏';
                toggleBuildingsBtn.classList.remove('active');
            }
        }

        try {
            buildingsPrimitive = await createOsmBuildingsAsync();
            viewer.scene.primitives.add(buildingsPrimitive);
            setBuildingsVisible(false);
        } catch (e) {
            console.warn('OSM建筑加载失败', e);
            toggleBuildingsBtn.textContent = '🚫 建筑不可用';
            toggleBuildingsBtn.disabled = true;
            toggleBuildingsBtn.style.opacity = '0.5';
        }

        

        // ----- 高精度模型加载与管理 -----
        const hdCityAssets = [
            { id: 354307, name: '丹佛' },
            { id: 57588, name: '华盛顿D.C.' },
            { id: 57590, name: '华盛顿州' },
            { id: 2644092, name: '悉尼' },
            { id: 354759, name: '波士顿' },
            { id: 69380, name: '墨尔本' },
            { id: 1415196, name: '旧金山' },
        ];
        const hdTilesets = [];

        async function loadHdCities() {
            // 使用并行加载，任何一个失败都不影响其他
            const results = await Promise.allSettled(
                hdCityAssets.map(async (item) => {
                    const tileset = await Cesium3DTileset.fromIonAssetId(item.id);
                    tileset.show = false;
                    viewer.scene.primitives.add(tileset);
                    return { name: item.name, tileset };
                })
            );
            // 处理结果
            for (const result of results) {
                if (result.status === 'fulfilled') {
                    const { name, tileset } = result.value;
                    hdTilesets.push(tileset);
                    console.log(`✅ 高精度模型加载: ${name}`);
                } else {
                    console.warn(`⚠️ 加载失败:`, result.reason);
                }
            }
        }

        // 非阻塞加载（不等待完成）
        loadHdCities().catch(e => console.warn('高精度模型加载失败', e));
        
        function closeInfo() {
            document.getElementById('infoModal').classList.remove('active');
        }
        function closeIterlog() {
            document.getElementById('iterlogModal').classList.remove('active');
        }

        // 调用 initUI，传入所有需要的依赖
        initUI(viewer, {
            buildingsPrimitive,
            state,
            setBuildingsVisible,
            showToast,
            isInHdArea,
            hdTilesetsVisible,
            setHdTilesetsVisible,
            hdToggleBtn,
            toggleBuildingsBtn,
            closeInfo,
            closeIterlog,
        });

        function setHdTilesetsVisible(visible) {
            hdTilesetsVisible = visible;
            for (const tileset of hdTilesets) {
                tileset.show = visible;
            }
        }
        setHdTilesetsVisible(false);
        

        // ----- 覆盖区检测与联动 -----
        let lastCheckTime = 0;
        function checkCameraPosition() {
            if (window._isGoogleMode) return;
            const now = Date.now();
            if (now - lastCheckTime < 200) return;
            lastCheckTime = now;

            const carto = viewer.camera.positionCartographic;
            if (!carto) return;
            const lon = CesiumMath.toDegrees(carto.longitude);
            const lat = CesiumMath.toDegrees(carto.latitude);
            

            let inArea = false;
            for (const area of hdAreas) {
                const dist = Cartesian3.distance(
                    Cartesian3.fromDegrees(area.lon, area.lat),
                    Cartesian3.fromDegrees(lon, lat)
                );
                if (dist < area.radius) {
                    inArea = true;
                    break;
                }
            }

            // 进入覆盖区
            if (inArea && !isInHdArea) {
                isInHdArea = true;
                osmBuildingsWasVisible = state.buildingsVisible; // 记录进入前的状态

                // 如果当前3D建筑是开启的，自动关闭（但按钮不禁用）
                if (state.buildingsVisible && buildingsPrimitive) {
                    setBuildingsVisible(false);
                    wasOsmDisabledByHd = true;
                    showToast('📍 检测到高精度建模覆盖区域，已自动关闭“3D建筑”');
                } else {
                    wasOsmDisabledByHd = false;
                }

                // 显示高精度按钮，默认状态为关闭（不开启）
                hdToggleBtn.style.display = 'inline-block';
                hdToggleBtn.textContent = '🏙️ 高精度建模（关闭）';
                hdToggleBtn.classList.remove('active');
                // 确保3D建筑按钮可用（不禁用）
                toggleBuildingsBtn.disabled = false;
                toggleBuildingsBtn.style.opacity = '1';
                toggleBuildingsBtn.style.cursor = 'pointer';
                // 如果高精度模型是开启的（可能残留），强制关闭
                if (hdTilesetsVisible) {
                    setHdTilesetsVisible(false);
                    hdTilesetsVisible = false;
                }
                // 根据3D建筑状态决定高精度按钮是否可点击（互斥）
                // 如果3D建筑开启，高精度按钮灰；否则可点
                if (state.buildingsVisible) {
                    hdToggleBtn.disabled = true;
                    hdToggleBtn.style.opacity = '0.5';
                    hdToggleBtn.style.cursor = 'not-allowed';
                } else {
                    hdToggleBtn.disabled = false;
                    hdToggleBtn.style.opacity = '1';
                    hdToggleBtn.style.cursor = 'pointer';
                }
            }

            // 离开覆盖区
            if (!inArea && isInHdArea) {
                isInHdArea = false;

                // 如果是因为进入而关闭了3D建筑，并且高精度没有开启，则恢复3D建筑
                if (wasOsmDisabledByHd && osmBuildingsWasVisible && !hdTilesetsVisible) {
                    if (buildingsPrimitive) {
                        setBuildingsVisible(true);
                    }
                }

                // 隐藏高精度按钮
                hdToggleBtn.style.display = 'none';
                // 恢复3D建筑按钮可用
                toggleBuildingsBtn.disabled = false;
                toggleBuildingsBtn.style.opacity = '1';
                toggleBuildingsBtn.style.cursor = 'pointer';

                // 如果高精度模型是开启的，自动关闭
                if (hdTilesetsVisible) {
                    setHdTilesetsVisible(false);
                    hdTilesetsVisible = false;
                    showToast('📍 已离开高精度建模覆盖区域，已自动关闭高精度模型');
                }
                wasOsmDisabledByHd = false;
            }

            if (isInHdArea) {
                if (hdTilesetsVisible) {
                    hdToggleBtn.textContent = '🏙️ 高精度建模（开启）';
                    hdToggleBtn.classList.add('active');
                } else {
                    hdToggleBtn.textContent = '🏙️ 高精度建模（关闭）';
                    hdToggleBtn.classList.remove('active');
                }
            }
        }

        viewer.camera.changed.addEventListener(checkCameraPosition);
        setTimeout(checkCameraPosition, 1000);

        // ----- 高精度按钮事件 -----
                hdToggleBtn.addEventListener('click', () => {
            if (!isInHdArea) {
                showToast('⚠️ 当前不在高精度建模覆盖区域');
                return;
            }
            // 如果3D建筑正在开启，先关闭3D建筑
            if (state.buildingsVisible && buildingsPrimitive) {
                setBuildingsVisible(false);
                // 3D建筑关闭后，高精度按钮恢复可点击（如果之前被禁用）
                hdToggleBtn.disabled = false;
                hdToggleBtn.style.opacity = '1';
                hdToggleBtn.style.cursor = 'pointer';
                wasOsmDisabledByHd = true; // 记录是因为高精度而关闭
            }

            // 切换高精度状态
            const newState = !hdTilesetsVisible;
            setHdTilesetsVisible(newState);
            hdTilesetsVisible = newState;

            if (newState) {
                // 高精度开启
                hdToggleBtn.textContent = '🏙️ 高精度建模（开启）';
                hdToggleBtn.classList.add('active');
                // 3D建筑按钮变灰
                toggleBuildingsBtn.disabled = true;
                toggleBuildingsBtn.style.opacity = '0.5';
                toggleBuildingsBtn.style.cursor = 'not-allowed';
                showToast('🏙️ 高精度建模已开启，3D建筑自动关闭');
            } else {
                // 高精度关闭
                hdToggleBtn.textContent = '🏙️ 高精度建模（关闭）';
                hdToggleBtn.classList.remove('active');
                // 3D建筑按钮恢复可用，并自动开启3D建筑（如果之前是因为高精度而关闭）
                toggleBuildingsBtn.disabled = false;
                toggleBuildingsBtn.style.opacity = '1';
                toggleBuildingsBtn.style.cursor = 'pointer';
                if (wasOsmDisabledByHd && !buildingsVisible && buildingsPrimitive) {
                    setBuildingsVisible(true);
                    showToast('🏙️ 高精度已关闭，3D建筑已恢复');
                }
                // 高精度按钮本身保持可点击（但当前是关闭状态）
                hdToggleBtn.disabled = false;
                hdToggleBtn.style.opacity = '1';
                hdToggleBtn.style.cursor = 'pointer';
            }
        });



        // 激活谷歌3D地球（从“关于”弹窗中触发）
        document.getElementById('activateGoogle3D').addEventListener('click', async function(e) {
            e.preventDefault();
            
            window._isGoogleMode = true; 

                // --- 0. 网络预检：尝试访问 google.com ---
            // --- 0. 网络预检：通过加载 Google 的 favicon 检测连通性（绕过 CORS）---
            try {
                console.log('🔍 正在检测 Google 网络连通性...');
                const img = new Image();
                img.src = 'https://www.google.com/favicon.ico';
                // 超时控制：5秒未加载完成则视为失败
                const timeoutPromise = new Promise((_, reject) => {
                    setTimeout(() => reject(new Error('加载超时')), 5000);
                });
                const loadPromise = new Promise((resolve, reject) => {
                    img.onload = () => resolve();
                    img.onerror = () => reject(new Error('图片加载失败'));
                });
                await Promise.race([loadPromise, timeoutPromise]);
                console.log('✅ Google 网络连通');
            } catch (error) {
                showToast('⚠️ 无法连接 Google 服务，请检查 VPN 或代理是否开启');
                console.warn('网络检测失败:', error);
                return; // 直接退出，不消耗任何会话
            }

            try {
                // --- 1. 清除现有底图 ---
                viewer.imageryLayers.removeAll();
                console.log('🗑️ 已清除默认影像图层');

                // --- 2. 加载谷歌 3D Tiles ---
                const tileset = await Cesium3DTileset.fromIonAssetId(2275207);
                tileset.show = true;
                viewer.scene.primitives.add(tileset);
                // 保存引用，以便退出时移除
                window._googleTileset = tileset;
                console.log('✅ 谷歌3D Tiles 已加载');

                const layerButton =
                    document.querySelector(".cesium-baseLayerPicker-selected")
                            .closest("button");

                if (layerButton) {
                    layerButton.style.display = "none";
                }

                window._defaultTerrainProvider = viewer.terrainProvider;
                viewer.terrainProvider = new EllipsoidTerrainProvider();

                // --- 3. 飞到香港 ---
                viewer.camera.flyTo({
                    destination: Cartesian3.fromDegrees(114.1694, 22.3193, 800),
                    duration: 2
                });

                // --- 4. 关闭“关于”弹窗 ---
                closeInfo();

                // --- 5. UI 切换：隐藏无关按钮，替换“关于”按钮的行为 ---
            // 隐藏：3D建筑、迭代记录
            document.getElementById('buildingsToggleBtn').style.display = 'none';
            document.getElementById('iterlogBtn').style.display = 'none';
            // 保留“关于”按钮，但替换点击事件
            const infoBtn = document.getElementById('infoBtn');
            // 保存原来的点击事件（以便退出时恢复）
            if (!window._originalInfoClick) {
                window._originalInfoClick = infoBtn._listeners ? infoBtn._listeners['click'] : null;
            }
            // 移除所有 click 事件（如果有多个）
            infoBtn.replaceWith(infoBtn.cloneNode(true));
            // 重新获取（因为 clone 后 ID 不变）
            const newInfoBtn = document.getElementById('infoBtn');
            // 绑定新的点击事件：打开谷歌模式专属关于
            newInfoBtn.addEventListener('click', function() {
                document.getElementById('infoModalGoogle').classList.add('active');
            });
            // 显示“退出”按钮
            document.getElementById('exitGoogleBtn').style.display = 'inline-block';

                            // --- 6. 提示用户 ---
                showToast('🌍 谷歌3D地球已激活，并飞往香港');

            } catch (error) {
                console.error('❌ 激活谷歌3D失败:', error);
                showToast('⚠️ 谷歌3D加载失败，请检查网络或VPN');
            }
        });

        document.getElementById('exitGoogleBtn').addEventListener('click', async function() {
              window._isGoogleMode = false;
        document.getElementById('buildingsToggleBtn').disabled = false;
        document.getElementById('buildingsToggleBtn').style.opacity = '1';
        document.getElementById('buildingsToggleBtn').style.cursor = 'pointer';

            try {
                // --- 1. 移除谷歌 3D Tiles ---
                if (window._googleTileset) {
                    viewer.scene.primitives.remove(window._googleTileset);
                    window._googleTileset = null;
                    console.log('🗑️ 已移除谷歌3D Tiles');
                }

                // --- 2. 恢复哨兵2底图 ---
                // 从底图选择器中重新选中哨兵2
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
                    // 如果找不到哨兵2，添加默认底图
                    viewer.imageryLayers.addImageryProvider(
                        new IonImageryProvider({ assetId: 2 }) // 备用：Bing Aerial
                    );
                }
                console.log('🔄 已恢复哨兵2底图');

                const layerButton =
                    document.querySelector(".cesium-baseLayerPicker-selected")
                            .closest("button");

                if (layerButton) {
                    layerButton.style.display = "";
                }

                if (window._defaultTerrainProvider) {
                viewer.terrainProvider = window._defaultTerrainProvider;
                }
                // --- 3. 飞回北京 ---
                viewer.camera.flyTo({
                    destination: Cartesian3.fromDegrees(116.4, 39.9, 1000000),
                    duration: 2
                });

                // --- 4. UI 恢复 ---
        document.getElementById('buildingsToggleBtn').style.display = 'inline-block';
        document.getElementById('iterlogBtn').style.display = 'inline-block';
        document.getElementById('exitGoogleBtn').style.display = 'none';

        // 恢复“关于”按钮的原始点击事件（打开普通关于）
        const infoBtn = document.getElementById('infoBtn');
        infoBtn.replaceWith(infoBtn.cloneNode(true));
        const newInfoBtn = document.getElementById('infoBtn');
        newInfoBtn.addEventListener('click', function() {
            document.getElementById('infoModal').classList.add('active');
        });

                // --- 5. 提示用户 ---
                showToast('✅ 已退出Google地球，恢复默认模式');

            } catch (error) {
                console.error('❌ 退出Google地球失败:', error);
                showToast('⚠️ 退出失败，请刷新页面重试');
            }
        });

        
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                if (infoModal.classList.contains('active')) closeInfo();
                if (iterlogModal.classList.contains('active')) closeIterlog();
            }
        });

        // ----- 初始飞向北京 -----
        viewer.camera.flyTo({
            destination: Cartesian3.fromDegrees(116.4, 39.9, 1000000),
            duration: 3
        });

        console.log('🌍 Locus Maps 启动成功！');
        console.log('💡 高精度联动已启用：进入丹佛/华盛顿DC/华盛顿州/悉尼/波士顿区域自动切换。');

        // 🧭 指南针 & 俯仰控制
        // 1. 动态旋转指北针
        const compassContainer = document.getElementById('compassContainer');
        const compassSvg = document.getElementById('compassSvg');
        const tiltUpBtn = document.getElementById('tiltUpBtn');
        const tiltDownBtn = document.getElementById('tiltDownBtn');
        const resetTiltBtn = document.getElementById('resetTiltBtn');

        // 初始化旋转角度
        function updateCompass() {
            if (!viewer || !viewer.camera) return;
            const heading = viewer.camera.heading; // 弧度，0=北，顺时针为正
            const degrees = -CesiumMath.toDegrees(heading); // 转为度数并取反（适配视觉方向）
            compassSvg.style.transform = `rotate(${degrees}deg)`;
            compassSvg.style.transition = 'transform 0.15s ease-out'; // 加一点平滑过渡
        }

        // 监听相机变化
        viewer.camera.changed.addEventListener(updateCompass);
        // 初始执行一次
        setTimeout(updateCompass, 100);

        // 点击罗盘：重置为正北方向（保留实用功能）
        compassContainer.addEventListener('click', () => {
            const cam = viewer.camera;
            const carto = cam.positionCartographic;
            const currentPitch = cam.pitch;
            const currentRoll = cam.roll;
            viewer.camera.flyTo({
                destination: Cartesian3.fromRadians(carto.longitude, carto.latitude, carto.height),
                orientation: {
                    heading: 0,             
                    pitch: currentPitch,
                    roll: currentRoll
                },
                duration: 0.8
            });
            showToast('🧭 已重置为正北方向');
        });
        // 2. 向上倾斜（平视）
        tiltUpBtn.addEventListener('click', () => {
            const cam = viewer.camera;
            const heading = cam.heading;
            const pitch = cam.pitch;
            const roll = cam.roll;
            // 增加俯仰角（向上），限制不能超过 -5 度（接近水平）
            const newPitch = Math.min(pitch + 0.15, -0.08);
            if (newPitch === pitch) {
                showToast('⚠️ 已达到最平视角');
                return;
            }
            const carto = cam.positionCartographic;
            viewer.camera.flyTo({
                destination: Cartesian3.fromRadians(carto.longitude, carto.latitude, carto.height),
                orientation: { heading, pitch: newPitch, roll },
                duration: 0.5
            });
        });

        // 3. 向下倾斜（俯视）
        tiltDownBtn.addEventListener('click', () => {
            const cam = viewer.camera;
            const heading = cam.heading;
            const pitch = cam.pitch;
            const roll = cam.roll;
            // 减小俯仰角（向下），限制不能超过 -85 度（垂直俯视）
            const newPitch = Math.max(pitch - 0.15, -CesiumMath.PI_OVER_TWO + 0.05);
            if (newPitch === pitch) {
                showToast('⚠️ 已达到最垂直视角');
                return;
            }
            const carto = cam.positionCartographic;
            viewer.camera.flyTo({
                destination: Cartesian3.fromRadians(carto.longitude, carto.latitude, carto.height),
                orientation: { heading, pitch: newPitch, roll },
                duration: 0.5
            });
        });

        // 4. 重置俯仰角（回到默认的 -45 度，保持当前方向）
        resetTiltBtn.addEventListener('click', () => {
            const cam = viewer.camera;
            const heading = cam.heading;
            const roll = cam.roll;
            const carto = cam.positionCartographic;
            viewer.camera.flyTo({
                destination: Cartesian3.fromRadians(carto.longitude, carto.latitude, carto.height),
                orientation: {
                    heading: heading,
                    pitch: CesiumMath.toRadians(-45),
                    roll: roll
                },
                duration: 0.6
            });
            showToast('⟲ 俯仰角已重置');
        });

        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('sw.js')
                .then(reg => console.log('SW registered:', reg))
                .catch(err => console.log('SW registration failed:', err));
        }
