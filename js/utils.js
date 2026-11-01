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

    // 解析开头 emoji。
    // ⚠️ 即使调用方已经用 forceIcon 指定了图标，也要把前缀吃掉：
    //    否则「图标 + 文字」里会剩下一个裸 emoji（旧实现在这种情况下会漏掉，
    //    例如 showToast('✅ 已保存', 3000, 'success') 会显示成「✓ ✅ 已保存」）。
    let iconKey = forceIcon;
    let body = raw;
    const m = raw.match(LEADING_EMOJI);
    if (m) {
        const mapped = EMOJI_ICON_MAP[m[2]];
        if (!iconKey && mapped) iconKey = mapped;
        // 只有能落到一个图标上时才吃掉这段 emoji，否则原样保留（避免丢字）
        if (mapped || iconKey) body = raw.slice(m[0].length);
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

// ============================================================================
// 文件交付（导出）
// ----------------------------------------------------------------------------
// 为什么优先用系统分享（Web Share API）而不是直接触发下载：
// Android WebView 对 `<a download>` + blob: 的下载是**静默丢弃**的 ——
// 没有 DownloadListener 时点了毫无反应，而 blob 的内容只有页面自己拿得到，
// 原生侧即使实现了 DownloadListener 也读不到字节。
// navigator.share(files) 由系统分享面板接管（可存到「文件」、发给自己等），
// 是 Android 上「把文件交出去」的正规通路，且不需要任何存储权限。
// 桌面浏览器一般不支持分享文件，于是回退到原本的 blob 下载。
//
// 收藏夹整体导出（bookmarks.js）与单个图形导出（measure.js）共用这一份实现。
// ============================================================================

/**
 * 把一个 Blob 交给系统：优先系统分享面板，其次浏览器下载。
 *
 * @param {Blob} blob 文件内容
 * @param {string} filename 建议文件名（含扩展名）
 * @param {string} [shareTitle] 分享面板里的标题
 * @returns {Promise<'shared'|'downloaded'|'cancelled'>}
 */
export async function saveBlobFile(blob, filename, shareTitle = '') {
    // ---- 通路一：系统分享面板 ----
    try {
        const file = new File([blob], filename, { type: blob.type });
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
            await navigator.share({ files: [file], title: shareTitle || filename });
            return 'shared';
        }
    } catch (error) {
        // 用户主动取消分享（AbortError）不是错误，也不该再回退到下载
        if (error && error.name === 'AbortError') return 'cancelled';
        console.warn('系统分享不可用，回退到文件下载:', error);
    }

    // ---- 通路二：浏览器下载（桌面端 / 不支持分享时） ----
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    return 'downloaded';
}

/**
 * 把任意名称转成安全的文件名（去掉路径分隔符与各系统禁用字符）。
 * @param {string} name 原始名称
 * @param {string} [fallback] 清洗后为空时使用的名字
 * @returns {string}
 */
export function safeFileName(name, fallback = 'locus-earth') {
    const cleaned = String(name ?? '')
        // 各系统文件名禁用字符：反斜杠、斜杠、冒号、星号、问号、双引号、尖括号、竖线
        .replace(/[\\/:*?"<>|]/g, '_')
        .trim()
        // 开头的点会被当成特殊名（"." / ".."）
        .replace(/^\.+/, '');
    return cleaned || fallback;
}
