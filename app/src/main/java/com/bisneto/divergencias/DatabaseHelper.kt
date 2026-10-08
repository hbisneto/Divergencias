package com.bisneto.divergencias

import android.content.ContentValues
import android.content.Context
import android.database.sqlite.SQLiteDatabase
import android.database.sqlite.SQLiteOpenHelper

class DatabaseHelper(context: Context) :
    SQLiteOpenHelper(
        context,
        DATABASE_NAME,
        null,
        DATABASE_VERSION
    ) {

    override fun onCreate(db: SQLiteDatabase) {
        db.execSQL(
            """
            CREATE TABLE divergencias (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                codigo_produto TEXT,
                pdv TEXT,
                descricao TEXT,
                valor_original INTEGER NOT NULL,
                quantidade INTEGER NOT NULL,
                valor_promocional INTEGER NOT NULL,
                divergencia INTEGER NOT NULL,
                motivo TEXT,
                data_hora INTEGER NOT NULL
            )
            """.trimIndent()
        )
    }

    override fun onUpgrade(db: SQLiteDatabase, oldVersion: Int, newVersion: Int) {
        // Migração simples: recria a tabela (dados antigos serão perdidos)
        // Se quiser preservar dados depois, podemos fazer uma migração real.
        db.execSQL("DROP TABLE IF EXISTS divergencias")
        onCreate(db)
    }

    fun inserirDivergencia(
        codigoProduto: String,
        pdv: String,
        descricao: String,
        valorOriginal: Long,
        quantidade: Int,
        valorPromocional: Long,
        divergencia: Long,
        motivo: String
    ): Long {
        val db = writableDatabase

        val values = ContentValues().apply {
            put("codigo_produto", codigoProduto)
            put("pdv", pdv)
            put("descricao", descricao)
            put("valor_original", valorOriginal)
            put("quantidade", quantidade)
            put("valor_promocional", valorPromocional)
            put("divergencia", divergencia)
            put("motivo", motivo)
            put("data_hora", System.currentTimeMillis())
        }

        return db.insert("divergencias", null, values)
    }

    fun listarDivergencias(): List<Divergencia> {
        val lista = mutableListOf<Divergencia>()
        val db = readableDatabase

        val cursor = db.query(
            "divergencias",
            null,
            null,
            null,
            null,
            null,
            "data_hora DESC"
        )

        cursor.use {
            while (it.moveToNext()) {
                lista.add(
                    Divergencia(
                        id = it.getLong(it.getColumnIndexOrThrow("id")),
                        codigoProduto = it.getString(it.getColumnIndexOrThrow("codigo_produto")) ?: "",
                        pdv = it.getString(it.getColumnIndexOrThrow("pdv")) ?: "",
                        descricao = it.getString(it.getColumnIndexOrThrow("descricao")) ?: "",
                        valorOriginal = it.getLong(it.getColumnIndexOrThrow("valor_original")),
                        quantidade = it.getInt(it.getColumnIndexOrThrow("quantidade")),
                        valorPromocional = it.getLong(it.getColumnIndexOrThrow("valor_promocional")),
                        divergencia = it.getLong(it.getColumnIndexOrThrow("divergencia")),
                        motivo = it.getString(it.getColumnIndexOrThrow("motivo")) ?: "",
                        dataHora = it.getLong(it.getColumnIndexOrThrow("data_hora"))
                    )
                )
            }
        }

        return lista
    }

    fun atualizarDivergencia(
        id: Long,
        codigoProduto: String,
        pdv: String,
        descricao: String,
        valorOriginal: Long,
        quantidade: Int,
        valorPromocional: Long,
        divergencia: Long,
        motivo: String
    ): Int {
        val db = writableDatabase

        val values = ContentValues().apply {
            put("codigo_produto", codigoProduto)
            put("pdv", pdv)
            put("descricao", descricao)
            put("valor_original", valorOriginal)
            put("quantidade", quantidade)
            put("valor_promocional", valorPromocional)
            put("divergencia", divergencia)
            put("motivo", motivo)
            put("data_hora", System.currentTimeMillis())
        }

        return db.update(
            "divergencias",
            values,
            "id = ?",
            arrayOf(id.toString())
        )
    }

    fun excluirDivergencia(id: Long): Int {
        val db = writableDatabase
        return db.delete("divergencias", "id = ?", arrayOf(id.toString()))
    }

    companion object {
        private const val DATABASE_NAME = "divergencias.db"
        private const val DATABASE_VERSION = 2   // ← aumente a versão
    }
}