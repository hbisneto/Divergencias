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
    const config = lerDoFormulario();
    salvarConfig(config);

    const msg = document.getElementById("mensagemSucesso");
    msg.classList.remove("d-none");
    setTimeout(() => msg.classList.add("d-none"), 2500);
});

document.getElementById("btnResetar").addEventListener("click", () => {
    if (confirm("Restaurar todas as configurações para o padrão?")) {
        salvarConfig(DEFAULT_CONFIG);
        aplicarNoFormulario(DEFAULT_CONFIG);
    }
});

document.addEventListener("DOMContentLoaded", () => {
    const config = carregarConfig();
    aplicarNoFormulario(config);
});