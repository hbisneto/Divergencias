/**
 * Navbar + Menu lateral centralizado
 * Qualquer alteração de menu deve ser feita APENAS aqui.
 */
(function () {
    "use strict";

    // =========================================================
    // CONFIGURAÇÃO DO MENU (único lugar que você altera)
    // =========================================================
    const MENU_ITEMS = [
        {
            href: "sobre.html",
            title: "Sobre o app",
            description: "Versão e informações"
        },
        {
            href: "funcionarios.html",
            title: "Funcionários",
            description: "Cadastro de colaboradores"
        },
        {
            href: "escala.html",
            title: "Escala de funcionários",
            description: "Criar e compartilhar escalas"
        },
        {
            href: "index.html",
            title: "Divergências",
            description: "Registrar nova divergência"
        },
        {
            href: "historico.html",
            title: "Histórico",
            description: "Ver divergências registradas"
        },
        {
            href: "notas.html",
            title: "Contagem de notas",
            description: "Contar cédulas e moedas"
        },
        {
            href: "configuracoes.html",
            title: "Configurações",
            description: "Preferências do aplicativo"
        }
    ];

    // =========================================================
    // DETECTA A PÁGINA ATUAL
    // =========================================================
    function getCurrentPage() {
        const path = window.location.pathname;
        const file = path.substring(path.lastIndexOf("/") + 1);
        return file || "index.html";
    }

    // =========================================================
    // GERA O HTML DO NAVBAR + OFFCANVAS
    // =========================================================
    function buildNavbar() {
        const current = getCurrentPage();

        const itemsHtml = MENU_ITEMS.map(item => {
            const isActive = item.href === current;
            const activeClass = isActive ? " active" : "";
            const aria = isActive ? ' aria-current="page"' : "";
            const descClass = isActive ? "small" : "small text-muted";

            return `
                <a href="${item.href}" class="list-group-item list-group-item-action py-3${activeClass}"${aria}>
                    <strong>${item.title}</strong>
                    <div class="${descClass}">${item.description}</div>
                </a>
            `;
        }).join("");

        return `
            <!-- NAVBAR -->
            <nav class="navbar fixed-top" data-bs-theme="dark">
                <div class="container-fluid">
                    <button class="navbar-toggler border-0" type="button"
                            data-bs-toggle="offcanvas" data-bs-target="#menuLateral"
                            aria-controls="menuLateral" aria-label="Abrir menu">
                        <span class="navbar-toggler-icon"></span>
                    </button>
                    <a class="navbar-brand fw-bold mx-auto" href="index.html">Divergências</a>
                    <div style="width: 40px;"></div>
                </div>
            </nav>

            <!-- MENU LATERAL -->
            <div class="offcanvas offcanvas-start" tabindex="-1" id="menuLateral" aria-labelledby="menuLateralLabel">
                <div class="offcanvas-header">
                    <h5 class="offcanvas-title text-white fw-bold" id="menuLateralLabel">Divergências</h5>
                    <button type="button" class="btn-close btn-close-white" data-bs-dismiss="offcanvas" aria-label="Fechar"></button>
                </div>
                <div class="offcanvas-body p-0">
                    <div class="list-group list-group-flush">
                        ${itemsHtml}
                    </div>
                </div>
            </div>
        `;
    }

    // =========================================================
    // INJETA O NAVBAR NA PÁGINA
    // =========================================================
    function injectNavbar() {
        const placeholder = document.getElementById("app-navbar");
        if (!placeholder) {
            console.warn("[navbar.js] Elemento #app-navbar não encontrado.");
            return;
        }
        placeholder.innerHTML = buildNavbar();
    }

    // Executa assim que o DOM estiver pronto
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", injectNavbar);
    } else {
        injectNavbar();
    }
})();