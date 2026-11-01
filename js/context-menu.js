// ============================================================================
// 地图对象右键 / 长按菜单
// ----------------------------------------------------------------------------
// 拦截地图上「能拿到的那个对象」的默认行为：
//   · 桌面端   → 右键（contextmenu）
//   · 触屏端   → 长按 520ms（期间位移超过 8px 判定为拖动，不弹菜单）
//
// 菜单里只放「删除」这一类破坏性操作，删之前一律走页内确认框（js/dialogs.js），
// 确认后才交给对应模块的删除回调执行。
//
// 为什么用注册表而不是直接 import 业务模块：
//   bookmarks.js 与 measure.js 互相没有依赖，但它们都要能被这个菜单删除。
//   若这里反向 import 两者，将来任何一方想复用菜单逻辑就会变成循环依赖。
//   沿用 tool-modes.js 的做法：业务模块自己登记 { kind → 删除回调 }。
//
// 登记方式（在各自 init 里调一次即可）：
//   registerEntityDeleter('bookmark', (entity) => { … });
//
// 实体如何被识别：创建实体时打上标记
//   entity._locusKind = 'bookmark' | 'measure'
//   entity._measureType = 'distance' | 'area'   （仅 measure）
// ============================================================================

import { Cartesian2 } from './cesium.js';
import { askConfirm, isDialogOpen } from './dialogs.js';

/** 长按触发阈值 */
const LONG_PRESS_MS = 520;
/** 长按期间允许的最大位移（超过即认为是拖动地球） */
const MOVE_TOLERANCE = 8;
/** 打开菜单后，抑制随后的 click 事件多久（毫秒） */
const CLICK_SUPPRESS_MS = 500;

/** kind → { 删除回调 } */
const deleters = new Map();

/** kind → { 导出回调 }（「导出为单独 KML」，只对轨迹 / 图形登记） */
const exporters = new Map();

/** kind → 菜单文案与图标（图标取自 index.html 的 symbol 精灵图） */
const MENU_SPEC = {
    bookmark: { label: '删除标记', icon: '#i-pin' },
    'measure-track': { label: '删除轨迹', icon: '#i-ruler' },
    'measure-shape': { label: '删除图形', icon: '#i-area' },
};

/** 导出项的固定文案与图标（凡登记了 exporter 的 kind 都会多出这一项） */
const EXPORT_SPEC = { label: '导出为单独 KML', icon: '#i-export' };

/**
 * 登记某类实体的删除回调。
 * @param {string} kind 'bookmark' | 'measure-track' | 'measure-shape'
 * @param {(entity: object) => void|Promise<void>} fn 执行真正的删除（含 toast）
 */
export function registerEntityDeleter(kind, fn) {
    deleters.set(kind, fn);
}

/**
 * 登记某类实体的「导出为单独 KML」回调。
 * 只有轨迹 / 图形支持；标记是单点，单独导出意义不大（整体导出已覆盖）。
 * @param {string} kind 'measure-track' | 'measure-shape'
 * @param {(entity: object) => void|Promise<void>} fn 执行导出（含文件交付）
 */
export function registerEntityExporter(kind, fn) {
    exporters.set(kind, fn);
}

/** 实体 → 菜单种类；不是可删除对象时返回 null */
function kindOf(entity) {
    if (!entity || !entity._locusKind) return null;
    if (entity._locusKind === 'bookmark') return 'bookmark';
    if (entity._locusKind === 'measure') {
        return entity._measureType === 'area' ? 'measure-shape' : 'measure-track';
    }
    return null;
}

/**
 * 挂载菜单。整个应用只需调用一次。
 * @param {object} viewer Cesium Viewer
 */
export function initMapContextMenu(viewer) {
    if (!viewer || !viewer.canvas) return;

    const canvas = viewer.canvas;

    const menu = document.createElement('div');
    menu.className = 'context-menu';
    menu.setAttribute('role', 'menu');
    document.body.appendChild(menu);

    /** 当前菜单指向的实体与种类 */
    let targetEntity = null;
    let targetKind = null;

    // ---- 长按状态 ----
    let press = null;          // { x, y, pointerId }
    let pressTimer = null;
    let swallowPointerUp = false;
    let swallowClickUntil = 0;

    function resetPress() {
        clearTimeout(pressTimer);
        pressTimer = null;
        press = null;
    }

    function closeMenu() {
        menu.classList.remove('is-open');
        targetEntity = null;
        targetKind = null;
    }

    // ------------------------------------------------------------------
    // 拾取
    // ------------------------------------------------------------------
    function pickEntityAt(clientX, clientY) {
        const rect = canvas.getBoundingClientRect();
        const position = new Cartesian2(clientX - rect.left, clientY - rect.top);
        try {
            const picked = viewer.scene.pick(position);
            // 地面图元（GroundPrimitive / GroundPolylinePrimitive）的 id 可能是内部对象，
            // 只有实体才有 _locusKind，非实体在这里自然被过滤掉。
            return picked && picked.id ? picked.id : null;
        } catch (e) {
            return null;
        }
    }

    // ------------------------------------------------------------------
    // 打开 / 关闭
    // ------------------------------------------------------------------
    function openAt(clientX, clientY) {
        if (isDialogOpen()) return false;

        const entity = pickEntityAt(clientX, clientY);
        const kind = kindOf(entity);
        if (!kind || !deleters.has(kind)) {
            closeMenu();
            return false;
        }

        const spec = MENU_SPEC[kind];
        // 文案与图标都是本文件内的常量，不涉及外部输入
        let itemsHtml =
            '<button type="button" class="context-menu-item is-danger" role="menuitem" data-action="delete">' +
            `<svg class="ui-icon"><use href="${spec.icon}"/></svg>` +
            `<span>${spec.label}</span>` +
            '</button>';

        // 轨迹 / 图形额外提供「导出为单独 KML」（放在删除之后）
        if (exporters.has(kind)) {
            itemsHtml +=
                '<button type="button" class="context-menu-item" role="menuitem" data-action="export">' +
                `<svg class="ui-icon"><use href="${EXPORT_SPEC.icon}"/></svg>` +
                `<span>${EXPORT_SPEC.label}</span>` +
                '</button>';
        }

        menu.innerHTML = itemsHtml;

        targetEntity = entity;
        targetKind = kind;

        // 先定位再显示：要先有尺寸才能做越界收敛
        menu.classList.add('is-open');
        menu.style.left = `${clientX}px`;
        menu.style.top = `${clientY}px`;

        const rect = menu.getBoundingClientRect();
        const margin = 8;
        let left = clientX + 6;
        let top = clientY + 6;
        if (left + rect.width > window.innerWidth - margin) {
            left = Math.max(margin, clientX - rect.width - 6);
        }
        if (top + rect.height > window.innerHeight - margin) {
            top = Math.max(margin, clientY - rect.height - 6);
        }
        menu.style.left = `${left}px`;
        menu.style.top = `${top}px`;

        return true;
    }

    // ------------------------------------------------------------------
    // 菜单项点击 → 确认 → 执行
    // ------------------------------------------------------------------
    menu.addEventListener('click', async (event) => {
        const item = event.target.closest('.context-menu-item');
        if (!item) return;

        const action = item.getAttribute('data-action');
        const entity = targetEntity;
        const kind = targetKind;
        closeMenu();
        if (!entity || !kind || !action) return;

        const name = entity.name || '该项';
        const spec = MENU_SPEC[kind] || {};

        // ---- 导出为单独 KML：无需确认，直接交付文件 ----
        if (action === 'export') {
            const exporter = exporters.get(kind);
            if (!exporter) return;
            try {
                await exporter(entity);
            } catch (e) {
                console.warn('导出地图对象失败:', e);
            }
            return;
        }

        // ---- 删除：走页内确认框 ----
        const ok = await askConfirm(`确定要删除「${name}」吗？`, {
            // 标题与图标直接复用菜单项的那一套，保证「删除轨迹 / 删除图形」措辞一致
            title: spec.label || '删除',
            icon: spec.icon || '#i-warn',
        });
        if (!ok) return;

        const deleter = deleters.get(kind);
        if (!deleter) return;
        try {
            await deleter(entity);
        } catch (e) {
            console.warn('删除地图对象失败:', e);
        }
    });

    // ------------------------------------------------------------------
    // 桌面端：右键
    // ------------------------------------------------------------------
    canvas.addEventListener('contextmenu', (event) => {
        // main.js 已在 document 上统一 preventDefault，这里再挡一次
        event.preventDefault();
        // 触屏长按也会触发 contextmenu：菜单已经打开就不重复处理
        if (menu.classList.contains('is-open')) return;

        const opened = openAt(event.clientX, event.clientY);
        if (!opened) return;

        // ⚠️ Android 的长按会先派发 contextmenu，**早于**我们 520ms 的计时器。
        //    此时手指还没抬起，必须同样吞掉随后的 pointerup / click，
        //    否则测距会在这个位置多打一个点、标记模式还会弹出命名框。
        //    （press 只在非鼠标指针按下时存在，桌面右键走不到这里）
        if (press) {
            clearTimeout(pressTimer);
            pressTimer = null;
            swallowPointerUp = true;
            swallowClickUntil = Date.now() + CLICK_SUPPRESS_MS;
        }
    });

    // ------------------------------------------------------------------
    // 触屏端：长按
    // ------------------------------------------------------------------
    canvas.addEventListener('pointerdown', (event) => {
        // 鼠标交给右键，这里只管手指与触控笔
        if (event.pointerType === 'mouse' || event.button !== 0) return;

        // 上一轮可能因为 pointercancel 没走到 pointerup：
        // 不清掉的话，这一次正常抬手的 pointerup 会被误吞（表现为「点地图没反应」）
        swallowPointerUp = false;

        resetPress();
        press = { x: event.clientX, y: event.clientY, pointerId: event.pointerId };

        pressTimer = setTimeout(() => {
            pressTimer = null;
            if (!press) return;
            const opened = openAt(press.x, press.y);
            if (!opened) {
                press = null;
                return;
            }
            // 菜单弹出来了：手指抬起不能再被当成一次「点地图」
            // （否则测距/测面积会在原地多打一个点，标记模式还会弹命名框）
            swallowPointerUp = true;
            swallowClickUntil = Date.now() + CLICK_SUPPRESS_MS;
        }, LONG_PRESS_MS);
    });

    canvas.addEventListener('pointermove', (event) => {
        if (!press || pressTimer === null) return;
        if (event.pointerId !== press.pointerId) return;
        const dx = event.clientX - press.x;
        const dy = event.clientY - press.y;
        if (Math.hypot(dx, dy) > MOVE_TOLERANCE) resetPress();
    });

    canvas.addEventListener('pointercancel', () => {
        // 长按过程中被系统打断（来电、手势冲突等）：不能留着 swallow 标记，
        // 否则下一次正常抬手的 pointerup 会被吞掉。
        resetPress();
        swallowPointerUp = false;
    });
    canvas.addEventListener('pointerleave', resetPress);
    // 正常抬手：清掉长按计时（吞事件在下面的 window 捕获阶段做，
    // 那里会比 Cesium 的 canvas 监听更早执行）
    canvas.addEventListener('pointerup', resetPress);

    // ------------------------------------------------------------------
    // 全局：吞掉长按后的 pointerup / click，并在别处按下时关闭菜单
    // ------------------------------------------------------------------
    // ⚠️ 必须挂在 window 的捕获阶段：Cesium 的 ScreenSpaceEventHandler
    // 把 pointerup 挂在 canvas（或 document）上，只有先一步截住才能真正
    // 阻止它被当成一次地图点击。
    window.addEventListener('pointerup', (event) => {
        if (!swallowPointerUp) return;
        swallowPointerUp = false;
        resetPress();
        event.stopPropagation();
    }, true);

    window.addEventListener('click', (event) => {
        if (Date.now() > swallowClickUntil) return;
        if (event.target !== canvas) return;
        event.stopPropagation();
        event.preventDefault();
    }, true);

    // 菜单开着时点别处 → 关（捕获阶段，保证比地图交互先执行）
    document.addEventListener('pointerdown', (event) => {
        if (!menu.classList.contains('is-open')) return;
        if (menu.contains(event.target)) return;
        closeMenu();
    }, true);

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') closeMenu();
    });

    window.addEventListener('resize', closeMenu);
}
