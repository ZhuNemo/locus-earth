# 交接文档：在另一台电脑上继续 Locus Earth Android 外壳

> **这份文件是给"另一台电脑 / 另一段对话"的上下文交接**。
> 起因：Android 外壳工程是在另一台机器上做完的，那台机器上的 AI 记忆（`.workbuddy/memory/`）
> 被 `.gitignore` 忽略、不随 git 走，所以到新机器后相当于"没有任何上下文"。
> 看完这份 + `androidapk/README.md`，就等于把当时的决策过程也带过来了。

---

## 0. 先确认你拿到代码了

`androidapk/` 是**新增目录**。如果 `git pull` 之后看不到它，说明当时还没提交：

```bash
git log --oneline -3          # 应该能看到含 androidapk 的提交
ls androidapk/                 # 应该有 README.md / settings.gradle.kts / app/ …
```

看不到就回原机器 `git add androidapk .github && git commit && git push`。
（`.workbuddy/` 永远不要提交，理由见第 6 节。）

---

## 1. 这是什么

把网页版 Locus Earth（`https://locus-earth.pages.dev`）装进原生 WebView 壳的 Android 工程。

**壳里没有任何业务逻辑**，只干三件事：全屏无地址栏、两个域名留在壳内、其余链接出壳到系统浏览器。
网页更新后手机端不用重装 APK —— 别把网页逻辑往壳里搬。

| 项 | 值 |
|---|---|
| 包名 | `dev.locusearth.app` |
| SDK | minSdk 24 / target 34 / compile 34 |
| 工具链 | AGP 8.6.1 + Gradle 8.9 + Kotlin 1.9.24 + **JDK 17** |
| 模块 | 单模块 `:app` |

## 2. 出 APK 的三步

1. **Android Studio → File → Open → 选 `androidapk/` 目录**（不是仓库根目录）。
2. 等 Gradle Sync（首次会下 Gradle 8.9 + AGP）。
3. `Build → Build App Bundle(s) / APK(s) → Build APK(s)`，右下角点 `locate`。

产物：`androidapk/app/build/outputs/apk/debug/app-debug.apk`
命令行等价于 `cd androidapk && ./gradlew :app:assembleDebug`（Windows 用 `gradlew.bat`）。
签名 / 换图标 / 加白名单域名 / 国内镜像加速，都在 `androidapk/README.md` 里有分节说明。

## 3. ⚠️ 这四个地方**不要"顺手改回去"**

当时的实现和最初的需求书有四处不一致，全部是有原因的。如果新对话里有人按"常识"改回原方案，
功能会直接坏掉：

| 看起来"不对"的地方 | 为什么必须这样 |
|---|---|
| 没写 `.cfignore` | **Cloudflare Pages 不支持 `.cfignore`**（官方文档无此概念，社区实测也没有）。写一个不起作用的同名文件只会让人误以为已经排除。真正的解法是 `cf-pages-exclude.sh` + CF 后台改 Build command |
| `onCreateWindow` 没用"返回 null 让当前 WebView 加载" | Android 契约里**没有**这个选项。返回 null = 不创建窗口，网页的 `window.open` 会静默失败。现在用一个不渲染的"接驳 WebView"把目标 URL 截下来再路由回主 WebView |
| `WebSettings.javaScriptCanOpenWindowsAutomatically = true` | 不是优化，是**功能必需**。网页的街景按钮是 `await lookupPano()` 之后再 `window.open`，用户手势已被 await 吃掉，默认设置下会被弹窗拦截器吞掉 → 表现是"点街景点不动" |
| 错误页的"重试"是普通链接而不是 `webView.reload()` | 需求明确禁止 `addJavascriptInterface`，网页没有路径回调原生。链接触发一次白名单内的导航，效果等价 |

额外加的（需求没写，但删了会变差）：`onRenderProcessGone` → 重建 WebView。
Cesium 吃内存，渲染进程被回收时默认行为是**整个 App 闪退**。

## 4. 已经验证到什么程度

原机器上**没有 Android SDK、JDK 只有 11**，所以 `./gradlew assembleDebug` **没有真正跑过**。
替代方案是下载 SDK 片段做了三层硬验证：

| 层 | 手段 | 结果 |
|---|---|---|
| 资源 | 真 build-tools 34 的 `aapt2 compile --dir res` | exit 0 |
| 资源 + 清单 | `aapt2 link -I android.jar --manifest … --java gen` | exit 0；生成的 `R.java` 里 `color/shell_background`、`layout/activity_main`、`id/root`、`id/fullscreenContainer` 与 Kotlin 引用逐一吻合 |
| API 签名 | `javap` 对照 `android.jar` + androidx jar，核对 67 条用到的 API | 67/67 通过 |
| CF 排除脚本 | 本地实跑 `cf-pages-exclude.sh` | 输出 56 个文件，`androidapk` 命中 0 个，首屏文件全在位 |

**因此你在新机器上第一次 Sync / Build 时的报错，大概率是环境问题而不是代码问题。**常见两条：

| 报错 | 原因 |
|---|---|
| `Unsupported class file major version 55/61` | Gradle JDK 不是 17（改 `Settings → Build Tools → Gradle → Gradle JDK`） |
| `Failed to find Build Tools revision 34.0.0` | SDK Manager 装 Build-Tools 34，或让 AGP 自动补装 |

构建跑通后，请在真机上过一遍 `androidapk/README.md` 第十二节的 8 项清单
（图标、街景进出壳、定位、飞行模式错误页等）。

## 5. 踩过的坑（下次别再踩）

- **XML 注释里不能出现连续两个 ASCII 连字符**。写 `--bg-primary` 会把整个 XML 写坏，
  `values/colors.xml` 就是这么挂过一次的（错误信息是 "not well-formed (invalid token)"）。
- **单独跑 `aapt2 link` 要自己补 Manifest 的 `package` 属性**：平时由 AGP 从
  `build.gradle.kts` 的 `namespace` 注入，脱离 AGP 就会报 `<manifest> must have a 'package' attribute`。
- **`material 1.12.0` 的 AAR 资源里没有 `windowLightStatusBar` / `windowLightNavigationBar`**
  （已 grep AAR 核对）。只靠继承会落到平台默认 `false`，也就是**浅色模式下白底白图标**。
  壳里是显式声明的，别删。
- `windowLightNavigationBar` 是 **API 27** 的属性；24~26 上导航栏图标恒为浅色，
  所以 `shell_navbar` 用 `values-v27` 分级：27+ 白，24~26 深色兜底。
- **Cloudflare Pages 有"资产保留缓存"**：曾经发出去的文件即使从部署里删掉，
  也可能继续被访问最多一周且**没有手动清理入口**。所以 CF 的排除配置必须在
  第一次推 `androidapk/` **之前**就配好。

## 6. 记忆放在哪、为什么没跟过来

| 位置 | 内容 | 会随 git 走吗 |
|---|---|---|
| `<仓库>/.workbuddy/memory/MEMORY.md` | 项目长期记忆（架构约定、坐标系、坑） | ❌ 被 `.gitignore` 的 `.workbuddy/` 忽略 |
| `<仓库>/.workbuddy/memory/2026-10-*.md` | 每日工作日志（含 10-14 的 Android 外壳决策） | ❌ 同上 |
| `C:\Users\<你>\.workbuddy\user-<id>-personal\` | 跨项目个人偏好（SOUL/IDENTITY/USER） | ❌ 在仓库之外，属于"人"不属于"仓库" |
| 云端 | 服务端自动维护的用户画像 | ❌ 本地没有可转发的副本 |

**结论：不要试图"转发记忆文件"。** 记忆里和这次任务相关的部分已经全部沉淀进
`androidapk/README.md` + 这份 `HANDOFF.md`，而这两个文件都在仓库里、会随 git 走。
新机器上让 AI 读这两个文件就够了。

（如果你确实想让记忆也随仓库走，可以在根 `.gitignore` 里加一行 `!.workbuddy/memory/`。
但那等于把工程笔记公开到 GitHub 仓库，是否愿意由你决定 —— 当时的判断是**不公开**。）

## 7. 可直接粘贴到新对话的开场白

```
接手一个已完成的 Android 外壳工程，先读这两个文件再动手：
- androidapk/README.md      （怎么构建、签名、换图标、加白名单域名、CF Pages 部署排除）
- androidapk/HANDOFF.md     （当时的关键决策与踩过的坑）

现状：工程已建好（Kotlin + 原生 WebView，包名 dev.locusearth.app，minSdk 24 / target 34），
但从未真正跑过 gradle 构建（原机器没有 Android SDK）—— 只做过 aapt2 资源链接和 javap API 签名核对。
现在这台机器有 Android Studio，目标是：先 `./gradlew :app:assembleDebug` 跑通，再真机验证。

注意 HANDOFF.md 第 3 节列了四个"看起来不对但别改回去"的实现，改之前先读原因。
```
