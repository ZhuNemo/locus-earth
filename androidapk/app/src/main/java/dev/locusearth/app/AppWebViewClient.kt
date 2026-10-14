package dev.locusearth.app

import android.graphics.Bitmap
import android.net.Uri
import android.util.Log
import android.webkit.RenderProcessGoneDetail
import android.webkit.WebResourceError
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebView
import android.webkit.WebViewClient

/**
 * 主框架导航的裁决者。
 *
 * 分工（需求 §4）：
 *   · shouldOverrideUrlLoading —— 只裁决**顶层导航**：白名单内留壳里，其余丢系统浏览器
 *   · shouldInterceptRequest   —— 只服务于本地 assets 的虚拟域名，绝不拦真实资源
 *   · onReceivedError          —— 主框架失败时切到本地错误页
 *
 * 关于 SSL：这里**故意不重写 onReceivedSslError**。
 * 一旦重写并调用 handler.proceed()，就等于给所有证书错误开了后门（中间人可读全站流量）。
 * 保持父类默认行为 = 证书有问题就直接失败，这是壳该有的态度。
 */
class AppWebViewClient(
    private val onExternalUri: (Uri) -> Unit,
    private val onMainFrameError: (Uri, WebResourceError) -> Unit,
    private val onRendererGone: () -> Unit,
) : WebViewClient() {

    // ---------- 1. 顶层导航 ----------

    /** API 24+ 只会走下面那个 WebResourceRequest 重载；保留旧重载是为了 minSdk 被调低时不静默失效 */
    @Suppress("DEPRECATION", "OVERRIDE_DEPRECATION")
    override fun shouldOverrideUrlLoading(view: WebView, url: String): Boolean = decideUrl(url)

    override fun shouldOverrideUrlLoading(view: WebView, request: WebResourceRequest): Boolean =
        decideUrl(request.url.toString())

    /**
     * @return false = 交给 WebView 在壳内加载；true = 壳自己处理了（一般是转给系统浏览器）
     */
    private fun decideUrl(url: String): Boolean {
        val uri = Uri.parse(url)

        // 白名单内的 https（含子域）：留在壳里
        if (DomainPolicy.isAllowedUri(uri)) return false

        // 壳内部的虚拟域名（本地错误页）
        if (AssetsLoader.isAssetUri(uri)) return false

        // 网页内部产物：about:blank、data:、blob:、javascript:。
        // 丢给系统浏览器它们也打不开，必须留在 WebView 里。
        if (uri.scheme in INTERNAL_SCHEMES) return false

        if (DomainPolicy.isExternallyOpenable(uri)) {
            onExternalUri(uri)
            return true
        }

        // 未知 scheme：不弹系统选择器、也不崩，直接吞掉并留一条日志
        Log.w(TAG, "已忽略不支持的链接: $uri")
        return true
    }

    // ---------- 2. 子资源 ----------

    /**
     * ⚠️ 需求 §4.2：**不要**在这里拦图片 / JS / CSS / CDN。
     * Cesium 的瓦片、terrain、ion 资产、天地图/腾讯地图接口都是靠 WebView 自己的
     * 网络栈跑的，一旦在这里插一脚（尤其是为了做缓存而全量接管），这些请求会被拦坏。
     * 这里只认领壳内部的虚拟域名，其它一律返回 null 表示"我不管"。
     */
    override fun shouldInterceptRequest(view: WebView, request: WebResourceRequest): WebResourceResponse? {
        val uri = request.url
        return if (AssetsLoader.isAssetUri(uri)) AssetsLoader.intercept(uri) else null
    }

    // ---------- 3. 加载失败 ----------

    override fun onReceivedError(view: WebView, request: WebResourceRequest, error: WebResourceError) {
        // 子资源失败不换页：Cesium 少一张瓦片是常态，整页换成错误页反而更糟
        if (!request.isForMainFrame) return

        // 错误页自己加载失败就别递归了（真出这种事先保命，别做成死循环）
        if (AssetsLoader.isAssetUri(request.url)) return

        // 只对"确实是网络/服务器问题"的几种错误弹错误页。
        // 为什么不用黑名单排除：有些国产 ROM 在内核里对**被新导航中断**的请求也会回调
        // onReceivedError（ERR_ABORTED → ERROR_UNKNOWN），用白名单能避免这种假报警
        // 把一次正常的跳转变成"网络错误"页面。
        if (error.errorCode !in FATAL_ERROR_CODES) {
            Log.i(TAG, "忽略非致命加载错误 code=${error.errorCode} url=${request.url}")
            return
        }

        onMainFrameError(request.url, error)
    }

    // ---------- 4. 渲染进程崩溃 ----------

    /**
     * Cesium 场景很吃内存，渲染进程被系统回收是常见事件。
     * 默认行为是整个 App 一起崩；这里返回 true 表示"我们接管了"，
     * 宿主再根据回调重建 WebView（见 MainActivity.recreateWebView）。
     */
    override fun onRenderProcessGone(view: WebView, detail: RenderProcessGoneDetail): Boolean {
        Log.e(TAG, "WebView 渲染进程退出，didCrash=${detail.didCrash()}")
        onRendererGone()
        return true
    }

    private companion object {
        const val TAG = "LocusEarthShell"

        /** 网页内部 scheme：必须留在 WebView 里 */
        val INTERNAL_SCHEMES = setOf("about", "data", "blob", "javascript", "chrome")

        /**
         * 值得展示错误页的错误码（取值来自 WebViewClient 的常量表）。
         * -2 域名解析失败（最常见：没网）
         * -6 连接失败    -7 IO 异常    -8 超时    -14 文件不存在
         */
        val FATAL_ERROR_CODES = setOf(
            WebViewClient.ERROR_HOST_LOOKUP,
            WebViewClient.ERROR_CONNECT,
            WebViewClient.ERROR_IO,
            WebViewClient.ERROR_TIMEOUT,
            WebViewClient.ERROR_FILE_NOT_FOUND,
        )
    }
}
