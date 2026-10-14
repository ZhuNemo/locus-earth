# 壳工程没有开启混淆（isMinifyEnabled = false），这个文件只是占位。
# 如果将来要开 R8，注意保留 WebView / JavaScript 相关的注解：
#
# -keepclassmembers class * extends android.webkit.WebViewClient { public *; }
# -keepclassmembers class * extends android.webkit.WebChromeClient { public *; }
# -keepattributes JavascriptInterface
#
# 但目前**没有**任何 addJavascriptInterface，也没有反射入口，
# 开启混淆的唯一风险来自上面两类回调被改名。
