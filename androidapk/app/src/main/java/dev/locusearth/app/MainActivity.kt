package dev.locusearth.app

import android.Manifest
import android.annotation.SuppressLint
import android.content.ActivityNotFoundException
import android.content.Intent
import android.content.pm.PackageManager
import android.graphics.Bitmap
import android.net.Uri
import android.os.Bundle
import android.os.Message
import android.util.Log
import android.view.View
import android.view.ViewGroup
import android.webkit.GeolocationPermissions
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
import androidx.core.splashscreen.SplashScreen.Companion.installSplashScreen
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat
import androidx.core.view.WindowInsetsControllerCompat

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

    private val locationPermissionLauncher =
        registerForActivityResult(ActivityResultContracts.RequestMultiplePermissions()) { result ->
            val granted = result.values.any { it }
            val pending = pendingGeoPrompts.toList()
            pendingGeoPrompts.clear()
            // 无论允许还是拒绝都必须回答 WebView，否则网页的定位回调会一直挂着
            pending.forEach { (origin, callback) -> callback.invoke(origin, granted, false) }
        }

    // ========================================================================
    // 生命周期
    // ========================================================================

    override fun onCreate(savedInstanceState: Bundle?) {
        // 必须在 super.onCreate 之前：启动页主题要先于窗口生效，避免白屏/黑屏闪一下
        installSplashScreen()

        super.onCreate(savedInstanceState)

        // 明确保持"系统栏不覆盖内容"：targetSdk 34 时这是默认行为，
        // 写出来是为了将来有人把 targetSdk 提到 35（系统强制沉浸式）时能立刻看到这一行，
        // 届时需要改成给 WebView 加 WindowInsets 内边距，否则网页顶部/底部会被系统栏压住。
        WindowCompat.setDecorFitsSystemWindows(window, true)

        setContentView(R.layout.activity_main)
        rootView = findViewById(R.id.root)
        fullscreenContainer = findViewById(R.id.fullscreenContainer)

        AssetsLoader.init(this)

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
                    if (webView.canGoBack()) {
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
     */
    @SuppressLint("SetJavaScriptEnabled")
    @Suppress("DEPRECATION")
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
        }

        webViewClient = AppWebViewClient(
            onExternalUri = { uri -> openExternally(uri) },
            onMainFrameError = { failedUrl, error -> showErrorPage(failedUrl, error) },
            onRendererGone = { scheduleRecreateWebView() },
        )

        webChromeClient = AppWebChromeClient(
            onGeoPrompt = { origin, callback -> handleGeolocationPrompt(origin, callback) },
            onNewWindowRequest = { message -> handleCreateWindow(message) },
            onShowFullscreen = { view, callback -> showFullscreen(view, callback) },
            onHideFullscreen = { hideFullscreen() },
        )

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
    }
}
