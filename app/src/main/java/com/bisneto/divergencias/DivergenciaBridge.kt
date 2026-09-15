package com.bisneto.divergencias

import android.webkit.JavascriptInterface
import org.json.JSONArray
import org.json.JSONObject

class DivergenciaBridge(
    private val database: DatabaseHelper
) {

    @JavascriptInterface
    fun salvar(
        valorOriginal: Long,
        quantidade: Int,
        valorPromocional: Long,
        divergencia: Long
    ): Long {
        return database.inserirDivergencia(
            valorOriginal,
            quantidade,
            valorPromocional,
            divergencia
        )
    }

    @JavascriptInterface
    fun listar(): String {
        val divergencias = database.listarDivergencias()
        val jsonArray = JSONArray()

        for (item in divergencias) {
            val json = JSONObject()

            json.put("id", item.id)
            json.put("valorOriginal", item.valorOriginal)
            json.put("quantidade", item.quantidade)
            json.put("valorPromocional", item.valorPromocional)
            json.put("divergencia", item.divergencia)
            json.put("dataHora", item.dataHora)

            jsonArray.put(json)
        }

        return jsonArray.toString()
    }

    @JavascriptInterface
    fun atualizar(
        id: String,
        valorOriginal: Long,
        quantidade: Int,
        valorPromocional: Long,
        divergencia: Long
    ): Int {
        val idLong = id.toLongOrNull() ?: return 0

        return database.atualizarDivergencia(
            idLong,
            valorOriginal,
            quantidade,
            valorPromocional,
            divergencia
        )
    }

    @JavascriptInterface
    fun excluir(id: String): Int {
        val idLong = id.toLongOrNull() ?: return 0

        return database.excluirDivergencia(idLong)
    }
}