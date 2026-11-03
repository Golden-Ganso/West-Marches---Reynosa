document.addEventListener("DOMContentLoaded", async () => {
  try {
    const characterId = Number(new URLSearchParams(window.location.search).get("id"));
    if (!Number.isInteger(characterId) || characterId <= 0) {
      throw new Error("ID de personaje inválido");
    }

    const responses = await Promise.all([
      fetch("data/characters.json"),
      fetch("data/sessions.json"),
      fetch("data/chronicles.json"),
      fetch("data/bestiary.json"),
      fetch("data/factions.json")
    ]);

    if (responses.some(response => !response.ok)) {
      throw new Error("No fue posible cargar los datos de la ficha");
    }

    const [characters, sessions, chronicles, bestiary, factions] = await Promise.all(
      responses.map(response => response.json())
    );

    const character = characters.find(item => Number(item.id) === characterId);
    if (!character) throw new Error("Personaje no encontrado");

    renderCharacterDetail(character, sessions, chronicles, bestiary, factions);
  } catch (error) {
    console.error(error);
    document.getElementById("character-detail").innerHTML = `
      <div class="card loading-card">No fue posible cargar la ficha del personaje.</div>
    `;
  }
});

function renderCharacterDetail(character, sessions, chronicles, bestiary, factions) {
  const relatedSessions = sessions
    .filter(session => sessionHasCharacter(session, character))
    .sort((a,b) => parseLocalDate(b.date) - parseLocalDate(a.date));

  const completedSessions = relatedSessions.filter(session => session.status === "completed");
  const relatedChronicles = chronicles
    .filter(item => chronicleHasCharacter(item, character))
    .sort((a,b) => parseLocalDate(b.date) - parseLocalDate(a.date));

  const relatedBestiary = bestiary.filter(creature => relatedSessions.some(session => Number(session.id) === Number(creature.firstSeen)));
  const relatedFactions = factions.filter(faction => relatedSessions.some(session => Number(session.id) === Number(faction.firstContact)));
  const history = Array.isArray(character.history) ? [...character.history].sort((a,b) => parseLocalDate(b.date) - parseLocalDate(a.date)) : [];
  const achievements = Array.isArray(character.achievements) ? character.achievements : [];

  const portrait = character.image
    ? `<img src="${encodeURI(character.image)}" alt="Retrato de ${escapeHtml(character.name)}">`
    : `<span>${escapeHtml(initials(character.name))}</span>`;

  document.title = `${character.name} | West Marches Reynosa`;

  document.getElementById("character-detail").innerHTML = `
    <section class="card character-detail-hero">
      <div class="character-detail-portrait">${portrait}</div>
      <div class="character-detail-summary">
        <p class="section-kicker">${escapeHtml(character.status || "Sin estado")}</p>
        <h2>${escapeHtml(character.name || "Sin nombre")}</h2>
        <p class="character-detail-class">${escapeHtml(character.race || "Raza desconocida")} · ${escapeHtml(character.class || "Clase desconocida")} · Nivel ${Number(character.level || 1)}</p>
        <p>Jugador: <strong>${escapeHtml(character.player || "Sin registrar")}</strong></p>
        ${character.bio ? `<p class="character-bio">${escapeHtml(character.bio)}</p>` : ""}
        <div class="character-detail-stats">
          <div><strong>${relatedSessions.length}</strong><span>Expediciones</span></div>
          <div><strong>${completedSessions.length}</strong><span>Finalizadas</span></div>
          <div><strong>${relatedBestiary.length}</strong><span>Criaturas</span></div>
          <div><strong>${relatedFactions.length}</strong><span>Facciones</span></div>
        </div>
      </div>
    </section>

    <section class="section-block character-detail-section">
      <div class="section-heading"><div><p class="section-kicker">Bitácora personal</p><h2>Historial</h2></div></div>
      <div class="card detail-panel">
        ${history.length ? history.map(item => `
          <article class="history-entry">
            <p class="section-kicker">Expedición #${escapeHtml(item.session ?? "?")} · ${formatDate(item.date)}</p>
            <h3>${escapeHtml(item.title || "Registro de expedición")}</h3>
            <p>${escapeHtml(item.note || "Sin notas.")}</p>
            <a class="chronicle-link" href="expediciones.html">Ver archivo de expediciones</a>
          </article>`).join("") : `<p class="muted-text">Todavía no hay eventos narrativos registrados.</p>`}
      </div>
    </section>

    <section class="section-block character-detail-columns">
      <article class="card detail-panel">
        <p class="section-kicker">Archivo</p><h2>Crónicas relacionadas</h2>
        ${relatedChronicles.length ? relatedChronicles.map(item => `
          <div class="detail-list-item">
            <strong>${escapeHtml(item.title || "Crónica")}</strong>
            <span>${formatDate(item.date)} · Expedición #${escapeHtml(item.session ?? "?")}</span>
            <a class="chronicle-link" href="cronicas.html#cronica-${encodeURIComponent(item.id)}">Leer crónica</a>
          </div>`).join("") : `<p class="muted-text">No hay crónicas relacionadas.</p>`}
      </article>

      <article class="card detail-panel">
        <p class="section-kicker">Encuentros</p><h2>Criaturas conocidas</h2>
        ${relatedBestiary.length ? relatedBestiary.map(item => `
          <div class="detail-list-item"><strong>${escapeHtml(item.name)}</strong><span>${escapeHtml(item.type || "Desconocido")} · Expedición #${escapeHtml(item.firstSeen)}</span></div>`).join("") : `<p class="muted-text">No hay encuentros registrados.</p>`}
      </article>

      <article class="card detail-panel">
        <p class="section-kicker">Relaciones</p><h2>Facciones conocidas</h2>
        ${relatedFactions.length ? relatedFactions.map(item => `
          <div class="detail-list-item"><strong>${escapeHtml(item.name)}</strong><span>${escapeHtml(item.relationship || "Desconocida")} · Expedición #${escapeHtml(item.firstContact)}</span></div>`).join("") : `<p class="muted-text">No hay contactos registrados.</p>`}
      </article>

      <article class="card detail-panel">
        <p class="section-kicker">Méritos</p><h2>Logros</h2>
        ${achievements.length ? achievements.map(item => `
          <div class="detail-list-item"><strong>${escapeHtml(item.name || "Logro")}</strong><span>${escapeHtml(item.description || "")}${item.date ? ` · ${formatDate(item.date)}` : ""}</span></div>`).join("") : `<p class="muted-text">Todavía no hay logros registrados.</p>`}
      </article>
    </section>
  `;
}

function sessionHasCharacter(session, character) {
  const ids = Array.isArray(session.characterIds) ? session.characterIds.map(Number) : [];
  const players = Array.isArray(session.players) ? session.players : [];
  return ids.includes(Number(character.id)) || players.includes(character.name);
}

function chronicleHasCharacter(chronicle, character) {
  const ids = Array.isArray(chronicle.characterIds) ? chronicle.characterIds.map(Number) : [];
  const participants = Array.isArray(chronicle.participants) ? chronicle.participants : [];
  return ids.includes(Number(character.id)) || participants.includes(character.name);
}

function initials(name) {
  return String(name || "?").split(/\s+/).slice(0,2).map(part => part.charAt(0)).join("").toUpperCase();
}
function parseLocalDate(value) { return new Date(`${value}T12:00:00`); }
function formatDate(value) { return parseLocalDate(value).toLocaleDateString("es-MX", { day:"numeric", month:"long", year:"numeric" }); }
function escapeHtml(value) { return String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;"); }
