/**
 * theme.js – Sistema de temas do Divergências
 * Responsável apenas por accent color + light/dark mode.
 * Conversa com localStorage via a chave compartilhada.
 */

const THEME_STORAGE_KEY = "divergencias_config";

const DEFAULT_THEME = {
    accent: "#006F83",   // novo padrão
    mode: "light"        // "light" | "dark"
};

const ACCENT_OPTIONS = {
    teal: "#006F83",
    red:  "#b6202f"
};

/**
 * Lê a configuração completa e devolve só a parte de theme
 * (com fallback para o padrão).
 */
function carregarTheme() {
    try {
        const raw = localStorage.getItem(THEME_STORAGE_KEY);
        if (!raw) return { ...DEFAULT_THEME };

        const parsed = JSON.parse(raw);
        return {
            ...DEFAULT_THEME,
            ...(parsed.theme || {})
        };
    } catch (e) {
        console.error("Erro ao carregar theme:", e);
        return { ...DEFAULT_THEME };
    }
}

/**
 * Salva apenas a seção theme, preservando o resto da config.
 */
function salvarTheme(theme) {
    try {
        const raw = localStorage.getItem(THEME_STORAGE_KEY);
        const config = raw ? JSON.parse(raw) : {};
        config.theme = { ...DEFAULT_THEME, ...theme };
        localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(config));
    } catch (e) {
        console.error("Erro ao salvar theme:", e);
    }
}

/**
 * Aplica o tema no documento (CSS variables + data-theme).
 */
function aplicarTheme(theme = null) {
    const t = theme || carregarTheme();
    const root = document.documentElement;

    // Accent
    root.style.setProperty("--accent", t.accent);

    // Calcula um hover um pouco mais escuro (simples)
    // (pode melhorar depois com uma função de darken)
    root.style.setProperty("--accent-hover", t.accent);

    // Mode
    if (t.mode === "dark") {
        root.setAttribute("data-theme", "dark");
    } else {
        root.removeAttribute("data-theme");
    }
}

/**
 * Atalho: carrega e aplica imediatamente.
 * Deve ser chamado em toda página no DOMContentLoaded.
 */
function initTheme() {
    aplicarTheme();
}

// Exporta para uso em outros arquivos (configuracoes.js, etc.)
window.Theme = {
    DEFAULT_THEME,
    ACCENT_OPTIONS,
    carregarTheme,
    salvarTheme,
    aplicarTheme,
    initTheme
};

// document.addEventListener("DOMContentLoaded", () => {
//     if (window.Theme) Theme.initTheme();
// });

// =========================================================
// Auto-inicialização
// =========================================================
document.addEventListener("DOMContentLoaded", function () {
    aplicarTheme();
});