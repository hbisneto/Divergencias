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
 * COMPARTILHAR POR E-MAIL (HTML do dia)
 * ========================================================= */

function obterInicioDoDia() {
    const agora = new Date();
    agora.setHours(0, 0, 0, 0);
    return agora.getTime();
}

function obterFimDoDia() {
    const agora = new Date();
    agora.setHours(23, 59, 59, 999);
    return agora.getTime();
}

function filtrarDivergenciasDoDia(lista) {
    const inicio = obterInicioDoDia();
    const fim = obterFimDoDia();

    return lista.filter(item => {
        const ts = Number(item.dataHora);
        return ts >= inicio && ts <= fim;
    });
}

function formatarDataCompleta(timestamp) {
    const data = new Date(Number(timestamp));
    return data.toLocaleDateString("pt-BR", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric"
    });
}

function gerarHtmlEmail(divergenciasDoDia) {
    const dataHoje = formatarDataCompleta(Date.now());
    const totalGeral = divergenciasDoDia.reduce(
        (acc, item) => acc + Number(item.divergencia),
        0
    );

    // Linhas da tabela
    let linhasTabela = "";

    if (divergenciasDoDia.length === 0) {
        linhasTabela = `
            <tr>
                <td colspan="6" style="padding: 24px; text-align: center; color: #666;">
                    Nenhuma divergência registrada hoje.
                </td>
            </tr>
        `;
    } else {
        linhasTabela = divergenciasDoDia.map((item, index) => `
            <tr style="background-color: ${index % 2 === 0 ? "#ffffff" : "#f8f9fa"};">
                <td style="padding: 10px 12px; border-bottom: 1px solid #e9ecef; font-size: 13px;">
                    ${valorOuTraco(item.codigoProduto)}
                </td>
                <td style="padding: 10px 12px; border-bottom: 1px solid #e9ecef; font-size: 13px;">
                    ${valorOuTraco(item.descricao)}
                </td>
                <td style="padding: 10px 12px; border-bottom: 1px solid #e9ecef; font-size: 13px; text-align: right;">
                    ${centavosParaMoeda(item.valorOriginal)}
                </td>
                <td style="padding: 10px 12px; border-bottom: 1px solid #e9ecef; font-size: 13px; text-align: center;">
                    ${item.quantidade}
                </td>
                <td style="padding: 10px 12px; border-bottom: 1px solid #e9ecef; font-size: 13px; text-align: right;">
                    ${centavosParaMoeda(item.valorPromocional)}
                </td>
                <td style="padding: 10px 12px; border-bottom: 1px solid #e9ecef; font-size: 13px; text-align: right; font-weight: 600; color: #b6202f;">
                    ${centavosParaMoeda(item.divergencia)}
                </td>
            </tr>
        `).join("");
    }

    // Template HTML (estilo newsletter – CSS inline)
    return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Divergências do dia</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f0f2f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">

    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f0f2f5; padding: 32px 16px;">
        <tr>
            <td align="center">

                <!-- Container principal -->
                <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 640px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.08);">

                    <!-- Header -->
                    <tr>
                        <td style="background-color: #b6202f; padding: 28px 32px; text-align: center;">
                            <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 700; letter-spacing: -0.3px;">
                                Divergências
                            </h1>
                            <p style="margin: 8px 0 0; color: rgba(255,255,255,0.85); font-size: 14px;">
                                Relatório do dia
                            </p>
                        </td>
                    </tr>

                    <!-- Data -->
                    <tr>
                        <td style="padding: 24px 32px 8px;">
                            <p style="margin: 0; color: #666; font-size: 14px;">
                                ${dataHoje}
                            </p>
                        </td>
                    </tr>

                    <!-- Tabela -->
                    <tr>
                        <td style="padding: 16px 24px 8px;">
                            <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse;">
                                <thead>
                                    <tr style="background-color: #f8f9fa;">
                                        <th style="padding: 10px 12px; text-align: left; font-size: 12px; color: #666; font-weight: 600; border-bottom: 2px solid #dee2e6;">Código</th>
                                        <th style="padding: 10px 12px; text-align: left; font-size: 12px; color: #666; font-weight: 600; border-bottom: 2px solid #dee2e6;">Descrição</th>
                                        <th style="padding: 10px 12px; text-align: right; font-size: 12px; color: #666; font-weight: 600; border-bottom: 2px solid #dee2e6;">Original</th>
                                        <th style="padding: 10px 12px; text-align: center; font-size: 12px; color: #666; font-weight: 600; border-bottom: 2px solid #dee2e6;">Qtd</th>
                                        <th style="padding: 10px 12px; text-align: right; font-size: 12px; color: #666; font-weight: 600; border-bottom: 2px solid #dee2e6;">Promocional</th>
                                        <th style="padding: 10px 12px; text-align: right; font-size: 12px; color: #666; font-weight: 600; border-bottom: 2px solid #dee2e6;">Divergência</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${linhasTabela}
                                </tbody>
                            </table>
                        </td>
                    </tr>

                    <!-- Total -->
                    <tr>
                        <td style="padding: 20px 32px 28px;">
                            <table width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td style="background-color: #fff5f5; border-radius: 8px; padding: 16px 20px;">
                                        <table width="100%" cellpadding="0" cellspacing="0">
                                            <tr>
                                                <td style="font-size: 14px; color: #666; font-weight: 500;">
                                                    Total de divergências do dia
                                                </td>
                                                <td style="text-align: right; font-size: 20px; font-weight: 700; color: #b6202f;">
                                                    ${centavosParaMoeda(totalGeral)}
                                                </td>
                                            </tr>
                                            <tr>
                                                <td colspan="2" style="padding-top: 6px; font-size: 12px; color: #999;">
                                                    ${divergenciasDoDia.length} registro(s)
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #f8f9fa; padding: 20px 32px; text-align: center; border-top: 1px solid #e9ecef;">
                            <p style="margin: 0; font-size: 12px; color: #999;">
                                Gerado pelo aplicativo <strong style="color: #b6202f;">Divergências</strong><br>
                                Bisneto Inc. · ${new Date().getFullYear()}
                            </p>
                        </td>
                    </tr>

                </table>

            </td>
        </tr>
    </table>

</body>
</html>
`.trim();
}

function compartilharPorEmail() {
    const divergenciasDoDia = filtrarDivergenciasDoDia(listaCompleta);

    const html = gerarHtmlEmail(divergenciasDoDia);
    const dataCurta = new Date().toLocaleDateString("pt-BR");
    const assunto = `Divergências do dia – ${dataCurta}`;

    if (typeof Android !== "undefined" && Android.compartilharPorEmail) {
        const resultado = Android.compartilharPorEmail(html, assunto);

        if (resultado !== "ok") {
            alert("Não foi possível abrir o cliente de e-mail.\n" + resultado);
        }
    } else {
        // Fallback para navegador (abre mailto – HTML limitado)
        console.warn("Android.compartilharPorEmail não disponível");
        alert("Compartilhamento por e-mail disponível apenas no aplicativo Android.");
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
 * E-MAIL — divergências do dia (HTML formatado)
 * ========================================================= */

const modalEmailDia = new bootstrap.Modal(document.getElementById("modalEmailDia"));

function isMesmoDia(timestampMs) {
    const d = new Date(Number(timestampMs));
    const hoje = new Date();
    return d.getFullYear() === hoje.getFullYear()
        && d.getMonth() === hoje.getMonth()
        && d.getDate() === hoje.getDate();
}

function filtrarDivergenciasDoDia(lista) {
    return (lista || []).filter(item => isMesmoDia(item.dataHora));
}

function escaparHtml(texto) {
    return String(texto ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}

function gerarHtmlDivergenciasDoDia(lista) {
    const itens = filtrarDivergenciasDoDia(lista);
    const dataStr = new Date().toLocaleDateString("pt-BR");

    let linhas = "";
    let totalCentavos = 0;

    if (itens.length === 0) {
        linhas = `
            <tr>
                <td colspan="6" style="padding:12px;text-align:center;color:#666;">
                    Nenhuma divergência registrada hoje.
                </td>
            </tr>`;
    } else {
        itens.forEach(item => {
            totalCentavos += Number(item.divergencia) || 0;
            linhas += `
            <tr style="border-bottom:1px solid #eee;">
                <td style="padding:8px;">${escaparHtml(valorOuTraco(item.codigoProduto))}</td>
                <td style="padding:8px;">${escaparHtml(valorOuTraco(item.descricao))}</td>
                <td style="padding:8px;">${centavosParaMoeda(item.valorOriginal)}</td>
                <td style="padding:8px;text-align:center;">${item.quantidade}</td>
                <td style="padding:8px;">${centavosParaMoeda(item.valorPromocional)}</td>
                <td style="padding:8px;font-weight:bold;">${centavosParaMoeda(item.divergencia)}</td>
            </tr>`;
        });
    }

    return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:Arial,sans-serif;background:#f4f4f4;padding:20px;margin:0;">
  <div style="max-width:640px;margin:0 auto;background:#fff;border-radius:8px;padding:24px;">
    <h2 style="color:#b6202f;margin-top:0;">Divergências do dia</h2>
    <p style="color:#666;margin:0 0 16px 0;">Data: <strong>${dataStr}</strong> · ${itens.length} registro(s)</p>
    <table style="width:100%;border-collapse:collapse;font-size:14px;">
      <thead>
        <tr style="background:#b6202f;color:#fff;">
          <th style="padding:10px;text-align:left;">Código</th>
          <th style="padding:10px;text-align:left;">Descrição</th>
          <th style="padding:10px;text-align:left;">Original</th>
          <th style="padding:10px;text-align:center;">Qtd</th>
          <th style="padding:10px;text-align:left;">Promo</th>
          <th style="padding:10px;text-align:left;">Divergência</th>
        </tr>
      </thead>
      <tbody>
        ${linhas}
      </tbody>
    </table>
    <p style="margin-top:20px;font-size:18px;font-weight:bold;color:#333;">
      Total: ${centavosParaMoeda(totalCentavos)}
    </p>
    <hr style="border:none;border-top:1px solid #eee;margin:24px 0;">
    <p style="color:#999;font-size:12px;margin:0;">Enviado pelo app Divergências</p>
  </div>
</body>
</html>`;
}

function atualizarUiCredenciaisEmail() {
    const configurado = typeof Android !== "undefined" && Android.emailEstaConfigurado();
    const aviso = document.getElementById("emailConfigAviso");
    const bloco = document.getElementById("blocoCredenciais");

    if (configurado) {
        aviso.classList.add("d-none");
        bloco.classList.add("d-none");
        const ultimo = Android.obterUltimoDestinatario();
        if (ultimo) {
            document.getElementById("emailDestinatario").value = ultimo;
        }
    } else {
        aviso.classList.remove("d-none");
        bloco.classList.remove("d-none");
    }
}

document.getElementById("btnEmailDia").addEventListener("click", () => {
    if (!listaCompleta || filtrarDivergenciasDoDia(listaCompleta).length === 0) {
        alert("Não há divergências do dia para enviar.");
        return;
    }
    document.getElementById("emailStatus").textContent = "";
    atualizarUiCredenciaisEmail();
    modalEmailDia.show();
});

document.getElementById("btnSalvarCredenciais").addEventListener("click", () => {
    const email = document.getElementById("cfgEmailRemetente").value.trim();
    const senha = document.getElementById("cfgAppPassword").value.trim();

    if (!email || !senha) {
        alert("Preencha e-mail e senha de app.");
        return;
    }

    if (typeof Android === "undefined" || !Android.salvarCredenciaisEmail(email, senha)) {
        alert("Não foi possível salvar as credenciais.");
        return;
    }

    alert("Credenciais salvas!");
    atualizarUiCredenciaisEmail();
});

document.getElementById("btnConfirmarEmail").addEventListener("click", () => {
    if (typeof Android === "undefined") {
        alert("Disponível apenas no aplicativo Android.");
        return;
    }

    if (!Android.emailEstaConfigurado()) {
        alert("Salve o e-mail e a senha de app primeiro.");
        return;
    }

    const destinatario = document.getElementById("emailDestinatario").value.trim();
    const assunto = document.getElementById("emailAssunto").value.trim() || "Divergências do dia";
    const html = gerarHtmlDivergenciasDoDia(listaCompleta);

    document.getElementById("emailStatus").textContent = "Enviando...";
    document.getElementById("btnConfirmarEmail").disabled = true;

    Android.enviarEmail(destinatario, assunto, html, "", "");
});












/* =========================================================
 * E-MAIL POR PERÍODO (máx. 90 dias + limite de legibilidade)
 * ========================================================= */

const MAX_DIAS_PERIODO = 90;
const MAX_LINHAS_CORPO_EMAIL = 40; // legível no celular

const modalEmailPeriodoEl = document.getElementById("modalEmailPeriodo");
const modalEmailPeriodo = modalEmailPeriodoEl
    ? new bootstrap.Modal(modalEmailPeriodoEl)
    : null;

function inicioDoDia(dateObj) {
    const d = new Date(dateObj);
    d.setHours(0, 0, 0, 0);
    return d.getTime();
}

function fimDoDia(dateObj) {
    const d = new Date(dateObj);
    d.setHours(23, 59, 59, 999);
    return d.getTime();
}

function diasEntre(tsInicio, tsFim) {
    return Math.floor((tsFim - tsInicio) / (1000 * 60 * 60 * 24)) + 1;
}

function filtrarPorPeriodo(lista, tsInicio, tsFim) {
    return (lista || []).filter(item => {
        const ts = Number(item.dataHora);
        return ts >= tsInicio && ts <= tsFim;
    });
}

function dataInputParaLabel(yyyyMmDd) {
    if (!yyyyMmDd) return "";
    const [y, m, d] = yyyyMmDd.split("-");
    return `${d}/${m}/${y}`;
}

/** HTML legível: se total > MAX, mostra só as primeiras N + aviso de anexo */
function gerarHtmlEmailPeriodo(divergencias, labelInicio, labelFim, comAnexoCompleto) {
    const totalGeral = divergencias.reduce((acc, i) => acc + Number(i.divergencia), 0);
    const exibidas = comAnexoCompleto
        ? divergencias.slice(0, MAX_LINHAS_CORPO_EMAIL)
        : divergencias;

    let linhas = "";
    if (exibidas.length === 0) {
        linhas = `<tr><td colspan="6" style="padding:16px;text-align:center;color:#666;">Nenhum registro no período.</td></tr>`;
    } else {
        linhas = exibidas.map((item, index) => `
            <tr style="background:${index % 2 === 0 ? "#fff" : "#f8f9fa"};">
                <td style="padding:8px;border-bottom:1px solid #eee;font-size:13px;">${valorOuTraco(item.codigoProduto)}</td>
                <td style="padding:8px;border-bottom:1px solid #eee;font-size:13px;">${valorOuTraco(item.descricao)}</td>
                <td style="padding:8px;border-bottom:1px solid #eee;font-size:13px;text-align:right;">${centavosParaMoeda(item.valorOriginal)}</td>
                <td style="padding:8px;border-bottom:1px solid #eee;font-size:13px;text-align:center;">${item.quantidade}</td>
                <td style="padding:8px;border-bottom:1px solid #eee;font-size:13px;text-align:right;">${centavosParaMoeda(item.valorPromocional)}</td>
                <td style="padding:8px;border-bottom:1px solid #eee;font-size:13px;font-weight:bold;">${centavosParaMoeda(item.divergencia)}</td>
            </tr>
        `).join("");
    }

    const avisoAnexo = comAnexoCompleto ? `
        <p style="margin-top:16px;padding:12px;background:#fff3cd;border-radius:6px;font-size:13px;color:#856404;">
            Foram encontrados <strong>${divergencias.length}</strong> registros.
            O corpo mostra os primeiros <strong>${MAX_LINHAS_CORPO_EMAIL}</strong>.
            A lista completa está no <strong>anexo</strong>.
        </p>` : "";

    return `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="font-family:Arial,sans-serif;background:#f4f4f4;padding:20px;margin:0;">
  <div style="max-width:640px;margin:0 auto;background:#fff;border-radius:8px;padding:24px;">
    <h2 style="color:#b6202f;margin-top:0;">Divergências por período</h2>
    <p style="color:#666;">Período: <strong>${labelInicio}</strong> a <strong>${labelFim}</strong></p>
    <p style="color:#666;">Registros: <strong>${divergencias.length}</strong></p>
    ${avisoAnexo}
    <table style="width:100%;border-collapse:collapse;margin-top:12px;">
      <thead>
        <tr style="background:#b6202f;color:#fff;">
          <th style="padding:10px;text-align:left;">Código</th>
          <th style="padding:10px;text-align:left;">Descrição</th>
          <th style="padding:10px;text-align:right;">Original</th>
          <th style="padding:10px;text-align:center;">Qtd</th>
          <th style="padding:10px;text-align:right;">Promo</th>
          <th style="padding:10px;text-align:left;">Divergência</th>
        </tr>
      </thead>
      <tbody>${linhas}</tbody>
    </table>
    <p style="margin-top:20px;font-size:18px;font-weight:bold;">Total: ${centavosParaMoeda(totalGeral)}</p>
    <hr style="border:none;border-top:1px solid #eee;margin:24px 0;">
    <p style="color:#999;font-size:12px;">Enviado pelo app Divergências</p>
  </div>
</body></html>`;
}

function gerarAnexoHtmlCompleto(divergencias, labelInicio, labelFim) {
    // Reusa o gerador sem cortar linhas
    return gerarHtmlEmailPeriodo(divergencias, labelInicio, labelFim, false)
        .replace(
            `Registros: <strong>${divergencias.length}</strong>`,
            `Registros (lista completa): <strong>${divergencias.length}</strong>`
        );
}

document.getElementById("btnEmailPeriodo")?.addEventListener("click", () => {
    if (typeof Android === "undefined" || !Android.emailEstaConfigurado()) {
        alert("Configure o e-mail e a senha de app antes de enviar.");
        return;
    }

    const hoje = new Date();
    const fim = hoje.toISOString().slice(0, 10);
    const inicioDate = new Date(hoje);
    inicioDate.setDate(inicioDate.getDate() - 29); // padrão: últimos 30 dias
    const inicio = inicioDate.toISOString().slice(0, 10);

    document.getElementById("emailDataInicio").value = inicio;
    document.getElementById("emailDataFim").value = fim;
    document.getElementById("emailPeriodoDestinatario").value =
        Android.obterUltimoDestinatario() || "";
    document.getElementById("emailPeriodoAssunto").value =
        `Divergências – ${dataInputParaLabel(inicio)} a ${dataInputParaLabel(fim)}`;
    document.getElementById("emailPeriodoStatus").textContent = "";

    modalEmailPeriodo?.show();
});

// Atualiza assunto ao mudar datas
["emailDataInicio", "emailDataFim"].forEach(id => {
    document.getElementById(id)?.addEventListener("change", () => {
        const i = document.getElementById("emailDataInicio").value;
        const f = document.getElementById("emailDataFim").value;
        if (i && f) {
            document.getElementById("emailPeriodoAssunto").value =
                `Divergências – ${dataInputParaLabel(i)} a ${dataInputParaLabel(f)}`;
        }
    });
});

document.getElementById("btnConfirmarEmailPeriodo")?.addEventListener("click", () => {
    const inicioStr = document.getElementById("emailDataInicio").value;
    const fimStr = document.getElementById("emailDataFim").value;
    const destinatario = document.getElementById("emailPeriodoDestinatario").value.trim();
    const assunto = document.getElementById("emailPeriodoAssunto").value.trim();
    const formatoAnexo = document.getElementById("emailFormatoAnexo").value; // csv | html

    if (!inicioStr || !fimStr) {
        alert("Informe data início e data fim.");
        return;
    }

    const tsInicio = inicioDoDia(new Date(inicioStr + "T00:00:00"));
    const tsFim = fimDoDia(new Date(fimStr + "T00:00:00"));

    if (tsFim < tsInicio) {
        alert("A data fim deve ser maior ou igual à data início.");
        return;
    }

    const qtdDias = diasEntre(tsInicio, tsFim);
    if (qtdDias > MAX_DIAS_PERIODO) {
        alert(`O período máximo é de ${MAX_DIAS_PERIODO} dias. Você selecionou ${qtdDias} dias.`);
        return;
    }

    if (!destinatario) {
        alert("Informe o destinatário.");
        return;
    }

    const filtradas = filtrarPorPeriodo(listaCompleta, tsInicio, tsFim);
    if (filtradas.length === 0) {
        alert("Não há divergências nesse período.");
        return;
    }

    const labelI = dataInputParaLabel(inicioStr);
    const labelF = dataInputParaLabel(fimStr);
    const precisaAnexo = filtradas.length > MAX_LINHAS_CORPO_EMAIL;

    const htmlCorpo = gerarHtmlEmailPeriodo(filtradas, labelI, labelF, precisaAnexo);

    let nomeAnexo = "";
    let conteudoAnexo = "";

    if (precisaAnexo) {
        if (formatoAnexo === "html") {
            nomeAnexo = `divergencias_${inicioStr}_${fimStr}.html`;
            conteudoAnexo = gerarAnexoHtmlCompleto(filtradas, labelI, labelF);
        } else {
            nomeAnexo = `divergencias_${inicioStr}_${fimStr}.csv`;
            // Reusa o gerador de CSV que você já tem
            conteudoAnexo = "\uFEFF" + gerarCsvCompleto(filtradas);
        }
    }

    const status = document.getElementById("emailPeriodoStatus");
    const btn = document.getElementById("btnConfirmarEmailPeriodo");
    status.textContent = precisaAnexo
        ? `Enviando resumo + anexo (${filtradas.length} registros)...`
        : `Enviando ${filtradas.length} registro(s)...`;
    btn.disabled = true;

    // Uma única assinatura de 5 parâmetros no bridge
    Android.enviarEmail(
        destinatario,
        assunto || `Divergências – ${labelI} a ${labelF}`,
        htmlCorpo,
        nomeAnexo,
        conteudoAnexo
    );
});

// Se ainda não existir, unifique o callback:
// window.onEmailResult = function (sucesso, mensagem) {
//     const btnDia = document.getElementById("btnConfirmarEmail");
//     const btnPeriodo = document.getElementById("btnConfirmarEmailPeriodo");
//     if (btnDia) btnDia.disabled = false;
//     if (btnPeriodo) btnPeriodo.disabled = false;

//     const statusPeriodo = document.getElementById("emailPeriodoStatus");
//     if (statusPeriodo) statusPeriodo.textContent = mensagem;

//     if (sucesso) {
//         alert("E-mail enviado com sucesso!");
//         modalEmailPeriodo?.hide();
//         // se tiver modal do dia:
//         // modalEmailDia?.hide();
//     } else {
//         alert("Erro: " + mensagem);
//     }
// };





















window.onEmailResult = function (sucesso, mensagem) {
    const btnDia = document.getElementById("btnConfirmarEmail");
    const btnPeriodo = document.getElementById("btnConfirmarEmailPeriodo");
    if (btnDia) btnDia.disabled = false;
    if (btnPeriodo) btnPeriodo.disabled = false;

    const statusPeriodo = document.getElementById("emailPeriodoStatus");
    if (statusPeriodo) statusPeriodo.textContent = mensagem;

    if (sucesso) {
        alert("E-mail enviado com sucesso!");
        modalEmailPeriodo?.hide();
        // se tiver modal do dia:
        // modalEmailDia?.hide();
    } else {
        alert("Erro: " + mensagem);
    }
};



// window.onEmailResult = function (sucesso, mensagem) {
//     document.getElementById("btnConfirmarEmail").disabled = false;
//     document.getElementById("emailStatus").textContent = mensagem;

//     if (sucesso) {
//         alert("E-mail enviado com sucesso!");
//         modalEmailDia.hide();
//     } else {
//         alert("Erro: " + mensagem);
//     }
// };

/* =========================================================
 * INICIALIZAÇÃO
 * ========================================================= */

document.addEventListener("DOMContentLoaded", () => {
    carregarHistorico();
});

// Compartilhar por E-mail (HTML do dia)
document.getElementById("btnCompartilharEmail").addEventListener("click", () => {
    compartilharPorEmail();
});