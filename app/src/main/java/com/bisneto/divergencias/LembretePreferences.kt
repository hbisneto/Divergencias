package com.bisneto.divergencias

import android.content.Context
import android.content.SharedPreferences

class LembretePreferences(context: Context) {
    private val prefs: SharedPreferences =
        context.getSharedPreferences("divergencias_lembrete", Context.MODE_PRIVATE)

    var ativo: Boolean
        get() = prefs.getBoolean("ativo", false)
        set(value) = prefs.edit().putBoolean("ativo", value).apply()

    var hora: Int
        get() = prefs.getInt("hora", 18)
        set(value) = prefs.edit().putInt("hora", value).apply()

    var minuto: Int
        get() = prefs.getInt("minuto", 0)
        set(value) = prefs.edit().putInt("minuto", value).apply()

    // Dias: string "0,1,2,3,4,5,6" (0 = Domingo ... 6 = Sábado)
    var dias: String
        get() = prefs.getString("dias", "1,2,3,4,5") ?: "1,2,3,4,5"
        set(value) = prefs.edit().putString("dias", value).apply()

    fun salvar(ativo: Boolean, hora: Int, minuto: Int, dias: String) {
        prefs.edit()
            .putBoolean("ativo", ativo)
            .putInt("hora", hora)
            .putInt("minuto", minuto)
            .putString("dias", dias)
            .apply()
    }
}