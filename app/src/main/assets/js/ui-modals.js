/**
 * Modais temáticos reutilizáveis (aviso e confirmação)
 * Substitui window.alert e window.confirm pelo visual do app.
 */
(function () {
    "use strict";

    function ensureAvisoModal() {
        if (document.getElementById("modalAvisoGlobal")) return;

        const html = `
<div class="modal fade" id="modalAvisoGlobal" tabindex="-1" aria-hidden="true">
  <div class="modal-dialog modal-dialog-centered">
    <div class="modal-content">
      <div class="modal-header">
        <h5 class="modal-title" id="modalAvisoGlobalTitulo">Aviso</h5>
        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Fechar"></button>
      </div>
      <div class="modal-body" id="modalAvisoGlobalMensagem"></div>
      <div class="modal-footer">
        <button type="button" class="btn btn-danger" data-bs-dismiss="modal">OK</button>
      </div>
    </div>
  </div>
</div>`;
        document.body.insertAdjacentHTML("beforeend", html);
    }

    function ensureConfirmModal() {
        if (document.getElementById("modalConfirmacaoGlobal")) return;

        const html = `
<div class="modal fade" id="modalConfirmacaoGlobal" tabindex="-1" aria-hidden="true">
  <div class="modal-dialog modal-dialog-centered">
    <div class="modal-content">
      <div class="modal-header">
        <h5 class="modal-title">Tem certeza?</h5>
        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Fechar"></button>
      </div>
      <div class="modal-body" id="modalConfirmacaoGlobalMensagem">Deseja continuar?</div>
      <div class="modal-footer">
        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
        <button type="button" class="btn btn-danger" id="modalConfirmacaoGlobalBtn">Confirmar</button>
      </div>
    </div>
  </div>
</div>`;
        document.body.insertAdjacentHTML("beforeend", html);

        let pending = null;
        document.getElementById("modalConfirmacaoGlobalBtn").addEventListener("click", () => {
            const fn = pending;
            pending = null;
            const el = document.getElementById("modalConfirmacaoGlobal");
            const inst = bootstrap.Modal.getInstance(el);
            if (inst) inst.hide();
            if (typeof fn === "function") fn();
        });
        document.getElementById("modalConfirmacaoGlobal").addEventListener("hidden.bs.modal", () => {
            pending = null;
        });

        window.__confirmacaoGlobalSetPending = function (fn) {
            pending = fn;
        };
    }

    /**
     * Aviso simples (substitui alert)
     */
    window.mostrarAviso = function (mensagem, titulo) {
        ensureAvisoModal();
        document.getElementById("modalAvisoGlobalTitulo").textContent = titulo || "Aviso";
        const body = document.getElementById("modalAvisoGlobalMensagem");
        body.textContent = mensagem || "";
        body.style.whiteSpace = "pre-line";
        bootstrap.Modal.getOrCreateInstance(document.getElementById("modalAvisoGlobal")).show();
    };

    /**
     * Confirmação (substitui confirm) – chama callback só se o usuário confirmar
     */
    window.solicitarConfirmacaoGlobal = function (mensagem, onConfirm) {
        ensureConfirmModal();
        document.getElementById("modalConfirmacaoGlobalMensagem").textContent = mensagem || "Deseja continuar?";
        window.__confirmacaoGlobalSetPending(onConfirm);
        bootstrap.Modal.getOrCreateInstance(document.getElementById("modalConfirmacaoGlobal")).show();
    };

    // Atalhos compatíveis
    window.alertTematico = window.mostrarAviso;
})();
