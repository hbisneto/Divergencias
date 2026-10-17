"use strict";

/* =========================================================
   CONFIGURAÇÕES
   ========================================================= */

const CHAVE_ESCALAS = "divergencias_escalas_funcionarios_v1";

const MAX_DIAS = 14;
const MAX_FUNCIONARIOS = 100;

const dataInicialInput = document.getElementById("dataInicial");
const dataFinalInput = document.getElementById("dataFinal");

const listaFuncionarios = document.getElementById("listaFuncionarios");
const periodoInfo = document.getElementById("periodoInfo");
const resumoEscala = document.getElementById("resumoEscala");
const escalasSalvas = document.getElementById("escalasSalvas");
const mensagemEscala = document.getElementById("mensagemEscala");

const botaoAdicionar = document.getElementById("adicionarFuncionario");
const botaoSalvar = document.getElementById("salvarEscala");
const botaoLimpar = document.getElementById("limparEscala");
const botaoGerarImagem = document.getElementById("gerarImagem");


/* =========================================================
   ESTADO
   ========================================================= */

let funcionarios = [];
let proximoId = 1;
let escalaEditandoId = null;

const modalConfirmacaoElemento = document.getElementById(
    "modalConfirmacaoEscala"
);

const modalConfirmacao = new bootstrap.Modal(
    modalConfirmacaoElemento
);

const mensagemConfirmacao = document.getElementById(
    "mensagemConfirmacaoEscala"
);

const botaoConfirmarAcao = document.getElementById(
    "confirmarAcaoEscala"
);

let acaoConfirmacaoPendente = null;


function solicitarConfirmacao(mensagem, acao) {
    mensagemConfirmacao.textContent = mensagem;

    acaoConfirmacaoPendente = acao;

    modalConfirmacao.show();
}


botaoConfirmarAcao.addEventListener("click", () => {
    const acao = acaoConfirmacaoPendente;

    acaoConfirmacaoPendente = null;

    modalConfirmacao.hide();

    if (typeof acao === "function") {
        acao();
    }
});


modalConfirmacaoElemento.addEventListener(
    "hidden.bs.modal",
    () => {
        acaoConfirmacaoPendente = null;
    }
);


/* =========================================================
   DATA LOCAL
   Evita diferenças de fuso horário ao gerar as datas.
   ========================================================= */

function dataLocalISO(data) {
    const ano = data.getFullYear();

    const mes = String(data.getMonth() + 1).padStart(2, "0");

    const dia = String(data.getDate()).padStart(2, "0");

    return `${ano}-${mes}-${dia}`;
}


function dataDeISO(valor) {
    const partes = valor.split("-").map(Number);

    if (partes.length !== 3 || partes.some(Number.isNaN)) {
        return null;
    }

    const [ano, mes, dia] = partes;

    const data = new Date(ano, mes - 1, dia);

    if (
        data.getFullYear() !== ano ||
        data.getMonth() !== mes - 1 ||
        data.getDate() !== dia
    ) {
        return null;
    }

    return data;
}


function formatarData(valor, incluirDiaSemana = false) {
    const data = dataDeISO(valor);

    if (!data) {
        return valor;
    }

    const opcoes = incluirDiaSemana
        ? {
            weekday: "short",
            day: "2-digit",
            month: "2-digit"
        }
        : {
            day: "2-digit",
            month: "2-digit",
            year: "numeric"
        };

    return data.toLocaleDateString("pt-BR", opcoes);
}


function obterDatas() {
    const inicio = dataInicialInput.value;
    const fim = dataFinalInput.value;

    if (!inicio || !fim) {
        return [];
    }

    const dataInicio = dataDeISO(inicio);
    const dataFim = dataDeISO(fim);

    if (!dataInicio || !dataFim) {
        return [];
    }

    if (dataFim < dataInicio) {
        return [];
    }

    const diferenca =
        Math.round((dataFim - dataInicio) / 86400000);

    if (diferenca + 1 > MAX_DIAS) {
        return [];
    }

    const datas = [];

    const cursor = new Date(
        dataInicio.getFullYear(),
        dataInicio.getMonth(),
        dataInicio.getDate()
    );

    while (cursor <= dataFim) {
        datas.push(dataLocalISO(cursor));

        cursor.setDate(cursor.getDate() + 1);
    }

    return datas;
}


/* =========================================================
   MENSAGENS
   ========================================================= */

function mostrarMensagem(texto, tipo = "success") {
    mensagemEscala.textContent = texto;

    mensagemEscala.className =
        `alert alert-${tipo} mt-4`;

    mensagemEscala.scrollIntoView({
        behavior: "smooth",
        block: "nearest"
    });
}


function limparMensagem() {
    mensagemEscala.textContent = "";
    mensagemEscala.className = "alert d-none mt-4";
}


/* =========================================================
   VALIDAÇÃO DO PERÍODO
   ========================================================= */

function validarPeriodo(mostrarErro = false) {
    const inicio = dataInicialInput.value;
    const fim = dataFinalInput.value;

    if (!inicio || !fim) {
        periodoInfo.textContent =
            "Selecione as datas inicial e final.";

        if (mostrarErro) {
            mostrarMensagem(
                "Informe a data inicial e a data final.",
                "warning"
            );
        }

        return false;
    }

    const dataInicio = dataDeISO(inicio);
    const dataFim = dataDeISO(fim);

    if (!dataInicio || !dataFim) {
        periodoInfo.textContent = "Informe datas válidas.";

                if (mostrarErro) {
            mostrarMensagem(
                "Uma das datas informadas é inválida.",
                "warning"
            );
        }

        return false;
    }

    if (dataFim < dataInicio) {
        periodoInfo.textContent =
            "A data final precisa ser igual ou posterior à inicial.";

        if (mostrarErro) {
            mostrarMensagem(
                "A data final não pode ser anterior à data inicial.",
                "warning"
            );
        }

        return false;
    }

    const diferenca =
        Math.round((dataFim - dataInicio) / 86400000) + 1;

    if (diferenca > MAX_DIAS) {
        periodoInfo.textContent =
            `O período máximo é de ${MAX_DIAS} dias.`;

        if (mostrarErro) {
            mostrarMensagem(
                `Selecione no máximo ${MAX_DIAS} dias.`,
                "warning"
            );
        }

        return false;
    }

    periodoInfo.textContent =
        `${diferenca} dia(s) selecionado(s).`;

    return true;
}


/* =========================================================
   FUNCIONÁRIOS
   ========================================================= */

function criarFuncionario(nome = "") {
    return {
        id: proximoId++,
        nome,

        // Horários específicos de cada data.
        horarios: {},

        // Configuração do período intermediário.
        intermediario: false,
        dataInicioInter: "",
        diasInter: [],

        entradaInter: "09:00",
        saidaInter: "17:20"
    };
}


function adicionarFuncionario(nome = "") {
    if (!validarPeriodo(true)) {
        return;
    }

    if (funcionarios.length >= MAX_FUNCIONARIOS) {
        mostrarMensagem(
            `O limite é de ${MAX_FUNCIONARIOS} funcionários.`,
            "warning"
        );

        return;
    }

    funcionarios.push(criarFuncionario(nome));

    renderizarFuncionarios();
    atualizarResumo();

    const ultimoCampo = listaFuncionarios.querySelector(
        ".funcionario-nome"
    );

    if (ultimoCampo) {
        ultimoCampo.focus();
    }
}


function removerFuncionario(id) {
    funcionarios = funcionarios.filter(
        funcionario => funcionario.id !== id
    );

    renderizarFuncionarios();
    atualizarResumo();

    limparMensagem();
}


/* =========================================================
   ELEMENTOS HTML
   ========================================================= */

function criarElemento(tag, classe, texto = "") {
    const elemento = document.createElement(tag);

    if (classe) {
        elemento.className = classe;
    }

    elemento.textContent = texto;

    return elemento;
}


/* =========================================================
   RENDERIZAÇÃO DOS FUNCIONÁRIOS
   ========================================================= */

function renderizarFuncionarios() {
    const datas = obterDatas();

    listaFuncionarios.replaceChildren();

    if (datas.length === 0) {
        listaFuncionarios.appendChild(
            criarElemento(
                "div",
                "text-muted text-center py-3",
                "Selecione um período válido."
            )
        );

        atualizarResumo();
        return;
    }

    funcionarios.forEach((funcionario, indice) => {
        // Mantém os dias de Inter sincronizados com o período atual
        recalcularDiasInter(funcionario, datas);

        const card = criarElemento("div", "funcionario-card");

        // ---------- Cabeçalho ----------
        const cabecalho = criarElemento("div", "funcionario-cabecalho");

        const titulo = criarElemento(
            "h6",
            "funcionario-titulo",
            `Funcionário ${indice + 1}`
        );

        const botaoRemover = criarElemento(
            "button",
            "btn btn-outline-danger btn-sm",
            "Remover"
        );
        botaoRemover.type = "button";
        botaoRemover.addEventListener("click", () => {
            removerFuncionario(funcionario.id);
        });

        cabecalho.append(titulo, botaoRemover);

        // ---------- Campos principais ----------
        const campos = criarElemento("div", "funcionario-campos");

        // Nome
        const grupoNome = criarElemento("div", "funcionario-nome");

        const labelNome = criarElemento(
            "label",
            "form-label",
            "Nome do funcionário"
        );
        labelNome.htmlFor = `funcionario-${funcionario.id}`;

        const inputNome = criarElemento("input", "form-control");
        inputNome.type = "text";
        inputNome.id = `funcionario-${funcionario.id}`;
        inputNome.placeholder = "Ex.: Maria";
        inputNome.maxLength = 80;
        inputNome.value = funcionario.nome;

        inputNome.addEventListener("input", () => {
            funcionario.nome = inputNome.value;
            atualizarResumo();
        });

        grupoNome.append(labelNome, inputNome);

        // ---------- Configuração do Inter ----------
        const interConfiguracao = criarElemento("div", "inter-configuracao");

        const interLabel = criarElemento("label", "inter-checkbox");
        const interCheckbox = criarElemento("input", "");
        interCheckbox.type = "checkbox";
        interCheckbox.checked = funcionario.intermediario;

        const interTexto = criarElemento(
            "span",
            "",
            "Trabalha no intermediário (Inter)"
        );
        interLabel.append(interCheckbox, interTexto);

        const interCampos = criarElemento("div", "inter-campos");
        interCampos.hidden = !funcionario.intermediario;

        // Data de início
        const grupoDataInicio = criarElemento("div", "inter-grupo");
        const labelDataInicio = criarElemento("label", "", "Começa o Inter em");
        labelDataInicio.htmlFor = `inter-inicio-${funcionario.id}`;

        const dataInicio = criarElemento("input", "form-control");
        dataInicio.type = "date";
        dataInicio.id = `inter-inicio-${funcionario.id}`;
        dataInicio.min = datas[0] || "";
        dataInicio.max = datas[datas.length - 1] || "";
        dataInicio.value = funcionario.dataInicioInter || "";

        dataInicio.addEventListener("change", () => {
            funcionario.dataInicioInter = dataInicio.value;
            recalcularDiasInter(funcionario, datas);
            renderizarFuncionarios();
            atualizarResumo();
        });

        grupoDataInicio.append(labelDataInicio, dataInicio);

        // Quantidade de dias (1 a 4)
        const grupoQtd = criarElemento("div", "inter-grupo");
        const labelQtd = criarElemento("label", "", "Quantidade de dias de Inter");
        labelQtd.htmlFor = `inter-qtd-${funcionario.id}`;

        const selectQtd = criarElemento("select", "form-select");
        selectQtd.id = `inter-qtd-${funcionario.id}`;

        [1, 2, 3, 4].forEach((n) => {
            const opt = document.createElement("option");
            opt.value = String(n);
            opt.textContent = n === 1 ? "1 dia" : `${n} dias`;
            if (n === (funcionario.quantidadeDiasInter || 2)) {
                opt.selected = true;
            }
            selectQtd.appendChild(opt);
        });

        selectQtd.addEventListener("change", () => {
            funcionario.quantidadeDiasInter = Number(selectQtd.value);
            recalcularDiasInter(funcionario, datas);
            renderizarFuncionarios();
            atualizarResumo();
        });

        grupoQtd.append(labelQtd, selectQtd);

        // Entrada Inter
        const grupoEntrada = criarElemento("div", "inter-grupo");
        const labelEntrada = criarElemento("label", "", "Entrada Inter");
        labelEntrada.htmlFor = `inter-entrada-${funcionario.id}`;

        const inputEntrada = criarElemento("input", "form-control");
        inputEntrada.type = "time";
        inputEntrada.id = `inter-entrada-${funcionario.id}`;
        inputEntrada.value = funcionario.entradaInter || "09:00";

        inputEntrada.addEventListener("change", () => {
            funcionario.entradaInter = inputEntrada.value;
            atualizarResumo();
        });

        grupoEntrada.append(labelEntrada, inputEntrada);

        // Saída Inter
        const grupoSaida = criarElemento("div", "inter-grupo");
        const labelSaida = criarElemento("label", "", "Saída Inter");
        labelSaida.htmlFor = `inter-saida-${funcionario.id}`;

        const inputSaida = criarElemento("input", "form-control");
        inputSaida.type = "time";
        inputSaida.id = `inter-saida-${funcionario.id}`;
        inputSaida.value = funcionario.saidaInter || "17:20";

        inputSaida.addEventListener("change", () => {
            funcionario.saidaInter = inputSaida.value;
            atualizarResumo();
        });

        grupoSaida.append(labelSaida, inputSaida);

        interCampos.append(
            grupoDataInicio,
            grupoQtd,
            grupoEntrada,
            grupoSaida
        );

        // Texto de ajuda
        const ajuda = criarElemento("div", "inter-ajuda");
        if (funcionario.intermediario && funcionario.diasInter.length > 0) {
            const listaDias = funcionario.diasInter
                .map((d) => formatarData(d, true))
                .join(", ");
            ajuda.textContent =
                `Dias de Inter: ${listaDias}. ` +
                "Nesses dias, se o horário estiver em branco, a imagem usará o Inter automaticamente.";
        } else if (funcionario.intermediario) {
            ajuda.textContent =
                "Escolha a data de início e a quantidade de dias (1 a 4). O Inter não é aplicado à semana inteira.";
        }

        interCheckbox.addEventListener("change", () => {
            funcionario.intermediario = interCheckbox.checked;

            if (funcionario.intermediario) {
                if (!funcionario.dataInicioInter) {
                    funcionario.dataInicioInter = datas[0] || "";
                }
                if (!funcionario.quantidadeDiasInter) {
                    funcionario.quantidadeDiasInter = 2;
                }
            } else {
                funcionario.diasInter = [];
            }

            recalcularDiasInter(funcionario, datas);
            renderizarFuncionarios();
            atualizarResumo();
        });

        interConfiguracao.append(interLabel, interCampos, ajuda);

        // ---------- Horários por dia ----------
        const grupoHorarios = criarElemento("div", "funcionario-horarios");

        datas.forEach((data) => {
            const dia = criarElemento("div", "horario-dia");

            const ehDiaInter =
                funcionario.intermediario &&
                Array.isArray(funcionario.diasInter) &&
                funcionario.diasInter.includes(data);

            if (ehDiaInter) {
                dia.classList.add("horario-dia-inter");
            }

            const labelDia = criarElemento(
                "label",
                "",
                formatarData(data, true)
            );

            if (ehDiaInter) {
                const badge = criarElemento("span", "badge-inter", " INTER");
                labelDia.appendChild(badge);
            }

            const inputHorario = criarElemento("input", "form-control");
            inputHorario.type = "text";
            inputHorario.placeholder = ehDiaInter
                ? `Inter ${funcionario.entradaInter}–${funcionario.saidaInter}`
                : "Ex.: 08:00–16:20 ou Folga";
            inputHorario.maxLength = 40;
            inputHorario.value = funcionario.horarios[data] || "";

            inputHorario.addEventListener("input", () => {
                funcionario.horarios[data] = inputHorario.value;
                atualizarResumo();
            });

            const botaoFolga = criarElemento(
                "button",
                "btn btn-outline-secondary btn-sm btn-folga",
                "Folga"
            );
            botaoFolga.type = "button";

            botaoFolga.addEventListener("click", () => {
                inputHorario.value = "Folga";
                funcionario.horarios[data] = "Folga";
                atualizarResumo();
            });

            dia.append(labelDia, inputHorario, botaoFolga);
            grupoHorarios.appendChild(dia);
        });

        // Montagem final
        campos.append(grupoNome, interConfiguracao, grupoHorarios);
        card.append(cabecalho, campos);
        listaFuncionarios.appendChild(card);
    });

    atualizarResumo();
}


/* =========================================================
   PRÉ-VISUALIZAÇÃO TEXTUAL
   ========================================================= */

function atualizarResumo() {
    const datas = obterDatas();

    resumoEscala.replaceChildren();

    if (datas.length === 0) {
        resumoEscala.textContent =
            "Nenhuma escala montada.";

        return;
    }

    const titulo = criarElemento(
        "div",
        "resumo-titulo",
        "Escala de Funcionários"
    );

    const periodo = criarElemento(
        "div",
        "resumo-periodo",
        `${formatarData(datas[0])} a ${formatarData(datas[datas.length - 1])}`
    );

    const quantidade = criarElemento(
        "div",
        "resumo-quantidade",
        `${funcionarios.length} funcionário(s) · ${datas.length} dia(s)`
    );

    resumoEscala.append(
        titulo,
        periodo,
        quantidade
    );
}


/* =========================================================
   SERIALIZAÇÃO
   ========================================================= */

function criarDadosEscala() {
    return {
        id: escalaEditandoId || (
            "escala-" + Date.now() + "-" +
            Math.random().toString(36).slice(2, 8)
        ),

        dataInicial: dataInicialInput.value,

        dataFinal: dataFinalInput.value,

        funcionarios: funcionarios.map(funcionario => ({
            nome: funcionario.nome.trim(),

            horarios: {
                ...funcionario.horarios
            },

            intermediario: funcionario.intermediario,

            entradaInter: funcionario.entradaInter,

            saidaInter: funcionario.saidaInter
        })),

        atualizadoEm: new Date().toISOString()
    };
}


function validarEscala() {
    if (!validarPeriodo(true)) {
        return false;
    }

    if (funcionarios.length === 0) {
        mostrarMensagem(
            "Adicione pelo menos um funcionário.",
            "warning"
        );

        return false;
    }

    const nomes = funcionarios.map(
        funcionario => funcionario.nome.trim()
    );

    if (nomes.some(nome => nome.length === 0)) {
        mostrarMensagem(
            "Preencha o nome de todos os funcionários.",
            "warning"
        );

        return false;
    }

    for (const funcionario of funcionarios) {
        if (!funcionario.intermediario) {
            continue;
        }

        if (
            !funcionario.entradaInter ||
            !funcionario.saidaInter
        ) {
            mostrarMensagem(
                `Preencha a entrada e a saída do Inter para ${funcionario.nome}.`,
                "warning"
            );

            return false;
        }

        if (funcionario.entradaInter === funcionario.saidaInter) {
            mostrarMensagem(
                `A entrada e a saída do Inter não podem ser iguais para ${funcionario.nome}.`,
                "warning"
            );

            return false;
        }
    }

    const nomesNormalizados = nomes.map(
        nome => nome.toLocaleLowerCase("pt-BR")
    );

    if (new Set(nomesNormalizados).size !== nomesNormalizados.length) {
        mostrarMensagem(
            "Existem funcionários com nomes repetidos.",
            "warning"
        );

        return false;
    }

    return true;
}


/* =========================================================
   ARMAZENAMENTO LOCAL
   ========================================================= */

function carregarTodasEscalas() {
    try {
        const texto = localStorage.getItem(CHAVE_ESCALAS);

        if (!texto) {
            return [];
        }

        const dados = JSON.parse(texto);

        return Array.isArray(dados) ? dados : [];

    } catch (erro) {
        console.error(
            "Erro ao carregar escalas:",
            erro
        );

        return [];
    }
}


function gravarTodasEscalas(escalas) {
    try {
        localStorage.setItem(
            CHAVE_ESCALAS,
            JSON.stringify(escalas)
        );

        return true;

    } catch (erro) {
        console.error(
            "Erro ao salvar escalas:",
            erro
        );

        return false;
    }
}


function salvarEscala() {
    limparMensagem();

    if (!validarEscala()) {
        return;
    }

    const novaEscala = criarDadosEscala();

    const escalas = carregarTodasEscalas();

    const indice = escalas.findIndex(
        escala => String(escala.id) === String(novaEscala.id)
    );

    if (indice >= 0) {
        escalas[indice] = novaEscala;
    } else {
        escalas.unshift(novaEscala);
    }

    if (!gravarTodasEscalas(escalas)) {
        mostrarMensagem(
            "Não foi possível salvar. Verifique o espaço disponível no dispositivo.",
            "danger"
        );

        return;
    }

    escalaEditandoId = novaEscala.id;

    renderizarEscalasSalvas();

    mostrarMensagem(
        "Escala salva com sucesso no dispositivo.",
        "success"
    );
}


/* =========================================================
   LISTAGEM DE ESCALAS SALVAS
   ========================================================= */

function renderizarEscalasSalvas() {
    const escalas = carregarTodasEscalas();

    escalasSalvas.replaceChildren();

    if (escalas.length === 0) {
        escalasSalvas.appendChild(
            criarElemento(
                "div",
                "text-muted small",
                "Nenhuma escala salva."
            )
        );

        return;
    }

    escalas.forEach(escala => {
        const card = criarElemento(
            "div",
            "escala-salva"
        );

        const titulo = criarElemento(
            "div",
            "escala-salva-titulo",
            "Escala de Funcionários"
        );

        const periodo = criarElemento(
            "div",
            "escala-salva-periodo",
            `${formatarData(escala.dataInicial)} a ${formatarData(escala.dataFinal)}`
        );

        const quantidade = criarElemento(
            "div",
            "small text-muted mt-1",
            `${escala.funcionarios.length} funcionário(s)`
        );

        const acoes = criarElemento(
            "div",
            "escala-salva-acoes"
        );

        const botaoCarregar = criarElemento(
            "button",
            "btn btn-outline-primary btn-sm",
            "Abrir"
        );

        botaoCarregar.type = "button";

        botaoCarregar.addEventListener("click", () => {
            carregarEscala(escala.id);
        });

        const botaoExcluir = criarElemento(
            "button",
            "btn btn-outline-danger btn-sm",
            "Excluir"
        );

        botaoExcluir.type = "button";

        botaoExcluir.addEventListener("click", () => {
            excluirEscala(escala.id);
        });

        acoes.append(
            botaoCarregar,
            botaoExcluir
        );

        card.append(
            titulo,
            periodo,
            quantidade,
            acoes
        );

        escalasSalvas.appendChild(card);
    });
}


/* =========================================================
   CARREGAR ESCALA
   ========================================================= */

function carregarEscala(id) {
    const escalas = carregarTodasEscalas();

    const escala = escalas.find(
        item => String(item.id) === String(id)
    );

    if (!escala) {
        mostrarMensagem(
            "A escala selecionada não foi encontrada.",
            "warning"
        );

        return;
    }

    dataInicialInput.value = escala.dataInicial;
    dataFinalInput.value = escala.dataFinal;

    funcionarios = escala.funcionarios.map(funcionario => ({
        id: proximoId++,

        nome: funcionario.nome,

        horarios: {
            ...funcionario.horarios
        },

        // Compatibilidade com escalas salvas antes do Inter.
        intermediario: funcionario.intermediario === true,

        entradaInter: funcionario.entradaInter || "09:00",

        saidaInter: funcionario.saidaInter || "17:20"
    }));

    escalaEditandoId = escala.id;

    renderizarFuncionarios();

    mostrarMensagem(
        "Escala carregada. Você pode editar os dados e salvá-la novamente.",
        "info"
    );

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}


/* =========================================================
   EXCLUIR ESCALA
   ========================================================= */

function excluirEscala(id) {
    solicitarConfirmacao(
        "Deseja realmente excluir esta escala salva?",
        () => {
            const escalas = carregarTodasEscalas().filter(
                escala => String(escala.id) !== String(id)
            );

            if (!gravarTodasEscalas(escalas)) {
                mostrarMensagem(
                    "Não foi possível excluir a escala.",
                    "danger"
                );

                return;
            }

            if (String(escalaEditandoId) === String(id)) {
                escalaEditandoId = null;
            }

            renderizarEscalasSalvas();

            mostrarMensagem(
                "Escala excluída.",
                "success"
            );
        }
    );
}


/* =========================================================
   LIMPAR FORMULÁRIO
   ========================================================= */

function limparFormulario() {
    solicitarConfirmacao(
        "Deseja limpar o formulário atual? As alterações não salvas serão perdidas.",
        () => {
            funcionarios = [];

            escalaEditandoId = null;

            const hoje = new Date();

            const fim = new Date(hoje);

            fim.setDate(fim.getDate() + 6);

            dataInicialInput.value = dataLocalISO(hoje);

            dataFinalInput.value = dataLocalISO(fim);

            funcionarios = [
                criarFuncionario()
            ];

            renderizarFuncionarios();

            limparMensagem();
        }
    );
}


/* =========================================================
   GERAÇÃO DA IMAGEM
   Desenha a escala diretamente em um canvas.
   Não depende de bibliotecas externas.
   ========================================================= */

function gerarCanvasEscala(dados) {
    const datas = [];

    const inicio = dataDeISO(dados.dataInicial);
    const fim = dataDeISO(dados.dataFinal);

    if (!inicio || !fim) {
        throw new Error("O período da escala é inválido.");
    }

    const cursor = new Date(inicio);

    while (cursor <= fim) {
        datas.push(dataLocalISO(cursor));

        cursor.setDate(cursor.getDate() + 1);
    }

    if (datas.length === 0 || datas.length > MAX_DIAS) {
        throw new Error("O período da escala é inválido.");
    }

    // const largura = 1400;
    // const margem = 36;
    // const larguraNome = 260;
    // const larguraDia =
    //     (largura - margem * 2 - larguraNome) / datas.length;
    const margem = 36;
    const larguraNome = 260;
    // Reserva espaço suficiente para cada data.
    // A imagem aumenta de largura conforme o período.
    const larguraDia = 140;
    const largura = Math.max(
        1400,
        margem * 2 +
        larguraNome +
        datas.length * larguraDia
    );

    const alturaCabecalho = 175;

    const alturaLinha = 76;

    const alturaRodape = 100;

    const altura =
        margem +
        alturaCabecalho +
        dados.funcionarios.length * alturaLinha +
        alturaRodape;

    const canvas = document.createElement("canvas");

    canvas.width = largura;
    canvas.height = altura;

    const ctx = canvas.getContext("2d");

    if (!ctx) {
        throw new Error("Não foi possível criar a imagem.");
    }

    // Fundo

    ctx.fillStyle = "#f3f5f7";

    ctx.fillRect(0, 0, largura, altura);


    // Cabeçalho principal

    ctx.fillStyle = "#b6202f";

    ctx.fillRect(
        0,
        0,
        largura,
        margem + alturaCabecalho - 18
    );


    // Título

    ctx.fillStyle = "#ffffff";

    ctx.font = "bold 38px sans-serif";

    ctx.textAlign = "center";

    ctx.fillText(
        "ESCALA DE FUNCIONÁRIOS",
        largura / 2,
        65
    );


    // Período

    ctx.font = "22px sans-serif";

    ctx.fillText(
        `${formatarData(dados.dataInicial)} a ${formatarData(dados.dataFinal)}`,
        largura / 2,
        105
    );


    // Quantidade

    ctx.font = "17px sans-serif";

    ctx.fillText(
        `${dados.funcionarios.length} funcionário(s)`,
        largura / 2,
        137
    );


    // Tabela

    const tabelaX = margem;

    const tabelaY = margem + alturaCabecalho - 18;

    const larguraTabela = largura - margem * 2;


    // Cabeçalho da tabela

    ctx.fillStyle = "#263746";

    ctx.fillRect(
        tabelaX,
        tabelaY,
        larguraTabela,
        58
    );


    // Coluna funcionário

    ctx.textAlign = "left";

    ctx.fillStyle = "#ffffff";

    ctx.font = "bold 18px sans-serif";

    ctx.fillText(
        "FUNCIONÁRIO",
        tabelaX + 14,
        tabelaY + 35
    );


    // Colunas das datas

    datas.forEach((data, indice) => {
        const x =
            tabelaX +
            larguraNome +
            indice * larguraDia;

        const dataObj = dataDeISO(data);

        const diaSemana = dataObj
            .toLocaleDateString("pt-BR", {
                weekday: "short"
            })
            .replace(".", "")
            .toUpperCase();

        const diaMes = dataObj.toLocaleDateString(
            "pt-BR",
            {
                day: "2-digit",
                month: "2-digit"
            }
        );

        ctx.textAlign = "center";

        ctx.font = "bold 15px sans-serif";

        ctx.fillText(
            diaSemana,
            x + larguraDia / 2,
            tabelaY + 24
        );

        ctx.font = "14px sans-serif";

        ctx.fillText(
            diaMes,
            x + larguraDia / 2,
            tabelaY + 44
        );
    });


    // Linhas dos funcionários

    dados.funcionarios.forEach((funcionario, indiceFuncionario) => {
        const y =
            tabelaY +
            58 +
            indiceFuncionario * alturaLinha;

        // Fundo alternado

        ctx.fillStyle =
            indiceFuncionario % 2 === 0
                ? "#ffffff"
                : "#edf1f4";

        ctx.fillRect(
            tabelaX,
            y,
            larguraTabela,
            alturaLinha
        );


        // Nome

        ctx.fillStyle = "#263746";

        ctx.font = "bold 16px sans-serif";

        ctx.textAlign = "left";

        escreverTextoQuebrado(
            ctx,
            funcionario.nome,
            tabelaX + 14,
            y + 27,
            larguraNome - 24,
            20,
            2
        );


        // Horários por dia

        datas.forEach((data, indiceData) => {
            const x =
                tabelaX +
                larguraNome +
                indiceData * larguraDia;

            const horarioInformado =
                funcionario.horarios[data] || "";

            const normalizado =
                horarioInformado.trim().toLocaleLowerCase("pt-BR");

            const estaDeFolga =
                normalizado === "folga";

            // Se o campo do dia estiver vazio e o Inter estiver
            // ativado, utiliza os horários configurados.
            const ehInterAutomatico =
                funcionario.intermediario &&
                horarioInformado.trim() === "";

            let texto;

            if (estaDeFolga) {
                texto = "FOLGA";
            } else if (ehInterAutomatico) {
                texto =
                    `INTER\n${funcionario.entradaInter}–${funcionario.saidaInter}`;
            } else {
                texto = horarioInformado.trim() || "—";
            }


            // Cores das células
            if (estaDeFolga) {
                ctx.fillStyle = "#fde8e8";
            } else if (ehInterAutomatico) {
                // Intermediário: laranja em destaque.
                ctx.fillStyle = "#ffe0b2";
            } else if (horarioInformado.trim() === "") {
                ctx.fillStyle = "#f5f6f7";
            } else if (
                normalizado.includes("22:") ||
                normalizado.includes("noite")
            ) {
                ctx.fillStyle = "#e5e7fb";
            } else {
                ctx.fillStyle = "#e3f4e8";
            }

            ctx.fillRect(
                x + 2,
                y + 2,
                larguraDia - 4,
                alturaLinha - 4
            );


            // Texto da célula
            ctx.textAlign = "center";

            if (ehInterAutomatico) {
                // Rótulo INTER em destaque.
                ctx.fillStyle = "#9a4d00";

                ctx.font = "bold 15px sans-serif";

                ctx.fillText(
                    "INTER",
                    x + larguraDia / 2,
                    y + 25
                );

                ctx.font = "14px sans-serif";

                ctx.fillText(
                    `${funcionario.entradaInter}–${funcionario.saidaInter}`,
                    x + larguraDia / 2,
                    y + 48
                );

            } else {
                ctx.fillStyle = estaDeFolga
                    ? "#9b1c1c"
                    : "#263746";

                ctx.font = estaDeFolga
                    ? "bold 15px sans-serif"
                    : "14px sans-serif";

                escreverTextoQuebrado(
                    ctx,
                    texto,
                    x + larguraDia / 2,
                    y + 30,
                    larguraDia - 12,
                    18,
                    3,
                    "center"
                );
            }
        });


        // Separador horizontal

        ctx.strokeStyle = "#d5dce2";

        ctx.lineWidth = 1;

        ctx.beginPath();

        ctx.moveTo(
            tabelaX,
            y + alturaLinha
        );

        ctx.lineTo(
            tabelaX + larguraTabela,
            y + alturaLinha
        );

        ctx.stroke();
    });


    // Legenda dos períodos

    const legendaY =
        tabelaY +
        58 +
        dados.funcionarios.length * alturaLinha +
        18;

    const itensLegenda = [
        {
            cor: "#e3f4e8",
            texto: "Manhã"
        },
        {
            cor: "#ffe0b2",
            texto: "Inter"
        },
        {
            cor: "#e5e7fb",
            texto: "Noite"
        },
        {
            cor: "#fde8e8",
            texto: "Folga"
        }
    ];

    ctx.font = "14px sans-serif";
    ctx.textAlign = "left";

    const larguraItem = 150;

    const larguraLegenda =
        itensLegenda.length * larguraItem;

    const legendaInicioX =
        (largura - larguraLegenda) / 2;

    itensLegenda.forEach((item, indice) => {
        const x = legendaInicioX + indice * larguraItem;

        ctx.fillStyle = item.cor;

        ctx.fillRect(
            x,
            legendaY,
            20,
            20
        );

        ctx.fillStyle = "#263746";

        ctx.fillText(
            item.texto,
            x + 28,
            legendaY + 15
        );
    });


    // Rodapé

    const rodapeY =
        tabelaY +
        58 +
        dados.funcionarios.length * alturaLinha +
        24;

    ctx.fillStyle = "#5f6b76";

    ctx.font = "14px sans-serif";

    ctx.textAlign = "center";

    ctx.fillText(
        "Gerado pelo aplicativo Divergências",
        largura / 2,
        rodapeY
    );


    return canvas;
}


/* =========================================================
   QUEBRA DE TEXTO NO CANVAS
   ========================================================= */

function escreverTextoQuebrado(
    ctx,
    texto,
    x,
    y,
    larguraMaxima,
    alturaLinha,
    maxLinhas = 3,
    alinhamento = "left"
) {
    const palavras = String(texto).split(/\s+/);

    const linhas = [];

    let linhaAtual = "";

    for (const palavra of palavras) {
        const teste = linhaAtual
            ? `${linhaAtual} ${palavra}`
            : palavra;

        if (
            ctx.measureText(teste).width <= larguraMaxima ||
            linhaAtual === ""
        ) {
            linhaAtual = teste;
        } else {
            linhas.push(linhaAtual);

            linhaAtual = palavra;
        }
    }

    if (linhaAtual) {
        linhas.push(linhaAtual);
    }

    const linhasVisiveis = linhas.slice(0, maxLinhas);

    if (linhas.length > maxLinhas) {
        const ultima = linhasVisiveis.length - 1;

        let textoUltimaLinha = linhasVisiveis[ultima];

        while (
            textoUltimaLinha.length > 0 &&
            ctx.measureText(textoUltimaLinha + "…").width >
                larguraMaxima
        ) {
            textoUltimaLinha =
                textoUltimaLinha.slice(0, -1);
        }

        linhasVisiveis[ultima] =
            textoUltimaLinha + "…";
    }

    ctx.textAlign = alinhamento;

    const xTexto =
        alinhamento === "center"
            ? x
            : x;

    linhasVisiveis.forEach((linha, indice) => {
        ctx.fillText(
            linha,
            xTexto,
            y + indice * alturaLinha
        );
    });
}


/* =========================================================
   COMPARTILHAR IMAGEM
   ========================================================= */

function compartilharCanvas(canvas, dados) {
    let dataUrl;

    try {
        dataUrl = canvas.toDataURL("image/png");
    } catch (erro) {
        console.error(erro);

        mostrarMensagem(
            "Não foi possível gerar a imagem PNG.",
            "danger"
        );

        return;
    }

    const nomeArquivo =
        `escala_${dados.dataInicial}_${dados.dataFinal}.png`;

    // Android nativo

    if (
        typeof Android !== "undefined" &&
        typeof Android.compartilharImagemBase64 === "function"
    ) {
        try {
            const resultado =
                Android.compartilharImagemBase64(
                    dataUrl,
                    nomeArquivo
                );

            if (resultado !== "ok") {
                mostrarMensagem(
                    resultado || "Não foi possível compartilhar a imagem.",
                    "danger"
                );
            }

            return;

        } catch (erro) {
            console.error(erro);

            mostrarMensagem(
                "Erro ao abrir o compartilhamento do Android.",
                "danger"
            );

            return;
        }
    }

    // Fallback para testes em navegador

    const link = document.createElement("a");

    link.href = dataUrl;

    link.download = nomeArquivo;

    document.body.appendChild(link);

    link.click();

    link.remove();

    mostrarMensagem(
        "Imagem gerada. O download foi iniciado.",
        "success"
    );
}


function gerarImagem() {
    limparMensagem();

    if (!validarEscala()) {
        return;
    }

    const dados = criarDadosEscala();

    try {
        const canvas = gerarCanvasEscala(dados);

        compartilharCanvas(canvas, dados);

    } catch (erro) {
        console.error(erro);

        mostrarMensagem(
            erro.message || "Erro ao gerar a imagem.",
            "danger"
        );
    }
}


/* =========================================================
   ALTERAÇÃO DO PERÍODO
   ========================================================= */

function alterarPeriodo() {
    limparMensagem();

    if (!validarPeriodo(false)) {
        renderizarFuncionarios();

        return;
    }

    renderizarFuncionarios();
}


/* =========================================================
   EVENTOS
   ========================================================= */

botaoAdicionar.addEventListener("click", () => {
    adicionarFuncionario();
});

botaoSalvar.addEventListener("click", salvarEscala);

botaoLimpar.addEventListener("click", limparFormulario);

botaoGerarImagem.addEventListener("click", gerarImagem);

dataInicialInput.addEventListener("change", alterarPeriodo);

dataFinalInput.addEventListener("change", alterarPeriodo);


/* =========================================================
   INICIALIZAÇÃO
   ========================================================= */

function inicializarEscala() {
    const hoje = new Date();

    const fim = new Date(hoje);

    fim.setDate(fim.getDate() + 6);

    dataInicialInput.value = dataLocalISO(hoje);

    dataFinalInput.value = dataLocalISO(fim);

    funcionarios = [
        criarFuncionario()
    ];

    renderizarFuncionarios();

    renderizarEscalasSalvas();
}


document.addEventListener(
    "DOMContentLoaded",
    inicializarEscala
);