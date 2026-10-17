"use strict";

/* =========================================================
   CONFIGURAÇÕES
   ========================================================= */

const CHAVE_ESCALAS = "divergencias_escalas_funcionarios_v1";
const CHAVE_FUNCIONARIOS = "divergencias_funcionarios_v1";

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
const botaoAdicionarCadastrado = document.getElementById("adicionarCadastrado");
const botaoSalvar = document.getElementById("salvarEscala");
const botaoLimpar = document.getElementById("limparEscala");
const botaoGerarImagem = document.getElementById("gerarImagem");

/* =========================================================
   ESTADO
   ========================================================= */

let funcionarios = [];
let proximoId = 1;
let escalaEditandoId = null;

const modalConfirmacaoElemento = document.getElementById("modalConfirmacaoEscala");
const modalConfirmacao = new bootstrap.Modal(modalConfirmacaoElemento);
const mensagemConfirmacao = document.getElementById("mensagemConfirmacaoEscala");
const botaoConfirmarAcao = document.getElementById("confirmarAcaoEscala");
let acaoConfirmacaoPendente = null;

const modalSelecaoEl = document.getElementById("modalSelecionarFuncionario");
const modalSelecao = modalSelecaoEl ? new bootstrap.Modal(modalSelecaoEl) : null;
const listaSelecao = document.getElementById("listaSelecaoFuncionarios");

function solicitarConfirmacao(mensagem, acao) {
    mensagemConfirmacao.textContent = mensagem;
    acaoConfirmacaoPendente = acao;
    modalConfirmacao.show();
}

botaoConfirmarAcao.addEventListener("click", () => {
    const acao = acaoConfirmacaoPendente;
    acaoConfirmacaoPendente = null;
    modalConfirmacao.hide();
    if (typeof acao === "function") acao();
});

modalConfirmacaoElemento.addEventListener("hidden.bs.modal", () => {
    acaoConfirmacaoPendente = null;
});

/* =========================================================
   DATA LOCAL
   ========================================================= */

function dataLocalISO(data) {
    const ano = data.getFullYear();
    const mes = String(data.getMonth() + 1).padStart(2, "0");
    const dia = String(data.getDate()).padStart(2, "0");
    return `${ano}-${mes}-${dia}`;
}

function dataDeISO(valor) {
    const partes = valor.split("-").map(Number);
    if (partes.length !== 3 || partes.some(Number.isNaN)) return null;
    const [ano, mes, dia] = partes;
    const data = new Date(ano, mes - 1, dia);
    if (data.getFullYear() !== ano || data.getMonth() !== mes - 1 || data.getDate() !== dia) {
        return null;
    }
    return data;
}

function formatarData(valor, incluirDiaSemana = false) {
    const data = dataDeISO(valor);
    if (!data) return valor;
    const opcoes = incluirDiaSemana
        ? { weekday: "short", day: "2-digit", month: "2-digit" }
        : { day: "2-digit", month: "2-digit", year: "numeric" };
    return data.toLocaleDateString("pt-BR", opcoes);
}

function obterDatas() {
    const inicio = dataInicialInput.value;
    const fim = dataFinalInput.value;
    if (!inicio || !fim) return [];
    const dataInicio = dataDeISO(inicio);
    const dataFim = dataDeISO(fim);
    if (!dataInicio || !dataFim || dataFim < dataInicio) return [];
    const diferenca = Math.round((dataFim - dataInicio) / 86400000);
    if (diferenca + 1 > MAX_DIAS) return [];
    const datas = [];
    const cursor = new Date(dataInicio.getFullYear(), dataInicio.getMonth(), dataInicio.getDate());
    while (cursor <= dataFim) {
        datas.push(dataLocalISO(cursor));
        cursor.setDate(cursor.getDate() + 1);
    }
    return datas;
}

/* =========================================================
   MENSAGENS / VALIDAÇÃO PERÍODO
   ========================================================= */

function mostrarMensagem(texto, tipo = "success") {
    mensagemEscala.textContent = texto;
    mensagemEscala.className = `alert alert-${tipo} mt-4`;
    mensagemEscala.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function limparMensagem() {
    mensagemEscala.textContent = "";
    mensagemEscala.className = "alert d-none mt-4";
}

function validarPeriodo(mostrarErro = false) {
    const inicio = dataInicialInput.value;
    const fim = dataFinalInput.value;
    if (!inicio || !fim) {
        periodoInfo.textContent = "Selecione as datas inicial e final.";
        if (mostrarErro) mostrarMensagem("Informe a data inicial e a data final.", "warning");
        return false;
    }
    const dataInicio = dataDeISO(inicio);
    const dataFim = dataDeISO(fim);
    if (!dataInicio || !dataFim) {
        periodoInfo.textContent = "Informe datas válidas.";
        if (mostrarErro) mostrarMensagem("Uma das datas informadas é inválida.", "warning");
        return false;
    }
    if (dataFim < dataInicio) {
        periodoInfo.textContent = "A data final precisa ser igual ou posterior à inicial.";
        if (mostrarErro) mostrarMensagem("A data final não pode ser anterior à data inicial.", "warning");
        return false;
    }
    const diferenca = Math.round((dataFim - dataInicio) / 86400000) + 1;
    if (diferenca > MAX_DIAS) {
        periodoInfo.textContent = `O período máximo é de ${MAX_DIAS} dias.`;
        if (mostrarErro) mostrarMensagem(`Selecione no máximo ${MAX_DIAS} dias.`, "warning");
        return false;
    }
    periodoInfo.textContent = `${diferenca} dia(s) selecionado(s).`;
    return true;
}

/* =========================================================
   CADASTRO DE FUNCIONÁRIOS (leitura)
   ========================================================= */

function temAndroidFunc() {
    return typeof Android !== "undefined" && typeof Android.listarFuncionarios === "function";
}

function carregarFuncionariosCadastrados() {
    if (temAndroidFunc()) {
        try {
            const raw = Android.listarFuncionarios();
            const dados = JSON.parse(raw || "[]");
            return Array.isArray(dados) ? dados : [];
        } catch (e) {
            console.error(e);
        }
    }
    try {
        const txt = localStorage.getItem(CHAVE_FUNCIONARIOS);
        if (!txt) return [];
        const dados = JSON.parse(txt);
        return Array.isArray(dados) ? dados : [];
    } catch (e) {
        return [];
    }
}

/* =========================================================
   FUNCIONÁRIOS DA ESCALA
   ========================================================= */

function criarFuncionario(dados = {}) {
    return {
        id: proximoId++,
        cracha: dados.cracha || "",
        nome: dados.nome || "",
        cargo: dados.cargo || "",
        horarios: {},
        intermediario: false,
        dataInicioInter: "",
        quantidadeDiasInter: 2,
        diasInter: [],
        entradaInter: "09:00",
        saidaInter: "17:20"
    };
}

function recalcularDiasInter(funcionario, datas) {
    if (!funcionario.intermediario || !funcionario.dataInicioInter) {
        funcionario.diasInter = [];
        return;
    }
    const qtd = Number(funcionario.quantidadeDiasInter) || 2;
    const idx = datas.indexOf(funcionario.dataInicioInter);
    if (idx < 0) {
        funcionario.diasInter = [];
        return;
    }
    funcionario.diasInter = datas.slice(idx, idx + qtd);
}

function adicionarFuncionario(dados = {}) {
    if (!validarPeriodo(true)) return;
    if (funcionarios.length >= MAX_FUNCIONARIOS) {
        mostrarMensagem(`O limite é de ${MAX_FUNCIONARIOS} funcionários.`, "warning");
        return;
    }
    funcionarios.push(criarFuncionario(dados));
    renderizarFuncionarios();
    atualizarResumo();
}

function removerFuncionario(id) {
    funcionarios = funcionarios.filter(f => f.id !== id);
    renderizarFuncionarios();
    atualizarResumo();
    limparMensagem();
}

function criarElemento(tag, classe, texto = "") {
    const el = document.createElement(tag);
    if (classe) el.className = classe;
    if (texto) el.textContent = texto;
    return el;
}

/* =========================================================
   RENDERIZAÇÃO
   ========================================================= */

function renderizarFuncionarios() {
    const datas = obterDatas();
    listaFuncionarios.replaceChildren();

    if (datas.length === 0) {
        listaFuncionarios.appendChild(
            criarElemento("div", "text-muted text-center py-3", "Selecione um período válido.")
        );
        atualizarResumo();
        return;
    }

    funcionarios.forEach((funcionario, indice) => {
        recalcularDiasInter(funcionario, datas);

        const card = criarElemento("div", "funcionario-card");
        const cabecalho = criarElemento("div", "funcionario-cabecalho");

        let tituloTexto = `Funcionário ${indice + 1}`;
        if (funcionario.nome) tituloTexto = funcionario.nome;
        if (funcionario.cargo) tituloTexto += ` · ${funcionario.cargo}`;

        const titulo = criarElemento("h6", "funcionario-titulo", tituloTexto);
        const botaoRemover = criarElemento("button", "btn btn-outline-danger btn-sm", "Remover");
        botaoRemover.type = "button";
        botaoRemover.addEventListener("click", () => removerFuncionario(funcionario.id));
        cabecalho.append(titulo, botaoRemover);

        const campos = criarElemento("div", "funcionario-campos");

        // Nome
        const grupoNome = criarElemento("div", "funcionario-nome");
        const labelNome = criarElemento("label", "form-label", "Nome do funcionário");
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

        // Crachá (somente leitura se veio do cadastro)
        if (funcionario.cracha) {
            const infoCracha = criarElemento("div", "small text-muted mb-2");
            infoCracha.textContent = `Crachá: ${funcionario.cracha}`;
            grupoNome.appendChild(infoCracha);
        }

        // ---- Inter ----
        const interConfiguracao = criarElemento("div", "inter-configuracao");
        const interLabel = criarElemento("label", "inter-checkbox");
        const interCheckbox = document.createElement("input");
        interCheckbox.type = "checkbox";
        interCheckbox.checked = funcionario.intermediario;
        const interTexto = criarElemento("span", "", "Trabalha no intermediário (Inter)");
        interLabel.append(interCheckbox, interTexto);

        const interCampos = criarElemento("div", "inter-campos");
        interCampos.hidden = !funcionario.intermediario;

        const grupoDataInicio = criarElemento("div", "inter-grupo");
        const labelDataInicio = criarElemento("label", "", "Começa o Inter em");
        const dataInicio = criarElemento("input", "form-control");
        dataInicio.type = "date";
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

        const grupoQtd = criarElemento("div", "inter-grupo");
        const labelQtd = criarElemento("label", "", "Quantidade de dias de Inter");
        const selectQtd = criarElemento("select", "form-select");
        [1, 2, 3, 4].forEach(n => {
            const opt = document.createElement("option");
            opt.value = String(n);
            opt.textContent = n === 1 ? "1 dia" : `${n} dias`;
            if (n === (funcionario.quantidadeDiasInter || 2)) opt.selected = true;
            selectQtd.appendChild(opt);
        });
        selectQtd.addEventListener("change", () => {
            funcionario.quantidadeDiasInter = Number(selectQtd.value);
            recalcularDiasInter(funcionario, datas);
            renderizarFuncionarios();
            atualizarResumo();
        });
        grupoQtd.append(labelQtd, selectQtd);

        const grupoEntrada = criarElemento("div", "inter-grupo");
        const labelEntrada = criarElemento("label", "", "Entrada Inter");
        const inputEntrada = criarElemento("input", "form-control");
        inputEntrada.type = "time";
        inputEntrada.value = funcionario.entradaInter || "09:00";
        inputEntrada.addEventListener("change", () => {
            funcionario.entradaInter = inputEntrada.value;
            atualizarResumo();
        });
        grupoEntrada.append(labelEntrada, inputEntrada);

        const grupoSaida = criarElemento("div", "inter-grupo");
        const labelSaida = criarElemento("label", "", "Saída Inter");
        const inputSaida = criarElemento("input", "form-control");
        inputSaida.type = "time";
        inputSaida.value = funcionario.saidaInter || "17:20";
        inputSaida.addEventListener("change", () => {
            funcionario.saidaInter = inputSaida.value;
            atualizarResumo();
        });
        grupoSaida.append(labelSaida, inputSaida);

        interCampos.append(grupoDataInicio, grupoQtd, grupoEntrada, grupoSaida);

        const ajuda = criarElemento("div", "inter-ajuda");
        if (funcionario.intermediario && funcionario.diasInter.length > 0) {
            const listaDias = funcionario.diasInter.map(d => formatarData(d, true)).join(", ");
            ajuda.textContent = `Dias de Inter: ${listaDias}. Nesses dias, se o horário estiver em branco, a imagem usará o Inter automaticamente.`;
        } else if (funcionario.intermediario) {
            ajuda.textContent = "Escolha a data de início e a quantidade de dias (1 a 4).";
        }

        interCheckbox.addEventListener("change", () => {
            funcionario.intermediario = interCheckbox.checked;
            if (funcionario.intermediario) {
                if (!funcionario.dataInicioInter) funcionario.dataInicioInter = datas[0] || "";
                if (!funcionario.quantidadeDiasInter) funcionario.quantidadeDiasInter = 2;
            } else {
                funcionario.diasInter = [];
            }
            recalcularDiasInter(funcionario, datas);
            renderizarFuncionarios();
            atualizarResumo();
        });

        interConfiguracao.append(interLabel, interCampos, ajuda);

        // Horários por dia
        const grupoHorarios = criarElemento("div", "funcionario-horarios");
        datas.forEach(data => {
            const dia = criarElemento("div", "horario-dia");
            const ehDiaInter = funcionario.intermediario &&
                Array.isArray(funcionario.diasInter) &&
                funcionario.diasInter.includes(data);
            if (ehDiaInter) dia.classList.add("horario-dia-inter");

            const labelDia = criarElemento("label", "", formatarData(data, true));
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

            const botaoFolga = criarElemento("button", "btn btn-outline-secondary btn-sm btn-folga", "Folga");
            botaoFolga.type = "button";
            botaoFolga.addEventListener("click", () => {
                inputHorario.value = "Folga";
                funcionario.horarios[data] = "Folga";
                atualizarResumo();
            });

            dia.append(labelDia, inputHorario, botaoFolga);
            grupoHorarios.appendChild(dia);
        });

        campos.append(grupoNome, interConfiguracao, grupoHorarios);
        card.append(cabecalho, campos);
        listaFuncionarios.appendChild(card);
    });

    atualizarResumo();
}

function atualizarResumo() {
    const datas = obterDatas();
    resumoEscala.replaceChildren();
    if (datas.length === 0) {
        resumoEscala.textContent = "Nenhuma escala montada.";
        return;
    }
    resumoEscala.append(
        criarElemento("div", "resumo-titulo", "Escala de Funcionários"),
        criarElemento("div", "resumo-periodo",
            `${formatarData(datas[0])} a ${formatarData(datas[datas.length - 1])}`),
        criarElemento("div", "resumo-quantidade",
            `${funcionarios.length} funcionário(s) · ${datas.length} dia(s)`)
    );
}

/* =========================================================
   SELEÇÃO DE CADASTRADOS
   ========================================================= */

function abrirSelecaoCadastrados() {
    if (!validarPeriodo(true)) return;
    if (!modalSelecao || !listaSelecao) {
        mostrarMensagem("Modal de seleção não encontrado.", "warning");
        return;
    }

    const cadastrados = carregarFuncionariosCadastrados();
    listaSelecao.replaceChildren();

    if (cadastrados.length === 0) {
        listaSelecao.appendChild(
            criarElemento("div", "text-muted text-center py-3",
                "Nenhum funcionário cadastrado. Vá em Funcionários e cadastre primeiro.")
        );
        modalSelecao.show();
        return;
    }

    cadastrados.forEach(func => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "list-group-item list-group-item-action text-start";
        btn.innerHTML = `<strong>${func.nome}</strong><br>
            <small class="text-muted">Crachá ${func.cracha} · ${func.cargo}</small>`;
        btn.addEventListener("click", () => {
            // evita duplicar o mesmo crachá na escala atual
            if (func.cracha && funcionarios.some(f => f.cracha === func.cracha)) {
                mostrarMensagem(`${func.nome} já está nesta escala.`, "warning");
                return;
            }
            adicionarFuncionario({
                cracha: func.cracha,
                nome: func.nome,
                cargo: func.cargo
            });
            modalSelecao.hide();
            mostrarMensagem(`${func.nome} adicionado à escala.`, "success");
        });
        listaSelecao.appendChild(btn);
    });

    modalSelecao.show();
}

/* =========================================================
   SERIALIZAÇÃO / VALIDAÇÃO
   ========================================================= */

function criarDadosEscala() {
    return {
        id: escalaEditandoId || ("escala-" + Date.now() + "-" + Math.random().toString(36).slice(2, 8)),
        dataInicial: dataInicialInput.value,
        dataFinal: dataFinalInput.value,
        funcionarios: funcionarios.map(f => ({
            cracha: f.cracha || "",
            nome: f.nome.trim(),
            cargo: f.cargo || "",
            horarios: { ...f.horarios },
            intermediario: f.intermediario,
            dataInicioInter: f.dataInicioInter || "",
            quantidadeDiasInter: f.quantidadeDiasInter || 2,
            entradaInter: f.entradaInter,
            saidaInter: f.saidaInter
        })),
        atualizadoEm: new Date().toISOString()
    };
}

function validarEscala() {
    if (!validarPeriodo(true)) return false;
    if (funcionarios.length === 0) {
        mostrarMensagem("Adicione pelo menos um funcionário.", "warning");
        return false;
    }
    const nomes = funcionarios.map(f => f.nome.trim());
    if (nomes.some(n => n.length === 0)) {
        mostrarMensagem("Preencha o nome de todos os funcionários.", "warning");
        return false;
    }
    for (const f of funcionarios) {
        if (!f.intermediario) continue;
        if (!f.entradaInter || !f.saidaInter) {
            mostrarMensagem(`Preencha a entrada e a saída do Inter para ${f.nome}.`, "warning");
            return false;
        }
        if (f.entradaInter === f.saidaInter) {
            mostrarMensagem(`Entrada e saída do Inter não podem ser iguais para ${f.nome}.`, "warning");
            return false;
        }
    }
    const normalizados = nomes.map(n => n.toLocaleLowerCase("pt-BR"));
    if (new Set(normalizados).size !== normalizados.length) {
        mostrarMensagem("Existem funcionários com nomes repetidos.", "warning");
        return false;
    }
    return true;
}

/* =========================================================
   ARMAZENAMENTO ESCALAS
   ========================================================= */

function carregarTodasEscalas() {
    try {
        const texto = localStorage.getItem(CHAVE_ESCALAS);
        if (!texto) return [];
        const dados = JSON.parse(texto);
        return Array.isArray(dados) ? dados : [];
    } catch (e) {
        return [];
    }
}

function gravarTodasEscalas(escalas) {
    try {
        localStorage.setItem(CHAVE_ESCALAS, JSON.stringify(escalas));
        return true;
    } catch (e) {
        return false;
    }
}

function salvarEscala() {
    limparMensagem();
    if (!validarEscala()) return;
    const novaEscala = criarDadosEscala();
    const escalas = carregarTodasEscalas();
    const indice = escalas.findIndex(e => String(e.id) === String(novaEscala.id));
    if (indice >= 0) escalas[indice] = novaEscala;
    else escalas.unshift(novaEscala);
    if (!gravarTodasEscalas(escalas)) {
        mostrarMensagem("Não foi possível salvar.", "danger");
        return;
    }
    escalaEditandoId = novaEscala.id;
    renderizarEscalasSalvas();
    mostrarMensagem("Escala salva com sucesso no dispositivo.", "success");
}

function renderizarEscalasSalvas() {
    const escalas = carregarTodasEscalas();
    escalasSalvas.replaceChildren();
    if (escalas.length === 0) {
        escalasSalvas.appendChild(criarElemento("div", "text-muted small", "Nenhuma escala salva."));
        return;
    }
    escalas.forEach(escala => {
        const card = criarElemento("div", "escala-salva");
        card.append(
            criarElemento("div", "escala-salva-titulo", "Escala de Funcionários"),
            criarElemento("div", "escala-salva-periodo",
                `${formatarData(escala.dataInicial)} a ${formatarData(escala.dataFinal)}`),
            criarElemento("div", "small text-muted mt-1",
                `${escala.funcionarios.length} funcionário(s)`)
        );
        const acoes = criarElemento("div", "escala-salva-acoes");
        const btnAbrir = criarElemento("button", "btn btn-outline-primary btn-sm", "Abrir");
        btnAbrir.type = "button";
        btnAbrir.addEventListener("click", () => carregarEscala(escala.id));
        const btnExcluir = criarElemento("button", "btn btn-outline-danger btn-sm", "Excluir");
        btnExcluir.type = "button";
        btnExcluir.addEventListener("click", () => excluirEscala(escala.id));
        acoes.append(btnAbrir, btnExcluir);
        card.appendChild(acoes);
        escalasSalvas.appendChild(card);
    });
}

function carregarEscala(id) {
    const escalas = carregarTodasEscalas();
    const escala = escalas.find(e => String(e.id) === String(id));
    if (!escala) {
        mostrarMensagem("Escala não encontrada.", "warning");
        return;
    }
    dataInicialInput.value = escala.dataInicial;
    dataFinalInput.value = escala.dataFinal;
    funcionarios = escala.funcionarios.map(f => ({
        id: proximoId++,
        cracha: f.cracha || "",
        nome: f.nome || "",
        cargo: f.cargo || "",
        horarios: { ...(f.horarios || {}) },
        intermediario: f.intermediario === true,
        dataInicioInter: f.dataInicioInter || "",
        quantidadeDiasInter: f.quantidadeDiasInter || 2,
        diasInter: [],
        entradaInter: f.entradaInter || "09:00",
        saidaInter: f.saidaInter || "17:20"
    }));
    escalaEditandoId = escala.id;
    renderizarFuncionarios();
    mostrarMensagem("Escala carregada. Você pode editar e salvar novamente.", "info");
    window.scrollTo({ top: 0, behavior: "smooth" });
}

function excluirEscala(id) {
    solicitarConfirmacao("Deseja realmente excluir esta escala salva?", () => {
        const escalas = carregarTodasEscalas().filter(e => String(e.id) !== String(id));
        if (!gravarTodasEscalas(escalas)) {
            mostrarMensagem("Não foi possível excluir.", "danger");
            return;
        }
        if (String(escalaEditandoId) === String(id)) escalaEditandoId = null;
        renderizarEscalasSalvas();
        mostrarMensagem("Escala excluída.", "success");
    });
}

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
            funcionarios = [criarFuncionario()];
            renderizarFuncionarios();
            limparMensagem();
        }
    );
}

/* =========================================================
   GERAÇÃO DA IMAGEM (mantida + cargo no nome)
   ========================================================= */

function gerarCanvasEscala(dados) {
    const datas = [];
    const inicio = dataDeISO(dados.dataInicial);
    const fim = dataDeISO(dados.dataFinal);
    if (!inicio || !fim) throw new Error("O período da escala é inválido.");
    const cursor = new Date(inicio);
    while (cursor <= fim) {
        datas.push(dataLocalISO(cursor));
        cursor.setDate(cursor.getDate() + 1);
    }
    if (datas.length === 0 || datas.length > MAX_DIAS) {
        throw new Error("O período da escala é inválido.");
    }

    const margem = 36;
    const larguraNome = 280;
    const larguraDia = 140;
    const largura = Math.max(1400, margem * 2 + larguraNome + datas.length * larguraDia);
    const alturaCabecalho = 175;
    const alturaLinha = 76;
    const alturaRodape = 100;
    const altura = margem + alturaCabecalho + dados.funcionarios.length * alturaLinha + alturaRodape;

    const canvas = document.createElement("canvas");
    canvas.width = largura;
    canvas.height = altura;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Não foi possível criar a imagem.");

    ctx.fillStyle = "#f3f5f7";
    ctx.fillRect(0, 0, largura, altura);

    ctx.fillStyle = "#b6202f";
    ctx.fillRect(0, 0, largura, margem + alturaCabecalho - 18);

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 38px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("ESCALA DE FUNCIONÁRIOS", largura / 2, 65);
    ctx.font = "22px sans-serif";
    ctx.fillText(`${formatarData(dados.dataInicial)} a ${formatarData(dados.dataFinal)}`, largura / 2, 105);
    ctx.font = "17px sans-serif";
    ctx.fillText(`${dados.funcionarios.length} funcionário(s)`, largura / 2, 137);

    const tabelaX = margem;
    const tabelaY = margem + alturaCabecalho - 18;
    const larguraTabela = largura - margem * 2;

    ctx.fillStyle = "#263746";
    ctx.fillRect(tabelaX, tabelaY, larguraTabela, 58);

    ctx.textAlign = "left";
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 18px sans-serif";
    ctx.fillText("FUNCIONÁRIO", tabelaX + 14, tabelaY + 35);

    datas.forEach((data, indice) => {
        const x = tabelaX + larguraNome + indice * larguraDia;
        const dataObj = dataDeISO(data);
        const diaSemana = dataObj.toLocaleDateString("pt-BR", { weekday: "short" })
            .replace(".", "").toUpperCase();
        const diaMes = dataObj.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
        ctx.textAlign = "center";
        ctx.font = "bold 15px sans-serif";
        ctx.fillText(diaSemana, x + larguraDia / 2, tabelaY + 24);
        ctx.font = "14px sans-serif";
        ctx.fillText(diaMes, x + larguraDia / 2, tabelaY + 44);
    });

    dados.funcionarios.forEach((funcionario, indiceFuncionario) => {
        const y = tabelaY + 58 + indiceFuncionario * alturaLinha;
        ctx.fillStyle = indiceFuncionario % 2 === 0 ? "#ffffff" : "#edf1f4";
        ctx.fillRect(tabelaX, y, larguraTabela, alturaLinha);

        const nomeExibicao = funcionario.cargo
            ? `${funcionario.nome} (${funcionario.cargo})`
            : funcionario.nome;

        ctx.fillStyle = "#263746";
        ctx.font = "bold 15px sans-serif";
        ctx.textAlign = "left";
        escreverTextoQuebrado(ctx, nomeExibicao, tabelaX + 14, y + 27, larguraNome - 24, 18, 2);

        datas.forEach((data, indiceData) => {
            const x = tabelaX + larguraNome + indiceData * larguraDia;
            const horarioInformado = funcionario.horarios[data] || "";
            const normalizado = horarioInformado.trim().toLocaleLowerCase("pt-BR");
            const estaDeFolga = normalizado === "folga";
            const ehInterAutomatico = funcionario.intermediario && horarioInformado.trim() === "";

            let texto;
            if (estaDeFolga) texto = "FOLGA";
            else if (ehInterAutomatico) texto = `INTER\n${funcionario.entradaInter}–${funcionario.saidaInter}`;
            else texto = horarioInformado.trim() || "—";

            if (estaDeFolga) ctx.fillStyle = "#fde8e8";
            else if (ehInterAutomatico) ctx.fillStyle = "#ffe0b2";
            else if (horarioInformado.trim() === "") ctx.fillStyle = "#f5f6f7";
            else if (normalizado.includes("22:") || normalizado.includes("noite")) ctx.fillStyle = "#e5e7fb";
            else ctx.fillStyle = "#e3f4e8";

            ctx.fillRect(x + 2, y + 2, larguraDia - 4, alturaLinha - 4);
            ctx.textAlign = "center";

            if (ehInterAutomatico) {
                ctx.fillStyle = "#9a4d00";
                ctx.font = "bold 15px sans-serif";
                ctx.fillText("INTER", x + larguraDia / 2, y + 25);
                ctx.font = "14px sans-serif";
                ctx.fillText(`${funcionario.entradaInter}–${funcionario.saidaInter}`, x + larguraDia / 2, y + 48);
            } else {
                ctx.fillStyle = estaDeFolga ? "#9b1c1c" : "#263746";
                ctx.font = estaDeFolga ? "bold 15px sans-serif" : "14px sans-serif";
                escreverTextoQuebrado(ctx, texto, x + larguraDia / 2, y + 30, larguraDia - 12, 18, 3, "center");
            }
        });

        ctx.strokeStyle = "#d5dce2";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(tabelaX, y + alturaLinha);
        ctx.lineTo(tabelaX + larguraTabela, y + alturaLinha);
        ctx.stroke();
    });

    const legendaY = tabelaY + 58 + dados.funcionarios.length * alturaLinha + 18;
    const itensLegenda = [
        { cor: "#e3f4e8", texto: "Manhã" },
        { cor: "#ffe0b2", texto: "Inter" },
        { cor: "#e5e7fb", texto: "Noite" },
        { cor: "#fde8e8", texto: "Folga" }
    ];
    ctx.font = "14px sans-serif";
    ctx.textAlign = "left";
    const larguraItem = 150;
    const legendaInicioX = (largura - itensLegenda.length * larguraItem) / 2;
    itensLegenda.forEach((item, i) => {
        const x = legendaInicioX + i * larguraItem;
        ctx.fillStyle = item.cor;
        ctx.fillRect(x, legendaY, 20, 20);
        ctx.fillStyle = "#263746";
        ctx.fillText(item.texto, x + 28, legendaY + 15);
    });

    const rodapeY = tabelaY + 58 + dados.funcionarios.length * alturaLinha + 24;
    ctx.fillStyle = "#5f6b76";
    ctx.font = "14px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("Gerado pelo aplicativo Divergências", largura / 2, rodapeY);

    return canvas;
}

function escreverTextoQuebrado(ctx, texto, x, y, larguraMaxima, alturaLinha, maxLinhas = 3, alinhamento = "left") {
    const palavras = String(texto).split(/\s+/);
    const linhas = [];
    let linhaAtual = "";
    for (const palavra of palavras) {
        const teste = linhaAtual ? `${linhaAtual} ${palavra}` : palavra;
        if (ctx.measureText(teste).width <= larguraMaxima || linhaAtual === "") {
            linhaAtual = teste;
        } else {
            linhas.push(linhaAtual);
            linhaAtual = palavra;
        }
    }
    if (linhaAtual) linhas.push(linhaAtual);
    const linhasVisiveis = linhas.slice(0, maxLinhas);
    if (linhas.length > maxLinhas) {
        let ultima = linhasVisiveis[linhasVisiveis.length - 1];
        while (ultima.length > 0 && ctx.measureText(ultima + "…").width > larguraMaxima) {
            ultima = ultima.slice(0, -1);
        }
        linhasVisiveis[linhasVisiveis.length - 1] = ultima + "…";
    }
    ctx.textAlign = alinhamento;
    linhasVisiveis.forEach((linha, i) => {
        ctx.fillText(linha, x, y + i * alturaLinha);
    });
}

function compartilharCanvas(canvas, dados) {
    let dataUrl;
    try {
        dataUrl = canvas.toDataURL("image/png");
    } catch (e) {
        mostrarMensagem("Não foi possível gerar a imagem PNG.", "danger");
        return;
    }
    const nomeArquivo = `escala_${dados.dataInicial}_${dados.dataFinal}.png`;

    if (typeof Android !== "undefined" && typeof Android.compartilharImagemBase64 === "function") {
        try {
            const resultado = Android.compartilharImagemBase64(dataUrl, nomeArquivo);
            if (resultado !== "ok") {
                mostrarMensagem(resultado || "Não foi possível compartilhar a imagem.", "danger");
            }
            return;
        } catch (e) {
            mostrarMensagem("Erro ao abrir o compartilhamento do Android.", "danger");
            return;
        }
    }

    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = nomeArquivo;
    document.body.appendChild(link);
    link.click();
    link.remove();
    mostrarMensagem("Imagem gerada. O download foi iniciado.", "success");
}

function gerarImagem() {
    limparMensagem();
    if (!validarEscala()) return;
    const dados = criarDadosEscala();
    try {
        const canvas = gerarCanvasEscala(dados);
        compartilharCanvas(canvas, dados);
    } catch (erro) {
        console.error(erro);
        mostrarMensagem(erro.message || "Erro ao gerar a imagem.", "danger");
    }
}

/* =========================================================
   EVENTOS + INIT
   ========================================================= */

function alterarPeriodo() {
    limparMensagem();
    if (!validarPeriodo(false)) {
        renderizarFuncionarios();
        return;
    }
    renderizarFuncionarios();
}

if (botaoAdicionar) {
    botaoAdicionar.addEventListener("click", () => adicionarFuncionario());
}
if (botaoAdicionarCadastrado) {
    botaoAdicionarCadastrado.addEventListener("click", abrirSelecaoCadastrados);
}
botaoSalvar.addEventListener("click", salvarEscala);
botaoLimpar.addEventListener("click", limparFormulario);
botaoGerarImagem.addEventListener("click", gerarImagem);
dataInicialInput.addEventListener("change", alterarPeriodo);
dataFinalInput.addEventListener("change", alterarPeriodo);

function inicializarEscala() {
    const hoje = new Date();
    const fim = new Date(hoje);
    fim.setDate(fim.getDate() + 6);
    dataInicialInput.value = dataLocalISO(hoje);
    dataFinalInput.value = dataLocalISO(fim);
    funcionarios = [criarFuncionario()];
    renderizarFuncionarios();
    renderizarEscalasSalvas();
}

document.addEventListener("DOMContentLoaded", inicializarEscala);