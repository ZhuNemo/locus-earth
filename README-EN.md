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

---

> A 3D Earth in the browser, built with Cesium. No installation or sign-up.
>
> **[GitHub Pages](https://zhunemo.github.io/locus-earth/)** · **[Cloudflare Pages](https://locus-earth.pages.dev)**

---

## Table of Contents
- [Project Introduction](#-project-introduction)
- [Key Features](#-key-features)
- [Interface Preview](#-interface-preview)
- [Usage](#-usage)
- [Settings & Customization](#-settings--customization)
- [Android Version (APK)](#-android-version-apk)
- [Tech Stack & Credits](#-tech-stack--credits)
- [API Key Notes](#-api-key-notes)
- [Project Info](#-project-info)

---

## 🌍 Project Introduction
**Locus Earth** is an open-source Web 3D Earth app whose interaction model follows Google Earth. It is written in native ES Modules with no build step, runs directly in the browser, and can be installed as a PWA on desktop or mobile.

All code is open source under the MIT license, and **both the web app and the Android shell live in this repository** (the shell is in [`androidapk/`](./androidapk/), see [Android Version](#-android-version-apk)). The web app needs no installation; the APK is just another way in, and you are free to build, modify, and redistribute it yourself.

Want to hack on it? The project is **build-free**; trade-offs, traps and troubleshooting are in [`docs/dev-notes.en.md`](./docs/dev-notes.en.md).

---

## ✨ Key Features

**Browsing**
- 3D terrain and global satellite imagery, with global 3D buildings (OpenStreetMap data).
- Base map switching: Sentinel-2, Blue Marble, Night Lights, Tianditu Satellite, Tencent Maps, and more.

**Tools**
- Distance and area measurement; both polylines and polygons are clamped to terrain.
- Markers and favorites, stored locally in the browser, with import/export.
- Place search: type a place name to jump to it.

**Regional Integration**
- Entering covered areas such as Denver, Washington D.C., or Sydney switches to high-precision city modeling automatically.
- Entering mainland China makes a "Street View" button appear in the toolbar; click the map to open a 360° panorama.

**Appearance & Interaction**
- Day/night lighting (sun and moon, with adjustable time) and a white building-model toggle; light/dark themes can follow the system.
- Compass, pitch reset, draggable floating toolbar; works on desktop and mobile.
- Google 3D mode: when Google is reachable, loads Google's 3D Tiles. That asset is a Cesium ion demo and may be rate-limited or taken down.

---

## 📱 Interface Preview
**Mobile:**
<img src="./screenshot-mobile.png" alt="screenshot-mobile">

**Desktop:**
<img src="./screenshot-desktop.png" alt="screenshot-desktop">

*Screenshots may not be up to date; visit the site for the current interface.*

---

## 🧭 Usage
- **Markers / Street View / Measurement are mutually exclusive**: only one can be active at a time; switching automatically closes the other to avoid click conflicts.
- Street View redirection needs a network connection and is unavailable when the PWA is offline.
- On mobile, the bottom tray expands by swiping up and collapses by tapping the handle.
- **Browser requirement**: a modern browser with WebGL 2 (any recent Chrome / Edge / Firefox / Safari).

---

## ⚙️ Settings & Customization
"Settings" in the toolbar opens `/settings.html`:

- **Appearance**: light/dark theme (follow system / manual)
- **Terrain & overlays**: 3D terrain toggle, road network and place-name overlays
- **Cache**: "Cache map tiles" switch (on by default), plus clearing app / tile / engine cache, favorites and settings
- **Compatibility check**: a WebGL 2 / module-loading / engine-init self-test on the current device

**Offline**: imagery tiles for areas you have visited are stored locally and stay viewable without a
network; terrain, 3D buildings and search still need a connection.

Cache layers, rendering trade-offs, engine compatibility and troubleshooting are documented in
**[`docs/dev-notes.en.md`](./docs/dev-notes.en.md)**.

---

## 📱 Android Version (APK)

This is not a native app: the web app is the product, and the Android version is just a native WebView
shell that puts the site full-screen in a window with no address bar — the content is still loaded live
from the web.

| | |
|---|---|
| **Get it** | Download the APK from [Releases](https://github.com/ZhuNemo/locus-earth/releases), or build it yourself |
| **Package / requirement** | `dev.locusearth.app` · Android 7.0 (API 24) or newer |
| **What the shell does** | Full-screen, no address bar · keeps allow-listed domains in-app · sends other links to the system browser · explains "this is a web app" on first launch |
| **Source** | [`androidapk/`](./androidapk/) (standalone Gradle project, MIT licensed like the main project) |

**No APK reinstall is needed when the web app updates.** The shell contains no business logic,
so a web change reaches every installed user immediately. A rebuild is only required for shell-side
things: icons, allow-listed domains, package name.

<details>
<summary><b>Click to view: build it yourself / signing notes</b></summary>

Three options:

| Option | How |
|---|---|
| GitHub Actions (recommended) | Repo `Actions` → `Build Android APK` → `Run workflow`; or push a `v*` tag. Artifacts appear under the run |
| Command line | `cd androidapk && ./gradlew :app:assembleRelease` (use `gradlew.bat` on Windows) |
| Android Studio | Open the **`androidapk/`** directory (not the repo root) → `Build → Build APK(s)` |

Signing is optional: with keystore secrets configured, CI produces a properly signed build;
**without them the build still succeeds** (it falls back to the debug signature — installable and
runnable, but not publishable). After forking, generate your own keystore as described in section 6 of
[`androidapk/README.md`](./androidapk/README.md) and **never reuse someone else's key**.

You must allow "install from unknown sources" in system settings. Builds signed with your own key
must be updated with **the same key**, or the system will refuse the upgrade.

Full instructions on building, signing, replacing icons, adding allow-listed domains, and excluding
the shell from Cloudflare Pages deployments are in
**[`androidapk/README.md`](./androidapk/README.md)** (written in Chinese).

</details>

---

## 🚀 Tech Stack & Credits
| | |
|---|---|
| **Engine** | CesiumJS 1.118.2 |
| **Architecture** | Native ES Modules, zero build step |
| **Type** | PWA (Service Worker + Manifest) |
| **AI Assistance** | DeepSeek, GitHub Copilot, Hunyuan |

**Data Sources**: [Cesium ion](https://ion.cesium.com/) · [OpenStreetMap](https://www.openstreetmap.org/) · [Natural Earth](https://www.naturalearthdata.com/) · [Tianditu](https://www.tianditu.gov.cn/) · [Tencent Maps](https://map.qq.com/)

**Special Thanks**: Tencent Street View uses the community-maintained third-party viewer [qq-map](https://qq-map.netlify.app/) to open panoramas (not an official Tencent service). For coordinate conversion, see [js/coord-transform.js](https://github.com/ZhuNemo/locus-earth/blob/main/js/coord-transform.js) (bidirectional WGS-84 ↔ GCJ-02).

---

## 📝 API Key Notes
<details>
<summary><b>Click to view (required reading for forks / self-hosting)</b></summary>

The built-in Cesium, Tencent Maps, and Tianditu keys **all have domain whitelists** and are for this project's demo only.

If you fork or deploy to your own domain / locally, edit [js/config.js](https://github.com/ZhuNemo/locus-earth/blob/main/js/config.js), replace them with your own free keys, and set your own whitelist in the console. Please don't use someone else's key and consume their quota.

Application Links:
- [Cesium Ion Access Token](https://ion.cesium.com/tokens)
- [Tencent Maps API](https://lbs.qq.com/dev/console/application/mine)
- [Tianditu API](https://cloudcenter.tianditu.gov.cn/center/development/myApp)

</details>

---

## 💡 Project Info
| | |
|---|---|
| **Start Date** | 2026-07-04 |
| **Maintenance** | Personal project, built in spare time, updated irregularly |
| **Current Version** | 7.3.1 |

---

<sub>© Zhu Nemo · [GitHub](https://github.com/ZhuNemo) · [Dev.to](https://dev.to/zhunemo)</sub>
