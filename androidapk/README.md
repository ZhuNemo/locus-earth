# Locus Earth · Android 外壳
<div align="left">
🌐 语言 / Language:
<a>简体中文</a> | <a href="README-EN.md">English</a>
</div>

把网页版 **[Locus Earth](https://locus-earth.pages.dev)** 装进一个原生 WebView 壳的 Android 工程。

**核心思路：壳里没有任何业务逻辑。** 它只解决四件事 —— 全屏无地址栏、两个域名留在壳内、
其余链接按规则放行或出壳、首次启动说明「这是网页应用」。
网页更新后手机端**不用重装 APK**，因为页面内容是实时从线上加载的。

- 声明：本文含 AI 生成内容

```
应用名        Locus Earth
包名          dev.locusearth.app
minSdk        24（Android 7.0）      targetSdk / compileSdk  34
语言 / 构建   Kotlin / Gradle Kotlin DSL
工具链        AGP 8.6.1 · Gradle 8.9 · Kotlin 1.9.24 · JDK 17
许可证        MIT（与主项目一致）
```

> ⚠️ **这是一个独立工程**，不属于仓库根目录的网页工程。
> 用 Android Studio 打开的是 `androidapk/` 这个目录，**不是仓库根目录**。
> 仓库根目录的 `gradlew` / `settings.gradle.kts` / `build.gradle.kts` 一个都没有，也不需要。

---

## 目录

- [一、这是什么（以及为什么需要它）](#一这是什么以及为什么需要它)
- [二、获取方式](#二获取方式)
- [三、最短路径：在 Android Studio 里出 APK](#三最短路径在-android-studio-里出-apk)
- [四、命令行构建](#四命令行构建)
- [五、用 GitHub Actions 出包（推荐）](#五用-github-actions-出包推荐)
- [六、签名与密钥](#六签名与密钥)
- [七、环境要求](#七环境要求)
- [八、应用与依赖信息](#八应用与依赖信息)
- [九、域名白名单](#九域名白名单)
- [十、替换应用图标](#十替换应用图标)
- [十一、首次启动提示](#十一首次启动提示这是一个网页应用)
- [十二、网页侧怎么识别外壳](#十二网页侧怎么识别外壳)
- [十三、Cloudflare Pages 部署排除（重要）](#十三cloudflare-pages-部署排除重要)
- [十四、收藏夹的导入 / 导出（跨网页与壳）](#十四收藏夹的导入--导出跨网页与壳)
- [十五、设计说明与已知差异](#十五设计说明与已知差异)
- [十六、已知限制与 TODO](#十六已知限制与-todo)
- [十七、目录结构](#十七目录结构)
- [十八、自检清单](#十八自检清单)
- [附：构建环境现状](#附构建环境现状)

---

## 一、这是什么（以及为什么需要它）

Locus Earth 本身是一个**纯前端网页应用**（Cesium 驱动的 3D 地球），打开浏览器就能用，
也可以作为 PWA 装到桌面。既然如此，为什么还要一个 Android 壳？

因为 PWA 在 Android 上有三个绕不开的体验缺口，而这个壳只针对这三点补位：

| 缺口 | 壳的做法 |
|---|---|
| 从桌面图标进入后会看到浏览器地址栏 | 全屏 WebView，无地址栏、无标签页 |
| 街景是第三方域名，PWA 里会跳出到浏览器 | 白名单内的域名留在壳内打开，返回键能回到地球 |
| 用户误以为这是原生 App，对「没网就白屏」「更新不用重装」产生错误预期 | 首次启动一次性的双语说明（第十一节） |

**所以这个壳的价值不在「功能」，而在「边界」**：它明确知道自己不该做什么 ——
一旦开始往壳里搬业务逻辑，网页和 App 就会变成两份需要各自维护的代码，
而「改网页不用重装 APK」这个最大优势也就同时失去了。

---

## 二、获取方式

### 普通用户

从 [GitHub Releases](https://github.com/ZhuNemo/locus-earth/releases) 下载最新 APK 安装即可
（若还没有发布记录，见第五节自己出一个，或第三、四节本地构建）。

> 安装 Android 应用需在系统设置里允许「安装未知来源应用」。
> 签名用的密钥不随仓库分发，见[第六节](#六签名与密钥)。

### 开发者

**Android 工程源码已随本仓库开源**，位于 `androidapk/` 目录，许可证与主项目一致（MIT）。
你可以直接阅读、修改、重新打包 —— 改图标、加白名单域名、改提示文案都不需要碰网页代码。

---

## 三、最短路径：在 Android Studio 里出 APK

1. **打开工程**：Android Studio → `File → Open` → 选中 **`androidapk/`** 目录 → 信任、等待 Gradle Sync 完成。
   （只选 `androidapk`，不要选仓库根目录，否则会把整个网页工程当成 Android 工程解析。）
2. **插上手机 / 开模拟器**，点工具栏的绿色 ▶ 直接跑到设备上试。
3. **出 APK**：菜单 `Build → Build App Bundle(s) / APK(s) → Build APK(s)`。
   完成后右下角会弹一个提示，点 `locate` 打开产物目录：

   ```
   androidapk/app/build/outputs/apk/debug/app-debug.apk      ← 调试包，可直接装机
   androidapk/app/build/outputs/apk/release/app-release.apk  ← 正式包（见第六节签名）
   ```

   想要 release：`Build → Generate Signed App Bundle / APK…`，或者用第四节的命令行。

> 第一次 Sync 会下载 Gradle 8.9 + AGP 依赖，国内网络可能较慢，见[第七节](#七环境要求)的镜像配置。

---

## 四、命令行构建

```bash
cd androidapk

# Windows
gradlew.bat :app:assembleDebug
gradlew.bat :app:assembleRelease

# macOS / Linux / Git Bash
./gradlew :app:assembleDebug
./gradlew :app:assembleRelease
```

> Windows 上用 Git Bash 执行 `./gradlew` 有时会因为没保留可执行位而报错，
> 用 `gradlew.bat` 或 `sh gradlew` 即可。

装到设备：

```bash
adb install -r app/build/outputs/apk/debug/app-debug.apk
```

---

## 五、用 GitHub Actions 出包（推荐）

仓库根的 `.github/workflows/android.yml` 已经配好，**不需要本地装任何 Android 工具链**：

| 触发方式 | 说明 |
|---|---|
| 手动 | 仓库 `Actions` → `Build Android APK` → `Run workflow` |
| 打 tag | `git tag v1.0 && git push origin v1.0` |

构建产物在 workflow 运行的 Artifacts 里（`locus-earth-android-release`，保留 30 天）。
CI 上用 `actions/setup-java` 固定 **temurin JDK 17**，与工程声明一致。

**签名是可选的**：在仓库 `Settings → Secrets and variables → Actions` 里加四个 secret，
配了就出正式签名包，**没配也能构建成功**（自动回退 debug 签名，能装能跑，只是不能上架）。

| Secret | 内容 |
|---|---|
| `ANDROID_KEYSTORE_BASE64` | `.jks` 文件做 base64 后的内容（Git Bash：`base64 -w0 release.jks > ks.txt`） |
| `ANDROID_KEYSTORE_PASSWORD` | keystore 密码 |
| `ANDROID_KEY_ALIAS` | 密钥别名 |
| `ANDROID_KEY_PASSWORD` | 密钥密码 |

---

## 六、签名与密钥

### 1. 生成 keystore

```bash
keytool -genkeypair -v \
  -keystore release.jks \
  -alias locus-earth \
  -keyalg RSA -keysize 2048 -validity 10950 \
  -storetype JKS
```

> 有效期写 10950 天（30 年）。**Google Play 要求密钥有效期至少到 2033 年**，
> 别用默认的 90 天。生成在 `androidapk/` 目录下即可，它已被 `.gitignore` 忽略。

也可以直接用 Android Studio：`Build → Generate Signed App Bundle / APK… → Create new…`。

### 2. 配置签名

```bash
cd androidapk
cp keystore.properties.example keystore.properties
# 再把里面的值改成你自己的
```

```properties
storeFile=release.jks
storePassword=你设置的密码
keyAlias=locus-earth
keyPassword=你设置的密码
```

`storeFile` 支持两种写法：

| 写法 | 解析顺序 |
|---|---|
| `release.jks`（相对路径） | 先找 `androidapk/app/release.jks`，找不到再找 `androidapk/release.jks` |
| `C:/keys/locusearth.jks`（绝对路径） | 直接用 |

### 3. 缺失时自动回退

`app/build.gradle.kts` 的判定逻辑：

| keystore.properties | storeFile 指向的文件 | 结果 |
|---|---|---|
| 不存在 | — | `assembleRelease` 用 **debug 签名**打包（能装能跑，不能上架） |
| 存在 | 不存在 | 同上 |
| 存在 | 存在 | 用 release 签名 |

所以 CI 上不配密钥也不会构建失败 —— 这正是第五节能只挑「有密钥就签、没有就用 debug 签」的原因。

> ⚠️ **`keystore.properties` 和 `*.jks` 永远不要提交。** `.gitignore` 已经挡住了它们，
> 但如果哪天你手动 `git add -f`，密钥就会永久留在 git 历史里 —— 这种事故只能换密钥重来。

---

## 七、环境要求

| 项 | 要求 | 说明 |
|---|---|---|
| JDK | **17** | AGP 8.x 硬性要求。Android Studio 自带的 JBR 通常满足 |
| Android SDK | Platform **34** + Build-Tools 34.x | 用 SDK Manager 装 |
| Gradle | 8.9（wrapper 已带，不用自己装） | `gradle/wrapper/` 里已含 `gradle-wrapper.jar`，`./gradlew` 直接可用 |
| Android Studio | 建议 Iguana 2023.2 及以上 | 更低版本可能不认 AGP 8.6 |

**如果你本机 `JAVA_HOME` 指向 JDK 11 或 8**，命令行构建会报
`Unsupported class file major version`。在 Android Studio 里改
`Settings → Build, Execution, Deployment → Build Tools → Gradle → Gradle JDK` 选 17 即可；
命令行则临时指定：`JAVA_HOME=/path/to/jdk-17 ./gradlew ...`。

> 如果本机 SDK 里没有 `platforms;android-34`，构建会报 `Failed to find Build Tools revision 34.0.0`
> 或 `compileSdk 34 not found`。装 `platforms;android-34` + `build-tools;34.0.0`，
> 或者把 `app/build.gradle.kts` 的 `compileSdk` / `targetSdk` 一起提到 35。
> **最简单的办法是走第五节让 CI 构建。**

### 国内网络加速（可选）

Gradle 发行包走官方 CDN 可能很慢，把 `gradle/wrapper/gradle-wrapper.properties` 里的
`distributionUrl` 换成腾讯云镜像：

```properties
distributionUrl=https\://mirrors.cloud.tencent.com/gradle/gradle-8.9-bin.zip
```

依赖仓库同理，在本工程的 `settings.gradle.kts` 的 `pluginManagement` 与
`dependencyResolutionManagement` 里，把 `google()` / `mavenCentral()` 前面插入：

```kotlin
maven { url = uri("https://maven.aliyun.com/repository/google") }
maven { url = uri("https://maven.aliyun.com/repository/public") }
```

（这两处属于个人环境优化，默认没写进仓库，避免影响 CI 的可复现性。）

---

## 八、应用与依赖信息

| 项 | 值 |
|---|---|
| 应用名 | `Locus Earth` |
| applicationId / namespace | `dev.locusearth.app` |
| minSdk / targetSdk / compileSdk | **24** / **34** / **34** |
| versionCode / versionName | 3 / 1.2 |
| 语言 | Kotlin |
| 构建脚本 | Gradle Kotlin DSL（`build.gradle.kts`） |
| AGP / Gradle / Kotlin / JDK | 8.6.1 / 8.9 / 1.9.24 / 17 |
| 主题 | `Theme.Material3.DayNight.NoActionBar`（深浅色跟随系统） |
| 模块结构 | 单模块 `:app` |

依赖：

| 库 | 用途 |
|---|---|
| `androidx.core:core-ktx` | 基础 |
| `androidx.appcompat:appcompat` | `AppCompatActivity` |
| `com.google.android.material:material` | Material 3 主题、弹窗、按钮 |
| `androidx.activity:activity-ktx` | `OnBackPressedCallback`、权限申请 |
| `androidx.webkit:webkit` | `WebViewAssetLoader`（本地错误页）+ **1.13.0 起的浏览器能力开关**：bfcache、预渲染、内核预热（见 §16 之后「性能设置」） |
| `androidx.core:core-splashscreen` | 启动页 |

启动加载：`https://locus-earth.pages.dev/`

### 浅色 / 深色

壳不做主题切换开关，只跟随系统，并且把「窗口底色」和「系统栏图标明暗」**成对**设置 ——
这两件事必须一起改，否则会出现白底白图标。

| 资源 | 浅色 | 深色 | 文件 |
|---|---|---|---|
| `shell_background`（窗口 / 状态栏底色） | `#FFFFFF` | `#0E1320` | `values/colors.xml`、`values-night/colors.xml` |
| `shell_navbar`（导航栏底色） | API 27+ 白；API 24~26 深色兜底 | `#0E1320` | 同上 + `values-v27/colors.xml` |
| `system_bars_light`（系统栏图标是否深色） | `true` | `false` | `values/bools.xml`、`values-night/bools.xml` |

两个容易踩的点：

- `windowLightStatusBar` / `windowLightNavigationBar` 在 `themes.xml` 里**显式**声明。
  Material 3 主题本身不声明它们（已核对 material 1.12.0 的 AAR 资源，全文没有这两项），
  只靠继承会落到平台默认值 `false` = 浅色模式下白底白图标。
- 导航栏要按 API 分级：`windowLightNavigationBar` 是 **API 27** 的属性，
  24~26 上导航栏图标永远是浅色，给它配白底就看不见了，所以低版本用深色兜底。

---

## 九、域名白名单

**当前允许在壳内打开的两个域名**（都含子域，例如 `pano.qq-map.netlify.app` 也命中）：

| 域名 | 用途 |
|---|---|
| `locus-earth.pages.dev` | Locus Earth 主站（Cloudflare Pages） |
| `qq-map.netlify.app` | 腾讯街景第三方查看器，网页用 `window.open` 打开它 |

另外有一个**壳内部域名**，不算业务白名单：
`appassets.androidplatform.net` —— 本地 `assets/` 以 https 形式暴露的虚拟域名（错误页用）。

### 新增白名单域名

**只改一处**：`app/src/main/java/dev/locusearth/app/DomainPolicy.kt` 的 `ALLOWED_HOSTS`。

```kotlin
private val ALLOWED_HOSTS = listOf(
    "locus-earth.pages.dev",
    "qq-map.netlify.app",
    "example.com",          // ← 加这里
)
```

规则回顾：

| 情况 | 行为 |
|---|---|
| `https://` + 白名单（含子域） | 留在壳内加载 |
| 白名单域名但用 `http://` | 丢给系统浏览器（壳强制 HTTPS，明文留在壳里也加载不出来） |
| 其它 `http(s)://` | 丢给系统浏览器 |
| `mailto:` / `tel:` / `geo:` / `market:` 等 | 丢给对应 App |
| `about:` / `data:` / `blob:` / `javascript:` | 留在 WebView 内（丢出去也打不开） |
| 未知 scheme | 忽略并记日志，不弹系统选择器、不崩 |

补充说明两点：

- **`window.open` / `target="_blank"`**：白名单内在**当前 WebView** 加载，不会弹第二个
  Activity、不会出现「第二个浏览器」。
- **子资源（图片 / JS / CSS / CDN / 瓦片 / API）** 一律不拦，
  完全交给 WebView 自己的网络栈 —— 见 `AppWebViewClient.shouldInterceptRequest`
  的注释，别在这里加缓存或代理逻辑，会把 Cesium 拦坏。

### 怎么验证白名单生效

1. 在壳里打开地图 → 点「街景」→ 选一个中国境内的点：
   应当**留在壳内**打开 `qq-map.netlify.app`（按返回键能回到地球）。
2. 打开网页里「关于」弹窗 → 点 GitHub 链接：应当**跳出**到系统浏览器。
3. 断网后再启动：应看到本地错误页（`assets/error.html`），而不是白屏。

---

## 十、替换应用图标

当前图标是**实心绿蓝地球**（深蓝黑底 `#0E1320` + 浅蓝圆盘），来自源图
`androidapk/icon-source/locus-earth-icon-512.png` —— 它和仓库根的
`android-chrome-512x512.png` 是同一张图（网页的 PWA 图标），复制一份进 Android 工程是为了
**让本工程自包含，且图标原料不随 CF Pages 部署出去**。

### 换图标：改一处，跑一个脚本

```bash
# 1. 覆盖源图（正方形 PNG，≥512×512，透明背景）
cp 你的新图标.png androidapk/icon-source/locus-earth-icon-512.png

# 2. 重新生成 res/ 下的全部位图
python androidapk/tools/gen-icon-assets.py
```

脚本会打印每个密度的实测圆盘直径并自检（`蓝盘实测 == 期望`），全部 24 个文件一次生成。

> 脚本只依赖 `Pillow`，**不参与 gradle 构建**，只在人工换图标时跑一次。
> 想连仓库根的 `android-chrome-512x512.png` 一起换，那是网页 PWA 的事，两边各改一次。

### ⚠️ 不要用 Android Studio 的 New → Image Asset 向导

原因是它算不对安全区：

这张源图的地球圆盘是**满幅**的 —— 实测圆盘半径 = 画布半宽 × **1.0026**
（圆盘顶到甚至略微超出 512 方形的四边，四周没有任何留白）。
向导把普通方形图按「内容 = 整张图」处理，于是自适应图标的前景会被放得过大、
Safe Zone 判断失准。生成脚本里用 `SOURCE_DISC_RATIO = 1.0026` 显式补偿了这个特性：

```
缩放比 = (目标mark_dp / 画布dp × 画布px) / (源图px × 1.0026)
```

### 涉及的资源

| 文件 | 作用 |
|---|---|
| `icon-source/locus-earth-icon-512.png` | **唯一的图标原料**，换 logo 只改这里 |
| `tools/gen-icon-assets.py` | 生成下面全部位图；可复跑、幂等、带自检 |
| `res/mipmap-<density>/ic_launcher_foreground.png` | 自适应图标**前景**，蓝盘 = 66dp 安全区（6 个密度） |
| `res/values/colors.xml` → `ic_launcher_background` | 自适应图标**背景色** `#0E1320` |
| `res/mipmap-anydpi-v26/ic_launcher.xml` / `ic_launcher_round.xml` | Android 8.0+ 的自适应图标声明 |
| `res/mipmap-<density>/ic_launcher[_round].png` | Android 7.x（API 24/25）用的位图，`minSdk 24` 必须有 |
| `res/drawable-<density>/ic_splash_logo.png` | 启动页图标（6 个密度） |
| `res/drawable/ic_launcher_monochrome.xml` | Android 13+ 主题图标（线框地球矢量，见下） |
| `res/values/colors.xml` → `brand_sky` / `brand_leaf` | 只服务于主题图标矢量 |

尺寸口径（不是随手定的）：

| 用途 | 图形占画布 | 依据 |
|---|---|---|
| 自适应前景 | 66 / 108 | 66dp 是**任何遮罩下都保证可见**的安全区 |
| 传统图标（API 24/25） | 32 / 48 | 与自适应图标视觉重量一致（都是 66.7%） |
| 启动页 | 72 / 108 | Android 12 启动画面画布 288dp，只有内圈 192dp（= 2/3）不被圆形遮罩切到 |

### 已知的不一致：主题图标仍是线框地球

`mipmap-anydpi-v26/*.xml` 的 `monochrome` 指向 `drawable/ic_launcher_monochrome.xml`，
那是一枚**线框地球**矢量，和桌面图标的实心版长得不一样。

为什么不能直接复用位图前景：主题图标只取 **alpha 通道**由系统重新上色，
而实心圆盘取 alpha 就是一枚纯色圆饼 —— 上色后完全看不出是地球。
所以这里保留描边版本，取 alpha 后至少是个地球轮廓。

要统一就得重画一个「只有轮廓、没有内部填充」的单色地球矢量替换它。

---

## 十一、首次启动提示（「这是一个网页应用」）

首次安装后第一次打开，先出现一屏**全屏的原生提示页**，中英双语说明「这是网页应用，不是原生 App」，
底部两个按钮：**退出**（结束应用）/ **进入**（开始加载网页）。点过「进入」之后，
以后每次启动都直接进网页，不再出现。

实现：`WelcomeScreen.kt`（`object`，往 Activity 根布局 `addView` 一个整页视图）
+ `layout/view_welcome.xml` + `values/strings.xml`。

### 为什么要它

壳把网页包装得太完整，用户会误以为是原生 App，进而产生错误预期
（比如「为什么没网就白屏」「为什么更新要重新下载」）。这一屏是**一次性的预期管理**，不是欢迎语。

### 几个刻意的设计

| 决定 | 原因 |
|---|---|
| 提示页在**建 WebView 之前**出现 | 用户点「退出」时不该已经白花流量去加载地球。见 `MainActivity.setupWebView()` |
| 没有「点外部/返回键关掉」这条路 | 只有「退出 / 进入」两个出口，要求用户明确表态，避免「没进也没退」的模棱两可状态 |
| 用**整页视图**而不是弹窗 | 双语文案在弹窗里宽度受限，中文正体会被挤成很多短行；整页可以分四段排版（中英标题 + 中英正文），按钮固定在底部 |
| 直接 `addView` 到 Activity 根布局，不另开 Activity | 壳只有 MainActivity 一个窗口，返回键/任务栈/深链回壳都不用多考虑一层；这一屏的职责只是「在 WebView 建起来之前挡住它」 |
| 按钮的 `textColor` / `backgroundTint` / `strokeColor` 全部写死 | Material 按钮默认从主题继承 `colorOnPrimary` 一类属性。提示页是用户看到的第一屏，只要某一层主题没解析到，按钮文字就会和背景同色而「消失」。所以这三样一律用 `welcome_button_*` 资源显式给值，不依赖继承链 |
| 读完 `commit()` 而不是 `apply()` | 用户可能点完立刻强杀应用，`apply()` 异步落盘有极小概率没写完，下次启动会又出现一次 |
| 中英标题、正文分成四个 TextView | 全屏页纵向空间足够，按层级排版比用 HTML `<big>`/`<small>` 模拟字号更清晰 |

### 改文案 / 改「只出现一次」的行为

| 想改什么 | 改哪里 |
|---|---|
| 文案 | `values/strings.xml` 的 `welcome_*` |
| 按钮文字 | 同上 `welcome_exit` / `welcome_enter` |
| 布局与间距 | `res/layout/view_welcome.xml` |
| 颜色（深浅色各一套） | `values/colors.xml`、`values-night/colors.xml` 的 `welcome_*` |
| 记住「已看过」的键 | `WelcomeScreen` 里的 `KEY_SHOWN`（存在 SharedPreferences `locus_earth_shell`） |
| 让老用户再看一次 | 卸载重装，或清应用数据（该键随应用数据一起被清） |

> 卸载重装 / 清应用数据后提示会再出现一次，这是预期行为 —— 那等同于一次全新安装。
> 版本升级**不会**重现：`SharedPreferences` 不随 APK 更新而清除。

---

## 十二、网页侧怎么识别外壳

壳会在 WebView 的 User-Agent 末尾追加一段标记：

```
... Mozilla/5.0 (...) ... LocusEarthAndroid/1.2
```

版本号取自 `app/build.gradle.kts` 的 `versionName`（见 `DomainPolicy.UA_SUFFIX`）。

网页侧可以这样判断（**当前仓库的网页代码没有被改动**，这里只是留给以后用）：

```js
const isAndroidShell = navigator.userAgent.includes('LocusEarthAndroid');
```

> 这个标记只影响 WebView 的 UA，不影响页面里任何密钥的校验（腾讯/天地图/Cesium
> 的额度是按 Referer 域名白名单管的，与 UA 无关）。

---

## 十三、Cloudflare Pages 部署排除（重要）

### 先给结论

**Cloudflare Pages 不支持 `.cfignore`。** 官方 Build configuration 文档里没有任何「排除文件」
的概念，社区提过需求但没实现。所以本仓库**故意没有**创建 `.cfignore` —— 留一个不起作用的同名文件，
只会让下一个读代码的人（包括未来的你）以为 `androidapk/` 已经被排除了。

Pages 的规则只有一条：**Build output directory 里有什么，就原样发什么。**

### 风险有多大

| 情况 | 后果 |
|---|---|
| Build output directory = 仓库根（`/` 或 `./`） | `androidapk/` 里的 `gradlew`、`*.gradle.kts`、`gradle-wrapper.jar`、`README.md` 全部变成可下载的静态资源 |
| `keystore.properties` / `*.jks` | **已被 `.gitignore` 挡住，不会进 git、也就不会进 CF 的构建目录** —— 这是最后一道防线 |
| `_redirects` 兜底 | 可以把 `/androidapk/*` 301 到 `/`，但文件仍然躺在部署里，只是换个路径访问不到，治标不治本 |

### 推荐方案：一个 Build command 解决（不动网页代码、不挪目录）

本工程附了 `cf-pages-exclude.sh`，它把仓库根「排除法」打包到一个 `dist/` 目录：

```bash
bash androidapk/cf-pages-exclude.sh
```

在 Cloudflare 控制台改两个格子：

```
Workers & Pages → 选你的项目 → Settings → Build configuration

  Build command:            bash androidapk/cf-pages-exclude.sh
  Build output directory:   dist
```

顺手把 `Build command` 从空改成上面的命令之后，网页本身**一个文件都不用挪**，
仓库结构、本地开发方式、Service Worker 的路径全部不变。

**部署完务必验证一次**（应当返回 404 或 403）：

```
https://locus-earth.pages.dev/androidapk/settings.gradle.kts
```

> ⚠️ **一定要在把 `androidapk/` 推上去之前配好。**
> CF Pages 有一个「资产保留缓存」：曾经发出去的文件，即使从部署里删掉，
> 也可能继续被访问最多一周，而且**没有手动清理入口**，只能等它自己过期。
> 一旦漏发过一次，最保险的做法是轮换其中所有可能敏感的凭据。

### 另一种方案：把网页挪进 `./web/`（本次**没有**采用）

| | 方案 A：`cf-pages-exclude.sh` + `dist`（已采用） | 方案 B：网页挪进 `./web/`，Root directory 设为 `web` |
|---|---|---|
| 仓库改动 | 只增不改（新增 1 个 shell 脚本） | 移动 `index.html`/`js/`/`css/`/`sw.js`… 全部网页文件 |
| CF 配置 | 改 Build command 与输出目录 | 改 Root directory |
| 风险 | 依赖 CF 的构建环境有 `tar`（有） | 极易漏配：GitHub Pages 的发布源、`sw.js` 的 `SHELL_URLS`、manifest 路径、本地开发服务器根目录都要跟着改 |
| 对本地开发 | 无影响 | 本地起服务、调试路径全变 |
| 结论 | ✅ 采用 | ❌ 本次不动，除非以后仓库里还要塞第二个非网页工程 |

如果哪天真要走方案 B，请作为**独立的一次改动**来做：先跑通「本地 `python -m http.server`
在 `web/` 下能开」，再动 CF 与 GitHub Pages 的配置，别和 Android 工程混在一个提交里。

---

## 十四、收藏夹的导入 / 导出（跨网页与壳）

这是唯一一条**两边都要动**的功能，因为文件属于操作系统能力，网页拿不到。
两侧的职责划得很清楚：**网页负责内容，壳负责把文件交出去 / 收进来。**

| 动作 | 网页侧 | 壳侧 |
|---|---|---|
| 导出 | `navigator.share({ files })` 优先；不支持时回退 `<a download>` + blob | 不需要代码：系统分享面板由系统接管（`DownloadListener` 只兜底 http/https 直链） |
| 导入 | `<input type="file">` + `FileReader` | `onShowFileChooser` → `ACTION_GET_CONTENT` |

### 为什么导出必须走系统分享

`blob:` 下载在 Android WebView 里**原理上无法由原生侧保存**：
blob 的字节只存在于渲染进程，`DownloadListener.onDownloadStart` 收到的只是一个
`blob:https://...` 字符串，原生侧无从读取内容。
所以导出没有走「补一个 DownloadListener」的老路，而是改走
`navigator.share()` —— 系统分享面板里可以「保存到文件」、发给自己等，
是 Android 上把文件交出去的正规通路，而且**不需要任何存储权限**。

### 为什么导入不需要存储权限

`ACTION_GET_CONTENT` + `CATEGORY_OPENABLE` 走的是 SAF（存储访问框架）：
用户在系统文件选择器里挑一个文件，系统只给这一个 URI 的读权限，用完即弃。
因此 Manifest 里**依然只有三项权限**（INTERNET + 两个定位），没有新增任何存储权限。

### 两个容易踩的坑

- **`<queries>` 必须声明 `GET_CONTENT`**。targetSdk 30+ 的包可见性限制下，
  不声明就可能解析不到任何文件管理器，`startActivity` 直接抛 `ActivityNotFoundException`。
- **`onShowFileChooser` 的回调必须作答一次，取消也要答（传 null）**。
  漏答会让网页那个 `<input type="file">` 永久处于等待状态 —— 之后连点击都不再有反应。
  代码里因此把「选中 / 取消 / 无文件管理器」三条路径都收敛到 `deliverFileChooserResult()`。

---

## 十五、设计说明与已知差异

### ⚠️ 这几处「看起来不对」，但都是有意为之，别改回去

| 看起来「不对」的地方 | 为什么必须这样 |
|---|---|
| 没写 `.cfignore` | **CF Pages 不支持 `.cfignore`**（官方文档无此概念）。写一个不起作用的同名文件只会让人误以为已经排除。真正的解法是 `cf-pages-exclude.sh` + CF 后台改 Build command |
| `onCreateWindow` 没用「返回 null 让当前 WebView 加载」 | Android 的契约里**没有**这个选项：返回 null 就是不创建窗口，网页的 `window.open` 会静默失败，街景按钮直接失效。现在用一个不渲染的「接驳 WebView」把目标 URL 截下来再路由回主 WebView |
| `javaScriptCanOpenWindowsAutomatically = true` | 不是优化，是**功能必需**。网页的街景按钮是 `await lookupPano()` 之后再 `window.open`，用户手势已被 await 吃掉，默认设置下会被弹窗拦截器吞掉 → 表现是「点街景点不动」 |
| 错误页的「重试」是普通链接而不是 `webView.reload()` | 需求禁止 `addJavascriptInterface`，网页没有路径回调原生。链接触发一次白名单内的导航，效果等价 |
| 首次提示页没有「关掉」这条路 | 见第十一节：只有退出 / 进入两个出口，要求用户明确表态，避免「没进也没退」 |
| 下拉刷新：未实现 | 与设计一致（地球交互容易误触） |

### 需求之外额外做的两个加固（觉得多余可以删）

1. **`onRenderProcessGone` 后重建 WebView**（`MainActivity.recreateWebView`）。
   Cesium 场景吃内存，渲染进程被系统回收时默认是**整个 App 一起闪退**；
   接管后表现是「页面重载回首页」。代价是未保存的视角会丢 —— 但比闪退好。
2. **UA 标记**：需求里要求的 ` LocusEarthAndroid/1.2` 由 `versionName` 自动拼，
   改版本号不会忘记同步。

---

## 十六、已知限制与 TODO

### 已解决（曾列为 TODO）

| 事项 | 现在的做法 |
|---|---|
| 收藏夹**导入**在壳里点不动 | 实现了 `WebChromeClient.onShowFileChooser` → `ACTION_GET_CONTENT`，由系统文件选择器接管。SAF 按次授权，**不需要任何存储权限**。另外补了清单里的 `<queries>` GET_CONTENT（targetSdk 30+ 缺它可能解析不到文件管理器） |
| 收藏夹**导出**在壳里点不动 | 网页侧改为**分享优先**：`navigator.share({files})` 交给系统分享面板（可存到「文件」）。原因是 `blob:` 下载在原理上就无法由原生侧接管 —— blob 字节只存在于渲染进程，`DownloadListener` 拿到的只是个字符串 |
| 文件上传（`<input type="file">`） | 与导入共用同一条 SAF 通路，已可用 |

导出保留了两条通路：系统分享优先，桌面浏览器（通常不支持分享文件）自动回退到原本的 `<a download>`。
壳里另有 `DownloadListener` 处理 http/https 直链下载，落到系统「下载」目录，同样不需要存储权限。

### 仍然存在

| # | 事项 | 说明 |
|---|---|---|
| 1 | `blob:` 直链下载无法在壳内保存 | 原理限制（见上）。若将来网页新增非分享通路的 blob 下载入口，需要改用「页面把内容交给原生」的机制才能落盘 |
| 2 | 定位权限被**永久拒绝**后没有二次引导 | 当前只在系统弹窗里申请一次；用户选「不再询问」后网页只会拿到失败回调。可在 `shouldShowRequestPermissionRationale` 为 false 时加一个跳系统设置的提示 |
| 3 | 相机 / 麦克风 | 网页目前不需要，Manifest 里未声明。将来需要时补 `<uses-permission>` + `WebChromeClient.onPermissionRequest` |
| 4 | 全屏视频 | `onShowCustomView` / `onHideCustomView` 已按契约实现（含隐藏系统栏、返回键退出全屏），但没有真实视频可测 |
| 5 | ~~设置页返回会导致主页面重新加载~~ → **已解决（bfcache）** | 见下方「性能设置」第 2 条：命中 bfcache 时返回不重新加载 Cesium 场景、相机视角不丢；未命中（旧内核 / 内核不支持）时行为与之前一致 |

### 性能设置：向商业浏览器看齐做了哪些

壳不自定义内核、不上 Bubblewrap / TWA，所以性能空间就在「把 WebView 自带的浏览器能力用满」。
下面 6 项都落在 `MainActivity` 与 `AndroidManifest.xml` 里，按收益从大到小：

| # | 设置 | 位置 | 收益 / 原因 |
|---|---|---|---|
| 1 | **启动页挡到网页首帧** | `MainActivity.holdSplashUntilFirstFrame()` | 商业浏览器是「用户看到内容那一刻才撤启动画面」，不是窗口首帧。本应用首屏要拉 Cesium，不挡的话观感是「启动页 → 白/黑屏 → 地球」三段跳。带 6 秒兜底超时，断网不会把人锁死在启动页 |
| 2 | **Back/Forward Cache（bfcache）** | `MainActivity.createMainWebView()` | 治上面原问题 5：`settings.html` 返回命中 bfcache 时**不重新加载** Cesium 场景、相机视角不丢。来自 `androidx.webkit` 1.13.0 的实验性 API，调用前先 `WebViewFeature.isFeatureSupported(BACK_FORWARD_CACHE)` 探测，不支持的设备什么都不做 |
| 3 | **渲染进程优先级 IMPORTANT** | 同上 | Cesium 吃内存。把渲染进程标成「重要且不可豁免」，系统回收时先动别人（≈浏览器前台标签的优先级），减少「场景莫名重载」 |
| 4 | **关掉 WebView 级缩放**（`setSupportZoom(false)`） | 同上 | 双指/双击判定完全交给 Cesium，触摸事件少一层 WebView 仲裁，地球更跟手 |
| 5 | **显式 `android:hardwareAccelerated="true"`** | `AndroidManifest.xml` | WebGL 的前提（API 14 起默认就是 true，写出来是为了防被「顺手优化」关掉） |
| 6 | **依赖升到 `androidx.webkit:1.13.0`** | `app/build.gradle.kts` | 第 2 项的能力来源。aar 元数据里 `minCompileSdk=34`，与工程 compileSdk 一致，不用动 SDK |

**刻意没做的，以及为什么**：

| 没做 | 原因 |
|---|---|
| `prerenderUrlAsync`（预渲染首页） | Cesium 场景会被渲染两遍，内存 / GPU 翻倍，反而更容易触发渲染进程回收。等真有「秒开」诉求时再实验 |
| `startUpWebView`（异步内核预热） | androidx 自己标注「实验性、不适合非实验用途、随时可能删」；收益只是省一次几十到几百毫秒的内核启动，不划算 |
| `setOffscreenPreRaster` | 全屏 3D 页面不滚动，预光栅化没有对象 |
| `android:largeHeap` | 只放大 app 进程的 Java 堆；JS / WebGL 的内存住在渲染进程里，加了没用 |
| `setForceDark` / `setAlgorithmicDarkeningAllowed` | 网页自带深浅色主题，交给网页，壳不插手 |
| `setCacheMode(LOAD_CACHE_ELSE_NETWORK)` | Service Worker 自己管缓存；强制走缓存可能给出过期瓦片，对地球应用是错的 |
| `DOCUMENT_START_SCRIPT` / `WEB_MESSAGE_LISTENER` | 都属于「壳向网页注入东西」，与「不暴露原生能力、不被网页牵着走」的约定相冲 |

---

## 十七、目录结构

```
androidapk/
├── README.md                        ← 本文件
├── cf-pages-exclude.sh              ← CF Pages 排除 androidapk/ 的构建脚本
├── build.gradle.kts                 ← 顶层：只声明插件版本
├── settings.gradle.kts              ← 单模块 :app
├── gradle.properties
├── gradlew / gradlew.bat            ← Gradle 8.9 wrapper（已内置，不用自己装 Gradle）
├── gradle/wrapper/
│   ├── gradle-wrapper.jar
│   └── gradle-wrapper.properties
├── icon-source/
│   └── locus-earth-icon-512.png     ← 图标原料（与仓库根 PWA 图标同图）
├── tools/
│   └── gen-icon-assets.py           ← 生成 res/ 下全部图标位图
├── keystore.properties.example      ← 复制成 keystore.properties 再填（已被 .gitignore 忽略）
├── .gitignore
└── app/
    ├── build.gradle.kts             ← SDK 版本、依赖、签名回退逻辑
    ├── proguard-rules.pro           ← 占位（未开混淆）
    └── src/main/
        ├── AndroidManifest.xml      ← 权限 / queries / 网络安全配置 / Activity
        ├── assets/error.html        ← 加载失败页（纯本地，断网可用）
        ├── java/dev/locusearth/app/
        │   ├── MainActivity.kt          ← 装配 WebView、返回键、定位、全屏、错误页、重建
        │   ├── AppWebViewClient.kt      ← 顶层导航裁决 / 子资源放行 / 错误上报
        │   ├── AppWebChromeClient.kt    ← 新窗口 / 定位询问 / 全屏回调
        │   ├── WelcomeScreen.kt          ← 首次启动的全屏提示页（「这是一个网页应用」）
        │   ├── DomainPolicy.kt          ← ★ 白名单与 URL 策略（加域名只改这里）
        │   └── AssetsLoader.kt          ← assets 的虚拟 https 域名映射
        └── res/
            ├── drawable/ic_launcher_monochrome.xml  ← Android 13+ 主题图标（线框地球矢量）
            ├── drawable-*-dpi/ic_splash_logo.png     ← 启动页图标（脚本生成）
            ├── layout/activity_main.xml / view_welcome.xml
            ├── mipmap-anydpi-v26/     ← 自适应图标（API 26+）
            ├── mipmap-*-dpi/          ← 位图图标：前景 / 传统方形 / 传统圆形（脚本生成）
            ├── values/ values-night/  ← 颜色、文案、主题
            └── xml/network_security_config.xml
```

---

## 十八、自检清单

工程侧（静态核对 + 资源自检；真实出包由 `.github/workflows/android.yml` 在 CI 上跑）：

| 检查项 | 位置 / 结论 |
|---|---|
| 两个白名单域名都在壳内打开 | `DomainPolicy.ALLOWED_HOSTS` 两项 + `isAllowedHost` 做子域后缀匹配 |
| 其它 http(s) 跳系统浏览器 | `AppWebViewClient.decideUrl` → `Intent.ACTION_VIEW`，并捕获 `ActivityNotFoundException` |
| 返回键行为 | `MainActivity` 的 `OnBackPressedCallback`：全屏→退全屏；`canGoBack`→`goBack`；否则 `finish()` |
| 定位权限申请后 Cesium 能拿到位置 | `onGeolocationPermissionsShowPrompt` → 运行时申请 → `callback.invoke(origin, granted, false)`；拒绝也会回调，不会让网页一直挂着 |
| 壳内不暴露原生能力 | 全工程无 `addJavascriptInterface` |
| 图标安全区正确 | `tools/gen-icon-assets.py` 自带自检：6 个密度的实测圆盘直径与 `66/108 × 画布` 逐一相符（mdpi 实测 66px / 期望 66px） |
| 自适应图标在各遮罩下不被切 | 用生成产物模拟 circle / squircle / rounded / square 四种遮罩，圆盘均完整落在 66dp 安全区内 |
| 首次启动提示的资源闭合 | `welcome_*` 六个字符串、`view_welcome.xml`、`welcomeTitle`/`welcomeSubtitle`/`welcomeBody`/`welcomeBodyEn`/`welcomeExit`/`welcomeEnter` 六个 id、以及 `welcome_*` 六个颜色（values + values-night 各一套）与 Kotlin 引用逐一对照，全部命中 |
| 文件选择用到的平台 API | 解析真 `android.jar`（android-35）的 class 常量池逐条核对：`onShowFileChooser` / `FileChooserParams.parseResult` / `ValueCallback.onReceiveValue` / `DownloadManager.Request.*` / `URLUtil.guessFileName` 全部存在且签名一致 |
| 网页侧不再出现原生弹窗 | 全站 `prompt(` / `confirm(` / `alert(` 已清空，仅保留 3 处「弹窗元素缺失时退回原生」的兜底，均有注释标明 |
| `androidapk/` 不进 CF 部署产物 | `cf-pages-exclude.sh` **已本地实跑**：输出 56 个文件、`androidapk` 匹配 0 个、`index.html`/`sw.js`/`manifest.json`/`settings.html` 全在位（需在 CF 后台把 Build command 指过去） |

设备侧（装到手机上按这几步过一遍）：

- [ ] **首次安装后首次启动**：出现全屏的「这是一个网页应用」提示页（中英标题 + 中英正文，底部两个按钮），文字不被截断、两个按钮上的「退出 / 进入」都清晰可见，点「进入」才加载地球
- [ ] **第二次启动**：直接进网页，不再出现提示页
- [ ] 提示页上点「退出」：应用结束，不进网页
- [ ] 提示页显示期间旋转屏幕 / 切换系统深浅色：页面不消失、文字不丢（`uiMode` 在 `configChanges` 里，Activity 不重建，所以**深浅色不会实时切换**，重启应用后生效 —— 这是刻意的，避免 Cesium 场景被重建）
- [ ] 小屏 + 大字号（系统字体调到最大）：正文可以滚动到底，两个按钮仍完整可见
- [ ] 清应用数据后再启动：提示重新出现（这是预期行为）
- [ ] 冷启动：启动页是纯色、无白屏闪烁，随后自动进入地球
- [ ] 地球加载完，拖动/缩放正常（说明子资源没有被拦）
- [ ] API 24/25 设备上桌面图标显示正常（位图套），API 26+ 显示自适应图标
- [ ] 桌面图标在各家启动器（圆形 / 方形 / squircle）下都不被切边
- [ ] 系统开启「主题图标」后，图标仍能看出是地球（预期是线框样式，见第十节）
- [ ] **收藏夹「导出」**：弹出系统分享面板，能把 CSV 存到「文件」或发给别的应用
- [ ] **收藏夹「导入」**：弹出系统文件选择器，选中导出的 CSV 后能导入并看到成功提示
- [ ] 导入时点「取消」：不报错、不卡住，重开面板再点「导入」仍有反应（回调作答的关键回归项）
- [ ] 删除标记：弹出的是站内确认弹窗（而非「<域名> 显示」的系统框），确认后图标消失
- [ ] 进入中国大陆 → 点「街景」→ 在壳内打开 `qq-map.netlify.app`，返回键能回到地球
- [ ] 「关于」里点 GitHub 链接 → 跳出到系统浏览器，切回来还是原来的地球
- [ ] 点网页里的定位按钮 → 弹系统定位权限 → 允许后能定位
- [ ] 飞行模式启动 → 出现本地错误页 → 关掉飞行模式点「重试」→ 能回到地球
- [ ] 深色模式下启动，全程无白屏

---

## 附：构建环境现状

### 这个工程不在本机出包，出包走 GitHub Actions

`androidapk/` 的构建路径是 `.github/workflows/android.yml`（见[第五节](#五用-github-actions-出包推荐)）。
本机只用来改代码、生成图标资源、做静态检查。

**当前开发机（2026-10-15 实测）的实际情况：**

| 项 | 实测 |
|---|---|
| Android Studio | `D:\Android studio`，build `AI-253.32098.37.2534.15052363` |
| 自带 JBR | **JDK 21.0.10**（工程 Gradle JDK 已指向它，见 `.gradle/config.properties`） |
| Android SDK | `D:\AndroidSDK`（`local.properties` 的 `sdk.dir` 已配好；`ANDROID_HOME` 环境变量为空） |
| SDK 里装了什么 | platforms：`android-35` / `android-36.1`；build-tools：`36.0.0` / `36.1.0` / `37.0.0` |
| ⚠️ **缺什么** | **没有 `platforms;android-34`**，工程 `compileSdk = 34` 要求的正是它 |
| Gradle 发行包 | `D:\.gradle\wrapper\dists\gradle-8.9-bin` 只有 0 字节的 `.part` + `.lck` —— 中断的残缺下载，从未完成 |
| 构建产物 | 无。`app/build/` 不存在 |

所以「本机能不能出包」的答案是 **目前不能**，而且原因不是缺工具，是那几处具体缺口：

1. **`compileSdk 34` 缺 platform**。AGP 8.6.1 会自动去下，但国内网络不稳；想手工补就装
   `platforms;android-34` + `build-tools;34.0.0`，或者把 `compileSdk` / `targetSdk` 提到 35。
2. **gradle-8.9 发行包是残件**，得让它重新下（约 130 MB）。
3. 本机 JDK 是 **21**，而工程按 **17** 配置。Gradle 8.9 跑在 21 上没问题，但**这个组合没在本机验证过**；
   CI 上用的是 temurin **17**，与工程声明一致 —— **以 CI 为准**。

### 已经做过的验证：静态核对，不是真实构建

| 层 | 手段 | 结果 |
|---|---|---|
| 资源引用闭合 | 枚举 `res/` 所有 `@drawable`/`@mipmap`/`@color`/`@string`/`@style`/`@id` + Kotlin 的 `R.*` / `getString(R.string.*)` | 全部解析，无悬空 |
| XML 合法性 | 全量解析 `res/` 下 XML | 全部通过 |
| 图标尺寸 | 生成脚本自检 + 独立复测 24 个 PNG | 6 个密度圆盘直径全部相符 |
| 图标遮罩 | 合成 circle / squircle / rounded / square 四种遮罩 | 圆盘完整落在 66dp 安全区内 |
| PNG 完整性 | 逐张校验 | 全部通过 |

**没有做的**：`aapt2` 资源编译、Kotlin 编译、真机/模拟器运行。
所以第一次 CI 构建如果报错，优先怀疑资源或代码的**编译期**问题，而不是图标几何算错。
