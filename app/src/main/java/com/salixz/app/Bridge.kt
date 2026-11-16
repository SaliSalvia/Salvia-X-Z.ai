package com.salixz.app

import android.util.Base64
import android.webkit.JavascriptInterface

/**
 * JS-to-native bridge injected into the chat WebView as `SaliXBridge`.
 * Uses UI-thread cached URL (`currentWebUrl`) so `@JavascriptInterface` checks
 * never touch `WebView.getUrl()` from a background Binder thread.
 */
class Bridge(private val activity: MainActivity) {

    private fun trusted(): Boolean = activity.isTrustedOrigin(activity.currentWebUrl)

    /** "پیش‌نمایش" button on a <pre><code> block in the chat. */
    @JavascriptInterface
    fun openCode(code: String, lang: String) {
        if (!trusted()) return
        activity.runOnUiThread { activity.preview.showCode(code, lang) }
    }

    /** "کپی" button on a code block. */
    @JavascriptInterface
    fun copyText(text: String) {
        if (!trusted()) return
        activity.runOnUiThread { activity.preview.copyToClipboard(text) }
    }

    /** A download link the site exposes (artifact export etc.). */
    @JavascriptInterface
    fun openDownload(url: String, mime: String, filename: String) {
        if (!trusted()) return
        activity.runOnUiThread {
            activity.preview.handleDownload(url, activity.webUA(), mime, filename)
        }
    }

    /** Result of a `blob:` download fetched inside the page. */
    @JavascriptInterface
    fun onBlob(name: String, mime: String, base64: String) {
        if (!trusted()) return
        val bytes = try {
            Base64.decode(base64, Base64.NO_WRAP)
        } catch (_: Throwable) {
            return
        }
        activity.runOnUiThread { activity.preview.onBlobReceived(name, mime, bytes) }
    }

    /** Live model / theme / auth state reported from chat.z.ai DOM observer. */
    @JavascriptInterface
    fun onSiteState(model: String, isDark: Boolean, isSignedIn: Boolean) {
        if (!trusted()) return
        activity.runOnUiThread { activity.onSiteStateChanged(model, isDark, isSignedIn) }
    }

    /** Full account profile + chat history synced from chat.z.ai. */
    @JavascriptInterface
    fun onHistorySync(json: String) {
        if (!trusted()) return
        activity.runOnUiThread { activity.onHistorySynced(json) }
    }

    /** Artifacts & generated code/images detected inside active chat. */
    @JavascriptInterface
    fun onArtifactsSync(json: String) {
        if (!trusted()) return
        activity.runOnUiThread { activity.onArtifactsSynced(json) }
    }

    /** Tracks whether the inner web scroll container is at the very top. */
    @JavascriptInterface
    fun onScrollTop(atTop: Boolean) {
        if (!trusted()) return
        activity.runOnUiThread { activity.onWebScrollTopChanged(atTop) }
    }

    @JavascriptInterface
    fun toast(message: String) {
        if (!trusted()) return
        activity.runOnUiThread { activity.toast(message) }
    }
}
