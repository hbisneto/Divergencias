package com.bisneto.divergencias

import android.content.Context
import androidx.work.ExistingWorkPolicy
import androidx.work.OneTimeWorkRequestBuilder
import androidx.work.WorkManager
import java.util.Calendar
import java.util.concurrent.TimeUnit

object LembreteScheduler {

    fun agendarProximo(context: Context) {
        val prefs = LembretePreferences(context)
        if (!prefs.ativo) {
            cancelar(context)
            return
        }

        val diasSet = prefs.dias.split(",")
            .mapNotNull { it.trim().toIntOrNull() }
            .toSet()

        if (diasSet.isEmpty()) {
            cancelar(context)
            return
        }

        val delayMillis = calcularProximoDelay(prefs.hora, prefs.minuto, diasSet)
        if (delayMillis <= 0) return

        val request = OneTimeWorkRequestBuilder<LembreteWorker>()
            .setInitialDelay(delayMillis, TimeUnit.MILLISECONDS)
            .addTag(LembreteWorker.WORK_NAME)
            .build()

        WorkManager.getInstance(context)
            .enqueueUniqueWork(
                LembreteWorker.WORK_NAME,
                ExistingWorkPolicy.REPLACE,
                request
            )
    }

    fun cancelar(context: Context) {
        WorkManager.getInstance(context).cancelUniqueWork(LembreteWorker.WORK_NAME)
    }

    private fun calcularProximoDelay(hora: Int, minuto: Int, diasPermitidos: Set<Int>): Long {
        val agora = Calendar.getInstance()
        val alvo = Calendar.getInstance().apply {
            set(Calendar.HOUR_OF_DAY, hora)
            set(Calendar.MINUTE, minuto)
            set(Calendar.SECOND, 0)
            set(Calendar.MILLISECOND, 0)
        }

        // Procura o próximo dia válido (até 8 dias à frente)
        for (i in 0..7) {
            val candidato = (alvo.clone() as Calendar).apply {
                add(Calendar.DAY_OF_YEAR, i)
            }
            // Calendar.DAY_OF_WEEK: 1=Domingo ... 7=Sábado → convertemos para 0-6
            val diaSemana = candidato.get(Calendar.DAY_OF_WEEK) - 1
            if (diasPermitidos.contains(diaSemana) && candidato.after(agora)) {
                return candidato.timeInMillis - agora.timeInMillis
            }
        }
        return -1
    }
}