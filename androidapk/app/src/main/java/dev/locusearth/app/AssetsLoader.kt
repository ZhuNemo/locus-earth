package dev.locusearth.app

import android.content.Context
import android.net.Uri
import android.webkit.WebResourceResponse
import androidx.webkit.WebViewAssetLoader

/**
 * 本地 assets 的加载器。
 *
 * 为什么需要它：
 *   需求里锁死了 `allowFileAccess = false` / `allowContentAccess = false`，
 *   于是 `file:///android_asset/error.html` 这条路走不通（也不该走：一旦允许 file 访问，
 *   网页就多了一条读本地文件的可能）。
 *   官方推荐的做法是把 assets 目录映射到一个虚拟域名，让网页发一次"普通的 https 请求"，
 *   实际不产生任何网络流量 —— 所以断网时错误页照样能打开。
 *
 * 映射关系：
 *   https://appassets.androidplatform.net/assets/error.html
 *      → app/src/main/assets/error.html
 */
object AssetsLoader {

    const val DOMAIN = DomainPolicy.APP_ASSET_HOST

    private const val PATH_PREFIX = "/assets/"

    /** 加载失败页地址（本地，离线可用） */
    const val ERROR_PAGE_URL = "https://$DOMAIN/assets/error.html"

    private var loader: WebViewAssetLoader? = null

    /** 在 Application/Activity 创建时调用一次即可，重复调用是安全的 */
    fun init(context: Context) {
        val appContext = context.applicationContext
        loader = WebViewAssetLoader.Builder()
            .setDomain(DOMAIN)
            .addPathHandler(PATH_PREFIX, WebViewAssetLoader.AssetsPathHandler(appContext))
            .build()
    }

    /**
     * ⚠️ 只允许对**自己的虚拟域名**调用。
     *
     * 需求里明确写了不要用 shouldInterceptRequest 去拦图片 / JS / CSS / CDN，
     * 否则会把 Cesium 的静态资源和各种 API 一起拦坏。调用方（AppWebViewClient）
     * 已经做了域名判断，其余请求一律返回 null 交回 WebView 原生网络栈。
     *
     * 返回 null 表示"这次请求我不管"，WebView 会继续走自己的网络栈；
     * 若映射的文件不存在，会返回 404 响应而不是抛异常。
     */
    fun intercept(uri: Uri): WebResourceResponse? = loader?.shouldInterceptRequest(uri)

    /** 是不是壳内部的虚拟域名 */
    fun isAssetUri(uri: Uri?): Boolean = uri?.host == DOMAIN
}
