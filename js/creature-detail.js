document.addEventListener("DOMContentLoaded", async () => {
  const container = document.getElementById("creature-detail");
  if (!container) return;
  try {
    const id = Number(new URLSearchParams(location.search).get("id"));
    if (!Number.isInteger(id) || id <= 0) throw new Error("ID inválido.");
    const [creatureResponse, charactersResponse] = await Promise.all([
      fetch(`/api/data?entity=creatures&id=${id}`, { cache:"no-store" }),
      fetch("/api/data?entity=characters", { cache:"no-store" })
    ]);
    if (!creatureResponse.ok || !charactersResponse.ok) throw new Error("No fue posible cargar la ficha.");
    const creature = await creatureResponse.json();
    const characters = await charactersResponse.json();
    const knownIds = (creature.characterIds || []).map(Number);
    const knownBy = characters.filter(character => knownIds.includes(Number(character.id)));
    document.title = `${creature.name} | Bestiario`;
    container.innerHTML = `
      <section class="card detail-panel">
        <p class="section-kicker">${escapeHtml(creature.type || "Desconocido")}</p>
        <h2>${escapeHtml(creature.name || "Criatura")}</h2>
        ${creature.image ? `<div class="chronicle-image"><img src="${encodeURI(creature.image)}" alt="Ilustración de ${escapeHtml(creature.name)}"></div>` : ""}
        <div class="meta-list"><div><span>Estado</span><strong>${escapeHtml(creature.status || "Desconocido")}</strong></div><div><span>Peligro</span><strong>${Number(creature.danger || 0)}</strong></div><div><span>Primera aparición</span><strong>${creature.firstSeen ? `Expedición #${creature.firstSeen}` : "Desconocida"}</strong></div></div>
        <h3>Descripción</h3><p>${escapeHtml(creature.description || "Sin descripción.")}</p>
        ${creature.notes ? `<h3>Notas</h3><div class="character-background">${formatText(creature.notes)}</div>` : ""}
      </section>
      ${listSection("Lugares conocidos", creature.locations || [], value => escapeHtml(value))}
      ${listSection("Aventureros que la conocen", knownBy, character => `<a class="chronicle-link" href="personaje.html?id=${character.id}">${escapeHtml(character.name)}</a>`)}`;
  } catch (error) { console.error(error); container.innerHTML = `<div class="card loading-card">No fue posible cargar la criatura.</div>`; }
});
function listSection(title,items,render){return items.length?`<section class="section-block"><div class="section-heading"><div><h2>${title}</h2></div></div><div class="card detail-panel">${items.map(item=>`<div class="detail-list-item">${render(item)}</div>`).join("")}</div></section>`:"";}
function formatText(v){return String(v??"").split(/\n{2,}/).map(x=>`<p>${escapeHtml(x).replaceAll("\n","<br>")}</p>`).join("");}
function escapeHtml(value){return String(value??"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;");}
