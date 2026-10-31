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
    }
});

document.addEventListener("DOMContentLoaded", () => {
    const config = carregarConfig();
    aplicarNoFormulario(config);
});