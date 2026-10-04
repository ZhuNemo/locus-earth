# Locus Earth
<div align="left">
  🌐 Language / 语言: 
  <a href="README.md">简体中文</a> | <a>English</a>
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

**Mobile Screenshot:**
<img src="./screenshot-mobile.png" alt="screenshot-mobile">

**Desktop Screenshot:**
<img src="./screenshot-desktop.png" alt="screenshot-desktop">

*P.S.* Screenshots may not be updated in real time. For the latest interface preview, please visit the website!

---

**Locus Earth - A Cesium-based Web 3D Global Map Application**

Locus Earth is a lightweight, fast, and highly interactive open-source 3D Earth project. Inspired by Google Earth, it aims to provide a global map browsing experience that requires no installation and works out of the box.

🛰️ **Access URLs**
You can access the project via any of the following addresses:
- [GitHub Pages](https://zhunemo.github.io/locus-earth/)
- [Cloudflare Pages](https://locus-earth.pages.dev)

✨ **Core Features**
- **3D Terrain and Satellite Imagery**: Cesium-based high-precision terrain and global satellite imagery from various providers.
- **Global Buildings**: Supports loading global OpenStreetMap 3D buildings.
- **High-precision Modeling Integration**: Automatically enables high-precision city model switching when entering designated areas such as Denver, Washington D.C., Sydney, etc.
- **Markers and Favorites**: Supports local/browser cache saving, importing, and exporting favorite markers.
- **Google 3D Earth Mode**: When network conditions permit, switch to Google 3D Earth with one click to browse 3D cities similar to the original but significantly more lightweight.
- **Dynamic Settings Panel**: Supports theme switching (follow system/manual dark/manual light) and **terrain toggle**, etc.
- **Interaction Optimization**: Built-in place search; includes quick operations such as real lighting toggle, building white-model toggle, compass, restore pitch angle, etc.; fully adapted floating UI for both mobile and desktop.

⚙️ **Settings and Customization**
- You can enter the `/settings/` page by clicking the button in the menu to customize light/dark themes, terrain loading strategy, etc.

🤖 **Tech Stack and Acknowledgments**
- This project was built with AI assistance. AI products involved in construction (in order of priority): DeepSeek, GitHub Copilot, Hunyuan.

📝 **Notes on API Keys**
- The Cesium, Tencent Maps, and Tianditu keys in the project have domain whitelists configured (only allowed for use under specified domains) and are for this project's demonstration only.
- If you want to fork this repository and deploy it to your own domain or use it locally, please directly modify the [js/config.js](https://github.com/ZhuNemo/locus-earth/blob/main/js/config.js) file, replace the keys with your own free keys, and be sure to set your own whitelist in the console to avoid affecting normal use. Please do not abuse others' account quotas. Thank you for your understanding!
- Cesium Ion Access Token, [Application link](https://ion.cesium.com/tokens)
- Tencent Maps API, [Application link](https://lbs.qq.com/dev/console/application/mine)
- Tianditu API, [Application link](https://cloudcenter.tianditu.gov.cn/center/development/myApp)


ℹ️ **Project Information**
- Personal project start date: 2026-07-04
- No team; developed in spare time; iterated irregularly.