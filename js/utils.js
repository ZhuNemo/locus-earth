import { ToastIcons } from './icons.js';

// ============================================================================
// 全局提示（toast）
// ----------------------------------------------------------------------------
// 正文不再使用 emoji：调用方仍可传「📍 已开启」这种带 emoji 前缀的文案，
// showToast 会自动把开头的 emoji 解析成同语义的内联 SVG 图标，
// 渲染为「图标 + 文字」的 flex 结构。这样既保证全站无 emoji，
// 又不必改遍所有调用点（未来新调用仍可沿用 emoji 写法）。
// ============================================================================

let toastTimeout = null;
const toast = document.getElementById('toastMessage');

// emoji -> 图标语义
const EMOJI_ICON_MAP = {
    '📍': 'pin',
    '📌': 'pin',
    '🌍': 'globe',
    '🌏': 'globe',
    '🌎': 'globe',
    '🏙️': 'city',
    '🏙': 'city',
    '📏': 'ruler',
    '📐': 'area',
    '📊': 'area',
    '🧹': 'brush',
    '🧭': 'compass',
    '✅': 'success',
    '⚠️': 'warn',
    '⚠': 'warn',
    '❌': 'error',
    '❎': 'close',
    '↺': 'undo',
    '↻': 'refresh',
    'ℹ️': 'info',
};

// 匹配开头的 emoji（含变体选择符），用于前缀解析
const LEADING_EMOJI = /^(\s*)([\u{1F000}-\u{1FAFF}\u{2190}-\u{21FF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE0F}\u{2700}-\u{27BF}]+)\s*/u;

/**
 * 把消息渲染进 toast。
 * @param {string} text 消息文本，允许以 emoji 开头
 * @param {number} duration 显示时长（毫秒）
 * @param {string} [forceIcon] 强制指定图标语义（可选）
 */
export function showToast(text, duration = 4000, forceIcon) {
    const raw = String(text ?? '');

    // 解析开头 emoji
    let iconKey = forceIcon;
    let body = raw;
    if (!iconKey) {
        const m = raw.match(LEADING_EMOJI);
        if (m) {
            const emoji = m[2];
            iconKey = EMOJI_ICON_MAP[emoji];
            // 只有能映射到图标时才吃掉这段 emoji，否则原样保留（避免丢字）
            if (iconKey) body = raw.slice(m[0].length);
        }
    }

    const svg = iconKey ? ToastIcons[iconKey] || ToastIcons.info : '';

    toast.innerHTML = '';
    if (svg) {
        const iconWrap = document.createElement('span');
        iconWrap.className = 'toast-icon';
        iconWrap.innerHTML = svg;
        toast.appendChild(iconWrap);
    }
    if (body) {
        const textWrap = document.createElement('span');
        textWrap.className = 'toast-text';
        textWrap.textContent = body;
        toast.appendChild(textWrap);
    }

    toast.classList.add('show');
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => {
        toast.classList.remove('show');
    }, duration);
}

export function closeInfo() {
    document.getElementById('infoModal').classList.remove('active');
}
export function closeIterlog() {
    document.getElementById('iterlogModal').classList.remove('active');
}
