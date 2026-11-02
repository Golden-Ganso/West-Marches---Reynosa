document.addEventListener("DOMContentLoaded", async () => {
  try {
    const response = await fetch("data/bestiary.json");
    if (!response.ok) throw new Error("No fue posible cargar bestiary.json");
    renderBestiary(await response.json());
  } catch (error) {
    console.error(error);
    document.getElementById("bestiary-grid").innerHTML = `<div class="card loading-card">No fue posible cargar el bestiario.</div>`;
  }
});

function renderBestiary(creatures) {
  const container = document.getElementById("bestiary-grid");
  container.innerHTML = creatures.length ? creatures.map(creature => {
    const rumored = String(creature.status).toLowerCase() === "rumor";
    const danger = Number(creature.danger || 0);
    const dangerText = danger ? "★".repeat(Math.min(5, danger)) + "☆".repeat(Math.max(0, 5-danger)) : "Desconocido";
    const image = creature.image
      ? `<img src="${encodeURI(creature.image)}" alt="${escapeHtml(creature.name)}" loading="lazy">`
      : `<div class="lore-placeholder">${rumored ? "?" : escapeHtml(String(creature.name || "?").charAt(0))}</div>`;

    return `<article class="card lore-card ${rumored ? "rumor-card" : ""}">
      <div class="lore-image">${image}</div>
      <div class="lore-content">
        <div class="card-topline"><div><p class="section-kicker">${escapeHtml(creature.status || "Desconocido")}</p><h2>${escapeHtml(creature.name || "???")}</h2></div><span class="lore-type">${escapeHtml(creature.type || "Desconocido")}</span></div>
        <p>${escapeHtml(creature.description || "Sin descripción.")}</p>
        <dl class="lore-details"><div><dt>Peligro</dt><dd>${dangerText}</dd></div><div><dt>Primer avistamiento</dt><dd>${creature.firstSeen ? `Expedición #${escapeHtml(creature.firstSeen)}` : "Sin confirmar"}</dd></div><div><dt>Lugares</dt><dd>${escapeHtml(Array.isArray(creature.locations) ? creature.locations.join(", ") : "Desconocidos")}</dd></div></dl>
        ${creature.notes ? `<p class="lore-notes"><strong>Notas:</strong> ${escapeHtml(creature.notes)}</p>` : ""}
      </div>
    </article>`;
  }).join("") : `<div class="card loading-card">Todavía no hay criaturas registradas.</div>`;
}

function escapeHtml(value) { return String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;"); }
