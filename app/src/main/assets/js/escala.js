"use strict";

/* =========================================================
   CONFIG
   ========================================================= */

const CHAVE_ESCALAS = "divergencias_escalas_funcionarios_v2";
const CHAVE_FUNCIONARIOS = "divergencias_funcionarios_v1";
const MAX_DIAS = 14;
const MAX_FUNCIONARIOS = 100;

const dataInicialInput = document.getElementById("dataInicial");
const dataFinalInput = document.getElementById("dataFinal");
const periodoInfo = document.getElementById("periodoInfo");
const resumoMontar = document.getElementById("resumoMontar");
const badgeQtdFunc = document.getElementById("badgeQtdFunc");
const listaCards = document.getElementById("listaCardsFuncionarios");
const escalasSalvas = document.getElementById("escalasSalvas");
const mensagemEscala = document.getElementById("mensagemEscala");

const btnAbrirModalAdicionar = document.getElementById("btnAbrirModalAdicionar");
const btnConfirmarAdicionar = document.getElementById("btnConfirmarAdicionar");
const btnSalvar = document.getElementById("salvarEscala");
const btnLimpar = document.getElementById("limparEscala");
const btnGerarImagem = document.getElementById("gerarImagem");
const btnConfirmarInter = document.getElementById("btnConfirmarInter");

const selectFuncionarioCad = document.getElementById("selectFuncionarioCad");
const addNome = document.getElementById("addNome");
const addCracha = document.getElementById("addCracha");
const addCargo = document.getElementById("addCargo");
const addEntrada = document.getElementById("addEntrada");
const addSaida = document.getElementById("addSaida");

const interNomeFunc = document.getElementById("interNomeFunc");
const interListaDias = document.getElementById("interListaDias");
const interEntrada = document.getElementById("interEntrada");
const interSaida = document.getElementById("interSaida");

const modalAdicionar = new bootstrap.Modal(document.getElementById("modalAdicionarFunc"));
const modalInter = new bootstrap.Modal(document.getElementById("modalInter"));
const modalConfirmacao = new bootstrap.Modal(document.getElementById("modalConfirmacaoEscala"));
const mensagemConfirmacao = document.getElementById("mensagemConfirmacaoEscala");
const botaoConfirmarAcao = document.getElementById("confirmarAcaoEscala");

let funcionarios = [];
let proximoId = 1;
let escalaEditandoId = null;
let acaoConfirmacaoPendente = null;
let idFuncInterAtual = null;

/* =========================================================
   UTILITÁRIOS DE DATA
   ========================================================= */

function dataLocalISO(data) {
    const y = data.getFullYear();
    const m = String(data.getMonth() + 1).padStart(2, "0");
    const d = String(data.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
}

function dataDeISO(valor) {
    const p = valor.split("-").map(Number);
    if (p.length !== 3 || p.some(Number.isNaN)) return null;
    const [y, m, d] = p;
    const dt = new Date(y, m - 1, d);
    if (dt.getFullYear() !== y || dt.getMonth() !== m - 1 || dt.getDate() !== d) return null;
    return dt;
}

function formatarData(valor, comSemana = false) {
    const dt = dataDeISO(valor);
    if (!dt) return valor;
    const op = comSemana
        ? { weekday: "short", day: "2-digit", month: "2-digit" }
        : { day: "2-digit", month: "2-digit", year: "numeric" };
    return dt.toLocaleDateString("pt-BR", op);
}

function obterDatas() {
    const ini = dataInicialInput.value;
    const fim = dataFinalInput.value;
    if (!ini || !fim) return [];
    const dIni = dataDeISO(ini);
    const dFim = dataDeISO(fim);
    if (!dIni || !dFim || dFim < dIni) return [];
    const diff = Math.round((dFim - dIni) / 86400000) + 1;
    if (diff > MAX_DIAS) return [];
    const datas = [];
    const c = new Date(dIni.getFullYear(), dIni.getMonth(), dIni.getDate());
    while (c <= dFim) {
        datas.push(dataLocalISO(c));
        c.setDate(c.getDate() + 1);
    }
    return datas;
}

function validarPeriodo(mostrarErro = false) {
    const ini = dataInicialInput.value;
    const fim = dataFinalInput.value;
    if (!ini || !fim) {
        periodoInfo.textContent = "Selecione as datas inicial e final.";
        if (mostrarErro) mostrarMensagem("Informe a data inicial e a data final.", "warning");
        return false;
    }
    const dIni = dataDeISO(ini);
    const dFim = dataDeISO(fim);
    if (!dIni || !dFim) {
        periodoInfo.textContent = "Informe datas válidas.";
        if (mostrarErro) mostrarMensagem("Uma das datas é inválida.", "warning");
        return false;
    }
    if (dFim < dIni) {
        periodoInfo.textContent = "A data final precisa ser igual ou posterior à inicial.";
        if (mostrarErro) mostrarMensagem("Data final não pode ser anterior à inicial.", "warning");
        return false;
    }
    const diff = Math.round((dFim - dIni) / 86400000) + 1;
    if (diff > MAX_DIAS) {
        periodoInfo.textContent = `O período máximo é de ${MAX_DIAS} dias.`;
        if (mostrarErro) mostrarMensagem(`Selecione no máximo ${MAX_DIAS} dias.`, "warning");
        return false;
    }
    periodoInfo.textContent = `${diff} dia(s) selecionado(s).`;
    return true;
}

/* =========================================================
   MENSAGENS / CONFIRMAÇÃO
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

document.getElementById("modalConfirmacaoEscala").addEventListener("hidden.bs.modal", () => {
    acaoConfirmacaoPendente = null;
});

/* =========================================================
   FUNCIONÁRIOS CADASTRADOS (leitura)
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
        } catch (e) { console.error(e); }
    }
    try {
        const txt = localStorage.getItem(CHAVE_FUNCIONARIOS);
        if (!txt) return [];
        const dados = JSON.parse(txt);
        return Array.isArray(dados) ? dados : [];
    } catch (e) { return []; }
}

function popularSelectCadastrados() {
    const lista = carregarFuncionariosCadastrados();
    selectFuncionarioCad.innerHTML = '<option value="">— Digitar avulso / escolher —</option>';
    lista.forEach(f => {
        const opt = document.createElement("option");
        opt.value = f.cracha;
        opt.textContent = `${f.nome} (${f.cracha}) · ${f.cargo}`;
        opt.dataset.nome = f.nome;
        opt.dataset.cargo = f.cargo;
        selectFuncionarioCad.appendChild(opt);
    });
}

selectFuncionarioCad.addEventListener("change", () => {
    const opt = selectFuncionarioCad.selectedOptions[0];
    if (!opt || !opt.value) return;
    addNome.value = opt.dataset.nome || "";
    addCracha.value = opt.value;
    addCargo.value = opt.dataset.cargo || "";
});

/* =========================================================
   MODELO DA ESCALA
   ========================================================= */

function criarDiasComHorarioPadrao(datas, entrada, saida) {
    const dias = {};
    datas.forEach(d => {
        dias[d] = { tipo: "normal", entrada, saida };
    });
    return dias;
}

function criarFuncionario({ cracha = "", nome = "", cargo = "", entrada = "08:00", saida = "16:20" } = {}) {
    const datas = obterDatas();
    return {
        id: proximoId++,
        cracha: String(cracha || "").trim(),
        nome: String(nome || "").trim(),
        cargo: String(cargo || "").trim(),
        dias: criarDiasComHorarioPadrao(datas, entrada, saida)
    };
}

/* =========================================================
   RESUMO + BADGE
   ========================================================= */

function atualizarResumo() {
    const n = funcionarios.length;
    badgeQtdFunc.textContent = String(n);
    if (n === 0) {
        resumoMontar.textContent = "Nenhum funcionário na escala ainda.";
        return;
    }
    const nomes = funcionarios.map(f => f.nome || "(sem nome)").join(", ");
    resumoMontar.innerHTML = `<strong>${n} funcionário(s)</strong> na escala atual.<br>
        <span class="text-muted">${nomes}</span><br>
        <span class="small">Vá na aba <strong>Visualizar</strong> para editar dias, folgas e intermediário.</span>`;
}

/* =========================================================
   ABA VISUALIZAR – CARDS
   ========================================================= */

function renderizarCards() {
    const datas = obterDatas();
    listaCards.replaceChildren();

    if (funcionarios.length === 0) {
        listaCards.innerHTML = `
            <div class="text-muted text-center py-4">
                Nenhum funcionário. Vá na aba Montar e adicione.
            </div>`;
        atualizarResumo();
        return;
    }

    funcionarios.forEach(func => {
        // sincroniza dias se o período mudou
        datas.forEach(d => {
            if (!func.dias[d]) {
                func.dias[d] = { tipo: "normal", entrada: "08:00", saida: "16:20" };
            }
        });
        // remove dias fora do período
        Object.keys(func.dias).forEach(d => {
            if (!datas.includes(d)) delete func.dias[d];
        });

        const card = document.createElement("div");
        card.className = "card card-func-escala mb-3 shadow-sm";

        const header = document.createElement("div");
        header.className = "card-header d-flex justify-content-between align-items-start gap-2 bg-white";
        const titulo = document.createElement("div");
        titulo.innerHTML = `<strong>${func.nome || "Sem nome"}</strong>
            ${func.cargo ? `<span class="badge text-bg-dark ms-1">${func.cargo}</span>` : ""}
            ${func.cracha ? `<div class="small text-muted">Crachá ${func.cracha}</div>` : ""}`;

        const acoes = document.createElement("div");
        acoes.className = "d-flex flex-wrap gap-1";

        const btnInter = document.createElement("button");
        btnInter.type = "button";
        btnInter.className = "btn btn-outline-warning btn-sm";
        btnInter.textContent = "Inter";
        btnInter.addEventListener("click", () => abrirModalInter(func.id));

        const btnRemover = document.createElement("button");
        btnRemover.type = "button";
        btnRemover.className = "btn btn-outline-danger btn-sm";
        btnRemover.textContent = "Remover";
        btnRemover.addEventListener("click", () => {
            solicitarConfirmacao(`Remover ${func.nome} desta escala?`, () => {
                funcionarios = funcionarios.filter(f => f.id !== func.id);
                renderizarCards();
                atualizarResumo();
            });
        });

        acoes.append(btnInter, btnRemover);
        header.append(titulo, acoes);

        const body = document.createElement("div");
        body.className = "card-body py-2";

        datas.forEach(data => {
            const info = func.dias[data] || { tipo: "normal", entrada: "08:00", saida: "16:20" };
            const linha = document.createElement("div");
            linha.className = "dia-linha";

            const label = document.createElement("div");
            label.className = "small fw-semibold";
            label.style.minWidth = "90px";
            label.textContent = formatarData(data, true);

            const badge = document.createElement("span");
            badge.className = "badge " + (
                info.tipo === "folga" ? "badge-tipo-folga" :
                info.tipo === "inter" ? "badge-tipo-inter" : "badge-tipo-normal"
            );
            badge.textContent = info.tipo === "folga" ? "FOLGA" :
                info.tipo === "inter" ? "INTER" : "NORMAL";

            const selTipo = document.createElement("select");
            selTipo.className = "form-select form-select-sm";
            selTipo.style.maxWidth = "110px";
            ["normal", "folga", "inter"].forEach(t => {
                const o = document.createElement("option");
                o.value = t;
                o.textContent = t === "normal" ? "Normal" : t === "folga" ? "Folga" : "Inter";
                if (t === info.tipo) o.selected = true;
                selTipo.appendChild(o);
            });

            const inpEnt = document.createElement("input");
            inpEnt.type = "time";
            inpEnt.className = "form-control form-control-sm input-time-sm";
            inpEnt.value = info.entrada || "08:00";
            inpEnt.disabled = info.tipo === "folga";

            const inpSai = document.createElement("input");
            inpSai.type = "time";
            inpSai.className = "form-control form-control-sm input-time-sm";
            inpSai.value = info.saida || "16:20";
            inpSai.disabled = info.tipo === "folga";

            const atualizar = () => {
                const tipo = selTipo.value;
                func.dias[data] = {
                    tipo,
                    entrada: inpEnt.value || "08:00",
                    saida: inpSai.value || "16:20"
                };
                badge.className = "badge " + (
                    tipo === "folga" ? "badge-tipo-folga" :
                    tipo === "inter" ? "badge-tipo-inter" : "badge-tipo-normal"
                );
                badge.textContent = tipo === "folga" ? "FOLGA" : tipo === "inter" ? "INTER" : "NORMAL";
                inpEnt.disabled = tipo === "folga";
                inpSai.disabled = tipo === "folga";
            };

            selTipo.addEventListener("change", atualizar);
            inpEnt.addEventListener("change", atualizar);
            inpSai.addEventListener("change", atualizar);

            linha.append(label, badge, selTipo, inpEnt, inpSai);
            body.appendChild(linha);
        });

        card.append(header, body);
        listaCards.appendChild(card);
    });

    atualizarResumo();
}

/* =========================================================
   MODAL ADICIONAR
   ========================================================= */

btnAbrirModalAdicionar.addEventListener("click", () => {
    if (!validarPeriodo(true)) return;
    popularSelectCadastrados();
    selectFuncionarioCad.value = "";
    addNome.value = "";
    addCracha.value = "";
    addCargo.value = "";
    addEntrada.value = "08:00";
    addSaida.value = "16:20";
    modalAdicionar.show();
});

btnConfirmarAdicionar.addEventListener("click", () => {
    limparMensagem();
    if (!validarPeriodo(true)) return;

    const nome = addNome.value.trim();
    if (!nome) {
        mostrarMensagem("Informe o nome do funcionário.", "warning");
        return;
    }
    if (funcionarios.length >= MAX_FUNCIONARIOS) {
        mostrarMensagem(`Limite de ${MAX_FUNCIONARIOS} funcionários.`, "warning");
        return;
    }

    const entrada = addEntrada.value || "08:00";
    const saida = addSaida.value || "16:20";
    if (entrada === saida) {
        mostrarMensagem("Entrada e saída não podem ser iguais.", "warning");
        return;
    }

    const cracha = addCracha.value.trim();
    if (cracha && funcionarios.some(f => f.cracha === cracha)) {
        mostrarMensagem("Este crachá já está na escala.", "warning");
        return;
    }

    funcionarios.push(criarFuncionario({
        cracha,
        nome,
        cargo: addCargo.value,
        entrada,
        saida
    }));

    modalAdicionar.hide();
    renderizarCards();
    atualizarResumo();
    mostrarMensagem(`${nome} adicionado. Vá em Visualizar para ajustar dias.`, "success");

    // opcional: já muda para a aba visualizar
    const tabVis = document.getElementById("tab-visualizar");
    if (tabVis) bootstrap.Tab.getOrCreateInstance(tabVis).show();
});

/* =========================================================
   MODAL INTERMEDIÁRIO
   ========================================================= */

function abrirModalInter(idFunc) {
    const func = funcionarios.find(f => f.id === idFunc);
    if (!func) return;
    idFuncInterAtual = idFunc;
    interNomeFunc.textContent = `Funcionário: ${func.nome}`;
    interEntrada.value = "09:00";
    interSaida.value = "17:20";

    const datas = obterDatas();
    interListaDias.replaceChildren();
    datas.forEach(d => {
        const wrap = document.createElement("div");
        wrap.className = "form-check";
        const cb = document.createElement("input");
        cb.type = "checkbox";
        cb.className = "form-check-input";
        cb.value = d;
        cb.id = `inter-dia-${d}`;
        // pré-marca se já for inter
        if (func.dias[d] && func.dias[d].tipo === "inter") cb.checked = true;
        const lab = document.createElement("label");
        lab.className = "form-check-label";
        lab.htmlFor = cb.id;
        lab.textContent = formatarData(d, true);
        wrap.append(cb, lab);
        interListaDias.appendChild(wrap);
    });

    modalInter.show();
}

btnConfirmarInter.addEventListener("click", () => {
    const func = funcionarios.find(f => f.id === idFuncInterAtual);
    if (!func) return;

    const entrada = interEntrada.value || "09:00";
    const saida = interSaida.value || "17:20";
    if (entrada === saida) {
        mostrarMensagem("Entrada e saída do Inter não podem ser iguais.", "warning");
        return;
    }

    const marcados = [...interListaDias.querySelectorAll("input[type=checkbox]:checked")]
        .map(cb => cb.value);

    if (marcados.length === 0) {
        mostrarMensagem("Marque pelo menos um dia para o Inter.", "warning");
        return;
    }

    marcados.forEach(d => {
        func.dias[d] = { tipo: "inter", entrada, saida };
    });

    modalInter.hide();
    renderizarCards();
    mostrarMensagem(`Inter aplicado em ${marcados.length} dia(s) para ${func.nome}.`, "success");
});

/* =========================================================
   VALIDAÇÃO / SALVAR / CARREGAR
   ========================================================= */

function validarEscala() {
    if (!validarPeriodo(true)) return false;
    if (funcionarios.length === 0) {
        mostrarMensagem("Adicione pelo menos um funcionário.", "warning");
        return false;
    }
    for (const f of funcionarios) {
        if (!f.nome.trim()) {
            mostrarMensagem("Todos os funcionários precisam de nome.", "warning");
            return false;
        }
    }
    return true;
}

function criarDadosEscala() {
    return {
        id: escalaEditandoId || ("escala-" + Date.now() + "-" + Math.random().toString(36).slice(2, 8)),
        dataInicial: dataInicialInput.value,
        dataFinal: dataFinalInput.value,
        funcionarios: funcionarios.map(f => ({
            cracha: f.cracha,
            nome: f.nome.trim(),
            cargo: f.cargo,
            dias: { ...f.dias }
        })),
        atualizadoEm: new Date().toISOString()
    };
}

function carregarTodasEscalas() {
    try {
        const t = localStorage.getItem(CHAVE_ESCALAS);
        if (!t) return [];
        const d = JSON.parse(t);
        return Array.isArray(d) ? d : [];
    } catch (e) { return []; }
}

function gravarTodasEscalas(lista) {
    try {
        localStorage.setItem(CHAVE_ESCALAS, JSON.stringify(lista));
        return true;
    } catch (e) { return false; }
}

function salvarEscala() {
    limparMensagem();
    if (!validarEscala()) return;
    const nova = criarDadosEscala();
    const todas = carregarTodasEscalas();
    const idx = todas.findIndex(e => String(e.id) === String(nova.id));
    if (idx >= 0) todas[idx] = nova;
    else todas.unshift(nova);
    if (!gravarTodasEscalas(todas)) {
        mostrarMensagem("Não foi possível salvar.", "danger");
        return;
    }
    escalaEditandoId = nova.id;
    renderizarEscalasSalvas();
    mostrarMensagem("Escala salva com sucesso.", "success");
}

function renderizarEscalasSalvas() {
    const todas = carregarTodasEscalas();
    escalasSalvas.replaceChildren();
    if (todas.length === 0) {
        escalasSalvas.innerHTML = '<div class="text-muted small">Nenhuma escala salva.</div>';
        return;
    }
    todas.forEach(esc => {
        const card = document.createElement("div");
        card.className = "escala-salva";
        card.innerHTML = `
            <div class="escala-salva-titulo">Escala de Funcionários</div>
            <div class="escala-salva-periodo">${formatarData(esc.dataInicial)} a ${formatarData(esc.dataFinal)}</div>
            <div class="small text-muted mt-1">${esc.funcionarios.length} funcionário(s)</div>
            <div class="escala-salva-acoes mt-2"></div>`;
        const acoes = card.querySelector(".escala-salva-acoes");
        const bAbrir = document.createElement("button");
        bAbrir.type = "button";
        bAbrir.className = "btn btn-outline-primary btn-sm";
        bAbrir.textContent = "Abrir";
        bAbrir.addEventListener("click", () => carregarEscala(esc.id));
        const bExc = document.createElement("button");
        bExc.type = "button";
        bExc.className = "btn btn-outline-danger btn-sm";
        bExc.textContent = "Excluir";
        bExc.addEventListener("click", () => excluirEscala(esc.id));
        acoes.append(bAbrir, bExc);
        escalasSalvas.appendChild(card);
    });
}

function carregarEscala(id) {
    const esc = carregarTodasEscalas().find(e => String(e.id) === String(id));
    if (!esc) {
        mostrarMensagem("Escala não encontrada.", "warning");
        return;
    }
    dataInicialInput.value = esc.dataInicial;
    dataFinalInput.value = esc.dataFinal;
    funcionarios = (esc.funcionarios || []).map(f => ({
        id: proximoId++,
        cracha: f.cracha || "",
        nome: f.nome || "",
        cargo: f.cargo || "",
        dias: f.dias ? { ...f.dias } : {}
    }));
    // compatibilidade com formato antigo (horarios texto)
    funcionarios.forEach(f => {
        if (!f.dias || Object.keys(f.dias).length === 0) {
            f.dias = criarDiasComHorarioPadrao(obterDatas(), "08:00", "16:20");
        }
    });
    escalaEditandoId = esc.id;
    validarPeriodo(false);
    renderizarCards();
    atualizarResumo();
    mostrarMensagem("Escala carregada. Ajuste na aba Visualizar se precisar.", "info");
    bootstrap.Tab.getOrCreateInstance(document.getElementById("tab-visualizar")).show();
}

function excluirEscala(id) {
    solicitarConfirmacao("Excluir esta escala salva?", () => {
        const resto = carregarTodasEscalas().filter(e => String(e.id) !== String(id));
        gravarTodasEscalas(resto);
        if (String(escalaEditandoId) === String(id)) escalaEditandoId = null;
        renderizarEscalasSalvas();
        mostrarMensagem("Escala excluída.", "success");
    });
}

function limparFormulario() {
    solicitarConfirmacao("Limpar a escala atual? Alterações não salvas serão perdidas.", () => {
        funcionarios = [];
        escalaEditandoId = null;
        const hoje = new Date();
        const fim = new Date(hoje);
        fim.setDate(fim.getDate() + 6);
        dataInicialInput.value = dataLocalISO(hoje);
        dataFinalInput.value = dataLocalISO(fim);
        validarPeriodo(false);
        renderizarCards();
        atualizarResumo();
        limparMensagem();
    });
}

/* =========================================================
   GERAÇÃO DE IMAGEM
   ========================================================= */

function escreverTextoQuebrado(ctx, texto, x, y, larguraMax, alturaLinha, maxLinhas = 3, align = "left") {
    const palavras = String(texto).split(/\s+/);
    const linhas = [];
    let atual = "";
    for (const p of palavras) {
        const t = atual ? `${atual} ${p}` : p;
        if (ctx.measureText(t).width <= larguraMax || !atual) atual = t;
        else { linhas.push(atual); atual = p; }
    }
    if (atual) linhas.push(atual);
    const vis = linhas.slice(0, maxLinhas);
    if (linhas.length > maxLinhas) {
        let u = vis[vis.length - 1];
        while (u.length && ctx.measureText(u + "…").width > larguraMax) u = u.slice(0, -1);
        vis[vis.length - 1] = u + "…";
    }
    ctx.textAlign = align;
    vis.forEach((l, i) => ctx.fillText(l, x, y + i * alturaLinha));
}

function gerarCanvasEscala(dados) {
    const datas = [];
    const ini = dataDeISO(dados.dataInicial);
    const fim = dataDeISO(dados.dataFinal);
    if (!ini || !fim) throw new Error("Período inválido.");
    const c = new Date(ini);
    while (c <= fim) {
        datas.push(dataLocalISO(c));
        c.setDate(c.getDate() + 1);
    }
    if (!datas.length || datas.length > MAX_DIAS) throw new Error("Período inválido.");

    const margem = 36;
    const larguraNome = 280;
    const larguraDia = 140;
    const largura = Math.max(1400, margem * 2 + larguraNome + datas.length * larguraDia);
    const altCab = 175;
    const altLinha = 76;
    const altRodape = 100;
    const altura = margem + altCab + dados.funcionarios.length * altLinha + altRodape;

    const canvas = document.createElement("canvas");
    canvas.width = largura;
    canvas.height = altura;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas indisponível.");

    ctx.fillStyle = "#f3f5f7";
    ctx.fillRect(0, 0, largura, altura);
    ctx.fillStyle = "#b6202f";
    ctx.fillRect(0, 0, largura, margem + altCab - 18);

    ctx.fillStyle = "#fff";
    ctx.font = "bold 38px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("ESCALA DE FUNCIONÁRIOS", largura / 2, 65);
    ctx.font = "22px sans-serif";
    ctx.fillText(`${formatarData(dados.dataInicial)} a ${formatarData(dados.dataFinal)}`, largura / 2, 105);
    ctx.font = "17px sans-serif";
    ctx.fillText(`${dados.funcionarios.length} funcionário(s)`, largura / 2, 137);

    const tx = margem;
    const ty = margem + altCab - 18;
    const tw = largura - margem * 2;

    ctx.fillStyle = "#263746";
    ctx.fillRect(tx, ty, tw, 58);
    ctx.fillStyle = "#fff";
    ctx.font = "bold 18px sans-serif";
    ctx.textAlign = "left";
    ctx.fillText("FUNCIONÁRIO", tx + 14, ty + 35);

    datas.forEach((data, i) => {
        const x = tx + larguraNome + i * larguraDia;
        const dt = dataDeISO(data);
        const sem = dt.toLocaleDateString("pt-BR", { weekday: "short" }).replace(".", "").toUpperCase();
        const dm = dt.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
        ctx.textAlign = "center";
        ctx.font = "bold 15px sans-serif";
        ctx.fillText(sem, x + larguraDia / 2, ty + 24);
        ctx.font = "14px sans-serif";
        ctx.fillText(dm, x + larguraDia / 2, ty + 44);
    });

    dados.funcionarios.forEach((func, fi) => {
        const y = ty + 58 + fi * altLinha;
        ctx.fillStyle = fi % 2 === 0 ? "#fff" : "#edf1f4";
        ctx.fillRect(tx, y, tw, altLinha);

        const nomeEx = func.cargo ? `${func.nome} (${func.cargo})` : func.nome;
        ctx.fillStyle = "#263746";
        ctx.font = "bold 15px sans-serif";
        ctx.textAlign = "left";
        escreverTextoQuebrado(ctx, nomeEx, tx + 14, y + 27, larguraNome - 24, 18, 2);

        datas.forEach((data, di) => {
            const x = tx + larguraNome + di * larguraDia;
            const info = (func.dias && func.dias[data]) || { tipo: "normal", entrada: "", saida: "" };
            const tipo = info.tipo || "normal";

            if (tipo === "folga") ctx.fillStyle = "#fde8e8";
            else if (tipo === "inter") ctx.fillStyle = "#ffe0b2";
            else ctx.fillStyle = "#e3f4e8";
            ctx.fillRect(x + 2, y + 2, larguraDia - 4, altLinha - 4);

            ctx.textAlign = "center";
            if (tipo === "folga") {
                ctx.fillStyle = "#9b1c1c";
                ctx.font = "bold 15px sans-serif";
                ctx.fillText("FOLGA", x + larguraDia / 2, y + 42);
            } else if (tipo === "inter") {
                ctx.fillStyle = "#9a4d00";
                ctx.font = "bold 15px sans-serif";
                ctx.fillText("INTER", x + larguraDia / 2, y + 28);
                ctx.font = "14px sans-serif";
                ctx.fillText(`${info.entrada || "—"}–${info.saida || "—"}`, x + larguraDia / 2, y + 50);
            } else {
                ctx.fillStyle = "#263746";
                ctx.font = "14px sans-serif";
                const txt = (info.entrada && info.saida)
                    ? `${info.entrada}–${info.saida}`
                    : "—";
                ctx.fillText(txt, x + larguraDia / 2, y + 42);
            }
        });

        ctx.strokeStyle = "#d5dce2";
        ctx.beginPath();
        ctx.moveTo(tx, y + altLinha);
        ctx.lineTo(tx + tw, y + altLinha);
        ctx.stroke();
    });

    const legY = ty + 58 + dados.funcionarios.length * altLinha + 18;
    const itens = [
        { cor: "#e3f4e8", t: "Normal" },
        { cor: "#ffe0b2", t: "Inter" },
        { cor: "#fde8e8", t: "Folga" }
    ];
    ctx.font = "14px sans-serif";
    ctx.textAlign = "left";
    const wItem = 150;
    const startX = (largura - itens.length * wItem) / 2;
    itens.forEach((it, i) => {
        const x = startX + i * wItem;
        ctx.fillStyle = it.cor;
        ctx.fillRect(x, legY, 20, 20);
        ctx.fillStyle = "#263746";
        ctx.fillText(it.t, x + 28, legY + 15);
    });

    ctx.fillStyle = "#5f6b76";
    ctx.font = "14px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("Gerado pelo aplicativo Divergências", largura / 2, legY + 40);

    return canvas;
}

function compartilharCanvas(canvas, dados) {
    let dataUrl;
    try { dataUrl = canvas.toDataURL("image/png"); }
    catch (e) {
        mostrarMensagem("Não foi possível gerar a imagem PNG.", "danger");
        return;
    }
    const nome = `escala_${dados.dataInicial}_${dados.dataFinal}.png`;

    if (typeof Android !== "undefined" && typeof Android.compartilharImagemBase64 === "function") {
        try {
            const r = Android.compartilharImagemBase64(dataUrl, nome);
            if (r !== "ok") mostrarMensagem(r || "Falha ao compartilhar.", "danger");
            return;
        } catch (e) {
            mostrarMensagem("Erro no compartilhamento Android.", "danger");
            return;
        }
    }

    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = nome;
    document.body.appendChild(a);
    a.click();
    a.remove();
    mostrarMensagem("Imagem gerada. Download iniciado.", "success");
}

function gerarImagem() {
    limparMensagem();
    if (!validarEscala()) return;
    const dados = criarDadosEscala();
    try {
        const canvas = gerarCanvasEscala(dados);
        compartilharCanvas(canvas, dados);
    } catch (e) {
        console.error(e);
        mostrarMensagem(e.message || "Erro ao gerar imagem.", "danger");
    }
}

/* =========================================================
   EVENTOS + INIT
   ========================================================= */

function aoMudarPeriodo() {
    limparMensagem();
    validarPeriodo(false);
    // reajusta dias dos funcionários já adicionados
    const datas = obterDatas();
    funcionarios.forEach(f => {
        datas.forEach(d => {
            if (!f.dias[d]) f.dias[d] = { tipo: "normal", entrada: "08:00", saida: "16:20" };
        });
        Object.keys(f.dias).forEach(d => {
            if (!datas.includes(d)) delete f.dias[d];
        });
    });
    renderizarCards();
    atualizarResumo();
}

dataInicialInput.addEventListener("change", aoMudarPeriodo);
dataFinalInput.addEventListener("change", aoMudarPeriodo);
btnSalvar.addEventListener("click", salvarEscala);
btnLimpar.addEventListener("click", limparFormulario);
btnGerarImagem.addEventListener("click", gerarImagem);

function inicializar() {
    const hoje = new Date();
    const fim = new Date(hoje);
    fim.setDate(fim.getDate() + 6);
    dataInicialInput.value = dataLocalISO(hoje);
    dataFinalInput.value = dataLocalISO(fim);
    validarPeriodo(false);
    funcionarios = [];
    renderizarCards();
    atualizarResumo();
    renderizarEscalasSalvas();
}

document.addEventListener("DOMContentLoaded", inicializar);