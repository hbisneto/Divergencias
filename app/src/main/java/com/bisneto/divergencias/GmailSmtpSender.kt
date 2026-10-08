package com.bisneto.divergencias

import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.io.File
import java.util.Properties
import javax.activation.DataHandler
import javax.activation.FileDataSource
import javax.mail.Authenticator
import javax.mail.Message
import javax.mail.PasswordAuthentication
import javax.mail.Session
import javax.mail.Transport
import javax.mail.internet.InternetAddress
import javax.mail.internet.MimeBodyPart
import javax.mail.internet.MimeMessage
import javax.mail.internet.MimeMultipart

class GmailSmtpSender {

    data class Resultado(val sucesso: Boolean, val mensagem: String)

    suspend fun enviar(
        remetenteEmail: String,
        appPassword: String,
        destinatario: String,
        assunto: String,
        htmlBody: String,
        arquivoAnexo: File? = null
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
            }

            if (arquivoAnexo != null && arquivoAnexo.exists()) {
                val multipart = MimeMultipart()

                val htmlPart = MimeBodyPart().apply {
                    setContent(htmlBody, "text/html; charset=utf-8")
                }
                multipart.addBodyPart(htmlPart)

                val attachPart = MimeBodyPart().apply {
                    dataHandler = DataHandler(FileDataSource(arquivoAnexo))
                    fileName = arquivoAnexo.name
                }
                multipart.addBodyPart(attachPart)

                message.setContent(multipart)
            } else {
                message.setContent(htmlBody, "text/html; charset=utf-8")
            }

            Transport.send(message)
            Resultado(true, "E-mail enviado com sucesso")
        } catch (e: Exception) {
            Resultado(false, e.message ?: "Erro ao enviar e-mail")
        }
    }
}