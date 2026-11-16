package com.salixz.app

import org.json.JSONArray
import org.json.JSONObject
import java.net.URL
import java.net.URLDecoder
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

/**
 * Pure, testable portal routing, history parsing, artifact parsing, and JS-bridge helpers.
 */
object ZaiPortalUtils {

    enum class ThemeMode(val key: String) {
        LIGHT("light"),
        DARK("dark"),
        AUTO("auto");

        companion object {
            fun fromKey(key: String?): ThemeMode =
                entries.firstOrNull { it.key == key } ?: LIGHT
        }
    }

    data class ChatSummary(
        val id: String,
        val title: String,
        val updatedAt: Long,
        val pinned: Boolean
    )

    data class HistorySyncState(
        val signedIn: Boolean,
        val userName: String,
        val userEmail: String,
        val activeChatId: String,
        val chats: List<ChatSummary>
    )

    data class ArtifactSummary(
        val index: Int,
        val type: String,
        val lang: String,
        val name: String,
        val size: Int,
        val url: String
    )

    private val INTERNAL_DOMAINS = listOf("z.ai")
    private val AUTH_DOMAINS = listOf(
        "accounts.google.com",
        "appleid.apple.com",
        "github.com",
        "login.microsoftonline.com"
    )

    fun isInternalHost(host: String?): Boolean {
        val h = host?.lowercase()?.trim() ?: return false
        if (h.isEmpty()) return false
        return INTERNAL_DOMAINS.any { h == it || h.endsWith(".$it") } ||
            AUTH_DOMAINS.any { h == it || h.endsWith(".$it") }
    }

    fun normalizeLang(lang: String): String {
        val l = lang.trim().lowercase()
        return when (l) {
            "", "plaintext", "text", "txt", "none" -> "text"
            "js" -> "javascript"
            "ts" -> "typescript"
            "py" -> "python"
            "kt", "kts" -> "kotlin"
            "rs" -> "rust"
            "sh", "shell", "zsh" -> "bash"
            "yml" -> "yaml"
            "htm" -> "html"
            "c++", "cpp", "cxx" -> "cpp"
            "cs", "c#" -> "csharp"
            else -> l
        }
    }

    fun formatModelLabel(raw: String?): String {
        val cleaned = raw?.replace(Regex("\\s+"), " ")?.trim().orEmpty()
        if (cleaned.isEmpty() || cleaned.length > 36) return "GLM-5.3-Flash"
        return cleaned
    }

    fun sanitizeFileName(name: String): String =
        name.replace(Regex("[/\\\\:*?\"<>|\\u0000-\\u001F]"), "_")
            .trim()
            .take(120)
            .ifEmpty { "file.bin" }

    fun extOf(name: String, mime: String): String {
        val ext = name.substringAfterLast('.', "").lowercase()
        if (ext.isNotEmpty() && ext.length <= 5) return ext
        return when {
            mime.startsWith("image/") -> mime.substringAfter('/').replace("jpeg", "jpg")
            mime == "text/html" -> "html"
            mime == "application/pdf" -> "pdf"
            mime.startsWith("text/") -> "txt"
            else -> "bin"
        }
    }

    fun guessFileName(disposition: String?, url: String, mime: String, fallbackStamp: Long = System.currentTimeMillis() / 1000 % 100000): String {
        val raw = disposition?.trim().orEmpty()
        if (raw.isNotEmpty()) {
            Regex("""filename\*=UTF-8''([^;]+)""").find(raw)?.groupValues?.get(1)?.let { value ->
                val decoded = try {
                    URLDecoder.decode(value.trim('"', ' '), "UTF-8")
                } catch (_: Throwable) {
                    value
                }
                return decoded
            }
            Regex("""filename="?([^";]+)"?""").find(raw)?.groupValues?.get(1)?.let { value ->
                return value.trim()
            }
            if (!raw.contains('/') && raw.contains('.') && !raw.contains(';')) return raw
        }
        val path = try {
            URL(url).path
        } catch (_: Exception) {
            url
        }
        val last = path.substringAfterLast('/')
        if (last.isNotEmpty() && last.contains('.')) return last
        val ext = when {
            mime.startsWith("image/") -> mime.substringAfter('/').replace("jpeg", "jpg")
            mime == "text/html" -> "html"
            mime == "application/pdf" -> "pdf"
            mime.startsWith("text/") -> "txt"
            else -> "bin"
        }
        return "download-$fallbackStamp.$ext"
    }

    fun parseHistorySync(jsonStr: String): HistorySyncState? {
        if (jsonStr.isBlank()) return null
        return try {
            val obj = JSONObject(jsonStr)
            val arr = obj.optJSONArray("chats") ?: JSONArray()
            val chats = ArrayList<ChatSummary>(arr.length())
            for (i in 0 until arr.length()) {
                val item = arr.optJSONObject(i) ?: continue
                val id = item.optString("id", "").trim()
                if (id.isEmpty()) continue
                val title = item.optString("title", "گفتگوی Z.ai").trim().ifEmpty { "گفتگوی Z.ai" }
                chats.add(
                    ChatSummary(
                        id = id,
                        title = title,
                        updatedAt = item.optLong("updatedAt", 0L),
                        pinned = item.optBoolean("pinned", false)
                    )
                )
            }
            HistorySyncState(
                signedIn = obj.optBoolean("signedIn", false),
                userName = obj.optString("userName", "").trim(),
                userEmail = obj.optString("userEmail", "").trim(),
                activeChatId = obj.optString("activeChatId", "").trim(),
                chats = chats
            )
        } catch (_: Throwable) {
            null
        }
    }

    fun parseArtifactsSync(jsonStr: String): List<ArtifactSummary> {
        if (jsonStr.isBlank()) return emptyList()
        return try {
            val arr = JSONArray(jsonStr)
            val out = ArrayList<ArtifactSummary>(arr.length())
            for (i in 0 until arr.length()) {
                val item = arr.optJSONObject(i) ?: continue
                out.add(
                    ArtifactSummary(
                        index = item.optInt("index", i),
                        type = item.optString("type", "code"),
                        lang = normalizeLang(item.optString("lang", "text")),
                        name = item.optString("name", "file-${i + 1}.txt"),
                        size = item.optInt("size", 0),
                        url = item.optString("url", "")
                    )
                )
            }
            out
        } catch (_: Throwable) {
            emptyList()
        }
    }

    fun formatRelativeTime(epochSecondsOrMs: Long): String {
        if (epochSecondsOrMs <= 0L) return ""
        val ms = if (epochSecondsOrMs < 10_000_000_000L) epochSecondsOrMs * 1000L else epochSecondsOrMs
        val sdf = SimpleDateFormat("yyyy/MM/dd · HH:mm", Locale.getDefault())
        return sdf.format(Date(ms))
    }

    fun buildEarlyThemeJs(enhance: Boolean, dark: Boolean): String = """
        (function(){
          try {
            localStorage.setItem('theme', ${if (dark) "'dark'" else "'light'"});
            var d = document.documentElement;
            d.classList.toggle('dark', $dark);
            d.classList.toggle('light', ${!dark});
            d.classList.toggle('salix-enhanced', $enhance);
            d.style.colorScheme = ${if (dark) "'dark'" else "'light'"};
          } catch(e) {}
        })();
    """.trimIndent()

    fun buildShellConfigureJs(enhance: Boolean, dark: Boolean): String =
        "window.__salixActions && window.__salixActions.configure({enhance:$enhance,dark:$dark});"

    fun buildShellActionJs(action: String, arg: String? = null): String {
        val call = if (arg == null) {
            "window.__salixActions.$action()"
        } else {
            "window.__salixActions.$action(${JSONObject.quote(arg)})"
        }
        return "window.__salixActions && $call;"
    }
}
