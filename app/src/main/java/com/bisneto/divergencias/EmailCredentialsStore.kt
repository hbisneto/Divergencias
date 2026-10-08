package com.bisneto.divergencias

import android.content.Context
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKey

class EmailCredentialsStore(context: Context) {

    private val masterKey = MasterKey.Builder(context)
        .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
        .build()

    private val prefs = EncryptedSharedPreferences.create(
        context,
        "email_credentials",
        masterKey,
        EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
        EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
    )

    fun salvar(email: String, appPassword: String) {
        prefs.edit()
            .putString("email", email.trim())
            .putString("app_password", appPassword.trim().replace(" ", ""))
            .apply()
    }

    fun obterEmail(): String? = prefs.getString("email", null)

    fun obterAppPassword(): String? = prefs.getString("app_password", null)

    fun estaConfigurado(): Boolean {
        return !obterEmail().isNullOrBlank() && !obterAppPassword().isNullOrBlank()
    }

    fun salvarUltimoDestinatario(email: String) {
        prefs.edit().putString("ultimo_destinatario", email.trim()).apply()
    }

    fun obterUltimoDestinatario(): String {
        return prefs.getString("ultimo_destinatario", "") ?: ""
    }

    fun limpar() {
        prefs.edit().clear().apply()
    }
}