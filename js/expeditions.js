const STATE_LABELS = {
  open: "Abierta",
  closed: "Cerrada",
  completed: "Finalizada"
};

document.addEventListener("DOMContentLoaded", async () => {
  try {
    const response = await fetch("data/sessions.json", { cache: "no-store" });

    if (!response.ok) {
      throw new Error("No fue posible cargar sessions.json");
    }

    const sessions = await response.json();
    await renderExpeditionsPage(sessions);

  } catch (error) {
    console.error("Error cargando expediciones:", error);

    const activeContainer = document.getElementById("active-expeditions");
    if (activeContainer) {
      activeContainer.innerHTML = `
        <div class="card loading-card">
          No fue posible cargar las expediciones.
        </div>
      `;
    }
  }
});

async function renderExpeditionsPage(sessions) {
  const active = [...sessions]
    .filter(session => getSessionState(session) === "open")
    .sort((a, b) => parseLocalDate(a.date) - parseLocalDate(b.date));

  const completed = [...sessions]
    .filter(session => getSessionState(session) === "completed")
    .sort((a, b) => parseLocalDate(b.date) - parseLocalDate(a.date));

  const activeContainer = document.getElementById("active-expeditions");
  const completedContainer = document.getElementById("completed-expeditions");

  if (activeContainer) {
    activeContainer.innerHTML = active.length
      ? active.map(buildSessionCard).join("")
      : `<div class="card loading-card">No hay expediciones activas.</div>`;
  }

  if (completedContainer) {
    completedContainer.innerHTML = completed.length
      ? completed.map(buildSessionCard).join("")
      : `<div class="card loading-card">Todavía no hay expediciones finalizadas.</div>`;
  }

  if (typeof initializeRegistrationPanels === "function") {
    await initializeRegistrationPanels(document);
  } else {
    console.warn("registrations.js no está cargado. Las expediciones se mostrarán sin controles de registro.");
  }
}

function getSessionState(session) {
  const status = String(session.status || "open").toLowerCase();

  if (status === "completed") return "completed";
  if (status === "closed") return "closed";

  // IMPORTANTE:
  // Una sesión abierta ya NO se considera llena usando session.players.
  // El estado de cupos reales lo administra D1 mediante registrations.js.
  return "open";
}

function buildSessionCard(session) {
  const state = getSessionState(session);
  const stateClass = state === "completed" ? "closed" : state;
  const isOpen = state === "open";

  // Para sesiones terminadas conservamos participants históricos de sessions.json.
  // Para sesiones abiertas D1 es la única fuente visual de inscritos.
  const historicalPlayers = Array.isArray(session.players) ? session.players : [];

  const registrationPanel =
    isOpen && typeof registrationPanelHtml === "function"
      ? registrationPanelHtml(session)
      : "";

  const completedParticipants = state === "completed"
    ? `
      <div class="players-preview">
        <strong>Participantes:</strong>
        ${escapeHtml(
          historicalPlayers.length
            ? historicalPlayers.join(", ")
            : "Sin participantes registrados"
        )}
      </div>
    `
    : "";

  const completedSlots = state === "completed"
    ? `
      <div class="meta-list-item">
        <span>Participantes</span>
        <strong>${historicalPlayers.length}</strong>
      </div>
    `
    : "";

  return `
    <article class="card expedition-card">
      <div class="card-topline">
        <div>
          <p class="section-kicker">
            Expedición #${escapeHtml(session.id ?? "?")}
          </p>
          <h3>${escapeHtml(session.title || "Sin título")}</h3>
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
          <strong>${formatDate(session.date)}</strong>
        </div>

        <div>
          <span>Hora</span>
          <strong>${escapeHtml(session.time || "Por definir")}</strong>
        </div>

        <div>
          <span>Nivel</span>
          <strong>${escapeHtml(session.level || "Abierto")}</strong>
        </div>

        ${completedSlots}
      </div>

      ${completedParticipants}

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

function parseLocalDate(value) {
  if (!value) {
    return new Date(8640000000000000);
  }

  return new Date(`${value}T12:00:00`);
}

function formatDate(value) {
  if (!value) {
    return "Por definir";
  }

  return parseLocalDate(value).toLocaleDateString("es-MX", {
    day: "numeric",
    month: "long",
    year: "numeric"
  });
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
