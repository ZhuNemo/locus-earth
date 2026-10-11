// ============================================================================
// 内联 SVG 图标库
// ----------------------------------------------------------------------------
// 全站 UI 图标统一入口：所有 emoji 一律替换为这里的内联 SVG。
// 设计约束：
//   · 统一 24×24 viewBox、线性风格（fill="none" + stroke="currentColor"），
//     与顶部菜单、测量工具栏、底图选择器的既有图标保持一致；
//   · 颜色一律用 currentColor，深浅主题自动跟随，不硬编码色值；
//   · 导出的是字符串模板，调用方直接 innerHTML / 插值使用。
//
// 唯一例外：关于弹窗（#infoModal / infoModalGoogle）正文里的说明性 emoji
// 属于文案排版，不在此替换范围。
// ============================================================================

// ---------- 基础构造 ----------
const S = (paths, width = 1.8) =>
    `<svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" ` +
    `stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">` +
    paths +
    `</svg>`;

// 实心变体（少量图标需要填充感更强，例如图钉、警告）
const SF = (paths) =>
    `<svg viewBox="0 0 24 24" width="1em" height="1em" fill="currentColor" ` +
    `stroke="none" aria-hidden="true" focusable="false">` +
    paths +
    `</svg>`;

export const Icons = {
    // ---------- 通用动作 ----------
    close: S(`<path d="M18 6 6 18M6 6l12 12"/>`, 2),
    check: S(`<path d="M20 6 9 17l-5-5"/>`, 2.2),
    warn: S(`<path d="M12 3.2 2.6 19.2h18.8L12 3.2Z"/><path d="M12 9.6v4.2M12 16.6h.01"/>`, 1.9),
    error: S(`<circle cx="12" cy="12" r="9"/><path d="M15 9l-6 6M9 9l6 6"/>`, 1.9),
    info: S(`<circle cx="12" cy="12" r="9"/><path d="M12 11v5.5M12 7.8h.01"/>`, 1.9),
    search: S(`<circle cx="11" cy="11" r="7"/><path d="m20 20-3.6-3.6"/>`, 1.9),
    trash: S(`<path d="M4 7h16M9.5 7V5.2c0-.7.5-1.2 1.2-1.2h2.6c.7 0 1.2.5 1.2 1.2V7"/><path d="M6.4 7l.9 12.1c.05.75.68 1.4 1.44 1.4h6.52c.76 0 1.39-.65 1.44-1.4L17.6 7"/><path d="M10.4 11v6M13.6 11v6"/>`, 1.7),
    undo: S(`<path d="M4 9h11.5a4.5 4.5 0 0 1 0 9H9"/><path d="M7.5 5.5 4 9l3.5 3.5"/>`, 1.9),
    refresh: S(`<path d="M20 12a8 8 0 1 1-2.6-5.9"/><path d="M20 4.5V10h-5.5"/>`, 1.9),
    bulb: S(`<path d="M9.5 18h5M10.3 21h3.4"/><path d="M12 3a6 6 0 0 1 3.5 10.9c-.6.45-.9 1-.9 1.6v.5h-5.2v-.5c0-.6-.3-1.15-.9-1.6A6 6 0 0 1 12 3Z"/>`, 1.8),
    robot: S(`<rect x="4.5" y="8" width="15" height="11" rx="3"/><path d="M12 8V5"/><circle cx="12" cy="4.2" r="1.2"/><path d="M9.3 12.7h.01M14.7 12.7h.01"/><path d="M9.8 16h4.4"/><path d="M2.5 12.5v3M21.5 12.5v3"/>`, 1.7),
    pin: S(`<path d="M12 21.5s6.5-6.1 6.5-11a6.5 6.5 0 1 0-13 0c0 4.9 6.5 11 6.5 11Z"/><circle cx="12" cy="10.3" r="2.5"/>`, 1.8),
    globe: S(`<circle cx="12" cy="12" r="9"/><path d="M3.2 10h17.6M3.2 14h17.6"/><path d="M12 3a15 15 0 0 1 0 18 15 15 0 0 1 0-18Z"/>`, 1.7),
    globeAsia: S(`<circle cx="12" cy="12" r="9"/><path d="M3.2 10h17.6M3.2 14h17.6"/><path d="M12 3a15 15 0 0 1 0 18 15 15 0 0 1 0-18Z"/><path d="M14.6 8.4h3.2M13.4 11.6h3.4M14.6 14.8h3.2"/>`, 1.7),
    compass: S(`<circle cx="12" cy="12" r="9"/><path d="m15.6 8.4-2 5.2-5.2 2 2-5.2 5.2-2Z"/>`, 1.7),
    theme: S(`<path d="M20.4 13.6A8.5 8.5 0 1 1 10.4 3.6a6.8 6.8 0 0 0 10 10Z"/>`, 1.8),
    moon: S(`<path d="M20.4 13.6A8.5 8.5 0 1 1 10.4 3.6a6.8 6.8 0 0 0 10 10Z"/>`, 1.8),
    sun: S(`<circle cx="12" cy="12" r="4.2"/><path d="M12 2.6v2.2M12 19.2v2.2M4.4 4.4l1.6 1.6M18 18l1.6 1.6M2.6 12h2.2M19.2 12h2.2M4.4 19.6 6 18M18 6l1.6-1.6"/>`, 1.8),
    gear: S(`<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>`, 1.6),
    menu: S(`<path d="M4 7h16M4 12h16M4 17h16"/>`, 1.9),
    document: S(`<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5Z"/><path d="M14 3v5h5"/><path d="M9 13h6M9 16.5h4"/>`, 1.7),
    code: S(`<path d="M9 8.5 5.5 12 9 15.5M15 8.5 18.5 12 15 15.5"/><path d="m13.2 5.5-2.4 13"/>`, 1.8),
    folder: S(`<path d="M3.5 7.2c0-1 .8-1.7 1.7-1.7h3.3l2 2.3h8.3c1 0 1.7.8 1.7 1.7v8.1c0 1-.8 1.7-1.7 1.7H5.2c-1 0-1.7-.8-1.7-1.7V7.2Z"/>`, 1.8),

    // ---------- 收藏夹 ----------
    export: S(`<path d="M12 3v12"/><path d="m7.5 10.5 4.5 4.5 4.5-4.5"/><path d="M4.5 20h15"/>`, 1.9),
    import: S(`<path d="M12 15V3"/><path d="m7.5 7.5 4.5-4.5 4.5 4.5"/><path d="M4.5 20h15"/>`, 1.9),

    // ---------- 测量 ----------
    area: S(`<path d="M4 7.5V4h3.5M16.5 4H20v3.5M20 16.5V20h-3.5M7.5 20H4v-3.5"/><path d="m4.8 4.8 14.4 14.4"/>`, 1.8),
    ruler: S(`<rect x="1.8" y="8.6" width="20.4" height="6.8" rx="1.6"/><path d="M6 8.6v2.6M9.6 8.6v3.6M13.2 8.6v2.6M16.8 8.6v3.6"/>`, 1.7),
    brush: S(`<path d="M9.5 14.5 20 4"/><path d="M9.5 14.5c-1.4 1.4-1 3.2-2 4.2-1 1-2.8 1.2-4.3 1.2.9-1.4.6-2.6 1.4-3.6.7-.9 2.4-1.4 4.9-1.8Z"/>`, 1.7),

    // ---------- 加载 ----------
    loading: `<svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" aria-hidden="true" focusable="false">
        <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.6" opacity="0.25"/>
        <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
    </svg>`,
};

// ---------- 提示（toast）图标快捷方式 ----------
// toast 里原本用 emoji 开头，现在统一换成「图标 + 文字」，
// 由 showToast 在渲染时按语义前缀插入对应 SVG。
export const ToastIcons = {
    info: Icons.info,
    success: Icons.check,
    warn: Icons.warn,
    error: Icons.error,
    pin: Icons.pin,
    globe: Icons.globe,
    ruler: Icons.ruler,
    area: Icons.area,
    brush: Icons.brush,
    compass: Icons.compass,
    city: Icons.globe,
    // 以下三个别名在 EMOJI_ICON_MAP 里被引用，缺了会静默降级成 info 图标
    // （例如 compass.js 的「↺ 俯仰角已重置」会显示成 ℹ 而不是回转箭头）。
    // Icons 里已有同语义图形，直接复用即可。
    undo: Icons.undo,
    refresh: Icons.refresh,
    close: Icons.close,
};
