const historico =
    document.getElementById("historico");


function centavosParaMoeda(centavos) {

    return (
        Number(centavos) / 100
    )
        .toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL"
        });

}


function formatarData(dataHora) {

    const data =
        new Date(Number(dataHora));

    return data.toLocaleString(
        "pt-BR",
        {
            dateStyle: "short",
            timeStyle: "short"
        }
    );

}


function carregarHistorico() {

    try {

        const json =
            Android.listar();

        const divergencias =
            JSON.parse(json);

        renderizarHistorico(
            divergencias
        );

    } catch (error) {

        console.error(
            "Erro ao carregar histórico:",
            error
        );

        historico.innerHTML = `
            <div class="alert alert-danger">
                Não foi possível carregar o histórico.
            </div>
        `;

    }

}


function renderizarHistorico(
    divergencias
) {

    if (
        !divergencias ||
        divergencias.length === 0
    ) {

        historico.innerHTML = `
            <div class="text-center py-5">

                <div class="text-muted mb-3">
                    Nenhuma divergência registrada.
                </div>

                <a
                    href="index.html"
                    class="btn btn-primary"
                >
                    Calcular divergência
                </a>

            </div>
        `;

        return;

    }


    historico.innerHTML =
        divergencias.map(item => `

            <div class="card mb-3 shadow-sm">

                <div class="card-body">

                    <div
                        class="d-flex
                               justify-content-between
                               align-items-start
                               flex-wrap
                               gap-3"
                    >

                        <div>

                            <div class="text-muted small">
                                Divergência
                            </div>

                            <div class="fs-4 fw-bold">
                                ${centavosParaMoeda(
                                    item.divergencia
                                )}
                            </div>

                            <div class="text-muted small mt-1">
                                ${formatarData(
                                    item.dataHora
                                )}
                            </div>

                        </div>

                    </div>


                    <hr>


                    <div class="row g-3">

                        <div class="col-12 col-md-4">

                            <div class="text-muted small">
                                Valor original
                            </div>

                            <div class="fw-semibold">
                                ${centavosParaMoeda(
                                    item.valorOriginal
                                )}
                            </div>

                        </div>


                        <div class="col-12 col-md-4">

                            <div class="text-muted small">
                                Quantidade
                            </div>

                            <div class="fw-semibold">
                                ${item.quantidade}
                            </div>

                        </div>


                        <div class="col-12 col-md-4">

                            <div class="text-muted small">
                                Valor promocional
                            </div>

                            <div class="fw-semibold">
                                ${centavosParaMoeda(
                                    item.valorPromocional
                                )}
                            </div>

                        </div>

                    </div>

                </div>

            </div>

        `).join("");

}


document.addEventListener(
    "DOMContentLoaded",
    function() {

        carregarHistorico();

    }
);
