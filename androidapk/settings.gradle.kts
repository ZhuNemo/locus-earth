// Locus Earth Android 外壳 —— 独立 Gradle 工程
//
// ⚠️ 本目录（androidapk/）是一个**自包含**的 Android 工程，不属于仓库根目录的网页工程。
//    · 用 Android Studio 「Open」直接选 androidapk/ 这个目录打开；
//    · 不需要、也不要动仓库根目录的任何文件。
//
// 打开方式二选一：
//   1) Android Studio → File → Open → 选中 androidapk/ 目录（推荐，它自带 wrapper）；
//   2) 命令行：cd androidapk && ./gradlew assembleDebug
//   注意 Gradle 的命令行入口在 androidapk/ 里，不在仓库根目录。

import org.gradle.api.initialization.resolve.RepositoriesMode

pluginManagement {
    repositories {
        google {
            content {
                includeGroupByRegex("com\\.android.*")
                includeGroupByRegex("com\\.google.*")
                includeGroupByRegex("androidx.*")
            }
        }
        mavenCentral()
        gradlePluginPortal()
    }
}

dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        google()
        mavenCentral()
    }
}

rootProject.name = "LocusEarth"
include(":app")
