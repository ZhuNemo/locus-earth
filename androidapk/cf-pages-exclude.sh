#!/usr/bin/env bash
# ============================================================================
# Locus Earth —— Cloudflare Pages 部署前的"挑包"脚本
# ----------------------------------------------------------------------------
# 为什么需要它：
#   CF Pages **没有** .cfignore（不支持按 .cfignore 排除文件，官方文档里也没有这个
#   概念，社区多次提过需求但没有实现）。它的规则很简单：
#   「Build output directory 里有什么，就原样发什么」。
#   所以只要输出目录是仓库根（很多人图省事填 / 或 ./），
#   新加的 androidapk/ 就会被当成静态资源一起发到 CDN 上 ——
#   gradle-wrapper.jar、*.gradle.kts、keystore.properties（如果误提交）全都可被下载。
#
# 用法（在 Cloudflare 控制台里改两个格子）：
#   Workers & Pages → 选你的项目 → Settings → Build configuration
#     Build command:          bash androidapk/cf-pages-exclude.sh
#     Build output directory: dist
#   Build command 留空/写 exit 0 都不行 —— 那样输出目录还是仓库根，排除不掉。
#
# 验证是否生效（部署完成后在浏览器里访问，应当返回 404/403）：
#   https://locus-earth.pages.dev/androidapk/settings.gradle.kts
#
# ⚠️ 一定要**在把 androidapk/ 推上去之前**配好：
#   CF Pages 有一个"资产保留缓存"，曾经发出去的文件即使从部署里删掉，
#   也可能继续被访问最多一周，而且没有手动清理入口。
# ============================================================================

set -euo pipefail

OUT="dist"

# 每次都从零开始，避免上一次构建的残留混进来
rm -rf "$OUT"
mkdir -p "$OUT"

# 用"排除法"打包：仓库根 → dist，只把它排除掉
#   · ./androidapk            —— 本工程，绝不能进 CDN
#   · ./dist                  —— 正在写入的输出目录（不排除会递归套娃）
#   · ./.git                  —— CF 的构建目录里有完整 git 历史，体积大且不该公开
#   · ./node_modules ./tmp ./tests ./.workbuddy —— 本地/测试用，本来就在 .gitignore 里，
#                                                  这里再挡一层，防止将来有人把它们移出忽略列表
# curl -sSL -o ... 之类的东西都不需要，全部在仓库内完成。
tar \
  --exclude='./androidapk' \
  --exclude='./androidapk/*' \
  --exclude='./dist' \
  --exclude='./dist/*' \
  --exclude='./.git' \
  --exclude='./.git/*' \
  --exclude='./node_modules' \
  --exclude='./node_modules/*' \
  --exclude='./tmp' \
  --exclude='./tmp/*' \
  --exclude='./tests' \
  --exclude='./tests/*' \
  --exclude='./.workbuddy' \
  --exclude='./.workbuddy/*' \
  --exclude='./.github' \
  --exclude='./.github/*' \
  -cf - . | tar -xf - -C "$OUT"

echo "==> dist/ 里共有 $(find "$OUT" -type f | wc -l) 个文件"
echo "==> 确认 androidapk 未被收录：$(find "$OUT" -path '*androidapk*' | wc -l) 个匹配（应为 0）"
echo "==> 确认首屏文件在位："
for f in index.html sw.js manifest.json settings.html; do
  if [ -f "$OUT/$f" ]; then
    echo "    ok   $f"
  else
    echo "    MISSING  $f" >&2
    exit 1
  fi
done
