document.addEventListener("DOMContentLoaded", async () => {
  const container = document.getElementById("bestiary-page") || document.getElementById("bestiary-grid");
  if (!container) return;
  try {
    const response = await fetch("/api/data?entity=creatures", { cache:"no-store" });
    if (!response.ok) throw new Error("No fue posible cargar el bestiario.");
    const creatures = await response.json();
    container.innerHTML = creatures.length ? creatures.map(creature => `
      <article class="card detail-panel">
        <div class="card-topline"><div><p class="section-kicker">${escapeHtml(creature.type || "Desconocido")}</p><h2>${escapeHtml(creature.name || "Criatura")}</h2></div><span class="status-badge status-open">Peligro ${Number(creature.danger || 0)}</span></div>
        <p>${escapeHtml(creature.description || "Sin descripción.")}</p>
        <div class="meta-list"><div><span>Estado</span><strong>${escapeHtml(creature.status || "Desconocido")}</strong></div><div><span>Primera aparición</span><strong>${creature.firstSeen ? `Expedición #${creature.firstSeen}` : "Desconocida"}</strong></div></div>
        <a class="chronicle-link" href="criatura.html?id=${encodeURIComponent(creature.id)}">Ver ficha</a>
      </article>`).join("") : `<div class="card loading-card">No hay criaturas registradas.</div>`;
  } catch (error) { console.error(error); container.innerHTML = `<div class="card loading-card">No fue posible cargar el bestiario.</div>`; }
});
function escapeHtml(value){return String(value??"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;");}
