# Locus Earth · Android 外壳

把网页版 [Locus Earth](https://locus-earth.pages.dev) 装进一个原生 WebView 壳的 Android 工程。

**核心思路：壳里没有任何业务逻辑。** 网页更新后手机端不用重新装 APK，壳只解决三件事：
全屏无地址栏、两个域名留在壳内、链接与权限按规则放行或出壳。

> ⚠️ 这是一个**独立工程**，不属于仓库根目录的网页工程。
> 用 Android Studio 打开的是 `androidapk/` 这个目录，不是仓库根目录。
> 仓库根目录的 `gradlew` / `settings.gradle.kts` / `build.gradle.kts` 一个都没有，也不需要。

---

## 目录

- [一、最短路径：在 Android Studio 里出 APK](#一最短路径在-android-studio-里出-apk)
- [二、命令行构建](#二命令行构建)
- [三、环境要求](#三环境要求)
- [四、签名与密钥](#四签名与密钥)
- [五、应用与依赖信息](#五应用与依赖信息)
- [六、域名白名单](#六域名白名单)
- [七、替换应用图标](#七替换应用图标)
- [八、网页侧怎么识别外壳](#八网页侧怎么识别外壳)
- [九、Cloudflare Pages 部署排除](#九cloudflare-pages-部署排除重要)
- [十、已知差异与 TODO](#十已知差异与-todo)
- [十一、目录结构](#十一目录结构)
- [十二、自检清单](#十二自检清单)

---

## 一、最短路径：在 Android Studio 里出 APK

1. **打开工程**：Android Studio → `File → Open` → 选中 **`androidapk/`** 目录 → 信任、等待 Gradle Sync 完成。
   （只选 `androidapk`，不要选仓库根目录，否则会把整个网页工程当成 Android 工程解析。）
2. **插上手机 / 开模拟器**，点工具栏的绿色 ▶ 直接跑到设备上试。
3. **出 APK**：菜单 `Build → Build App Bundle(s) / APK(s) → Build APK(s)`。
   完成后右下角会弹一个提示，点 `locate` 打开产物目录：

   ```
   androidapk/app/build/outputs/apk/debug/app-debug.apk      ← 调试包，可直接装机
   androidapk/app/build/outputs/apk/release/app-release.apk  ← 正式包（见第四节签名）
   ```

   想要 release：`Build → Generate Signed App Bundle / APK…`，或者用第二节的命令行。

> 第一次 Sync 会下载 Gradle 8.9 + AGP 依赖，国内网络可能较慢，见[第三节](#三环境要求)的镜像配置。

---

## 二、命令行构建

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

## 三、环境要求

| 项 | 要求 | 说明 |
|---|---|---|
| JDK | **17** | AGP 8.x 硬性要求。Android Studio 自带的 JBR 就是 17，一般不用管 |
| Android SDK | Platform **34** + Build-Tools 34.x | 用 SDK Manager 装 |
| Gradle | 8.9（wrapper 已带，不用自己装） | `gradle/wrapper/` 里已含 `gradle-wrapper.jar`，`./gradlew` 直接可用 |
| Android Studio | 建议 Iguana 2023.2 及以上 | 更低版本可能不认 AGP 8.6 |

**如果你本机 `JAVA_HOME` 指向 JDK 11 或 8**，命令行构建会报
`Unsupported class file major version`。在 Android Studio 里改
`Settings → Build, Execution, Deployment → Build Tools → Gradle → Gradle JDK` 选 17 即可；
命令行则临时指定：`JAVA_HOME=/path/to/jdk-17 ./gradlew ...`。

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

## 四、签名与密钥

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

`build.gradle.kts` 的判定逻辑：

| keystore.properties | storeFile 指向的文件 | 结果 |
|---|---|---|
| 不存在 | — | `assembleRelease` 用 **debug 签名**打包（能装能跑，不能上架） |
| 存在 | 不存在 | 同上 |
| 存在 | 存在 | 用 release 签名 |

所以 CI 上不配密钥也不会构建失败 —— 这正是 `.github/workflows/android.yml` 能只挑
"有密钥就签、没有就用 debug 签"的原因。

> ⚠️ **`keystore.properties` 和 `*.jks` 永远不要提交。** `.gitignore` 已经挡住了它们，
> 但如果哪天你手动 `git add -f`，密钥就会永久留在 git 历史里 —— 这种事故只能换密钥重来。

---

## 五、应用与依赖信息

| 项 | 值 |
|---|---|
| 应用名 | `Locus Earth` |
| applicationId / namespace | `dev.locusearth.app` |
| minSdk / targetSdk / compileSdk | **24** / **34** / **34** |
| versionCode / versionName | 1 / 1.0 |
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
| `com.google.android.material:material` | Material 3 主题 |
| `androidx.activity:activity-ktx` | `OnBackPressedCallback`、权限申请 |
| `androidx.webkit:webkit` | `WebViewAssetLoader`（本地错误页，见下） |
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

## 六、域名白名单

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
  Activity、不会出现"第二个浏览器"。
- **子资源（图片 / JS / CSS / CDN / 瓦片 / API）** 一律不拦，
  完全交给 WebView 自己的网络栈 —— 见 `AppWebViewClient.shouldInterceptRequest`
  的注释，别在这里加缓存或代理逻辑，会把 Cesium 拦坏。

### 怎么验证白名单生效

1. 在壳里打开地图 → 点「街景」→ 选一个中国境内的点：
   应当**留在壳内**打开 `qq-map.netlify.app`（按返回键能回到地球）。
2. 打开网页里「关于」弹窗 → 点 GitHub 链接：应当**跳出**到系统浏览器。
3. 断网后再启动：应看到本地错误页（`assets/error.html`），而不是白屏。

---

## 七、替换应用图标

当前是**占位图标**：深蓝底 + 浅蓝描边地球。颜色取自仓库现有的
`android-chrome-512x512.png`（`#88C8F8` / `#0E1320`）。

涉及的资源：

| 文件 | 作用 |
|---|---|
| `res/drawable/ic_launcher_foreground.xml` | 自适应图标**前景**（矢量，108×108，图形落在中间 66×66 安全区内） |
| `res/values/colors.xml` → `ic_launcher_background` | 自适应图标**背景色** |
| `res/mipmap-anydpi-v26/ic_launcher.xml` / `ic_launcher_round.xml` | Android 8.0+ 的自适应图标声明 |
| `res/mipmap-{m,h,xh,xxh,xxxh}dpi/ic_launcher[_round].png` | Android 7.x（API 24/25）用的位图，`minSdk 24` 必须有 |
| `res/values/colors.xml` → `brand_sky` / `brand_leaf` | 只服务于占位图标，换图标后可删 |
| `res/drawable/ic_splash_logo.xml` | 启动页图标 |

**最省事的换法**（推荐）：
Android Studio → 左侧 `res` 右键 → `New → Image Asset` → 选自己的 PNG/SVG →
它会自动覆盖上面这一整套（含各密度 PNG 和自适应图标），顺便把 `ic_launcher_round` 也生成好。

**手动替换**：只改 `ic_launcher_foreground.xml` 的 `pathData` 与颜色即可；
位图那套如果不动，API 24/25 上会继续显示旧图标，两者都换才一致。

> 换了图标后建议同步改 `res/drawable/ic_splash_logo.xml`，否则启动页和桌面图标长得不一样。

---

## 八、网页侧怎么识别外壳

壳会在 WebView 的 User-Agent 末尾追加一段标记：

```
... Mozilla/5.0 (...) ... LocusEarthAndroid/1.0
```

版本号取自 `app/build.gradle.kts` 的 `versionName`（见 `DomainPolicy.UA_SUFFIX`）。

网页侧可以这样判断（**当前仓库的网页代码没有被改动**，这里只是留给以后用）：

```js
const isAndroidShell = navigator.userAgent.includes('LocusEarthAndroid');
```

> 这个标记只影响 WebView 的 UA，不影响页面里任何密钥的校验（腾讯/天地图/Cesium
> 的额度是按 Referer 域名白名单管的，与 UA 无关）。

---

## 九、Cloudflare Pages 部署排除（重要）

### 先给结论

**Cloudflare Pages 不支持 `.cfignore`。** 官方 Build configuration 文档里没有任何"排除文件"
的概念，社区提过需求但没实现（[实测记录](https://jmasson.net/posts/2025-12-excluding-files-from-cloudflare-pages/)）。
所以本仓库**故意没有**创建 `.cfignore` —— 留一个不起作用的同名文件，只会让下一个读代码的人
（包括未来的你）以为 `androidapk/` 已经被排除了。

Pages 的规则只有一条：**Build output directory 里有什么，就原样发什么。**

### 风险有多大

| 情况 | 后果 |
|---|---|
| Build output directory = 仓库根（`/` 或 `./`） | `androidapk/` 里的 `gradlew`、`*.gradle.kts`、`gradle-wrapper.jar`、`README.md` 全部变成可下载的静态资源 |
| `keystore.properties` / `*.jks` | **已被 `.gitignore` 挡住，不会进 git、也就不会进 CF 的构建目录** —— 这是最后一道防线 |
| `_redirects` 兜底 | 可以把 `/androidapk/*` 301 到 `/`，但文件仍然躺在部署里，只是换个路径访问不到，治标不治本 |

### 推荐方案：一个 Build command 解决（不动网页代码、不挪目录）

本工程附了 `cf-pages-exclude.sh`，它把仓库根"排除法"打包到一个 `dist/` 目录：

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
> CF Pages 有一个"资产保留缓存"：曾经发出去的文件，即使从部署里删掉，
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

### 关于 GitHub Actions

仓库根多了一个 `.github/workflows/android.yml`。这是**唯一**必须放在仓库根目录的
Android 相关文件（GitHub 只认 `.github/workflows/`）。它不参与 CF Pages 构建，
上面的脚本也把它排除在 `dist/` 之外。不需要 CI 就直接删掉，不影响工程本身。

---

## 十、已知差异与 TODO

### 与需求书不一致的地方（都是有意为之）

| 需求原文 | 实际做法 | 原因 |
|---|---|---|
| 添加 `.cfignore` | 未创建，改为 `cf-pages-exclude.sh` + 配置说明 | CF Pages 不读 `.cfignore`，留空文件会造成"已排除"的错觉 |
| `onCreateWindow` 白名单内"返回 `null`（或复用同一个 WebView）" | 用一个不渲染的接驳 WebView 接住 URL，再在**当前** WebView 里加载 | Android 的契约没有"返回 null 但用当前 WebView 加载"这个选项：返回 null 就是不创建窗口，网页的 `window.open` 会静默失败，街景按钮直接失效 |
| 错误页"重试按钮（调用 `webView.reload()`）" | 重试是一个指向 `https://locus-earth.pages.dev/` 的普通链接 | 需求禁止 `addJavascriptInterface`，网页没有路径回调原生。链接会触发一次白名单内的导航，效果等价于重新加载应用首页 |
| 下拉刷新 | 未实现 | 与需求一致（地球交互容易误触） |

### 需求之外额外做的三个加固（觉得多余可以删）

1. **`onRenderProcessGone` 后重建 WebView**（`MainActivity.recreateWebView`）。
   Cesium 场景吃内存，渲染进程被系统回收时默认是**整个 App 一起闪退**；
   接管后表现是"页面重载回首页"。代价是未保存的视角会丢 —— 但比闪退好。
2. **`javaScriptCanOpenWindowsAutomatically = true`**。
   网页里的街景按钮是"先 `await` 查接口、查到再 `window.open`"，
   用户手势早被 `await` 吃掉，默认设置下这次 `window.open` 会被弹窗拦截器吞掉，
   表现就是**点了街景没反应**。放开是功能必需的，而且所有新窗口都会走白名单裁决。
3. **UA 标记**：需求里要求的 ` LocusEarthAndroid/1.0` 由 `versionName` 自动拼，
   改版本号不会忘记同步。

### TODO

| # | 事项 | 说明 |
|---|---|---|
| 1 | **收藏夹导出在壳里点不动** | 网页用 `Blob` + `<a download>` 触发下载，WebView 没有 `DownloadListener` 时会被静默忽略（导入同理）。修它需要 `DownloadListener` + MediaStore/SAF 落盘，而需求明确"不申请存储读写权限"，故留作后续 |
| 2 | 定位权限被**永久拒绝**后没有二次引导 | 当前只在系统弹窗里申请一次；用户选"不再询问"后网页只会拿到失败回调。可在 `shouldShowRequestPermissionRationale` 为 false 时加一个跳系统设置的提示 |
| 3 | 相机 / 麦克风 | 网页目前不需要，Manifest 里未声明。将来需要时补 `<uses-permission>` + `WebChromeClient.onPermissionRequest` |
| 4 | 全屏视频 | `onShowCustomView` / `onHideCustomView` 已按契约实现（含隐藏系统栏、返回键退出全屏），但没有真实视频可测 |
| 5 | 文件上传（`<input type="file">`） | 未实现 `onShowFileChooser`，网页侧目前没有上传控件 |

---

## 十一、目录结构

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
        │   ├── DomainPolicy.kt          ← ★ 白名单与 URL 策略（加域名只改这里）
        │   └── AssetsLoader.kt          ← assets 的虚拟 https 域名映射
        └── res/
            ├── drawable/ic_launcher_foreground.xml / ic_splash_logo.xml
            ├── layout/activity_main.xml
            ├── mipmap-anydpi-v26/     ← 自适应图标（API 26+）
            ├── mipmap-*-dpi/          ← 位图图标（API 24/25）
            ├── values/ values-night/  ← 颜色、文案、主题
            └── xml/network_security_config.xml
```

---

## 十二、自检清单

工程侧（本次已逐条静态核对，**未在本机执行真实构建**，原因见文末）：

| 检查项 | 位置 / 结论 |
|---|---|
| 两个白名单域名都在壳内打开 | `DomainPolicy.ALLOWED_HOSTS` 两项 + `isAllowedHost` 做子域后缀匹配 |
| 其它 http(s) 跳系统浏览器 | `AppWebViewClient.decideUrl` → `Intent.ACTION_VIEW`，并捕获 `ActivityNotFoundException` |
| 返回键行为 | `MainActivity` 的 `OnBackPressedCallback`：全屏→退全屏；`canGoBack`→`goBack`；否则 `finish()` |
| 定位权限申请后 Cesium 能拿到位置 | `onGeolocationPermissionsShowPrompt` → 运行时申请 → `callback.invoke(origin, granted, false)`；拒绝也会回调，不会让网页一直挂着 |
| 壳内不出 emoji / 不暴露原生能力 | 全工程无 `addJavascriptInterface` |
| `androidapk/` 不进 CF 部署产物 | `cf-pages-exclude.sh` **已本地实跑**：输出 56 个文件、`androidapk` 匹配 0 个、`index.html`/`sw.js`/`manifest.json`/`settings.html` 全在位（需在 CF 后台把 Build command 指过去） |

设备侧（等你装到手机上按这几步过一遍）：

- [ ] 冷启动：启动页是纯色、无白屏闪烁，随后自动进入地球
- [ ] 地球加载完，拖动/缩放正常（说明子资源没有被拦）
- [ ] API 24/25 设备上桌面图标显示正常（位图套），API 26+ 显示自适应图标
- [ ] 进入中国大陆 → 点「街景」→ 在壳内打开 `qq-map.netlify.app`，返回键能回到地球
- [ ] 「关于」里点 GitHub 链接 → 跳出到系统浏览器，切回来还是原来的地球
- [ ] 点网页里的定位按钮 → 弹系统定位权限 → 允许后能定位
- [ ] 飞行模式启动 → 出现本地错误页 → 关掉飞行模式点「重试」→ 能回到地球
- [ ] 深色模式下启动，全程无白屏

---

## 附：本次交付的环境说明

构建环境的限制（不是工程的问题）：

| 检查 | 本机结果 |
|---|---|
| Java | 只有 JDK 11 / 8（AGP 8.6 需要 **17**） |
| Android SDK | 未安装（`ANDROID_HOME` 为空、无 `~/AppData/Local/Android/Sdk`） |
| Gradle | 未在 PATH 上（工程自带 wrapper，不需要） |

因此**没有执行 `./gradlew :app:assembleDebug`**。作为替代，交付前做了三层硬验证：

| 层 | 手段 | 结果 |
|---|---|---|
| 资源 | `aapt2 compile --dir res`（用真 build-tools 34） | exit 0，无告警级错误 |
| 资源 + 清单 | `aapt2 link -I android.jar --manifest ... --java gen`（把两个外部主题父级临时换成本地框架主题以隔离库依赖） | exit 0；生成的 `R.java` 里 `color/shell_background`、`layout/activity_main`、`id/root`、`id/fullscreenContainer` 与 Kotlin 引用逐一吻合 |
| API 签名 | `javap` 对照 `android.jar` + androidx jar，逐条核对 **67 条**用到的 API（重写的回调签名、`WebSettings` 的每个 setter、错误码常量、以及 `WebViewAssetLoader` / `OnBackPressedCallback` / `WindowInsetsControllerCompat` / `installSplashScreen`） | 67/67 通过 |

另外还核对了两个外部库的资源名：`Theme.SplashScreen` 与四个 `windowSplashScreen*` / `postSplashScreenTheme`
属性确实由 core-splashscreen 1.0.1 声明，`Theme.Material3.DayNight.NoActionBar` 确实由 material 1.12.0 声明。
（验证脚本留在仓库根的 `tmp/` 下，已被 `.gitignore` 忽略，需要时可复跑。）

第一次在 Android Studio 里 Sync 时如果报错，最可能的两条：

| 报错 | 原因 |
|---|---|
| `Unsupported class file major version 55/61` | Gradle JDK 版本不对，改成 17 |
| `Failed to find Build Tools revision 34.0.0` | SDK Manager 里装 Build-Tools 34，或让 AGP 自动补装 |
