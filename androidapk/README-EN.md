# Locus Earth · Android Shell
<div align="left">
🌐 语言 / Language:
<a href="README.md">简体中文</a> | <a>English</a>
</div>

An Android project that wraps the web version of **[Locus Earth](https://locus-earth.pages.dev)** in a native WebView shell.

**The core idea: the shell contains no business logic.** It solves exactly four things — full screen with
no address bar, two domains kept inside the shell, every other link either allowed through or handed off to
the outside, and a one-time first-launch notice that "this is a web app".
Because the page content is loaded live from the web, **the phone does not need a new APK when the website
updates**.

- Disclosure: this document contains AI-generated content.

```
App name      Locus Earth
Package       dev.locusearth.app
minSdk        24 (Android 7.0)      targetSdk / compileSdk  34
Language      Kotlin / Gradle Kotlin DSL
Toolchain     AGP 8.6.1 · Gradle 8.9 · Kotlin 1.9.24 · JDK 17
License       MIT (same as the main project)
```

> ⚠️ **This is a standalone project**; it is not part of the web project at the repository root.
> In Android Studio you open the `androidapk/` directory — **not the repository root**.
> The repository root has no `gradlew` / `settings.gradle.kts` / `build.gradle.kts`, and does not need them.

---

## Contents

- [1. What this is (and why it exists)](#1-what-this-is-and-why-it-exists)
- [2. Getting it](#2-getting-it)
- [3. Fastest path: build an APK in Android Studio](#3-fastest-path-build-an-apk-in-android-studio)
- [4. Command-line build](#4-command-line-build)
- [5. Building with GitHub Actions (recommended)](#5-building-with-github-actions-recommended)
- [6. Signing and keys](#6-signing-and-keys)
- [7. Environment requirements](#7-environment-requirements)
- [8. App and dependency information](#8-app-and-dependency-information)
- [9. Domain allow-list](#9-domain-allow-list)
- [10. Replacing the app icon](#10-replacing-the-app-icon)
- [11. First-launch notice ("this is a web app")](#11-first-launch-notice-this-is-a-web-app)
- [12. How the web app detects the shell](#12-how-the-web-app-detects-the-shell)
- [13. Cloudflare Pages deployment exclusion (important)](#13-cloudflare-pages-deployment-exclusion-important)
- [14. Favorites import / export (across web and shell)](#14-favorites-import--export-across-web-and-shell)
- [15. Design notes and known differences](#15-design-notes-and-known-differences)
- [16. Known limitations and TODO](#16-known-limitations-and-todo)
- [17. Directory structure](#17-directory-structure)
- [18. Self-check list](#18-self-check-list)
- [Appendix: current state of the build environment](#appendix-current-state-of-the-build-environment)

---

## 1. What this is (and why it exists)

Locus Earth itself is a **pure front-end web app** (a Cesium-driven 3D Earth): open it in a browser and it
works, and it can be installed to the desktop as a PWA. So why an Android shell at all?

Because a PWA on Android has three experience gaps that cannot be avoided, and this shell covers exactly
those three:

| Gap | What the shell does |
|---|---|
| After launching from the home-screen icon you still see the browser address bar | Full-screen WebView, no address bar, no tabs |
| Street View lives on a third-party domain, so in a PWA it jumps out to the browser | Allow-listed domains open inside the shell, and the back key returns to the globe |
| Users assume it is a native app, and develop wrong expectations about "white screen with no network" and "updates don't need a reinstall" | A one-time bilingual notice on first launch (section 11) |

**So the value of this shell is not "features" but "boundaries"**: it knows exactly what it should *not*
do. The moment you start moving business logic into the shell, the web app and the app become two codebases
that must each be maintained — and "change the website, no APK reinstall" is lost at the same time.

---

## 2. Getting it

### End users

Download the latest APK from [GitHub Releases](https://github.com/ZhuNemo/locus-earth/releases) and install it
(if there is no release yet, build one yourself as in section 5, or build locally as in sections 3 and 4).

> Installing Android apps requires allowing "install from unknown sources" in system settings.
> The signing key is not distributed with the repository; see [section 6](#6-signing-and-keys).

### Developers

**The Android project source is open-sourced with this repository**, under `androidapk/`, licensed the same
way as the main project (MIT). You may read it, modify it and repackage it directly — changing the icon,
adding allow-listed domains or rewording the notice requires no changes to the web code.

---

## 3. Fastest path: build an APK in Android Studio

1. **Open the project**: Android Studio → `File → Open` → select the **`androidapk/`** directory → trust it,
   then wait for the Gradle sync to finish.
   (Select `androidapk` only, not the repository root, or the whole web project will be parsed as an Android
   project.)
2. **Plug in a phone / start an emulator**, then hit the green ▶ in the toolbar to run it on the device.
3. **Produce an APK**: menu `Build → Build App Bundle(s) / APK(s) → Build APK(s)`.
   A notification pops up in the bottom-right when it finishes; click `locate` to open the output directory:

   ```
   androidapk/app/build/outputs/apk/debug/app-debug.apk      ← debug build, installable as-is
   androidapk/app/build/outputs/apk/release/app-release.apk  ← release build (signing, see section 6)
   ```

   For a release build: `Build → Generate Signed App Bundle / APK…`, or use the command line in section 4.

> The first sync downloads Gradle 8.9 and the AGP dependencies, which can be slow on networks in mainland
> China; see the mirror configuration in [section 7](#7-environment-requirements).

---

## 4. Command-line build

```bash
cd androidapk

# Windows
gradlew.bat :app:assembleDebug
gradlew.bat :app:assembleRelease

# macOS / Linux / Git Bash
./gradlew :app:assembleDebug
./gradlew :app:assembleRelease
```

> On Windows, running `./gradlew` from Git Bash sometimes fails because the executable bit was not
> preserved; use `gradlew.bat` or `sh gradlew` instead.

Install onto a device:

```bash
adb install -r app/build/outputs/apk/debug/app-debug.apk
```

---

## 5. Building with GitHub Actions (recommended)

`.github/workflows/android.yml` at the repository root is already configured, so **no Android toolchain
needs to be installed locally**:

| Trigger | How |
|---|---|
| Manual | Repository `Actions` → `Build Android APK` → `Run workflow` |
| Tag push | `git tag v1.0 && git push origin v1.0` |

Build artifacts appear under the workflow run's Artifacts (`locus-earth-android-release`, kept for 30 days).
CI pins **temurin JDK 17** via `actions/setup-java`, matching what the project declares.

**Signing is optional**: add four secrets under the repository's
`Settings → Secrets and variables → Actions`. With them configured you get a properly signed release;
**without them the build still succeeds** (it falls back to the debug signature — installable and runnable,
just not publishable).

| Secret | Content |
|---|---|
| `ANDROID_KEYSTORE_BASE64` | Base64 of the `.jks` file (Git Bash: `base64 -w0 release.jks > ks.txt`) |
| `ANDROID_KEYSTORE_PASSWORD` | keystore password |
| `ANDROID_KEY_ALIAS` | key alias |
| `ANDROID_KEY_PASSWORD` | key password |

---

## 6. Signing and keys

### 1. Generate a keystore

```bash
keytool -genkeypair -v \
  -keystore release.jks \
  -alias locus-earth \
  -keyalg RSA -keysize 2048 -validity 10950 \
  -storetype JKS
```

> The validity is 10950 days (30 years). **Google Play requires key validity of at least 2033**, so do not
> use the default of 90 days. Generating it inside `androidapk/` is fine — it is already covered by
> `.gitignore`.

You can also just use Android Studio: `Build → Generate Signed App Bundle / APK… → Create new…`.

### 2. Configure signing

```bash
cd androidapk
cp keystore.properties.example keystore.properties
# then replace the values with your own
```

```properties
storeFile=release.jks
storePassword=the password you set
keyAlias=locus-earth
keyPassword=the password you set
```

`storeFile` accepts two forms:

| Form | Resolution order |
|---|---|
| `release.jks` (relative) | look for `androidapk/app/release.jks` first, then `androidapk/release.jks` |
| `C:/keys/locusearth.jks` (absolute) | used directly |

### 3. Automatic fallback when missing

The decision logic in `app/build.gradle.kts`:

| keystore.properties | file pointed to by storeFile | Result |
|---|---|---|
| absent | — | `assembleRelease` packages with the **debug signature** (runnable, not publishable) |
| present | absent | same as above |
| present | present | uses the release signature |

That is why CI does not fail without keys — and why section 5 can simply say "sign if keys exist, otherwise
use debug".

> ⚠️ **Never commit `keystore.properties` or `*.jks`.** `.gitignore` already blocks them, but if you ever
> `git add -f` them by hand the key stays in the git history forever — that kind of accident can only be
> fixed by rotating the key and starting over.

---

## 7. Environment requirements

| Item | Requirement | Notes |
|---|---|---|
| JDK | **17** | Hard requirement of AGP 8.x. The JBR bundled with Android Studio usually satisfies it |
| Android SDK | Platform **34** + Build-Tools 34.x | Install via SDK Manager |
| Gradle | 8.9 (the wrapper is included; nothing to install) | `gradle/wrapper/` already contains `gradle-wrapper.jar`, so `./gradlew` works directly |
| Android Studio | Iguana 2023.2 or newer recommended | Older versions may not recognize AGP 8.6 |

**If your local `JAVA_HOME` points at JDK 11 or 8**, a command-line build fails with
`Unsupported class file major version`. In Android Studio, set
`Settings → Build, Execution, Deployment → Build Tools → Gradle → Gradle JDK` to 17; on the command line,
specify it ad hoc: `JAVA_HOME=/path/to/jdk-17 ./gradlew ...`.

> If your local SDK has no `platforms;android-34`, the build reports
> `Failed to find Build Tools revision 34.0.0` or `compileSdk 34 not found`. Install `platforms;android-34` +
> `build-tools;34.0.0`, or raise `compileSdk` / `targetSdk` in `app/build.gradle.kts` to 35 together.
> **The simplest option is to let CI build it, as in section 5.**

### Faster networking in mainland China (optional)

The Gradle distribution may be slow from the official CDN; point `distributionUrl` in
`gradle/wrapper/gradle-wrapper.properties` at the Tencent Cloud mirror:

```properties
distributionUrl=https\://mirrors.cloud.tencent.com/gradle/gradle-8.9-bin.zip
```

The same applies to dependency repositories: in this project's `settings.gradle.kts`, insert the following
*before* `google()` / `mavenCentral()` in both `pluginManagement` and `dependencyResolutionManagement`:

```kotlin
maven { url = uri("https://maven.aliyun.com/repository/google") }
maven { url = uri("https://maven.aliyun.com/repository/public") }
```

(These two are personal environment tweaks and are deliberately not committed, so CI reproducibility is
not affected.)

---

## 8. App and dependency information

| Item | Value |
|---|---|
| App name | `Locus Earth` |
| applicationId / namespace | `dev.locusearth.app` |
| minSdk / targetSdk / compileSdk | **24** / **34** / **34** |
| versionCode / versionName | 3 / 1.2 |
| Language | Kotlin |
| Build script | Gradle Kotlin DSL (`build.gradle.kts`) |
| AGP / Gradle / Kotlin / JDK | 8.6.1 / 8.9 / 1.9.24 / 17 |
| Theme | `Theme.Material3.DayNight.NoActionBar` (light/dark follows the system) |
| Module structure | single module `:app` |

Dependencies:

| Library | Purpose |
|---|---|
| `androidx.core:core-ktx` | basics |
| `androidx.appcompat:appcompat` | `AppCompatActivity` |
| `com.google.android.material:material` | Material 3 theme, dialogs, buttons |
| `androidx.activity:activity-ktx` | `OnBackPressedCallback`, permission requests |
| `androidx.webkit:webkit` | `WebViewAssetLoader` (local error page) + **browser capability switches since 1.13.0**: bfcache, prerendering, engine warm-up (see "Performance settings" after §16) |
| `androidx.core:core-splashscreen` | splash screen |

Startup URL: `https://locus-earth.pages.dev/`

### Light / dark

The shell has no theme switch of its own; it follows the system, and sets the **window background colour**
and the **system-bar icon lightness** as a *pair* — these two must change together, otherwise you get white
icons on a white background.

| Resource | Light | Dark | File |
|---|---|---|---|
| `shell_background` (window / status bar background) | `#FFFFFF` | `#0E1320` | `values/colors.xml`, `values-night/colors.xml` |
| `shell_navbar` (navigation bar background) | API 27+: white; API 24–26: dark fallback | `#0E1320` | same files + `values-v27/colors.xml` |
| `system_bars_light` (whether system-bar icons are dark) | `true` | `false` | `values/bools.xml`, `values-night/bools.xml` |

Two easy traps:

- `windowLightStatusBar` / `windowLightNavigationBar` are declared **explicitly** in `themes.xml`.
  Material 3 themes do not declare them (checked against the material 1.12.0 AAR resources — neither
  attribute appears anywhere), so relying on inheritance lands on the platform default `false` = white
  icons on a white background in light mode.
- The navigation bar must be handled per API level: `windowLightNavigationBar` is an **API 27** attribute,
  and on 24–26 the navigation-bar icons are always light, so a white background would make them invisible —
  hence the dark fallback on older versions.

---

## 9. Domain allow-list

**The two domains currently allowed to open inside the shell** (both include subdomains, so e.g.
`pano.qq-map.netlify.app` also matches):

| Domain | Purpose |
|---|---|
| `locus-earth.pages.dev` | the Locus Earth site (Cloudflare Pages) |
| `qq-map.netlify.app` | third-party viewer for Tencent Street View; the web app opens it with `window.open` |

There is also one **internal shell domain**, which is not part of the business allow-list:
`appassets.androidplatform.net` — the virtual domain that exposes local `assets/` over https (used by the
error page).

### Adding an allow-listed domain

**Change exactly one place**: `ALLOWED_HOSTS` in
`app/src/main/java/dev/locusearth/app/DomainPolicy.kt`.

```kotlin
private val ALLOWED_HOSTS = listOf(
    "locus-earth.pages.dev",
    "qq-map.netlify.app",
    "example.com",          // ← add it here
)
```

The rules, recap:

| Case | Behaviour |
|---|---|
| `https://` + allow-listed (including subdomains) | loads inside the shell |
| allow-listed domain but `http://` | handed to the system browser (the shell forces HTTPS; plaintext would not load inside anyway) |
| any other `http(s)://` | handed to the system browser |
| `mailto:` / `tel:` / `geo:` / `market:` etc. | handed to the matching app |
| `about:` / `data:` / `blob:` / `javascript:` | kept inside the WebView (handing them out would not work) |
| unknown scheme | ignored and logged; no system chooser, no crash |

Two further notes:

- **`window.open` / `target="_blank"`**: for allow-listed hosts the URL loads in the **current WebView** —
  no second Activity is spawned and no "second browser" appears.
- **Sub-resources (images / JS / CSS / CDN / tiles / APIs)** are never intercepted; they go straight to the
  WebView's own network stack — see the comment in `AppWebViewClient.shouldInterceptRequest`. Do not add
  caching or proxying there; it will break Cesium.

### How to verify the allow-list works

1. Open the map in the shell → tap "Street View" → pick a point inside China:
   `qq-map.netlify.app` should open **inside the shell** (the back key returns to the globe).
2. Open the "About" dialog on the page → tap the GitHub link: it should **jump out** to the system browser.
3. Turn off the network and launch: you should see the local error page (`assets/error.html`), not a white
   screen.

---

## 10. Replacing the app icon

The current icon is a **solid green-blue globe** (deep blue-black background `#0E1320` plus a pale blue
disc), derived from the source image `androidapk/icon-source/locus-earth-icon-512.png` — the same image as
`android-chrome-512x512.png` at the repository root (the web app's PWA icon). It was copied into the Android
project to **keep this project self-contained, and to keep the icon source out of the CF Pages deployment**.

### To change the icon: edit one file, run one script

```bash
# 1. overwrite the source image (square PNG, ≥512×512, transparent background)
cp your-new-icon.png androidapk/icon-source/locus-earth-icon-512.png

# 2. regenerate every bitmap under res/
python androidapk/tools/gen-icon-assets.py
```

The script prints the measured disc diameter for each density and self-checks (`measured blue disc ==
expected`); all 24 files are generated in one go.

> The script only depends on `Pillow`, **does not participate in the Gradle build**, and is run once by hand
> when changing the icon. If you also want to change `android-chrome-512x512.png` at the repository root,
> that belongs to the web PWA — change both sides separately.

### ⚠️ Do not use Android Studio's New → Image Asset wizard

The reason is that it gets the safe zone wrong:

In this source image the globe disc is **full-bleed** — measured disc radius = half the canvas width ×
**1.0026** (the disc reaches, and slightly overshoots, all four edges of the 512 square; there is no margin
at all). The wizard treats an ordinary square image as "content = the whole image", so the adaptive-icon
foreground is scaled too large and its Safe Zone judgement is off. The generation script compensates for
this explicitly with `SOURCE_DISC_RATIO = 1.0026`:

```
scale = (target_mark_dp / canvas_dp × canvas_px) / (source_px × 1.0026)
```

### The resources involved

| File | Purpose |
|---|---|
| `icon-source/locus-earth-icon-512.png` | **the single icon source**; changing the logo means changing only this |
| `tools/gen-icon-assets.py` | generates every bitmap below; re-runnable, idempotent, self-checking |
| `res/mipmap-<density>/ic_launcher_foreground.png` | adaptive-icon **foreground**; the blue disc fills the 66dp safe zone (6 densities) |
| `res/values/colors.xml` → `ic_launcher_background` | adaptive-icon **background colour** `#0E1320` |
| `res/mipmap-anydpi-v26/ic_launcher.xml` / `ic_launcher_round.xml` | adaptive-icon declarations for Android 8.0+ |
| `res/mipmap-<density>/ic_launcher[_round].png` | bitmaps used by Android 7.x (API 24/25); required by `minSdk 24` |
| `res/drawable-<density>/ic_splash_logo.png` | splash-screen icon (6 densities) |
| `res/drawable/ic_launcher_monochrome.xml` | Android 13+ themed icon (outlined globe vector, see below) |
| `res/values/colors.xml` → `brand_sky` / `brand_leaf` | used only by the themed-icon vector |

Sizing conventions (not arbitrary):

| Use | Glyph / canvas | Basis |
|---|---|---|
| Adaptive foreground | 66 / 108 | 66dp is the safe zone guaranteed visible under **any** mask |
| Legacy icon (API 24/25) | 32 / 48 | matches the adaptive icon's visual weight (both 66.7%) |
| Splash screen | 72 / 108 | the Android 12 splash canvas is 288dp, and only the inner 192dp (= 2/3) escapes the circular mask |

### Known inconsistency: the themed icon is still an outlined globe

The `monochrome` entries in `mipmap-anydpi-v26/*.xml` point at
`drawable/ic_launcher_monochrome.xml`, an **outlined globe** vector that does not look like the solid
version on the home screen.

Why the bitmap foreground cannot simply be reused: themed icons take only the **alpha channel** and let the
system recolour it — and the alpha of a solid disc is just a plain filled circle, which after recolouring
shows nothing globe-like. So the stroked version is kept: its alpha is at least a globe silhouette.

Unifying the two would mean redrawing a single-colour globe vector with "outline only, no interior fill" to
replace it.

---

## 11. First-launch notice ("this is a web app")

On the very first launch after installation, a **full-screen native notice** appears first, explaining in
Chinese and English that "this is a web app, not a native app", with two buttons at the bottom: **Exit**
(ends the app) / **Enter** (starts loading the web page). After "Enter" has been tapped once, every later
launch goes straight to the web page and the notice never appears again.

Implementation: `WelcomeScreen.kt` (an `object` that `addView`s a full-page view onto the Activity's root
layout) + `layout/view_welcome.xml` + `values/strings.xml`.

### Why it exists

The shell wraps the web app so completely that users assume it is a native app and develop wrong
expectations ("why is it blank without a network?", "why does an update need a re-download?"). This screen
is **one-time expectation management**, not a welcome message.

### Deliberate design decisions

| Decision | Reason |
|---|---|
| The notice appears **before the WebView is created** | If the user taps "Exit", they should not already have spent data loading the globe. See `MainActivity.setupWebView()` |
| There is no "tap outside / back key to dismiss" path | Only two exits, "Exit" and "Enter", so the user must state their intent — no ambiguous "neither entered nor exited" state |
| A **full-page view** instead of a dialog | Bilingual copy is width-constrained in a dialog and Chinese body text gets squeezed into many short lines; a full page can lay out four blocks (Chinese/English title + Chinese/English body) with the buttons pinned to the bottom |
| `addView` onto the Activity's root layout rather than a separate Activity | The shell has exactly one window (MainActivity), so back key / task stack / deep-link return need no extra layer; this screen's only job is to block the WebView until it exists |
| The buttons' `textColor` / `backgroundTint` / `strokeColor` are all hard-coded | Material buttons inherit attributes such as `colorOnPrimary` from the theme. This is the very first screen the user sees, so if any theme layer fails to resolve, the button text ends up the same colour as the background and "disappears". All three are therefore given explicit `welcome_button_*` values instead of relying on the inheritance chain |
| `commit()` instead of `apply()` when persisting | The user may kill the app immediately after tapping; `apply()` writes asynchronously and in a vanishingly small number of cases may not finish, making the notice reappear next launch |
| Chinese/English titles and bodies as four separate TextViews | A full-screen page has enough vertical room, and laying out by hierarchy beats faking font sizes with HTML `<big>`/`<small>` |

### Changing the copy / the "show only once" behaviour

| What you want to change | Where |
|---|---|
| Copy | `welcome_*` in `values/strings.xml` |
| Button labels | same file, `welcome_exit` / `welcome_enter` |
| Layout and spacing | `res/layout/view_welcome.xml` |
| Colours (one set per light/dark) | `welcome_*` in `values/colors.xml`, `values-night/colors.xml` |
| The key that remembers "already seen" | `KEY_SHOWN` in `WelcomeScreen` (stored in SharedPreferences `locus_earth_shell`) |
| Show it again to an existing user | uninstall and reinstall, or clear app data (the key is cleared with app data) |

> After an uninstall/reinstall or clearing app data the notice appears once more — that is expected; it is
> equivalent to a fresh install. A version upgrade does **not** bring it back: `SharedPreferences` is not
> cleared by an APK update.

---

## 12. How the web app detects the shell

The shell appends a marker to the end of the WebView User-Agent:

```
... Mozilla/5.0 (...) ... LocusEarthAndroid/1.2
```

The version number comes from `versionName` in `app/build.gradle.kts` (see `DomainPolicy.UA_SUFFIX`).

The web side can check it like this (**the web code in this repository has not been changed**; this is only
left here for future use):

```js
const isAndroidShell = navigator.userAgent.includes('LocusEarthAndroid');
```

> This marker only affects the WebView UA and does not affect any key validation in the page (Tencent /
> Tianditu / Cesium quotas are governed by Referer domain allow-lists, which have nothing to do with the UA).

---

## 13. Cloudflare Pages deployment exclusion (important)

### The conclusion first

**Cloudflare Pages does not support `.cfignore`.** The official Build configuration docs contain no notion
of "excluding files", and community requests for it were never implemented. That is why this repository
**deliberately does not** create a `.cfignore` — leaving a same-named file that does nothing only makes the
next person reading the code (including future you) believe `androidapk/` has already been excluded.

Pages has exactly one rule: **whatever is in the Build output directory is published as-is.**

### How big is the risk

| Case | Consequence |
|---|---|
| Build output directory = repository root (`/` or `./`) | `gradlew`, `*.gradle.kts`, `gradle-wrapper.jar` and `README.md` under `androidapk/` all become downloadable static assets |
| `keystore.properties` / `*.jks` | **already blocked by `.gitignore`, so they never reach git and therefore never reach CF's build directory** — this is the last line of defence |
| `_redirects` as a stopgap | you can 301 `/androidapk/*` to `/`, but the files still sit in the deployment, merely unreachable at that path — treats the symptom, not the cause |

### Recommended approach: one Build command (no web code, no moving directories)

This project ships `cf-pages-exclude.sh`, which packs the repository root using an "exclusion" approach into
a `dist/` directory:

```bash
bash androidapk/cf-pages-exclude.sh
```

Change two fields in the Cloudflare console:

```
Workers & Pages → pick your project → Settings → Build configuration

  Build command:            bash androidapk/cf-pages-exclude.sh
  Build output directory:   dist
```

Once `Build command` is set to the command above, **not a single web file needs to move**: the repository
structure, the local development workflow and the Service Worker paths all stay the same.

**Verify once after deploying** (it should return 404 or 403):

```
https://locus-earth.pages.dev/androidapk/settings.gradle.kts
```

> ⚠️ **Configure this before pushing `androidapk/` up.**
> CF Pages has an "asset retention cache": files that were once published may remain reachable for up to a
> week even after being removed from the deployment, and there is **no manual purge entry** — you can only
> wait for expiry. If you ever publish by mistake, the safest response is to rotate every credential that
> might have been exposed.

### The alternative: move the web app into `./web/` (not adopted here)

| | Option A: `cf-pages-exclude.sh` + `dist` (adopted) | Option B: move the web app into `./web/`, set Root directory to `web` |
|---|---|---|
| Repository changes | additions only (one new shell script) | move `index.html` / `js/` / `css/` / `sw.js`… every web file |
| CF configuration | change Build command and output directory | change Root directory |
| Risk | depends on `tar` existing in CF's build image (it does) | extremely easy to misconfigure: the GitHub Pages publish source, `SHELL_URLS` in `sw.js`, manifest paths and the local dev-server root all have to change too |
| Effect on local development | none | local serving and every debug path changes |
| Verdict | ✅ adopted | ❌ not this time; only if a second non-web project ever lands in this repository |

If you ever do go with option B, do it as **one standalone change**: get "`python -m http.server` works from
inside `web/`" running first, then touch the CF and GitHub Pages configuration — do not mix it into a commit
about the Android project.

---

## 14. Favorites import / export (across web and shell)

This is the only feature that **requires changes on both sides**, because files are an operating-system
capability that the web page cannot reach. The split is clear: **the web app owns the content, the shell owns
handing the file out / taking it in.**

| Action | Web side | Shell side |
|---|---|---|
| Export | `navigator.share({ files })` first; falls back to `<a download>` + blob when unsupported | no code needed: the system share sheet is handled by the system (`DownloadListener` only catches http/https direct links as a fallback) |
| Import | `<input type="file">` + `FileReader` | `onShowFileChooser` → `ACTION_GET_CONTENT` |

### Why export has to go through the system share sheet

A `blob:` download **cannot, in principle, be saved by the native side** in an Android WebView: the blob
bytes exist only in the renderer process, and `DownloadListener.onDownloadStart` receives nothing but a
`blob:https://...` string that the native side has no way to read.
So export did not take the old "just add a DownloadListener" route; it uses `navigator.share()` instead —
the system share sheet can "save to Files", send it to yourself, and so on. It is the proper channel for
handing a file out on Android, and it **requires no storage permission at all**.

### Why import needs no storage permission

`ACTION_GET_CONTENT` + `CATEGORY_OPENABLE` goes through SAF (the Storage Access Framework): the user picks a
file in the system file picker, the system grants read access to that one URI, and it is discarded
afterwards. The manifest therefore **still declares only three permissions** (INTERNET plus two location
permissions), with no storage permission added.

### Two easy traps

- **`<queries>` must declare `GET_CONTENT`.** Under the package-visibility restrictions of targetSdk 30+, if
  you do not declare it, no file manager may be resolvable and `startActivity` throws
  `ActivityNotFoundException` outright.
- **The `onShowFileChooser` callback must be answered exactly once, including when cancelled (pass null).**
  A missing answer leaves the page's `<input type="file">` waiting forever — after that, not even a tap
  responds. The code therefore funnels all three paths — "picked / cancelled / no file manager" — through
  `deliverFileChooserResult()`.

---

## 15. Design notes and known differences

### ⚠️ These look wrong but are intentional — do not change them back

| What looks "wrong" | Why it has to be this way |
|---|---|
| No `.cfignore` | **CF Pages does not support `.cfignore`** (no such concept in the official docs). A same-named file that does nothing only makes people think it is excluded. The real fix is `cf-pages-exclude.sh` + changing the Build command in the CF console |
| `onCreateWindow` does not use "return null so the current WebView loads it" | Android's contract has **no** such option: returning null means no window is created, the page's `window.open` fails silently and the Street View button simply stops working. Instead, a non-rendering "ferry WebView" captures the target URL and routes it back to the main WebView |
| `javaScriptCanOpenWindowsAutomatically = true` | Not an optimization but **functionally required**. The page's Street View button calls `window.open` *after* `await lookupPano()`, so the user gesture has been consumed by the await; with the default setting the popup blocker swallows it — the symptom is "tapping Street View does nothing" |
| The error page's "Retry" is a plain link rather than `webView.reload()` | The requirements forbid `addJavascriptInterface`, so the page has no path back to native code. A link triggers an allow-listed navigation, which is equivalent |
| The first-launch notice has no "dismiss" path | See section 11: only Exit / Enter, forcing the user to state intent — no ambiguous "neither entered nor exited" |
| Pull-to-refresh: not implemented | Consistent with the design (a globe is too easy to touch by accident) |

### Two extra hardening measures beyond the requirements (delete them if you find them excessive)

1. **Rebuild the WebView after `onRenderProcessGone`** (`MainActivity.recreateWebView`).
   A Cesium scene is memory-hungry, and when the system reclaims the renderer process the default is **the
   whole app crashing**; with this handled, the symptom becomes "the page reloads to the home view". The cost
   is losing an unsaved viewpoint — still better than a crash.
2. **UA marker**: the required ` LocusEarthAndroid/1.2` is assembled automatically from `versionName`, so it
   cannot be forgotten when the version changes.

---

## 16. Known limitations and TODO

### Resolved (previously on the TODO list)

| Item | How it works now |
|---|---|
| Favorites **import** did nothing in the shell | `WebChromeClient.onShowFileChooser` → `ACTION_GET_CONTENT` is implemented, and the system file picker takes over. SAF grants per-use access and **requires no storage permission**. The manifest's `<queries>` GET_CONTENT was added too (targetSdk 30+ may not resolve a file manager without it) |
| Favorites **export** did nothing in the shell | The web side switched to **share-first**: `navigator.share({files})` hands off to the system share sheet (which can save to "Files"). The reason is that a `blob:` download cannot, in principle, be captured by the native side — blob bytes live only in the renderer process, and `DownloadListener` receives just a string |
| File upload (`<input type="file">`) | uses the same SAF path as import; works |

Export keeps two paths: system share first, with desktop browsers (which usually cannot share files) falling
back automatically to the original `<a download>`. The shell also has a `DownloadListener` for http/https
direct downloads, which land in the system "Download" folder and likewise need no storage permission.

### Still outstanding

| # | Item | Notes |
|---|---|---|
| 1 | `blob:` direct downloads cannot be saved inside the shell | A limitation of how blobs work (see above). If the web app ever adds a non-share blob download entry point, it will need a "page hands the content to native" mechanism to reach disk |
| 2 | No follow-up guidance after location permission is **permanently denied** | The permission is requested only once in the system dialog; if the user picks "don't ask again" the page merely receives a failure callback. A prompt pointing at system settings could be added when `shouldShowRequestPermissionRationale` returns false |
| 3 | Camera / microphone | not needed by the page today, so not declared in the manifest. Add `<uses-permission>` + `WebChromeClient.onPermissionRequest` when needed |
| 4 | Full-screen video | `onShowCustomView` / `onHideCustomView` are implemented per the contract (hiding system bars, back key exits full screen), but there is no real video to test with |
| 5 | ~~Returning from the settings page reloads the main page~~ → **resolved (bfcache)** | See item 2 of "Performance settings" below: with a bfcache hit, returning does not reload the Cesium scene and the camera viewpoint is preserved; without a hit (old engine / unsupported engine) behaviour is the same as before |

### Performance settings: what was done to match commercial browsers

The shell does not ship a custom engine and does not use Bubblewrap / TWA, so the performance budget lies in
"using the browser capabilities the WebView already has to the full". All six items below live in
`MainActivity` and `AndroidManifest.xml`, ordered by benefit:

| # | Setting | Where | Benefit / reason |
|---|---|---|---|
| 1 | **Hold the splash screen until the page's first frame** | `MainActivity.holdSplashUntilFirstFrame()` | Commercial browsers drop the splash when the user *sees content*, not at the window's first frame. This app's first screen pulls in Cesium, so without holding it the experience is a three-stage jump: "splash → white/black → globe". There is a 6-second fallback timeout so a dead network cannot trap the user on the splash |
| 2 | **Back/Forward Cache (bfcache)** | `MainActivity.createMainWebView()` | Fixes the original problem 5: when returning from `settings.html` with a bfcache hit, the Cesium scene is **not reloaded** and the camera viewpoint survives. It comes from an experimental `androidx.webkit` 1.13.0 API; the code probes `WebViewFeature.isFeatureSupported(BACK_FORWARD_CACHE)` first and does nothing on unsupported devices |
| 3 | **Renderer priority IMPORTANT** | same as above | Cesium is memory-hungry. Marking the renderer "important and non-waivable" means the system reclaims others first (roughly a browser foreground tab's priority), reducing "the scene mysteriously reloaded" |
| 4 | **Disable WebView-level zooming** (`setSupportZoom(false)`) | same as above | Pinch/double-tap decisions go entirely to Cesium; touch events skip one layer of WebView arbitration, so the globe feels more responsive |
| 5 | **Explicit `android:hardwareAccelerated="true"`** | `AndroidManifest.xml` | A prerequisite for WebGL (it has defaulted to true since API 14; it is written out so a "helpful optimization" cannot turn it off) |
| 6 | **Dependency raised to `androidx.webkit:1.13.0`** | `app/build.gradle.kts` | The source of item 2's capability. The aar metadata says `minCompileSdk=34`, matching this project's compileSdk, so no SDK change is needed |

**Deliberately not done, and why**:

| Not done | Reason |
|---|---|
| `prerenderUrlAsync` (prerender the home page) | The Cesium scene would be rendered twice, doubling memory / GPU, making renderer reclamation *more* likely. Revisit only when there is a real "instant open" requirement |
| `startUpWebView` (async engine warm-up) | androidx itself labels it "experimental, not for non-experimental use, may be removed at any time"; the benefit is only saving one engine start of tens to hundreds of milliseconds — not worth it |
| `setOffscreenPreRaster` | a full-screen 3D page does not scroll, so there is nothing to pre-rasterize |
| `android:largeHeap` | only enlarges the app process's Java heap; JS / WebGL memory lives in the renderer process, so it does nothing here |
| `setForceDark` / `setAlgorithmicDarkeningAllowed` | the page has its own light/dark themes; that belongs to the web app, the shell does not interfere |
| `setCacheMode(LOAD_CACHE_ELSE_NETWORK)` | the Service Worker manages caching itself; forcing cache-first may serve stale tiles, which is wrong for a globe app |
| `DOCUMENT_START_SCRIPT` / `WEB_MESSAGE_LISTENER` | both are "the shell injecting things into the page", which conflicts with the rule of "expose no native capabilities and do not let the page steer the shell" |

---

## 17. Directory structure

```
androidapk/
├── README.md                        ← Chinese version of this file
├── README-EN.md                     ← this file
├── cf-pages-exclude.sh              ← build script that excludes androidapk/ from CF Pages
├── build.gradle.kts                 ← top level: plugin versions only
├── settings.gradle.kts              ← single module :app
├── gradle.properties
├── gradlew / gradlew.bat            ← Gradle 8.9 wrapper (bundled; no need to install Gradle)
├── gradle/wrapper/
│   ├── gradle-wrapper.jar
│   └── gradle-wrapper.properties
├── icon-source/
│   └── locus-earth-icon-512.png     ← icon source (same image as the PWA icon at the repo root)
├── tools/
│   └── gen-icon-assets.py           ← generates every icon bitmap under res/
├── keystore.properties.example      ← copy to keystore.properties and fill in (already gitignored)
├── .gitignore
└── app/
    ├── build.gradle.kts             ← SDK versions, dependencies, signing fallback logic
    ├── proguard-rules.pro           ← placeholder (minification not enabled)
    └── src/main/
        ├── AndroidManifest.xml      ← permissions / queries / network security config / Activity
        ├── assets/error.html        ← load-failure page (purely local, works offline)
        ├── java/dev/locusearth/app/
        │   ├── MainActivity.kt          ← wires up the WebView, back key, location, full screen, error page, rebuild
        │   ├── AppWebViewClient.kt      ← top-level navigation decisions / sub-resource passthrough / error reporting
        │   ├── AppWebChromeClient.kt    ← new windows / location prompts / full-screen callbacks
        │   ├── WelcomeScreen.kt         ← first-launch full-screen notice ("this is a web app")
        │   ├── DomainPolicy.kt          ← ★ allow-list and URL policy (the only place to add a domain)
        │   └── AssetsLoader.kt          ← virtual https domain mapping for assets
        └── res/
            ├── drawable/ic_launcher_monochrome.xml  ← Android 13+ themed icon (outlined globe vector)
            ├── drawable-*-dpi/ic_splash_logo.png     ← splash-screen icon (script-generated)
            ├── layout/activity_main.xml / view_welcome.xml
            ├── mipmap-anydpi-v26/     ← adaptive icons (API 26+)
            ├── mipmap-*-dpi/          ← bitmap icons: foreground / legacy square / legacy round (script-generated)
            ├── values/ values-night/  ← colours, strings, themes
            └── xml/network_security_config.xml
```

---

## 18. Self-check list

Project side (static verification + resource self-checks; the real build runs on CI via
`.github/workflows/android.yml`):

| Check | Where / conclusion |
|---|---|
| Both allow-listed domains open inside the shell | the two entries in `DomainPolicy.ALLOWED_HOSTS` + `isAllowedHost` doing suffix matching on subdomains |
| Other http(s) URLs go to the system browser | `AppWebViewClient.decideUrl` → `Intent.ACTION_VIEW`, with `ActivityNotFoundException` caught |
| Back key behaviour | `MainActivity`'s `OnBackPressedCallback`: full screen → exit full screen; `canGoBack` → `goBack`; otherwise `finish()` |
| Cesium gets a position after the location permission is granted | `onGeolocationPermissionsShowPrompt` → runtime request → `callback.invoke(origin, granted, false)`; denial is also answered, so the page never hangs |
| No native capabilities exposed in the shell | no `addJavascriptInterface` anywhere in the project |
| Icon safe zone correct | `tools/gen-icon-assets.py` self-checks: the measured disc diameter for all 6 densities matches `66/108 × canvas` one by one (mdpi measured 66px / expected 66px) |
| Adaptive icon not clipped under any mask | the generated output was composited under circle / squircle / rounded / square masks; the disc always lands fully inside the 66dp safe zone |
| First-launch notice resources are closed | the six `welcome_*` strings, `view_welcome.xml`, the six ids `welcomeTitle`/`welcomeSubtitle`/`welcomeBody`/`welcomeBodyEn`/`welcomeExit`/`welcomeEnter`, and the six `welcome_*` colours (one set each in values and values-night) were cross-checked against Kotlin references — all present |
| Platform APIs used by file selection | the class constant pool of the real `android.jar` (android-35) was parsed and checked item by item: `onShowFileChooser` / `FileChooserParams.parseResult` / `ValueCallback.onReceiveValue` / `DownloadManager.Request.*` / `URLUtil.guessFileName` all exist with matching signatures |
| No more native dialogs on the web side | `prompt(` / `confirm(` / `alert(` are all gone site-wide, with only 3 "fall back to native when the dialog element is missing" guards left, each commented |
| `androidapk/` stays out of the CF deployment output | `cf-pages-exclude.sh` **was actually run locally**: 56 files output, 0 matches for `androidapk`, and `index.html` / `sw.js` / `manifest.json` / `settings.html` all present (the Build command still has to be pointed at it in the CF console) |

Device side (install on a phone and walk through these):

- [ ] **First launch right after a fresh install**: the full-screen "this is a web app" notice appears (Chinese and English titles + bodies, two buttons at the bottom); no text is truncated, "Exit / Enter" are both clearly visible, and the globe only loads after tapping "Enter"
- [ ] **Second launch**: goes straight to the web page, no notice
- [ ] Tapping "Exit" on the notice: the app ends and does not enter the web page
- [ ] While the notice is showing, rotate the screen / toggle the system light-dark mode: the page does not disappear and no text is lost (`uiMode` is in `configChanges`, so the Activity is not recreated, which means **light/dark does not switch live**; it takes effect after restarting the app — deliberate, to avoid recreating the Cesium scene)
- [ ] Small screen + large font (system font at maximum): the body scrolls to the end and both buttons remain fully visible
- [ ] Clear app data and launch again: the notice reappears (expected)
- [ ] Cold start: the splash is a solid colour with no white flash, then it enters the globe automatically
- [ ] Once the globe has loaded, panning/zooming works (proof that sub-resources are not intercepted)
- [ ] On API 24/25 devices the home-screen icon renders correctly (bitmap set); on API 26+ the adaptive icon is used
- [ ] The home-screen icon is not clipped under various launchers (circle / square / squircle)
- [ ] With "themed icons" enabled in the system, the icon is still recognizably a globe (expected to be the outlined style — see section 10)
- [ ] **Favorites "Export"**: the system share sheet appears and the CSV can be saved to "Files" or sent to another app
- [ ] **Favorites "Import"**: the system file picker appears, and selecting the exported CSV imports it with a success toast
- [ ] Cancelling during import: no error, no hang, and tapping "Import" again still responds (the key regression item for answering the callback)
- [ ] Deleting a marker: an in-page confirmation dialog appears (not the system "<domain> says" box), and the icon disappears after confirming
- [ ] Enter mainland China → tap "Street View" → `qq-map.netlify.app` opens inside the shell, and back returns to the globe
- [ ] Tapping the GitHub link in "About" → jumps out to the system browser; switching back still shows the same globe
- [ ] Tapping the location button on the page → the system location permission dialog appears → positioning works after allowing
- [ ] Launching in airplane mode → the local error page appears → turn airplane mode off and tap "Retry" → back to the globe
- [ ] Launching in dark mode: no white flash at any point

---

## Appendix: current state of the build environment

### This project is not built on this machine; builds go through GitHub Actions

The build path for `androidapk/` is `.github/workflows/android.yml` (see
[section 5](#5-building-with-github-actions-recommended)). This machine is used only to edit code, generate
icon resources and run static checks.

**The actual state of the current development machine (measured 2026-10-15):**

| Item | Measured |
|---|---|
| Android Studio | `D:\Android studio`, build `AI-253.32098.37.2534.15052363` |
| Bundled JBR | **JDK 21.0.10** (the project's Gradle JDK already points at it, see `.gradle/config.properties`) |
| Android SDK | `D:\AndroidSDK` (the `sdk.dir` in `local.properties` is set; the `ANDROID_HOME` environment variable is empty) |
| What is installed in the SDK | platforms: `android-35` / `android-36.1`; build-tools: `36.0.0` / `36.1.0` / `37.0.0` |
| ⚠️ **What is missing** | **no `platforms;android-34`**, which is exactly what the project's `compileSdk = 34` requires |
| Gradle distribution | `D:\.gradle\wrapper\dists\gradle-8.9-bin` holds only a 0-byte `.part` plus a `.lck` — an interrupted partial download that never completed |
| Build output | none. `app/build/` does not exist |

So the answer to "can this machine produce a build" is **not right now**, and the reason is not missing tools
but those specific gaps:

1. **`compileSdk 34` has no platform.** AGP 8.6.1 will fetch it automatically, but the network in mainland
   China is unreliable; to fix it by hand, install `platforms;android-34` + `build-tools;34.0.0`, or raise
   `compileSdk` / `targetSdk` to 35.
2. **The gradle-8.9 distribution is a partial download**, so it has to be fetched again (about 130 MB).
3. This machine's JDK is **21** while the project is configured for **17**. Gradle 8.9 runs fine on 21, but
   **this combination has never been verified on this machine**; CI uses temurin **17**, matching the project
   declaration — **trust CI**.

### What has been verified: static checks, not a real build

| Layer | Method | Result |
|---|---|---|
| Resource reference closure | enumerated every `@drawable`/`@mipmap`/`@color`/`@string`/`@style`/`@id` under `res/` plus Kotlin `R.*` / `getString(R.string.*)` references | all resolve, no dangling references |
| XML validity | fully parsed every XML under `res/` | all pass |
| Icon dimensions | generator self-check + independent re-measurement of the 24 PNGs | disc diameters match for all 6 densities |
| Icon masking | composited circle / squircle / rounded / square masks | the disc lands fully inside the 66dp safe zone |
| PNG integrity | validated image by image | all pass |

**Not done**: `aapt2` resource compilation, Kotlin compilation, real-device/emulator runs.
So if the first CI build fails, suspect **compile-time** problems in resources or code first, not icon
geometry miscomputed.
