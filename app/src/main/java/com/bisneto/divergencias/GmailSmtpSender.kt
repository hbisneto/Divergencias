package com.bisneto.divergencias

import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.util.Properties
import javax.mail.Authenticator
import javax.mail.Message
import javax.mail.PasswordAuthentication
import javax.mail.Session
import javax.mail.Transport
import javax.mail.internet.InternetAddress
import javax.mail.internet.MimeMessage

class GmailSmtpSender {

    data class Resultado(val sucesso: Boolean, val mensagem: String)

    suspend fun enviar(
        remetenteEmail: String,
        appPassword: String,
        destinatario: String,
        assunto: String,
        htmlBody: String
    ): Resultado = withContext(Dispatchers.IO) {
        try {
            val props = Properties().apply {
                put("mail.smtp.host", "smtp.gmail.com")
                put("mail.smtp.port", "587")
                put("mail.smtp.auth", "true")
                put("mail.smtp.starttls.enable", "true")
                put("mail.smtp.ssl.trust", "smtp.gmail.com")
            }

            val session = Session.getInstance(props, object : Authenticator() {
                override fun getPasswordAuthentication(): PasswordAuthentication {
                    return PasswordAuthentication(remetenteEmail, appPassword)
                }
            })

            val message = MimeMessage(session).apply {
                setFrom(InternetAddress(remetenteEmail))
                setRecipients(
                    Message.RecipientType.TO,
                    InternetAddress.parse(destinatario.trim())
                )
                subject = assunto
                setContent(htmlBody, "text/html; charset=utf-8")
            }

            Transport.send(message)
            Resultado(true, "E-mail enviado com sucesso")
        } catch (e: Exception) {
            Resultado(false, e.message ?: "Erro ao enviar e-mail")
        }
    }
}