const STATE_LABELS = { open: "Abierta", full: "Completa", closed: "Cerrada", completed: "Finalizada" };
const RESULT_LABELS = { success: "Éxito", partial: "Éxito parcial", failed: "Fallida", cancelled: "Cancelada" };

document.addEventListener("DOMContentLoaded", async () => {
  try {
    const sessionId = Number(new URLSearchParams(window.location.search).get("id"));
    if (!Number.isInteger(sessionId) || sessionId <= 0) throw new Error("ID de expedición inválido");

    const responses = await Promise.all([
  fetch("data/sessions.json"),
  fetch("data/characters.json"),
  fetch("data/chronicles.json"),
  fetch("data/bestiary.json"),
  fetch("data/factions.json"),
  fetch("data/locations.json")
]);
    if (responses.some(response => !response.ok)) throw new Error("No fue posible cargar los datos");

    const [
  sessions,
  characters,
  chronicles,
  bestiary,
  factions,
  locations
] = await Promise.all(
  responses.map(r => r.json())
);
    const session = sessions.find(item => Number(item.id) === sessionId);
    if (!session) throw new Error("Expedición no encontrada");

    renderExpedition(
  session,
  characters,
  chronicles,
  bestiary,
  factions,
  locations
);
  } catch (error) {
    console.error(error);
    document.getElementById("expedition-detail").innerHTML = `<div class="card loading-card">No fue posible cargar la expedición.</div>`;
  }
});

function renderExpedition(
  session,
  characters,
  chronicles,
  bestiary,
  factions,
  locations
) {
  const characterIds = Array.isArray(session.characterIds) ? session.characterIds.map(Number) : [];
  const creatureIds = Array.isArray(session.creatureIds) ? session.creatureIds.map(Number) : [];
  const factionIds = Array.isArray(session.factionIds) ? session.factionIds.map(Number) : [];
  const locationIds =
  Array.isArray(session.locationIds)
    ? session.locationIds.map(Number)
    : [];
  const participants = characters.filter(character => characterIds.includes(Number(character.id)));
  const creatures = bestiary.filter(creature => creatureIds.includes(Number(creature.id)));
  const relatedFactions = factions.filter(faction => factionIds.includes(Number(faction.id)));
  const relatedLocations = locations.filter(location =>locationIds.includes(Number(location.id)));
  const relatedChronicles = chronicles.filter(item => Number(item.session) === Number(session.id));
  const discoveries = Array.isArray(session.discoveries) ? session.discoveries : [];
  const state = getSessionState(session);
  const result = session.result ? (RESULT_LABELS[session.result] || session.result) : "Pendiente";

  document.title = `${session.title} | West Marches Reynosa`;

  document.getElementById("expedition-detail").innerHTML = `
    <section class="card expedition-detail-hero">
      <p class="section-kicker">Expedición #${escapeHtml(session.id)}</p>
      <div class="expedition-detail-title-row">
        <div><h2>${escapeHtml(session.title || "Sin título")}</h2><p>${formatDate(session.date)} · ${escapeHtml(session.time || "Hora por definir")} · Nivel ${escapeHtml(session.level || "Abierto")}</p></div>
        <span class="status-badge status-${state === "completed" ? "closed" : state}">${STATE_LABELS[state] || state}</span>
      </div>
      <p class="expedition-detail-description">${escapeHtml(session.description || "Sin descripción.")}</p>
    </section>

    <section class="section-block expedition-detail-columns">
      <article class="card detail-panel"><p class="section-kicker">Misión</p><h2>Objetivo</h2><p>${escapeHtml(session.objective || "Objetivo no registrado.")}</p></article>
      <article class="card detail-panel"><p class="section-kicker">Desenlace</p><h2>${escapeHtml(result)}</h2><p>${escapeHtml(session.resultSummary || "El resultado todavía no ha sido registrado.")}</p></article>
    </section>

    <section class="section-block">
      <div class="section-heading"><div><p class="section-kicker">Compañía</p><h2>Participantes</h2></div></div>
      <div class="expedition-participants">
        ${participants.length ? participants.map(character => participantCard(character)).join("") : `<div class="card loading-card">No hay personajes vinculados mediante characterIds.</div>`}
      </div>
    </section>

    <section class="section-block expedition-detail-columns">
      <article class="card detail-panel"><p class="section-kicker">Hallazgos</p><h2>Descubrimientos</h2>${discoveries.length ? `<ul class="simple-list">${discoveries.map(item => `<li>${escapeHtml(item)}</li>`).join("")}</ul>` : `<p class="muted-text">No hay descubrimientos registrados.</p>`}</article>
      <article class="card detail-panel"><p class="section-kicker">Observaciones</p><h2>Notas</h2><p>${escapeHtml(session.notes || "No hay notas adicionales.")}</p></article>
    </section>

    <section class="section-block">

  <div class="section-heading">

    <div>
      <p class="section-kicker">
        Exploración
      </p>

      <h2>
        Lugares visitados
      </h2>
    </div>

    <a
      href="mapa.html"
      class="chronicle-link"
    >
      Abrir mapa
    </a>

  </div>


  <div class="campaign-detail-grid">

    ${
      relatedLocations.length

        ? relatedLocations
            .map(location => `

              <article class="card detail-panel">

                <p class="section-kicker">
                  ${escapeHtml(
                    location.type || "Lugar"
                  )}
                </p>

                <h3>
                  ${escapeHtml(location.name)}
                </h3>

                <p>
                  ${escapeHtml(
                    location.description ||
                    "Sin descripción."
                  )}
                </p>

                <a
                  href="lugar.html?id=${encodeURIComponent(location.id)}"
                  class="chronicle-link"
                >
                  Ver lugar
                </a>

              </article>

            `)
            .join("")

        : `
            <div class="card loading-card">
              No hay lugares vinculados
              a esta expedición.
            </div>
          `
    }

  </div>

</section>

    <section class="section-block expedition-detail-columns">
      <article class="card detail-panel"><p class="section-kicker">Encuentros</p><h2>Criaturas</h2>${creatures.length ? creatures.map(item => `<div class="detail-list-item"><strong>${escapeHtml(item.name)}</strong><span>${escapeHtml(item.type || "Desconocido")}</span><a class="chronicle-link" href="bestiario.html">Abrir bestiario</a></div>`).join("") : `<p class="muted-text">No hay criaturas vinculadas.</p>`}</article>
      <article class="card detail-panel"><p class="section-kicker">Relaciones</p><h2>Facciones</h2>${relatedFactions.length ? relatedFactions.map(item => `<div class="detail-list-item"><strong>${escapeHtml(item.name)}</strong><span>${escapeHtml(item.relationship || "Desconocida")}</span><a class="chronicle-link" href="facciones.html">Ver facciones</a></div>`).join("") : `<p class="muted-text">No hay facciones vinculadas.</p>`}</article>
    </section>

    <section class="section-block">
      <div class="section-heading"><div><p class="section-kicker">Archivo</p><h2>Crónicas relacionadas</h2></div></div>
      <div class="campaign-detail-grid">
        ${relatedChronicles.length ? relatedChronicles.map(item => chronicleCard(item)).join("") : `<div class="card loading-card">No hay crónicas relacionadas con esta expedición.</div>`}
      </div>
    </section>
  `;
}

function participantCard(character) {
  const portrait = character.image ? `<img src="${encodeURI(character.image)}" alt="Retrato de ${escapeHtml(character.name)}" loading="lazy">` : `<span>${escapeHtml(initials(character.name))}</span>`;
  return `<a class="card expedition-participant-card" href="personaje.html?id=${encodeURIComponent(character.id)}"><div class="expedition-participant-image">${portrait}</div><div><strong>${escapeHtml(character.name)}</strong><span>${escapeHtml(character.class || "Clase desconocida")} · Nivel ${Number(character.level || 1)}</span></div></a>`;
}

function chronicleCard(item) {
  const image = item.image ? `<div class="expedition-chronicle-image"><img src="${encodeURI(item.image)}" alt="${escapeHtml(item.title || "Crónica")}" loading="lazy"></div>` : "";
  return `<article class="card expedition-chronicle-card">${image}<div class="expedition-chronicle-content"><p class="section-kicker">${formatDate(item.date)}</p><h3>${escapeHtml(item.title || "Crónica")}</h3><a class="chronicle-link" href="cronicas.html#cronica-${encodeURIComponent(item.id)}">Leer crónica completa</a></div></article>`;
}

function getSessionState(session) {
  if (["completed", "closed"].includes(session.status)) return session.status;
  const occupied = Array.isArray(session.players) ? session.players.length : 0;
  return occupied >= Number(session.slots || 0) ? "full" : "open";
}
function initials(name) { return String(name || "?").split(/\s+/).slice(0,2).map(p => p.charAt(0)).join("").toUpperCase(); }
function parseLocalDate(value) { return new Date(`${value}T12:00:00`); }
function formatDate(value) { return value ? parseLocalDate(value).toLocaleDateString("es-MX", { day:"numeric", month:"long", year:"numeric" }) : "Fecha por definir"; }
function escapeHtml(value) { return String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;"); }
