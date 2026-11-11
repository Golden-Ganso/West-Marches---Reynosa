document.addEventListener("DOMContentLoaded", async () => {
  const container = document.getElementById("factions-page") || document.getElementById("factions-grid");
  if (!container) return;
  try {
    const response = await fetch("/api/data?entity=factions", { cache:"no-store" });
    if (!response.ok) throw new Error("No fue posible cargar las facciones.");
    const factions = await response.json();
    container.innerHTML = factions.length ? factions.map(faction => `
      <article class="card detail-panel">
        <div class="card-topline"><div><p class="section-kicker">${escapeHtml(faction.status || "Conocida")}</p><h2>${escapeHtml(faction.name || "Facción")}</h2></div></div>
        <p>${escapeHtml(faction.description || "Sin descripción.")}</p>
        <p class="feed-meta"><strong>Relación:</strong> ${escapeHtml(faction.relationship || "Desconocida")}</p>
        <a class="chronicle-link" href="faccion.html?id=${encodeURIComponent(faction.id)}">Ver ficha</a>
      </article>`).join("") : `<div class="card loading-card">No hay facciones registradas.</div>`;
  } catch (error) { console.error(error); container.innerHTML = `<div class="card loading-card">No fue posible cargar las facciones.</div>`; }
});
function escapeHtml(value){return String(value??"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;");}
