package com.bisneto.divergencias

data class Divergencia(
    val id: Long,
    val codigoProduto: String,
    val pdv: String,
    val descricao: String,
    val valorOriginal: Long,
    val quantidade: Int,
    val valorPromocional: Long,
    val divergencia: Long,
    val motivo: String,
    val dataHora: Long
)