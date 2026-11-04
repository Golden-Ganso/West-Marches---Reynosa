document.addEventListener("DOMContentLoaded", async () => {
  try {
    const id = Number(new URLSearchParams(window.location.search).get("id"));
    if (!Number.isInteger(id) || id <= 0) throw new Error("ID inválido");
    const responses = await Promise.all([
      fetch("data/lore.json"), fetch("data/sessions.json"), fetch("data/characters.json"), fetch("data/locations.json"), fetch("data/factions.json")
    ]);
    if (responses.some(r => !r.ok)) throw new Error("No fue posible cargar los datos");
    const [lore,sessions,characters,locations,factions] = await Promise.all(responses.map(r => r.json()));
    const item = lore.find(entry => Number(entry.id) === id);
    if (!item) throw new Error("Documento no encontrado");
    renderLore(item,sessions,characters,locations,factions);
  } catch (error) {
    console.error(error);
    document.getElementById("lore-detail").innerHTML = `<div class="card loading-card">No fue posible cargar el documento.</div>`;
  }
});

function renderLore(item,sessions,characters,locations,factions) {
  const session = sessions.find(x => Number(x.id) === Number(item.foundInSession));
  const location = locations.find(x => Number(x.id) === Number(item.foundAtLocation));
  const characterIds = nums(item.characterIds), factionIds = nums(item.factionIds);
  const discoverers = characters.filter(x => characterIds.includes(Number(x.id)));
  const relatedFactions = factions.filter(x => factionIds.includes(Number(x.id)));
  const tags = Array.isArray(item.tags) ? item.tags : [];
  const image = item.image ? `<img src="${encodeURI(item.image)}" alt="${esc(item.title)}">` : `<div class="lore-document-placeholder">${esc(String(item.type || "Documento").charAt(0))}</div>`;
  document.title = `${item.title} | West Marches Reynosa`;

  document.getElementById("lore-detail").innerHTML = `
    <section class="card lore-document-hero">
      <div class="lore-document-image">${image}</div>
      <div class="lore-document-summary">
        <p class="section-kicker">${esc(item.type || "Documento")} · ${esc(item.category || "Sin categoría")}</p>
        <h2>${esc(item.title || "Sin título")}</h2>
        <p>${esc(item.summary || "Sin resumen.")}</p>
        <div class="lore-document-meta">
          <div><span>Autor</span><strong>${esc(item.author || "Desconocido")}</strong></div>
          <div><span>Conocimiento</span><strong>${esc(knowledgeLabel(item.knowledge))}</strong></div>
          <div><span>Hallado</span><strong>${session ? `Expedición #${esc(session.id)}` : "Sin registrar"}</strong></div>
          <div><span>Lugar</span><strong>${location ? esc(location.name) : "Sin registrar"}</strong></div>
        </div>
        ${tags.length ? `<div class="library-tags">${tags.map(tag => `<span>${esc(tag)}</span>`).join("")}</div>` : ""}
      </div>
    </section>

    <section class="section-block"><div class="section-heading"><div><p class="section-kicker">Transcripción</p><h2>Contenido</h2></div></div><article class="card lore-reading"><div class="lore-reading-text">${esc(item.content || "El contenido de este documento todavía no ha sido registrado.")}</div></article></section>

    <section class="section-block character-detail-columns">
      <article class="card detail-panel"><p class="section-kicker">Descubrimiento</p><h2>Contexto</h2>${session ? `<div class="detail-list-item"><strong>${esc(session.title)}</strong><span>Expedición #${esc(session.id)}</span><a class="chronicle-link" href="expedicion.html?id=${encodeURIComponent(session.id)}">Ver expedición</a></div>` : `<p class="muted-text">Sin expedición vinculada.</p>`}${location ? `<div class="detail-list-item"><strong>${esc(location.name)}</strong><span>${esc(location.type || "Lugar")}</span><a class="chronicle-link" href="lugar.html?id=${encodeURIComponent(location.id)}">Ver lugar</a></div>` : ""}</article>
      <article class="card detail-panel"><p class="section-kicker">Lectores y descubridores</p><h2>Aventureros</h2>${discoverers.length ? discoverers.map(x => `<div class="detail-list-item"><strong>${esc(x.name)}</strong><span>${esc(x.class || "")}</span><a class="chronicle-link" href="personaje.html?id=${encodeURIComponent(x.id)}">Ver ficha</a></div>`).join("") : `<p class="muted-text">Sin personajes vinculados.</p>`}</article>
      <article class="card detail-panel"><p class="section-kicker">Relaciones</p><h2>Facciones</h2>${relatedFactions.length ? relatedFactions.map(x => `<div class="detail-list-item"><strong>${esc(x.name)}</strong><span>${esc(x.relationship || "Desconocida")}</span><a class="chronicle-link" href="facciones.html">Ver facciones</a></div>`).join("") : `<p class="muted-text">Sin facciones vinculadas.</p>`}</article>
    </section>`;
}
function nums(v){ return Array.isArray(v) ? v.map(Number) : []; }
function knowledgeLabel(value){ return ({unknown:"Desconocido",partial:"Traducción parcial",translated:"Traducido",complete:"Completo"})[["unknown","partial","translated","complete"].includes(value) ? value : "complete"]; }
function esc(value){ return String(value ?? "").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;"); }
