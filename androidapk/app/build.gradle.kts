import java.io.File
import java.util.Properties

plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

// ============================================================================
// 签名配置
// ----------------------------------------------------------------------------
// 从 androidapk/keystore.properties 读取（该文件已被 .gitignore 忽略）。
// 三种情况都不会让构建失败：
//   1) keystore.properties 不存在                → 回退 debug 签名
//   2) 存在但 storeFile 指向的文件不存在          → 回退 debug 签名
//   3) 都存在                                    → 用 release 签名
// 回退出来的包能装能跑，只是不能上架，适合 CI / 本机试手。
// ============================================================================
val keystorePropsFile = rootProject.file("keystore.properties")
val keystoreProps = Properties().apply {
    if (keystorePropsFile.exists()) {
        keystorePropsFile.inputStream().use { load(it) }
    }
}

// 相对路径的解析顺序：先 app/，再 androidapk/。绝对路径直接用。
val releaseStoreFile: File? = keystoreProps.getProperty("storeFile")
    ?.trim()
    ?.takeIf { it.isNotEmpty() }
    ?.let { raw ->
        val direct = File(raw)
        if (direct.isAbsolute) {
            direct
        } else {
            listOf(File(projectDir, raw), File(rootProject.projectDir, raw))
                .firstOrNull { it.exists() }
                ?: File(rootProject.projectDir, raw)
        }
    }

val hasReleaseSigning = releaseStoreFile?.exists() == true

android {
    // namespace 与 applicationId 都是 dev.locusearth.app
    namespace = "dev.locusearth.app"
    compileSdk = 34

    defaultConfig {
        applicationId = "dev.locusearth.app"
        minSdk = 24
        targetSdk = 34

        // versionName 会被拼进 WebView 的 UA（见 DomainPolicy.UA_SUFFIX），
        // 改版本号时网页端拿到的标记也会跟着变，这是有意为之。
        versionCode = 1
        versionName = "1.0"
    }

    signingConfigs {
        if (hasReleaseSigning) {
            create("release") {
                storeFile = releaseStoreFile
                storePassword = keystoreProps.getProperty("storePassword")
                keyAlias = keystoreProps.getProperty("keyAlias")
                keyPassword = keystoreProps.getProperty("keyPassword")
                enableV1Signing = true
                enableV2Signing = true
            }
        }
    }

    buildTypes {
        debug {
            // 故意不加 applicationIdSuffix：
            // WebView 的 localStorage / IndexedDB / Service Worker 缓存都挂在
            // applicationId 对应的沙箱里，加后缀会让 debug 与 release 变成两份数据，
            // 调试时看不到线上已有的书签和设置。
            isMinifyEnabled = false
        }
        release {
            // 壳工程只有一个 Activity、没有反射、没有序列化模型，
            // 开混淆收益极低而踩坑成本高，因此保持关闭。
            isMinifyEnabled = false
            isShrinkResources = false
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro",
            )
            signingConfig = if (hasReleaseSigning) {
                signingConfigs.getByName("release")
            } else {
                // 缺密钥时用 debug 签名兜底，保证 assembleRelease 始终能产出可安装的 APK
                signingConfigs.getByName("debug")
            }
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = "17"
    }

    buildFeatures {
        // 需要 BuildConfig.DEBUG / VERSION_NAME
        buildConfig = true
    }

    packaging {
        resources {
            excludes += setOf(
                "META-INF/AL2.0",
                "META-INF/LGPL2.1",
                "META-INF/*.kotlin_module",
            )
        }
    }
}

dependencies {
    implementation("androidx.core:core-ktx:1.13.1")
    implementation("androidx.appcompat:appcompat:1.7.0")
    implementation("com.google.android.material:material:1.12.0")
    // OnBackPressedCallback / registerForActivityResult
    implementation("androidx.activity:activity-ktx:1.9.3")
    // WebViewAssetLoader：在不开 allowFileAccess 的前提下把 assets/ 用 https 提供给 WebView
    implementation("androidx.webkit:webkit:1.11.0")
    // 启动页
    implementation("androidx.core:core-splashscreen:1.0.1")
}
