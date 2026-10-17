"use strict";

const CHAVE_FUNCIONARIOS = "divergencias_funcionarios_v1";

const listaEl = document.getElementById("listaFuncionariosCadastrados");
const formEl = document.getElementById("formularioFuncionario");
const tituloForm = document.getElementById("tituloFormulario");
const inputCracha = document.getElementById("inputCracha");
const inputNome = document.getElementById("inputNome");
const selectCargo = document.getElementById("selectCargo");
const mensagemEl = document.getElementById("mensagemFuncionarios");

const btnNovo = document.getElementById("btnNovo");
const btnSalvar = document.getElementById("btnSalvarFunc");
const btnCancelar = document.getElementById("btnCancelarForm");
const btnConfirmarExcluir = document.getElementById("btnConfirmarExcluir");

const modalExcluir = new bootstrap.Modal(document.getElementById("modalExcluirFunc"));
const textoExcluir = document.getElementById("textoExcluirFunc");

let editandoCracha = null;
let crachaParaExcluir = null;

function temAndroid() {
    return typeof Android !== "undefined" &&
           typeof Android.listarFuncionarios === "function";
}

function mostrarMensagem(texto, tipo = "success") {
    mensagemEl.textContent = texto;
    mensagemEl.className = `alert alert-${tipo} mt-3`;
    mensagemEl.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function limparMensagem() {
    mensagemEl.textContent = "";
    mensagemEl.className = "alert d-none mt-3";
}

/* ---------- Persistência ---------- */

function carregarLocal() {
    try {
        const txt = localStorage.getItem(CHAVE_FUNCIONARIOS);
        if (!txt) return [];
        const dados = JSON.parse(txt);
        return Array.isArray(dados) ? dados : [];
    } catch (e) {
        return [];
    }
}

function salvarLocal(lista) {
    try {
        localStorage.setItem(CHAVE_FUNCIONARIOS, JSON.stringify(lista));
        return true;
    } catch (e) {
        return false;
    }
}

async function listarFuncionarios() {
    if (temAndroid()) {
        try {
            const raw = Android.listarFuncionarios();
            const dados = JSON.parse(raw || "[]");
            return Array.isArray(dados) ? dados : [];
        } catch (e) {
            console.error(e);
        }
    }
    return carregarLocal();
}

async function salvarFuncionario(cracha, nome, cargo) {
    if (temAndroid()) {
        try {
            const raw = Android.salvarFuncionario(cracha, nome, cargo);
            const resp = JSON.parse(raw || "{}");
            return resp.ok === true;
        } catch (e) {
            console.error(e);
            return false;
        }
    }
    // localStorage
    const lista = carregarLocal();
    const idx = lista.findIndex(f => String(f.cracha) === String(cracha));
    const item = { cracha: String(cracha).trim(), nome: nome.trim(), cargo: cargo.trim() };
    if (idx >= 0) {
        lista[idx] = item;
    } else {
        lista.push(item);
    }
    lista.sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
    return salvarLocal(lista);
}

async function excluirFuncionario(cracha) {
    if (temAndroid()) {
        try {
            const raw = Android.excluirFuncionario(cracha);
            const resp = JSON.parse(raw || "{}");
            return resp.ok === true;
        } catch (e) {
            console.error(e);
            return false;
        }
    }
    const lista = carregarLocal().filter(f => String(f.cracha) !== String(cracha));
    return salvarLocal(lista);
}

/* ---------- UI ---------- */

function abrirFormulario(funcionario = null) {
    formEl.classList.remove("d-none");
    limparMensagem();

    if (funcionario) {
        tituloForm.textContent = "Editar funcionário";
        inputCracha.value = funcionario.cracha;
        inputCracha.readOnly = true;
        inputNome.value = funcionario.nome;
        selectCargo.value = funcionario.cargo;
        editandoCracha = funcionario.cracha;
    } else {
        tituloForm.textContent = "Novo funcionário";
        inputCracha.value = "";
        inputCracha.readOnly = false;
        inputNome.value = "";
        selectCargo.value = "";
        editandoCracha = null;
    }
    inputNome.focus();
}

function fecharFormulario() {
    formEl.classList.add("d-none");
    editandoCracha = null;
}

async function renderizarLista() {
    const lista = await listarFuncionarios();
    listaEl.replaceChildren();

    if (lista.length === 0) {
        const vazio = document.createElement("div");
        vazio.className = "text-muted text-center py-4";
        vazio.textContent = "Nenhum funcionário cadastrado.";
        listaEl.appendChild(vazio);
        return;
    }

    lista.forEach(func => {
        const card = document.createElement("div");
        card.className = "funcionario-item";

        const topo = document.createElement("div");
        topo.className = "d-flex justify-content-between align-items-start gap-2";

        const info = document.createElement("div");
        const nome = document.createElement("div");
        nome.className = "nome";
        nome.textContent = func.nome;

        const meta = document.createElement("div");
        meta.className = "meta";
        meta.innerHTML = `Crachá: <strong>${func.cracha}</strong>`;

        const badge = document.createElement("span");
        badge.className = "badge badge-cargo ms-1";
        badge.textContent = func.cargo;

        info.append(nome, meta);
        meta.appendChild(badge);

        const acoes = document.createElement("div");
        acoes.className = "d-flex gap-1";

        const btnEditar = document.createElement("button");
        btnEditar.type = "button";
        btnEditar.className = "btn btn-outline-primary btn-sm";
        btnEditar.textContent = "Editar";
        btnEditar.addEventListener("click", () => abrirFormulario(func));

        const btnExcluir = document.createElement("button");
        btnExcluir.type = "button";
        btnExcluir.className = "btn btn-outline-danger btn-sm";
        btnExcluir.textContent = "Excluir";
        btnExcluir.addEventListener("click", () => {
            crachaParaExcluir = func.cracha;
            textoExcluir.textContent =
                `Deseja realmente excluir ${func.nome} (crachá ${func.cracha})?`;
            modalExcluir.show();
        });

        acoes.append(btnEditar, btnExcluir);
        topo.append(info, acoes);
        card.appendChild(topo);
        listaEl.appendChild(card);
    });
}

/* ---------- Eventos ---------- */

btnNovo.addEventListener("click", () => abrirFormulario());

btnCancelar.addEventListener("click", fecharFormulario);

btnSalvar.addEventListener("click", async () => {
    limparMensagem();

    const cracha = inputCracha.value.trim();
    const nome = inputNome.value.trim();
    const cargo = selectCargo.value;

    if (!cracha) {
        mostrarMensagem("Informe o número do crachá.", "warning");
        inputCracha.focus();
        return;
    }
    if (!nome) {
        mostrarMensagem("Informe o nome do funcionário.", "warning");
        inputNome.focus();
        return;
    }
    if (!cargo) {
        mostrarMensagem("Selecione o cargo.", "warning");
        selectCargo.focus();
        return;
    }

    // Se for novo, verifica duplicidade no local
    if (!editandoCracha) {
        const existentes = await listarFuncionarios();
        if (existentes.some(f => String(f.cracha) === cracha)) {
            mostrarMensagem("Já existe um funcionário com este crachá.", "warning");
            return;
        }
    }

    const ok = await salvarFuncionario(cracha, nome, cargo);
    if (!ok) {
        mostrarMensagem("Não foi possível salvar o funcionário.", "danger");
        return;
    }

    fecharFormulario();
    await renderizarLista();
    mostrarMensagem("Funcionário salvo com sucesso.", "success");
});

btnConfirmarExcluir.addEventListener("click", async () => {
    if (!crachaParaExcluir) return;
    const ok = await excluirFuncionario(crachaParaExcluir);
    modalExcluir.hide();
    crachaParaExcluir = null;

    if (!ok) {
        mostrarMensagem("Não foi possível excluir.", "danger");
        return;
    }
    await renderizarLista();
    mostrarMensagem("Funcionário excluído.", "success");
});

document.addEventListener("DOMContentLoaded", () => {
    renderizarLista();
});