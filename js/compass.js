import { Cartesian3, Math as CesiumMath } from 'cesium';

export function initCompass(viewer, showToast) {
        
        // 指南针 & 俯仰控制
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
        // 放大
        document.getElementById('zoomInBtn').addEventListener('click', () => {
            const carto = viewer.camera.positionCartographic;
            const newHeight = carto.height * 0.7;  // 拉近到70%
            if (newHeight < 10) { showToast('⚠️ 已到最近距离'); return; }
            viewer.camera.flyTo({
                destination: Cartesian3.fromRadians(carto.longitude, carto.latitude, newHeight),
                duration: 0.3
            });
        });

        // 缩小
        document.getElementById('zoomOutBtn').addEventListener('click', () => {
            const carto = viewer.camera.positionCartographic;
            const newHeight = carto.height * 1.4;  // 拉远到140%
            viewer.camera.flyTo({
                destination: Cartesian3.fromRadians(carto.longitude, carto.latitude, newHeight),
                duration: 0.3
            });
        });

        // 4. 重置俯仰角（与地面垂直，保持当前方向）
        resetTiltBtn.addEventListener('click', () => {
            const cam = viewer.camera;
            const heading = cam.heading;
            const roll = cam.roll;
            const carto = cam.positionCartographic;
            viewer.camera.flyTo({
                destination: Cartesian3.fromRadians(carto.longitude, carto.latitude, carto.height),
                orientation: {
                    heading: heading,
                    pitch: -CesiumMath.PI_OVER_TWO,
                    roll: 0
                },
                duration: 0.6
            });
            showToast('↺ 俯仰角已重置');
        });

}