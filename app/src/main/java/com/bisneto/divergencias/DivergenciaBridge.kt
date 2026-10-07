package com.bisneto.divergencias

import android.content.Context
import android.os.Environment
import android.webkit.JavascriptInterface
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import org.json.JSONArray
import org.json.JSONObject
import java.io.File
import java.io.FileOutputStream
import java.nio.charset.Charset

class DivergenciaBridge(
    private val context: Context,
    private val database: DatabaseHelper,
    private val onEmailResult: (sucesso: Boolean, mensagem: String) -> Unit
) {
    private val credentialsStore = EmailCredentialsStore(context)
    private val sender = GmailSmtpSender()
    private val scope = CoroutineScope(Dispatchers.Main)

    /* =========================================================
     * CRUD
     * ========================================================= */

    @JavascriptInterface
    fun salvar(
        codigoProduto: String,
        pdv: String,
        descricao: String,
        valorOriginal: Long,
        quantidade: Int,
        valorPromocional: Long,
        divergencia: Long,
        motivo: String
    ): Long {
        return database.inserirDivergencia(
            codigoProduto,
            pdv,
            descricao,
            valorOriginal,
            quantidade,
            valorPromocional,
            divergencia,
            motivo
        )
    }

    @JavascriptInterface
    fun listar(): String {
        val divergencias = database.listarDivergencias()
        val jsonArray = JSONArray()

        for (item in divergencias) {
            val json = JSONObject()
            json.put("id", item.id)
            json.put("codigoProduto", item.codigoProduto)
            json.put("pdv", item.pdv)
            json.put("descricao", item.descricao)
            json.put("valorOriginal", item.valorOriginal)
            json.put("quantidade", item.quantidade)
            json.put("valorPromocional", item.valorPromocional)
            json.put("divergencia", item.divergencia)
            json.put("motivo", item.motivo)
            json.put("dataHora", item.dataHora)
            jsonArray.put(json)
        }

        return jsonArray.toString()
    }

    @JavascriptInterface
    fun atualizar(
        id: String,
        codigoProduto: String,
        pdv: String,
        descricao: String,
        valorOriginal: Long,
        quantidade: Int,
        valorPromocional: Long,
        divergencia: Long,
        motivo: String
    ): Int {
        val idLong = id.toLongOrNull() ?: return 0

        return database.atualizarDivergencia(
            idLong,
            codigoProduto,
            pdv,
            descricao,
            valorOriginal,
            quantidade,
            valorPromocional,
            divergencia,
            motivo
        )
    }

    @JavascriptInterface
    fun excluir(id: String): Int {
        val idLong = id.toLongOrNull() ?: return 0
        return database.excluirDivergencia(idLong)
    }

    /* =========================================================
     * EXPORTAÇÃO NATIVA (CSV)
     * ========================================================= */

    @JavascriptInterface
    fun salvarArquivo(nomeArquivo: String, conteudo: String): String {
        return try {
            val documentsDir = Environment.getExternalStoragePublicDirectory(
                Environment.DIRECTORY_DOCUMENTS
            )
            val pastaApp = File(documentsDir, "Divergencias")
            if (!pastaApp.exists()) {
                pastaApp.mkdirs()
            }
            val arquivo = File(pastaApp, nomeArquivo)
            FileOutputStream(arquivo).use { fos ->
                fos.write(conteudo.toByteArray(Charset.forName("UTF-8")))
                fos.flush()
            }
            arquivo.absolutePath
        } catch (e: Exception) {
            e.printStackTrace()
            ""
        }
    }

    @JavascriptInterface
    fun obterCaminhoPasta(): String {
        return try {
            val documentsDir = Environment.getExternalStoragePublicDirectory(
                Environment.DIRECTORY_DOCUMENTS
            )
            val pastaApp = File(documentsDir, "Divergencias")
            if (!pastaApp.exists()) {
                pastaApp.mkdirs()
            }
            pastaApp.absolutePath
        } catch (e: Exception) {
            ""
        }
    }

    /* =========================================================
     * E-MAIL (SMTP + App Password)
     * ========================================================= */

    @JavascriptInterface
    fun emailEstaConfigurado(): Boolean {
        return credentialsStore.estaConfigurado()
    }

    @JavascriptInterface
    fun salvarCredenciaisEmail(email: String, appPassword: String): Boolean {
        return try {
            if (email.isBlank() || appPassword.isBlank()) return false
            credentialsStore.salvar(email, appPassword)
            true
        } catch (e: Exception) {
            false
        }
    }

    @JavascriptInterface
    fun limparCredenciaisEmail() {
        credentialsStore.limpar()
    }

    @JavascriptInterface
    fun obterEmailSalvo(): String {
        return credentialsStore.obterEmail() ?: ""
    }

    @JavascriptInterface
    fun obterUltimoDestinatario(): String {
        return credentialsStore.obterUltimoDestinatario()
    }

    /**
     * Envia e-mail HTML formatado.
     * Resultado chega em: window.onEmailResult(sucesso, mensagem)
     */
        /**
     * @param nomeAnexo      ex: "divergencias_2026-09-01_2026-10-07.csv" (vazio = sem anexo)
     * @param conteudoAnexo  texto do CSV/HTML (vazio = sem anexo)
     */
    @JavascriptInterface
    fun enviarEmail(
        destinatario: String,
        assunto: String,
        htmlBody: String,
        nomeAnexo: String,
        conteudoAnexo: String
    ) {
        val email = credentialsStore.obterEmail()
        val password = credentialsStore.obterAppPassword()

        if (email.isNullOrBlank() || password.isNullOrBlank()) {
            onEmailResult(false, "Configure o e-mail e a senha de app primeiro")
            return
        }
        if (destinatario.isBlank()) {
            onEmailResult(false, "Informe o e-mail do destinatário")
            return
        }
        if (htmlBody.isBlank()) {
            onEmailResult(false, "Conteúdo do e-mail está vazio")
            return
        }

        credentialsStore.salvarUltimoDestinatario(destinatario)

        scope.launch {
            var anexoTemp: java.io.File? = null
            try {
                if (nomeAnexo.isNotBlank() && conteudoAnexo.isNotBlank()) {
                    anexoTemp = java.io.File(context.cacheDir, nomeAnexo)
                    anexoTemp.writeText(conteudoAnexo, Charsets.UTF_8)
                }

                val resultado = sender.enviar(
                    remetenteEmail = email,
                    appPassword = password,
                    destinatario = destinatario,
                    assunto = if (assunto.isBlank()) "Divergências" else assunto,
                    htmlBody = htmlBody,
                    arquivoAnexo = anexoTemp
                )
                onEmailResult(resultado.sucesso, resultado.mensagem)
            } catch (e: Exception) {
                onEmailResult(false, e.message ?: "Erro ao preparar anexo")
            } finally {
                anexoTemp?.delete()
            }
        }
    }

    // Compatibilidade com chamadas antigas (só corpo HTML)
    @JavascriptInterface
    fun enviarEmail(destinatario: String, assunto: String, htmlBody: String) {
        enviarEmail(destinatario, assunto, htmlBody, "", "")
    }
}