// ============================================================================
// 通用对话框（确认 / 命名输入）
// ----------------------------------------------------------------------------
// 取代浏览器原生 confirm() / prompt()：原生弹窗在 Android 外壳里会渲染成
// 「<域名> 显示」的系统对话框，不跟随主题，也不套用本站的字体与配色。
//
// 全站只维护这一份实现，DOM 仍然是 index.html 里既有的
// #confirmModal / #markerNameModal（.modal-overlay + .modal-box.glass-panel），
// 本模块只负责「填文案 → 等结果 → 收起」。
// 任何需要确认或命名的模块都 import 这里，不要再各写一份。
//
// 用法：
//   const ok = await askConfirm('确定要删除吗？');
//   const name = await askText({ title: '保存到收藏夹', defaultValue: '轨迹 1' });
//
// 返回值约定：
//   askConfirm → boolean（确定 true / 取消、关闭、点遮罩 false）
//   askText    → string | null（确认后的文本 / 取消 null）
// ============================================================================

const $ = (id) => document.getElementById(id);

/** 确认框的 Promise 收尾函数；同一时刻只允许一个 */
let confirmResolve = null;
/** 命名框的 Promise 收尾函数 */
let textResolve = null;
/** 命名框当前的校验器 */
let textValidator = null;
/** DOM 事件只绑一次 */
let bound = false;

// ---------------------------------------------------------------------------
// 绑定（懒执行：模块被 import 时 DOM 一定已就绪，但仍等到真正用的时候再绑，
// 避免在 node 等无 DOM 环境下 import 本模块就抛错）
// ---------------------------------------------------------------------------
function ensureBound() {
    if (bound) return true;
    const confirmModal = $('confirmModal');
    const nameModal = $('markerNameModal');
    if (!confirmModal || !nameModal) return false;
    bound = true;

    // ---- 确认框 ----
    $('okConfirmBtn')?.addEventListener('click', () => finishConfirm(true));
    $('cancelConfirmBtn')?.addEventListener('click', () => finishConfirm(false));
    $('closeConfirmBtn')?.addEventListener('click', () => finishConfirm(false));
    // 点遮罩空白处 = 取消（与全站其它弹窗一致的交互约定）
    confirmModal.addEventListener('click', (e) => {
        if (e.target === confirmModal) finishConfirm(false);
    });

    // ---- 命名框 ----
    const input = $('markerNameInput');
    $('confirmMarkerNameBtn')?.addEventListener('click', () => submitText());
    $('cancelMarkerNameBtn')?.addEventListener('click', () => finishText(null));
    $('closeMarkerNameBtn')?.addEventListener('click', () => finishText(null));
    nameModal.addEventListener('click', (e) => {
        if (e.target === nameModal) finishText(null);
    });
    // 输入时清掉上一次的报错
    input?.addEventListener('input', () => showTextError(''));
    // 回车确定、Esc 取消：桌面端不点按钮也能走完
    input?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            submitText();
        }
    });

    // 统一处理 Esc：先关最近打开的那个弹窗。
    // 用 document 级监听而不是元素上的，是因为焦点不一定落在弹窗内部。
    document.addEventListener('keydown', (e) => {
        if (e.key !== 'Escape') return;
        if (confirmModal.classList.contains('active')) {
            e.preventDefault();
            finishConfirm(false);
            return;
        }
        if (nameModal.classList.contains('active')) {
            e.preventDefault();
            finishText(null);
        }
    });

    return true;
}

/** 是否有对话框正开着（地图交互模块用来避免误触） */
export function isDialogOpen() {
    return !!(
        $('confirmModal')?.classList.contains('active') ||
        $('markerNameModal')?.classList.contains('active')
    );
}

// ---------------------------------------------------------------------------
// 确认框
// ---------------------------------------------------------------------------
function finishConfirm(value) {
    $('confirmModal')?.classList.remove('active');
    const resolve = confirmResolve;
    confirmResolve = null;
    if (resolve) resolve(value);
}

/**
 * 弹确认框并等待用户选择。
 *
 * @param {string} message 正文
 * @param {object} [options]
 * @param {string} [options.title] 标题，默认沿用 HTML 里的「请确认」
 * @param {string} [options.icon] 标题图标（symbol id，如 '#i-warn'）
 * @param {string} [options.okText] 确定按钮文案，默认「确定」
 * @param {string} [options.cancelText] 取消按钮文案，默认「取消」
 * @returns {Promise<boolean>} 确定 = true；取消 / 关闭 = false
 */
export function askConfirm(message, options = {}) {
    // 弹窗缺失时退回原生 confirm，保证功能不丢（例如旧版 HTML 缓存）
    if (!ensureBound()) return Promise.resolve(window.confirm(message));

    const modal = $('confirmModal');
    const { title, icon, okText = '确定', cancelText = '取消' } = options;

    if (title) $('confirmTitleText').textContent = title;
    if (icon) $('confirmTitleIcon')?.setAttribute('href', icon);

    const okBtn = $('okConfirmBtn');
    const cancelBtn = $('cancelConfirmBtn');
    if (okBtn) okBtn.textContent = okText;
    if (cancelBtn) cancelBtn.textContent = cancelText;

    $('confirmMessage').textContent = message;

    // 极端情况下上一个还没收尾：按取消处理，避免 Promise 永远悬着
    if (confirmResolve) {
        const stale = confirmResolve;
        confirmResolve = null;
        stale(false);
    }

    modal.classList.add('active');
    okBtn?.focus();

    return new Promise((resolve) => {
        confirmResolve = resolve;
    });
}

// ---------------------------------------------------------------------------
// 命名 / 文本输入框
// ---------------------------------------------------------------------------
function showTextError(message) {
    const error = $('markerNameError');
    const input = $('markerNameInput');
    if (error) error.textContent = message || '';
    if (input) input.classList.toggle('is-invalid', !!message);
}

function finishText(value) {
    const modal = $('markerNameModal');
    const input = $('markerNameInput');
    modal?.classList.remove('active');
    if (input) input.classList.remove('is-invalid');
    showTextError('');

    const resolve = textResolve;
    textResolve = null;
    textValidator = null;
    if (resolve) resolve(value);
}

function submitText() {
    const input = $('markerNameInput');
    if (!input) return;
    const value = input.value.trim();
    const error = textValidator ? textValidator(value) : (value ? '' : '名称不能为空');
    if (error) {
        showTextError(error);
        input.focus();
        return;
    }
    finishText(value);
}

/**
 * 弹命名弹窗，等待用户输入。
 *
 * @param {object} [options]
 * @param {string} [options.title] 弹窗标题
 * @param {string} [options.label] 输入框上方的小标题，默认「名称」
 * @param {string} [options.defaultValue] 预填内容（会全选，便于直接覆盖）
 * @param {string} [options.placeholder] 占位提示
 * @param {number} [options.maxLength] 最大长度
 * @param {string} [options.icon] 标题图标（symbol id）
 * @param {(value: string) => string} [options.validate] 返回错误文案，空串表示通过
 * @returns {Promise<string|null>} 确认后的文本；取消 = null
 */
export function askText(options = {}) {
    const {
        title,
        label,
        defaultValue = '',
        placeholder,
        maxLength,
        icon,
        validate,
    } = options;

    if (!ensureBound()) {
        return Promise.resolve(window.prompt(title || '请输入名称', defaultValue));
    }

    const modal = $('markerNameModal');
    const input = $('markerNameInput');

    if (title) $('markerNameTitleText').textContent = title;
    if (icon) $('markerNameIcon')?.setAttribute('href', icon);
    if (label) $('markerNameLabel').textContent = label;
    if (placeholder) input.placeholder = placeholder;
    if (maxLength) input.maxLength = maxLength;

    textValidator = typeof validate === 'function'
        ? validate
        : (value) => (value ? '' : '名称不能为空');

    input.value = defaultValue;
    showTextError('');

    // 上一个还挂着：直接当作取消收尾
    if (textResolve) {
        const stale = textResolve;
        textResolve = null;
        stale(null);
    }

    modal.classList.add('active');
    // 显示之后再聚焦 + 全选，用户可以直接输入覆盖
    input.focus();
    input.select();

    return new Promise((resolve) => {
        textResolve = resolve;
    });
}
