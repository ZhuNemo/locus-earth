package dev.locusearth.app

import android.content.Context
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup

/**
 * 首次启动的**全屏提示页**（「这是一个网页应用」）。
 *
 * 只在首次启动出现；点「进入」后写入 SharedPreferences，之后每次启动直接进网页。
 * 点「退出」结束整个任务，同样记为已看过并直接返回桌面（不再进网页）。
 *
 * 为什么是整页而不是弹窗（早期版本用 DialogFragment + MaterialAlertDialogBuilder）：
 *   · 双语文案在弹窗里读起来很挤 —— 弹窗宽度受限，中文正文会被压成很多短行；
 *   · 整页能按「中文标题 / 英文标题 / 中文正文 / 英文正文」分层排版，
 *     不必再用 HTML 的 <big><small> 模拟字号；
 *   · 两个按钮固定在底部，不与滚动文本抢纵向空间，小屏横屏也不会被挤没。
 *
 * 为什么直接 addView 到 Activity 的根布局，而不是再开一个 Activity：
 *   · 壳的整个生命周期只有 MainActivity 一个窗口，多开一个 Activity 会让
 *     「返回键 / 任务栈 / 深链回壳」这些行为都要多考虑一层；
 *   · 这一屏的任务就是"在 WebView 建起来之前挡住它"，用同一棵视图树最直接。
 *
 * ⚠️ 调用方必须在**建 WebView 之前**调用 [show]：
 *    用户点「退出」时不该已经白花流量去加载地球。
 */
object WelcomeScreen {

    private const val PREFS_NAME = "locus_earth_shell"
    private const val KEY_SHOWN = "welcome_shown"

    /**
     * 把提示页挂到 [root] 的最上层。
     *
     * 两条出口（进入 / 退出）会先把「已看过」落盘，再执行各自的回调，
     * 这样即使用户点完立刻强杀应用，下次启动也不会再弹一次。
     */
    fun show(root: ViewGroup, onEnter: () -> Unit, onExit: () -> Unit) {
        val view = LayoutInflater.from(root.context).inflate(R.layout.view_welcome, root, false)

        view.findViewById<View>(R.id.welcomeEnter).setOnClickListener {
            markShown(root.context)
            // 先摘掉自己再建 WebView：setupWebView 会往 index 0 插入 WebView，
            // 提示页如果还在树上就会继续挡着它。
            root.removeView(view)
            onEnter()
        }

        view.findViewById<View>(R.id.welcomeExit).setOnClickListener {
            markShown(root.context)
            // 不摘视图：这条出口是 finishAffinity()，整个任务栈都会结束。
            onExit()
        }

        root.addView(view)
    }

    private fun markShown(context: Context) {
        // commit() 而不是 apply()：用户可能点完立刻强杀应用，
        // apply() 的异步落盘有极小概率没写完，下次启动会又弹一次。
        prefs(context).edit().putBoolean(KEY_SHOWN, true).commit()
    }

    /**
     * 是否需要展示首次启动提示。
     *
     * [fromExternalLink] 为 true 表示这次是外链/深链唤起的（例如从浏览器点进来），
     * 那种场景用户已经在别处用过本应用，不该再拿提示拦一次，直接放行。
     */
    fun shouldShow(context: Context, fromExternalLink: Boolean): Boolean {
        if (fromExternalLink) return false
        return !prefs(context).getBoolean(KEY_SHOWN, false)
    }

    private fun prefs(context: Context) =
        context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
}
