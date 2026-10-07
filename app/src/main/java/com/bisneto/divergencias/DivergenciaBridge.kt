package com.bisneto.divergencias

import android.content.Context
import android.os.Environment
import android.webkit.JavascriptInterface
import org.json.JSONArray
import org.json.JSONObject
import java.io.File
import java.io.FileOutputStream
import java.nio.charset.Charset

class DivergenciaBridge(
    private val context: Context,
    private val database: DatabaseHelper
) {

    /* =========================================================
     * CRUD (já existente – atualizado com os novos campos)
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
     * EXPORTAÇÃO NATIVA
     * ========================================================= */

    /**
     * Salva um arquivo de texto/CSV na pasta:
     * /Documents/Divergencias/
     *
     * @param nomeArquivo  Ex: "divergencias_2026-10-06.csv"
     * @param conteudo     Conteúdo completo do arquivo (já com BOM se for CSV)
     * @return Caminho completo do arquivo salvo, ou string vazia em caso de erro
     */
    @JavascriptInterface
    fun salvarArquivo(nomeArquivo: String, conteudo: String): String {
        return try {
            // 1. Obtém a pasta Documents pública
            val documentsDir = Environment.getExternalStoragePublicDirectory(
                Environment.DIRECTORY_DOCUMENTS
            )

            // 2. Cria a subpasta "Divergencias" se não existir
            val pastaApp = File(documentsDir, "Divergencias")
            if (!pastaApp.exists()) {
                pastaApp.mkdirs()
            }

            // 3. Arquivo final
            val arquivo = File(pastaApp, nomeArquivo)

            // 4. Escreve o conteúdo (UTF-8)
            FileOutputStream(arquivo).use { fos ->
                fos.write(conteudo.toByteArray(Charset.forName("UTF-8")))
                fos.flush()
            }

            // 5. Retorna o caminho completo para o JavaScript
            arquivo.absolutePath

        } catch (e: Exception) {
            e.printStackTrace()
            "" // string vazia = erro
        }
    }

    /**
     * Retorna o caminho da pasta Divergencias (útil para mostrar ao usuário)
     */
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
}