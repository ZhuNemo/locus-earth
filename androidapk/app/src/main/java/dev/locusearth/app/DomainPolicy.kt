package dev.locusearth.app

import android.net.Uri

/**
 * 域名策略：一个 URL 到底该留在壳里，还是丢给系统浏览器。
 *
 * 想加一个「也要在壳内打开」的域名，只需要往 [ALLOWED_HOSTS] 里加一行，别改别处。
 * 见 androidapk/README.md「新增白名单域名」。
 */
object DomainPolicy {

    /** 启动加载的地址 */
    const val START_URL = "https://locus-earth.pages.dev/"

    /**
     * 追加到 WebView User-Agent 末尾的标记，形如 `" LocusEarthAndroid/1.2"`。
     * 版本号取自 build.gradle.kts 的 versionName，改版本号会自动同步。
     * 网页端可以用 `navigator.userAgent.includes('LocusEarthAndroid')` 判断自己跑在壳里。
     */
    val UA_SUFFIX: String = " LocusEarthAndroid/${BuildConfig.VERSION_NAME}"

    /**
     * WebViewAssetLoader 使用的虚拟域名。
     * 本地 assets 会以 https 形式暴露在这个域名下，因此**不需要**打开 allowFileAccess。
     * 它属于"壳内部"域名，不算业务白名单。
     */
    const val APP_ASSET_HOST = "appassets.androidplatform.net"

    /**
     * 允许在壳内打开的域名，**含子域**（例如 pano.qq-map.netlify.app 也会命中）。
     *
     * · locus-earth.pages.dev —— Locus Earth 主站（Cloudflare Pages）
     * · qq-map.netlify.app    —— 腾讯街景第三方查看器，网页里用 window.open 打开它
     */
    private val ALLOWED_HOSTS = listOf(
        "locus-earth.pages.dev",
        "qq-map.netlify.app",
    )

    /** 壳内部使用的虚拟域名（错误页等），不属于业务白名单 */
    fun isInternalHost(host: String?): Boolean = host == APP_ASSET_HOST

    /** host 命中白名单，或 host 是白名单域名的子域 */
    fun isAllowedHost(host: String?): Boolean {
        if (host.isNullOrEmpty()) return false
        val h = host.lowercase()
        return ALLOWED_HOSTS.any { allowed -> h == allowed || h.endsWith(".$allowed") }
    }

    /**
     * 只有 **https + 白名单** 才留在壳里。
     * http 的链接即使域名对得上也会被丢出去 —— 壳强制 HTTPS，不留明文口子
     * （清单里 usesCleartextTraffic=false，就算留在壳里也加载不出来，不如交给浏览器）。
     */
    fun isAllowedUri(uri: Uri?): Boolean {
        val target = uri ?: return false
        return target.scheme.equals("https", ignoreCase = true) && isAllowedHost(target.host)
    }

    fun isAllowedUrl(url: String?): Boolean = isAllowedUri(url?.let { Uri.parse(it) })

    /** 能不能交给系统里的其它 App 处理（浏览器 / 邮件 / 电话等） */
    fun isExternallyOpenable(uri: Uri?): Boolean {
        val scheme = uri?.scheme?.lowercase() ?: return false
        return scheme in EXTERNAL_SCHEMES
    }

    private val EXTERNAL_SCHEMES = setOf(
        "http", "https", "mailto", "tel", "sms", "smsto", "geo",
        "market", "intent", "weixin",
    )
}
