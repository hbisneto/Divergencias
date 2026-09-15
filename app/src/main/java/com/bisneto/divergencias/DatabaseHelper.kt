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
                valor_original INTEGER NOT NULL,
                quantidade INTEGER NOT NULL,
                valor_promocional INTEGER NOT NULL,
                divergencia INTEGER NOT NULL,
                data_hora INTEGER NOT NULL
            )
            """.trimIndent()
        )
    }


    override fun onUpgrade(
        db: SQLiteDatabase,
        oldVersion: Int,
        newVersion: Int
    ) {

        db.execSQL(
            "DROP TABLE IF EXISTS divergencias"
        )

        onCreate(db)
    }


    fun inserirDivergencia(
        valorOriginal: Long,
        quantidade: Int,
        valorPromocional: Long,
        divergencia: Long
    ): Long {

        val db = writableDatabase


        val values = ContentValues().apply {

            put(
                "valor_original",
                valorOriginal
            )

            put(
                "quantidade",
                quantidade
            )

            put(
                "valor_promocional",
                valorPromocional
            )

            put(
                "divergencia",
                divergencia
            )

            put(
                "data_hora",
                System.currentTimeMillis()
            )
        }


        return db.insert(
            "divergencias",
            null,
            values
        )
    }


    fun listarDivergencias():
            List<Divergencia> {

        val lista =
            mutableListOf<Divergencia>()


        val db =
            readableDatabase


        val cursor =
            db.query(
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

                        id =
                            it.getLong(
                                it.getColumnIndexOrThrow(
                                    "id"
                                )
                            ),

                        valorOriginal =
                            it.getLong(
                                it.getColumnIndexOrThrow(
                                    "valor_original"
                                )
                            ),

                        quantidade =
                            it.getInt(
                                it.getColumnIndexOrThrow(
                                    "quantidade"
                                )
                            ),

                        valorPromocional =
                            it.getLong(
                                it.getColumnIndexOrThrow(
                                    "valor_promocional"
                                )
                            ),

                        divergencia =
                            it.getLong(
                                it.getColumnIndexOrThrow(
                                    "divergencia"
                                )
                            ),

                        dataHora =
                            it.getLong(
                                it.getColumnIndexOrThrow(
                                    "data_hora"
                                )
                            )
                    )
                )
            }
        }


        return lista
    }


    fun atualizarDivergencia(
        id: Long,
        valorOriginal: Long,
        quantidade: Int,
        valorPromocional: Long,
        divergencia: Long
    ): Int {

        val db =
            writableDatabase


        val values =
            ContentValues().apply {

                put(
                    "valor_original",
                    valorOriginal
                )

                put(
                    "quantidade",
                    quantidade
                )

                put(
                    "valor_promocional",
                    valorPromocional
                )

                put(
                    "divergencia",
                    divergencia
                )

                put(
                    "data_hora",
                    System.currentTimeMillis()
                )
            }


        return db.update(
            "divergencias",
            values,
            "id = ?",
            arrayOf(id.toString())
        )
    }


    fun excluirDivergencia(
        id: Long
    ): Int {

        val db =
            writableDatabase


        return db.delete(
            "divergencias",
            "id = ?",
            arrayOf(id.toString())
        )
    }


    companion object {

        private const val DATABASE_NAME =
            "divergencias.db"

        private const val DATABASE_VERSION =
            1
    }
}