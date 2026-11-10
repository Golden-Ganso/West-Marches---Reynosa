const STATE_LABELS = { open: "Abierta", full: "Completa", closed: "Cerrada", completed: "Finalizada" };

document.addEventListener("DOMContentLoaded", async () => {
  try {
    const response = await fetch("data/sessions.json");
    if (!response.ok) throw new Error("No fue posible cargar sessions.json");
    const sessions = await response.json();
    await renderExpeditionsPage(sessions);
  } catch (error) {
    console.error("Error cargando expediciones:", error);
    const container = document.getElementById("active-expeditions");
    if (container) container.innerHTML = `<div class="card loading-card">No fue posible cargar las expediciones.</div>`;
  }
});

async function renderExpeditionsPage(sessions) {
  const active = [...sessions].filter(session => ["open", "full"].includes(getSessionState(session))).sort((a,b) => parseLocalDate(a.date) - parseLocalDate(b.date));
  const completed = [...sessions].filter(session => getSessionState(session) === "completed").sort((a,b) => parseLocalDate(b.date) - parseLocalDate(a.date));
  document.getElementById("active-expeditions").innerHTML = active.length ? active.map(buildSessionCard).join("") : `<div class="card loading-card">No hay expediciones activas.</div>`;
  document.getElementById("completed-expeditions").innerHTML = completed.length ? completed.map(buildSessionCard).join("") : `<div class="card loading-card">Todavía no hay expediciones finalizadas.</div>`;
  if (typeof initializeRegistrationPanels === "function") await initializeRegistrationPanels(document);
}

function getSessionState(session) {
  const status = String(session.status || "").toLowerCase();
  if (["completed", "closed"].includes(status)) return status;
  const occupied = Array.isArray(session.players) ? session.players.length : 0;
  const slots = Math.max(1, Number(session.slots || 1));
  return occupied >= slots ? "full" : "open";
}

function buildSessionCard(session) {
  const players = Array.isArray(session.players) ? session.players : [];
  const slots = Math.max(1, Number(session.slots || 1));
  const occupied = players.length;
  const percentage = Math.min(100, Math.round((occupied / slots) * 100));
  const state = getSessionState(session);
  const stateClass = state === "completed" ? "closed" : state;
  const registrationPanel = typeof registrationPanelHtml === "function" ? registrationPanelHtml(session) : "";
  return `<article class="card expedition-card">
    <div class="card-topline"><div><p class="section-kicker">Expedición #${escapeHtml(session.id ?? "?")}</p><h3>${escapeHtml(session.title || "Sin título")}</h3></div><span class="status-badge status-${stateClass}">${STATE_LABELS[state] || state}</span></div>
    <p class="expedition-description">${escapeHtml(session.description || "Sin descripción.")}</p>
    <div class="meta-list">
      <div><span>Fecha</span><strong>${formatDate(session.date)}</strong></div>
      <div><span>Hora</span><strong>${escapeHtml(session.time || "Por definir")}</strong></div>
      <div><span>Nivel</span><strong>${escapeHtml(session.level || "Abierto")}</strong></div>
    </div>
    <a href="expedicion.html?id=${encodeURIComponent(session.id)}" class="chronicle-link">Ver expedición</a>
    ${registrationPanel}
  </article>`;
}

function parseLocalDate(value) { return value ? new Date(`${value}T12:00:00`) : new Date(8640000000000000); }
function formatDate(value) { return value ? parseLocalDate(value).toLocaleDateString("es-MX", { day:"numeric", month:"long", year:"numeric" }) : "Por definir"; }
function escapeHtml(value) { return String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;"); }
