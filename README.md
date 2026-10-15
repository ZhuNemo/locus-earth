# Locus Earth
<div align="left">
🌐 语言 / Language:
<a>简体中文</a> | <a href="README-EN.md">English</a>
</div>

<div align="left">
<img src="./android-chrome-192x192.png" alt="Locus Earth Logo" width="50" height="50">
<img src="./locus-earth-logo.svg" alt="Locus Earth Text Logo" width="220">
</div>

<div align="left">
<a href="https://github.com/ZhuNemo/locus-earth/blob/main/LICENSE"><img src="https://img.shields.io/badge/License-MIT-yellow" alt="License: MIT"></a>
</div>

> 打开浏览器就能用的 3D 地球 —— 基于 Cesium，免安装、免注册。
>
> **[Github Pages](https://zhunemo.github.io/locus-earth/)** · **[Cloudflare Pages](https://locus-earth.pages.dev)**

---

## 目录
- [项目简介](#-项目简介)
- [核心功能](#-核心功能)
- [界面预览](#-界面预览)
- [使用说明](#-使用说明)
- [设置与自定义](#-设置与自定义)
- [Android 版（APK）](#-android-版apk)
- [技术栈与致谢](#-技术栈与致谢)
- [API Key 注意事项](#-api-key-注意事项)
- [项目信息](#-项目信息)

---

## 🌍 项目简介
**Locus Earth** 是一个轻量、快速的开源 Web 3D 地球应用。灵感来自 Google Earth，把「打开就能看世界」这件事做薄做快：零构建、纯前端、可装到桌面/手机当 PWA 用。

全部代码以 MIT 许可开源，**网页端与 Android 壳工程都在本仓库里**（壳在 [`androidapk/`](./androidapk/)，见 [Android 版](#-android-版apk)）。网页本身无需安装；APK 只是另一种进入方式，不是必需品 —— 你也可以自行构建、修改、再分发。

---

## ✨ 核心功能

**浏览**
- 3D 地形 + 全球卫星影像，全球 3D 建筑（OpenStreetMap）。
- 多底图一键切换：Sentinel-2、Blue Marble、夜间灯光、天地图卫星、腾讯地图等。

**工具**
- 测距 / 测面积（折线与多边形均贴地形）。
- 标记与收藏夹，保存在浏览器本地，支持导入导出。
- 地点搜索框，输入地名即定位。

**情景联动**
- 进入丹佛、华盛顿 D.C.、悉尼等覆盖区，自动开启高精度城市建模。
- 进入中国大陆，功能栏自动出现「街景」按钮，点地图即可跳转 360° 全景。

**外观与交互**
- 真实光照、建筑白模开关；深浅主题（可跟随系统）。
- 指南针、恢复俯仰角、可拖动的悬浮工具条，桌面与移动端均已适配。
- 谷歌 3D 地球模式：网络允许时一键切换，比原版轻量得多。

---

## 📱 界面预览
**移动端：**
<img src="./screenshot-mobile.png" alt="screenshot-mobile">

**桌面端：**
<img src="./screenshot-desktop.png" alt="screenshot-desktop">

*截图不一定实时更新，最新界面请访问网页。*

---

## 🧭 使用说明
- **标记 / 街景 / 测量三者互斥**：同一时刻只激活一个，切换时自动关闭另一个，避免点击冲突。
- 街景跳转依赖网络，PWA 离线时不可用。
- 移动端底部托盘可上滑展开，点击手柄收合。

---

## ⚙️ 设置与自定义
功能栏「设置」进入 `/settings/`，可调整明暗主题（跟随系统 / 手动）、地形加载、路网叠加与缓存。

---

## 📱 Android 版（APK）

本项目**不是一个原生 App**。网页才是主体，Android 版只是一个原生 WebView 外壳 ——
它把网页全屏装进一个没有地址栏的窗口里，页面内容仍然从线上实时加载。

| | |
|---|---|
| **获取** | 从 [Releases](https://github.com/ZhuNemo/locus-earth/releases) 下载 APK；或按下表自行构建 |
| **包名 / 要求** | `dev.locusearth.app` · Android 7.0（API 24）及以上 |
| **壳的职责** | 全屏无地址栏 · 白名单域名留在壳内 · 其余链接交给系统浏览器 · 首次启动说明「这是网页应用」 |
| **源码位置** | [`androidapk/`](./androidapk/)（独立 Gradle 工程，与主项目同为 MIT 许可） |

**网页更新后不用重装 APK。** 壳里没有任何业务逻辑，改网页即对所有已安装用户生效。
只有换图标、改白名单域名、改包名这类壳自身的事才需要重新出包。

<details>
<summary><b>点开查看：自己构建 APK / 签名说明</b></summary>

三种方式任选：

| 方式 | 怎么做 |
|---|---|
| GitHub Actions（推荐） | 仓库 `Actions` → `Build Android APK` → `Run workflow`；或推一个 `v*` tag。产物在 Artifacts 里 |
| 命令行 | `cd androidapk && ./gradlew :app:assembleRelease`（Windows 用 `gradlew.bat`） |
| Android Studio | 打开 **`androidapk/`** 目录（不是仓库根）→ `Build → Build APK(s)` |

签名是可选的：CI 上配了密钥就出正式签名包，**没配也能构建成功**（自动回退 debug 签名，能装能跑、不能上架）。
Fork 后要发布自己的版本，请按 [`androidapk/README.md`](./androidapk/README.md) 第六节
生成自己的 keystore，**不要复用他人密钥**。

安装时需在系统设置里允许「安装未知来源应用」。用自备密钥签名的包，
后续更新必须用**同一个密钥**签名，否则系统会拒绝覆盖安装。

完整的构建、签名、换图标、加白名单域名、Cloudflare Pages 部署排除等说明，
见 **[`androidapk/README.md`](./androidapk/README.md)**。

</details>

---

## 🚀 技术栈与致谢
| | |
|---|---|
| **引擎** | CesiumJS 1.118 |
| **架构** | 原生 ES Modules，零构建步骤 |
| **形态** | PWA（Service Worker + Manifest） |
| **AI 辅助** | DeepSeek、GitHub Copilot、Hunyuan |

**数据来源**：[Cesium ion](https://ion.cesium.com/) · [OpenStreetMap](https://www.openstreetmap.org/) · [Natural Earth](https://www.naturalearthdata.com/) · [天地图](https://www.tianditu.gov.cn/) · [腾讯地图](https://map.qq.com/)

**特别致谢**：腾讯街景借助社区维护的第三方查看器 [qq-map](https://qq-map.netlify.app/) 打开全景（非腾讯官方服务）。坐标转换见 [js/coord-transform.js](https://github.com/ZhuNemo/locus-earth/blob/main/js/coord-transform.js)（WGS-84 ↔ GCJ-02 双向）。

---

## 📝 API Key 注意事项
<details>
<summary><b>点开查看（Fork / 自部署必读）</b></summary>

项目内置的 Cesium、腾讯地图、天地图密钥**都设了域名白名单**，仅供本项目演示。

Fork 或部署到自己的域名 / 本地，请改 [js/config.js](https://github.com/ZhuNemo/locus-earth/blob/main/js/config.js)，换成自己申请的免费 Key，并在控制台设置自己的白名单。请勿盗刷他人额度，谢谢理解。

申请入口：
- [Cesium Ion Access Token](https://ion.cesium.com/tokens)
- [腾讯地图 API](https://lbs.qq.com/dev/console/application/mine)
- [天地图 API](https://cloudcenter.tianditu.gov.cn/center/development/myApp)

</details>

---

## 💡 项目信息
| | |
|---|---|
| **开始时间** | 2026-07-04 |
| **团队** | 个人项目，业余开发，不定期迭代 |
| **当前版本** | 7.2 |

---

<sub>© Zhu Nemo · [GitHub](https://github.com/ZhuNemo) · [Dev.to](https://dev.to/zhunemo)</sub>
