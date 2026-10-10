# Locus Earth
<div align="left">
🌐 Language:
<a href="README.md">Simplified Chinese</a> | <a>English</a>
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

## 📱 Interface Preview
**Mobile screenshot:**
<img src="./screenshot-mobile.png" alt="screenshot-mobile">

**Desktop screenshot:**
<img src="./screenshot-desktop.png" alt="screenshot-desktop">

*P.S. Screenshots may not be updated in real time. To preview the latest interface, please visit the website!*

---

## 🌍 Project Introduction
**Locus Earth - A Cesium-based Web 3D Global Map Application**

Locus Earth is a lightweight, fast, and highly interactive open-source 3D Earth project. Inspired by Google Earth, it aims to provide a global map browsing experience that requires no installation and works out of the box.

## 🔗 Access URLs
You can access the project via any of the following URLs:
- [GitHub Pages](https://zhunemo.github.io/locus-earth/)
- [Cloudflare Pages](https://locus-earth.pages.dev)

## ✨ Core Features
- **3D Terrain and Satellite Imagery**: High-precision terrain based on Cesium and global satellite imagery from various providers.
- **Multi-Basemap Selector**: The right-side control column allows one-click switching between basemaps such as Sentinel-2, Blue Marble, Earth at Night, Tencent Maps, Tianditu Satellite, etc.
- **Global Buildings**: Supports loading global OpenStreetMap 3D buildings.
- **High-Precision Modeling Integration**: When entering designated areas such as Denver, Washington D.C., Sydney, etc., high-precision city model switching is automatically enabled.
- **Street View**: When entering mainland China, a “Street View” button automatically appears in the toolbar. Click any location on the map to jump to a 360° panorama of that place (automatically matching the nearest Street View scene point; built-in automatic WGS-84 → GCJ-02 “Mars coordinates” correction). Before jumping, it first checks whether Street View coverage exists at that location; if not, it only shows a prompt and does not jump.
- **Markers and Favorites**: Supports saving, importing, and exporting favorite markers locally/in browser cache.
- **Measurement Tools**: Supports distance and area measurement; polylines and polygons are both rendered draped over terrain; the toolbar can be freely dragged via the floating round button.
- **Place Search**: Built-in search box; enter a place name to locate it.
- **Google 3D Earth Mode**: When network conditions permit, switch to Google 3D Earth with one click and browse 3D cities similar to the original but with significantly lighter operation.
- **Dynamic Settings Panel**: Supports theme switching (follow system/manual dark/light) and **terrain toggle, etc.**
- **Interaction Optimizations**: Includes quick actions such as real lighting toggle, building white-model toggle, compass, restore pitch angle, etc., and is fully adapted to floating UI on both mobile and desktop.

## 🧭 Usage Notes
- **Markers / Street View / Measurement are mutually exclusive**: Only one can be active at a time; enabling one automatically disables the other to avoid click conflicts.
- Street View navigation depends on the network and is unavailable when the PWA is offline.

## ⚙️ Settings and Customization
- You can click the button in the menu to enter the `/settings/` page and customize the light/dark theme, terrain loading strategy, etc.

## 🚀 Tech Stack and Acknowledgments
- This project was built with AI assistance. AI products involved in its construction (in priority order): DeepSeek, Github Copilot, Hunyuan.
- Tech stack: CesiumJS 1.118, native ES Modules (no build step), PWA (Service Worker + Manifest).
- Data sources: [Cesium ion](https://ion.cesium.com/), [OpenStreetMap](https://www.openstreetmap.org/), [Natural Earth](https://www.naturalearthdata.com/), [Tianditu](https://www.tianditu.gov.cn/), [Tencent Maps](https://map.qq.com/).
- The Street View feature uses the community-maintained third-party viewer [qq-map](https://qq-map.netlify.app/) to open panoramas (not an official Tencent service). Special thanks.
- For coordinate system handling, see [js/coord-transform.js](https://github.com/ZhuNemo/locus-earth/blob/main/js/coord-transform.js) (bidirectional conversion between WGS-84 ↔ GCJ-02).

## 📝 Notes on API Keys
- The Cesium, Tencent Maps, and Tianditu keys in this project all have domain whitelists set (only allowed under specified domains) and are for demonstration purposes only.
- If you want to fork this repository and deploy it to your own domain or use it locally, please directly modify [js/config.js](https://github.com/ZhuNemo/locus-earth/blob/main/js/config.js) and replace it with free keys you applied for. Be sure to set your own whitelist in the console to avoid affecting normal use. Please do not abuse other people's account quotas. Thank you for your understanding!
  - Cesium Ion Access Token, [apply here](https://ion.cesium.com/tokens)
  - Tencent Maps API, [apply here](https://lbs.qq.com/dev/console/application/mine)
  - Tianditu API, [apply here](https://cloudcenter.tianditu.gov.cn/center/development/myApp)

## 💡 Project Information
- Personal project start date: 2026-07-04
- No team; developed in spare time; iterated irregularly.