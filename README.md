# Locus Earth
<div align="left">
  🌐 语言 / Language: 
  <a>简体中文</a> | <a href="README-EN.md">English</a>
</div>

---
<div align="left">
  <img src="./android-chrome-192x192.png" alt="Locus Earth Logo" width="50" height="50">
  
  <img src="./locus-earth-logo.svg" alt="Locus Earth Text Logo" width="220">
</div>

---
<div align="left">
<a href="https://github.com/ZhuNemo/locus-earth/blob/main/LICENSE"><img src="https://img.shields.io/badge/License-MIT-yellow" alt="License: MIT"></a>
</div>

**移动端截图：**
<img src="./screenshot-mobile.png" alt="screenshot-mobile">

**桌面端截图：**
<img src="./screenshot-desktop.png" alt="screenshot-desktop">

*P.S.*截图不一定实时更新，预览最新界面请访问网页！

---

**Locus Earth - 基于 Cesium 的 Web 端 3D 全球地图应用**

Locus Earth 是一个轻量、快速且高交互性的开源 3D 地球项目。灵感源自 Google Earth，旨在提供一个无需安装、开箱即用的全球地图浏览体验。

🛰️ **访问地址**
您可以通过以下任意地址访问项目：
- [GitHub Pages](https://zhunemo.github.io/locus-earth/)
- [Cloudflare Pages](https://locus-earth.pages.dev)

✨ **核心功能**
- **3D 地形与卫星影像**：基于 Cesium 的高精度地形与来自各个提供商的全球卫星影像。
- **全球建筑**：支持加载全球 OpenStreetMap 3D 建筑。
- **高精度建模联动**：进入丹佛、华盛顿 D.C.、悉尼等指定区域时，自动开启高精度城市模型切换。
- **标记与收藏夹**：支持本地/浏览器缓存保存、导入、导出收藏标记点。
- **谷歌 3D 地球模式**：网络条件允许的情况下一键切换到谷歌 3D 地球，浏览与原版类似但运行大幅轻量化的3D城市。
- **动态设置面板**：支持主题切换（跟随系统/手动深色/浅色）以及**地形开关**等。
- **交互优化**：内置地点搜索；包含真实光照开关、建筑白模开关、指南针、回复俯仰角等快捷操作；已全面适配移动端与桌面端的悬浮式 UI。

⚙️ **设置与自定义**
- 您可以通过点击菜单中按钮进入 `/settings/` 页面，自定义明暗主题、地形加载策略等。

🤖 **技术栈与致谢**
- 本项目由人工智能辅助构建。参与构建的AI产品（按优先级排序）：DeepSeek、GitHub Copilot、Hunyuan。

📝 **API Key相关注意事项**
- 项目内的 Cesium、腾讯地图、天地图密钥均已设置了域名白名单（仅允许在指定域名下使用），仅供本项目演示。
- 如果您欲 Fork 本仓库并部署到自己的域名或本地使用，请直接修改 [js/config.js](https://github.com/ZhuNemo/locus-earth/blob/main/js/config.js) 文件，替换为您自己申请的免费密钥，并务必在控制台设置您自己的白名单，以免影响正常使用。请勿盗刷他人账号额度，谢谢理解！
- Cesium Ion Access Token，[申请入口](https://ion.cesium.com/tokens)
- 腾讯地图API，[申请入口](https://lbs.qq.com/dev/console/application/mine)
- 天地图API，[申请入口](https://cloudcenter.tianditu.gov.cn/center/development/myApp)


ℹ️ **项目信息**
- 个人项目开启时间：2026-07-04
- 无团队，业余开发，不定期迭代。