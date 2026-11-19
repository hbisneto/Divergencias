"use strict";

const CHAVE_ESCALAS = "divergencias_escalas_funcionarios_v2";
const CHAVE_FUNCIONARIOS = "divergencias_funcionarios_v1";
const CHAVE_DIVERGENCIAS = "divergencias_db_v1";

function interpretarLista(valor, identificacao) {
    try {
        const dados = typeof valor === "string"
            ? JSON.parse(valor || "[]")
            : valor;

        if (!Array.isArray(dados)) {
            throw new Error("Formato inválido.");
        }

        return dados;

    } catch (erro) {
        console.error(`Erro ao ler ${identificacao}:`, erro);

        throw new Error(
            `Não foi possível ler os dados de ${identificacao}.`
        );
    }
}

function exportarFuncionarios() {
    if (
        typeof Android !== "undefined" &&
        typeof Android.listarFuncionarios === "function"
    ) {
        return interpretarLista(
            Android.listarFuncionarios(),
            "funcionários"
        );
    }

    return interpretarLista(
        localStorage.getItem(CHAVE_FUNCIONARIOS),
        "funcionários"
    );
}

function exportarDivergencias() {
    if (
        typeof Android !== "undefined" &&
        typeof Android.listar === "function"
    ) {
        return interpretarLista(
            Android.listar(),
            "divergências"
        );
    }

    return interpretarLista(
        localStorage.getItem(CHAVE_DIVERGENCIAS),
        "divergências"
    );
}

function exportarEscalas() {
    const dados = localStorage.getItem(CHAVE_ESCALAS);
    return interpretarLista(dados, "escalas");
}


function gerarBackup() {
    const funcionarios = exportarFuncionarios();
    const escalas = exportarEscalas();
    const divergencias = exportarDivergencias();

    return {
        format: "nexo-backup",
        schemaVersion: 1,

        exportedAt: new Date().toISOString(),

        app: {
            name: "Nexo"
        },

        data: {
            funcionarios,
            escalas,
            divergencias
        }
    };
}

function realizarExportacao() {
    const botao = document.getElementById("btnExportar");
    const mensagem = document.getElementById("mensagemExportacao");

    try {

        botao.disabled = true;
        mensagem.className = "alert alert-info mt-3";
        mensagem.textContent = "Preparando arquivo de backup...";

        const backup = gerarBackup();

        const conteudo = JSON.stringify(backup, null, 4);

        const agora = new Date();
        const data = agora.toISOString()
            .replace(/[:.]/g, "-")
            .replace("T", "_")
            .replace("Z", "");

        const nomeArquivo = `nexo_backup_${data}.nexo`;

        if (
            typeof Android === "undefined" ||
            typeof Android.compartilharArquivoTexto !== "function"
        ) {
            throw new Error("Recurso de exportação indisponível.");
        }

        const resultado = Android.compartilharArquivoTexto(
            nomeArquivo,
            conteudo,
            "application/json"
        );

        if (
            resultado !== "ok" &&
            !String(resultado).startsWith("baixado:")
        ) {
            throw new Error(
                resultado || "Não foi possível gerar o arquivo."
            );
        }

        mensagem.className = "alert alert-success mt-3";
        mensagem.textContent =
            `Backup preparado com sucesso! ` +
            `${backup.data.funcionarios.length} funcionário(s), ` +
            `${backup.data.escalas.length} escala(s) e ` +
            `${backup.data.divergencias.length} divergência(s).`;

    } catch (erro) {

        console.error("Erro na exportação:", erro);

        mensagem.className = "alert alert-danger mt-3";
        mensagem.textContent = erro.message ||
            "Ocorreu um erro durante a exportação.";

    } finally {

        botao.disabled = false;
    }
}

document.getElementById("btnExportar")
    .addEventListener("click", realizarExportacao);

