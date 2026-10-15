"""用工程 themes.css 里的真实令牌值，把标记命名弹窗画出来做视觉核对。

说明：这不是浏览器渲染。Chromium 在本机受限沙箱下无法启动（mojo 需要命名管道）。
这里按真实令牌值 + 真实布局参数重建，用来核对配色、对比度与层级是否与全站一致。
"""
import os
import re

from PIL import Image, ImageDraw, ImageFont

REPO = r"D:\GitHub repository\locus-earth"
OUT = os.path.join(REPO, ".tmp-ui-preview")
os.makedirs(OUT, exist_ok=True)


# ---------- 解析 themes.css 的令牌 ----------
def parse_tokens(path, selector_block):
    with open(path, encoding="utf-8") as fh:
        text = fh.read()
    return dict(re.findall(r"^\s*(--[a-z0-9-]+)\s*:\s*([^;]+);", text, re.M))


with open(os.path.join(REPO, "css", "themes.css"), encoding="utf-8") as fh:
    themes = fh.read()

# 浅色在 :root，深色在 [data-theme="dark"]
light_start = themes.find(":root")
dark_start = themes.find('[data-theme="dark"]')
root_block = themes[light_start:dark_start]
dark_block = themes[dark_start:]

LIGHT = dict(re.findall(r"^\s*(--[a-z0-9-]+)\s*:\s*([^;]+);", root_block, re.M))
DARK = dict(re.findall(r"^\s*(--[a-z0-9-]+)\s*:\s*([^;]+);", dark_block, re.M))
TOK = dict(LIGHT)
TOK.update(DARK)


def rgba(value, default=(0, 0, 0, 255)):
    v = (value or "").strip()
    m = re.match(r"rgba?\(([^)]+)\)", v)
    if m:
        parts = [p.strip() for p in m.group(1).split(",")]
        r, g, b = (int(float(parts[i])) for i in range(3))
        a = int(float(parts[3]) * 255) if len(parts) > 3 else 255
        return (r, g, b, a)
    m = re.match(r"#([0-9a-fA-F]{6})", v)
    if m:
        h = m.group(1)
        return (int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16), 255)
    m = re.match(r"#([0-9a-fA-F]{3})$", v)
    if m:
        h = m.group(1)
        return (int(h[0] * 2, 16), int(h[1] * 2, 16), int(h[2] * 2, 16), 255)
    return default


def over(fg, bg):
    """把带 alpha 的 fg 合成到不透明 bg 上"""
    a = fg[3] / 255.0
    return tuple(int(fg[i] * a + bg[i] * (1 - a)) for i in range(3))


def font(size, bold=False):
    for name in (("msyhbd.ttc", "msyh.ttc") if bold else ("msyh.ttc",)):
        p = os.path.join(r"C:\Windows\Fonts", name)
        if os.path.isfile(p):
            try:
                return ImageFont.truetype(p, size)
            except Exception:
                pass
    return ImageFont.load_default()


def draw_modal(theme_name, is_dark, show_error=False, empty=False):
    t = TOK if is_dark else LIGHT
    text_primary = rgba(t["--text-primary"])
    text_secondary = rgba(t["--text-secondary"])
    text_muted = rgba(t["--text-muted"])
    accent_text = rgba(t["--accent-text"])
    accent_border = rgba(t["--accent-border"])
    accent_soft = rgba(t["--accent-soft"])
    accent_medium = rgba(t["--accent-medium"])
    danger = rgba(t["--danger"])
    danger_soft = rgba(t["--danger-soft"])
    glass_border = rgba(t["--glass-border"])
    glass_hover = rgba(t["--glass-hover"])
    glass_subtle = rgba(t["--glass-bg-subtle"])

    W, H = 760, 1000
    img = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)

    # ---- 背景：模拟卫星影像 + .modal-overlay 的 bg-overlay 压暗 ----
    for y in range(H):
        f = y / H
        base = (int(58 - 26 * f), int(76 - 34 * f), int(60 - 26 * f))
        d.line([(0, y), (W, y)], fill=base)
    overlay = rgba(t.get("--bg-overlay", "rgba(16,24,40,0.45)"))
    d.rectangle([0, 0, W, H], fill=overlay)

    # ---- 弹窗尺寸：max-width 480、width 90%（这里按 480 画） ----
    bw = 480
    bx = (W - bw) // 2
    by = 200
    bh = 330
    radius = 16

    # 玻璃面板：glass-bg 半透明叠在遮罩之上
    glass_bg = rgba(t["--glass-bg"])
    panel = over(glass_bg, over(overlay, (40, 55, 45)))
    d.rounded_rectangle([bx, by, bx + bw, by + bh], radius=radius, fill=panel,
                        outline=over(glass_border, panel), width=1)

    pad_x, pad_y = 40, 32
    cx = bx + pad_x
    cy = by + pad_y

    # ---- 关闭按钮（右上 .close-btn） ----
    cb = 36
    cbx, cby = bx + bw - 18 - cb, by + 14
    d.rounded_rectangle([cbx, cby, cbx + cb, cby + cb], radius=14, fill=over(glass_hover, panel))
    x_c = cbx + cb // 2
    y_c = cby + cb // 2
    r = 6
    d.line([x_c - r, y_c - r, x_c + r, y_c + r], fill=text_muted, width=2)
    d.line([x_c - r, y_c + r, x_c + r, y_c - r], fill=text_muted, width=2)

    # ---- 标题 h2：20px 600 + 20px 图标 ----
    ic = 20
    d.ellipse([cx, cy + 4, cx + ic, cy + ic + 4], outline=text_secondary, width=2)
    d.ellipse([cx + 5, cy + 9, cx + ic - 5, cy + ic - 1], outline=text_secondary, width=2)
    f_title = font(20, bold=True)
    d.text((cx + ic + 8, cy), "为这个位置命名", font=f_title, fill=text_primary)
    cy += 44

    # ---- .field-label：13px 600 ----
    f_label = font(13, bold=True)
    d.text((cx, cy), "名称", font=f_label, fill=text_secondary)
    cy += 26

    # ---- .text-field：padding 12/16、radius 14、glass-bg-subtle ----
    fh_ = 48
    field_bg = over(glass_subtle, panel)
    if show_error:
        d.rounded_rectangle([cx, cy, cx + bw - 2 * pad_x, cy + fh_], radius=14,
                            fill=field_bg, outline=danger, width=2)
        d.rounded_rectangle([cx - 2, cy - 2, cx + bw - 2 * pad_x + 2, cy + fh_ + 2], radius=16,
                            outline=over(danger_soft, panel), width=3)
    else:
        # 聚焦态：border accent + 3px accent-soft 外发光
        d.rounded_rectangle([cx - 2, cy - 2, cx + bw - 2 * pad_x + 2, cy + fh_ + 2], radius=16,
                            outline=over(accent_soft, panel), width=3)
        d.rounded_rectangle([cx, cy, cx + bw - 2 * pad_x, cy + fh_], radius=14,
                            fill=field_bg, outline=accent_border, width=1)

    f_input = font(15)
    if empty:
        d.text((cx + 16, cy + 14), "例如：家、公司、观景台", font=f_input, fill=text_muted)
    else:
        d.text((cx + 16, cy + 14), "标记 7", font=f_input, fill=text_primary)
    cy += fh_ + 6

    # ---- .field-error：12px，min-height 18 ----
    if show_error:
        f_err = font(12)
        d.text((cx, cy), "名称不能为空", font=f_err, fill=danger)
    cy += 24

    # ---- .modal-actions：右对齐，gap 12 ----
    def button(label, x_right, primary=False):
        f_b = font(13, bold=True)
        tw = d.textlength(label, font=f_b)
        pw, ph = int(tw + 28), 34
        x0, y0 = x_right - pw, cy + 6
        # 与工程既有的确认弹窗一致：两个按钮同样式，不做层级区分
        bg = over(accent_soft, panel)
        d.rounded_rectangle([x0, y0, x0 + pw, y0 + ph], radius=14, fill=bg,
                            outline=over(accent_border, panel), width=1)
        d.text((x0 + 14, y0 + 9), label, font=f_b, fill=accent_text)
        return x0

    right = bx + bw - pad_x
    confirm_x = button("确定", right, True)
    button("取消", confirm_x - 12, False)

    out = os.path.join(OUT, "render-%s.png" % theme_name)
    img.convert("RGB").save(out)
    return out


paths = [
    draw_modal("light", False, show_error=False, empty=False),
    draw_modal("dark", True, show_error=False, empty=False),
    draw_modal("error", False, show_error=True, empty=True),
]

# 拼成一张对比图
imgs = [Image.open(p) for p in paths]
sheet = Image.new("RGB", (sum(i.width for i in imgs) + 40, max(i.height for i in imgs) + 60), (245, 245, 248))
d = ImageDraw.Draw(sheet)
labels = ["浅色 · 正常", "深色 · 正常", "浅色 · 校验失败"]
x = 0
for im, lab in zip(imgs, labels):
    sheet.paste(im, (x, 50))
    d.text((x + (im.width - d.textlength(lab, font=font(18, True))) // 2, 16), lab,
           font=font(18, True), fill=(30, 30, 35))
    x += im.width + 20
sheet.save(os.path.join(OUT, "render-compare.png"))
print("ok:", os.path.join(OUT, "render-compare.png"))
print("浅色令牌抽样:", {k: LIGHT.get(k) for k in ("--glass-bg", "--text-primary", "--accent-text")})
print("深色令牌抽样:", {k: DARK.get(k) for k in ("--glass-bg", "--text-primary", "--accent-text")})
