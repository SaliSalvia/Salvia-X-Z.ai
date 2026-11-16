package com.salixz.app

import android.Manifest
import android.annotation.SuppressLint
import android.app.Dialog
import android.content.ActivityNotFoundException
import android.content.ClipData
import android.content.ClipboardManager
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.content.res.Configuration
import android.graphics.Color
import android.graphics.drawable.ColorDrawable
import android.net.ConnectivityManager
import android.net.Network
import android.net.NetworkCapabilities
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.os.Message
import android.text.Editable
import android.text.TextWatcher
import android.view.Gravity
import android.view.View
import android.view.ViewGroup
import android.view.WindowManager
import android.webkit.CookieManager
import android.webkit.PermissionRequest
import android.webkit.RenderProcessGoneDetail
import android.webkit.ValueCallback
import android.webkit.WebChromeClient
import android.webkit.WebResourceError
import android.webkit.WebResourceRequest
import android.webkit.WebSettings
import android.webkit.WebStorage
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.EditText
import android.widget.FrameLayout
import android.widget.ImageButton
import android.widget.ImageView
import android.widget.LinearLayout
import android.widget.ProgressBar
import android.widget.TextView
import android.widget.Toast
import androidx.activity.OnBackPressedCallback
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.appcompat.app.AppCompatDelegate
import androidx.appcompat.widget.SwitchCompat
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import androidx.core.splashscreen.SplashScreen.Companion.installSplashScreen
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat
import androidx.core.view.WindowInsetsControllerCompat
import androidx.swiperefreshlayout.widget.SwipeRefreshLayout
import androidx.webkit.WebSettingsCompat
import androidx.webkit.WebViewFeature

class MainActivity : AppCompatActivity() {

    companion object {
        const val HOME = "https://chat.z.ai"
        const val DESKTOP_UA =
            "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
        private const val SPLASH_FAILSAFE_MS = 6500L
    }

    lateinit var web: WebView
    lateinit var preview: PreviewController
    private lateinit var swipe: SwipeRefreshLayout
    private lateinit var toolbar: View
    private lateinit var progress: ProgressBar
    private lateinit var intro: FrameLayout
    private lateinit var offline: LinearLayout
    private lateinit var fullscreenContainer: FrameLayout
    private lateinit var btnRestoreBar: ImageButton
    private lateinit var tvActiveModel: TextView
    private lateinit var tvFilesBadge: TextView
    private lateinit var btnSystemPrompt: ImageButton
    private lateinit var viewSystemPromptDot: View

    @Volatile
    var currentWebUrl: String = HOME
        private set

    private val shellScript: String by lazy {
        try {
            assets.open("shell.js").use { it.readBytes().toString(Charsets.UTF_8) }
        } catch (_: Throwable) {
            ""
        }
    }

    private val mainHandler = Handler(Looper.getMainLooper())
    private val splashFailsafe = Runnable { hideIntroOnce() }

    private var connectivityManager: ConnectivityManager? = null
    private var networkCallback: ConnectivityManager.NetworkCallback? = null

    private var defaultUA: String = ""
    private var introDone = false
    private var pageLoaded = false
    private var desktopMode = false
    private var immersive = false
    private var mobileEnhance = true
    private var systemPromptText = ""
    private var systemPromptEnabled = false
    private var webScrollAtTop = true
    private var themeMode = ZaiPortalUtils.ThemeMode.LIGHT

    private var historyState: ZaiPortalUtils.HistorySyncState? = null
    private var activeArtifacts: List<ZaiPortalUtils.ArtifactSummary> = emptyList()
    private var activeHistoryDialog: Dialog? = null
    private var historyRefreshView: (() -> Unit)? = null

    private var customView: View? = null
    private var customViewCallback: WebChromeClient.CustomViewCallback? = null
    private var filePathCallback: ValueCallback<Array<Uri>>? = null
    private var pendingAudioRequest: PermissionRequest? = null
    private var pendingStorageAction: (() -> Unit)? = null

    private val pickSingle = registerForActivityResult(ActivityResultContracts.GetContent()) { uri ->
        filePathCallback?.onReceiveValue(uri?.let { arrayOf(it) })
        filePathCallback = null
    }
    private val pickMultiple = registerForActivityResult(ActivityResultContracts.GetMultipleContents()) { uris ->
        filePathCallback?.onReceiveValue(uris.toTypedArray())
        filePathCallback = null
    }
    private val requestMic = registerForActivityResult(ActivityResultContracts.RequestPermission()) { granted ->
        val req = pendingAudioRequest
        pendingAudioRequest = null
        if (granted) req?.grant(req.resources) else req?.deny()
    }
    private val requestStorage = registerForActivityResult(ActivityResultContracts.RequestPermission()) { granted ->
        val action = pendingStorageAction
        pendingStorageAction = null
        if (granted) action?.invoke() else toast(getString(R.string.storage_permission_denied))
    }

    private var backPressedAt = 0L

    override fun onCreate(savedInstanceState: Bundle?) {
        themeMode = ZaiPortalUtils.ThemeMode.fromKey(
            Prefs.readString(this, Prefs.KEY_THEME_MODE, ZaiPortalUtils.ThemeMode.LIGHT.key)
        )
        applyAppNightMode(themeMode)

        installSplashScreen()
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        web = findViewById(R.id.web)
        swipe = findViewById(R.id.swipe)
        toolbar = findViewById(R.id.toolbar)
        progress = findViewById(R.id.progress)
        intro = findViewById(R.id.intro)
        offline = findViewById(R.id.offline)
        fullscreenContainer = findViewById(R.id.fullscreenContainer)
        btnRestoreBar = findViewById(R.id.btnRestoreBar)
        tvActiveModel = findViewById(R.id.tvActiveModel)
        tvFilesBadge = findViewById(R.id.tvFilesBadge)
        btnSystemPrompt = findViewById(R.id.btnSystemPrompt)
        viewSystemPromptDot = findViewById(R.id.viewSystemPromptDot)

        desktopMode = Prefs.read(this, Prefs.KEY_DESKTOP, false)
        mobileEnhance = Prefs.read(this, Prefs.KEY_MOBILE_ENHANCE, true)
        systemPromptText = Prefs.readString(this, Prefs.KEY_SYSTEM_PROMPT, "")
        systemPromptEnabled = Prefs.read(this, Prefs.KEY_SYSTEM_ENABLED, false) && systemPromptText.isNotBlank()
        historyState = ZaiPortalUtils.parseHistorySync(
            Prefs.readString(this, Prefs.KEY_HISTORY_CACHE, "")
        )
        preview = PreviewController(this)

        setupWeb()
        setupSwipe()
        setupHeaderActions()
        setupBack()
        setupIntro()
        registerNetworkMonitor()

        if (Prefs.read(this, Prefs.KEY_IMMERSIVE, false)) enterImmersive(showToast = false)

        val restored = savedInstanceState?.let { web.restoreState(it) } != null
        if (!restored) {
            val startUrl = initialUrl()
            currentWebUrl = startUrl
            web.loadUrl(startUrl)
        } else {
            currentWebUrl = web.url ?: HOME
        }
        if (savedInstanceState == null) handleShareIntent(intent)
        handleViewIntent(intent)
    }

    private fun applyAppNightMode(mode: ZaiPortalUtils.ThemeMode) {
        val nightMode = when (mode) {
            ZaiPortalUtils.ThemeMode.LIGHT -> AppCompatDelegate.MODE_NIGHT_NO
            ZaiPortalUtils.ThemeMode.DARK -> AppCompatDelegate.MODE_NIGHT_YES
            ZaiPortalUtils.ThemeMode.AUTO -> AppCompatDelegate.MODE_NIGHT_FOLLOW_SYSTEM
        }
        if (AppCompatDelegate.getDefaultNightMode() != nightMode) {
            AppCompatDelegate.setDefaultNightMode(nightMode)
        }
    }

    fun isNightUiActive(): Boolean = when (themeMode) {
        ZaiPortalUtils.ThemeMode.DARK -> true
        ZaiPortalUtils.ThemeMode.LIGHT -> false
        ZaiPortalUtils.ThemeMode.AUTO ->
            (resources.configuration.uiMode and Configuration.UI_MODE_NIGHT_MASK) == Configuration.UI_MODE_NIGHT_YES
    }

    // ── WebView shell ─────────────────────────────────────────────────

    @SuppressLint("SetJavaScriptEnabled")
    private fun setupWeb() {
        defaultUA = web.settings.userAgentString
        web.setLayerType(View.LAYER_TYPE_HARDWARE, null)
        web.settings.apply {
            javaScriptEnabled = true
            domStorageEnabled = true
            databaseEnabled = true
            cacheMode = WebSettings.LOAD_DEFAULT
            allowFileAccess = false
            allowContentAccess = false
            mediaPlaybackRequiresUserGesture = false
            mixedContentMode = WebSettings.MIXED_CONTENT_NEVER_ALLOW
            javaScriptCanOpenWindowsAutomatically = true
            setSupportMultipleWindows(true)
            setGeolocationEnabled(false)
            if (WebViewFeature.isFeatureSupported(WebViewFeature.OFF_SCREEN_PRERASTER)) {
                WebSettingsCompat.setOffscreenPreRaster(this, true)
            }
        }
        applyDisplayMode()
        CookieManager.getInstance().apply {
            setAcceptCookie(true)
            setAcceptThirdPartyCookies(web, true)
        }
        web.addJavascriptInterface(Bridge(this), "SaliXBridge")
        web.setBackgroundColor(getColor(R.color.bg_canvas))

        web.webViewClient = object : WebViewClient() {

            override fun shouldOverrideUrlLoading(view: WebView, request: WebResourceRequest): Boolean {
                val u = request.url
                val scheme = (u.scheme ?: "").lowercase()
                if (scheme == "http" || scheme == "https") {
                    if (ZaiPortalUtils.isInternalHost(u.host)) return false
                    openLinkExternally(u)
                    return true
                }
                if (scheme == "about" || scheme == "blob" || scheme == "data" || scheme == "javascript") {
                    return false
                }
                return handOffToSystem(u)
            }

            override fun onPageStarted(view: WebView, url: String, favicon: android.graphics.Bitmap?) {
                currentWebUrl = url
                pageLoaded = false
                webScrollAtTop = true
                web.evaluateJavascript(
                    ZaiPortalUtils.buildEarlyThemeJs(mobileEnhance, isNightUiActive()),
                    null
                )
            }

            override fun onPageCommitVisible(view: WebView, url: String) {
                currentWebUrl = url
                injectShell()
            }

            override fun doUpdateVisitedHistory(view: WebView, url: String, isReload: Boolean) {
                super.doUpdateVisitedHistory(view, url, isReload)
                currentWebUrl = url
                if (ZaiPortalUtils.isInternalHost(Uri.parse(url).host)) {
                    runPortalAction("refreshHistory")
                }
            }

            override fun onPageFinished(view: WebView, url: String) {
                currentWebUrl = url
                pageLoaded = true
                swipe.isRefreshing = false
                offline.visibility = View.GONE
                hideIntroOnce()
                injectShell()
                CookieManager.getInstance().flush()
            }

            override fun onReceivedError(view: WebView, request: WebResourceRequest, error: WebResourceError) {
                if (!request.isForMainFrame) return
                val code = error.errorCode
                val isConnectivityError = code == ERROR_HOST_LOOKUP ||
                    code == ERROR_CONNECT ||
                    code == ERROR_TIMEOUT ||
                    code == ERROR_UNKNOWN
                if (isConnectivityError && !pageLoaded) {
                    showOffline()
                }
            }

            override fun onRenderProcessGone(view: WebView, detail: RenderProcessGoneDetail): Boolean {
                toast(getString(R.string.renderer_restarted))
                window.decorView.post { if (!isFinishing) recreate() }
                return true
            }
        }

        web.webChromeClient = object : WebChromeClient() {
            override fun onProgressChanged(view: WebView, newProgress: Int) {
                progress.progress = newProgress
                progress.visibility = if (newProgress in 1..99) View.VISIBLE else View.GONE
                if (newProgress >= 30) {
                    view.evaluateJavascript(
                        ZaiPortalUtils.buildEarlyThemeJs(mobileEnhance, isNightUiActive()),
                        null
                    )
                }
                if (newProgress >= 65) hideIntroOnce()
            }

            override fun onCreateWindow(
                view: WebView,
                isDialog: Boolean,
                isUserGesture: Boolean,
                resultMsg: Message
            ): Boolean {
                val popup = WebView(this@MainActivity)
                popup.settings.apply {
                    javaScriptEnabled = true
                    domStorageEnabled = true
                }
                CookieManager.getInstance().setAcceptThirdPartyCookies(popup, true)
                popup.webViewClient = object : WebViewClient() {
                    override fun shouldOverrideUrlLoading(v: WebView, request: WebResourceRequest): Boolean {
                        val uri = request.url
                        if (ZaiPortalUtils.isInternalHost(uri.host)) {
                            currentWebUrl = uri.toString()
                            web.loadUrl(uri.toString())
                        } else {
                            openLinkExternally(uri)
                        }
                        v.stopLoading()
                        v.post {
                            try {
                                v.removeAllViews()
                                v.destroy()
                            } catch (_: Throwable) {
                            }
                        }
                        return true
                    }
                }
                val transport = resultMsg.obj as? WebView.WebViewTransport ?: return false
                transport.webView = popup
                resultMsg.sendToTarget()
                return true
            }

            override fun onShowCustomView(view: View, callback: CustomViewCallback) {
                if (customView != null) {
                    callback.onCustomViewHidden()
                    return
                }
                customView = view
                customViewCallback = callback
                fullscreenContainer.addView(
                    view,
                    FrameLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT)
                )
                fullscreenContainer.visibility = View.VISIBLE
                swipe.visibility = View.GONE
                toolbar.visibility = View.GONE
            }

            override fun onHideCustomView() {
                exitFullscreenVideo()
            }

            override fun onShowFileChooser(
                view: WebView,
                callback: ValueCallback<Array<Uri>>,
                params: FileChooserParams
            ): Boolean {
                filePathCallback?.onReceiveValue(null)
                filePathCallback = callback
                val accept = params.acceptTypes
                    .firstOrNull { it.isNotBlank() && it != "*/*" && !it.contains(',') }
                    ?: "*/*"
                try {
                    if (params.mode == FileChooserParams.MODE_OPEN_MULTIPLE) pickMultiple.launch(accept)
                    else pickSingle.launch(accept)
                } catch (_: ActivityNotFoundException) {
                    filePathCallback = null
                    return false
                }
                return true
            }

            override fun onPermissionRequest(request: PermissionRequest) {
                val wantsMic = request.resources.contains(PermissionRequest.RESOURCE_AUDIO_CAPTURE)
                if (wantsMic) {
                    if (ActivityCompat.checkSelfPermission(this@MainActivity, Manifest.permission.RECORD_AUDIO)
                        == PackageManager.PERMISSION_GRANTED
                    ) {
                        request.grant(request.resources)
                    } else {
                        pendingAudioRequest = request
                        requestMic.launch(Manifest.permission.RECORD_AUDIO)
                    }
                } else {
                    request.deny()
                }
            }
        }

        web.setDownloadListener { url, ua, disposition, mime, _ ->
            preview.handleDownload(url, ua, mime, disposition)
        }

        findViewById<View>(R.id.btnRetry).setOnClickListener {
            offline.visibility = View.GONE
            val target = currentWebUrl.ifBlank { HOME }
            web.loadUrl(target)
        }
        findViewById<View>(R.id.btnOfflineBrowser).setOnClickListener {
            openInBrowser()
        }
    }

    private fun setupSwipe() {
        swipe.setOnRefreshListener { web.reload() }
        swipe.setOnChildScrollUpCallback { _, _ -> !webScrollAtTop }
        swipe.setColorSchemeColors(
            ContextCompat.getColor(this, R.color.accent_blue),
            ContextCompat.getColor(this, R.color.ink_primary)
        )
        swipe.setProgressBackgroundColorSchemeColor(
            ContextCompat.getColor(this, R.color.bg_surface_elevated)
        )
    }

    private fun registerNetworkMonitor() {
        try {
            val cm = getSystemService(Context.CONNECTIVITY_SERVICE) as? ConnectivityManager ?: return
            connectivityManager = cm
            val cb = object : ConnectivityManager.NetworkCallback() {
                override fun onAvailable(network: Network) {
                    val caps = cm.getNetworkCapabilities(network)
                    val hasNet = caps?.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET) == true
                    if (!hasNet) return
                    mainHandler.post {
                        if (isFinishing || isDestroyed) return@post
                        if (offline.visibility == View.VISIBLE || !pageLoaded) {
                            offline.visibility = View.GONE
                            toast(getString(R.string.network_restored))
                            web.loadUrl(currentWebUrl.ifBlank { HOME })
                        } else {
                            runPortalAction("refreshHistory")
                        }
                    }
                }
            }
            networkCallback = cb
            cm.registerDefaultNetworkCallback(cb)
        } catch (_: Throwable) {
        }
    }

    private fun applyDisplayMode() {
        web.settings.apply {
            userAgentString = if (desktopMode) DESKTOP_UA else defaultUA
            useWideViewPort = desktopMode
            loadWithOverviewMode = desktopMode
        }
    }

    private fun setupIntro() {
        mainHandler.postDelayed(splashFailsafe, SPLASH_FAILSAFE_MS)
        intro.post {
            intro.findViewById<View>(R.id.introLogo)?.apply {
                alpha = 0f
                scaleX = 0.9f
                scaleY = 0.9f
                animate().alpha(1f).scaleX(1f).scaleY(1f).setDuration(320).start()
            }
        }
    }

    private fun injectShell() {
        val js = shellScript
        if (js.isEmpty()) return
        val cfg = ZaiPortalUtils.buildShellConfigureJs(
            mobileEnhance,
            isNightUiActive(),
            systemPromptText,
            systemPromptEnabled && systemPromptText.isNotBlank()
        )
        web.evaluateJavascript("$js\n$cfg", null)
    }

    private fun runPortalAction(action: String, arg: String? = null) {
        web.evaluateJavascript(ZaiPortalUtils.buildShellActionJs(action, arg), null)
    }

    fun onSiteStateChanged(
        model: String,
        @Suppress("UNUSED_PARAMETER") isDark: Boolean,
        @Suppress("UNUSED_PARAMETER") isSignedIn: Boolean
    ) {
        val label = ZaiPortalUtils.formatModelLabel(model)
        if (tvActiveModel.text.toString() != label) {
            tvActiveModel.text = label
        }
    }

    fun onHistorySynced(json: String) {
        val parsed = ZaiPortalUtils.parseHistorySync(json) ?: return
        historyState = parsed
        Prefs.writeString(this, Prefs.KEY_HISTORY_CACHE, json)
        if (activeHistoryDialog?.isShowing == true) {
            historyRefreshView?.invoke()
        }
    }

    fun onArtifactsSynced(json: String) {
        activeArtifacts = ZaiPortalUtils.parseArtifactsSync(json)
        val count = activeArtifacts.size
        if (count > 0) {
            tvFilesBadge.text = if (count > 9) "9+" else count.toString()
            tvFilesBadge.visibility = View.VISIBLE
        } else {
            tvFilesBadge.visibility = View.GONE
        }
    }

    fun onWebScrollTopChanged(atTop: Boolean) {
        webScrollAtTop = atTop
    }

    private fun hideIntroOnce() {
        if (introDone) return
        introDone = true
        mainHandler.removeCallbacks(splashFailsafe)
        intro.animate().alpha(0f).setDuration(240)
            .withEndAction { intro.visibility = View.GONE }
            .start()
    }

    private fun showOffline() {
        hideIntroOnce()
        offline.visibility = View.VISIBLE
    }

    fun webUA(): String = web.settings.userAgentString

    fun toast(message: String) {
        Toast.makeText(this, message, Toast.LENGTH_SHORT).show()
    }

    fun isTrustedOrigin(url: String?): Boolean {
        if (url.isNullOrBlank()) return false
        val host = try {
            Uri.parse(url).host
        } catch (_: Throwable) {
            null
        }
        return ZaiPortalUtils.isInternalHost(host)
    }

    fun openLinkExternally(uri: Uri) {
        try {
            startActivity(Intent(Intent.ACTION_VIEW, uri))
        } catch (_: ActivityNotFoundException) {
        }
    }

    private fun handOffToSystem(uri: Uri): Boolean {
        return try {
            startActivity(Intent(Intent.ACTION_VIEW, uri))
            true
        } catch (_: ActivityNotFoundException) {
            false
        }
    }

    fun withDownloadsAccess(action: () -> Unit) {
        val needsPermission = Build.VERSION.SDK_INT < Build.VERSION_CODES.Q &&
            ContextCompat.checkSelfPermission(this, Manifest.permission.WRITE_EXTERNAL_STORAGE) !=
            PackageManager.PERMISSION_GRANTED
        if (!needsPermission) {
            action()
        } else {
            pendingStorageAction = action
            requestStorage.launch(Manifest.permission.WRITE_EXTERNAL_STORAGE)
        }
    }

    // ── Header, Synced History Drawer & Artifacts Drawer ─────────────

    private data class MenuAction(
        val icon: Int,
        val title: String,
        val subtitle: String?,
        val destructive: Boolean = false,
        val onClick: () -> Unit
    )

    @SuppressLint("ClickableViewAccessibility")
    private fun attachSpringTouch(view: View) {
        view.setOnTouchListener { v, event ->
            when (event.actionMasked) {
                android.view.MotionEvent.ACTION_DOWN ->
                    v.animate().scaleX(0.93f).scaleY(0.93f).setDuration(90).start()
                android.view.MotionEvent.ACTION_UP, android.view.MotionEvent.ACTION_CANCEL ->
                    v.animate().scaleX(1f).scaleY(1f).setDuration(160)
                        .setInterpolator(android.view.animation.OvershootInterpolator(1.2f))
                        .start()
            }
            false
        }
    }

    private fun setupHeaderActions() {
        val btnSidebar = findViewById<View>(R.id.btnSidebar)
        val btnModelPicker = findViewById<View>(R.id.btnModelPicker)
        val btnFiles = findViewById<View>(R.id.btnFiles)
        val btnNewChat = findViewById<View>(R.id.btnNewChat)
        val btnTheme = findViewById<View>(R.id.btnTheme)
        val btnMenu = findViewById<View>(R.id.btnMenu)

        listOf(btnSidebar, btnModelPicker, btnSystemPrompt, btnFiles, btnNewChat, btnTheme, btnMenu, btnRestoreBar)
            .forEach { attachSpringTouch(it) }

        btnSidebar.setOnClickListener { showHistorySheet() }
        btnModelPicker.setOnClickListener { runPortalAction("openModelPicker") }
        btnSystemPrompt.setOnClickListener { showSystemPromptSheet() }
        btnFiles.setOnClickListener { showArtifactsSheet() }
        btnNewChat.setOnClickListener {
            runPortalAction("newChat")
            activeArtifacts = emptyList()
            tvFilesBadge.visibility = View.GONE
        }
        btnTheme.setOnClickListener { toggleLightDarkTheme() }
        btnMenu.setOnClickListener { showMenu() }
        btnRestoreBar.setOnClickListener { exitImmersive() }
        updateSystemPromptIndicator()
    }

    private fun updateSystemPromptIndicator() {
        val active = systemPromptEnabled && systemPromptText.isNotBlank()
        viewSystemPromptDot.visibility = if (active) View.VISIBLE else View.GONE
        val tintColor = ContextCompat.getColor(
            this,
            if (active) R.color.accent_blue else R.color.ink_primary
        )
        btnSystemPrompt.setColorFilter(tintColor)
    }

    private fun showSystemPromptSheet() {
        val dialog = Dialog(this, R.style.Theme_SaliX_Sheet)
        dialog.setContentView(R.layout.dialog_system_prompt)

        val swEnabled = dialog.findViewById<SwitchCompat>(R.id.swSystemEnabled)
        val etPrompt = dialog.findViewById<EditText>(R.id.etSystemPrompt)
        val tvStatus = dialog.findViewById<TextView>(R.id.tvSystemStatus)
        val tvCharCount = dialog.findViewById<TextView>(R.id.tvSystemCharCount)

        swEnabled.isChecked = systemPromptEnabled
        etPrompt.setText(systemPromptText)

        fun refreshLabels() {
            val active = swEnabled.isChecked && etPrompt.text.toString().trim().isNotEmpty()
            tvStatus.text = getString(
                if (active) R.string.system_prompt_status_on else R.string.system_prompt_status_off
            )
            tvStatus.setTextColor(
                ContextCompat.getColor(
                    this,
                    if (active) R.color.accent_blue else R.color.ink_secondary
                )
            )
            tvCharCount.text = "${etPrompt.text?.length ?: 0} / 4000"
        }

        refreshLabels()
        swEnabled.setOnCheckedChangeListener { _, _ -> refreshLabels() }
        etPrompt.addTextChangedListener(object : TextWatcher {
            override fun beforeTextChanged(s: CharSequence?, start: Int, count: Int, after: Int) {}
            override fun onTextChanged(s: CharSequence?, start: Int, before: Int, count: Int) {
                if (!s.isNullOrBlank() && !swEnabled.isChecked) {
                    swEnabled.isChecked = true
                }
                refreshLabels()
            }
            override fun afterTextChanged(s: Editable?) {}
        })

        val presets = listOf(
            R.id.presetEngineer to getString(R.string.preset_engineer_text),
            R.id.presetTranslator to getString(R.string.preset_translator_text),
            R.id.presetAnalyst to getString(R.string.preset_analyst_text),
            R.id.presetConcise to getString(R.string.preset_concise_text)
        )
        presets.forEach { (id, text) ->
            dialog.findViewById<View>(id).setOnClickListener {
                etPrompt.setText(text)
                etPrompt.setSelection(text.length)
                swEnabled.isChecked = true
                refreshLabels()
            }
        }

        dialog.findViewById<View>(R.id.btnSystemClear).setOnClickListener {
            etPrompt.setText("")
            swEnabled.isChecked = false
            refreshLabels()
        }
        dialog.findViewById<View>(R.id.btnSystemCancel).setOnClickListener { dialog.dismiss() }
        dialog.findViewById<View>(R.id.btnSystemSave).setOnClickListener {
            val cleaned = etPrompt.text.toString().trim().take(4000)
            val enabled = swEnabled.isChecked && cleaned.isNotEmpty()
            systemPromptText = cleaned
            systemPromptEnabled = enabled
            Prefs.writeString(this, Prefs.KEY_SYSTEM_PROMPT, cleaned)
            Prefs.write(this, Prefs.KEY_SYSTEM_ENABLED, enabled)
            updateSystemPromptIndicator()
            web.evaluateJavascript(
                ZaiPortalUtils.buildShellConfigureJs(
                    mobileEnhance,
                    isNightUiActive(),
                    systemPromptText,
                    systemPromptEnabled
                ),
                null
            )
            toast(
                getString(
                    if (enabled) R.string.system_prompt_saved_on else R.string.system_prompt_saved_off
                )
            )
            dialog.dismiss()
        }

        dialog.window?.apply {
            setBackgroundDrawable(ColorDrawable(Color.TRANSPARENT))
            addFlags(WindowManager.LayoutParams.FLAG_DIM_BEHIND)
            setDimAmount(0.55f)
            setGravity(Gravity.BOTTOM)
            @Suppress("DEPRECATION")
            setSoftInputMode(WindowManager.LayoutParams.SOFT_INPUT_ADJUST_RESIZE)
            setLayout(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT)
        }
        dialog.show()
        dialog.window?.setLayout(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT)
    }

    private fun showHistorySheet() {
        runPortalAction("refreshHistory")
        val dialog = Dialog(this, R.style.Theme_SaliX_Sheet)
        dialog.setContentView(R.layout.dialog_history)
        activeHistoryDialog = dialog

        val accountStatus = dialog.findViewById<TextView>(R.id.historyAccountStatus)
        val accountAction = dialog.findViewById<TextView>(R.id.btnHistoryAccountAction)
        val searchInput = dialog.findViewById<EditText>(R.id.etHistorySearch)
        val container = dialog.findViewById<LinearLayout>(R.id.historyListContainer)

        fun renderHistory() {
            val st = historyState
            val signedIn = st != null && st.signedIn
            if (signedIn) {
                val identity = st.userName.ifBlank { st.userEmail.ifBlank { "Z.ai" } }
                accountStatus.text = getString(R.string.history_connected_sub, identity)
                accountAction.text = getString(R.string.menu_new_chat)
            } else {
                accountStatus.text = getString(R.string.history_guest_sub)
                accountAction.text = getString(R.string.history_sign_in)
            }

            val q = searchInput.text.toString().trim().lowercase()
            val allChats = st?.chats.orEmpty()
            val filtered = if (q.isEmpty()) allChats else allChats.filter {
                it.title.lowercase().contains(q)
            }

            container.removeAllViews()
            if (filtered.isEmpty()) {
                val empty = TextView(this).apply {
                    text = if (allChats.isEmpty()) getString(R.string.history_empty_guest)
                    else getString(R.string.history_empty_search)
                    setTextColor(ContextCompat.getColor(this@MainActivity, R.color.ink_secondary))
                    textSize = 13f
                    gravity = Gravity.CENTER
                    setPadding(44, 60, 44, 60)
                }
                container.addView(empty)
                return
            }

            filtered.forEachIndexed { idx, chat ->
                val row = layoutInflater.inflate(R.layout.view_history_row, container, false)
                val titleTv = row.findViewById<TextView>(R.id.rowTitle)
                val metaTv = row.findViewById<TextView>(R.id.rowMeta)
                val delBtn = row.findViewById<ImageButton>(R.id.rowDelete)
                val divider = row.findViewById<View>(R.id.rowDivider)

                titleTv.text = chat.title
                val isCurrent = chat.id == st?.activeChatId
                if (isCurrent) {
                    titleTv.setTextColor(ContextCompat.getColor(this, R.color.accent_blue))
                }
                val metaParts = mutableListOf<String>()
                if (chat.pinned) metaParts.add(getString(R.string.history_pinned_badge))
                if (isCurrent) metaParts.add(getString(R.string.history_active_badge))
                val formattedDate = ZaiPortalUtils.formatRelativeTime(chat.updatedAt)
                if (formattedDate.isNotEmpty()) metaParts.add(formattedDate)
                metaTv.text = metaParts.joinToString(" · ").ifEmpty { "chat.z.ai" }

                row.setOnClickListener {
                    dialog.dismiss()
                    runPortalAction("openChat", chat.id)
                }
                delBtn.setOnClickListener {
                    runPortalAction("deleteChat", chat.id)
                    historyState = st?.copy(chats = st.chats.filterNot { it.id == chat.id })
                    renderHistory()
                }
                divider.visibility = if (idx < filtered.lastIndex) View.VISIBLE else View.GONE
                row.alpha = 0f
                row.translationY = 16f
                container.addView(row)
                row.animate()
                    .alpha(1f)
                    .translationY(0f)
                    .setDuration(200)
                    .setStartDelay((idx.coerceAtMost(8) * 26).toLong())
                    .setInterpolator(android.view.animation.DecelerateInterpolator(1.4f))
                    .start()
            }
        }

        historyRefreshView = { renderHistory() }
        renderHistory()

        accountAction.setOnClickListener {
            dialog.dismiss()
            if (historyState?.signedIn == true) {
                runPortalAction("newChat")
            } else {
                runPortalAction("openSignIn")
            }
        }

        dialog.findViewById<View>(R.id.btnHistorySync).setOnClickListener {
            runPortalAction("refreshHistory")
            toast(getString(R.string.history_synced_toast))
        }

        searchInput.addTextChangedListener(object : TextWatcher {
            override fun beforeTextChanged(s: CharSequence?, start: Int, count: Int, after: Int) {}
            override fun onTextChanged(s: CharSequence?, start: Int, before: Int, count: Int) {
                renderHistory()
            }
            override fun afterTextChanged(s: Editable?) {}
        })

        dialog.findViewById<View>(R.id.btnOpenWebSidebar).setOnClickListener {
            dialog.dismiss()
            runPortalAction("toggleSidebar")
        }
        dialog.findViewById<View>(R.id.btnHistoryClose).setOnClickListener { dialog.dismiss() }
        dialog.setOnDismissListener {
            if (activeHistoryDialog === dialog) {
                activeHistoryDialog = null
                historyRefreshView = null
            }
        }

        dialog.window?.apply {
            setBackgroundDrawable(ColorDrawable(Color.TRANSPARENT))
            addFlags(WindowManager.LayoutParams.FLAG_DIM_BEHIND)
            setDimAmount(0.55f)
            setGravity(Gravity.BOTTOM)
            setLayout(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT)
        }
        dialog.show()
        dialog.window?.setLayout(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT)
    }

    private fun showArtifactsSheet() {
        val dialog = Dialog(this, R.style.Theme_SaliX_Sheet)
        dialog.setContentView(R.layout.dialog_artifacts)
        val container = dialog.findViewById<LinearLayout>(R.id.artifactsContainer)

        val items = activeArtifacts
        if (items.isEmpty()) {
            val empty = TextView(this).apply {
                text = getString(R.string.artifacts_empty)
                setTextColor(ContextCompat.getColor(this@MainActivity, R.color.ink_secondary))
                textSize = 13f
                gravity = Gravity.CENTER
                setPadding(44, 60, 44, 60)
            }
            container.addView(empty)
        } else {
            items.forEachIndexed { idx, item ->
                val row = layoutInflater.inflate(R.layout.view_history_row, container, false)
                row.findViewById<TextView>(R.id.rowTitle).text = item.name
                val sizeLabel = if (item.size > 0) "${item.size} کاراکتر" else "تصویر"
                row.findViewById<TextView>(R.id.rowMeta).text = "${item.lang.uppercase()} · $sizeLabel"
                row.findViewById<View>(R.id.rowDelete).visibility = View.GONE
                row.findViewById<View>(R.id.rowDivider).visibility =
                    if (idx < items.lastIndex) View.VISIBLE else View.GONE
                row.setOnClickListener {
                    dialog.dismiss()
                    runPortalAction("openArtifactByIndex", item.index.toString())
                }
                row.alpha = 0f
                row.translationY = 16f
                container.addView(row)
                row.animate()
                    .alpha(1f)
                    .translationY(0f)
                    .setDuration(200)
                    .setStartDelay((idx.coerceAtMost(8) * 26).toLong())
                    .setInterpolator(android.view.animation.DecelerateInterpolator(1.4f))
                    .start()
            }
        }

        dialog.findViewById<View>(R.id.btnArtifactsClose).setOnClickListener { dialog.dismiss() }
        dialog.window?.apply {
            setBackgroundDrawable(ColorDrawable(Color.TRANSPARENT))
            addFlags(WindowManager.LayoutParams.FLAG_DIM_BEHIND)
            setDimAmount(0.55f)
            setGravity(Gravity.BOTTOM)
            setLayout(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT)
        }
        dialog.show()
        dialog.window?.setLayout(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT)
    }

    private fun toggleLightDarkTheme() {
        val next = if (isNightUiActive()) ZaiPortalUtils.ThemeMode.LIGHT else ZaiPortalUtils.ThemeMode.DARK
        setThemeMode(next)
    }

    private fun cycleThemeMode() {
        val next = when (themeMode) {
            ZaiPortalUtils.ThemeMode.LIGHT -> ZaiPortalUtils.ThemeMode.DARK
            ZaiPortalUtils.ThemeMode.DARK -> ZaiPortalUtils.ThemeMode.AUTO
            ZaiPortalUtils.ThemeMode.AUTO -> ZaiPortalUtils.ThemeMode.LIGHT
        }
        setThemeMode(next)
    }

    private fun setThemeMode(mode: ZaiPortalUtils.ThemeMode) {
        themeMode = mode
        Prefs.writeString(this, Prefs.KEY_THEME_MODE, mode.key)
        val dark = isNightUiActive()
        runPortalAction("setTheme", if (dark) "true" else "false")
        web.evaluateJavascript(
            ZaiPortalUtils.buildShellConfigureJs(
                mobileEnhance,
                dark,
                systemPromptText,
                systemPromptEnabled && systemPromptText.isNotBlank()
            ),
            null
        )
        preview.setDarkTheme(dark)
        applyAppNightMode(mode)
    }

    private fun showMenu() {
        val dialog = Dialog(this, R.style.Theme_SaliX_Sheet)
        dialog.setContentView(R.layout.dialog_menu)

        val modeBindings = listOf(
            R.id.modeFullStack to "Full-Stack",
            R.id.modeWriting to "Writing",
            R.id.modeData to "Data Insight",
            R.id.modePpt to "PPT",
            R.id.modeWebsite to "Web Site",
            R.id.modeScheduled to "Scheduled"
        )
        modeBindings.forEach { (id, target) ->
            dialog.findViewById<View>(id)?.setOnClickListener {
                dialog.dismiss()
                runPortalAction("triggerMode", target)
            }
        }

        val rows = dialog.findViewById<LinearLayout>(R.id.menuRows)
        val actions = buildMenuActions()

        actions.forEachIndexed { index, action ->
            val row = layoutInflater.inflate(R.layout.view_menu_row, rows, false)
            val iconView = row.findViewById<ImageView>(R.id.menuIcon)
            iconView.setImageResource(action.icon)
            row.findViewById<TextView>(R.id.menuTitle).apply {
                text = action.title
                if (action.destructive) setTextColor(ContextCompat.getColor(this@MainActivity, R.color.status_error))
            }
            val sub = row.findViewById<TextView>(R.id.menuSubtitle)
            if (action.subtitle.isNullOrBlank()) {
                sub.visibility = View.GONE
            } else {
                sub.text = action.subtitle
            }
            if (action.destructive) {
                iconView.setColorFilter(ContextCompat.getColor(this, R.color.status_error))
            }
            row.findViewById<View>(R.id.menuDivider).visibility =
                if (index < actions.lastIndex) View.VISIBLE else View.GONE
            row.setOnClickListener {
                dialog.dismiss()
                action.onClick()
            }
            rows.addView(row)
        }

        dialog.findViewById<View>(R.id.menuCancel).setOnClickListener { dialog.dismiss() }
        dialog.window?.apply {
            setBackgroundDrawable(ColorDrawable(Color.TRANSPARENT))
            addFlags(WindowManager.LayoutParams.FLAG_DIM_BEHIND)
            setDimAmount(0.55f)
            setGravity(Gravity.BOTTOM)
            setLayout(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT)
        }
        dialog.show()
        dialog.window?.setLayout(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT)
    }

    private fun buildMenuActions(): List<MenuAction> {
        val themeTitle = when (themeMode) {
            ZaiPortalUtils.ThemeMode.LIGHT -> getString(R.string.menu_theme_light)
            ZaiPortalUtils.ThemeMode.DARK -> getString(R.string.menu_theme_dark)
            ZaiPortalUtils.ThemeMode.AUTO -> getString(R.string.menu_theme_auto)
        }
        return listOf(
            MenuAction(
                R.drawable.ic_system_prompt,
                getString(R.string.menu_system_prompt),
                if (systemPromptEnabled && systemPromptText.isNotBlank()) getString(R.string.menu_system_prompt_on_sub)
                else getString(R.string.menu_system_prompt_off_sub)
            ) { showSystemPromptSheet() },
            MenuAction(
                R.drawable.ic_new_chat,
                getString(R.string.menu_new_chat),
                getString(R.string.menu_new_chat_sub)
            ) { runPortalAction("newChat") },
            MenuAction(
                R.drawable.ic_sidebar,
                getString(R.string.menu_sidebar),
                getString(R.string.menu_sidebar_sub)
            ) { showHistorySheet() },
            MenuAction(
                R.drawable.ic_files,
                getString(R.string.menu_artifacts),
                getString(R.string.menu_artifacts_sub)
            ) { showArtifactsSheet() },
            MenuAction(
                R.drawable.ic_model,
                getString(R.string.menu_model_picker),
                getString(R.string.menu_model_picker_sub)
            ) { runPortalAction("openModelPicker") },
            MenuAction(
                R.drawable.ic_paste,
                getString(R.string.menu_paste_clipboard),
                getString(R.string.menu_paste_clipboard_sub)
            ) { pasteClipboardIntoChat() },
            MenuAction(
                R.drawable.ic_theme,
                themeTitle,
                getString(R.string.menu_theme_sub)
            ) { cycleThemeMode() },
            MenuAction(
                R.drawable.ic_enhance,
                if (mobileEnhance) getString(R.string.menu_mobile_enhance_on) else getString(R.string.menu_mobile_enhance_off),
                getString(R.string.menu_mobile_enhance_sub)
            ) { toggleMobileEnhance() },
            MenuAction(
                R.drawable.ic_refresh,
                getString(R.string.menu_refresh),
                getString(R.string.menu_refresh_sub)
            ) { web.reload() },
            MenuAction(
                if (desktopMode) R.drawable.ic_mobile else R.drawable.ic_desktop,
                if (desktopMode) getString(R.string.menu_mobile) else getString(R.string.menu_desktop),
                getString(R.string.menu_desktop_sub)
            ) { toggleDesktop() },
            MenuAction(
                if (immersive) R.drawable.ic_arrow_down else R.drawable.ic_expand,
                if (immersive) getString(R.string.menu_show_bar) else getString(R.string.menu_immersive),
                getString(R.string.menu_immersive_sub)
            ) { toggleImmersive() },
            MenuAction(
                R.drawable.ic_open_ext,
                getString(R.string.menu_open_browser),
                getString(R.string.menu_open_browser_sub)
            ) { openInBrowser() },
            MenuAction(
                R.drawable.ic_delete,
                getString(R.string.menu_clear_data),
                getString(R.string.menu_clear_data_sub),
                destructive = true
            ) { confirmClearData() },
            MenuAction(
                R.drawable.ic_info,
                getString(R.string.menu_about),
                getString(R.string.about_version, BuildConfig.VERSION_NAME)
            ) { showAbout() }
        )
    }

    private fun pasteClipboardIntoChat() {
        val cm = getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager
        val clip = cm.primaryClip?.takeIf { it.itemCount > 0 }?.getItemAt(0)?.coerceToText(this)?.toString()
        if (clip.isNullOrBlank()) {
            toast(getString(R.string.clipboard_empty))
            return
        }
        runPortalAction("pasteText", clip)
        toast(getString(R.string.pasted_to_chat))
    }

    private fun toggleMobileEnhance() {
        mobileEnhance = !mobileEnhance
        Prefs.write(this, Prefs.KEY_MOBILE_ENHANCE, mobileEnhance)
        web.evaluateJavascript(
            ZaiPortalUtils.buildShellConfigureJs(
                mobileEnhance,
                isNightUiActive(),
                systemPromptText,
                systemPromptEnabled && systemPromptText.isNotBlank()
            ),
            null
        )
        toast(if (mobileEnhance) getString(R.string.menu_mobile_enhance_on) else getString(R.string.menu_mobile_enhance_off))
    }

    private fun toggleDesktop() {
        desktopMode = !desktopMode
        Prefs.write(this, Prefs.KEY_DESKTOP, desktopMode)
        applyDisplayMode()
        toast(if (desktopMode) getString(R.string.menu_desktop) else getString(R.string.menu_mobile))
        web.reload()
    }

    private fun toggleImmersive() {
        if (immersive) exitImmersive() else enterImmersive()
    }

    private fun enterImmersive(showToast: Boolean = true) {
        immersive = true
        Prefs.write(this, Prefs.KEY_IMMERSIVE, true)
        toolbar.visibility = View.GONE
        btnRestoreBar.visibility = View.VISIBLE
        WindowCompat.getInsetsController(window, window.decorView).apply {
            hide(WindowInsetsCompat.Type.systemBars())
            systemBarsBehavior = WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
        }
        if (showToast) toast(getString(R.string.menu_show_bar))
    }

    private fun exitImmersive() {
        immersive = false
        Prefs.write(this, Prefs.KEY_IMMERSIVE, false)
        btnRestoreBar.visibility = View.GONE
        toolbar.visibility = View.VISIBLE
        WindowCompat.getInsetsController(window, window.decorView)
            .show(WindowInsetsCompat.Type.systemBars())
    }

    private fun openInBrowser() {
        openLinkExternally(Uri.parse(currentWebUrl.ifBlank { HOME }))
    }

    private fun confirmClearData() {
        androidx.appcompat.app.AlertDialog.Builder(this)
            .setTitle(getString(R.string.menu_clear_data))
            .setMessage(getString(R.string.clear_data_confirm))
            .setPositiveButton(getString(R.string.preview_close)) { _, _ -> clearAllData() }
            .setNegativeButton(android.R.string.cancel, null)
            .show()
    }

    private fun clearAllData() {
        web.clearCache(true)
        web.clearHistory()
        web.clearFormData()
        WebStorage.getInstance().deleteAllData()
        Prefs.writeString(this, Prefs.KEY_HISTORY_CACHE, "")
        historyState = null
        activeArtifacts = emptyList()
        tvFilesBadge.visibility = View.GONE
        val cm = CookieManager.getInstance()
        cm.removeAllCookies { }
        cm.removeSessionCookies { }
        cm.flush()
        try {
            java.io.File(cacheDir, "previews").deleteRecursively()
        } catch (_: Throwable) {
        }
        toast(getString(R.string.data_cleared))
        currentWebUrl = HOME
        web.loadUrl(HOME)
    }

    private fun showAbout() {
        androidx.appcompat.app.AlertDialog.Builder(this)
            .setTitle(getString(R.string.app_brand_full))
            .setMessage(getString(R.string.about_body, BuildConfig.VERSION_NAME))
            .setPositiveButton(android.R.string.ok, null)
            .show()
    }

    // ── Back navigation ───────────────────────────────────────────────

    private fun setupBack() {
        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                when {
                    customView != null -> exitFullscreenVideo()
                    preview.isVisible -> preview.minimize()
                    preview.pillVisible -> preview.close()
                    web.canGoBack() -> web.goBack()
                    else -> {
                        val now = System.currentTimeMillis()
                        if (now - backPressedAt < 2000) finish()
                        else {
                            backPressedAt = now
                            toast(getString(R.string.exit_hint))
                        }
                    }
                }
            }
        })
    }

    private fun exitFullscreenVideo() {
        customView?.let { fullscreenContainer.removeView(it) }
        customView = null
        fullscreenContainer.visibility = View.GONE
        swipe.visibility = View.VISIBLE
        toolbar.visibility = if (immersive) View.GONE else View.VISIBLE
        customViewCallback?.onCustomViewHidden()
        customViewCallback = null
    }

    // ── Intents ───────────────────────────────────────────────────────

    private fun initialUrl(): String {
        val data = intent?.takeIf { it.action == Intent.ACTION_VIEW }?.data
        return if (data != null && ZaiPortalUtils.isInternalHost(data.host)) data.toString() else HOME
    }

    private fun handleViewIntent(intent: Intent?) {
        if (intent?.action != Intent.ACTION_VIEW) return
        val data = intent.data ?: return
        if (ZaiPortalUtils.isInternalHost(data.host) && data.toString() != currentWebUrl) {
            currentWebUrl = data.toString()
            web.loadUrl(currentWebUrl)
        }
    }

    private fun handleShareIntent(intent: Intent?) {
        if (intent?.action != Intent.ACTION_SEND || intent.type != "text/plain") return
        val text = intent.getStringExtra(Intent.EXTRA_TEXT) ?: return
        val cm = getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager
        cm.setPrimaryClip(ClipData.newPlainText("SaliX-Z", text))
        toast(getString(R.string.shared_text_copied))
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        setIntent(intent)
        handleShareIntent(intent)
        handleViewIntent(intent)
    }

    // ── Lifecycle ─────────────────────────────────────────────────────

    override fun onSaveInstanceState(outState: Bundle) {
        super.onSaveInstanceState(outState)
        web.saveState(outState)
    }

    override fun onConfigurationChanged(newConfig: Configuration) {
        super.onConfigurationChanged(newConfig)
        preview.onConfigurationChanged()
    }

    override fun onPause() {
        CookieManager.getInstance().flush()
        web.onPause()
        web.pauseTimers()
        super.onPause()
    }

    override fun onResume() {
        super.onResume()
        web.resumeTimers()
        web.onResume()
    }

    override fun onDestroy() {
        mainHandler.removeCallbacks(splashFailsafe)
        try {
            networkCallback?.let { connectivityManager?.unregisterNetworkCallback(it) }
        } catch (_: Throwable) {
        }
        activeHistoryDialog?.dismiss()
        preview.destroy()
        web.destroy()
        super.onDestroy()
    }
}
