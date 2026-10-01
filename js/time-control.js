import { JulianDate } from 'cesium';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

// 这三个 formatter 提升到模块作用域，只构造一次。
// Intl.DateTimeFormat 的构造开销很大，原先它们写在函数体内部，
// 而 updateControl 会被 clock.onTick 每帧触发，等于每秒构造上百次。
// 语言保持 en-US，与界面既有显示一致（切换 zh-CN 属于另一项待定改动）。
const FORMAT_CURRENT_TIME = new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
});

const FORMAT_HOUR = new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
});

const FORMAT_MONTH = new Intl.DateTimeFormat('en-US', {
    month: 'short'
});

function formatCurrentTime(date) {
    return FORMAT_CURRENT_TIME.format(date);
}

function formatHour(date) {
    return FORMAT_HOUR.format(date);
}

function formatMonth(date) {
    return FORMAT_MONTH.format(date);
}

export function initTimeControl(viewer) {
    const timeLabel = document.getElementById('current-time-label');
    const slider = document.getElementById('time-slider');
    const cursor = document.querySelector('.time-control__cursor');
    const resetButton = document.getElementById('reset-time-btn');
    const timeControl = document.getElementById('time-control');
    const hourLabels = [...document.querySelectorAll('.time-control__hours span')];
    const monthLabels = [...document.querySelectorAll('.time-control__months span')];

    if (!timeLabel || !slider || !cursor || !resetButton || !timeControl) {
        return {
            setVisible() {}
        };
    }

    let dragStartX = null;
    let dragStartTime = null;

    // 面板可见性 + 上一次真正渲染到的时间（按分钟取整）。
    // clock.onTick 每渲染一帧都会触发，而界面文字最细只到分钟，
    // 因此同一分钟内的重复渲染可以直接跳过。
    let isVisible = true;
    let lastRenderedMinute = null;

    function updateTimelineLabels(currentDate) {
        hourLabels.forEach((label, index) => {
            const date = new Date(currentDate.getTime() + (index - 3.5) * 60 * 60 * 1000);
            label.textContent = formatHour(date);
        });

        monthLabels.forEach((label, index) => {
            const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - 2 + index, 1);
            label.textContent = formatMonth(date);
        });
    }

    // force = true 时跳过节流：用户拖拽 / 按键 / 复位需要立即反馈。
    function updateControl(force) {
        // 面板隐藏时不做任何渲染
        if (!isVisible && !force) return;

        const currentDate = JulianDate.toDate(viewer.clock.currentTime);

        // 按分钟去重：同一分钟内文字不会有任何变化
        const minute = Math.floor(currentDate.getTime() / 60000);
        if (!force && minute === lastRenderedMinute) return;
        lastRenderedMinute = minute;

        timeLabel.textContent = formatCurrentTime(currentDate);
        timeLabel.dateTime = currentDate.toISOString();
        slider.value = '50';
        cursor.style.left = '50%';
        updateTimelineLabels(currentDate);
    }

    slider.addEventListener('pointerdown', (event) => {
        dragStartX = event.clientX;
        dragStartTime = JulianDate.toDate(viewer.clock.currentTime).getTime();
        slider.setPointerCapture(event.pointerId);
    });

    slider.addEventListener('pointermove', (event) => {
        if (dragStartX === null || dragStartTime === null) return;

        const width = slider.getBoundingClientRect().width;
        const offset = (event.clientX - dragStartX) / width;
        const date = new Date(dragStartTime + offset * MS_PER_DAY);
        viewer.clock.currentTime = JulianDate.fromDate(date);
        updateControl(true);
    });

    function stopDragging(event) {
        if (dragStartX === null) return;
        if (slider.hasPointerCapture(event.pointerId)) {
            slider.releasePointerCapture(event.pointerId);
        }
        dragStartX = null;
        dragStartTime = null;
    }

    slider.addEventListener('pointerup', stopDragging);
    slider.addEventListener('pointercancel', stopDragging);

    slider.addEventListener('keydown', (event) => {
        if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
        event.preventDefault();
        const offset = event.key === 'ArrowRight' ? 15 : -15;
        const date = new Date(JulianDate.toDate(viewer.clock.currentTime).getTime() + offset * 60 * 1000);
        viewer.clock.currentTime = JulianDate.fromDate(date);
        updateControl(true);
    });

    resetButton.addEventListener('click', () => {
        const now = new Date();
        viewer.clock.currentTime = JulianDate.fromDate(now);
        updateControl(true);
    });

    // onTick 每帧触发，走节流路径。
    // 必须用箭头函数包一层：直接传 updateControl 会把 Clock 实例当作 force 参数，
    // 那样节流就永远失效了。
    viewer.clock.onTick.addEventListener(() => updateControl());
    updateControl(true);

    return {
        setVisible(visible) {
            timeControl.classList.toggle('is-hidden', !visible);
            slider.tabIndex = visible ? 0 : -1;
            isVisible = visible;
            // 隐藏期间跳过了更新，重新显示时立即补一次
            if (visible) updateControl(true);
        }
    };
}
