document.addEventListener("DOMContentLoaded", async () => {
  try {
    const response = await fetch("/api/data?entity=characters", {
      cache: "no-store"
    });

    if (!response.ok) {
      throw new Error("No fue posible cargar los personajes desde D1");
    }

    const characters = await response.json();

    if (!Array.isArray(characters)) {
      throw new Error("La API de personajes devolvió un formato inválido");
    }

    renderCharactersPage(characters);
  } catch (error) {
    console.error("Error cargando aventureros:", error);

    const container = document.getElementById("characters-list");

    if (container) {
      container.innerHTML = `
        <div class="card loading-card">
          No fue posible cargar las fichas de aventureros.
        </div>
      `;
    }
  }
});

function renderCharactersPage(characters) {
  const container =
    document.getElementById("characters-page") ||
    document.getElementById("characters-list") ||
    document.getElementById("characters-grid") ||
    document.getElementById("adventurers-grid");

  if (!container) {
    console.error("No se encontró el contenedor de aventureros en el HTML.");
    return;
  }

  const active = [...characters]
    .filter(character =>
      String(character.status || "").toLowerCase() === "activo"
    )
    .sort((a, b) => {
      const levelDifference = Number(b.level || 0) - Number(a.level || 0);

      if (levelDifference !== 0) {
        return levelDifference;
      }

      return String(a.name || "").localeCompare(
        String(b.name || ""),
        "es"
      );
    });

  if (!active.length) {
    container.innerHTML = `
      <div class="card loading-card">
        No hay aventureros activos registrados.
      </div>
    `;
    return;
  }

  container.innerHTML = active
    .map(buildCharacterCard)
    .join("");
}

function buildCharacterCard(character) {
  const name = character.name || "Sin nombre";
  const characterClass = character.class || "Clase desconocida";
  const race = character.race || "Raza desconocida";
  const player = character.player || "Jugador sin registrar";
  const level = Math.max(1, Number(character.level || 1));
  const status = character.status || "Sin estado";
  const bio = character.bio || "Sin descripción disponible.";

  const portrait = character.image
    ? `
      <img
        src="${encodeURI(character.image)}"
        alt="Retrato de ${escapeHtml(name)}"
        loading="lazy"
      >
    `
    : `
      <span class="character-initials">
        ${escapeHtml(initials(name))}
      </span>
    `;

  return `
    <a
      class="character-card-link"
      href="personaje.html?id=${encodeURIComponent(character.id)}"
    >
      <article class="card character-card">
        <div class="character-portrait">
          ${portrait}
        </div>

        <div class="character-body">
          <div class="card-topline">
            <div>
              <p class="section-kicker">
                ${escapeHtml(status)}
              </p>

              <h3>
                ${escapeHtml(name)}
              </h3>
            </div>

            <span class="status-badge status-open">
              Nivel ${level}
            </span>
          </div>

          <p class="character-level">
            ${escapeHtml(race)} · ${escapeHtml(characterClass)}
          </p>

          <p class="character-player">
            Jugador: <strong>${escapeHtml(player)}</strong>
          </p>

          <p class="character-bio-preview">
            ${escapeHtml(bio)}
          </p>

          ${character.pronunciation ? `
            <p class="muted-text">
              Pronunciación: ${escapeHtml(character.pronunciation)}
            </p>
          ` : ""}

          <span class="chronicle-link">
            Ver ficha
          </span>
        </div>
      </article>
    </a>
  `;
}

function initials(name) {
  return String(name || "?")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map(part => part.charAt(0))
    .join("")
    .toUpperCase();
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
