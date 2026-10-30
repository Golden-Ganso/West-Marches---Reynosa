document.addEventListener("DOMContentLoaded", async () => {

    try {

        const [
            sessionsResponse,
            charactersResponse,
            chroniclesResponse,
            rumorsResponse,
            worldResponse
        ] = await Promise.all([
            fetch("data/sessions.json"),
            fetch("data/characters.json"),
            fetch("data/chronicles.json"),
            fetch("data/rumors.json"),
            fetch("data/world.json")
        ]);

        const sessions = await sessionsResponse.json();
        const characters = await charactersResponse.json();
        const chronicles = await chroniclesResponse.json();
        const rumors = await rumorsResponse.json();
        const world = await worldResponse.json();

        renderNextSession(sessions);
        renderCharacters(characters);
        renderChronicles(chronicles);
        renderRumors(rumors);
        renderWorld(world);

    } catch (error) {

        console.error("Error cargando los datos de la campaña:", error);

    }

});


function renderNextSession(sessions) {

    const container = document.getElementById("next-session");

    if (!sessions.length) {
        container.innerHTML = "<p>No hay expediciones programadas.</p>";
        return;
    }

    const upcoming = sessions
        .filter(session => session.status === "open")
        .sort((a, b) => new Date(a.date) - new Date(b.date));

    if (!upcoming.length) {
        container.innerHTML = "<p>No hay expediciones abiertas actualmente.</p>";
        return;
    }

    const session = upcoming[0];

    const occupied = session.players.length;

    const available = session.slots - occupied;

    const date = new Date(
        session.date + "T12:00:00"
    ).toLocaleDateString("es-MX", {
        day: "numeric",
        month: "long",
        year: "numeric"
    });

    container.innerHTML = `
        <h3>${session.title}</h3>

        <p><strong>Fecha:</strong> ${date}</p>

        <p><strong>Hora:</strong> ${session.time}</p>

        <p>
            <strong>Cupos:</strong>
            ${occupied} / ${session.slots}
        </p>

        <p>
            <strong>Disponibles:</strong>
            ${available}
        </p>

        <p>
            <strong>Nivel recomendado:</strong>
            ${session.level}
        </p>

        <p>${session.description}</p>

        <a href="#" class="button">
            Ver expedición
        </a>
    `;
}


function renderCharacters(characters) {

    const active = characters.filter(
        character => character.status === "Activo"
    );

    document.getElementById("active-characters").textContent =
        active.length;
}


function renderChronicles(chronicles) {

    const container = document.getElementById("chronicles-list");

    container.innerHTML = "";

    chronicles
        .slice(-3)
        .reverse()
        .forEach(chronicle => {

            const item = document.createElement("li");

            item.textContent = chronicle.title;

            container.appendChild(item);

        });
}


function renderRumors(rumors) {

    const container = document.getElementById("rumors-list");

    container.innerHTML = "";

    rumors
        .filter(rumor => rumor.status === "Sin investigar")
        .slice(0, 3)
        .forEach(rumor => {

            const item = document.createElement("li");

            item.textContent = rumor.title;

            container.appendChild(item);

        });
}


function renderWorld(world) {

    const progress = document.getElementById("world-progress");

    progress.style.width =
        Math.max(0, Math.min(100, world.exploration)) + "%";

    document.getElementById("world-percentage").textContent =
        world.exploration + "% descubierto";

    document.getElementById("expedition-count").textContent =
        world.completedExpeditions;

    document.getElementById("location-count").textContent =
        world.discoveredLocations;

    document.getElementById("artifact-count").textContent =
        world.artifactsFound;

}
