package dev.locusearth.app

import android.app.Dialog
import android.content.Context
import android.os.Bundle
import android.text.Html
import android.widget.TextView
import androidx.appcompat.app.AlertDialog
import androidx.fragment.app.DialogFragment
import com.google.android.material.dialog.MaterialAlertDialogBuilder

/**
 * 首次启动提示：明确告诉用户「这是一个网页应用」。
 *
 * 只在**首次**启动出现；点「进入」后写入 SharedPreferences，之后每次启动直接进网页。
 * 点「退出」结束整个任务，同样记为已看过并直接返回桌面（不再进网页）。
 *
 * 为什么用 DialogFragment 而不是在 MainActivity 里直接 builder.create().show()：
 *   · 弹窗期间旋转屏幕 / 系统切换深浅色时，Activity 会重建，
 *     裸 Dialog 会泄漏并跟着旧 Activity 一起消失，DialogFragment 由 FragmentManager 自动恢复；
 *   · 生命周期归属清晰，不会出现「Activity 已 finish 但 Dialog 还挂着」。
 *
 * 为什么是 MaterialAlertDialogBuilder（而不是自己搭窗口）：
 *   它直接吃 Theme.Material3.DayNight.NoActionBar，圆角、阴影、深浅色、字体
 *   全部跟随本工程的 M3 主题 —— 也就是「安卓原生提示界面风格」。
 */
class WelcomeDialog : DialogFragment() {

    /** 用户已选择「进入」：由宿主 Activity 继续加载网页 */
    var onEnter: (() -> Unit)? = null

    /** 用户选择「退出」：由宿主 Activity 结束自己 */
    var onExit: (() -> Unit)? = null

    override fun onCreateDialog(savedInstanceState: Bundle?): Dialog {
        val view = layoutInflater.inflate(R.layout.dialog_welcome, null, false)

        // 标题放大 + 中英对照正文：一份文本一次设置，避免三块 TextView 对不齐行距。
        val html = buildString {
            append("<big><b>").append(getString(R.string.welcome_title_zh)).append("</b></big>")
            append("<br><small>").append(getString(R.string.welcome_title_en)).append("</small>")
            append("<br><br>")
            append(getString(R.string.welcome_body_zh))
            append("<br><br>")
            append(getString(R.string.welcome_body_en))
        }
        @Suppress("DEPRECATION")
        view.findViewById<TextView>(R.id.welcomeMessage).text = Html.fromHtml(html)

        val dialog = MaterialAlertDialogBuilder(requireContext())
            .setView(view)
            // 不用 setTitle()：标题已在正文里，用两行中英标题更省纵向空间。
            // 点击外部/返回键不关闭 —— 这里要求用户明确表态，避免"既没进也没退"的模棱两可状态。
            .setCancelable(false)
            .create()

        view.findViewById<android.view.View>(R.id.welcomeEnter).setOnClickListener {
            markShown()
            dismiss()
            onEnter?.invoke()
        }
        view.findViewById<android.view.View>(R.id.welcomeExit).setOnClickListener {
            markShown()
            dismiss()
            onExit?.invoke()
        }

        return dialog
    }

    private fun markShown() {
        // commit() 而不是 apply()：用户可能点完立刻强杀应用，
        // apply() 的异步落盘有极小概率没写完，下次启动会又弹一次。
        prefs(requireContext()).edit().putBoolean(KEY_SHOWN, true).commit()
    }

    companion object {
        const val TAG = "WelcomeDialog"

        private const val PREFS_NAME = "locus_earth_shell"
        private const val KEY_SHOWN = "welcome_shown"

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
}
