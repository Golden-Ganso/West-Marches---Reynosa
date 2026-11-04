let libraryEntries = [];
let activeCategory = "Todos";

document.addEventListener("DOMContentLoaded", async () => {
  try {
    const response = await fetch("data/lore.json");
    if (!response.ok) throw new Error("No fue posible cargar lore.json");
    libraryEntries = await response.json();
    renderFilters(libraryEntries);
    renderLibrary();
    document.getElementById("library-search").addEventListener("input", renderLibrary);
  } catch (error) {
    console.error(error);
    document.getElementById("library-grid").innerHTML = `<div class="card loading-card">No fue posible cargar la Biblioteca.</div>`;
  }
});

function renderFilters(entries) {
  const categories = ["Todos", ...new Set(entries.map(item => item.category || "Sin categoría"))];
  const container = document.getElementById("library-filters");
  container.innerHTML = categories.map(category => `<button type="button" class="library-filter${category === activeCategory ? " active" : ""}" data-category="${escapeHtml(category)}">${escapeHtml(category)}</button>`).join("");
  container.querySelectorAll("button").forEach(button => button.addEventListener("click", () => {
    activeCategory = button.dataset.category;
    container.querySelectorAll("button").forEach(item => item.classList.toggle("active", item === button));
    renderLibrary();
  }));
}

function renderLibrary() {
  const query = normalize(document.getElementById("library-search").value);
  const filtered = libraryEntries.filter(item => {
    const categoryMatch = activeCategory === "Todos" || (item.category || "Sin categoría") === activeCategory;
    const haystack = normalize([item.title,item.type,item.category,item.author,item.summary,...(Array.isArray(item.tags) ? item.tags : [])].join(" "));
    return categoryMatch && (!query || haystack.includes(query));
  });

  document.getElementById("library-count").textContent = `${filtered.length} documento${filtered.length === 1 ? "" : "s"}`;
  document.getElementById("library-grid").innerHTML = filtered.length ? filtered.map(item => libraryCard(item)).join("") : `<div class="card loading-card">No hay documentos que coincidan con la búsqueda.</div>`;
}

function libraryCard(item) {
  const tags = Array.isArray(item.tags) ? item.tags.slice(0,4) : [];
  const image = item.image ? `<img src="${encodeURI(item.image)}" alt="${escapeHtml(item.title)}" loading="lazy">` : `<div class="library-placeholder">${escapeHtml(symbolForType(item.type))}</div>`;
  return `<article class="card library-card">
    <div class="library-card-image">${image}</div>
    <div class="library-card-content">
      <div class="card-topline"><div><p class="section-kicker">${escapeHtml(item.type || "Documento")}</p><h2>${escapeHtml(item.title || "Sin título")}</h2></div><span class="knowledge-badge knowledge-${knowledgeSlug(item.knowledge)}">${escapeHtml(knowledgeLabel(item.knowledge))}</span></div>
      <p class="library-summary">${escapeHtml(item.summary || "Sin resumen.")}</p>
      <p class="feed-meta">${item.author ? `Autor: ${escapeHtml(item.author)}` : "Autor desconocido"}${item.foundInSession ? ` · Expedición #${escapeHtml(item.foundInSession)}` : ""}</p>
      ${tags.length ? `<div class="library-tags">${tags.map(tag => `<span>${escapeHtml(tag)}</span>`).join("")}</div>` : ""}
      <a class="chronicle-link" href="documento.html?id=${encodeURIComponent(item.id)}">Leer documento</a>
    </div>
  </article>`;
}

function knowledgeSlug(value){ return ["unknown","partial","translated","complete"].includes(value) ? value : "complete"; }
function knowledgeLabel(value){ return ({unknown:"Desconocido",partial:"Parcial",translated:"Traducido",complete:"Completo"})[knowledgeSlug(value)]; }
function symbolForType(type){ const v=String(type||"").toLowerCase(); if(v.includes("carta"))return "✉"; if(v.includes("pergamino"))return "§"; if(v.includes("inscripción"))return "◇"; if(v.includes("informe"))return "▤"; return "▥"; }
function normalize(value){ return String(value ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase(); }
function escapeHtml(value){ return String(value ?? "").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;"); }
