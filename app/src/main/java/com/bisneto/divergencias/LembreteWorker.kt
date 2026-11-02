package com.bisneto.divergencias

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import androidx.work.Worker
import androidx.work.WorkerParameters

class LembreteWorker(ctx: Context, params: WorkerParameters) : Worker(ctx, params) {

    override fun doWork(): Result {
        val prefs = LembretePreferences(applicationContext)
        if (!prefs.ativo) return Result.success()

        mostrarNotificacao()
        // Reagenda o próximo horário válido
        LembreteScheduler.agendarProximo(applicationContext)
        return Result.success()
    }

    private fun mostrarNotificacao() {
        criarCanal()

        val intent = Intent(applicationContext, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
        }
        val pending = PendingIntent.getActivity(
            applicationContext,
            0,
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val notification = NotificationCompat.Builder(applicationContext, CHANNEL_ID)
            .setSmallIcon(android.R.drawable.ic_dialog_info) // troque por um ícone do app se quiser
            .setContentTitle("Divergências")
            .setContentText("Não esqueça de registrar as divergências do dia")
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setAutoCancel(true)
            .setContentIntent(pending)
            .build()

        with(NotificationManagerCompat.from(applicationContext)) {
            notify(NOTIFICATION_ID, notification)
        }
    }

    private fun criarCanal() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "Lembrete de Divergências",
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = "Lembrete para registrar as divergências do dia"
            }
            val manager = applicationContext.getSystemService(NotificationManager::class.java)
            manager.createNotificationChannel(channel)
        }
    }

    companion object {
        const val CHANNEL_ID = "divergencias_lembrete"
        const val NOTIFICATION_ID = 1001
        const val WORK_NAME = "lembrete_divergencias"
    }
}