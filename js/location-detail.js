document.addEventListener("DOMContentLoaded", async () => {
  try {
    const id = Number(new URLSearchParams(window.location.search).get("id"));
    if (!Number.isInteger(id) || id <= 0) throw new Error("ID inválido");
    const responses = await Promise.all([
      fetch("data/locations.json"), fetch("data/sessions.json"), fetch("data/characters.json"),
      fetch("data/bestiary.json"), fetch("data/factions.json")
    ]);
    if (responses.some(r => !r.ok)) throw new Error("No fue posible cargar los datos");
    const [locations,sessions,characters,bestiary,factions] = await Promise.all(responses.map(r => r.json()));
    const location = locations.find(item => Number(item.id) === id);
    if (!location) throw new Error("Lugar no encontrado");
    renderLocation(location,sessions,characters,bestiary,factions);
  } catch (error) {
    console.error(error);
    document.getElementById("location-detail").innerHTML = `<div class="card loading-card">No fue posible cargar el lugar.</div>`;
  }
});

function renderLocation(location,sessions,characters,bestiary,factions) {
  const characterIds = nums(location.characterIds), creatureIds = nums(location.creatureIds), factionIds = nums(location.factionIds);
  const visitors = characters.filter(x => characterIds.includes(Number(x.id)));
  const creatures = bestiary.filter(x => creatureIds.includes(Number(x.id)));
  const relatedFactions = factions.filter(x => factionIds.includes(Number(x.id)));
  const relatedSessions = sessions.filter(s => nums(s.locationIds).includes(Number(location.id))).sort((a,b) => date(b.date)-date(a.date));
  const discoveries = Array.isArray(location.discoveries) ? location.discoveries : [];
  const image = location.image ? `<img src="${encodeURI(location.image)}" alt="${esc(location.name)}">` : `<div class="location-image-placeholder">${esc(String(location.name || "?").charAt(0))}</div>`;
  const danger = Number(location.danger || 0);
  document.title = `${location.name} | West Marches Reynosa`;
  document.getElementById("location-detail").innerHTML = `
    <section class="card location-hero"><div class="location-hero-image">${image}</div><div class="location-hero-content">
      <p class="section-kicker">${esc(location.type || "Lugar")}</p><h2>${esc(location.name)}</h2>
      <p>${esc(location.description || "Sin descripción.")}</p>
      <div class="location-stats"><div><span>Estado</span><strong>${esc(location.status || "Desconocido")}</strong></div><div><span>Peligro</span><strong>${danger ? "★".repeat(Math.min(5,danger))+"☆".repeat(Math.max(0,5-danger)) : "Seguro / sin clasificar"}</strong></div><div><span>Descubierto</span><strong>${location.discoveredIn ? `Expedición #${esc(location.discoveredIn)}` : "Conocido desde el inicio"}</strong></div></div>
    </div></section>

    <section class="section-block expedition-detail-columns">
      <article class="card detail-panel"><p class="section-kicker">Hallazgos</p><h2>Descubrimientos</h2>${discoveries.length ? `<ul class="simple-list">${discoveries.map(x=>`<li>${esc(x)}</li>`).join("")}</ul>` : `<p class="muted-text">Sin hallazgos registrados.</p>`}</article>
      <article class="card detail-panel"><p class="section-kicker">Registro</p><h2>Notas</h2><p>${esc(location.notes || "No hay notas adicionales.")}</p></article>
    </section>

    <section class="section-block"><div class="section-heading"><div><p class="section-kicker">Historial</p><h2>Expediciones realizadas aquí</h2></div></div><div class="campaign-detail-grid">${relatedSessions.length ? relatedSessions.map(s=>`<article class="card detail-panel"><p class="section-kicker">Expedición #${esc(s.id)}</p><h3>${esc(s.title)}</h3><p>${format(s.date)}</p><a class="chronicle-link" href="expedicion.html?id=${encodeURIComponent(s.id)}">Ver expedición</a></article>`).join("") : `<div class="card loading-card">No hay expediciones vinculadas.</div>`}</div></section>

    <section class="section-block character-detail-columns">
      <article class="card detail-panel"><p class="section-kicker">Exploradores</p><h2>Aventureros</h2>${visitors.length ? visitors.map(x=>`<div class="detail-list-item"><strong>${esc(x.name)}</strong><span>${esc(x.class || "")}</span><a class="chronicle-link" href="personaje.html?id=${encodeURIComponent(x.id)}">Ver ficha</a></div>`).join("") : `<p class="muted-text">Sin aventureros vinculados.</p>`}</article>
      <article class="card detail-panel"><p class="section-kicker">Fauna y amenazas</p><h2>Criaturas</h2>${creatures.length ? creatures.map(x=>`<div class="detail-list-item"><strong>${esc(x.name)}</strong><span>${esc(x.type || "Desconocido")}</span></div>`).join("") : `<p class="muted-text">Sin criaturas vinculadas.</p>`}</article>
      <article class="card detail-panel"><p class="section-kicker">Influencias</p><h2>Facciones</h2>${relatedFactions.length ? relatedFactions.map(x=>`<div class="detail-list-item"><strong>${esc(x.name)}</strong><span>${esc(x.relationship || "Desconocida")}</span></div>`).join("") : `<p class="muted-text">Sin facciones vinculadas.</p>`}</article>
    </section>`;
}
function nums(v){ return Array.isArray(v) ? v.map(Number) : []; }
function date(v){ return new Date(`${v}T12:00:00`); }
function format(v){ return v ? date(v).toLocaleDateString("es-MX",{day:"numeric",month:"long",year:"numeric"}) : "Fecha por definir"; }
function esc(v){ return String(v ?? "").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;"); }
