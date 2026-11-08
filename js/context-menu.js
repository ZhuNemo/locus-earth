// ============================================================================
// 地图对象右键 / 长按菜单
// ----------------------------------------------------------------------------
// 桌面：contextmenu；触屏：长按 520ms（位移 > 8px 视为拖动，不弹菜单）。
// 菜单项：删除（走 js/dialogs.js 确认框）、导出为单独 KML。
//
// 注册表解耦：bookmarks.js 与 measure.js 互不 import，各自登记回调。
//   registerEntityDeleter('bookmark' | 'measure-track' | 'measure-shape', fn)
//   registerEntityExporter('measure-track' | 'measure-shape', fn)
// 实体识别：entity._locusKind = 'bookmark' | 'measure'，measure 再看 _measureType。
//
// ⚠️ 本模块不 stopPropagation 任何指针事件。原因与替代方案见 isTapSuppressed。
// ============================================================================

import { Cartesian2 } from './cesium.js';
import { askConfirm, isDialogOpen } from './dialogs.js';

/** 长按触发阈值 */
const LONG_PRESS_MS = 520;
/** 长按期间允许的最大位移（超过即认为是拖动地球） */
const MOVE_TOLERANCE = 8;
/** 打开菜单后，抑制随后的 click 事件多久（毫秒） */
const CLICK_SUPPRESS_MS = 500;

/**
 * 一次性抑制标志：本次抬手是长按/菜单的收尾，业务侧不该当成点击。
 *
 * ⚠️ 不能用 window 捕获阶段 stopPropagation 掉 pointerup：Cesium 的 pointer 监听
 *    挂在 canvas 冒泡阶段，截断后它的指针记录停在「按下」，此后单指拖拽全被判成
 *    多指 ⇒ 地图拖不动（双指走自研 touch，不受影响）。详见 docs/pitfalls.md。
 */
let tapSuppressed = false;

/**
 * 本次抬手是否应被忽略。只在 pointerup 派发期间为 true。
 * @returns {boolean}
 */
export function isTapSuppressed() {
    return tapSuppressed;
}

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
            // GroundPrimitive 的 id 可能是内部对象；只有实体才有 _locusKind，非实体自然被滤掉。
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
        // 文案与图标均为本文件常量
        let itemsHtml =
            '<button type="button" class="context-menu-item is-danger" role="menuitem" data-action="delete">' +
            `<svg class="ui-icon"><use href="${spec.icon}"/></svg>` +
            `<span>${spec.label}</span>` +
            '</button>';

        // 轨迹 / 图形追加导出项
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

        // 先显示再量尺寸，才能做越界收敛
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

        // ---- 导出：无需确认 ----
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
            // 标题与图标复用菜单项，保证措辞一致
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
        // 触屏长按也会触发 contextmenu：已打开就不重复处理
        if (menu.classList.contains('is-open')) return;

        // ⚠️ Android 长按会**先**派发 contextmenu（早于 520ms 计时器）。此时手指
        //    尚未抬起，同样要标记「非点击」，否则测量会多打点、标记模式会弹命名框。
        //    press 只在非鼠标指针时存在 ⇒ 桌面右键走不到这里。
        if (press) {
            clearTimeout(pressTimer);
            pressTimer = null;
            swallowPointerUp = true;
            swallowClickUntil = Date.now() + CLICK_SUPPRESS_MS;
        }

        openAt(event.clientX, event.clientY);
    });

    // ------------------------------------------------------------------
    // 触屏端：长按
    // ------------------------------------------------------------------
    canvas.addEventListener('pointerdown', (event) => {
        // 鼠标交给右键，这里只管手指与触控笔
        if (event.pointerType === 'mouse' || event.button !== 0) return;

        // 上一轮可能因 pointercancel 没走到 pointerup，不清掉会误吞这一次正常抬手
        // （表现为「点地图没反应」）。tapSuppressed 同理，新按下即新的「按下—抬起」。
        swallowPointerUp = false;
        tapSuppressed = false;

        resetPress();
        press = { x: event.clientX, y: event.clientY, pointerId: event.pointerId };

        pressTimer = setTimeout(() => {
            pressTimer = null;
            if (!press) return;

            // 长按已成立：不论是否命中对象、有没有弹菜单，这次抬手都不算点击。
            // 否则测量模式下长按空白会多打一个点。
            swallowPointerUp = true;
            swallowClickUntil = Date.now() + CLICK_SUPPRESS_MS;

            const opened = openAt(press.x, press.y);
            // 未命中：菜单不打开，按下状态直接清掉
            if (!opened) press = null;
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
        // 被系统打断（来电、手势冲突）：清掉 swallow，否则下一次正常抬手会被吞。
        resetPress();
        swallowPointerUp = false;
    });
    canvas.addEventListener('pointerleave', resetPress);
    // 正常抬手：清掉长按计时（抑制在下面的 window 捕获阶段处理）
    canvas.addEventListener('pointerup', resetPress);

    // ------------------------------------------------------------------
    // 全局：把长按后的这次抬手标记为「非点击」，并在别处按下时关闭菜单
    // ------------------------------------------------------------------
    // ⚠️ 只置标志，绝不 stopPropagation。Cesium 的 pointer 监听取不到本次抬手后，
    //    其内部指针记录会停在「按下」，此后单指拖拽全被判成多指 —— 直到刷新页面。
    //    详情与实测：docs/pitfalls.md 第 1.3 节。
    window.addEventListener('pointerup', () => {
        if (!swallowPointerUp) return;
        swallowPointerUp = false;
        resetPress();

        tapSuppressed = true;
        // LEFT_UP 在本次 pointerup 内同步派发，宏任务末尾清掉即可；pointerdown 也会复位。
        setTimeout(() => { tapSuppressed = false; }, 0);
    }, true);

    // 浏览器合成的 click 仍拦一下（Cesium 不用 click，只为避免多余的点击语义/焦点变化）。
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
