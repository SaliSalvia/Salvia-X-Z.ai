package com.salixz.app

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertTrue
import org.junit.Test

class ZaiPortalUtilsTest {

    @Test
    fun `isInternalHost and isOAuthHost allow z_ai and oauth providers and reject external hosts`() {
        assertTrue(ZaiPortalUtils.isInternalHost("chat.z.ai"))
        assertTrue(ZaiPortalUtils.isInternalHost("z.ai"))
        assertTrue(ZaiPortalUtils.isInternalHost("accounts.google.com"))
        assertTrue(ZaiPortalUtils.isInternalHost("github.com"))
        assertTrue(ZaiPortalUtils.isOAuthHost("accounts.google.com"))
        assertTrue(ZaiPortalUtils.isOAuthHost("login.microsoftonline.com"))
        assertFalse(ZaiPortalUtils.isOAuthHost("chat.z.ai"))
        assertFalse(ZaiPortalUtils.isInternalHost("evil-z.ai"))
        assertFalse(ZaiPortalUtils.isInternalHost("example.com"))
        assertFalse(ZaiPortalUtils.isInternalHost(null))
        assertFalse(ZaiPortalUtils.isInternalHost(""))
    }

    @Test
    fun `cleanMobileUserAgent strips wv WebView marker for OAuth compatibility`() {
        val raw = "Mozilla/5.0 (Linux; Android 14; Pixel 8 Build/AP1A; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/124.0.6367.82 Mobile Safari/537.36"
        val cleaned = ZaiPortalUtils.cleanMobileUserAgent(raw)
        assertFalse(cleaned.contains("; wv"))
        assertTrue(cleaned.contains("Pixel 8 Build/AP1A)"))
        assertTrue(cleaned.contains("Chrome/124.0.6367.82"))

        val fallback = ZaiPortalUtils.cleanMobileUserAgent("   ")
        assertTrue(fallback.contains("Mobile Safari/537.36"))
    }

    @Test
    fun `normalizeLang maps aliases and defaults blanks to text`() {
        assertEquals("javascript", ZaiPortalUtils.normalizeLang("JS"))
        assertEquals("typescript", ZaiPortalUtils.normalizeLang("ts"))
        assertEquals("python", ZaiPortalUtils.normalizeLang("py"))
        assertEquals("kotlin", ZaiPortalUtils.normalizeLang("kt"))
        assertEquals("cpp", ZaiPortalUtils.normalizeLang("c++"))
        assertEquals("text", ZaiPortalUtils.normalizeLang(""))
        assertEquals("text", ZaiPortalUtils.normalizeLang("plaintext"))
    }

    @Test
    fun `formatModelLabel cleans whitespace and falls back cleanly`() {
        assertEquals("GLM-5.3-Flash", ZaiPortalUtils.formatModelLabel(""))
        assertEquals("GLM-5.3-Flash", ZaiPortalUtils.formatModelLabel(null))
        assertEquals("GLM-5.3", ZaiPortalUtils.formatModelLabel("  GLM-5.3 \n "))
        assertEquals("GLM-5.3-Flash", ZaiPortalUtils.formatModelLabel("A".repeat(50)))
    }

    @Test
    fun `guessFileName parses utf8 content-disposition and mime fallbacks`() {
        assertEquals(
            "گزارش.md",
            ZaiPortalUtils.guessFileName("attachment; filename*=UTF-8''%DA%AF%D8%B2%D8%A7%D8%B1%D8%B4.md", "https://chat.z.ai/dl", "text/markdown", 123L)
        )
        assertEquals(
            "chart.png",
            ZaiPortalUtils.guessFileName("inline; filename=\"chart.png\"", "https://chat.z.ai/blob", "image/png", 123L)
        )
        assertEquals(
            "download-42.html",
            ZaiPortalUtils.guessFileName(null, "https://chat.z.ai/export", "text/html", 42L)
        )
    }

    @Test
    fun `sanitizeFileName strips unsafe characters`() {
        assertEquals("a_b_c.txt", ZaiPortalUtils.sanitizeFileName("a/b:c.txt"))
        assertEquals("file.bin", ZaiPortalUtils.sanitizeFileName("   "))
    }

    @Test
    fun `buildShellActionJs safely quotes arguments`() {
        assertEquals(
            "window.__salixActions && window.__salixActions.newChat();",
            ZaiPortalUtils.buildShellActionJs("newChat")
        )
        val pasteJs = ZaiPortalUtils.buildShellActionJs("pasteText", "hello \"world\"\nline2")
        assertTrue(pasteJs.contains("pasteText(\"hello \\\"world\\\"\\nline2\")"))
    }

    @Test
    fun `buildShellConfigureJs serializes system prompt text and enabled flag safely`() {
        val js = ZaiPortalUtils.buildShellConfigureJs(
            enhance = true,
            dark = true,
            systemPrompt = "فقط به \"فارسی\" پاسخ بده\nکد تمیز بده",
            systemEnabled = true
        )
        assertTrue(js.contains("enhance:true,dark:true"))
        assertTrue(js.contains("systemEnabled:true"))
        assertTrue(js.contains("systemPrompt:\"فقط به \\\"فارسی\\\" پاسخ بده\\nکد تمیز بده\""))
    }

    @Test
    fun `parseHistorySync parses account profile and conversation list`() {
        val raw = """
            {
              "signedIn": true,
              "userName": "Salar",
              "userEmail": "salar@example.com",
              "activeChatId": "c-102",
              "chats": [
                {"id": "c-101", "title": "طراحی رابط موبایل", "updatedAt": 1760000000, "pinned": true},
                {"id": "c-102", "title": "اسکریپت پایتون", "updatedAt": 1760001000, "pinned": false}
              ]
            }
        """.trimIndent()
        val parsed = ZaiPortalUtils.parseHistorySync(raw)
        assertNotNull(parsed)
        assertTrue(parsed!!.signedIn)
        assertEquals("Salar", parsed.userName)
        assertEquals("c-102", parsed.activeChatId)
        assertEquals(2, parsed.chats.size)
        assertTrue(parsed.chats[0].pinned)
        assertEquals("طراحی رابط موبایل", parsed.chats[0].title)
    }

    @Test
    fun `parseArtifactsSync normalizes languages and returns artifacts`() {
        val raw = """
            [
              {"index": 0, "type": "code", "lang": "py", "name": "file-1.py", "size": 120, "url": ""},
              {"index": 1, "type": "image", "lang": "image", "name": "chart.png", "size": 0, "url": "https://chat.z.ai/img.png"}
            ]
        """.trimIndent()
        val items = ZaiPortalUtils.parseArtifactsSync(raw)
        assertEquals(2, items.size)
        assertEquals("python", items[0].lang)
        assertEquals("image", items[1].type)
    }
}
