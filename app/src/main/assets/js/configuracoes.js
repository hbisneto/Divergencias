const STORAGE_KEY = "divergencias_config";

const DEFAULT_CONFIG = {
    interface: {
        codigoProduto: false,
        pdv: false,
        descricao: false,
        valorTotal: false,
        motivo: false
    }
};

function carregarConfig() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return structuredClone(DEFAULT_CONFIG);

        const parsed = JSON.parse(raw);
        return {
            interface: { ...DEFAULT_CONFIG.interface, ...parsed.interface }
        };
    } catch (e) {
        console.error("Erro ao ler configurações:", e);
        return structuredClone(DEFAULT_CONFIG);
    }
}

function salvarConfig(config) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
}

function aplicarNoFormulario(config) {
    document.getElementById("cfg_codigoProduto").checked = config.interface.codigoProduto;
    document.getElementById("cfg_pdv").checked           = config.interface.pdv;
    document.getElementById("cfg_descricao").checked     = config.interface.descricao;
    document.getElementById("cfg_valorTotal").checked    = config.interface.valorTotal;
    document.getElementById("cfg_motivo").checked        = config.interface.motivo;

    // Parte do tema (nova)
    if (window.Theme) {
        const theme = Theme.carregarTheme();

        const radioTeal = document.getElementById("accentTeal");
        const radioRed  = document.getElementById("accentRed");
        if (radioTeal) radioTeal.checked = theme.accent === "#006F83";
        if (radioRed)  radioRed.checked  = theme.accent === "#b6202f";

        const darkSwitch = document.getElementById("cfg_darkMode");
        if (darkSwitch) darkSwitch.checked = theme.mode === "dark";
    }
}

function lerDoFormulario() {
    return {
        interface: {
            codigoProduto: document.getElementById("cfg_codigoProduto").checked,
            pdv:           document.getElementById("cfg_pdv").checked,
            descricao:     document.getElementById("cfg_descricao").checked,
            valorTotal:    document.getElementById("cfg_valorTotal").checked,
            motivo:        document.getElementById("cfg_motivo").checked
        }
    };
}

document.getElementById("btnSalvar").addEventListener("click", () => {
    // 1. Lê a parte de interface
    const config = lerDoFormulario();
    salvarConfig(config);

    // 2. Lê e salva a parte de tema
    if (window.Theme) {
        const accent = document.querySelector('input[name="accentColor"]:checked')?.value || "#006F83";
        const mode   = document.getElementById("cfg_darkMode")?.checked ? "dark" : "light";

        Theme.salvarTheme({ accent, mode });
        Theme.aplicarTheme({ accent, mode });
    }

    // Novo: salva o lembrete
    salvarLembreteDoFormulario();

    // 3. Mostra mensagem de sucesso
    const msg = document.getElementById("mensagemSucesso");
    msg.classList.remove("d-none");
    setTimeout(() => msg.classList.add("d-none"), 2500);
});

document.getElementById("btnResetar").addEventListener("click", () => {
    if (confirm("Restaurar todas as configurações para o padrão?")) {
        // Restaura interface
        salvarConfig(DEFAULT_CONFIG);
        aplicarNoFormulario(DEFAULT_CONFIG);

        // Restaura tema
        if (window.Theme) {
            Theme.salvarTheme(Theme.DEFAULT_THEME);
            Theme.aplicarTheme(Theme.DEFAULT_THEME);
        }

        // Restaura lembrete (desativa)
        document.getElementById("cfg_lembreteAtivo").checked = false;
        document.getElementById("lembreteOpcoes").classList.add("d-none");
        document.getElementById("cfg_lembreteHora").value = "18:00";
        renderizarDiasLembrete([1, 2, 3, 4, 5]); // segunda a sexta

        if (temAndroidLembrete()) {
            Android.salvarLembrete(false, 18, 0, "1,2,3,4,5");
        }
    }
});






/* =========================================================
   LEMBRETE
   ========================================================= */

const DIAS_SEMANA = [
    { valor: 0, nome: "Domingo" },
    { valor: 1, nome: "Segunda-feira" },
    { valor: 2, nome: "Terça-feira" },
    { valor: 3, nome: "Quarta-feira" },
    { valor: 4, nome: "Quinta-feira" },
    { valor: 5, nome: "Sexta-feira" },
    { valor: 6, nome: "Sábado" }
];

function temAndroidLembrete() {
    return typeof Android !== "undefined" &&
           typeof Android.salvarLembrete === "function" &&
           typeof Android.obterLembrete === "function";
}

function renderizarDiasLembrete(diasAtivos = []) {
    const container = document.getElementById("lembreteListaDias");
    if (!container) return;
    container.innerHTML = "";

    DIAS_SEMANA.forEach(dia => {
        const wrap = document.createElement("div");
        wrap.className = "form-check";

        const cb = document.createElement("input");
        cb.type = "checkbox";
        cb.className = "form-check-input";
        cb.value = dia.valor;
        cb.id = `lembrete-dia-${dia.valor}`;
        cb.checked = diasAtivos.includes(dia.valor);

        const lab = document.createElement("label");
        lab.className = "form-check-label";
        lab.htmlFor = cb.id;
        lab.textContent = dia.nome;

        wrap.append(cb, lab);
        container.appendChild(wrap);
    });
}

function carregarLembrete() {
    if (!temAndroidLembrete()) {
        // fallback local (só para teste no navegador)
        renderizarDiasLembrete([1,2,3,4,5]);
        return;
    }

    try {
        const raw = Android.obterLembrete();
        const dados = JSON.parse(raw || "{}");

        const ativo = !!dados.ativo;
        document.getElementById("cfg_lembreteAtivo").checked = ativo;
        document.getElementById("lembreteOpcoes").classList.toggle("d-none", !ativo);

        const hora = String(dados.hora ?? 18).padStart(2, "0");
        const minuto = String(dados.minuto ?? 0).padStart(2, "0");
        document.getElementById("cfg_lembreteHora").value = `${hora}:${minuto}`;

        const dias = (dados.dias || "1,2,3,4,5")
            .split(",")
            .map(d => parseInt(d.trim(), 10))
            .filter(n => !isNaN(n));

        renderizarDiasLembrete(dias);
    } catch (e) {
        console.error("Erro ao carregar lembrete:", e);
        renderizarDiasLembrete([1,2,3,4,5]);
    }
}

function salvarLembreteDoFormulario() {
    const ativo = document.getElementById("cfg_lembreteAtivo").checked;
    const horaStr = document.getElementById("cfg_lembreteHora").value || "18:00";
    const [h, m] = horaStr.split(":").map(Number);

    const diasMarcados = [...document.querySelectorAll("#lembreteListaDias input[type=checkbox]:checked")]
        .map(cb => cb.value)
        .join(",");

    if (ativo && !diasMarcados) {
        alert("Marque pelo menos um dia da semana.");
        return false;
    }

    if (!temAndroidLembrete()) {
        console.warn("Android bridge não disponível");
        return true;
    }

    try {
        const resultado = Android.salvarLembrete(ativo, h || 18, m || 0, diasMarcados || "1,2,3,4,5");
        const json = JSON.parse(resultado || "{}");
        if (!json.ok) {
            alert("Erro ao salvar lembrete: " + (json.erro || "desconhecido"));
            return false;
        }
        return true;
    } catch (e) {
        console.error(e);
        alert("Erro ao comunicar com o aplicativo nativo.");
        return false;
    }
}


// Liga/desliga as opções do lembrete
document.getElementById("cfg_lembreteAtivo")?.addEventListener("change", (e) => {
    document.getElementById("lembreteOpcoes").classList.toggle("d-none", !e.target.checked);
});

document.addEventListener("DOMContentLoaded", () => {
    const config = carregarConfig();
    aplicarNoFormulario(config);
    carregarLembrete();
});