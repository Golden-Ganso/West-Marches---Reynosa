document.addEventListener("DOMContentLoaded", async () => {
  const container = document.getElementById("chronicles-page") || document.getElementById("chronicles-list");
  if (!container) return;

  try {
    const response = await fetch("/api/data?entity=chronicles", { cache: "no-store" });
    if (!response.ok) throw new Error("No fue posible cargar las crónicas.");

    const chronicles = await response.json();
    container.innerHTML = chronicles.length
      ? [...chronicles].sort((a,b) => parseDate(b.date) - parseDate(a.date)).map(renderChronicle).join("")
      : `<div class="card loading-card">Todavía no hay crónicas registradas.</div>`;
  } catch (error) {
    console.error(error);
    container.innerHTML = `<div class="card loading-card">No fue posible cargar las crónicas.</div>`;
  }
});

function renderChronicle(item) {
  return `
    <article id="cronica-${encodeURIComponent(item.id)}" class="card chronicle-item chronicle-full">
      ${item.image ? `<div class="chronicle-image"><img src="${encodeURI(item.image)}" alt="Ilustración de ${escapeHtml(item.title || "la crónica")}" loading="lazy"></div>` : ""}
      <div class="chronicle-content">
        <p class="section-kicker">${formatDate(item.date)}${item.session ? ` · Expedición #${escapeHtml(item.session)}` : ""}</p>
        <h2>${escapeHtml(item.title || "Crónica")}</h2>
        ${item.author ? `<p class="feed-meta">Por <strong>${escapeHtml(item.author)}</strong></p>` : ""}
        ${item.participants?.length ? `<p class="feed-meta"><strong>Participantes:</strong> ${item.participants.map(escapeHtml).join(", ")}</p>` : ""}
        <div class="chronicle-text">${formatMultilineText(item.summary || "Sin contenido registrado.")}</div>
      </div>
    </article>`;
}

function formatMultilineText(value) {
  return String(value ?? "")
    .replace(/\r\n/g, "\n")
    .split(/\n{2,}/)
    .map(paragraph => paragraph.trim())
    .filter(Boolean)
    .map(paragraph => `<p>${escapeHtml(paragraph).replaceAll("\n", "<br>")}</p>`)
    .join("");
}

function parseDate(value) { return value ? new Date(`${value}T12:00:00`) : new Date(0); }
function formatDate(value) { return value ? parseDate(value).toLocaleDateString("es-MX", { day:"numeric", month:"long", year:"numeric" }) : "Fecha desconocida"; }
function escapeHtml(value) { return String(value ?? "").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;"); }
