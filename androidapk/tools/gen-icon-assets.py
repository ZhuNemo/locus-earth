#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Locus Earth Android 图标资源生成器
=================================

从 androidapk/icon-source/locus-earth-icon-512.png（512×512，与仓库根的
android-chrome-512x512.png 内容一致）生成 res/ 下的全部图标位图。

为什么不能用 Android Studio 的 New → Image Asset 向导
----------------------------------------------------
那张源图的蓝色圆盘是**满幅**的：实测圆盘半径 = 画布半宽 × 1.0026，
即圆盘刚好顶到（甚至略微超出）512 方形的四边，四周没有任何留白。
向导会把普通方形图按"内容 = 整张图"处理，于是自适应图标的安全区会算错。
这里用 SOURCE_DISC_RATIO 显式补偿这个满幅特性。

生成清单
--------
mipmap-<density>/ic_launcher_foreground.png   自适应图标前景（API 26+），蓝盘 = 66dp 安全区
mipmap-<density>/ic_launcher.png              API 24/25 传统方形图标
mipmap-<density>/ic_launcher_round.png        API 24/25 传统圆形图标
drawable-<density>/ic_splash_logo.png         启动页图标（Android 12+ 启动画面）

用法
----
    python androidapk/tools/gen-icon-assets.py

幂等：重复运行结果一致。改了 logo 就换掉 icon-source/ 里的源图再跑一次。
本脚本**不参与 gradle 构建**，只在人工换图标时运行。
"""

import math
import os
import sys

from PIL import Image, ImageDraw

# --------------------------------------------------------------------------
# 路径
# --------------------------------------------------------------------------
HERE = os.path.dirname(os.path.abspath(__file__))
ANDROIDAPK = os.path.dirname(HERE)
RES = os.path.join(ANDROIDAPK, "app", "src", "main", "res")
SOURCE = os.path.join(ANDROIDAPK, "icon-source", "locus-earth-icon-512.png")

# --------------------------------------------------------------------------
# 几何常量
# --------------------------------------------------------------------------
#: 源图中蓝色圆盘半径 ÷ 画布半宽。1.0026 是实测值 —— 圆盘满幅。
SOURCE_DISC_RATIO = 1.0026

#: 自适应图标：108dp 画布，中间 66dp 是任何遮罩下都保证可见的安全区。
ADAPTIVE_CANVAS_DP = 108.0
ADAPTIVE_SAFE_DP = 66.0

#: 传统/传统圆形图标：整张图就是图标本体，图形略小于画布留出呼吸空间。
LEGACY_CANVAS_DP = 48.0
LEGACY_MARK_DP = 32.0

#: 启动页：Android 12+ 启动画面的应用图标画布是 288dp，其中只有中间 192dp
#: （正好 2/3）不会被 160dp 的圆形遮罩切到。这里按 108dp 画布等比换算，
#: 于是安全图形 = 108 × 2/3 = 72dp。
SPLASH_CANVAS_DP = 108.0
SPLASH_MARK_DP = 72.0

#: 传统圆形图标用的圆形裁剪半径（占画布比例）。0.5 = 内切圆。
ROUND_CLIP_RATIO = 0.5

#: 传统方形图标的圆角比例（Android 传统图标实测约 20%）
SQUARE_CORNER_RATIO = 0.20

#: 抗锯齿用的超采样倍率
SS = 4

DENSITIES = {
    "ldpi": 0.75,
    "mdpi": 1.0,
    "hdpi": 1.5,
    "xhdpi": 2.0,
    "xxhdpi": 3.0,
    "xxxhdpi": 4.0,
}

#: 从源图里实测出来的品牌色，用来给传统图标铺底
SKY = (136, 201, 249)     # #88C9F9 海洋
BACKGROUND = (14, 19, 32)  # #0E1320 与壳的 shell_background / ic_launcher_background 一致


# --------------------------------------------------------------------------
# 工具
# --------------------------------------------------------------------------
def load_source():
    if not os.path.isfile(SOURCE):
        sys.exit("找不到源图：%s" % SOURCE)
    im = Image.open(SOURCE).convert("RGBA")
    if im.width != im.height:
        sys.exit("源图必须是正方形，当前 %dx%d" % (im.width, im.height))
    return im


def place(src, canvas_px, canvas_dp, mark_dp):
    """
    把源图按"蓝盘直径 = mark_dp"的比例缩放后居中放到 canvas_px 的画布上。

    关键就是这个换算：源图的蓝盘直径是 512 × SOURCE_DISC_RATIO 像素，
    要让它等于 mark_dp/canvas_dp × canvas_px 像素，缩放比就是
        scale = (mark_dp / canvas_dp * canvas_px) / (src.width * SOURCE_DISC_RATIO)
    """
    disc_px_src = src.width * SOURCE_DISC_RATIO
    target_disc_px = canvas_px * mark_dp / canvas_dp
    scale = target_disc_px / disc_px_src
    side = max(1, int(round(src.width * scale)))
    resized = src.resize((side, side), Image.LANCZOS)
    canvas = Image.new("RGBA", (canvas_px, canvas_px), (0, 0, 0, 0))
    off = (canvas_px - side) // 2
    canvas.alpha_composite(resized, (off, off))
    return canvas


def rounded_square_mask(size, corner_ratio, supersample=SS):
    big = size * supersample
    m = Image.new("L", (big, big), 0)
    ImageDraw.Draw(m).rounded_rectangle(
        [0, 0, big - 1, big - 1], radius=int(big * corner_ratio), fill=255
    )
    return m.resize((size, size), Image.LANCZOS)


def circle_mask(size, radius_ratio=0.5, supersample=SS):
    big = size * supersample
    m = Image.new("L", (big, big), 0)
    r = big * radius_ratio
    c = big / 2.0
    ImageDraw.Draw(m).ellipse([c - r, c - r, c + r, c + r], fill=255)
    return m.resize((size, size), Image.LANCZOS)


def save(img, folder, name):
    d = os.path.join(RES, folder)
    os.makedirs(d, exist_ok=True)
    p = os.path.join(d, name)
    img.save(p, "PNG", optimize=True)
    return os.path.relpath(p, ANDROIDAPK).replace("\\", "/")


# --------------------------------------------------------------------------
# 生成
# --------------------------------------------------------------------------
def main():
    src = load_source()
    written = []

    for dens, mult in DENSITIES.items():
        # ---- 1. 自适应图标前景：蓝盘 = 66dp 安全区 ----------------------------
        side = int(round(ADAPTIVE_CANVAS_DP * mult))
        fg = place(src, side, ADAPTIVE_CANVAS_DP, ADAPTIVE_SAFE_DP)
        written.append(save(fg, "mipmap-%s" % dens, "ic_launcher_foreground.png"))

        # ---- 2. API 24/25 传统方形图标 --------------------------------------
        side = int(round(LEGACY_CANVAS_DP * mult))
        base = Image.new("RGBA", (side, side), BACKGROUND + (255,))
        base.alpha_composite(place(src, side, LEGACY_CANVAS_DP, LEGACY_MARK_DP))
        sq = Image.new("RGBA", (side, side), (0, 0, 0, 0))
        sq.paste(base, (0, 0), rounded_square_mask(side, SQUARE_CORNER_RATIO))
        written.append(save(sq, "mipmap-%s" % dens, "ic_launcher.png"))

        # ---- 3. API 24/25 传统圆形图标 --------------------------------------
        rd = Image.new("RGBA", (side, side), (0, 0, 0, 0))
        rd.paste(base, (0, 0), circle_mask(side, ROUND_CLIP_RATIO))
        written.append(save(rd, "mipmap-%s" % dens, "ic_launcher_round.png"))

        # ---- 4. 启动页图标 --------------------------------------------------
        side = int(round(SPLASH_CANVAS_DP * mult))
        splash = place(src, side, SPLASH_CANVAS_DP, SPLASH_MARK_DP)
        written.append(save(splash, "drawable-%s" % dens, "ic_splash_logo.png"))

        print("  %-8s x%-4s -> 前景 %dpx / 传统 %dpx / 启动页 %dpx"
              % (dens, mult, int(round(ADAPTIVE_CANVAS_DP * mult)),
                 int(round(LEGACY_CANVAS_DP * mult)),
                 int(round(SPLASH_CANVAS_DP * mult))))

    print("\n写出 %d 个文件：" % len(written))
    for w in written:
        print("  " + w)

    # ---- 自检：前景的蓝盘直径是否正好等于 66/108 画布 ------------------------
    for dens, mult in DENSITIES.items():
        side = int(round(ADAPTIVE_CANVAS_DP * mult))
        fg = Image.open(os.path.join(RES, "mipmap-%s" % dens, "ic_launcher_foreground.png")).convert("RGBA")
        a = fg.getchannel("A")
        bb = a.getbbox()
        if bb is None:
            sys.exit("自检失败：%s 前景全透明" % dens)
        w = bb[2] - bb[0]
        want = side * ADAPTIVE_SAFE_DP / ADAPTIVE_CANVAS_DP
        ok = abs(w - want) <= 2
        print("  自检 %-8s 蓝盘实测 %dpx / 期望 %.1fpx  %s" % (dens, w, want, "OK" if ok else "偏差过大"))
        if not ok:
            sys.exit("自检失败：%s" % dens)


if __name__ == "__main__":
    main()
