# Locus Earth
<div align="left">
  🌐 语言 / Language: 
  <a href="README.md">简体中文</a> | <a>English</a>
</div>

---

<div align="left">
<a href="https://github.com/ZhuNemo/locus-earth/blob/main/LICENSE"><img src="https://img.shields.io/badge/License-MIT-yellow" alt="License: MIT"></a>
</div>

---

**Locus Earth - A Web-based 3D Global Map Application powered by Cesium**

Locus Earth is a relatively lightweight, fast, and highly interactive open-source 3D Earth project. Inspired by Google Earth, it aims to provide a global map browsing experience that requires no installation and works out of the box.

🛰️ **Access**
You can access the project via any of the following links:
- [GitHub Pages](https://zhunemo.github.io/locus-earth/)
- [Cloudflare Pages](https://locus-earth.pages.dev)

✨ **Key Features**
- **3D Terrain & Satellite Imagery**: High-precision terrain based on Cesium and global satellite imagery from various providers.
- **Global Buildings**: Supports loading global OpenStreetMap 3D buildings.
- **High-Definition City Models**: Automatically activates precision city models when entering designated areas (e.g., Denver, Washington D.C., Sydney).
- **Bookmarks & Markers**: Save, import, and export your favorite markers using browser local storage.
- **Google 3D Earth Mode**: Switch to Google 3D Earth with one click when network conditions allow, exploring 3D cities that are similar to the original but significantly more lightweight.
- **Dynamic Settings Panel**: Supports theme switching (Follow System / Manual Dark / Light) as well as a **Terrain Toggle**. Users can disable terrain to significantly boost loading speed and save data on low-end devices.
- **Interaction Optimizations**: Includes one-click shortcuts such as Solar Lighting toggle, building toggle, compass, and reset view; fully adapted for mobile touch screens.

⚙️ **Settings & Customization**
- You can enter the `/settings/` page via the top right menu button to customize the theme and terrain loading strategies.

🤖 **Tech Stack & Credits**
- This project was assisted by Artificial Intelligence. Models involved in the build (in priority order): DeepSeek, VS Code Copilot, Doubao, ChatGPT, Google Gemini.

📝 **Important Notes on API Keys**
- The Cesium, Tencent Maps, and Tianditu keys in the project have all been configured with domain whitelists (only allowed for use on designated domains), and are solely for this project's demonstration.
- If you wish to fork this repository and deploy it to your own domain or use it locally, please directly modify the [js/config.js](https://github.com/ZhuNemo/locus-earth/blob/main/js/config.js) file to replace them with your own free keys (application links are attached in the file), and be sure to set your own whitelist in the console to avoid affecting normal use. Please do not misuse others' account quotas, thank you for your understanding!

ℹ️ **Project Info**
- Personal project started: 2026-07-04
- No team, hobby development, irregular iterations.