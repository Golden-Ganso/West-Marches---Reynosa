document.addEventListener("DOMContentLoaded", async () => {
  try {
    const response = await fetch("data/factions.json");
    if (!response.ok) throw new Error("No fue posible cargar factions.json");
    renderFactions(await response.json());
  } catch (error) {
    console.error(error);
    document.getElementById("factions-grid").innerHTML = `<div class="card loading-card">No fue posible cargar las facciones.</div>`;
  }
});

function renderFactions(factions) {
  const container = document.getElementById("factions-grid");
  container.innerHTML = factions.length ? factions.map(faction => {
    const relationshipClass = relationshipSlug(faction.relationship);
    const image = faction.image
      ? `<img src="${encodeURI(faction.image)}" alt="Emblema de ${escapeHtml(faction.name)}" loading="lazy">`
      : `<div class="lore-placeholder">${escapeHtml(String(faction.name || "?").charAt(0))}</div>`;

    return `<article class="card lore-card">
      <div class="lore-image">${image}</div>
      <div class="lore-content">
        <div class="card-topline"><div><p class="section-kicker">${escapeHtml(faction.status || "Conocida")}</p><h2>${escapeHtml(faction.name || "Sin nombre")}</h2></div><span class="relationship-badge ${relationshipClass}">${escapeHtml(faction.relationship || "Desconocida")}</span></div>
        <p>${escapeHtml(faction.description || "Sin descripción.")}</p>
        <dl class="lore-details"><div><dt>Primer contacto</dt><dd>${faction.firstContact ? `Expedición #${escapeHtml(faction.firstContact)}` : "Sin registrar"}</dd></div></dl>
        ${faction.notes ? `<p class="lore-notes"><strong>Notas:</strong> ${escapeHtml(faction.notes)}</p>` : ""}
      </div>
    </article>`;
  }).join("") : `<div class="card loading-card">Todavía no hay facciones registradas.</div>`;
}

function relationshipSlug(value) {
  const text = String(value || "desconocida").toLowerCase();
  if (["aliada","amistosa"].includes(text)) return "relationship-friendly";
  if (["hostil","enemiga"].includes(text)) return "relationship-hostile";
  return "relationship-neutral";
}
function escapeHtml(value) { return String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;"); }
