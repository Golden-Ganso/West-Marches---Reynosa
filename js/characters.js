document.addEventListener("DOMContentLoaded", async () => {
  try {
    const [charactersResponse, sessionsResponse] = await Promise.all([
      fetch("data/characters.json"),
      fetch("data/sessions.json")
    ]);
    if (!charactersResponse.ok || !sessionsResponse.ok) throw new Error("No fue posible cargar los datos");
    const characters = await charactersResponse.json();
    const sessions = await sessionsResponse.json();
    renderCharactersPage(characters, sessions);
  } catch (error) {
    console.error(error);
    document.getElementById("characters-page").innerHTML = `<div class="card loading-card">No fue posible cargar los aventureros.</div>`;
  }
});

function renderCharactersPage(characters, sessions) {
  const container = document.getElementById("characters-page");
  container.innerHTML = characters.map(character => {
    const history = Array.isArray(character.history) ? [...character.history].sort((a,b) => parseLocalDate(b.date) - parseLocalDate(a.date)) : [];
    const sessionCount = sessions.filter(session => sessionHasCharacter(session, character)).length;
    const initials = String(character.name || "?").split(/\s+/).slice(0,2).map(p => p[0]).join("").toUpperCase();
    const portrait = character.image
      ? `<img src="${encodeURI(character.image)}" alt="Retrato de ${escapeHtml(character.name)}" loading="lazy">`
      : `<span>${escapeHtml(initials)}</span>`;

    return `
  <article
    class="card character-profile"
    id="personaje-${character.id}"
  >

    <div class="profile-header">

      <div class="profile-portrait">
        ${portrait}
      </div>

      <div class="profile-summary">

        <p class="section-kicker">
          ${escapeHtml(character.status || "Sin estado")}
        </p>

        <h2>
          ${escapeHtml(character.name || "Sin nombre")}
        </h2>

        <p>
          <strong>
            ${escapeHtml(character.race || "Raza desconocida")}
          </strong>
          · ${escapeHtml(character.class || "Clase desconocida")}
          · Nivel ${Number(character.level || 1)}
        </p>

        <p>
          Jugador:
          ${escapeHtml(character.player || "Sin registrar")}
        </p>

        <div class="profile-stat">
          <strong>${sessionCount}</strong>
          <span>expediciones registradas</span>
        </div>

        <p>
          <a
            href="personaje.html?id=${encodeURIComponent(character.id)}"
            class="chronicle-link"
          >
            Ver ficha completa
          </a>
        </p>

      </div>

    </div>

    <div class="profile-history">

      <h3>Historial reciente</h3>

      ${
        history.length

          ? history
              .slice(0, 2)
              .map(item => `
                <div class="history-entry">

                  <p class="section-kicker">
                    Expedición #${escapeHtml(item.session ?? "?")}
                    · ${formatDate(item.date)}
                  </p>

                  <h4>
                    ${escapeHtml(
                      item.title || "Registro de expedición"
                    )}
                  </h4>

                  <p>
                    ${escapeHtml(item.note || "Sin notas.")}
                  </p>

                </div>
              `)
              .join("")

          : `
              <p class="muted-text">
                Todavía no hay eventos registrados
                para este personaje.
              </p>
            `
      }

    </div>

  </article>
`;
  }).join("");
}

function sessionHasCharacter(session, character) {
  const players = Array.isArray(session.players) ? session.players : [];
  const ids = Array.isArray(session.characterIds) ? session.characterIds : [];
  return ids.includes(character.id) || players.includes(character.name);
}
function parseLocalDate(value) { return new Date(`${value}T12:00:00`); }
function formatDate(value) { return parseLocalDate(value).toLocaleDateString("es-MX", { day:"numeric", month:"long", year:"numeric" }); }
function escapeHtml(value) { return String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;"); }
