plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

// Version comes from gradle.properties (app.versionName) so CI and the build
// read one source of truth; CI overrides both for a release build:
//   ./gradlew assembleRelease -PversionCode=42 -PversionName=2.1.0
val appVersionName: String =
    providers.gradleProperty("versionName").orNull?.takeIf { it.isNotBlank() }
        ?: providers.gradleProperty("app.versionName").orNull?.takeIf { it.isNotBlank() }
        ?: "0.0.0"
val appVersionCode: Int =
    (providers.gradleProperty("versionCode").orNull ?: "1").toIntOrNull() ?: 1

android {
    namespace = "com.salixz.app"
    compileSdk = 34

    defaultConfig {
        applicationId = "com.salixz.app"
        minSdk = 26
        targetSdk = 34
        versionCode = appVersionCode
        versionName = appVersionName
    }

    buildFeatures {
        buildConfig = true
    }

    buildTypes {
        release {
            isMinifyEnabled = true
            isShrinkResources = true
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = "17"
    }

    // The preview system ships plain Kotlin + classic Views only; no Compose,
    // no KSP and no Material dependency, so the APK stays tiny and the build fast.
    packaging {
        resources.excludes += "META-INF/*.kotlin_module"
    }
}

dependencies {
    implementation("androidx.core:core-ktx:1.13.1")
    implementation("androidx.appcompat:appcompat:1.7.0")
    implementation("androidx.core:core-splashscreen:1.0.1")
    // Pull-to-refresh for the shell.
    implementation("androidx.swiperefreshlayout:swiperefreshlayout:1.1.0")
    // WebViewAssetLoader: serves cached preview files over a virtual https origin,
    // so images no longer have to travel through base64 + evaluateJavascript.
    implementation("androidx.webkit:webkit:1.11.0")

    testImplementation("junit:junit:4.13.2")
    testImplementation("org.json:json:20240303")
}
