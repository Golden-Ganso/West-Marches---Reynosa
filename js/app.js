const STATE_LABELS = {
  open: "Abierta",
  closed: "Cerrada",
  completed: "Finalizada"
};

let campaignSessions = [];
let calendarCursor = new Date();

document.addEventListener("DOMContentLoaded", async () => {
  try {
    const responses = await Promise.all([
      fetch("/api/data?entity=sessions", { cache: "no-store" }),
      fetch("/api/data?entity=characters", { cache: "no-store" }),
      fetch("/api/data?entity=chronicles", { cache: "no-store" }),
      fetch("/api/data?entity=rumors", { cache: "no-store" }),
      fetch("/api/data?entity=world", { cache: "no-store" })
    ]);

    if (responses.some(response => !response.ok)) {
      throw new Error("Una o más consultas a D1 no pudieron completarse.");
    }

    const [sessions, characters, chronicles, rumors, world] =
      await Promise.all(responses.map(response => response.json()));

    if (!Array.isArray(sessions)) throw new Error("Formato inválido de expediciones.");
    if (!Array.isArray(characters)) throw new Error("Formato inválido de personajes.");
    if (!Array.isArray(chronicles)) throw new Error("Formato inválido de crónicas.");
    if (!Array.isArray(rumors)) throw new Error("Formato inválido de rumores.");

    campaignSessions = sessions;

    setInitialCalendarMonth(sessions);
    renderExpeditions(sessions);
    renderRecentExpeditions(sessions);
    renderCharacters(characters);
    renderChronicles(chronicles);
    renderRumors(rumors);
    renderWorld(world, characters);
    renderCalendar();
    wireCalendarControls();

    // Las tarjetas abiertas ya existen en el DOM.
    // Ahora registrations.js consulta D1 y coloca inscritos reales.
    if (typeof initializeRegistrationPanels === "function") {
      await initializeRegistrationPanels(document);
    }
  } catch (error) {
    console.error("Error cargando Inicio desde D1:", error);

    const expeditions = document.getElementById("expeditions-grid");
    if (expeditions) {
      expeditions.innerHTML = `
        <div class="card loading-card">
          No fue posible cargar los datos de Inicio.
        </div>
      `;
    }
  }
});

function getSessionState(session) {
  const status = String(session.status || "open").toLowerCase();

  if (status === "completed") return "completed";
  if (status === "closed") return "closed";

  // Las sesiones abiertas NO calculan estado completo con session.players.
  // Los cupos reales e inscritos los controla registrations.js mediante D1.
  return "open";
}

function renderExpeditions(sessions) {
  const container = document.getElementById("expeditions-grid");
  if (!container) return;

  const visible = [...sessions]
    .filter(session => getSessionState(session) === "open")
    .sort((a, b) => parseLocalDate(a.date) - parseLocalDate(b.date))
    .slice(0, 6);

  container.innerHTML = visible.length
    ? visible.map(buildSessionCard).join("")
    : `<div class="card loading-card">No hay próximas expediciones programadas.</div>`;
}

function renderRecentExpeditions(sessions) {
  const container = document.getElementById("recent-expeditions-grid");
  if (!container) return;

  const now = new Date();

  let recent = [...sessions]
    .filter(session => {
      if (getSessionState(session) !== "completed" || !session.date) return false;
      const sessionDate = parseLocalDate(session.date);
      return sessionDate.getFullYear() === now.getFullYear() &&
             sessionDate.getMonth() === now.getMonth();
    })
    .sort((a, b) => parseLocalDate(b.date) - parseLocalDate(a.date));

  // Si el mes actual todavía no tiene expediciones terminadas,
  // mostramos las últimas 4 para que la sección siga siendo útil.
  if (!recent.length) {
    recent = [...sessions]
      .filter(session => getSessionState(session) === "completed")
      .sort((a, b) => parseLocalDate(b.date) - parseLocalDate(a.date))
      .slice(0, 4);
  }

  container.innerHTML = recent.length
    ? recent.map(buildSessionCard).join("")
    : `<div class="card loading-card">Todavía no hay expediciones finalizadas.</div>`;
}

function buildSessionCard(session) {
  const state = getSessionState(session);
  const stateClass = state === "completed" ? "closed" : state;
  const historicalPlayers = Array.isArray(session.players) ? session.players : [];

  const registrationPanel =
    state === "open" && typeof registrationPanelHtml === "function"
      ? registrationPanelHtml(session)
      : "";

  return `
    <article class="card expedition-card">
      <div class="card-topline">
        <div>
          <p class="section-kicker">
            Expedición #${escapeHtml(session.id ?? "?")}
          </p>
          <h3>${escapeHtml(session.title || "Expedición sin título")}</h3>
        </div>

        <span class="status-badge status-${stateClass}">
          ${STATE_LABELS[state] || state}
        </span>
      </div>

      <p class="expedition-description">
        ${escapeHtml(session.description || "Sin descripción.")}
      </p>

      <div class="meta-list">
        <div>
          <span>Fecha</span>
          <strong>${formatDate(session.date, { day: "numeric", month: "short", year: "numeric" })}</strong>
        </div>

        <div>
          <span>Hora</span>
          <strong>${escapeHtml(session.time || "Por definir")}</strong>
        </div>

        <div>
          <span>Nivel</span>
          <strong>${escapeHtml(session.level || "Abierto")}</strong>
        </div>

        ${state === "open" ? `
          <div>
            <span>Cupos</span>
            <strong>${Math.max(1, Number(session.slots || 1))}</strong>
          </div>
        ` : `
          <div>
            <span>Participantes</span>
            <strong>${historicalPlayers.length}</strong>
          </div>
        `}
      </div>

      ${state === "completed" ? `
        <div class="players-preview">
          <strong>Participantes:</strong>
          ${escapeHtml(
            historicalPlayers.length
              ? historicalPlayers.join(", ")
              : "Sin participantes registrados"
          )}
        </div>
      ` : ""}

      <a
        href="expedicion.html?id=${encodeURIComponent(session.id)}"
        class="chronicle-link"
      >
        Ver expedición
      </a>

      ${registrationPanel}
    </article>
  `;
}

function renderCharacters(characters) {
  const active = characters
    .filter(character => String(character.status || "").toLowerCase() === "activo");

  const activeCounter = document.getElementById("active-characters");
  if (activeCounter) activeCounter.textContent = active.length;

  const characterCount = document.getElementById("character-count");
  if (characterCount) characterCount.textContent = characters.length;

  const container = document.getElementById("characters-grid");
  if (!container) return;

  const highlighted = [...active]
    .sort((a, b) => {
      const levelDifference = Number(b.level || 0) - Number(a.level || 0);
      if (levelDifference !== 0) return levelDifference;
      return String(a.name || "").localeCompare(String(b.name || ""), "es");
    })
    .slice(0, 6);

  if (!highlighted.length) {
    container.innerHTML = `<div class="card loading-card">Todavía no hay aventureros activos.</div>`;
    return;
  }

  container.innerHTML = highlighted.map(character => {
    const initials = getInitials(character.name);

    const portrait = character.image
      ? `<img src="${encodeURI(character.image)}" alt="Retrato de ${escapeHtml(character.name)}" loading="lazy">`
      : `<span>${escapeHtml(initials)}</span>`;

    return `
      <a
        href="personaje.html?id=${encodeURIComponent(character.id)}"
        class="character-card-link"
      >
        <article class="card character-card">
          <div class="character-portrait">
            ${portrait}
          </div>

          <div class="character-body">
            <p class="section-kicker">
              ${escapeHtml(character.status || "Sin estado")}
            </p>

            <h3>${escapeHtml(character.name || "Sin nombre")}</h3>

            <p class="character-level">
              Nivel ${Number(character.level || 1)} · ${escapeHtml(character.class || "Clase desconocida")}
            </p>

            <p>
              ${escapeHtml(character.race || "Raza desconocida")} ·
              ${escapeHtml(character.player || "Jugador sin registrar")}
            </p>
          </div>
        </article>
      </a>
    `;
  }).join("");
}

function renderChronicles(chronicles) {
  const container = document.getElementById("chronicles-list");
  if (!container) return;

  const latest = [...chronicles]
    .sort((a, b) => parseLocalDate(b.date) - parseLocalDate(a.date))
    .slice(0, 3);

  if (!latest.length) {
    container.innerHTML = `<p>No hay crónicas registradas.</p>`;
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

    return `
      <article class="feed-item chronicle-item">
        ${image}
        <div class="chronicle-content">
          <h3>${escapeHtml(item.title || "Crónica")}</h3>
          <p class="chronicle-preview">${escapeHtml(item.summary || "Sin resumen.")}</p>
          <p class="feed-meta">
            ${formatDate(item.date)}
            ${item.session ? ` · Expedición #${escapeHtml(item.session)}` : ""}
          </p>
          <a
            href="cronicas.html#cronica-${encodeURIComponent(item.id)}"
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
  if (!container) return;

  const openRumors = rumors
    .filter(rumor => String(rumor.status || "").toLowerCase() !== "resuelto")
    .slice(0, 5);

  container.innerHTML = openRumors.length
    ? openRumors.map(rumor => `
      <article class="feed-item">
        <h3>${escapeHtml(rumor.title || "Rumor")}</h3>
        <p>${escapeHtml(rumor.text || "Sin detalles.")}</p>
        <p class="feed-meta">Estado: ${escapeHtml(rumor.status || "Desconocido")}</p>
      </article>
    `).join("")
    : `<p>No quedan rumores pendientes.</p>`;
}

function renderWorld(world, characters) {
  const exploration = Math.max(0, Math.min(100, Number(world?.exploration || 0)));

  const progress = document.getElementById("world-progress");
  if (progress) progress.style.width = `${exploration}%`;

  const percentage = document.getElementById("world-percentage");
  if (percentage) percentage.textContent = `${exploration}%`;

  setText("expedition-count", Number(world?.completedExpeditions || 0));
  setText("location-count", Number(world?.discoveredLocations || 0));
  setText("artifact-count", Number(world?.artifactsFound || 0));
  setText("character-count", characters.length);

  const list = document.getElementById("discoveries-list");
  if (!list) return;

  const discoveries = Array.isArray(world?.latestDiscoveries)
    ? world.latestDiscoveries
    : [];

  list.innerHTML = discoveries.length
    ? discoveries.slice(0, 4).map(item => `<li>${escapeHtml(item)}</li>`).join("")
    : `<li>Aún no hay descubrimientos registrados.</li>`;
}

function setInitialCalendarMonth(sessions) {
  const upcoming = [...sessions]
    .filter(session => getSessionState(session) === "open" && session.date)
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
  const previous = document.getElementById("calendar-prev");
  const next = document.getElementById("calendar-next");

  if (previous) {
    previous.addEventListener("click", () => {
      calendarCursor = new Date(
        calendarCursor.getFullYear(),
        calendarCursor.getMonth() - 1,
        1
      );
      renderCalendar();
    });
  }

  if (next) {
    next.addEventListener("click", () => {
      calendarCursor = new Date(
        calendarCursor.getFullYear(),
        calendarCursor.getMonth() + 1,
        1
      );
      renderCalendar();
    });
  }
}

function renderCalendar() {
  const title = document.getElementById("calendar-title");
  const grid = document.getElementById("calendar-grid");

  if (!title || !grid) return;

  const year = calendarCursor.getFullYear();
  const month = calendarCursor.getMonth();

  title.textContent = new Date(year, month, 1)
    .toLocaleDateString("es-MX", { month: "long", year: "numeric" });

  const first = new Date(year, month, 1);
  const mondayIndex = (first.getDay() + 6) % 7;
  const start = new Date(year, month, 1 - mondayIndex);

  grid.innerHTML = "";

  for (let i = 0; i < 42; i += 1) {
    const day = new Date(start);
    day.setDate(start.getDate() + i);

    const iso = toLocalIso(day);
    const daySessions = campaignSessions.filter(session => session.date === iso);

    const button = document.createElement("button");
    button.type = "button";
    button.className =
      `calendar-day` +
      `${day.getMonth() !== month ? " other-month" : ""}` +
      `${daySessions.length ? " has-session" : ""}`;

    button.innerHTML = `
      <span class="day-number">${day.getDate()}</span>
      <span class="session-markers">
        ${daySessions.map(session => `
          <i class="session-marker ${
            getSessionState(session) === "completed" ? "closed" : "open"
          }"></i>
        `).join("")}
      </span>
    `;

    if (daySessions.length) {
      button.addEventListener("click", () => showCalendarSessions(iso, daySessions));
      button.setAttribute(
        "aria-label",
        `${day.getDate()}: ${daySessions.length} expedición${daySessions.length === 1 ? "" : "es"}`
      );
    } else {
      button.disabled = true;
    }

    grid.appendChild(button);
  }
}

function showCalendarSessions(iso, sessions) {
  const selected = document.getElementById("calendar-selected");
  if (!selected) return;

  selected.innerHTML = `
    <strong>${formatDate(iso)}</strong><br>
    ${sessions.map(session => `
      ${escapeHtml(session.time || "Hora pendiente")} ·
      <a class="chronicle-link" href="expedicion.html?id=${encodeURIComponent(session.id)}">
        ${escapeHtml(session.title || "Expedición")}
      </a>
    `).join("<br>")}
  `;
}

function getInitials(name) {
  return String(name || "?")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map(part => part.charAt(0))
    .join("")
    .toUpperCase();
}

function setText(id, value) {
  const element = document.getElementById(id);
  if (element) element.textContent = value;
}

function parseLocalDate(value) {
  return value
    ? new Date(`${value}T12:00:00`)
    : new Date(8640000000000000);
}

function formatDate(
  value,
  options = { day: "numeric", month: "long", year: "numeric" }
) {
  return value
    ? parseLocalDate(value).toLocaleDateString("es-MX", options)
    : "Por definir";
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
