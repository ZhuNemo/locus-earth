import { JulianDate } from 'cesium';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function formatCurrentTime(date) {
    return new Intl.DateTimeFormat('en-US', {
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    }).format(date);
}

function formatHour(date) {
    return new Intl.DateTimeFormat('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    }).format(date);
}

function formatMonth(date) {
    return new Intl.DateTimeFormat('en-US', {
        month: 'short'
    }).format(date);
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

    function updateControl() {
        const currentDate = JulianDate.toDate(viewer.clock.currentTime);

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
        updateControl();
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
        updateControl();
    });

    resetButton.addEventListener('click', () => {
        const now = new Date();
        viewer.clock.currentTime = JulianDate.fromDate(now);
        updateControl();
    });

    viewer.clock.onTick.addEventListener(updateControl);
    updateControl();

    return {
        setVisible(visible) {
            timeControl.classList.toggle('is-hidden', !visible);
            slider.tabIndex = visible ? 0 : -1;
        }
    };
}
