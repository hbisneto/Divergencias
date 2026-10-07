const historico = document.getElementById("historico");
const modalDetalhesElement = document.getElementById("modalDetalhes");
const modalDetalhes = new bootstrap.Modal(modalDetalhesElement);
const conteudoDetalhes = document.getElementById("conteudoDetalhes");

let divergenciaAtual = null;
let listaCompleta = []; // guarda a lista para exportar tudo

/* =========================================================
 * UTILITÁRIOS
 * ========================================================= */

function centavosParaMoeda(centavos) {
    return (Number(centavos) / 100).toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL"
    });
}

function formatarData(dataHora) {
    const data = new Date(Number(dataHora));
    return data.toLocaleString("pt-BR", {
        dateStyle: "short",
        timeStyle: "short"
    });
}

function valorOuTraco(valor) {
    if (valor === null || valor === undefined) return "--";
    const texto = String(valor).trim();
    return texto === "" ? "--" : texto;
}

function traduzirMotivo(motivo) {
    const mapa = {
        "etiqueta_pdv": "Etiqueta × PDV",
        "etiqueta_tabloide": "Etiqueta × Tabloide",
        "tabloide_pdv": "Tabloide × PDV",
        "pc_virtual": "PC Virtual / LMPM",
        "ofertas_exclusivas": "Ofertas Exclusivas",
        "oferta_combinada": "Oferta Combinada"
    };
    return mapa[motivo] || valorOuTraco(motivo);
}

/* =========================================================
 * CARREGAR HISTÓRICO
 * ========================================================= */

function carregarHistorico() {
    try {
        if (typeof Android === "undefined") {
            window.Android = {
                listar: () => "[]"
            };
        }

        const json = Android.listar();
        listaCompleta = JSON.parse(json);
        renderizarHistorico(listaCompleta);
    } catch (error) {
        console.error("Erro ao carregar histórico:", error);
        historico.innerHTML = `
            <div class="alert alert-danger">
                Não foi possível carregar o histórico.
            </div>
        `;
    }
}

/* =========================================================
 * RENDERIZAR LISTA
 * ========================================================= */

function renderizarHistorico(divergencias) {
    if (!divergencias || divergencias.length === 0) {
        historico.innerHTML = `
            <div class="text-center py-5">
                <div class="text-muted mb-3">Nenhuma divergência registrada.</div>
                <a href="index.html" class="btn btn-primary">Calcular divergência</a>
            </div>
        `;
        return;
    }

    historico.innerHTML = divergencias.map(item => `
        <div class="card mb-3 shadow-sm card-divergencia" style="cursor: pointer;" data-id="${item.id}">
            <div class="card-body">
                <div class="d-flex justify-content-between align-items-start flex-wrap gap-3">
                    <div>
                        <div class="text-muted small">Divergência</div>
                        <div class="fs-4 fw-bold text-danger">
                            ${centavosParaMoeda(item.divergencia)}
                        </div>
                        <div class="text-muted small mt-1">
                            ${formatarData(item.dataHora)}
                        </div>
                    </div>
                    <div class="text-end">
                        <div class="text-muted small">Motivo</div>
                        <div class="fw-semibold">${traduzirMotivo(item.motivo)}</div>
                    </div>
                </div>
            </div>
        </div>
    `).join("");

    document.querySelectorAll(".card-divergencia").forEach(card => {
        card.addEventListener("click", () => {
            const id = card.getAttribute("data-id");
            abrirDetalhes(id);
        });
    });
}

/* =========================================================
 * ABRIR DETALHES
 * ========================================================= */

function abrirDetalhes(id) {
    const item = listaCompleta.find(d => String(d.id) === String(id));
    if (!item) return;

    divergenciaAtual = item;

    conteudoDetalhes.innerHTML = `
        <div class="mb-3">
            <div class="text-muted small">Valor da divergência</div>
            <div class="fs-3 fw-bold text-danger">${centavosParaMoeda(item.divergencia)}</div>
        </div>
        <hr>
        <div class="row g-3">
            <div class="col-6">
                <div class="text-muted small">Código do produto</div>
                <div class="fw-semibold">${valorOuTraco(item.codigoProduto)}</div>
            </div>
            <div class="col-6">
                <div class="text-muted small">PDV</div>
                <div class="fw-semibold">${valorOuTraco(item.pdv)}</div>
            </div>
            <div class="col-12">
                <div class="text-muted small">Descrição</div>
                <div class="fw-semibold">${valorOuTraco(item.descricao)}</div>
            </div>
            <div class="col-6">
                <div class="text-muted small">Valor original</div>
                <div class="fw-semibold">${centavosParaMoeda(item.valorOriginal)}</div>
            </div>
            <div class="col-6">
                <div class="text-muted small">Quantidade</div>
                <div class="fw-semibold">${item.quantidade}</div>
            </div>
            <div class="col-6">
                <div class="text-muted small">Valor promocional</div>
                <div class="fw-semibold">${centavosParaMoeda(item.valorPromocional)}</div>
            </div>
            <div class="col-6">
                <div class="text-muted small">Motivo</div>
                <div class="fw-semibold">${traduzirMotivo(item.motivo)}</div>
            </div>
            <div class="col-12">
                <div class="text-muted small">Data / Hora</div>
                <div class="fw-semibold">${formatarData(item.dataHora)}</div>
            </div>
        </div>
    `;

    modalDetalhes.show();
}

/* =========================================================
 * GERAR CSV
 * ========================================================= */

function escaparCsv(valor) {
    const texto = String(valor ?? "").replace(/"/g, '""');
    return `"${texto}"`;
}

function gerarCsvItem(item) {
    return [
        item.id,
        valorOuTraco(item.codigoProduto),
        valorOuTraco(item.pdv),
        valorOuTraco(item.descricao),
        (Number(item.valorOriginal) / 100).toFixed(2).replace(".", ","),
        item.quantidade,
        (Number(item.valorPromocional) / 100).toFixed(2).replace(".", ","),
        (Number(item.divergencia) / 100).toFixed(2).replace(".", ","),
        traduzirMotivo(item.motivo),
        formatarData(item.dataHora)
    ].map(escaparCsv).join(";");
}

function gerarCsvCompleto(divergencias) {
    const cabecalho = [
        "ID",
        "Código do produto",
        "PDV",
        "Descrição",
        "Valor original",
        "Quantidade",
        "Valor promocional",
        "Divergência",
        "Motivo",
        "Data/Hora"
    ].map(escaparCsv).join(";");

    const linhas = divergencias.map(gerarCsvItem);
    return [cabecalho, ...linhas].join("\n");
}

/* =========================================================
 * TEXTO PARA COMPARTILHAR (item individual)
 * ========================================================= */

function gerarTextoDivergencia(item) {
    return `
Divergência #${item.id}
────────────────────────
Código: ${valorOuTraco(item.codigoProduto)}
PDV: ${valorOuTraco(item.pdv)}
Descrição: ${valorOuTraco(item.descricao)}
Valor original: ${centavosParaMoeda(item.valorOriginal)}
Quantidade: ${item.quantidade}
Valor promocional: ${centavosParaMoeda(item.valorPromocional)}
Divergência: ${centavosParaMoeda(item.divergencia)}
Motivo: ${traduzirMotivo(item.motivo)}
Data: ${formatarData(item.dataHora)}
`.trim();
}

/* =========================================================
 * EXPORTAR / COMPARTILHAR (versão nativa)
 * ========================================================= */

function exportarCsvNativo(conteudo, nomeArquivo) {
    // Adiciona BOM UTF-8 para o Excel reconhecer acentuação
    const conteudoComBom = "\uFEFF" + conteudo;

    if (typeof Android !== "undefined" && Android.salvarArquivo) {
        const caminho = Android.salvarArquivo(nomeArquivo, conteudoComBom);

        if (caminho && caminho.length > 0) {
            alert(
                "Arquivo salvo com sucesso!\n\n" +
                "Local:\n" + caminho
            );
        } else {
            alert(
                "Não foi possível salvar o arquivo.\n" +
                "Verifique se o aplicativo tem permissão de armazenamento."
            );
        }
    } else {
        // Fallback para navegador (teste)
        console.warn("Android.salvarArquivo não disponível – modo navegador");
        const blob = new Blob([conteudoComBom], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = nomeArquivo;
        a.click();
        URL.revokeObjectURL(url);
        alert("Arquivo baixado (modo navegador).");
    }
}

/* =========================================================
 * EVENTOS DOS BOTÕES
 * ========================================================= */

// Exportar TUDO (CSV)
document.getElementById("btnExportarTudo").addEventListener("click", () => {
    if (!listaCompleta || listaCompleta.length === 0) {
        alert("Não há divergências para exportar.");
        return;
    }

    const csv = gerarCsvCompleto(listaCompleta);
    const data = new Date().toISOString().slice(0, 10);
    exportarCsvNativo(csv, `divergencias_${data}.csv`);
});

// Exportar ITEM (CSV)
document.getElementById("btnExportarItem").addEventListener("click", () => {
    if (!divergenciaAtual) return;

    const csv = gerarCsvCompleto([divergenciaAtual]);
    exportarCsvNativo(csv, `divergencia_${divergenciaAtual.id}.csv`);
});

// Compartilhar ITEM (texto) – continua usando navigator.share
document.getElementById("btnCompartilharItem").addEventListener("click", async () => {
    if (!divergenciaAtual) return;

    const texto = gerarTextoDivergencia(divergenciaAtual);

    if (navigator.share) {
        try {
            await navigator.share({
                title: `Divergência #${divergenciaAtual.id}`,
                text: texto
            });
        } catch (e) {
            // cancelado
        }
    } else {
        try {
            await navigator.clipboard.writeText(texto);
            alert("Texto copiado para a área de transferência!");
        } catch (e) {
            alert("Não foi possível compartilhar.");
        }
    }
});

/* =========================================================
 * INICIALIZAÇÃO
 * ========================================================= */

document.addEventListener("DOMContentLoaded", () => {
    carregarHistorico();
});