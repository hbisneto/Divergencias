const form = document.getElementById("formDivergencia");
const resultado = document.getElementById("resultado");
const historico = document.getElementById("historico");

const valorOriginalInput =
    document.getElementById("valorOriginal");

const quantidadeInput =
    document.getElementById("quantidade");

const valorPromocionalInput =
    document.getElementById("valorPromocional");

const botaoSubmit =
    form.querySelector("button[type='submit']");


const modalConfirmarExclusaoElement =
    document.getElementById("modalConfirmarExclusao");

const botaoConfirmarExclusao =
    document.getElementById("confirmarExclusao");

const modalConfirmarExclusao =
    new bootstrap.Modal(
        modalConfirmarExclusaoElement
    );


let divergencias = [];
let divergenciaEditando = null;
let divergenciaParaExcluir = null;

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

function formatarData(timestamp) {
    const data = new Date(Number(timestamp));

    return data.toLocaleString("pt-BR", {
        dateStyle: "short",
        timeStyle: "short"
    });
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

    const valorOriginal =
        moedaParaCentavos(valorOriginalInput.value);

    const quantidade =
        parseInt(quantidadeInput.value, 10);

    const valorPromocional =
        moedaParaCentavos(valorPromocionalInput.value);

    const divergencia =
        calcularDivergencia();


    if (
        valorOriginal <= 0 ||
        !quantidade ||
        quantidade <= 0 ||
        valorPromocional <= 0 ||
        divergencia === null
    ) {
        alert("Preencha todos os campos corretamente.");
        return;
    }


    const id = Android.salvar(
        valorOriginal,
        quantidade,
        valorPromocional,
        divergencia
    );


    console.log(
        "Registro salvo. ID:",
        id
    );


    if (Number(id) > 0) {

        resultado.textContent =
            centavosParaMoeda(divergencia);

        limparFormulario();

        carregarHistorico();

    } else {

        alert(
            "Não foi possível salvar a divergência."
        );
    }
}


/* =========================================================
 * UPDATE
 * ========================================================= */

function atualizarDivergencia() {

    const valorOriginal =
        moedaParaCentavos(valorOriginalInput.value);

    const quantidade =
        parseInt(quantidadeInput.value, 10);

    const valorPromocional =
        moedaParaCentavos(valorPromocionalInput.value);

    const divergencia =
        calcularDivergencia();


    if (
        valorOriginal <= 0 ||
        !quantidade ||
        quantidade <= 0 ||
        valorPromocional <= 0 ||
        divergencia === null
    ) {
        alert("Preencha todos os campos corretamente.");
        return;
    }


    const resultadoUpdate =
        Android.atualizar(
            String(divergenciaEditando),
            valorOriginal,
            quantidade,
            valorPromocional,
            divergencia
        );


    console.log(
        "Resultado UPDATE:",
        resultadoUpdate
    );


    if (Number(resultadoUpdate) > 0) {

        resultado.textContent =
            centavosParaMoeda(divergencia);

        divergenciaEditando = null;

        botaoSubmit.textContent =
            "Calcular divergência";

        limparFormulario();

        carregarHistorico();

    } else {

        alert(
            "Não foi possível atualizar a divergência."
        );
    }
}


/* =========================================================
 * READ
 * ========================================================= */

// function carregarHistorico() {

//     const historico =
//         document.getElementById("historico");


//     let json;

//     try {

//         json = Android.listar();

//     } catch (error) {

//         console.error(
//             "Erro ao acessar SQLite:",
//             error
//         );

//         historico.innerHTML = `
//             <div class="alert alert-danger">
//                 Não foi possível carregar o histórico.
//             </div>
//         `;

//         return;
//     }


//     let divergencias;

//     try {

//         divergencias =
//             JSON.parse(json);

//     } catch (error) {

//         console.error(
//             "JSON inválido:",
//             json
//         );

//         console.error(error);

//         return;
//     }


//     historico.innerHTML = "";


//     if (
//         !Array.isArray(divergencias) ||
//         divergencias.length === 0
//     ) {

//         historico.innerHTML = `
//             <div class="text-muted text-center py-3">
//                 Nenhuma divergência registrada.
//             </div>
//         `;

//         return;
//     }


//     divergencias.forEach(function(item) {

//         const card =
//             document.createElement("div");


//         card.className =
//             "card mb-3";


//         card.innerHTML = `

//             <div class="card-body">

//                 <div
//                     class="d-flex
//                            justify-content-between
//                            align-items-center
//                            mb-3"
//                 >

//                     <strong>
//                         Divergência #${item.id}
//                     </strong>

//                     <small class="text-muted">
//                         ${formatarData(item.dataHora)}
//                     </small>

//                 </div>


//                 <div class="row">

//                     <div class="col-md-6 mb-2">

//                         <strong>
//                             Valor original:
//                         </strong>

//                         <br>

//                         ${centavosParaMoeda(
//                             item.valorOriginal
//                         )}

//                     </div>


//                     <div class="col-md-6 mb-2">

//                         <strong>
//                             Quantidade:
//                         </strong>

//                         <br>

//                         ${item.quantidade}

//                     </div>


//                     <div class="col-md-6 mb-2">

//                         <strong>
//                             Valor promocional:
//                         </strong>

//                         <br>

//                         ${centavosParaMoeda(
//                             item.valorPromocional
//                         )}

//                     </div>


//                     <div class="col-md-6 mb-2">

//                         <strong>
//                             Divergência:
//                         </strong>

//                         <br>

//                         <span class="text-danger fw-bold">

//                             ${centavosParaMoeda(
//                                 item.divergencia
//                             )}

//                         </span>

//                     </div>

//                 </div>


//                 <hr>


//                 <div class="d-flex gap-2">

//                     <button
//                         type="button"
//                         class="btn btn-outline-primary btn-sm"
//                         onclick="editarDivergencia('${item.id}')"
//                     >
//                         Editar
//                     </button>


//                     <button
//                         type="button"
//                         class="btn btn-outline-danger btn-sm"
//                         onclick="excluirDivergencia('${item.id}')"
//                     >
//                         Excluir
//                     </button>

//                 </div>

//             </div>
//         `;


//         historico.appendChild(card);
//     });
// }

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

    let divergencias;


    try {

        divergencias =
            JSON.parse(Android.listar());

    } catch (error) {

        console.error(error);

        alert(
            "Não foi possível carregar a divergência."
        );

        return;
    }


    const item =
        divergencias.find(function(d) {

            return String(d.id) === String(id);

        });


    if (!item) {

        alert(
            "Divergência não encontrada."
        );

        return;
    }


    divergenciaEditando =
        String(item.id);


    valorOriginalInput.value =
        (Number(item.valorOriginal) / 100)
            .toFixed(2)
            .replace(".", ",");


    quantidadeInput.value =
        item.quantidade;


    valorPromocionalInput.value =
        (Number(item.valorPromocional) / 100)
            .toFixed(2)
            .replace(".", ",");


    resultado.textContent =
        centavosParaMoeda(
            item.divergencia
        );


    botaoSubmit.textContent =
        "Salvar alterações";


    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
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

    valorOriginalInput.value = "";

    quantidadeInput.value = "";

    valorPromocionalInput.value = "";
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

    }
);