import { Cartesian3, EllipsoidTerrainProvider, IonImageryProvider, Cesium3DTileset } from 'cesium';

export function initGoogleMode(viewer, showToast, closeInfo, closeIterlog) {
       
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
                showToast('⚠️ 无法连接 Google 服务，请检查网络环境');
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
                showToast('⚠️ 谷歌3D加载失败，请检查网络环境');
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
                console.log('↻ 已恢复哨兵2底图');

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

}