package com.bisneto.divergencias

import android.content.Context
import android.content.Intent
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.util.Base64
import androidx.core.content.FileProvider
import java.io.File
import java.io.FileOutputStream

class ShareHelper(private val context: Context) {

    private fun pastaShared(): File {
        val dir = File(context.cacheDir, "shared")
        if (!dir.exists()) dir.mkdirs()
        return dir
    }

    /**
     * base64Png: string com ou sem prefixo "data:image/png;base64,"
     */
    fun compartilharImagemPng(base64Png: String, nomeArquivo: String): String {
        return try {
            val pure = base64Png
                .substringAfter("base64,", base64Png)
                .trim()

            val bytes = Base64.decode(pure, Base64.DEFAULT)
            val bitmap = BitmapFactory.decodeByteArray(bytes, 0, bytes.size)
                ?: return "Não foi possível decodificar a imagem"

            val safeName = if (nomeArquivo.endsWith(".png", true)) {
                nomeArquivo
            } else {
                "$nomeArquivo.png"
            }

            val file = File(pastaShared(), safeName)
            FileOutputStream(file).use { out ->
                bitmap.compress(Bitmap.CompressFormat.PNG, 100, out)
            }
            bitmap.recycle()

            abrirShare(file, "image/png", "Compartilhar imagem")
            "ok"
        } catch (e: Exception) {
            e.message ?: "Erro ao compartilhar imagem"
        }
    }

    fun compartilharArquivoTexto(
        nomeArquivo: String,
        conteudo: String,
        mimeType: String
    ): String {
        return try {
            val file = File(pastaShared(), nomeArquivo)
            file.writeText(conteudo, Charsets.UTF_8)
            abrirShare(file, mimeType, "Compartilhar arquivo")
            "ok"
        } catch (e: Exception) {
            e.message ?: "Erro ao compartilhar arquivo"
        }
    }

    private fun abrirShare(file: File, mimeType: String, tituloChooser: String) {
        val uri = FileProvider.getUriForFile(
            context,
            "${context.packageName}.fileprovider",
            file
        )

        val intent = Intent(Intent.ACTION_SEND).apply {
            type = mimeType
            putExtra(Intent.EXTRA_STREAM, uri)
            addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
            // Alguns apps de WhatsApp se beneficiam disso:
            clipData = android.content.ClipData.newRawUri("", uri)
        }

        val chooser = Intent.createChooser(intent, tituloChooser).apply {
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        }
        context.startActivity(chooser)
    }
}