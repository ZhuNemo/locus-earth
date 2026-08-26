# Locus Earth
<div align="left">
  🌐 语言 / Language: 
  <a>简体中文</a> | <a href="README-EN.md">English</a>
</div>

---
<div align="left">
<a href="https://github.com/ZhuNemo/locus-earth/blob/main/LICENSE"><img src="https://img.shields.io/badge/License-MIT-yellow" alt="License: MIT"></a>
</div>

---

**Locus Earth - 基于 Cesium 的 Web 端 3D 全球地图应用**

Locus Earth 是一个轻量、快速且高交互性的开源 3D 地球项目。灵感源自 Google Earth，旨在提供一个无需安装、开箱即用的全球地图浏览体验。

🛰️ **访问地址**
您可以通过以下任意地址访问项目：
- [GitHub Pages](https://zhunemo.github.io/locus-earth/)
- [Cloudflare Pages](https://locus-earth.pages.dev)

✨ **核心功能**
- **3D 地形与卫星影像**：基于 Cesium 的高精度地形与来自各个提供商的卫星影像。
- **全球建筑**：支持加载全球 OpenStreetMap 3D 建筑。
- **高精度建模联动**：进入丹佛、华盛顿 D.C.、悉尼等指定区域时，自动开启高精度城市模型切换。
- **标记与收藏夹**：支持本地/浏览器缓存保存、导入、导出收藏标记点。
- **谷歌 3D 地球模式**：网络条件允许的情况下一键切换到谷歌 3D 地球，浏览与原版类似但运行大幅轻量化的3D城市。
- **动态设置面板**：支持主题切换（跟随系统/手动深色/浅色）以及**地形开关**。用户可关闭地形以大幅提升弱网设备的加载速度并节省流量。
- **交互优化**：包含太阳光影开关、建筑开关、指南针、重置视角等一键快捷操作；已适配移动端触屏操作。

⚙️ **设置与自定义**
您可以通过点击右上角菜单中按钮进入 `/settings/` 页面，自定义明暗主题、地形加载策略等。

🤖 **技术栈与致谢**
本项目由人工智能辅助构建。参与构建的模型（按优先级排序）：DeepSeek、VS Code Copilot、Doubao、ChatGPT、Google Gemini。

📝 **注意事项**
> *注意：项目内 Cesium Ion 的 Access Token 已设置域名白名单，仅供演示使用。如果您要基于本仓库进行二次修改和构建或意图本地深度使用，请克隆仓库并前往 [Cesium Ion](https://ion.cesium.com/) 使用GitHub注册免费账号，将原访问令牌替换为您自己的 Access Token。请务必遵守 Cesium 用户公约，切勿盗刷他人账号，谢谢理解。*

ℹ️ **项目信息**
- 个人项目开启时间：2026-07-04
- 无团队，业余开发，不定期迭代。