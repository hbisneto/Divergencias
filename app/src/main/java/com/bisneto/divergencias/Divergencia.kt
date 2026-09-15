package com.bisneto.divergencias

data class Divergencia(
    val id: Long,
    val valorOriginal: Long,
    val quantidade: Int,
    val valorPromocional: Long,
    val divergencia: Long,
    val dataHora: Long
)
