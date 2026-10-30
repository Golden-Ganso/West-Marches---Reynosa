document.addEventListener("DOMContentLoaded", async () => {

    try {

        const response = await fetch(
            "data/chronicles.json"
        );

        if (!response.ok) {
            throw new Error(
                "No fue posible cargar chronicles.json"
            );
        }

        const chronicles = await response.json();

        renderChroniclesPage(chronicles);

    } catch (error) {

        console.error(
            "Error cargando las crónicas:",
            error
        );

        document.getElementById(
            "chronicles-page"
        ).innerHTML = `
            <div class="card loading-card">
                No fue posible cargar las crónicas.
            </div>
        `;

    }

});


function renderChroniclesPage(chronicles) {

    const container =
        document.getElementById("chronicles-page");

    const sorted = [...chronicles]
        .sort(
            (a, b) =>
                parseLocalDate(b.date)
                - parseLocalDate(a.date)
        );


    if (!sorted.length) {

        container.innerHTML = `
            <div class="card loading-card">
                Todavía no existen crónicas.
            </div>
        `;

        return;

    }


    container.innerHTML = sorted
        .map(item => {

            const participants =
                Array.isArray(item.participants)
                && item.participants.length
                    ? item.participants.join(", ")
                    : "No registrados";


            const image = item.image
                ? `
                    <div class="chronicle-full-image">

                        <img
                            src="${encodeURI(item.image)}"
                            alt="Ilustración de ${escapeHtml(item.title)}"
                            loading="lazy"
                        >

                    </div>
                `
                : "";


            return `

                <article
                    class="card chronicle-full"
                    id="cronica-${item.id}"
                >

                    ${image}


                    <div class="chronicle-full-content">

                        <p class="section-kicker">
                            Expedición #${escapeHtml(
                                String(item.session ?? "?")
                            )}
                        </p>


                        <h2>
                            ${escapeHtml(item.title)}
                        </h2>


                        <div class="chronicle-metadata">

                            <span>
                                <strong>Fecha:</strong>
                                ${formatDate(item.date)}
                            </span>


                            <span>
                                <strong>Reporte:</strong>
                                ${escapeHtml(
                                    item.author || "Anónimo"
                                )}
                            </span>


                            <span>
                                <strong>Participantes:</strong>
                                ${escapeHtml(participants)}
                            </span>

                        </div>


                        <div class="chronicle-text">
                            ${escapeHtml(
                                item.summary || ""
                            )}
                        </div>

                    </div>

                </article>

            `;

        })
        .join("");

}


function parseLocalDate(dateString) {

    return new Date(
        `${dateString}T12:00:00`
    );

}


function formatDate(dateString) {

    return parseLocalDate(dateString)
        .toLocaleDateString(
            "es-MX",
            {
                day: "numeric",
                month: "long",
                year: "numeric"
            }
        );

}


function escapeHtml(value) {

    return String(value ?? "")

        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

}