document.addEventListener("DOMContentLoaded", async () => {
  const container = document.getElementById("faction-detail");
  if (!container) return;
  try {
    const id = Number(new URLSearchParams(location.search).get("id"));
    if (!Number.isInteger(id) || id <= 0) throw new Error("ID inválido.");
    const [factionResponse, charactersResponse] = await Promise.all([
      fetch(`/api/data?entity=factions&id=${id}`, { cache:"no-store" }),
      fetch("/api/data?entity=characters", { cache:"no-store" })
    ]);
    if (!factionResponse.ok || !charactersResponse.ok) throw new Error("No fue posible cargar la ficha.");
    const faction = await factionResponse.json();
    const characters = await charactersResponse.json();
    const knownIds = (faction.characterIds || []).map(Number);
    const related = characters.filter(character => knownIds.includes(Number(character.id)));
    document.title = `${faction.name} | Facciones`;
    container.innerHTML = `
      <section class="card detail-panel">
        <p class="section-kicker">${escapeHtml(faction.status || "Conocida")}</p>
        <h2>${escapeHtml(faction.name || "Facción")}</h2>
        ${faction.image ? `<div class="chronicle-image"><img src="${encodeURI(faction.image)}" alt="Imagen de ${escapeHtml(faction.name)}"></div>` : ""}
        <div class="meta-list"><div><span>Relación</span><strong>${escapeHtml(faction.relationship || "Desconocida")}</strong></div><div><span>Primer contacto</span><strong>${faction.firstContact ? `Expedición #${faction.firstContact}` : "Desconocido"}</strong></div></div>
        <h3>Descripción</h3><div class="character-background">${formatText(faction.description || "Sin descripción.")}</div>
        ${faction.notes ? `<h3>Notas</h3><div class="character-background">${formatText(faction.notes)}</div>` : ""}
      </section>
      ${listSection("Aventureros relacionados", related, character => `<a class="chronicle-link" href="personaje.html?id=${character.id}">${escapeHtml(character.name)}</a>`)}`;
  } catch (error) { console.error(error); container.innerHTML = `<div class="card loading-card">No fue posible cargar la facción.</div>`; }
});
function listSection(title,items,render){return items.length?`<section class="section-block"><div class="section-heading"><div><h2>${title}</h2></div></div><div class="card detail-panel">${items.map(item=>`<div class="detail-list-item">${render(item)}</div>`).join("")}</div></section>`:"";}
function formatText(v){return String(v??"").split(/\n{2,}/).map(x=>`<p>${escapeHtml(x).replaceAll("\n","<br>")}</p>`).join("");}
function escapeHtml(value){return String(value??"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;");}
