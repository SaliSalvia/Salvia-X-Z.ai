package com.salixz.app

import android.content.Context

object Prefs {
    private const val FILE = "salix_prefs"
    const val KEY_DESKTOP = "desktop_mode"
    const val KEY_IMMERSIVE = "immersive"
    const val KEY_PANEL_EXPANDED = "panel_expanded"
    const val KEY_MOBILE_ENHANCE = "mobile_enhance"
    const val KEY_THEME_MODE = "theme_mode"
    const val KEY_HISTORY_CACHE = "history_cache_json"
    const val KEY_SYSTEM_PROMPT = "system_prompt_text"
    const val KEY_SYSTEM_ENABLED = "system_prompt_enabled"

    private fun sp(ctx: Context) =
        ctx.getSharedPreferences(FILE, Context.MODE_PRIVATE)

    fun read(ctx: Context, key: String, def: Boolean = false): Boolean =
        sp(ctx).getBoolean(key, def)

    fun write(ctx: Context, key: String, value: Boolean) {
        sp(ctx).edit().putBoolean(key, value).apply()
    }

    fun readString(ctx: Context, key: String, def: String): String =
        sp(ctx).getString(key, def) ?: def

    fun writeString(ctx: Context, key: String, value: String) {
        sp(ctx).edit().putString(key, value).apply()
    }
}
