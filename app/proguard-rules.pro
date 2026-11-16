# WebView-based shell: nothing to keep; JavascriptInterface members are
# referenced only from JavaScript, so they are not stripped by default rules.
-keepclassmembers class com.salixz.app.Bridge {
    @android.webkit.JavascriptInterface <methods>;
}
