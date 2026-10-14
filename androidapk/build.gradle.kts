// 顶层构建脚本：只声明插件版本，不在这里配置任何模块。
// 单模块工程（:app），保持最简。
//
// 版本组合说明：
//   AGP 8.6.1 + Gradle 8.9 + Kotlin 1.9.24 + JDK 17
//   AGP 8.x 要求 JDK 17，Android Studio 自带的 JBR 就是 17，直接可用。
//   如果你本机 JAVA_HOME 指向 JDK 11/8，Gradle 会报 "Unsupported class file major version"，
//   在 Android Studio 里用默认的 Gradle JDK（Settings → Build Tools → Gradle → Gradle JDK）即可。
plugins {
    id("com.android.application") version "8.6.1" apply false
    id("org.jetbrains.kotlin.android") version "1.9.24" apply false
}
