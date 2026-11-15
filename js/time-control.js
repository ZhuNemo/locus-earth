// ============================================================================
// 时间与光照控制：两条独立的「刻度带」（时刻 / 日期）
// ----------------------------------------------------------------------------
// 交互模型（别改错）：
//   · 刻度带 = 无限卷尺，整体左右平移；红线固定在正中，**只做对齐提示、不可拖动**。
//     红线读出的「日期 + 时刻」才是地球上正在显示的光照时间。
//   · 手指往右拖 = 刻度带右移 = 时间往过去走。
//   · 上条只改「一天中的时刻」（0 点绕回 23:59，不动日期）；
//     下条只改「日期」，且按整天步进 —— 给小数天会把时刻一起带走。
//
// 单位换算的唯一来源是 CSS 变量 --tc-hour-px / --tc-day-px：JS 读同一份值算位移，
// 不要在两边各写一个数字，否则改一个漏一个，刻度和数值就对不上了。
// ============================================================================

import { JulianDate } from './cesium.js';

const MS_PER_DAY = 86400000;
const MINUTES_PER_DAY = 1440;
const HOURS_PER_DAY = 24;

/** 时刻刻度带铺几份 24 小时：一份 24h 已宽于面板一半，取 3 份保证两侧都有内容露出 */
const HOUR_COPIES = 3;

/** 日期刻度带一次生成多少天；离窗口边缘多近时重建（重建时视觉位置不变） */
const DATE_WINDOW_DAYS = 480;
const DATE_WINDOW_MARGIN = 200;

// Intl 实例提到模块作用域只构造一次：clock.onTick 每帧触发，构造开销大。
// ⚠️ 日期与时刻分两个 formatter：合成一个 { month, day, hour, minute } 时
//    en-US 会输出 "November 15 at 11:32"（连接词 "at"），而界面要的是逗号。
// ⚠️ 取 hourCycle: 'h23' 而不是 hour12: false —— 后者在 en-US 下是 h24，
//    0:30 会显示成 "24:30"。
const FORMAT_MONTH_DAY = new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric'
});

const FORMAT_CLOCK = new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23'
});

const FORMAT_DATE = new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
});

// ⚠️ 月份名用 UTC 格式化：标签的位置来自 UTC 天序号，
//    用本地时区格式化会在负时区把 1 月 1 日读成上一年 12 月。
const FORMAT_MONTH = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    timeZone: 'UTC'
});

function pad2(value) {
    return String(value).padStart(2, '0');
}

/** 本地日历日 → 天序号（UTC 日粒度，不受时区与夏令时影响，跨天不会错位） */
function dayNumberOf(date) {
    return Math.floor(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / MS_PER_DAY);
}

/** 天序号 → 该日 UTC 零点（读年份/月份要用 getUTC*） */
function utcDateOfDay(dayNum) {
    return new Date(dayNum * MS_PER_DAY);
}

export function initTimeControl(viewer) {
    const timeControl = document.getElementById('time-control');
    const timeLabel = document.getElementById('current-time-label');
    const resetButton = document.getElementById('reset-time-btn');
    const timeStrip = document.getElementById('time-strip');
    const dateStrip = document.getElementById('date-strip');
    const timeScale = document.getElementById('time-scale');
    const dateScale = document.getElementById('date-scale');

    if (!timeControl || !timeLabel || !resetButton ||
        !timeStrip || !dateStrip || !timeScale || !dateScale) {
        return { setVisible() {} };
    }

    let isVisible = true;
    let lastRenderedMinute = null;

    /** 每单位宽度（px），从 CSS 变量读，见文件头 */
    let hourPx = 64;
    let dayPx = 20;
    /** 红线到刻度带左沿的距离 = 刻度带的半宽 */
    let centerX = 0;
    /** 日期刻度带窗口的首日天序号；null = 还没建 */
    let windowStartDay = null;

    // ------------------------------------------------------------------
    // 尺寸
    // ------------------------------------------------------------------
    function readMetrics() {
        const style = getComputedStyle(timeControl);
        const hour = parseFloat(style.getPropertyValue('--tc-hour-px'));
        const day = parseFloat(style.getPropertyValue('--tc-day-px'));
        if (hour > 0) hourPx = hour;
        if (day > 0) dayPx = day;
        centerX = timeStrip.clientWidth / 2;
    }

    // ------------------------------------------------------------------
    // 时刻刻度带：3 份 24 小时的首尾相接，整点标签 + 半点短刻度
    // ------------------------------------------------------------------
    function buildTimeScale() {
        const fragment = document.createDocumentFragment();
        for (let copy = 0; copy < HOUR_COPIES; copy++) {
            for (let hour = 0; hour < HOURS_PER_DAY; hour++) {
                const label = document.createElement('span');
                label.className = 'time-control__label';
                label.textContent = `${pad2(hour)}:00`;
                // 标签压在整点刻度正上方（transform: translateX(-50%) 在 CSS 里）
                label.style.left = `${(copy * HOURS_PER_DAY + hour) * hourPx}px`;
                fragment.appendChild(label);
            }
        }
        timeScale.textContent = '';
        timeScale.appendChild(fragment);
        timeScale.style.width = `${HOUR_COPIES * HOURS_PER_DAY * hourPx}px`;
    }

    // ------------------------------------------------------------------
    // 日期刻度带：以 referenceDay 为中心重新铺一段窗口
    // ------------------------------------------------------------------
    function buildDateScale(referenceDay) {
        windowStartDay = referenceDay - Math.floor(DATE_WINDOW_DAYS / 2);
        const endDay = windowStartDay + DATE_WINDOW_DAYS - 1;

        const fragment = document.createDocumentFragment();
        const firstVisible = utcDateOfDay(windowStartDay);
        let year = firstVisible.getUTCFullYear();
        let month = firstVisible.getUTCMonth();

        // 从窗口首日所在月份逐月推进到窗口末尾
        for (;;) {
            const monthStartDay = Math.floor(Date.UTC(year, month, 1) / MS_PER_DAY);
            if (monthStartDay > endDay) break;

            if (monthStartDay >= windowStartDay) {
                const left = `${(monthStartDay - windowStartDay) * dayPx}px`;

                // 月份起点比日刻度更长更亮：即使标签被挤出视野，也能看出月份边界在哪
                const rule = document.createElement('span');
                rule.className = 'time-control__month-rule';
                rule.style.left = left;
                fragment.appendChild(rule);

                const label = document.createElement('span');
                label.className = 'time-control__label time-control__label--month';
                const monthName = FORMAT_MONTH.format(new Date(Date.UTC(year, month, 1)));
                // 跨年处补上四位数年份，否则拖远了看不出是哪一年
                label.textContent = month === 0 ? `${monthName} ${year}` : monthName;
                label.style.left = left;
                fragment.appendChild(label);
            }

            month += 1;
            if (month > 11) {
                month = 0;
                year += 1;
            }
        }

        dateScale.textContent = '';
        dateScale.appendChild(fragment);
        dateScale.style.width = `${DATE_WINDOW_DAYS * dayPx}px`;
    }

    // ------------------------------------------------------------------
    // 渲染：把「红线对应的值」翻译成刻度带的位移
    // ------------------------------------------------------------------
    function renderTimeScale(current) {
        const minutesOfDay = current.getHours() * 60 + current.getMinutes() + current.getSeconds() / 60;
        // 第 2 份 24h 的 0 点对应当天 00:00，所以基准是 1×24h
        // 位移取整：小数像素会让 1px 刻度被摊成两半灰，看上去有的刻度又短又淡
        const offset = Math.round(centerX - (HOURS_PER_DAY + minutesOfDay / 60) * hourPx);
        timeScale.style.transform = `translate3d(${offset}px, 0, 0)`;
    }

    function renderDateScale(current) {
        const dayNum = dayNumberOf(current);
        if (windowStartDay === null ||
            dayNum < windowStartDay + DATE_WINDOW_MARGIN ||
            dayNum > windowStartDay + DATE_WINDOW_DAYS - DATE_WINDOW_MARGIN) {
            // 重建不会跳：位移同样按新窗口重算
            buildDateScale(dayNum);
        }
        const offset = Math.round(centerX - (dayNum - windowStartDay) * dayPx);
        dateScale.style.transform = `translate3d(${offset}px, 0, 0)`;
    }

    function updateAria(current) {
        const minutesOfDay = current.getHours() * 60 + current.getMinutes();
        timeStrip.setAttribute('aria-valuenow', String(minutesOfDay));
        timeStrip.setAttribute('aria-valuetext', `${pad2(current.getHours())}:${pad2(current.getMinutes())}`);
        dateStrip.setAttribute('aria-valuenow', String(dayNumberOf(current)));
        dateStrip.setAttribute('aria-valuetext', FORMAT_DATE.format(current));
    }

    // force = true 时跳过节流：拖拽 / 按键 / 复位 / 重新显示需要立即反馈。
    function render(force) {
        if (!isVisible && !force) return;
        if (centerX <= 0) readMetrics();

        const current = JulianDate.toDate(viewer.clock.currentTime);

        // 按分钟去重：界面最细只到分钟，同一分钟内的重复渲染可以整段跳过
        const minute = Math.floor(current.getTime() / 60000);
        if (!force && minute === lastRenderedMinute) return;
        lastRenderedMinute = minute;

        timeLabel.textContent = `${FORMAT_MONTH_DAY.format(current)}, ${FORMAT_CLOCK.format(current)}`;
        timeLabel.dateTime = current.toISOString();

        renderTimeScale(current);
        renderDateScale(current);
        updateAria(current);
    }

    function applyTime(date) {
        viewer.clock.currentTime = JulianDate.fromDate(date);
        render(true);
    }

    // ------------------------------------------------------------------
    // 拖拽
    // ------------------------------------------------------------------
    /**
     * @param {HTMLElement} strip 刻度带
     * @param {(base: Date, dx: number) => void} onShift base = 按下瞬间的时间，dx = 相对按下点的位移
     */
    function bindStripDrag(strip, onShift) {
        let drag = null;

        strip.addEventListener('pointerdown', (event) => {
            if (event.pointerType === 'mouse' && event.button !== 0) return;
            drag = {
                pointerId: event.pointerId,
                startX: event.clientX,
                base: JulianDate.toDate(viewer.clock.currentTime),
                moved: false
            };
            strip.setPointerCapture(event.pointerId);
            strip.classList.add('is-dragging');
        });

        strip.addEventListener('pointermove', (event) => {
            if (!drag || event.pointerId !== drag.pointerId) return;
            const dx = event.clientX - drag.startX;
            // 第一次真正位移时才停掉「跟随系统时间」：
            // 否则 clock 每帧把 currentTime 推回现在，用户刚拨好的时刻立刻被冲掉。
            if (!drag.moved) {
                if (Math.abs(dx) < 1) return;
                drag.moved = true;
                viewer.clock.shouldAnimate = false;
            }
            onShift(drag.base, dx);
        });

        function finish(event) {
            if (!drag) return;
            if (strip.hasPointerCapture(event.pointerId)) strip.releasePointerCapture(event.pointerId);
            drag = null;
            strip.classList.remove('is-dragging');
        }

        strip.addEventListener('pointerup', finish);
        strip.addEventListener('pointercancel', finish);
    }

    /** 把「一天中的第几分钟」写回 base 那一天；分钟数先夹在 0..1439 内，避免进位改日期 */
    function atMinuteOfDay(base, minutesOfDay) {
        const target = new Date(base.getFullYear(), base.getMonth(), base.getDate(), 0, 0, 0, 0);
        target.setMinutes(Math.min(MINUTES_PER_DAY - 1, Math.max(0, Math.round(minutesOfDay))));
        return target;
    }

    function wrapMinutes(minutes) {
        return ((minutes % MINUTES_PER_DAY) + MINUTES_PER_DAY) % MINUTES_PER_DAY;
    }

    bindStripDrag(timeStrip, (base, dx) => {
        // 手指往右 → 刻度右移 → 时间往过去走
        const baseMinutes = base.getHours() * 60 + base.getMinutes();
        applyTime(atMinuteOfDay(base, wrapMinutes(baseMinutes - (dx / hourPx) * 60)));
    });

    bindStripDrag(dateStrip, (base, dx) => {
        // 整天步进：小数天会把时刻一起带走，两条带就互相打架了
        const dayDelta = Math.round(-dx / dayPx);
        applyTime(new Date(
            base.getFullYear(), base.getMonth(), base.getDate() + dayDelta,
            base.getHours(), base.getMinutes(), 0, 0
        ));
    });

    // ------------------------------------------------------------------
    // 键盘：与拖拽同语义（左减右加）
    // ------------------------------------------------------------------
    function handleArrowKeys(strip, onStep) {
        strip.addEventListener('keydown', (event) => {
            const direction = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0;
            if (!direction) return;
            event.preventDefault();
            // 键盘同样要脱离「跟随系统时间」
            viewer.clock.shouldAnimate = false;
            onStep(direction, event.shiftKey);
        });
    }

    handleArrowKeys(timeStrip, (direction, big) => {
        const current = JulianDate.toDate(viewer.clock.currentTime);
        const baseMinutes = current.getHours() * 60 + current.getMinutes();
        applyTime(atMinuteOfDay(current, wrapMinutes(baseMinutes + direction * (big ? 60 : 5))));
    });

    handleArrowKeys(dateStrip, (direction, big) => {
        const current = JulianDate.toDate(viewer.clock.currentTime);
        const step = direction * (big ? 7 : 1);
        applyTime(new Date(
            current.getFullYear(), current.getMonth(), current.getDate() + step,
            current.getHours(), current.getMinutes(), 0, 0
        ));
    });

    // ------------------------------------------------------------------
    // Now / 时钟 / 尺寸变化 / 显隐
    // ------------------------------------------------------------------
    resetButton.addEventListener('click', () => {
        viewer.clock.currentTime = JulianDate.fromDate(new Date());
        // 光照开着时回到「跟随系统时间」；否则手动拨的时间会一直冻住
        viewer.clock.shouldAnimate = viewer.scene.globe.enableLighting;
        render(true);
    });

    window.addEventListener('resize', () => {
        readMetrics();
        buildTimeScale();
        buildDateScale(dayNumberOf(JulianDate.toDate(viewer.clock.currentTime)));
        render(true);
    });

    readMetrics();
    buildTimeScale();
    render(true);

    // onTick 每帧触发，走节流路径。
    // 必须用箭头函数包一层：直接传 render 会把 Clock 实例当作 force 参数。
    viewer.clock.onTick.addEventListener(() => render(false));

    return {
        setVisible(visible) {
            timeControl.classList.toggle('is-hidden', !visible);
            timeStrip.tabIndex = visible ? 0 : -1;
            dateStrip.tabIndex = visible ? 0 : -1;
            isVisible = visible;
            if (visible) {
                // display:none 期间 clientWidth 为 0，必须先重新量尺寸再渲染
                readMetrics();
                render(true);
            }
        }
    };
}
