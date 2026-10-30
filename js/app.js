const STATE_LABELS = {
  open: "Abierta",
  full: "Completa",
  closed: "Cerrada",
  completed: "Finalizada"
};

let campaignSessions = [];
let calendarCursor = new Date();

document.addEventListener("DOMContentLoaded", async () => {
  try {
    const responses = await Promise.all([
      fetch("data/sessions.json"),
      fetch("data/characters.json"),
      fetch("data/chronicles.json"),
      fetch("data/rumors.json"),
      fetch("data/world.json")
    ]);

    if (responses.some(response => !response.ok)) {
      throw new Error("Uno o más archivos JSON no pudieron cargarse.");
    }

    const [sessions, characters, chronicles, rumors, world] = await Promise.all(
      responses.map(response => response.json())
    );

    campaignSessions = sessions;
    setInitialCalendarMonth(sessions);
    renderExpeditions(sessions);
    renderCharacters(characters);
    renderChronicles(chronicles);
    renderRumors(rumors);
    renderWorld(world, characters);
    renderCalendar();
    wireCalendarControls();
  } catch (error) {
    console.error("Error cargando los datos de la campaña:", error);
    document.getElementById("expeditions-grid").innerHTML = `
      <div class="card loading-card">No fue posible cargar los datos. Revisa los archivos de la carpeta data.</div>
    `;
  }
});

function parseLocalDate(dateString) {
  return new Date(`${dateString}T12:00:00`);
}

function formatDate(dateString, options = { day: "numeric", month: "long", year: "numeric" }) {
  return parseLocalDate(dateString).toLocaleDateString("es-MX", options);
}

function getSessionState(session) {
  if (session.status === "completed" || session.status === "closed") return session.status;
  const occupied = Array.isArray(session.players) ? session.players.length : 0;
  if (occupied >= Number(session.slots || 0)) return "full";
  return "open";
}

function renderExpeditions(sessions) {
  const container = document.getElementById("expeditions-grid");
  const visible = [...sessions]
    .filter(session => getSessionState(session) !== "completed")
    .sort((a, b) => parseLocalDate(a.date) - parseLocalDate(b.date))
    .slice(0, 6);

  if (!visible.length) {
    container.innerHTML = `<div class="card loading-card">No hay próximas expediciones programadas.</div>`;
    return;
  }

  container.innerHTML = visible.map(session => {
    const players = Array.isArray(session.players) ? session.players : [];
    const slots = Math.max(1, Number(session.slots || 1));
    const occupied = players.length;
    const percentage = Math.min(100, Math.round((occupied / slots) * 100));
    const state = getSessionState(session);
    const stateClass = state === "completed" ? "closed" : state;
    const playersText = players.length ? players.join(", ") : "Todavía no hay aventureros inscritos.";

    return `
      <article class="card expedition-card">
        <div class="card-topline">
          <div>
            <p class="section-kicker">Expedición #${escapeHtml(String(session.id ?? "?"))}</p>
            <h3>${escapeHtml(session.title || "Expedición sin título")}</h3>
          </div>
          <span class="status-badge status-${stateClass}">${STATE_LABELS[state] || state}</span>
        </div>
        <p class="expedition-description">${escapeHtml(session.description || "Sin descripción.")}</p>
        <div class="meta-list">
          <div><span>Fecha</span><strong>${formatDate(session.date, { day: "numeric", month: "short", year: "numeric" })}</strong></div>
          <div><span>Hora</span><strong>${escapeHtml(session.time || "Por definir")}</strong></div>
          <div><span>Nivel</span><strong>${escapeHtml(session.level || "Abierto")}</strong></div>
          <div><span>Cupos libres</span><strong>${Math.max(0, slots - occupied)}</strong></div>
        </div>
        <div class="slots-row">
          <div class="slots-bar"><div class="slots-fill" style="width:${percentage}%"></div></div>
          <span class="slots-text">${occupied} / ${slots}</span>
        </div>
        <div class="players-preview"><strong>Inscritos:</strong> ${escapeHtml(playersText)}</div>
      </article>`;
  }).join("");
}

function renderCharacters(characters) {
  const active = characters.filter(character => String(character.status).toLowerCase() === "activo");
  document.getElementById("active-characters").textContent = active.length;
  document.getElementById("character-count").textContent = characters.length;

  const container = document.getElementById("characters-grid");
  const highlighted = [...active]
    .sort((a, b) => Number(b.level || 0) - Number(a.level || 0))
    .slice(0, 4);

  if (!highlighted.length) {
    container.innerHTML = `<div class="card loading-card">Todavía no hay aventureros activos.</div>`;
    return;
  }

  container.innerHTML = highlighted.map(character => {
    const initials = String(character.name || "?")
      .split(/\s+/).slice(0, 2).map(part => part.charAt(0)).join("").toUpperCase();
    const portraitStyle = character.image
      ? `style="background-image:linear-gradient(rgba(8,15,26,.12),rgba(8,15,26,.5)),url('${encodeURI(character.image)}')"`
      : "";

    return `
      <article class="card character-card">
        <div class="character-portrait" ${portraitStyle}>${character.image ? "" : `<span>${escapeHtml(initials)}</span>`}</div>
        <div class="character-body">
          <h3>${escapeHtml(character.name || "Sin nombre")}</h3>
          <p class="character-level">Nivel ${Number(character.level || 1)} · ${escapeHtml(character.class || "Clase desconocida")}</p>
          <p>${escapeHtml(character.race || "Raza desconocida")} · ${escapeHtml(character.player || "Jugador sin registrar")}</p>
        </div>
      </article>`;
  }).join("");
}

function renderChronicles(chronicles) {

  const container = document.getElementById("chronicles-list");

  const latest = [...chronicles]
    .sort((a, b) => parseLocalDate(b.date) - parseLocalDate(a.date))
    .slice(0, 3);

  if (!latest.length) {
    container.innerHTML = "<p>No hay crónicas registradas.</p>";
    return;
  }

  container.innerHTML = latest.map(item => {

    const image = item.image
      ? `
        <div class="chronicle-image chronicle-preview-image">
          <img
            src="${encodeURI(item.image)}"
            alt="Ilustración de ${escapeHtml(item.title || "la expedición")}"
            loading="lazy"
          >
        </div>
      `
      : "";

    const summary = item.summary || "Sin resumen.";

    return `
      <article class="feed-item chronicle-item">

        ${image}

        <div class="chronicle-content">

          <h3>
            ${escapeHtml(item.title || "Crónica")}
          </h3>

          <p class="chronicle-preview">
            ${escapeHtml(summary)}
          </p>

          <p class="feed-meta">
            ${formatDate(item.date)}
            ${item.session
              ? ` · Expedición #${escapeHtml(String(item.session))}`
              : ""}
          </p>

          <a
            href="cronicas.html#cronica-${item.id}"
            class="chronicle-link"
          >
            Leer crónica completa
          </a>

        </div>

      </article>
    `;

  }).join("");
}

function renderRumors(rumors) {
  const container = document.getElementById("rumors-list");
  const openRumors = rumors.filter(rumor => String(rumor.status).toLowerCase() !== "resuelto").slice(0, 5);
  container.innerHTML = openRumors.length ? openRumors.map(rumor => `
    <article class="feed-item">
      <h3>${escapeHtml(rumor.title || "Rumor")}</h3>
      <p>${escapeHtml(rumor.text || "Sin detalles.")}</p>
      <p class="feed-meta">Estado: ${escapeHtml(rumor.status || "Desconocido")}</p>
    </article>`).join("") : `<p>No quedan rumores pendientes.</p>`;
}

function renderWorld(world, characters) {
  const exploration = Math.max(0, Math.min(100, Number(world.exploration || 0)));
  document.getElementById("world-progress").style.width = `${exploration}%`;
  document.getElementById("world-percentage").textContent = `${exploration}%`;
  document.getElementById("expedition-count").textContent = Number(world.completedExpeditions || 0);
  document.getElementById("location-count").textContent = Number(world.discoveredLocations || 0);
  document.getElementById("artifact-count").textContent = Number(world.artifactsFound || 0);
  document.getElementById("character-count").textContent = characters.length;

  const list = document.getElementById("discoveries-list");
  const discoveries = Array.isArray(world.latestDiscoveries) ? world.latestDiscoveries : [];
  list.innerHTML = discoveries.slice(0, 4).map(item => `<li>${escapeHtml(item)}</li>`).join("") || "<li>Aún no hay descubrimientos registrados.</li>";
}

function setInitialCalendarMonth(sessions) {
  const upcoming = [...sessions]
    .filter(session => getSessionState(session) !== "completed")
    .sort((a, b) => parseLocalDate(a.date) - parseLocalDate(b.date));
  if (upcoming.length) {
    const date = parseLocalDate(upcoming[0].date);
    calendarCursor = new Date(date.getFullYear(), date.getMonth(), 1);
  } else {
    const now = new Date();
    calendarCursor = new Date(now.getFullYear(), now.getMonth(), 1);
  }
}

function wireCalendarControls() {
  document.getElementById("calendar-prev").addEventListener("click", () => {
    calendarCursor = new Date(calendarCursor.getFullYear(), calendarCursor.getMonth() - 1, 1);
    renderCalendar();
  });
  document.getElementById("calendar-next").addEventListener("click", () => {
    calendarCursor = new Date(calendarCursor.getFullYear(), calendarCursor.getMonth() + 1, 1);
    renderCalendar();
  });
}

function renderCalendar() {
  const year = calendarCursor.getFullYear();
  const month = calendarCursor.getMonth();
  document.getElementById("calendar-title").textContent = new Date(year, month, 1).toLocaleDateString("es-MX", { month: "long", year: "numeric" });

  const first = new Date(year, month, 1);
  const mondayIndex = (first.getDay() + 6) % 7;
  const start = new Date(year, month, 1 - mondayIndex);
  const grid = document.getElementById("calendar-grid");
  grid.innerHTML = "";

  for (let i = 0; i < 42; i += 1) {
    const day = new Date(start);
    day.setDate(start.getDate() + i);
    const iso = toLocalIso(day);
    const daySessions = campaignSessions.filter(session => session.date === iso);
    const button = document.createElement("button");
    button.type = "button";
    button.className = `calendar-day${day.getMonth() !== month ? " other-month" : ""}${daySessions.length ? " has-session" : ""}`;
    button.innerHTML = `<span class="day-number">${day.getDate()}</span><span class="session-markers">${daySessions.map(session => `<i class="session-marker ${getSessionState(session) === "completed" ? "closed" : getSessionState(session)}"></i>`).join("")}</span>`;
    if (daySessions.length) {
      button.addEventListener("click", () => showCalendarSessions(iso, daySessions));
      button.setAttribute("aria-label", `${day.getDate()}: ${daySessions.length} expedición${daySessions.length === 1 ? "" : "es"}`);
    } else {
      button.disabled = true;
    }
    grid.appendChild(button);
  }
}

function showCalendarSessions(iso, sessions) {
  const panel = document.getElementById("calendar-selected");
  panel.innerHTML = `<strong>${formatDate(iso)}</strong><br>${sessions.map(session => `${escapeHtml(session.time || "Hora pendiente")} · ${escapeHtml(session.title || "Expedición")}`).join("<br>")}`;
}

function toLocalIso(date) {
  const pad = value => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
