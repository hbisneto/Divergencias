const form                          = document.getElementById("formDivergencia");
const resultado                     = document.getElementById("resultado");
const historico                     = document.getElementById("historico");
const codigoProdutoInput            = document.getElementById("codigoProduto");
const pdvInput                      = document.getElementById("pdv");
const descricaoInput                = document.getElementById("descricao");
const motivoInput                   = document.getElementById("motivo");
const valorOriginalInput            = document.getElementById("valorOriginal");
const quantidadeInput               = document.getElementById("quantidade");
const valorPromocionalInput         = document.getElementById("valorPromocional");
const valorTotalInput               = document.getElementById("valorTotal");
const botaoSubmit                   = form.querySelector("button[type='submit']");
const modalConfirmarExclusaoElement = document.getElementById("modalConfirmarExclusao");
const botaoConfirmarExclusao        = document.getElementById("confirmarExclusao");
const modalConfirmarExclusao =
    new bootstrap.Modal(
        modalConfirmarExclusaoElement
    );

let divergencias = [];
let divergenciaEditando = null;
let divergenciaParaExcluir = null;

/* =========================================================
 * MOCK DO ANDROID (só para testar no navegador)
 * ========================================================= */
if (typeof Android === "undefined") {
    // "Banco" em memória só para o navegador
    let mockDb = [];
    let nextId = 1;

    window.Android = {
        listar: function () {
            return JSON.stringify(mockDb);
        },

        salvar: function (codigoProduto, pdv, descricao, valorOriginal, quantidade, valorPromocional, divergencia, motivo) {
            const id = nextId++;
            mockDb.push({
                id,
                codigoProduto,
                pdv,
                descricao,
                valorOriginal,
                quantidade,
                valorPromocional,
                divergencia,
                motivo,
                dataHora: Date.now()
            });
            return id;
        },

        atualizar: function (id, codigoProduto, pdv, descricao, valorOriginal, quantidade, valorPromocional, divergencia, motivo) {
            const index = mockDb.findIndex(item => String(item.id) === String(id));
            if (index === -1) return 0;

            mockDb[index] = {
                ...mockDb[index],
                codigoProduto,
                pdv,
                descricao,
                valorOriginal,
                quantidade,
                valorPromocional,
                divergencia,
                motivo
            };
            return 1;
        },

        excluir: function (id) {
            const tamanhoAntes = mockDb.length;
            mockDb = mockDb.filter(item => String(item.id) !== String(id));
            return tamanhoAntes !== mockDb.length ? 1 : 0;
        }
    };

    console.log("Android mock ativo (modo navegador)");
}

/* =========================================================
 * MOEDA
 * ========================================================= */

function moedaParaCentavos(valor) {
    if (!valor) {
        return 0;
    }

    const numero = parseFloat(
        valor
            .replace(/\./g, "")
            .replace(",", ".")
    );

    if (isNaN(numero)) {
        return 0;
    }

    return Math.round(numero * 100);
}


function centavosParaMoeda(valor) {
    return (Number(valor) / 100).toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL"
    });
}


/* =========================================================
 * DATA
 * ========================================================= */

function atualizarValorTotal() {
    const valorOriginal = moedaParaCentavos(valorOriginalInput.value);
    const quantidade = parseInt(quantidadeInput.value, 10) || 0;

    if (valorOriginal > 0 && quantidade > 0) {
        valorTotalInput.value = centavosParaMoeda(valorOriginal * quantidade)
            .replace("R$", "")
            .trim();
    } else {
        valorTotalInput.value = "";
    }
}

// Atualiza em tempo real
valorOriginalInput.addEventListener("input", atualizarValorTotal);
quantidadeInput.addEventListener("input", atualizarValorTotal);

function formatarData(timestamp) {
    const data = new Date(Number(timestamp));

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


/* =========================================================
 * CÁLCULO
 * ========================================================= */

function calcularDivergencia() {

    const valorOriginal =
        moedaParaCentavos(valorOriginalInput.value);

    const quantidade =
        parseInt(quantidadeInput.value, 10);

    const valorPromocional =
        moedaParaCentavos(valorPromocionalInput.value);


    if (
        valorOriginal <= 0 ||
        !quantidade ||
        quantidade <= 0 ||
        valorPromocional <= 0
    ) {
        return null;
    }


    const valorSemPromocao =
        valorOriginal * quantidade;

    const valorComPromocao =
        valorPromocional * quantidade;


    return valorSemPromocao - valorComPromocao;
}


/* =========================================================
 * CREATE
 * ========================================================= */

function salvarDivergencia() {
    const valorOriginal    = moedaParaCentavos(valorOriginalInput.value);
    const quantidade       = parseInt(quantidadeInput.value, 10);
    const valorPromocional = moedaParaCentavos(valorPromocionalInput.value);
    const divergencia      = calcularDivergencia();

    if (valorOriginal <= 0 || !quantidade || quantidade <= 0 || valorPromocional <= 0 || divergencia === null) {
        alert("Preencha todos os campos obrigatórios corretamente.");
        return;
    }

    const codigoProduto = valorOuTraco(codigoProdutoInput?.value);
    const pdv           = valorOuTraco(pdvInput?.value);
    const descricao     = valorOuTraco(descricaoInput?.value);
    const motivo        = valorOuTraco(motivoInput?.value);

    const id = Android.salvar(
        codigoProduto,
        pdv,
        descricao,
        valorOriginal,
        quantidade,
        valorPromocional,
        divergencia,
        motivo
    );

    if (Number(id) > 0) {
        resultado.textContent = centavosParaMoeda(divergencia);
        limparFormulario();
        carregarHistorico();
    } else {
        alert("Não foi possível salvar a divergência.");
    }
}


/* =========================================================
 * UPDATE
 * ========================================================= */

function atualizarDivergencia() {
    const valorOriginal    = moedaParaCentavos(valorOriginalInput.value);
    const quantidade       = parseInt(quantidadeInput.value, 10);
    const valorPromocional = moedaParaCentavos(valorPromocionalInput.value);
    const divergencia      = calcularDivergencia();

    if (valorOriginal <= 0 || !quantidade || quantidade <= 0 || valorPromocional <= 0 || divergencia === null) {
        alert("Preencha todos os campos obrigatórios corretamente.");
        return;
    }

    const codigoProduto = valorOuTraco(codigoProdutoInput?.value);
    const pdv           = valorOuTraco(pdvInput?.value);
    const descricao     = valorOuTraco(descricaoInput?.value);
    const motivo        = valorOuTraco(motivoInput?.value);

    const resultadoUpdate = Android.atualizar(
        String(divergenciaEditando),
        codigoProduto,
        pdv,
        descricao,
        valorOriginal,
        quantidade,
        valorPromocional,
        divergencia,
        motivo
    );

    if (Number(resultadoUpdate) > 0) {
        resultado.textContent = centavosParaMoeda(divergencia);
        divergenciaEditando = null;
        botaoSubmit.textContent = "Calcular divergência";
        limparFormulario();
        carregarHistorico();
    } else {
        alert("Não foi possível atualizar a divergência.");
    }
}


/* =========================================================
 * READ
 * ========================================================= */

function carregarHistorico() {
    const json = Android.listar();

    divergencias = JSON.parse(json);

    renderizarHistorico();
}

function renderizarHistorico() {
    if (divergencias.length === 0) {
        historico.innerHTML = `
            <div class="text-muted text-center py-3">
                Nenhuma divergência registrada.
            </div>
        `;
        return;
    }

    historico.innerHTML = divergencias.map(item => `
        <div class="card mb-3">
            <div class="card-body">

                <div class="d-flex justify-content-between align-items-start">
                    <div>
                        <strong>
                            ${centavosParaMoeda(item.divergencia)}
                        </strong>

                        <div class="text-muted small mt-1">
                            ${formatarData(item.dataHora)}
                        </div>
                    </div>

                    <div class="btn-group">
                        <button
                            type="button"
                            class="btn btn-outline-primary btn-sm"
                            onclick="editarDivergencia('${item.id}')"
                        >
                            Editar
                        </button>

                        <button
                            type="button"
                            class="btn btn-outline-danger btn-sm"
                            onclick="excluirDivergencia('${item.id}')"
                        >
                            Excluir
                        </button>
                    </div>
                </div>

                <hr>

                <div class="small">
                    <div>
                        <strong>Original:</strong>
                        ${centavosParaMoeda(item.valorOriginal)}
                    </div>

                    <div>
                        <strong>Quantidade:</strong>
                        ${item.quantidade}
                    </div>

                    <div>
                        <strong>Promocional:</strong>
                        ${centavosParaMoeda(item.valorPromocional)}
                    </div>
                </div>

            </div>
        </div>
    `).join("");
}


/* =========================================================
 * EDIT
 * ========================================================= */

function editarDivergencia(id) {
    let lista;
    try {
        lista = JSON.parse(Android.listar());
    } catch (error) {
        console.error(error);
        alert("Não foi possível carregar a divergência.");
        return;
    }

    const item = lista.find(d => String(d.id) === String(id));
    if (!item) {
        alert("Divergência não encontrada.");
        return;
    }

    divergenciaEditando = String(item.id);

    if (codigoProdutoInput) codigoProdutoInput.value = item.codigoProduto === "--" ? "" : (item.codigoProduto || "");
    if (pdvInput)           pdvInput.value           = item.pdv === "--" ? "" : (item.pdv || "");
    if (descricaoInput)     descricaoInput.value     = item.descricao === "--" ? "" : (item.descricao || "");
    if (motivoInput)        motivoInput.value        = item.motivo === "--" ? "" : (item.motivo || "");

    valorOriginalInput.value = (Number(item.valorOriginal) / 100).toFixed(2).replace(".", ",");
    quantidadeInput.value    = item.quantidade;
    valorPromocionalInput.value = (Number(item.valorPromocional) / 100).toFixed(2).replace(".", ",");

    resultado.textContent = centavosParaMoeda(item.divergencia);
    botaoSubmit.textContent = "Salvar alterações";

    // Atualiza o valor total se existir
    if (typeof atualizarValorTotal === "function") {
        atualizarValorTotal();
    }

    window.scrollTo({ top: 0, behavior: "smooth" });
}


/* =========================================================
 * DELETE
 * ========================================================= */

function excluirDivergencia(id) {

    divergenciaParaExcluir = String(id);

    modalConfirmarExclusao.show();
}

function confirmarExclusao() {

    if (divergenciaParaExcluir === null) {
        return;
    }

    const idTexto =
        String(divergenciaParaExcluir);

    const resultadoDelete =
        Android.excluir(idTexto);


    if (Number(resultadoDelete) === 1) {

        divergencias =
            divergencias.filter(
                item =>
                    String(item.id) !== idTexto
            );

        renderizarHistorico();

    } else {

        alert(
            "Não foi possível excluir a divergência."
        );
    }


    divergenciaParaExcluir = null;

    modalConfirmarExclusao.hide();
}


/* =========================================================
 * FORMULÁRIO
 * ========================================================= */

function limparFormulario() {
    if (codigoProdutoInput) codigoProdutoInput.value = "";
    if (pdvInput)           pdvInput.value = "";
    if (descricaoInput)     descricaoInput.value = "";
    if (motivoInput)        motivoInput.value = "";
    if (valorTotalInput)    valorTotalInput.value = "";

    valorOriginalInput.value = "";
    quantidadeInput.value = "";
    valorPromocionalInput.value = "";
}

/* =========================================================
 * CONFIGURAÇÕES DA INTERFACE (localStorage)
 * ========================================================= */

function aplicarConfiguracoesInterface() {
    const raw = localStorage.getItem("divergencias_config");
    if (!raw) return;

    try {
        const config = JSON.parse(raw).interface;

        const mostrar = (id, visivel) => {
            const el = document.getElementById(id);
            if (el) el.style.display = visivel ? "" : "none";
        };

        mostrar("campoCodigoProduto", config.codigoProduto);
        mostrar("campoPdv",           config.pdv);
        mostrar("campoDescricao",     config.descricao);
        mostrar("campoValorTotal",    config.valorTotal);
        mostrar("campoMotivo",        config.motivo);

    } catch (e) {
        console.error("Erro ao aplicar configurações:", e);
    }
}


/* =========================================================
 * SUBMIT
 * ========================================================= */

form.addEventListener(
    "submit",
    function(event) {

        event.preventDefault();


        if (
            divergenciaEditando !== null
        ) {

            atualizarDivergencia();

        } else {

            salvarDivergencia();

        }
    }
);

botaoConfirmarExclusao.addEventListener(
    "click",
    function() {

        confirmarExclusao();

    }
);


/* =========================================================
 * INICIALIZAÇÃO
 * ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    function() {

        carregarHistorico();
        aplicarConfiguracoesInterface();
    }
);