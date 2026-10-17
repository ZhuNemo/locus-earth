package dev.locusearth.app

import android.Manifest
import android.annotation.SuppressLint
import android.app.DownloadManager
import android.content.ActivityNotFoundException
import android.content.Intent
import android.content.pm.PackageManager
import android.graphics.Bitmap
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.os.Environment
import android.os.Message
import android.util.Log
import android.view.View
import android.view.ViewGroup
import android.webkit.GeolocationPermissions
import android.webkit.ValueCallback
import android.webkit.WebChromeClient
import android.webkit.WebResourceError
import android.webkit.WebResourceRequest
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.FrameLayout
import android.widget.Toast
import androidx.activity.OnBackPressedCallback
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import androidx.core.splashscreen.SplashScreen
import androidx.core.splashscreen.SplashScreen.Companion.installSplashScreen
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat
import androidx.core.view.WindowInsetsControllerCompat
import androidx.webkit.WebSettingsCompat
import androidx.webkit.WebViewFeature
import java.util.concurrent.atomic.AtomicBoolean

/**
 * Locus Earth 的 Android 外壳。
 *
 * 全部行为都落在这一层：一个铺满屏幕的 WebView 加载远端网页，
 * 白名单内的域名（两个）留壳里，其余链接出壳交给系统浏览器。
 *
 * 刻意**没有**做的几件事（需求 §9）：
 *   · 没有自定义 WebView 内核，没有嵌 GeckoView / Chromium
 *   · 没有 Bubblewrap / TWA
 *   · 没有 addJavascriptInterface：网页拿不到任何原生能力，壳也不会被网页牵着走
 *   · 没有多模块、没有 app/ 之外的结构
 *
 * 额外加的一件"需求没写但必要"的事：onRenderProcessGone 的处理（见 recreateWebView）。
 * Cesium 场景吃内存，渲染进程被回收时如果不接管，用户看到的是"应用闪退"。
 */
class MainActivity : AppCompatActivity() {

    private lateinit var rootView: FrameLayout
    private lateinit var fullscreenContainer: FrameLayout
    private lateinit var webView: WebView

    /** 网页第一帧是否已可见 —— 启动页续命的唯一放行条件 */
    private val pageFirstVisible = AtomicBoolean(false)

    /** 启动页兜底超时：断网/极端卡顿也不许把用户锁死在启动页上 */
    private val splashTimedOut = AtomicBoolean(false)

    /** 接驳用 WebView：不参与渲染，只用来把 window.open 的目标 URL 截下来 */
    private var probeWebView: WebView? = null

    /** 一次新窗口请求只路由一次（shouldOverrideUrlLoading 和 onPageStarted 双保险，别重复处理） */
    private var probeRouted = false

    /** 全屏视频用的临时视图 */
    private var customView: View? = null
    private var customViewCallback: WebChromeClient.CustomViewCallback? = null

    /** 重建中标志，避免递归重建 */
    private var recreating = false

    /**
     * 等待系统定位权限结果的 WebView 回调。
     * 用队列而不是单个变量：网页可能在权限弹窗还开着的时候又发起一次定位请求。
     */
    private val pendingGeoPrompts = mutableListOf<Pair<String, GeolocationPermissions.Callback>>()

    /**
     * 等待文件选择结果的 WebView 回调（网页的 <input type="file">）。
     *
     * 必须保存下来并且在**任何**结束路径上作答（选中 / 取消都要），
     * 漏答一次会让网页那个 input 永久卡住，之后连点击都不再有反应。
     */
    private var pendingFilePathCallback: ValueCallback<Array<Uri>>? = null

    private val locationPermissionLauncher =
        registerForActivityResult(ActivityResultContracts.RequestMultiplePermissions()) { result ->
            val granted = result.values.any { it }
            val pending = pendingGeoPrompts.toList()
            pendingGeoPrompts.clear()
            // 无论允许还是拒绝都必须回答 WebView，否则网页的定位回调会一直挂着
            pending.forEach { (origin, callback) -> callback.invoke(origin, granted, false) }
        }

    /**
     * 选文件（收藏夹导入专用）。
     *
     * 用 ACTION_GET_CONTENT + CATEGORY_OPENABLE 而不是存储权限：
     * SAF 由系统文件选择器授权单次访问，**不需要申请任何存储读写权限**，
     * 与工程「只申请三项权限」的约定一致。
     */
    private val fileChooserLauncher =
        registerForActivityResult(ActivityResultContracts.StartActivityForResult()) { result ->
            deliverFileChooserResult(
                WebChromeClient.FileChooserParams.parseResult(result.resultCode, result.data)
            )
        }

    // ========================================================================
    // 生命周期
    // ========================================================================

    override fun onCreate(savedInstanceState: Bundle?) {
        // 必须在 super.onCreate 之前：启动页主题要先于窗口生效，避免白屏/黑屏闪一下
        val splash = installSplashScreen()

        super.onCreate(savedInstanceState)

        // 明确保持"系统栏不覆盖内容"：targetSdk 34 时这是默认行为，
        // 写出来是为了将来有人把 targetSdk 提到 35（系统强制沉浸式）时能立刻看到这一行，
        // 届时需要改成给 WebView 加 WindowInsets 内边距，否则网页顶部/底部会被系统栏压住。
        WindowCompat.setDecorFitsSystemWindows(window, true)

        setContentView(R.layout.activity_main)
        rootView = findViewById(R.id.root)
        fullscreenContainer = findViewById(R.id.fullscreenContainer)

        AssetsLoader.init(this)

        // 首次启动先给一屏「这是一个网页应用」（整页，不是弹窗），
        // 用户点「进入」后才开始建 WebView。
        // 顺序很重要：点「退出」时不应该已经白花流量去加载地球。
        // 这一屏挂在 Activity 根布局上，旋转/切深浅色由 configChanges 接管、
        // Activity 不重建，所以它天然不会被系统提前收走。
        if (WelcomeScreen.shouldShow(this, fromExternalLink = false)) {
            showWelcomeScreen()
        } else {
            // 直接加载网页：让启动页挡到网页画出第一帧为止
            holdSplashUntilFirstFrame(splash)
            setupWebView()
        }
    }

    /**
     * 让启动页一直挡着，直到 WebView 画出第一帧。
     *
     * 商业浏览器的做法是"启动画面在用户看到内容那一刻才消失"，而不是窗口首帧。
     * 这个应用首屏要拉 Cesium 场景，中间有几百毫秒到几秒的空档；
     * 不挡的话观感是「启动页 → 白/黑屏 → 地球」三段跳。
     *
     * ⚠️ 两个实现约束，改之前先看：
     *  1. `setKeepOnScreenCondition` 必须**在 setContentView 之后**调用 ——
     *     它内部要 `findViewById(android.R.id.content)`，content 还没建好时会 NPE；
     *  2. 条件只在 pre-draw 时求值，而启动页挡着时系统不再派发绘制，
     *     所以超时兜底必须自己 invalidate 一次，否则永远等不到下一次 pre-draw。
     */
    private fun holdSplashUntilFirstFrame(splash: SplashScreen) {
        splash.setKeepOnScreenCondition { !pageFirstVisible.get() && !splashTimedOut.get() }
        rootView.postDelayed({
            if (pageFirstVisible.get()) return@postDelayed
            Log.w(TAG, "启动页等待 ${SPLASH_TIMEOUT_MS}ms 仍未收到首帧，放行（断网或页面卡住）")
            splashTimedOut.set(true)
            rootView.invalidate()
        }, SPLASH_TIMEOUT_MS)
    }

    /** 展示首次启动的全屏提示；两条出口都对应明确的用户意图 */
    private fun showWelcomeScreen() {
        WelcomeScreen.show(
            rootView,
            onEnter = { setupWebView() },
            onExit = { finishAffinity() },
        )
    }

    /**
     * 建主 WebView 并开始加载。
     *
     * 单独抽成方法而不是留在 onCreate 里：首次启动要等提示页点了「进入」才走到这里，
     * 用 isInitialized 兜住「重复回调」造成的重复初始化。
     */
    private fun setupWebView() {
        if (::webView.isInitialized) return

        webView = createMainWebView()
        // 放在 index 0：全屏容器始终压在它上面
        rootView.addView(webView, 0)

        // 返回键：能后退就后退，否则退出。用 OnBackPressedCallback 而不是重写
        // onBackPressed()，这样才能正确兼容 Android 13+ 的预测性返回手势
        // （清单里 enableOnBackInvokedCallback="true"）。
        onBackPressedDispatcher.addCallback(
            this,
            object : OnBackPressedCallback(true) {
                override fun handleOnBackPressed() {
                    // 全屏视频时，返回键先退出全屏
                    if (customView != null) {
                        hideFullscreen()
                        return
                    }
                    if (::webView.isInitialized && webView.canGoBack()) {
                        webView.goBack()
                    } else {
                        finish()
                    }
                }
            },
        )
    }

    override fun onDestroy() {
        customView?.let { fullscreenContainer.removeView(it) }
        customView = null
        customViewCallback = null

        probeWebView?.let {
            it.stopLoading()
            it.destroy()
        }
        probeWebView = null

        if (::webView.isInitialized) {
            // 必须先脱离父容器再 destroy，否则 WebView 会拽着 Activity 一起泄漏
            (webView.parent as? ViewGroup)?.removeView(webView)
            webView.stopLoading()
            webView.destroy()
        }

        super.onDestroy()
    }

    // ========================================================================
    // WebView 装配
    // ========================================================================

    /**
     * 创建主 WebView。
     * 之所以用代码创建而不是写进 XML：渲染进程崩溃后需要换一个新的实例（recreateWebView），
     * 两条路径共用同一个工厂方法最不容易走岔。
     *
     * 这里集中了几个"向商业浏览器看齐"的开关，逐条说明写在下面。
     */
    @SuppressLint("SetJavaScriptEnabled")
    @Suppress("DEPRECATION")
    // bfcache 是 androidx 的实验性 API（可能在不换大版本的情况下调整签名），
    // 这里显式 opt-in：收益明确（治 settings.html 返回时重建 Cesium 场景），
    // 且依赖版本是锁死的，真要调整也是在升级 androidx.webkit 时才发生，到时一起改。
    @OptIn(WebSettingsCompat.ExperimentalBackForwardCache::class)
    private fun createMainWebView(): WebView = WebView(this).apply {
        layoutParams = FrameLayout.LayoutParams(
            FrameLayout.LayoutParams.MATCH_PARENT,
            FrameLayout.LayoutParams.MATCH_PARENT,
        )

        // 底色跟随主题（白 / 深蓝黑），避免深色模式下先刷一帧白
        setBackgroundColor(ContextCompat.getColor(context, R.color.shell_background))
        // 地球应用：不要滚动条、不要边缘发光
        overScrollMode = View.OVER_SCROLL_NEVER
        isVerticalScrollBarEnabled = false
        isHorizontalScrollBarEnabled = false
        // 长按不干预：Cesium 有自己的长按手势，壳不去抢事件

        settings.apply {
            javaScriptEnabled = true
            domStorageEnabled = true          // localStorage：书签、设置项
            databaseEnabled = true            // IndexedDB
            mediaPlaybackRequiresUserGesture = false
            setGeolocationEnabled(true)       // 已废弃，但老内核仍靠它给定位开闸，留着无害

            // 网页走 https，壳也只允许 https，所以禁止混合内容
            mixedContentMode = WebSettings.MIXED_CONTENT_NEVER_ALLOW

            // 本地资源走 AssetsLoader 的虚拟 https 域名，因此关掉文件/内容访问，
            // 顺手把 file:// 页面互相读文件的两个开关也钉死
            allowFileAccess = false
            allowContentAccess = false
            allowFileAccessFromFileURLs = false
            allowUniversalAccessFromFileURLs = false

            // 缓存交给网页自己的 Service Worker 管，壳不插手、也不主动清缓存
            cacheMode = WebSettings.LOAD_DEFAULT

            // UA 末尾追加标记，网页端可用 navigator.userAgent 识别"跑在 Android 外壳里"
            userAgentString = userAgentString + DomainPolicy.UA_SUFFIX

            // 放开 window.open 的弹窗拦截。
            // 原因很具体：网页里的街景按钮是"先 await 查接口，查到再 window.open"，
            // 用户手势早就被 await 吃掉了，默认设置下这次 window.open 会被直接吞掉，
            // 表现就是"点了街景没反应"。放开之后每次新窗口都会走 onCreateWindow 统一裁决。
            javaScriptCanOpenWindowsAutomatically = true
            setSupportMultipleWindows(true)

            // 缩放完全交给网页（Cesium 自己处理双指/双击）。
            // 关掉 WebView 自带的缩放仲裁，触摸事件少一层判定，直接进页面，地球更跟手。
            setSupportZoom(false)

            // Back/Forward Cache（bfcache，等价于 Chrome 的同名机制）：
            // settings.html 是整页跳转，命中 bfcache 时返回**不重新加载** Cesium 场景、
            // 相机视角不丢 —— 这正是 README §16 里"设置页返回导致主页面重新加载"的解法。
            // 能力由 WebView 内核版本决定，不支持的设备上原样不动。
            if (WebViewFeature.isFeatureSupported(WebViewFeature.BACK_FORWARD_CACHE)) {
                WebSettingsCompat.setBackForwardCacheEnabled(this, true)
            }
        }

        if (Build.VERSION.SDK_INT >= 26) {
            // Cesium 场景吃内存。把渲染进程标成"重要且不可豁免"：系统要回收进程时
            // 会先动别人，等价于浏览器里"前台标签"的优先级。
            // 代价是应用退到后台时进程更难被回收 —— 对一个单页 3D 应用这是划算的。
            setRendererPriorityPolicy(WebView.RENDERER_PRIORITY_IMPORTANT, false)
        }

        webViewClient = AppWebViewClient(
            onExternalUri = { uri -> openExternally(uri) },
            onMainFrameError = { failedUrl, error -> showErrorPage(failedUrl, error) },
            onRendererGone = { scheduleRecreateWebView() },
            // 首帧已绘制 → 放开启动页。AtomicBoolean 只置 true，不会回退，
            // 后续导航（含 bfcache 命中）都不会再影响启动页。
            onFirstContentVisible = { pageFirstVisible.set(true) },
        )

        webChromeClient = AppWebChromeClient(
            onGeoPrompt = { origin, callback -> handleGeolocationPrompt(origin, callback) },
            onNewWindowRequest = { message -> handleCreateWindow(message) },
            onShowFullscreen = { view, callback -> showFullscreen(view, callback) },
            onHideFullscreen = { hideFullscreen() },
            onShowFileChooser = { callback, params -> handleShowFileChooser(callback, params) },
        )

        // 下载兜底（http/https 直链；blob 下载的限制见 setupDownloadListener 注释）
        // ⚠️ 必须把「正在创建的这个」实例传进去，不能让被调用方去读字段 webView：
        //    此刻字段还没赋值（`webView = createMainWebView()` 要等方法返回才执行），
        //    直接读字段会抛 UninitializedPropertyAccessException（lateinit property
        //    webView has not been initialized），表现为一打开就闪退。
        setupDownloadListener(this)

        if (BuildConfig.DEBUG) {
            // 调试包可以在 chrome://inspect 里远程调试（正式包不生效）
            WebView.setWebContentsDebuggingEnabled(true)
        }

        loadUrl(DomainPolicy.START_URL)
    }

    // ========================================================================
    // 新窗口（window.open / target="_blank"）
    // ========================================================================

    /**
     * 需求 §4.3：白名单内 → 当前 WebView 加载；否则 → 系统浏览器；不弹新 Activity。
     *
     * 实现上必须先给系统一个 WebView 才能拿到目标 URL（Android 的 onCreateWindow
     * 没有"给我 URL 但我不建窗口"这种选项）。所以这里塞一个不渲染、不执行脚本的
     * 接驳 WebView 进去，把它的**每一次导航都拦下来**，取出 URL 后再决定去向。
     */
    private fun handleCreateWindow(resultMsg: Message): Boolean {
        val transport = resultMsg.obj as? WebView.WebViewTransport ?: return false
        probeRouted = false
        transport.webView = obtainProbeWebView()
        resultMsg.sendToTarget()
        return true
    }

    private fun obtainProbeWebView(): WebView {
        probeWebView?.let { return it }

        val probe = WebView(this).apply {
            settings.javaScriptEnabled = false              // 只取 URL，不执行任何脚本
            settings.javaScriptCanOpenWindowsAutomatically = false
            settings.allowFileAccess = false
            settings.allowContentAccess = false
            settings.domStorageEnabled = false

            webViewClient = object : WebViewClient() {
                override fun shouldOverrideUrlLoading(view: WebView, request: WebResourceRequest): Boolean {
                    val uri = request.url
                    // about:blank 是被创建出来的空文档，放行即可，别当目标地址处理
                    if (uri.scheme == "about") return false
                    view.stopLoading()
                    routeNewWindow(uri)
                    // 一律拦截：这个 WebView 永远不会真的加载任何东西
                    return true
                }

                override fun onPageStarted(view: WebView, url: String?, favicon: Bitmap?) {
                    // 兜底：个别内核对"新窗口"的首次加载不走 shouldOverrideUrlLoading，
                    // 那就用 onPageStarted 再抓一次（probeRouted 保证不会重复处理）
                    val uri = url?.let { Uri.parse(it) }
                    if (uri != null && uri.scheme != "about") {
                        view.stopLoading()
                        routeNewWindow(uri)
                    }
                }
            }
        }

        probeWebView = probe
        return probe
    }

    private fun routeNewWindow(uri: Uri) {
        if (probeRouted) return
        probeRouted = true

        when {
            DomainPolicy.isAllowedUri(uri) -> webView.loadUrl(uri.toString())
            DomainPolicy.isExternallyOpenable(uri) -> openExternally(uri)
            else -> Log.w(TAG, "新窗口请求的 scheme 不受支持，已忽略: $uri")
        }
    }

    // ========================================================================
    // 定位权限
    // ========================================================================

    private fun handleGeolocationPrompt(origin: String, callback: GeolocationPermissions.Callback) {
        if (hasLocationPermission()) {
            // 已经有系统权限，直接放行（retain=false：不写进 WebView 自己的记忆，
            // 每次都由壳回答，避免两套权限状态打架）
            callback.invoke(origin, true, false)
            return
        }
        pendingGeoPrompts.add(origin to callback)
        locationPermissionLauncher.launch(
            arrayOf(
                Manifest.permission.ACCESS_FINE_LOCATION,
                Manifest.permission.ACCESS_COARSE_LOCATION,
            ),
        )
    }

    private fun hasLocationPermission(): Boolean {
        val fine = ContextCompat.checkSelfPermission(this, Manifest.permission.ACCESS_FINE_LOCATION)
        val coarse = ContextCompat.checkSelfPermission(this, Manifest.permission.ACCESS_COARSE_LOCATION)
        return fine == PackageManager.PERMISSION_GRANTED || coarse == PackageManager.PERMISSION_GRANTED
    }

    // ========================================================================
    // 文件选择（网页的 <input type="file">）
    // ========================================================================

    /**
     * 网页点击 `<input type="file">` 时被 WebChromeClient 转到这里。
     *
     * 这是收藏夹「导入」在壳里能工作的前提：没有它，点击毫无反应
     * （WebView 默认不处理，网页的 change 事件永远等不到文件）。
     *
     * 用 ACTION_GET_CONTENT 让系统文件选择器接管，因此**不需要任何存储权限**。
     */
    private fun handleShowFileChooser(
        filePathCallback: ValueCallback<Array<Uri>>,
        params: WebChromeClient.FileChooserParams,
    ): Boolean {
        // 上一次的回调还没作答就又来一次（例如连点两下）：先把旧的取消掉，
        // 否则那个 input 会永久卡住，而且旧的 callback 再也无人可达。
        pendingFilePathCallback?.onReceiveValue(null)

        pendingFilePathCallback = filePathCallback

        val intent = Intent(Intent.ACTION_GET_CONTENT).apply {
            addCategory(Intent.CATEGORY_OPENABLE)
            // 网页写的是 accept=".csv,.txt"，WebView 会翻成 MIME 类型传进来；
            // 逐个过滤成合法 MIME，坏值会让系统文件选择器直接抛异常。
            val mimeTypes = params.acceptTypes
                .filter { it.isNotBlank() && it.contains('/') && !it.contains(',') }
            type = if (mimeTypes.size == 1) mimeTypes[0] else "*/*"
            if (mimeTypes.size > 1) {
                putExtra(Intent.EXTRA_MIME_TYPES, mimeTypes.toTypedArray())
            }
            // 允许一次选多个，与 FileChooserParams.MODE_OPEN_MULTIPLE 对应
            if (params.mode == WebChromeClient.FileChooserParams.MODE_OPEN_MULTIPLE) {
                putExtra(Intent.EXTRA_ALLOW_MULTIPLE, true)
            }
        }

        return try {
            fileChooserLauncher.launch(intent)
            true
        } catch (e: ActivityNotFoundException) {
            // 设备上没有文件选择器（极罕见）：必须作答，否则网页那个 input 卡死
            Log.w(TAG, "没有可用的文件选择器", e)
            deliverFileChooserResult(null)
            Toast.makeText(this, "没有可用的文件管理器", Toast.LENGTH_SHORT).show()
            false
        }
    }

    /**
     * 把选择结果交回网页。
     *
     * ⚠️ 无论用户是选中文件还是点了取消，**都必须**调用一次 onReceiveValue：
     * 取消要传 null。漏答会让网页的 <input type="file"> 永久处于等待状态。
     */
    private fun deliverFileChooserResult(uris: Array<Uri>?) {
        val callback = pendingFilePathCallback ?: return
        pendingFilePathCallback = null
        callback.onReceiveValue(uris)
    }

    // ========================================================================
    // 下载（兜底）
    // ========================================================================

    /**
     * 下载兜底。
     *
     * 背景：网页的收藏夹导出优先走 `navigator.share()`（系统分享面板，可存到「文件」），
     * 桌面浏览器则回退到 `<a download>` + blob。
     *
     * ⚠️ 这里**存不下 blob: 下载**：blob 的字节只存在于渲染进程里，
     * DownloadListener 拿到的只是一个 `blob:https://...` 字符串，原生侧读不到内容。
     * 所以 blob 场景只能靠网页那边走分享通路，这个监听器负责的是
     * http/https 直链（以及将来网页可能新增的下载入口）。
     *
     * [target] 是**正在创建的**那个 WebView，不是字段 `webView`：
     * 工厂方法返回之前字段还处于未初始化状态，这里不能去读它。
     * 两条创建路径（首次 setupWebView / 渲染进程崩溃后的 recreateWebView）
     * 共用同一个工厂，因此监听器也在这里一并挂上。
     */
    private fun setupDownloadListener(target: WebView) {
        target.setDownloadListener { url, _, contentDisposition, mimeType, _ ->
            if (url.startsWith("blob:")) {
                Log.w(TAG, "blob: 下载无法在壳内保存，请改用系统分享导出: $url")
                Toast.makeText(this, "请用「导出」里的系统分享保存文件", Toast.LENGTH_LONG).show()
                return@setDownloadListener
            }

            val uri = Uri.parse(url)
            if (!DomainPolicy.isAllowedUri(uri) && !url.startsWith("data:")) {
                Log.w(TAG, "拒绝下载非白名单地址: $url")
                return@setDownloadListener
            }

            try {
                val request = DownloadManager.Request(uri).apply {
                    setMimeType(mimeType)
                    setNotificationVisibility(
                        DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED
                    )
                    // 落到系统「下载」目录，不需要存储权限
                    setDestinationInExternalPublicDir(
                        Environment.DIRECTORY_DOWNLOADS,
                        android.webkit.URLUtil.guessFileName(url, contentDisposition, mimeType),
                    )
                }
                val manager = getSystemService(DOWNLOAD_SERVICE) as DownloadManager
                manager.enqueue(request)
                Toast.makeText(this, "已开始下载", Toast.LENGTH_SHORT).show()
            } catch (e: Exception) {
                Log.w(TAG, "下载失败: $url", e)
                Toast.makeText(this, "下载失败", Toast.LENGTH_SHORT).show()
            }
        }
    }

    // ========================================================================
    // 出壳 / 错误页
    // ========================================================================

    private fun openExternally(uri: Uri) {
        try {
            startActivity(Intent(Intent.ACTION_VIEW, uri))
        } catch (e: ActivityNotFoundException) {
            // 设备上没有能处理该 scheme 的应用：别崩，给一句提示回到地球
            Log.w(TAG, "没有应用可以打开 $uri", e)
            Toast.makeText(this, "没有可以打开该链接的应用", Toast.LENGTH_SHORT).show()
        }
    }

    /**
     * 展示本地错误页（assets/error.html，断网也能打开）。
     *
     * 失败信息通过 URL 的 **fragment** 传给页面，而不是 query：
     * fragment 不参与资源路径匹配，因此 WebViewAssetLoader 定位 /assets/error.html
     * 一定不会受影响。页面本身用一小段脚本读 location.hash 渲染出来。
     */
    private fun showErrorPage(failedUrl: Uri?, error: WebResourceError?) {
        if (!::webView.isInitialized) return

        val fragment = buildString {
            append("target=").append(Uri.encode(failedUrl?.toString() ?: DomainPolicy.START_URL))
            append("&code=").append(error?.errorCode ?: 0)
            append("&desc=").append(Uri.encode(error?.description?.toString() ?: ""))
        }

        val errorPageUrl = Uri.parse(AssetsLoader.ERROR_PAGE_URL)
            .buildUpon()
            .encodedFragment(fragment)
            .build()

        webView.loadUrl(errorPageUrl.toString())
    }

    // ========================================================================
    // 全屏视频（占位钩子）
    // ========================================================================

    private fun showFullscreen(view: View, callback: WebChromeClient.CustomViewCallback) {
        // 已经有全屏视图时不叠加，按契约回调 onCustomViewHidden 让网页自己收尾
        if (customView != null) {
            callback.onCustomViewHidden()
            return
        }

        customView = view
        customViewCallback = callback
        fullscreenContainer.addView(
            view,
            FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT,
                FrameLayout.LayoutParams.MATCH_PARENT,
            ),
        )
        fullscreenContainer.visibility = View.VISIBLE
        webView.visibility = View.INVISIBLE

        WindowInsetsControllerCompat(window, window.decorView).apply {
            systemBarsBehavior = WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
            hide(WindowInsetsCompat.Type.systemBars())
        }
    }

    private fun hideFullscreen() {
        val view = customView ?: return
        fullscreenContainer.removeView(view)
        fullscreenContainer.visibility = View.GONE
        webView.visibility = View.VISIBLE
        customView = null

        // 必须回调，否则网页里那个 <video> 会一直以为自己还在全屏
        customViewCallback?.onCustomViewHidden()
        customViewCallback = null

        WindowInsetsControllerCompat(window, window.decorView)
            .show(WindowInsetsCompat.Type.systemBars())
    }

    // ========================================================================
    // 渲染进程崩溃后重建
    // ========================================================================

    private fun scheduleRecreateWebView() {
        if (!::webView.isInitialized) return
        // 不在自己的回调栈里立刻销毁 WebView，抛到下一帧更稳
        rootView.post { recreateWebView() }
    }

    /**
     * 渲染进程没了（被系统回收或崩溃）之后重建 WebView。
     * 按官方建议：必须销毁旧的，否则后续加载会连到一个已经死掉的渲染进程上。
     */
    private fun recreateWebView() {
        if (recreating) return
        recreating = true
        try {
            val dead = webView
            (dead.parent as? ViewGroup)?.removeView(dead)
            dead.stopLoading()
            dead.destroy()

            // 回到首页。用户当前视角/未保存的操作会丢，但总比整个应用闪退好
            webView = createMainWebView()
            rootView.addView(webView, 0)
        } finally {
            recreating = false
        }
    }

    private companion object {
        const val TAG = "LocusEarthShell"

        /** 启动页等首帧的上限。无网时不会超过它，不会把用户锁死在启动页上 */
        const val SPLASH_TIMEOUT_MS = 6000L
    }
}
