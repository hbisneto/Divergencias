const campos = document.querySelectorAll(".quantidade");
const valorTotal = document.getElementById("valorTotal");

/**
 * Formata centavos para moeda brasileira.
 */
function formatarMoeda(centavos) {
    return (centavos / 100).toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL"
    });
}

/**
 * Mapa de id do input → id do elemento de subtotal
 */
const mapaTotais = {
    nota100: "total100",
    nota50: "total50",
    nota20: "total20",
    nota10: "total10",
    nota5: "total5",
    nota2: "total2",
    moeda1: "total1",
    moeda50: "total50centavos",
    moeda25: "total25centavos",
    moeda10: "total10centavos",
    moeda5: "total5centavos"
};

/**
 * Calcula todos os valores.
 */
function calcularTotal() {
    let totalCentavos = 0;

    campos.forEach(function (campo) {
        const quantidade = parseInt(campo.value, 10) || 0;
        const valorCentavos = parseInt(campo.dataset.valor, 10) || 0;
        const subtotalCentavos = quantidade * valorCentavos;

        totalCentavos += subtotalCentavos;

        const totalId = mapaTotais[campo.id];
        if (totalId) {
            document.getElementById(totalId).textContent =
                formatarMoeda(subtotalCentavos);
        }
    });

    valorTotal.textContent = formatarMoeda(totalCentavos);
}

/**
 * Recalcula sempre que o usuário alterar qualquer quantidade.
 */
campos.forEach(function (campo) {
    campo.addEventListener("input", calcularTotal);
});

/**
 * Calcula uma vez ao carregar a página.
 */
calcularTotal();