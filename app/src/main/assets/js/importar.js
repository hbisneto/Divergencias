"use strict";

const CHAVE_ESCALAS = "divergencias_escalas_funcionarios_v2";
const CHAVE_FUNCIONARIOS = "divergencias_funcionarios_v1";
const CHAVE_DIVERGENCIAS = "divergencias_db_v1";

let backupSelecionado = null;

function validarBackup(backup) {

    if (!backup || typeof backup !== "object") {
        throw new Error("Arquivo inválido.");
    }

    if (backup.format !== "nexo-backup") {
        throw new Error("Este arquivo não é um backup do Nexo.");
    }

    if (backup.schemaVersion !== 1) {
        throw new Error("Versão de backup não suportada.");
    }

    const dados = backup.data;

    if (!dados) {
        throw new Error("O backup não contém dados.");
    }

    const categorias = [
        "funcionarios",
        "escalas",
        "divergencias"
    ];

    categorias.forEach(chave => {
        if (!Array.isArray(dados[chave])) {
            throw new Error(
                `A categoria ${chave} está ausente ou inválida.`
            );
        }
    });

    return true;
}

function processarArquivo(conteudo, nomeArquivo) {

    try {

        const backup = JSON.parse(conteudo);

        validarBackup(backup);

        backupSelecionado = backup;

        document.getElementById("informacoesBackup")
            .classList.remove("d-none");

        document.getElementById("resumoBackup").innerHTML = `
            <p><strong>Arquivo:</strong> ${nomeArquivo}</p>
            <p><strong>Funcionários:</strong>
                ${backup.data.funcionarios.length}</p>
            <p><strong>Escalas:</strong>
                ${backup.data.escalas.length}</p>
            <p><strong>Divergências:</strong>
                ${backup.data.divergencias.length}</p>
            <p><strong>Exportado em:</strong>
                ${new Date(backup.exportedAt).toLocaleString("pt-BR")}</p>
        `;

        mostrarMensagem(
            "Backup reconhecido. Confira as informações antes de restaurar.",
            "success"
        );

    } catch (erro) {

        backupSelecionado = null;

        document.getElementById("informacoesBackup")
            .classList.add("d-none");

        mostrarMensagem(erro.message, "danger");
    }
}

window.NexoImport = {
    receberArquivo(conteudo, nomeArquivo) {
        processarArquivo(conteudo, nomeArquivo);
    },

    erro(mensagem) {
        mostrarMensagem(mensagem, "danger");
    }

};

document.getElementById("arquivoBackup")
    .addEventListener("change", async function () {

        const arquivo = this.files[0];

        if (!arquivo) return;

        try {

            const conteudo = await arquivo.text();

            processarArquivo(conteudo, arquivo.name);

        } catch (erro) {

            mostrarMensagem(
                "Não foi possível ler o arquivo selecionado.",
                "danger"
            );
        }
    });

function mostrarMensagem(texto, tipo = "info") {
    const elemento = document.getElementById("mensagemImportacao");
    elemento.textContent = texto;
    elemento.className = `alert alert-${tipo} mt-3`;
}


function restaurarBackup() {

    if (!backupSelecionado) {
        mostrarMensagem("Nenhum backup selecionado.", "warning");
        return;
    }

    const confirmar = confirm(
        "Atenção!\n\n" +
        "A restauração substituirá os dados atuais pelos dados do backup.\n\n" +
        "Deseja continuar?"
    );

    if (!confirmar) return;

    const dados = backupSelecionado.data;

    const chaves = [
        CHAVE_ESCALAS,
        CHAVE_FUNCIONARIOS,
        CHAVE_DIVERGENCIAS
    ];

    const anteriores = {};

    chaves.forEach(chave => {
        anteriores[chave] = localStorage.getItem(chave);
    });

    try {

        // As escalas são armazenadas no localStorage
        localStorage.setItem(
            CHAVE_ESCALAS,
            JSON.stringify(dados.escalas)
        );

        const nativo =
            typeof Android !== "undefined" &&
            typeof Android.isNative === "function" &&
            Android.isNative();

        if (nativo) {

            const resposta = JSON.parse(
                Android.importarBackupBanco(
                    JSON.stringify({
                        funcionarios: dados.funcionarios,
                        divergencias: dados.divergencias
                    })
                )
            );

            if (!resposta.ok) {
                throw new Error(
                    resposta.erro || "Erro ao restaurar o banco."
                );
            }

        } else {

            localStorage.setItem(
                CHAVE_FUNCIONARIOS,
                JSON.stringify(dados.funcionarios)
            );

            localStorage.setItem(
                CHAVE_DIVERGENCIAS,
                JSON.stringify(dados.divergencias)
            );
        }

        mostrarMensagem(
            "Backup restaurado com sucesso!",
            "success"
        );

        document.getElementById("btnRestaurar").disabled = true;

    } catch (erro) {

        // Reverter alterações no localStorage
        chaves.forEach(chave => {

            if (anteriores[chave] === null) {
                localStorage.removeItem(chave);
            } else {
                localStorage.setItem(chave, anteriores[chave]);
            }

        });

        mostrarMensagem(erro.message, "danger");
    }
}

document.getElementById("btnRestaurar")
    .addEventListener("click", restaurarBackup);
