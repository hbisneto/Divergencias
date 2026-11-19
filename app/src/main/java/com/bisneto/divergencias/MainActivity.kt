import android.content.Intent
import android.net.Uri
import android.provider.OpenableColumns
import org.json.JSONObject
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

package com.bisneto.divergencias
import androidx.core.splashscreen.SplashScreen.Companion.installSplashScreen
import android.Manifest
import android.content.pm.PackageManager
import android.os.Build
import android.os.Bundle
import android.webkit.WebChromeClient
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.activity.ComponentActivity
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat

class MainActivity : ComponentActivity() {
    private var arquivoPendente: Uri? = null
    private var paginaImportacaoCarregada = false

    private lateinit var database: DatabaseHelper
    private lateinit var webView: WebView

    override fun onCreate(savedInstanceState: Bundle?) {
        installSplashScreen()
        super.onCreate(savedInstanceState)

        database = DatabaseHelper(this)

        webView = WebView(this).apply {
            settings.javaScriptEnabled = true
            settings.domStorageEnabled = true
            // webViewClient = WebViewClient()
            webChromeClient = WebChromeClient()
        }

        val bridge = DivergenciaBridge(this, database) { sucesso, mensagem ->
            runOnUiThread {
                val msgSegura = mensagem
                    .replace("\\", "\\\\")
                    .replace("'", "\\'")
                    .replace("\n", "\\n")
                    .replace("\r", "")
                val js = "window.onEmailResult && window.onEmailResult($sucesso, '$msgSegura');"
                webView.evaluateJavascript(js, null)
            }
        }

        webView.addJavascriptInterface(bridge, "Android")
        webView.webViewClient = object : WebViewClient() {
            override fun onPageFinished(view: WebView?, url: String?) {
                super.onPageFinished(view, url)

                if (url?.endsWith("importar.html") == true) {
                    paginaImportacaoCarregada = true
                    arquivoPendente?.let { uri ->
                        arquivoPendente = null
                        lerArquivoRecebido(uri)
                    }
                }
            }
        }
        setContentView(webView)
        verificarArquivoRecebido(intent)
        if (arquivoPendente == null) {
            webView.loadUrl("file:///android_asset/index.html")
        }

        if (Build.VERSION.SDK_INT <= Build.VERSION_CODES.P) {
            if (ContextCompat.checkSelfPermission(
                    this,
                    Manifest.permission.WRITE_EXTERNAL_STORAGE
                ) != PackageManager.PERMISSION_GRANTED
            ) {
                ActivityCompat.requestPermissions(
                    this,
                    arrayOf(Manifest.permission.WRITE_EXTERNAL_STORAGE),
                    1001
                )
            }
        }


        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            if (ContextCompat.checkSelfPermission(
                    this,
                    Manifest.permission.POST_NOTIFICATIONS
                ) != PackageManager.PERMISSION_GRANTED
            ) {
                ActivityCompat.requestPermissions(
                    this,
                    arrayOf(Manifest.permission.POST_NOTIFICATIONS),
                    1002
                )
            }
        }
    }

    override fun onDestroy() {
        database.close()
        super.onDestroy()
    }

    private fun verificarArquivoRecebido(intent: Intent?) {
        if (intent?.action != Intent.ACTION_VIEW) {
            return
        }

        val uri = intent.data ?: return
        arquivoPendente = uri
        paginaImportacaoCarregada = false
        webView.loadUrl("file:///android_asset/importar.html")
    }

    private fun lerArquivoRecebido(uri: Uri) {
        CoroutineScope(Dispatchers.IO).launch {
            try {
                val nomeArquivo = contentResolver
                    .query(uri, null, null, null, null)
                    ?.use { cursor ->

                        val coluna = cursor.getColumnIndex(
                            OpenableColumns.DISPLAY_NAME
                        )

                        if (coluna >= 0 && cursor.moveToFirst()) {
                            cursor.getString(coluna)
                        } else {
                            null
                        }
                    } ?: "backup.nexo"

                if (!nomeArquivo.endsWith(".nexo", ignoreCase = true)) {
                    throw Exception("O arquivo selecionado não possui extensão .nexo.")
                }

                val conteudo = contentResolver
                    .openInputStream(uri)
                    ?.bufferedReader(Charsets.UTF_8)
                    ?.use { it.readText() }
                    ?: throw Exception("Não foi possível ler o arquivo.")

                withContext(Dispatchers.Main) {

                    val conteudoSeguro = JSONObject.quote(conteudo)
                    val nomeSeguro = JSONObject.quote(nomeArquivo)

                    val javascript = """
                        window.NexoImport.receberArquivo(
                            $conteudoSeguro,
                            $nomeSeguro
                        );
                    """.trimIndent()

                    webView.evaluateJavascript(javascript, null)

                }

            } catch (erro: Exception) {
                withContext(Dispatchers.Main) {
                    val mensagem = JSONObject.quote(
                        erro.message ?: "Erro ao abrir arquivo."
                    )
                    
                    webView.evaluateJavascript(
                        "window.NexoImport.erro($mensagem);",
                        null
                    )
                }
            }
        }
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)

        setIntent(intent)
        verificarArquivoRecebido(intent)
    }
}