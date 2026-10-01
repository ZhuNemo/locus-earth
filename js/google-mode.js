import { Cartesian3, EllipsoidTerrainProvider, IonImageryProvider, Cesium3DTileset } from 'cesium';

export function initGoogleMode(viewer, showToast, closeInfo, closeIterlog) {

        // 恢复默认底图（哨兵2，Ion 资产 3954）。
        // 进入谷歌模式时会清空全部影像图层，因此无论是正常退出
        // 还是加载失败降级，都必须把底图放回来，否则会留下一个全黑的球。
        function restoreDefaultBasemap() {
            viewer.imageryLayers.removeAll();
            return IonImageryProvider.fromAssetId(3954)
                .then(provider => {
                    viewer.imageryLayers.addImageryProvider(provider);
                    viewer.scene.requestRender();
                    console.log('↻ 已恢复哨兵2底图');
                })
                .catch(e => {
                    console.error('哨兵2底图恢复失败:', e);
                });
        }

        // 激活谷歌3D地球（从“关于”弹窗中触发）
        document.getElementById('activateGoogle3D').addEventListener('click', async function(e) {
            e.preventDefault();

            // --- 0. 网络预检：通过加载 Google 的 favicon 检测连通性---
            try {
                console.log('🔍 正在检测 Google 网络连通性...');
                const img = new Image();
                img.src = 'https://www.google.com/favicon.ico';
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
                return;
            }

            window._isGoogleMode = true; 

            try {
                // --- 1. 清除现有底图 ---
                viewer.imageryLayers.removeAll();
                console.log('🗑️ 已清除默认影像图层');

                // --- 2. 加载谷歌 3D Tiles ---
                // 2275207 是 Cesium 的演示资产，可能被限流或下架，
                // 因此单独捕获并就地降级，而不是让外层 catch 只报一句“请检查网络环境”。
                let tileset;
                try {
                    tileset = await Cesium3DTileset.fromIonAssetId(2275207);
                } catch (assetError) {
                    console.error('❌ 谷歌3D资产加载失败（可能被限流或已下架）:', assetError);
                    // 关键：底图已在第 1 步被清空，不回滚就会留下一个全黑的球。
                    // 此时按钮显隐尚未被改动（那是后面第 5 步才做的），无需还原按钮。
                    await restoreDefaultBasemap();
                    window._isGoogleMode = false;
                    showToast('⚠️ 谷歌3D地球暂时不可用（资产加载失败），已恢复默认底图');
                    return;
                }
                tileset.show = true;
                viewer.scene.primitives.add(tileset);
                window._googleTileset = tileset;
                console.log('✅ 谷歌3D Tiles 已加载');

                // 隐藏底图选择器按钮
                const layerButton = document.querySelector(".cesium-baseLayerPicker-selected")?.closest("button");
                if (layerButton) layerButton.style.display = "none";

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
                const bBtn = document.getElementById('buildingsToggleBtn');
                if (bBtn) bBtn.style.display = 'none'; 

                const iBtn = document.getElementById('iterlogBtn');
                if (iBtn) iBtn.style.display = 'none';

                // “关于”按钮不再通过替换 DOM 节点来改行为：
                // ui.js 的处理器会读取 window._isGoogleMode（本函数开头已置为 true）
                // 并自动指向谷歌模式的弹窗。替换节点会丢失元素上已注册的监听器。

                // 显示“退出”按钮
                const eBtn = document.getElementById('exitGoogleBtn');
                if (eBtn) eBtn.style.display = 'inline-block';

                // --- 6. 提示用户 ---
                showToast('🌍 谷歌3D地球已激活，并飞往香港');

            } catch (error) {
                console.error('❌ 激活Google3D失败:', error);
                showToast('⚠️ 谷歌3D加载失败，请检查网络环境');

                const bBtn = document.getElementById('buildingsToggleBtn');
                const iBtn = document.getElementById('iterlogBtn');
                const eBtn = document.getElementById('exitGoogleBtn');
                
                if (bBtn) bBtn.style.display = 'inline-block';
                if (iBtn) iBtn.style.display = 'inline-block';
                if (eBtn) eBtn.style.display = 'inline-block';
            }
        });

        document.getElementById('exitGoogleBtn').addEventListener('click', async function() {
            
            const bBtn = document.getElementById('buildingsToggleBtn');
            const iBtn = document.getElementById('iterlogBtn');
            const eBtn = document.getElementById('exitGoogleBtn');

            if (bBtn) {
                bBtn.disabled = false;
                bBtn.style.opacity = '1';
                bBtn.style.cursor = 'pointer';
                bBtn.style.display = 'inline-block';
            }
            if (iBtn) iBtn.style.display = 'inline-block';
            if (eBtn) eBtn.style.display = 'none';

            try {
                // --- 1. 移除谷歌 3D Tiles ---
                if (window._googleTileset) {
                    viewer.scene.primitives.remove(window._googleTileset);
                    window._googleTileset = null;
                    console.log('🗑️ 已移除谷歌3D Tiles');
                }

                // --- 2. 恢复哨兵2底图 ---
                restoreDefaultBasemap();

                // 恢复底图选择器按钮
                const layerButton = document.querySelector(".cesium-baseLayerPicker-selected")?.closest("button");
                if (layerButton) layerButton.style.display = "";

                // 恢复地形
                if (window._defaultTerrainProvider) {
                    const userWantsTerrain = localStorage.getItem('terrainEnabled') !== 'false';
                    if (userWantsTerrain) {
                        viewer.terrainProvider = window._defaultTerrainProvider;
                    } else {
                        viewer.terrainProvider = new EllipsoidTerrainProvider();
                    }
                }

                // --- 3. 飞回北京 ---
                viewer.camera.flyTo({
                    destination: Cartesian3.fromDegrees(116.4, 39.9, 1000000),
                    duration: 2
                });
setTimeout(() => viewer.scene.requestRender(), 500);

                // 复位谷歌模式标志：ui.js 的“关于”处理器据此回到默认弹窗。
                // 这一步是必须的 —— 除了按钮行为，hd-layers.js 的 checkCameraPosition
                // 在 window._isGoogleMode 为真时会直接 return；若不复位，
                // 高精度建模的区域自动联动会在退出后永久失效。
                window._isGoogleMode = false;

                showToast('已退出Google地球，恢复默认模式');

            } catch (error) {
                console.error('❌ 退出Google地球失败:', error);
                showToast('⚠️ 退出失败，请刷新页面重试');
                if (eBtn) eBtn.style.display = 'inline-block';
            }
        });

        document.addEventListener('keydown', (e) => {
            if (e.key !== 'Escape') return;

            const infoModal = document.getElementById('infoModal');
            const iterlogModal = document.getElementById('iterlogModal');

            if (infoModal && infoModal.classList.contains('active')) closeInfo();
            if (iterlogModal && iterlogModal.classList.contains('active')) closeIterlog();
        });
}