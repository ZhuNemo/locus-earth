# Locus Earth 踩坑记录

> 源码注释只留结论和约束；推导过程、实测数据、复现方法集中在这里。
>
> 按主题分节，不按时间。每条都标注了生效版本或实测环境，便于判断是否已过期。

- 声明：本文含 AI 生成内容

## 目录

1. [Cesium 引擎与事件](#1-cesium-引擎与事件)
2. [相机与触控手势](#2-相机与触控手势)
3. [坐标系与地表取点](#3-坐标系与地表取点)
4. [测量与收藏夹](#4-测量与收藏夹)
5. [UI 布局与浮层](#5-ui-布局与浮层)
6. [字体、图标与提示](#6-字体图标与提示)
7. [底图与街景](#7-底图与街景)
8. [导入导出](#8-导入导出)
9. [构建、缓存与测试](#9-构建缓存与测试)

---

## 1. Cesium 引擎与事件

### 1.1 双击会「追踪实体」，必须显式禁用

`Viewer` 构造时在内部 `ScreenSpaceEventHandler` 上注册了两个动作：

```js
m.screenSpaceEventHandler.setInputAction(w, LEFT_CLICK);        // w: selectedEntity = pick(...)
m.screenSpaceEventHandler.setInputAction(D, LEFT_DOUBLE_CLICK); // D: 有 position 就 trackedEntity = ...
```

双击一个带 `position` 的实体，相机立刻进入「绕该实体旋转」的追踪模式，且要再点若干次地表才退得出。

**关键点：`ScreenSpaceEventHandler` 是每实例一份的事件表。** 自己在别处 `new` 一个 handler 注册 `LEFT_DOUBLE_CLICK`，覆盖不了 `Viewer` 内部那份——两个 handler 会**同时**响应同一次双击。表现是「双击缩放也生效了，但相机同时被拽去追踪」。

修法（`js/viewer.js`）：

```js
viewer.screenSpaceEventHandler.removeInputAction(ScreenSpaceEventType.LEFT_DOUBLE_CLICK);
```

双击缩放仍由 `js/camera-feel.js` 独占。

### 1.2 单点击的绿色四角框

同一个内部处理器还把 `scene.pick()` 命中的对象写进 `viewer.selectedEntity`，`SelectionIndicator` 随即在实体周围画四个绿色角标。DOM 结构（1.118 Build 产物实测）：

```
.cesium-viewer-bottom
  .cesium-credit-wrapper        ← ion logo 与数据源署名在这里
  .cesium-viewer-selectionIndicatorContainer
    .cesium-selection-wrapper   ← 激活时加 -visible 类
```

本项目从不用 `selectedEntity`（右键菜单、删除都走 `scene.pick`），所以直接关掉：

```css
.cesium-viewer-selectionIndicatorContainer { display: none !important; }
```

加 `!important` 是因为 widget 会给内部元素写内联样式，容器层才压得住。

**它不属于署名/credit。** 署名合规只管 `.cesium-viewer-bottom` 里的 ion 与数据源文字，隐藏选中框没有任何合规风险。

### 1.3 pointer 事件注册在 canvas 冒泡阶段，不能截断

Cesium 1.118 Build 产物里的注册函数：

```js
function ku(e, t, n, i) {
  function o(r) { i(e, r) }
  n.addEventListener(t, o, { capture: !1, passive: !1 });
}
// pointerdown / pointerup / pointermove / pointercancel 都挂在 canvas 上
```

**后果**：在 `window` 捕获阶段对 `pointerup` 调 `stopPropagation()`，事件就到不了 canvas。Cesium 的指针记录停在「按下」不复位，此后每一次单指拖拽都被判成「第二根手指」，走多指分支——**地图拖不动**。而双指缩放/俯仰走的是本项目自研的 touch 逻辑，不依赖 Cesium 的指针状态，所以照常可用。

这个症状极具误导性：看起来像 GPU 兼容性问题，实际是事件被截断。而且丢失的那次 `up` 补不回来，会一直坏到刷新页面。

**实测数据**（Playwright + CDP `Input.dispatchTouchEvent`，`hasTouch: true`，真 `pointerType=touch`）：

| 版本 | 长按标记 → 抬手 → 单指拖动 的相机位移 |
|---|---|
| 保留 `event.stopPropagation()` | **0 米**（完全拖不动） |
| 去掉后 | **192 公里**（正常） |

同一台机器、同一个浏览器，只差这一行。

**正确做法**：`pointerup` 照常放行，用一次性标志告诉业务模块「这次抬手是长按的收尾」：

```js
window.addEventListener('pointerup', () => {
  if (!swallowPointerUp) return;
  tapSuppressed = true;                       // 导出 isTapSuppressed()
  setTimeout(() => { tapSuppressed = false; }, 0);  // LEFT_UP 在本事件内同步派发
}, true);
```

业务侧在抬手回调里守卫：`if (isTapSuppressed()) return;`。

**为什么只在手机上偶发**：长按分支要求 `event.pointerType !== 'mouse'`，桌面右键走 `contextmenu`、`press` 为 `null`，根本进不了这段逻辑。

---

## 2. 相机与触控手势

### 2.1 惯性是三个标量，不是对象

Cesium 1.118 没有 `controller.inertia`。合法键名只有三个：

```js
controller.inertiaSpin      = 0.82;
controller.inertiaZoom       = 0.64;
controller.inertiaTranslate  = 0.82;
```

写 `controller.inertia = { zoom, rotate, tilt }` 只是挂了个没人读的自定义属性，等于没改——旧代码正是这样，所以调了很久都没效果。

衰减公式 `decay(t, c) = exp(-(1 - c) * 25 * t)`。取值 0.82 时约 1 秒衰减到 1%。

**缩放单独调低到 0.64**：缩放惯性会在松手后继续往地面里钻，撞到 `minimumZoomDistance` 再被地形钳回来，观感是「弹一下」。

### 2.2 PINCH 默认同时出现在两个事件列表里

1.118.2 的默认值：

```js
tiltEventTypes = [MIDDLE_DRAG, PINCH, {LEFT_DRAG, CTRL}, {RIGHT_DRAG, CTRL}]
zoomEventTypes 也含 PINCH
```

于是双指缩放时 Cesium 会顺带做两件事：

- `rotate3D` 的 `phi` ← 两指连线角度的变化 ⇒ 绕 `UNIT_Z` 自转（地球乱滚）
- `rotate3D` 的 `theta` ← 两指中点 Y 的位移 ⇒ 俯仰

真手指再稳也有 1~2° 抖动，投到球面上就是明显抽搐；松手后还被 `inertiaSpin` 接着滚一段。

**两处都摘掉**（`js/camera-feel.js` 的 `ZOOM_EVENT_TYPES` / `TILT_EVENT_TYPES`），双指整条链路自研。

### 2.3 自研双指的几何

| 输入 | 动作 |
|---|---|
| 两指距离 | `camera.move(ray.direction, Δh)`，指数映射：距离翻倍 = 高度减半 |
| 两指连线角度 | 绕锚点的**竖直轴**旋转 ⇒ 航向 |
| 两指纵向平移 | 绕 `camera.right` 旋转 ⇒ 俯仰 |

**锚点** = 手势开始时两指中点下方的地面点。整个手势期间固定不变。

**必须整机刚性旋转**：`position + direction + up` 一起绕锚点转（`camera.setView`）。只改朝向不改位置，观感是「相机在原地扭头、地表从旁边滑走」，不符合操作直觉。

- 不能用 `camera.rotate()`：它绕参考系原点旋转，在 ECEF 里就是绕地心转。
- 俯仰下限必须是 `-π/2 + 1e-6`。`-π/2` 是垂直俯视，再收一点（如 `-89.9°`）会在启动视角把相机硬顶一下，表现为「什么都没拖，画面却跳了一下」。
- 锁轴用**累积**缩放比例 > 10%。用单帧距离变化判断会被触点取整带来的 ±1px 抖动误判。

### 2.4 缩放「常驻」是刻意的不对称

`applyPinchZoom` 每帧无条件执行，**不参与锁轴**：

- 以旋转起手 ⇒ 锁上旋转轴 ⇒ 之后张开两指，旋转与缩放**并行**
- 以捏合起手 ⇒ 累积比例已超阈值 ⇒ 本次手势不会突然开始旋转

一句话：**旋转要先起手，缩放随叫随到**。反过来会在地球已经转了半程时突然开始缩放，观感更糟。

这个不对称由 `tests/camera-feel.test.mjs` 的 7.9 / 7.10 钉住，改动前先看那两条。

### 2.5 手势状态的两个补建点

漏掉任意一个，表现都是「捏合突然没反应」：

1. **3 指 → 2 指**：`touchstart` 时 `touches.length === 3`，`beginPinch` 会把状态清空；抬起一根回到 2 指时要在 `touchend` 里重建。
2. **两指过近落下**：距离 < `MIN_PINCH_DISTANCE`(8px) 时 `beginPinch` 拒绝建立；之后张开要在 `touchmove` 里补建。

对应测试 7.11 / 7.12。

### 2.6 动态分辨率

| 参数 | 值 |
|---|---|
| 降档 | 连续 2 秒 < 34fps ⇒ scale − 0.2 |
| 升档 | 连续 4 秒 > 57fps ⇒ scale + 0.1 |
| 抑制窗口 | 手势进行中 + 松手后 700ms 不采样 |

降档步长大于升档：性能不够时要尽快让出帧率，升档慢一点避免在阈值附近反复横跳。

**手势结束按 pointer 计数归零判定**（双指抬一根不算结束）。`pointerup` / `pointercancel` 监听必须挂 **window 捕获阶段**——挂在冒泡阶段的话，任何下游 `stopPropagation` 都会让计数永远减不到 0，`gestureActive` 恒为 true，分辨率再也不采样。

### 2.7 双击缩放的两个守卫

- **「拖过一段再双击」不该缩放**。守卫 `pointerDragged` 只能在 `pointerdown` 重置，不能用 `pointerup` 清：`LEFT_DOUBLE_CLICK` 是所有 `up` 之后才派发的，`pointerup` 里清掉等于守卫永远读到 `false`。
- **触屏自己判双击**。iOS Safari 不保证把触摸双击派发成 Cesium 的 `LEFT_DOUBLE_CLICK`，自建判据：320ms 内、30px 内、期间没拖动。
- 命中收藏标记时**不缩放**（`picked.id._isBookmark`），避免「想点标记却把镜头拉走」。

---
## 3. 坐标系与地表取点

### 3.1 取点必须用 globe.pick

`camera.pickEllipsoid()` 求的是视线与 **h≡0 椭球面**的交点，完全无视地形。倾斜视角下与用户看到的地面点相差约

```
偏差 ≈ 地形高程 / tan(视线俯角)
```

山区可达数公里，点位会落到别的山头上。

`globe.pick(ray, scene)` 直接与渲染出来的地形网格求交；地形关闭时自动退化成椭球面交点，两种模式都正确。

正确写法（`bookmarks.js` / `measure.js` / `streetview.js` / `camera-feel.js` 共用同一约定）：

```js
const ray = camera.getPickRay(windowPosition);
const hit = ray && scene.globe.pick(ray, scene);
return hit || camera.pickEllipsoid(windowPosition, scene.globe.ellipsoid);
```

### 3.2 GCJ-02：矢量可校正，位图不可

中国境内公开地图服务（腾讯 / 高德 / 天地图加密版 / 百度）都是 GCJ-02，这是《测绘法》要求的非线性保密处理，换服务商解决不了偏移。

- **离散坐标 / 矢量数据**：可用 `js/coord-transform.js` 换算。反解用不动点迭代，5 次即达浮点精度上限。
- **位图瓦片**：无法校正。瓦片是服务端按 GCJ-02 渲染好的像素，前端拿到的只是图片，没有可运算的坐标。

### 3.3 图钉尖端必须 +9px

`pixelOffset` 是**屏幕像素**偏移（负 y 向上），换算到地面正比于相机距离——相机越高，同样的 N 像素对应的地面距离越大。

画布是 2x 的 80×100、billboard 显示 40×50，`verticalOrigin: BOTTOM` 把图片底边对齐锚点，而尖端在底边上方 9px。所以必须写 `+9`（向下）把尖端压回锚点。

写成 `-9` 会让尖端离锚点 18px，表现为「尖端浮在点击点上方，相机越高浮得越远，拉到最近才看似归位」。

图片内部 9px 与 `pixelOffset` 9px 同属屏幕空间，任意深度下精确抵消，不存在透视误差。

### 3.4 不要用 CLAMP_TO_GROUND 兜底图钉

`heightReference: CLAMP_TO_GROUND` 会在 `Billboard._updateClamping()` 里每帧调 `scene.getHeight()` 读**当前已加载瓦片**的高度，还会把图钉吸到 3D 建筑屋顶。缩放时 LOD 一变、建筑一加载，高度就变——这正是早期「图钉漂移」的根源。

正确做法：只在拾取退化成椭球面（高度 0，说明该处地形瓦片未加载）时，主动采样一次高程，写死进 `entity.position` 并保持 `HeightReference.NONE`，之后高度恒定。

采样顺序（均只取地形，不含 3D 建筑）：

1. `sampleTerrainMostDetailed()` —— 直接问地形服务要最精细高程，与相机位置、LOD、是否在视野内无关
2. `scene.sampleHeightMostDetailed()` —— 场景采样
3. `globe.getHeight()` —— 同步兜底
4. `0` —— 椭球面（地形关闭时的正确值）

---

## 4. 测量与收藏夹

### 4.1 draft / shapes 两层

`js/measure.js` 分两层：

| 层 | 内容 | 几何 |
|---|---|---|
| `draft` | 正在画的那一条 | `CallbackProperty` 每帧重算，拖视角时标签跟着走 |
| `shapes` | 已保存到 localStorage | 静态坐标，一次性建实体 |

早期只有一个 `currentEntity`，画完就留不住。「完成」按钮把 `draft` 落成 `shape`。

### 4.2 多边形与折线必须成对贴地

- 多边形：不设 `height` / `extrudedHeight`、不开 `perPositionHeight` ⇒ 走 GroundPrimitive 贴地形渲染，顶点高度被忽略。
- 折线：**默认把顶点连成弦**，不随中间地形起伏。必须显式 `clampToGround: true` 交给 GroundPolylinePrimitive，与多边形共用贴地逻辑。

漏了 `clampToGround` 的表现：倾斜视角下轮廓（贴地）与填充（贴地）脱节，折线变成悬空的弦。

### 4.3 保存后要拆 handler

保存完成必须 `handler.destroy()` 并把 `draft` 置空。否则继续点地图会落在空草稿上，表现为「点了没反应」。想再画一条就重新点「测距 / 测面积」。

### 4.4 导出优先系统分享

Android WebView 对 `<a download>` + `blob:` 是**静默丢弃**的：没有 `DownloadListener` 时点了毫无反应，而 blob 的字节只有页面拿得到，原生侧即使实现了 `DownloadListener` 也读不到。

`navigator.share({ files })` 走系统分享面板，是 Android 上把文件交出去的正规通路，且不需要存储权限。桌面不支持时回退 blob 下载。

实现集中在 `js/utils.js` 的 `saveBlobFile()`。

---

## 5. UI 布局与浮层

### 5.1 不要监听 transitionend

下面几种情况下 `transitionend` **不会触发**，回调会永久卡住：

- 元素不可见、后台标签页、无合成器
- 过渡被后续状态变更打断
- 起止值相同（例如高度为 0）

`js/ui.js` 的 `collapsePanelThen()` 改读 CSS 声明的过渡时长（`panelCollapseDuration()`），按时间延迟执行。改动画也不用改 JS。

### 5.2 层级

| 令牌 | 值 | 用途 |
|---|---|---|
| `--z-panel` | 100 | 侧栏、工具条 |
| `--z-floating` | 300 | 底部托盘（要压住地图工具） |
| `--z-modal` | 1000 | 弹窗 |
| `--z-toast` | 1100 | 提示 |
| `--z-menu` | 1200 | 下拉菜单、右键菜单 |

**浮层表面一律用 `--surface-raised`**（.94+）。`--glass-bg-strong` 做浮层会透出底图与下层文字。

### 5.3 托盘收起依赖「第一个子元素是手柄」

移动端托盘靠 `translateY(calc(100% - var(--mobile-bar-h) + var(--drag-y, 0px)))` 收起：整块下移自身高度，只留第一个子元素（`.panel-handle`）露出。

所以往托盘里插元素**不能**用 `panel.firstChild`——一旦插到手柄之前，收起后露出来的就是那个元素，位置全乱。`js/search.js` 锚定到 `.panel-row.switches` 之前、手柄之后。

### 5.4 搜索下拉高度必须运行时量

移动端托盘贴底、搜索栏在托盘顶部，下方可用空间随视口高度与托盘内容变化。写死 `max-height: 252px` 在 852 高的屏幕上只剩 164px，下拉底部会冲出屏幕、结果被裁且点不到。

`fitListHeight()` 运行时量「搜索框底边 → 视口底边」，写内联值，并监听 `resize` / `visualViewport` / `orientationchange`。超出条目在下拉内部滚动。

### 5.5 先收面板再展开工具条

测量工具条、底图菜单这类从主面板派生的浮层，必须先 `collapsePanelThen()` 收起主面板、等动画结束再展开自己。否则两者同时在屏幕上互相压叠。

`collapsePanelThen` 导出在 `initUI` 之外，因为 `main.js` 里 `initMeasureUI()` 早于 `initUI()`。

### 5.6 `<div>` 的 disabled 是假的

`#buildingsToggleBtn` 这类 `<div role="button">` 赋 `.disabled` 没有原生效果：浏览器不拦点击，`:disabled` 也匹配不到，灰化只是视觉。

配套做法：`hd-layers.js` 集中维护「可点击标志 + `aria-disabled` + 视觉」，`ui.js` 在 click 里读标志真正拦截。

---

## 6. 字体、图标与提示

### 6.1 Montserrat 只管拉丁

源用 `fonts.loli.net` 镜像（反代 Google Fonts，`googleapis` 国内不可达）。该 CSS 已按 `unicode-range` 切好子集且**不含 CJK**：英文走 Montserrat，中文自动回落 `--font-ui` 后面的苹方 / 微软雅黑。

`display=swap`：字体没到先用系统字体顶上，不白屏。镜像失效时整条字体栈退回系统字体。

字体栈只在 `css/themes.css` 的 `--font-ui` 定义，共 5 处引用（`base.css` 两条 body 规则、`modals.css`、`settings.css` 两条、`toast.css`）。**改要一起改**——`base.css` 里两条 body 规则后者会覆盖前者。

### 6.2 全站 UI 不出现 emoji

`showToast()` 会把开头 emoji 解析成同语义的内联 SVG（`ToastIcons`），渲染为「图标 + 文字」。所以调用点保留 emoji 前缀是**有意为之**，新增时确认 emoji 与目标 key 都在映射表里，否则静默降级为 info 图标。

`js/settings.js` 是普通脚本（非 module，无法 import），内联了一份最小映射——改 `utils.js` 记得同步。

### 6.3 图标与文字的对齐

`.ui-icon + *` 只匹配**元素**节点：图标后跟纯文本时拿不到间距。

- 行内流（按钮、菜单项）：容器 `display: flex; gap`，并写 `.ui-icon + * { margin-left: 0 }` 抵消。
- 段落：`.modal-box p > .ui-icon { margin-right: .45em }`。

### 6.4 按钮图标一律内联 SVG

`index.html` 有一套 symbol 精灵图，只给 `.ui-icon` 用。**按钮图标不要用 `<use href="#i-...">`**：symbol 自带 `stroke` 属性，会与 CSS 的颜色/线宽冲突。

---

## 7. 底图与街景

### 7.1 腾讯街景的接口与三态

- 官方网页街景 `map.qq.com/?type=street` 已不可用（任何坐标都是空白），改跳社区查看器 `qq-map.netlify.app`（three.js 自渲染腾讯全景瓦片）。
- 跳转 URL 的 `center` 是 **`lat,lng`**，与常见的 `lng,lat` 相反。
- 反查最近场景点：`sv.map.qq.com/xf?lat=&lng=&r=&output=json`，**必须 GCJ-02**，响应体是 **GBK**（先 `arrayBuffer` 再 `TextDecoder('gbk')`，直接 `.json()` 会乱码）。
- 非公开接口，无稳定性承诺。调用方按三态分流：

| status | 含义 | 行为 |
|---|---|---|
| `found` | 确认有街景 | 带 `pano` 直达全景 |
| `none` | 接口正常，附近确实没采集点 | **不跳转**，只提示（跳过去只有空白，像功能坏了） |
| `unknown` | 超时 / 失败 / 接口改版 | 降级跳转（不带 pano），措辞不承诺有蓝线 |

### 7.2 底图选择器要抬层级

菜单展开期间给宿主列（`#camera-controls`）加 `.basemap-open`，把整列抬到 `--z-menu`。否则菜单会被相邻控件压住。

### 7.3 谷歌模式必须恢复底图

进入谷歌模式会 `imageryLayers.removeAll()` 清空所有影像图层。**正常退出与加载失败降级都必须恢复底图**，否则留下一个全黑的球。恢复逻辑统一在 `imagery.js` 的 `restoreDefaultBasemap()`（重建 Sentinel-2 并复位叠加层状态）。

---

## 8. 构建、缓存与测试

### 8.1 前端测试的三个坑

- **依赖 DOM 的模块不能用裸 node 跑**：`utils.js` 顶层就访问 `document`。必须起静态服务器，在浏览器里 `await import()`（`tests/*.test.html` 那一套）。
- **几何断言要 `deviceScaleFactor: 2`**：`camera-feel` 的动态分辨率断言在 dpr=1 时退化成空测试（`maxScale === MIN_SCALE === 1`），永远通过。
- **headless 下的 Cesium ion 请求必然失败**：403 / 404 / 408 是 token 限域与无网络权限造成的环境噪音，与代码无关。断言前按 URL 过滤掉 `assets.ion.cesium.com` 与 `unpkg.com/cesium`。

### 8.2 用 stub 测业务模块

`tmp/cesium-stub.js` 提供最小 Cesium 替身，配合 importmap 把 `cesium` 指过去，页面直接 `fetch` 真实 `index.html` 复用 DOM。这样能测「画图 → 保存 → 列表 → 导出」整条链路，不需要 WebGL 与网络。

实测几何（是否贴地、是否 clampToGround）不要遍历 `scene.primitives`（类名被压缩，`instanceof` 不可靠）。改用 `PolylineGeometryUpdater(entity, scene).createFillGeometryInstance(time).geometry` 判断，多边形用 `PolygonGeometryUpdater.prototype._isOnTerrain()`。

### 8.3 `CACHE_VERSION` 什么时候要加

改了 `sw.js` 或任意首屏资源的内容，就要加一，否则新 SW 不会重跑 `install`、`SHELL_URLS` 里的新文件进不了缓存。

**只改注释时可以不加**：字节变了但行为不变，不必让用户重下一遍外壳资源。

---

