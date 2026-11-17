package com.salixz.app

import android.animation.ValueAnimator
import android.annotation.SuppressLint
import android.content.ActivityNotFoundException
import android.content.ContentValues
import android.content.Context
import android.content.Intent
import android.content.res.ColorStateList
import android.net.Uri
import android.os.Build
import android.os.Environment
import android.provider.MediaStore
import android.view.MotionEvent
import android.view.View
import android.view.ViewGroup
import android.view.animation.DecelerateInterpolator
import android.view.animation.OvershootInterpolator
import android.webkit.CookieManager
import android.webkit.RenderProcessGoneDetail
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.ImageButton
import android.widget.ImageView
import android.widget.LinearLayout
import android.widget.ProgressBar
import android.widget.TextView
import androidx.core.content.ContextCompat
import androidx.core.content.FileProvider
import androidx.core.widget.ImageViewCompat
import androidx.core.widget.TextViewCompat
import androidx.webkit.WebViewAssetLoader
import org.json.JSONObject
import java.io.File
import java.net.HttpURLConnection
import java.net.URL
import java.util.concurrent.Executors
import java.util.concurrent.atomic.AtomicInteger

/**
 * Mobile preview system for files & code produced by chat.z.ai models.
 */
class PreviewController(private val activity: MainActivity) {

    enum class Kind { CODE, HTML, MARKDOWN, IMAGE }

    data class Payload(
        var name: String,
        var lang: String,
        var kind: Kind,
        var content: String,
        var mime: String,
        var file: File?
    )

    private val panel: LinearLayout = activity.findViewById(R.id.previewPanel)
    private val dragBar: View = activity.findViewById(R.id.previewDragBar)
    private val dragHandle: View = activity.findViewById(R.id.previewDragHandle)
    private val header: View = activity.findViewById(R.id.previewHeader)
    private val nameView: TextView = activity.findViewById(R.id.previewName)
    private val langView: TextView = activity.findViewById(R.id.previewLang)
    private val divider: View = activity.findViewById(R.id.previewDivider)
    private var previewWeb: WebView = activity.findViewById(R.id.previewWeb)
    private val previewLoading: ProgressBar = activity.findViewById(R.id.previewLoading)
    private val pill: LinearLayout = activity.findViewById(R.id.pill)
    private val pillEye: ImageView = activity.findViewById(R.id.pillEye)
    private val pillLabel: TextView = activity.findViewById(R.id.pillLabel)
    private val pillClose: ImageButton = activity.findViewById(R.id.pillClose)
    private val scrim: View = activity.findViewById(R.id.previewScrim)
    private val btnExpand: ImageButton = activity.findViewById(R.id.btnExpand)
    private val btnMinimize: ImageButton = activity.findViewById(R.id.btnMinimize)
    private val btnClose: ImageButton = activity.findViewById(R.id.btnClose)
    private val chipCopy: TextView = panel.findViewById(R.id.chipCopy)
    private val chipSave: TextView = panel.findViewById(R.id.chipSave)
    private val chipShare: TextView = panel.findViewById(R.id.chipShare)
    private val chipExternal: TextView = panel.findViewById(R.id.chipExternal)

    private var payload: Payload? = null
    private var expanded = false
    private var viewerLoaded = false
    private var darkMode = false
    private val executor = Executors.newSingleThreadExecutor()

    val isVisible: Boolean get() = panel.visibility == View.VISIBLE
    val pillVisible: Boolean get() = pill.visibility == View.VISIBLE

    private val previewDir: File
        get() = File(activity.cacheDir, PREVIEW_DIR).apply { mkdirs() }

    private val assetLoader: WebViewAssetLoader by lazy {
        WebViewAssetLoader.Builder()
            .addPathHandler(
                "/$PREVIEW_DIR/",
                WebViewAssetLoader.InternalStoragePathHandler(activity, previewDir)
            )
            .build()
    }

    init {
        panel.visibility = View.GONE
        scrim.visibility = View.GONE
        expanded = Prefs.read(activity, Prefs.KEY_PANEL_EXPANDED, false)
        darkMode = activity.isNightUiActive()
        setupPreviewWeb()
        wirePanel()
    }

    private inline fun runIfAlive(crossinline block: () -> Unit) {
        activity.runOnUiThread {
            if (!activity.isFinishing && !activity.isDestroyed) {
                block()
            }
        }
    }

    fun applyThemeColors(themedCtx: Context, dark: Boolean) {
        val bgCanvas = ContextCompat.getColor(themedCtx, R.color.bg_canvas)
        val inkPrimary = ContextCompat.getColor(themedCtx, R.color.ink_primary)
        val inkSecondary = ContextCompat.getColor(themedCtx, R.color.ink_secondary)
        val accentOnPrimary = ContextCompat.getColor(themedCtx, R.color.accent_on_primary)
        val borderHairline = ContextCompat.getColor(themedCtx, R.color.border_hairline)
        val scrimColor = ContextCompat.getColor(themedCtx, R.color.scrim)

        panel.background = ContextCompat.getDrawable(themedCtx, R.drawable.preview_bg)
        dragHandle.background = ContextCompat.getDrawable(themedCtx, R.drawable.sheet_handle)
        nameView.setTextColor(inkPrimary)
        langView.setTextColor(inkSecondary)
        langView.background = ContextCompat.getDrawable(themedCtx, R.drawable.btn_chip_bg_outline)
        divider.setBackgroundColor(borderHairline)
        previewWeb.setBackgroundColor(bgCanvas)
        scrim.setBackgroundColor(scrimColor)

        val primaryTint = ColorStateList.valueOf(inkPrimary)
        val secondaryTint = ColorStateList.valueOf(inkSecondary)
        val onPrimaryTint = ColorStateList.valueOf(accentOnPrimary)
        ImageViewCompat.setImageTintList(btnExpand, primaryTint)
        ImageViewCompat.setImageTintList(btnMinimize, primaryTint)
        ImageViewCompat.setImageTintList(btnClose, primaryTint)
        ImageViewCompat.setImageTintList(pillEye, primaryTint)
        ImageViewCompat.setImageTintList(pillClose, primaryTint)

        pill.background = ContextCompat.getDrawable(themedCtx, R.drawable.pill_bg)
        pillLabel.setTextColor(inkPrimary)

        chipCopy.background = ContextCompat.getDrawable(themedCtx, R.drawable.chip_bg_primary)
        chipCopy.setTextColor(accentOnPrimary)
        TextViewCompat.setCompoundDrawableTintList(chipCopy, onPrimaryTint)

        listOf(chipSave, chipShare, chipExternal).forEach { chip ->
            chip.background = ContextCompat.getDrawable(themedCtx, R.drawable.chip_bg)
            chip.setTextColor(inkPrimary)
            TextViewCompat.setCompoundDrawableTintList(chip, secondaryTint)
        }

        setDarkTheme(dark)
    }

    fun setDarkTheme(dark: Boolean) {
        darkMode = dark
        if (viewerLoaded) {
            previewWeb.evaluateJavascript("window.SaliXViewer && SaliXViewer.setTheme($dark);", null)
        }
    }

    fun showCode(code: String, langIn: String) {
        val lang = ZaiPortalUtils.normalizeLang(langIn)
        val kind = kindFor(lang)
        val name = suggestName(lang, kind)
        payload = Payload(name, lang, kind, code, mimeFor(kind), null)
        openPanel()
        ensureViewerLoaded()
    }

    fun handleDownload(url: String, userAgent: String, mime: String, disposition: String) {
        if (url.startsWith("blob:", true)) {
            fetchBlob(url, mime, ZaiPortalUtils.guessFileName(disposition, url, mime))
        } else {
            downloadAndPreview(url, userAgent, mime, disposition)
        }
    }

    fun downloadAndPreview(url: String, userAgent: String, mime: String, disposition: String) {
        val displayName = ZaiPortalUtils.sanitizeFileName(ZaiPortalUtils.guessFileName(disposition, url, mime))
        activity.toast(activity.getString(R.string.download_started))
        executor.execute {
            var target: File? = null
            var conn: HttpURLConnection? = null
            try {
                val parsedUrl = URL(url)
                conn = (parsedUrl.openConnection() as HttpURLConnection).apply {
                    connectTimeout = 15000
                    readTimeout = 30000
                    instanceFollowRedirects = true
                    setRequestProperty("User-Agent", userAgent)
                    if (ZaiPortalUtils.isInternalHost(parsedUrl.host)) {
                        CookieManager.getInstance().getCookie(url)?.let {
                            setRequestProperty("Cookie", it)
                        }
                    }
                }
                if (conn.responseCode !in 200..299) throw IllegalStateException("HTTP ${conn.responseCode}")
                if (conn.contentLengthLong > MAX_DOWNLOAD_BYTES) {
                    throw IllegalStateException(activity.getString(R.string.download_too_large))
                }
                val realMime = conn.contentType?.substringBefore(';')?.trim()?.ifEmpty { mime } ?: mime
                pruneCache()
                val file = File(previewDir, storedName(ZaiPortalUtils.extOf(displayName, realMime)))
                target = file
                var written = 0L
                conn.inputStream.use { input ->
                    file.outputStream().use { sink ->
                        val buffer = ByteArray(64 * 1024)
                        while (true) {
                            val read = input.read(buffer)
                            if (read <= 0) break
                            written += read
                            if (written > MAX_DOWNLOAD_BYTES) {
                                throw IllegalStateException(activity.getString(R.string.download_too_large))
                            }
                            sink.write(buffer, 0, read)
                        }
                    }
                }
                runIfAlive { showDownloaded(file, realMime, displayName) }
            } catch (t: Throwable) {
                target?.delete()
                runIfAlive {
                    activity.toast(activity.getString(R.string.download_failed) + ": " + (t.message ?: ""))
                }
            } finally {
                try {
                    conn?.disconnect()
                } catch (_: Throwable) {
                }
            }
        }
    }

    private fun fetchBlob(url: String, mime: String, fileName: String) {
        val safe = ZaiPortalUtils.sanitizeFileName(fileName.ifEmpty { "download.bin" })
        val js = """
            (function () {
              try {
                fetch(${JSONObject.quote(url)})
                  .then(function (r) { return r.blob(); })
                  .then(function (b) {
                    if (b.size > $MAX_BLOB_BYTES) {
                      SaliXBridge.toast('فایل برای دانلود بیش از حد بزرگ است');
                      return;
                    }
                    var fr = new FileReader();
                    fr.onload = function () {
                      var s = String(fr.result), i = s.indexOf(',');
                      SaliXBridge.onBlob(${JSONObject.quote(safe)}, ${JSONObject.quote(mime)}, s.substring(i + 1));
                    };
                    fr.readAsDataURL(b);
                  })
                  .catch(function () { SaliXBridge.toast('دانلود این فایل ممکن نشد'); });
              } catch (e) { }
            })();
        """.trimIndent()
        activity.web.evaluateJavascript(js, null)
    }

    fun onBlobReceived(name: String, mime: String, bytes: ByteArray) {
        if (bytes.isEmpty()) return
        if (bytes.size > MAX_BLOB_BYTES) {
            activity.toast(activity.getString(R.string.download_too_large))
            return
        }
        executor.execute {
            try {
                val file = File(previewDir, storedName(ZaiPortalUtils.extOf(name, mime)))
                file.writeBytes(bytes)
                runIfAlive { showDownloaded(file, mime, ZaiPortalUtils.sanitizeFileName(name)) }
            } catch (t: Throwable) {
                runIfAlive {
                    activity.toast(activity.getString(R.string.download_failed) + ": " + (t.message ?: ""))
                }
            }
        }
    }

    fun showDownloaded(file: File, mime: String, displayName: String) {
        val name = displayName.ifBlank { file.name }
        val ext = ZaiPortalUtils.extOf(name, mime)
        when {
            mime.startsWith("image/") || ext in IMAGE_EXTS -> {
                payload = Payload(name, ext.ifEmpty { "image" }, Kind.IMAGE,
                    imageUrl(file), mime.ifEmpty { "image/*" }, file)
                openPanel()
                ensureViewerLoaded()
            }
            isHtmlFile(ext) || mime.equals("text/html", true) -> {
                payload = Payload(name, "html", Kind.HTML, readCapped(file), "text/html", file)
                openPanel()
                ensureViewerLoaded()
            }
            ext in setOf("md", "markdown") || mime.equals("text/markdown", true) -> {
                payload = Payload(name, "md", Kind.MARKDOWN, readCapped(file), "text/markdown", file)
                openPanel()
                ensureViewerLoaded()
            }
            mime.equals("application/pdf", true) || ext == "pdf" -> openExternally(file, "application/pdf")
            isTextual(ext, mime) -> {
                payload = Payload(name, langForExt(ext), Kind.CODE, readCapped(file),
                    mime.ifEmpty { "text/plain" }, file)
                openPanel()
                ensureViewerLoaded()
            }
            else -> openExternally(file, mime)
        }
    }

    fun copyToClipboard(text: String) {
        val cm = activity.getSystemService(Context.CLIPBOARD_SERVICE) as android.content.ClipboardManager
        cm.setPrimaryClip(android.content.ClipData.newPlainText("SaliX-Z", text))
        activity.toast(activity.getString(R.string.copied))
    }

    private fun openPanel() {
        pill.animate().cancel()
        pill.visibility = View.GONE
        panel.animate().cancel()
        scrim.animate().cancel()
        if (isVisible) {
            panel.translationY = 0f
            panel.alpha = 1f
            applyHeight()
            nameView.text = payload?.name.orEmpty()
            langView.text = payload?.lang.orEmpty()
            return
        }
        panel.visibility = View.VISIBLE
        scrim.visibility = View.VISIBLE
        scrim.alpha = 0f
        scrim.animate().alpha(1f).setDuration(200).start()
        panel.post {
            if (!isVisible || activity.isFinishing || activity.isDestroyed) return@post
            applyHeight()
            nameView.text = payload?.name.orEmpty()
            langView.text = payload?.lang.orEmpty()
            btnExpand.setImageResource(if (expanded) R.drawable.ic_collapse else R.drawable.ic_expand)
            panel.translationY = panel.height.toFloat()
            panel.alpha = 0.85f
            panel.animate()
                .translationY(0f)
                .alpha(1f)
                .setDuration(260)
                .setInterpolator(DecelerateInterpolator(1.6f))
                .start()
        }
    }

    fun minimize() {
        if (!isVisible) return
        scrim.animate().cancel()
        panel.animate().cancel()
        pill.animate().cancel()
        scrim.animate().alpha(0f).setDuration(180)
            .withEndAction { scrim.visibility = View.GONE }
            .start()
        panel.animate()
            .translationY(panel.height.toFloat())
            .alpha(0.75f)
            .setDuration(200)
            .setInterpolator(DecelerateInterpolator())
            .withEndAction {
                if (payload == null || activity.isFinishing || activity.isDestroyed) return@withEndAction
                panel.visibility = View.GONE
                panel.alpha = 1f
                panel.translationY = 0f
                pillLabel.text = payload?.name ?: activity.getString(R.string.preview_pill)
                pill.visibility = View.VISIBLE
                pill.alpha = 0f
                pill.scaleX = 0.86f
                pill.scaleY = 0.86f
                pill.animate()
                    .alpha(1f)
                    .scaleX(1f)
                    .scaleY(1f)
                    .setDuration(240)
                    .setInterpolator(OvershootInterpolator(1.1f))
                    .start()
            }
            .start()
    }

    fun restore() {
        if (payload == null) return
        openPanel()
    }

    fun close() {
        scrim.animate().cancel()
        scrim.visibility = View.GONE
        panel.animate().cancel()
        panel.visibility = View.GONE
        pill.visibility = View.GONE
        payload = null
        viewerLoaded = false
        previewWeb.loadUrl("about:blank")
        previewLoading.visibility = View.GONE
    }

    fun destroy() {
        executor.shutdownNow()
        try {
            previewWeb.stopLoading()
            previewWeb.destroy()
        } catch (_: Throwable) {
        }
    }

    fun onConfigurationChanged() {
        if (isVisible) panel.post { applyHeight() }
    }

    private fun setExpanded(value: Boolean) {
        if (expanded == value) return
        expanded = value
        Prefs.write(activity, Prefs.KEY_PANEL_EXPANDED, expanded)
        btnExpand.setImageResource(if (expanded) R.drawable.ic_collapse else R.drawable.ic_expand)
        applyHeight(animated = true)
    }

    private fun applyHeight(animated: Boolean = false) {
        val parentHeight = (panel.parent as? View)?.height ?: 0
        if (parentHeight <= 0) return
        val fraction = if (expanded) 0.94f else 0.64f
        val targetHeight = (parentHeight * fraction).toInt()
        val currentHeight = panel.height
        if (!animated || currentHeight <= 0 || currentHeight == targetHeight) {
            panel.layoutParams = panel.layoutParams.also { it.height = targetHeight }
            return
        }
        ValueAnimator.ofInt(currentHeight, targetHeight).apply {
            duration = 230
            interpolator = DecelerateInterpolator(1.5f)
            addUpdateListener { anim ->
                val h = anim.animatedValue as Int
                panel.layoutParams = panel.layoutParams.also { it.height = h }
            }
            start()
        }
    }

    @SuppressLint("SetJavaScriptEnabled")
    private fun setupPreviewWeb() {
        previewWeb.setLayerType(View.LAYER_TYPE_HARDWARE, null)
        previewWeb.settings.apply {
            javaScriptEnabled = true
            domStorageEnabled = true
            allowFileAccess = false
            allowContentAccess = false
            builtInZoomControls = true
            displayZoomControls = false
            mixedContentMode = WebSettings.MIXED_CONTENT_NEVER_ALLOW
            mediaPlaybackRequiresUserGesture = false
        }
        previewWeb.webViewClient = object : WebViewClient() {

            override fun shouldInterceptRequest(
                view: WebView,
                request: WebResourceRequest
            ): WebResourceResponse? = assetLoader.shouldInterceptRequest(request.url)

            override fun onPageFinished(view: WebView, url: String) {
                if (url.startsWith(VIEWER_BASE)) {
                    viewerLoaded = true
                    previewLoading.visibility = View.GONE
                    pushPayload()
                }
            }

            override fun shouldOverrideUrlLoading(view: WebView, request: WebResourceRequest): Boolean {
                val u = request.url
                val scheme = (u.scheme ?: "").lowercase()
                if (scheme == "http" || scheme == "https") {
                    if (u.host == ASSET_HOST) return false
                    activity.openLinkExternally(u)
                    return true
                }
                return true
            }

            override fun onRenderProcessGone(view: WebView, detail: RenderProcessGoneDetail): Boolean {
                runIfAlive { rebuildViewer() }
                return true
            }
        }
    }

    private fun rebuildViewer() {
        val parent = previewWeb.parent as? ViewGroup
        if (parent == null) {
            close()
            return
        }
        val index = parent.indexOfChild(previewWeb)
        val params = previewWeb.layoutParams
        try {
            previewWeb.destroy()
        } catch (_: Throwable) {
        }
        val fresh = WebView(activity).apply { id = R.id.previewWeb }
        parent.addView(fresh, index, params)
        previewWeb = fresh
        viewerLoaded = false
        setupPreviewWeb()
        if (payload != null) ensureViewerLoaded()
    }

    private fun ensureViewerLoaded() {
        if (viewerLoaded) {
            previewLoading.visibility = View.GONE
            pushPayload()
            return
        }
        previewLoading.visibility = View.VISIBLE
        try {
            val html = activity.assets.open("viewer.html").use { it.readBytes().toString(Charsets.UTF_8) }
            previewWeb.loadDataWithBaseURL(VIEWER_BASE, html, "text/html", "utf-8", null)
        } catch (t: Throwable) {
            previewLoading.visibility = View.GONE
            activity.toast(activity.getString(R.string.preview_failed))
        }
    }

    private fun pushPayload() {
        val p = payload ?: return
        darkMode = activity.isNightUiActive()
        val render = if (p.kind == Kind.IMAGE) p.content else p.content.take(MAX_RENDER_CHARS)
        val truncated = p.kind != Kind.IMAGE && p.content.length > render.length
        val json = JSONObject()
            .put("mode", when (p.kind) {
                Kind.CODE -> "code"; Kind.HTML -> "html"
                Kind.MARKDOWN -> "md"; Kind.IMAGE -> "image"
            })
            .put("lang", p.lang)
            .put("name", p.name)
            .put("content", render)
            .put("truncated", truncated)
            .put("dark", darkMode)
        previewWeb.evaluateJavascript("window.SaliXViewer && SaliXViewer.setContent($json);", null)
    }

    private fun wirePanel() {
        btnExpand.setOnClickListener { setExpanded(!expanded) }
        btnMinimize.setOnClickListener { minimize() }
        btnClose.setOnClickListener { close() }

        attachDrag(dragBar)
        attachDrag(header)

        chipCopy.setOnClickListener { copyPayload() }
        chipSave.setOnClickListener { saveToDownloads() }
        chipShare.setOnClickListener { share() }
        chipExternal.setOnClickListener {
            val p = payload ?: return@setOnClickListener
            val file = p.file?.takeIf { it.exists() }
                ?: if (p.kind == Kind.IMAGE) null else materialize(p)
            if (file != null) openExternally(file, p.mime)
        }

        pill.setOnClickListener { restore() }
        pillClose.setOnClickListener { close() }
        scrim.setOnClickListener { minimize() }
    }

    @SuppressLint("ClickableViewAccessibility")
    private fun attachDrag(v: View) {
        v.setOnTouchListener(object : View.OnTouchListener {
            private var startY = 0f
            override fun onTouch(view: View, event: MotionEvent): Boolean {
                when (event.actionMasked) {
                    MotionEvent.ACTION_DOWN -> {
                        startY = event.rawY
                        panel.animate().cancel()
                        return true
                    }
                    MotionEvent.ACTION_MOVE -> {
                        val dy = event.rawY - startY
                        panel.translationY = if (dy > 0f) dy else dy * 0.35f
                        return true
                    }
                    MotionEvent.ACTION_UP, MotionEvent.ACTION_CANCEL -> {
                        val dy = panel.translationY
                        when {
                            dy > panel.height * 0.28f -> minimize()
                            dy < -48f && !expanded -> {
                                panel.animate().translationY(0f).setDuration(140).start()
                                setExpanded(true)
                            }
                            else -> panel.animate().translationY(0f).setDuration(160).start()
                        }
                        view.performClick()
                        return true
                    }
                }
                return false
            }
        })
    }

    private fun copyPayload() {
        val p = payload ?: return
        if (p.kind == Kind.IMAGE) {
            activity.toast(activity.getString(R.string.preview_image_copy_hint))
            return
        }
        copyToClipboard(p.content)
    }

    private fun saveToDownloads() {
        val p = payload ?: return
        activity.withDownloadsAccess { startSave(p) }
    }

    private fun startSave(p: Payload) {
        executor.execute {
            try {
                val backing = p.file
                val bytes: ByteArray = when {
                    p.kind == Kind.IMAGE -> backing?.takeIf { it.exists() }?.readBytes()
                        ?: throw IllegalStateException(activity.getString(R.string.preview_failed))
                    backing != null && backing.exists() -> backing.readBytes()
                    else -> p.content.toByteArray(Charsets.UTF_8)
                }
                writeToDownloads(ZaiPortalUtils.sanitizeFileName(p.name), p.mime.ifEmpty { "application/octet-stream" }, bytes)
                runIfAlive { activity.toast(activity.getString(R.string.saved_to_downloads)) }
            } catch (t: Throwable) {
                runIfAlive {
                    activity.toast(activity.getString(R.string.save_failed) + ": " + (t.message ?: ""))
                }
            }
        }
    }

    @Suppress("DEPRECATION")
    private fun writeToDownloads(name: String, mime: String, bytes: ByteArray) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            val resolver = activity.contentResolver
            val values = ContentValues().apply {
                put(MediaStore.Downloads.DISPLAY_NAME, name)
                put(MediaStore.Downloads.MIME_TYPE, mime)
                put(MediaStore.Downloads.RELATIVE_PATH, Environment.DIRECTORY_DOWNLOADS)
                put(MediaStore.Downloads.IS_PENDING, 1)
            }
            val uri = resolver.insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, values)
                ?: throw IllegalStateException("insert failed")
            resolver.openOutputStream(uri)?.use { it.write(bytes) }
                ?: throw IllegalStateException("stream failed")
            resolver.update(uri, ContentValues().apply {
                put(MediaStore.Downloads.IS_PENDING, 0)
            }, null, null)
        } else {
            val dir = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS)
            if (!dir.exists() && !dir.mkdirs()) throw IllegalStateException("downloads unavailable")
            File(dir, name).writeBytes(bytes)
        }
    }

    private fun share() {
        val p = payload ?: return
        val file = shareFile(p)
        if (file != null && file.exists()) {
            try {
                val uri = FileProvider.getUriForFile(activity, "${activity.packageName}.fileprovider", file)
                val intent = Intent(Intent.ACTION_SEND).apply {
                    type = p.mime.ifEmpty { "application/octet-stream" }
                    putExtra(Intent.EXTRA_STREAM, uri)
                    addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
                }
                activity.startActivity(Intent.createChooser(intent, activity.getString(R.string.share_via)))
            } catch (t: Throwable) {
                activity.toast(activity.getString(R.string.share_failed) + ": " + (t.message ?: ""))
            }
        } else if (p.kind != Kind.IMAGE) {
            try {
                val intent = Intent(Intent.ACTION_SEND).apply {
                    type = "text/plain"
                    putExtra(Intent.EXTRA_TEXT, p.content)
                }
                activity.startActivity(Intent.createChooser(intent, activity.getString(R.string.share_via)))
            } catch (t: Throwable) {
                activity.toast(activity.getString(R.string.share_failed) + ": " + (t.message ?: ""))
            }
        }
    }

    private fun shareFile(p: Payload): File? {
        val backing = p.file?.takeIf { it.exists() } ?: return if (p.kind == Kind.IMAGE) null else materialize(p)
        val desired = ZaiPortalUtils.sanitizeFileName(p.name)
        if (backing.name == desired) return backing
        val dir = File(previewDir, "share").apply { mkdirs() }
        val target = File(dir, desired)
        if (!target.exists() || target.length() != backing.length()) {
            backing.copyTo(target, overwrite = true)
        }
        return target
    }

    private fun materialize(p: Payload): File {
        val file = File(previewDir, ZaiPortalUtils.sanitizeFileName(p.name).ifEmpty { "preview.txt" })
        if (!file.exists() || file.length() == 0L) file.writeText(p.content)
        return file
    }

    private fun openExternally(file: File, mime: String) {
        try {
            val uri = FileProvider.getUriForFile(activity, "${activity.packageName}.fileprovider", file)
            val intent = Intent(Intent.ACTION_VIEW).apply {
                setDataAndType(uri, mime.ifEmpty { "*/*" })
                addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
            }
            activity.startActivity(intent)
        } catch (e: ActivityNotFoundException) {
            activity.toast(activity.getString(R.string.no_app_for_file, file.name))
        } catch (t: Throwable) {
            activity.toast(activity.getString(R.string.open_failed, t.message ?: ""))
        }
    }

    private fun pruneCache() {
        val files = previewDir.listFiles { file -> file.isFile }?.sortedBy { it.lastModified() } ?: return
        var total = files.sumOf { it.length() }
        for (file in files) {
            if (total <= MAX_CACHE_BYTES) break
            total -= file.length()
            file.delete()
        }
    }

    private fun readCapped(file: File, maxBytes: Int = MAX_TEXT_BYTES): String {
        if (file.length() <= maxBytes) return file.readText()
        val buffer = ByteArray(maxBytes)
        file.inputStream().use { stream ->
            var read = 0
            while (read < maxBytes) {
                val n = stream.read(buffer, read, maxBytes - read)
                if (n <= 0) break
                read += n
            }
            return String(buffer, 0, read, Charsets.UTF_8)
        }
    }

    private fun imageUrl(file: File): String = "$VIEWER_BASE$PREVIEW_DIR/${file.name}"

    private fun storedName(ext: String): String = "pv-${System.nanoTime()}.${ext.ifEmpty { "bin" }}"

    private fun kindFor(lang: String): Kind = when (lang) {
        "html", "svg" -> Kind.HTML
        "md", "markdown" -> Kind.MARKDOWN
        else -> Kind.CODE
    }

    private val extByLang = mapOf(
        "html" to ".html", "svg" to ".svg", "md" to ".md", "markdown" to ".md",
        "javascript" to ".js", "typescript" to ".ts", "python" to ".py",
        "kotlin" to ".kt", "java" to ".java", "json" to ".json", "xml" to ".xml",
        "css" to ".css", "scss" to ".scss", "sql" to ".sql", "bash" to ".sh",
        "c" to ".c", "cpp" to ".cpp", "csharp" to ".cs", "go" to ".go",
        "rust" to ".rs", "dart" to ".dart", "swift" to ".swift", "php" to ".php",
        "yaml" to ".yaml", "toml" to ".toml", "text" to ".txt"
    )

    private fun suggestName(lang: String, kind: Kind): String =
        "preview-" + counter.getAndIncrement() + (extByLang[lang] ?: when (kind) {
            Kind.HTML -> ".html"; Kind.MARKDOWN -> ".md"; Kind.IMAGE -> ".png"; Kind.CODE -> ".txt"
        })

    private fun mimeFor(kind: Kind): String = when (kind) {
        Kind.HTML -> "text/html"
        Kind.MARKDOWN -> "text/markdown"
        Kind.IMAGE -> "image/png"
        Kind.CODE -> "text/plain"
    }

    private fun langForExt(ext: String): String = when (ext) {
        "js", "mjs" -> "javascript"; "ts" -> "typescript"; "py" -> "python"
        "kt", "kts" -> "kotlin"; "java" -> "java"; "json" -> "json"; "xml" -> "xml"
        "css" -> "css"; "scss" -> "scss"; "sql" -> "sql"; "sh" -> "bash"
        "c" -> "c"; "cpp" -> "cpp"; "cs" -> "csharp"; "go" -> "go"; "rs" -> "rust"
        "dart" -> "dart"; "swift" -> "swift"; "php" -> "php"; "yaml", "yml" -> "yaml"
        "toml" -> "toml"; else -> "text"
    }

    private fun isHtmlFile(ext: String) = ext == "html" || ext == "htm" || ext == "svg"

    private fun isTextual(ext: String, mime: String): Boolean =
        mime.startsWith("text/") || mime.startsWith("application/json") ||
            mime.startsWith("application/javascript") || mime.startsWith("application/xml") ||
            ext in setOf(
                "js", "mjs", "ts", "jsx", "tsx", "py", "kt", "kts", "java", "json", "xml",
                "css", "scss", "less", "sql", "sh", "bash", "c", "h", "cpp", "hpp", "cs",
                "go", "rs", "dart", "swift", "php", "yaml", "yml", "toml", "ini", "cfg",
                "txt", "log", "csv", "gradle", "properties", "md"
            )

    companion object {
        private const val PREVIEW_DIR = "previews"
        private const val ASSET_HOST = "appassets.androidplatform.net"
        private const val VIEWER_BASE = "https://$ASSET_HOST/"
        private const val MAX_RENDER_CHARS = 400_000
        private const val MAX_TEXT_BYTES = 3_000_000
        private const val MAX_DOWNLOAD_BYTES = 64L * 1024 * 1024
        private const val MAX_BLOB_BYTES = 24L * 1024 * 1024
        private const val MAX_CACHE_BYTES = 80L * 1024 * 1024

        private val IMAGE_EXTS = setOf("png", "jpg", "jpeg", "gif", "webp", "bmp", "heic", "avif")
        private val counter = AtomicInteger(1)
    }
}
