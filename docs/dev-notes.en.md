# Locus Earth — Developer Notes

> For people changing this repository. The README answers "how do I use it"; this file records
> implementation trade-offs, the traps we hit, and how to diagnose problems in the wild.
>
> To run it: there is no `package.json` and no build step — serve the repository root with any
> static file server.

## Contents

- Engine entry & module resolution
- Caching & offline
- Rendering & performance
- Engine compatibility
- Repository conventions
- Diagnosing production issues
- Looks like a bug, isn't

---

## Engine entry & module resolution

Every module imports the engine the same way:

```js
import { Viewer, Cartesian3 } from './cesium.js';
```

`js/cesium.js` is one line:

```js
export * from 'https://unpkg.com/cesium@1.118.2/Build/Cesium/index.js';
```

**Why not import maps.** Earlier versions used `<script type="importmap">` to map the bare specifier
`cesium` to unpkg, and every module wrote `from 'cesium'`. That works in desktop Chrome / Edge, but
**breaks entirely on Huawei's engine family**: it does not actually resolve import maps, yet
`HTMLScriptElement.supports('importmap')` still returns `true` (false promise). So
`import ... from 'cesium'` throws `Failed to resolve module specifier`; `main.js` is the entry of the
module graph, so every module in the graph fails with it and the page stays on the loading overlay
forever. Diagnosed 2026-10-21 on Chromium 132 / HarmonyOS (the built-in browser and the WebView used by
the Android shell run the same engine).

Relative-specifier resolution is something every ESM engine must support, so the fix is the single
`export *` re-export above: no import map involved, and the engine URL still lives in exactly one place.

**Do not write the bare specifier `'cesium'` in new code.** The import map left in `index.html` /
`settings.html` has one remaining purpose: right after a deploy, Cache Storage may still hold the
previous build's modules (which contain bare specifiers), so keeping it avoids a second outage.

**Upgrading the engine touches three places** (they must use the same patch version): the URL in
`js/cesium.js`, the `modulepreload` in `index.html`, and `CESIUM_VERSION` in `sw.js`. Using `@1.118`
gets 302-redirected to `1.118.2` by unpkg, which breaks the modulepreload key — you then download 4 MB
for nothing.

---

## Caching & offline

Everything is handled by [`sw.js`](../sw.js), in five layers:

| Layer | Cache name | Strategy |
|---|---|---|
| App shell (HTML / CSS / JS / icons) | `locus-earth-app-cache-<version>` | Cache-first + background revalidate; repeat visits paint in tens of ms |
| Cesium engine | `locus-earth-cesium-<engine version>` | Cache-first, dropped as a whole when the engine is upgraded |
| ion asset endpoint (`/v1/assets/<id>/endpoint`) | same as engine | Cache-first for 45 minutes + background refresh, network-first after that with stale fallback |
| Basemap tiles | `locus-earth-tiles-v1` | Cache-first and **never revalidated on a hit**; FIFO-trimmed past 2400 tiles |
| Switch state | `locus-earth-flags-v1` | A few dozen bytes holding the on/off flag |

Traps worth remembering:

1. **The ion endpoint is a prerequisite for offline.** Without it Cesium cannot build the imagery
   layer — cached tiles still render black. So on network failure it must fall back to the stale copy
   (an `x-locus-cached-at` timestamp decides whether it is too old).
2. **A Service Worker does intercept XHR.** The common claim that it cannot is a myth — WebSocket and
   EventSource are the ones that slip through. In Chromium / Android WebView, plain XHR responses land
   in Cache Storage just like fetches. An earlier version rerouted
   `Resource._Implementations.loadWithXhr` on the wrong premise; that wrapper was removed — it only
   added upgrade risk and forced the on/off switch to be duplicated on both sides, which is exactly why
   "turn caching off" still kept caching.
3. **Tile requests use `cache: 'no-store'`.** Otherwise every tile is stored twice, and the HTTP-cache
   copy is invisible and unremovable from web content — which is why "clear tile cache" appears to free
   nothing.
4. **The switch is enforced by the SW, not the page.** A worker cannot read localStorage, so the page
   posts the state over and the SW persists it to `locus-earth-flags-v1` (workers get killed and
   restarted, so it has to be durable). Turning it off passes tile requests straight through — no cache
   read, no cache write, no HTTP cache.
5. **Navigation is cache-first + background update** (SWR). The cost: after changing the HTML, the
   first visit still gets the old version and the second one updates. To see a new build immediately,
   use "Clear app cache" in settings.

---

## Rendering & performance

The 3D scene turns off WebGL's built-in MSAA and uses FXAA post-processing instead.

MSAA is expensive on mobile: on devices without hardware MSAA, Chromium may fall back to software MSAA
(multiple samples per pixel, a clear hit to fill rate), and devices that do support it still pay extra
bandwidth and VRAM. FXAA is a single full-screen pass and costs no extra VRAM.

Both switches are in `js/viewer.js` (`contextOptions.webgl.antialias` and
`scene.postProcessStages.fxaa.enabled`). On a low-end device, set the FXAA line to `false` — nothing else
depends on it. **Do not switch back to the default MSAA.**

Cold-start cost is dominated by the ~4 MB Cesium ESM bundle (download + parse). All the web layer can do
is: pin the patch version (saves a 302), preload with `modulepreload`, and let navigation and the
endpoint be served from cache.

---

## Engine compatibility

- **WebGL 2 is required**: Cesium has only supported WebGL 2 since 1.102. Devices that cannot create a
  WebGL 2 context cannot render the globe, and there is no graceful fallback (it would mean downgrading
  the engine to 1.101, which is not a small change).
- **Huawei's engine family** has two quirks: import maps are a false promise (above), and
  `MAX_TEXTURE_SIZE` may be only 4096 — watch texture sizes on very high-DPI screens.
- **The WebView inside the Android shell and the browser on the same phone are two separate engine
  instances.** Chrome / Edge working on a device does not mean the WebView works; test both sides
  separately.

---

## Repository conventions

- **Build-free**: no `package.json`, no Vite / Webpack / Rollup; the browser runs the source ESM
  directly. There is no `build.target` to set, and pulling in a bundler just to transpile is not wanted.
- **Changing `sw.js` requires bumping `CACHE_VERSION`**, otherwise the new worker skips `install` and
  the new files in `SHELL_URLS` never enter the cache. **Check the remote before picking a number**
  (we have had collisions).
- **When changing a file referenced by the first screen, update `SHELL_URLS` too** — one missing entry
  breaks offline at the first request.
- Keep the third-party URLs identical across the landing page and the settings page (`widgets.css`,
  `modulepreload`, import map).
- Building the APK goes through GitHub Actions (`.github/workflows/android.yml`); do not set up an
  Android toolchain on the dev machine.

---

## Diagnosing production issues

**1. The "Compatibility check" in settings** (the only place that can run script inside the shell)

Settings → scroll to the bottom → Start. It walks the same order the landing page boots in:
WebGL 2 → ES Module → Cesium entry → Viewer init, and the first red line is the culprit. The shell has
no address bar and no reachable debugger, so this is the fastest way to get data off a real device.

**2. A LAN mirror of the page** (works in any mobile browser / WebView)

Save a copy of `index.html` and inject a plain script right after `<body>` that:

- prints the UA, `isSecureContext`, SW and `caches` support
- listens to `error` (capture) and `unhandledrejection`
- snapshots `#loadingOverlay`'s `opacity/display` and whether `#cesiumContainer canvas` exists
- probes each module with `import()`, reporting OK or the failure reason

Give the panel a `z-index` above the loading overlay (`9999`), serve the folder with
`python -m http.server`, and open `http://<your-ip>:<port>/file.html` on the phone.

A bonus of LAN http: **it is not a secure context, so the SW cannot register**, which makes the mirror a
natural control group — same code, no service worker. That splits "JS / engine problem" from
"SW / cache problem".

**3. Debugging limits of the Android shell**

Release builds do not expose WebView debugging (`WebView.setWebContentsDebuggingEnabled` is only called
under `BuildConfig.DEBUG`), so `edge://inspect` shows nothing. Getting a debugger attached means adding a
Gradle-property switch to the release pipeline, or shipping a debug build (different signature — you have
to uninstall first, which wipes the cache).

---

## Looks like a bug, isn't

- **Storage usage does not drop after "Clear tile cache"**: `navigator.storage.estimate()` is computed
  lazily; it may not drop immediately and can even go up. Judge by the number of entries in `caches`,
  not by that figure.
- **The first visit after an HTML change still shows the old version**: navigation is cache-first +
  background update; the second visit updates. Expected.
- **Only imagery works offline**: what is cached is the imagery tiles of areas you have visited;
  terrain, 3D buildings and search still need a connection.
- **Occasional English labels in the Chinese UI**: usually Cesium's own widgets, which are not wired to
  the app's i18n — not a missed translation.
