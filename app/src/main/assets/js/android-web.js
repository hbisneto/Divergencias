/**
 * Android Web Bridge – versão para GitHub Pages / navegador
 * Substitui o JavascriptInterface do Android usando localStorage.
 * Mantém a mesma API para o restante do código JS.
 *
 * IMPORTANTE:
 * - Funciona corretamente quando servido via HTTP (GitHub Pages ou servidor local).
 * - Ao abrir os arquivos diretamente (file://) o localStorage pode NÃO ser
 *   compartilhado entre páginas diferentes em alguns navegadores.
 *   Use sempre um servidor local para testar (ex: python -m http.server).
 */
(function () {
    "use strict";

    // Se já existir o bridge nativo (app Android), não sobrescreve
    if (
        typeof window.Android !== "undefined" &&
        typeof window.Android.isNative === "function" &&
        window.Android.isNative()
    ) {
        return;
    }
    // if (typeof window.Android !== "undefined" && window.Android.__isNative) {
    //     return;
    // }

    // Chaves alinhadas com o que o código original já usava onde possível
    const STORAGE_KEYS = {
        divergencias: "divergencias_db_v1",
        funcionarios: "divergencias_funcionarios_v1", // mesma chave do funcionarios.js
        lembrete: "divergencias_lembrete_v1",
        emailCreds: "divergencias_email_creds_v1",
        ultimoDestinatario: "divergencias_ultimo_dest_v1"
    };

    // ---------- helpers ----------
    function load(key, defaultValue) {
        try {
            const raw = localStorage.getItem(key);
            if (raw === null || raw === undefined) return defaultValue;
            const parsed = JSON.parse(raw);
            return parsed !== null && parsed !== undefined ? parsed : defaultValue;
        } catch (e) {
            console.warn("[Android Web] Erro ao ler localStorage", key, e);
            return defaultValue;
        }
    }

    function save(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (e) {
            console.error("[Android Web] Erro ao salvar localStorage", key, e);
            // Pode acontecer em modo privado ou se a quota for excedida
            mostrarAviso("Não foi possível salvar os dados. Verifique se o navegador permite armazenamento local.");
            return false;
        }
    }

    function downloadText(nomeArquivo, conteudo, mime) {
        const blob = new Blob([conteudo], { type: mime || "text/plain;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = nomeArquivo;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        return "baixado:" + nomeArquivo;
    }

    function downloadBase64Image(base64Png, nomeArquivo) {
        let dataUrl = base64Png;
        if (!dataUrl.startsWith("data:")) {
            dataUrl = "data:image/png;base64," + base64Png;
        }
        const a = document.createElement("a");
        a.href = dataUrl;
        a.download = nomeArquivo || "imagem.png";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        return "ok";
    }

    // ---------- helpers de estado (sempre lê do localStorage para evitar dessincronia) ----------
    function getDivergencias() {
        return load(STORAGE_KEYS.divergencias, []);
    }

    function setDivergencias(lista) {
        return save(STORAGE_KEYS.divergencias, lista);
    }

    function getNextId(lista) {
        return lista.reduce((max, d) => Math.max(max, Number(d.id) || 0), 0) + 1;
    }

    function getFuncionarios() {
        return load(STORAGE_KEYS.funcionarios, []);
    }

    function setFuncionarios(lista) {
        return save(STORAGE_KEYS.funcionarios, lista);
    }

    // ---------- API pública (mesma assinatura do Kotlin) ----------
    window.Android = {
        __isWeb: true,

        /* ---- info de build ---- */
        getBuildDate: function () {
            return "2026.11.17";
        },
        getBuildDateBr: function () {
            return "17/11/2026";
        },
        getVersionName: function () {
            return "1.4.0-web";
        },

        /* ---- CRUD Divergências ---- */
        listar: function () {
            const lista = getDivergencias();
            // Ordena por dataHora DESC (igual ao SQLite)
            const sorted = [...lista].sort((a, b) => (b.dataHora || 0) - (a.dataHora || 0));
            return JSON.stringify(sorted);
        },

        salvar: function (codigoProduto, pdv, descricao, valorOriginal, quantidade, valorPromocional, divergencia, motivo) {
            const lista = getDivergencias();
            const id = getNextId(lista);
            const item = {
                id: id,
                codigoProduto: codigoProduto || "",
                pdv: pdv || "",
                descricao: descricao || "",
                valorOriginal: Number(valorOriginal) || 0,
                quantidade: Number(quantidade) || 0,
                valorPromocional: Number(valorPromocional) || 0,
                divergencia: Number(divergencia) || 0,
                motivo: motivo || "",
                dataHora: Date.now()
            };
            lista.push(item);
            setDivergencias(lista);
            console.log("[Android Web] Divergência salva id=" + id);
            return id;
        },

        atualizar: function (id, codigoProduto, pdv, descricao, valorOriginal, quantidade, valorPromocional, divergencia, motivo) {
            const lista = getDivergencias();
            const idx = lista.findIndex(d => String(d.id) === String(id));
            if (idx === -1) return 0;
            lista[idx] = {
                ...lista[idx],
                codigoProduto: codigoProduto || "",
                pdv: pdv || "",
                descricao: descricao || "",
                valorOriginal: Number(valorOriginal) || 0,
                quantidade: Number(quantidade) || 0,
                valorPromocional: Number(valorPromocional) || 0,
                divergencia: Number(divergencia) || 0,
                motivo: motivo || ""
            };
            setDivergencias(lista);
            return 1;
        },

        excluir: function (id) {
            const lista = getDivergencias();
            const nova = lista.filter(d => String(d.id) !== String(id));
            if (nova.length !== lista.length) {
                setDivergencias(nova);
                return 1;
            }
            return 0;
        },

        /* ---- Arquivos ---- */
        salvarArquivo: function (nomeArquivo, conteudo) {
            return downloadText(nomeArquivo, conteudo, "text/csv;charset=utf-8");
        },

        obterCaminhoPasta: function () {
            return "Downloads (navegador)";
        },

        /* ---- E-mail (limitado no browser – sem SMTP real) ---- */
        emailEstaConfigurado: function () {
            const creds = load(STORAGE_KEYS.emailCreds, null);
            return !!(creds && creds.email && creds.appPassword);
        },

        salvarCredenciaisEmail: function (email, appPassword) {
            if (!email || !appPassword) return false;
            return save(STORAGE_KEYS.emailCreds, { email: email.trim(), appPassword: appPassword });
        },

        limparCredenciaisEmail: function () {
            localStorage.removeItem(STORAGE_KEYS.emailCreds);
        },

        obterEmailSalvo: function () {
            const creds = load(STORAGE_KEYS.emailCreds, null);
            return (creds && creds.email) || "";
        },

        obterUltimoDestinatario: function () {
            return localStorage.getItem(STORAGE_KEYS.ultimoDestinatario) || "";
        },

        /**
         * No browser não há SMTP. Apenas registra o destinatário e avisa.
         */
        enviarEmail: function (destinatario, assunto, htmlBody, nomeAnexo, conteudoAnexo) {
            if (destinatario) {
                localStorage.setItem(STORAGE_KEYS.ultimoDestinatario, destinatario);
            }
            setTimeout(function () {
                if (typeof window.onEmailResult === "function") {
                    window.onEmailResult(
                        false,
                        "Envio de e-mail via SMTP não está disponível na versão web. Use o aplicativo Android ou baixe o arquivo e anexe manualmente."
                    );
                } else {
                    mostrarAviso(
                        "Versão web: envio de e-mail por SMTP não é suportado no navegador.\n\n" +
                        "Use o app Android para enviar e-mails, ou baixe o arquivo e anexe manualmente."
                    );
                }
            }, 300);
        },

        /* ---- Compartilhar imagem ---- */
        compartilharImagemBase64: function (base64Png, nomeArquivo) {
            return downloadBase64Image(base64Png, nomeArquivo || "escala.png");
        },

        compartilharArquivoTexto: function (nomeArquivo, conteudo, mime) {
            return downloadText(nomeArquivo, conteudo, mime || "text/plain;charset=utf-8");
        },

        /* ---- Funcionários ---- */
        listarFuncionarios: function () {
            const lista = getFuncionarios();
            return JSON.stringify(lista);
        },

        salvarFuncionario: function (cracha, nome, cargo) {
            if (!cracha || !nome || !cargo) {
                return JSON.stringify({ ok: false, erro: "Preencha todos os campos" });
            }
            const lista = getFuncionarios();
            const idx = lista.findIndex(f => String(f.cracha) === String(cracha));
            const item = {
                cracha: String(cracha).trim(),
                nome: String(nome).trim(),
                cargo: String(cargo).trim()
            };
            if (idx >= 0) {
                lista[idx] = item;
            } else {
                lista.push(item);
            }
            // Ordena por nome (comportamento esperado)
            lista.sort((a, b) => (a.nome || "").localeCompare(b.nome || "", "pt-BR"));
            setFuncionarios(lista);
            console.log("[Android Web] Funcionário salvo:", item.cracha);
            return JSON.stringify({ ok: true });
        },

        excluirFuncionario: function (cracha) {
            const lista = getFuncionarios();
            const nova = lista.filter(f => String(f.cracha) !== String(cracha));
            if (nova.length !== lista.length) {
                setFuncionarios(nova);
                return JSON.stringify({ ok: true });
            }
            return JSON.stringify({ ok: false, erro: "Funcionário não encontrado" });
        },

        buscarFuncionarioPorCracha: function (cracha) {
            const lista = getFuncionarios();
            const item = lista.find(f => String(f.cracha) === String(cracha));
            if (!item) return "{}";
            return JSON.stringify(item);
        },

        /* ---- Lembrete ---- */
        salvarLembrete: function (ativo, hora, minuto, dias) {
            const data = {
                ativo: !!ativo,
                hora: Number(hora) || 18,
                minuto: Number(minuto) || 0,
                dias: dias || "1,2,3,4,5"
            };
            save(STORAGE_KEYS.lembrete, data);
            if (data.ativo && "Notification" in window && Notification.permission === "default") {
                Notification.requestPermission();
            }
            return JSON.stringify({ ok: true });
        },

        cancelarLembrete: function () {
            const data = load(STORAGE_KEYS.lembrete, { ativo: false, hora: 18, minuto: 0, dias: "1,2,3,4,5" });
            data.ativo = false;
            save(STORAGE_KEYS.lembrete, data);
            return JSON.stringify({ ok: true });
        },

        obterLembrete: function () {
            const data = load(STORAGE_KEYS.lembrete, {
                ativo: false,
                hora: 18,
                minuto: 0,
                dias: "1,2,3,4,5"
            });
            return JSON.stringify(data);
        }
    };

    // Diagnóstico no console
    console.log("[Divergências Web] Android bridge ativo (localStorage).");
    console.log("[Divergências Web] Divergências atuais:", getDivergencias().length);
    console.log("[Divergências Web] Funcionários atuais:", getFuncionarios().length);

    // Aviso se estiver rodando em file://
    if (window.location.protocol === "file:") {
        console.warn(
            "[Divergências Web] Você está abrindo os arquivos via file://.\n" +
            "Em alguns navegadores o localStorage NÃO é compartilhado entre páginas diferentes.\n" +
            "Para testar corretamente, use um servidor local:\n" +
            "  python -m http.server 8080\n" +
            "ou a extensão Live Server do VS Code."
        );
    }
})();
