package dev.locusearth.app

import android.os.Message
import android.view.View
import android.webkit.GeolocationPermissions
import android.webkit.WebChromeClient
import android.webkit.WebView

/**
 * WebView 的"浏览器 UI 侧"回调。
 *
 * 这里只做三件事，全部转交给宿主 Activity 决策，本类不持有任何状态：
 *   1. 定位权限询问   → 先申请系统权限，再回答 WebView
 *   2. 新窗口（window.open / target=_blank）→ 统一路由，不弹第二个 Activity
 *   3. 全屏视频       → 占位钩子（当前网页没有视频，但保留实现）
 */
class AppWebChromeClient(
    private val onGeoPrompt: (String, GeolocationPermissions.Callback) -> Unit,
    private val onNewWindowRequest: (Message) -> Boolean,
    private val onShowFullscreen: (View, WebChromeClient.CustomViewCallback) -> Unit,
    private val onHideFullscreen: () -> Unit,
) : WebChromeClient() {

    /**
     * 网页调用 navigator.geolocation 时会走到这里。
     * 不做"启动就申请权限"：用户进应用只是看地球，不该被一个定位弹窗拦住，
     * 只有网页真的要定位时才申请。
     */
    override fun onGeolocationPermissionsShowPrompt(
        origin: String,
        callback: GeolocationPermissions.Callback,
    ) {
        onGeoPrompt(origin, callback)
    }

    /**
     * 需求 §4.3：白名单内 → 在当前 WebView 加载；否则 → 系统浏览器。
     *
     * 说明：Android 的契约是"必须返回一个 WebView"或"直接拒绝"，**没有**
     * "返回 null 但请用当前 WebView 加载"这个选项。所以宿主 Activity 会塞进来一个
     * 不渲染的接驳 WebView 先把目标 URL 截下来，再决定是留壳里还是丢出去。
     * 这样永远只有一个可见的 WebView，不会出现"第二个浏览器"。
     */
    override fun onCreateWindow(
        view: WebView,
        isDialog: Boolean,
        isUserGesture: Boolean,
        resultMsg: Message,
    ): Boolean = onNewWindowRequest(resultMsg)

    // ---------- 全屏视频（占位） ----------
    // 当前 Locus Earth 没有 <video>，但保留钩子：将来网页加视频时不用改壳。
    // 实现要点在宿主 Activity：把 custom view 挂到一个独立的黑底容器上，并隐藏系统栏。

    override fun onShowCustomView(view: View, callback: WebChromeClient.CustomViewCallback) {
        onShowFullscreen(view, callback)
    }

    override fun onHideCustomView() {
        onHideFullscreen()
    }
}
