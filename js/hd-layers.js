import { createOsmBuildingsAsync, Cesium3DTileset, Cartesian3, Math as CesiumMath } from 'cesium';

export async function initHdLayers(viewer, showToast) {
        
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



        function setBuildingsVisible(visible) {
            if (!buildingsPrimitive) return;
            state.buildingsVisible = visible;
            buildingsPrimitive.show = visible;
            if (visible) {
                toggleBuildingsBtn.classList.add('active');
            } else {
                toggleBuildingsBtn.classList.remove('active');
            }
        }

        // #buildingsToggleBtn 是 <div>（index.html 中 role="button"），不是表单控件。
        // 因此给它赋 .disabled 没有任何原生效果：浏览器不会拦截点击，
        // :disabled 选择器也永远匹配不到它 —— 灰化只是 opacity/cursor 的视觉效果。
        // 这里把「可点击标志 + aria-disabled + 视觉」集中到一处维护，
        // 点击侧由 ui.js 读取该标志来真正拦截。
        function setBuildingsBtnEnabled(enabled) {
            toggleBuildingsBtn.disabled = !enabled;
            toggleBuildingsBtn.setAttribute('aria-disabled', String(!enabled));
            toggleBuildingsBtn.style.opacity = enabled ? '1' : '0.5';
            toggleBuildingsBtn.style.cursor = enabled ? 'pointer' : 'not-allowed';
        }

        try {
            buildingsPrimitive = await createOsmBuildingsAsync();
            viewer.scene.primitives.add(buildingsPrimitive);
            setBuildingsVisible(false);
        } catch (e) {
            console.warn('OSM建筑加载失败', e);
            setBuildingsBtnEnabled(false);
            toggleBuildingsBtn.classList.remove('active');
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
        
        

        function setHdTilesetsVisible(visible) {
            hdTilesetsVisible = visible;
            for (const tileset of hdTilesets) {
                tileset.show = visible;
            }
        }
        setHdTilesetsVisible(false);
        
        // 初始化标记功能

        // ----- 覆盖区检测与联动 -----
        let lastCheckTime = 0;
        function checkCameraPosition() {
             if (!isInHdArea) {
                hdToggleBtn.style.display = 'none';
            }
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
                osmBuildingsWasVisible = state.buildingsVisible; 

                // 如果当前3D建筑是开启的，自动关闭
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
                setBuildingsBtnEnabled(true);
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
                setBuildingsBtnEnabled(true);

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
                // 高精度开启期间禁止点击3D建筑按钮：
                // 必须先关闭高精度建模，才能再开启建筑白模
                setBuildingsBtnEnabled(false);
                showToast('🏙️ 高精度建模已开启，3D建筑自动关闭');
            } else {
                // 高精度关闭
                hdToggleBtn.textContent = '🏙️ 高精度建模（关闭）';
                hdToggleBtn.classList.remove('active');
                // 高精度已关闭，3D建筑按钮恢复可点击
                setBuildingsBtnEnabled(true);
                if (wasOsmDisabledByHd && !state.buildingsVisible && buildingsPrimitive) {
                    setBuildingsVisible(true);
                    showToast('🏙️ 高精度已关闭，3D建筑已恢复');
                }
                // 高精度按钮本身保持可点击（但当前是关闭状态）
                hdToggleBtn.disabled = false;
                hdToggleBtn.style.opacity = '1';
                hdToggleBtn.style.cursor = 'pointer';
            }
        });

        return {
            buildingsPrimitive,
            state,
            setBuildingsVisible,
            // 这两个布尔量会在相机移动（checkCameraPosition）与按钮点击时被改写。
            // 若作为普通属性返回，调用方拿到的只是返回那一刻的快照，之后永远不变，
            // 因此改用 getter 暴露实时值。
            // 注意：调用方必须直接持有本对象引用，不能在传入前做展开（{ ...hdLayers }），
            // 因为展开运算符会立即求值 getter，又把它拍平回快照。
            get isInHdArea() { return isInHdArea; },
            get hdTilesetsVisible() { return hdTilesetsVisible; },
            setHdTilesetsVisible,
            hdToggleBtn,
            toggleBuildingsBtn
        };

}