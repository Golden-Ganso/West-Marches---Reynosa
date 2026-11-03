document.addEventListener("DOMContentLoaded", async () => {
  try {
    const response = await fetch("data/locations.json");
    if (!response.ok) throw new Error("No fue posible cargar locations.json");
    renderMap(await response.json());
  } catch (error) {
    console.error(error);
    document.getElementById("map-place-panel").innerHTML = `<p>No fue posible cargar los lugares del mapa.</p>`;
  }
});

function renderMap(locations) {
  const map = document.getElementById("world-map");
  map.querySelector(".map-empty-state")?.remove();

  locations.forEach(location => {
    const x = clamp(Number(location.mapX), 0, 100);
    const y = clamp(Number(location.mapY), 0, 100);
    const marker = document.createElement("button");
    marker.type = "button";
    marker.className = `map-marker danger-${Math.min(5, Math.max(0, Number(location.danger || 0)))}`;
    marker.style.left = `${x}%`;
    marker.style.top = `${y}%`;
    marker.setAttribute("aria-label", location.name || "Lugar");
    marker.innerHTML = `<span class="map-marker-dot"></span><span class="map-marker-label">${escapeHtml(location.name || "Lugar")}</span>`;
    marker.addEventListener("click", () => renderMapPanel(location));
    map.appendChild(marker);
  });

  if (locations.length) renderMapPanel(locations[0]);
}

function renderMapPanel(location) {
  const danger = Number(location.danger || 0);
  const dangerText = danger > 0 ? `${"★".repeat(Math.min(5,danger))}${"☆".repeat(Math.max(0,5-danger))}` : "Seguro / sin clasificar";
  document.getElementById("map-place-panel").innerHTML = `
    <p class="section-kicker">${escapeHtml(location.type || "Lugar")}</p>
    <h2>${escapeHtml(location.name || "Sin nombre")}</h2>
    <p>${escapeHtml(location.description || "Sin descripción.")}</p>
    <div class="map-panel-stats">
      <div><span>Estado</span><strong>${escapeHtml(location.status || "Desconocido")}</strong></div>
      <div><span>Peligro</span><strong>${dangerText}</strong></div>
      <div><span>Descubierto</span><strong>${location.discoveredIn ? `Expedición #${escapeHtml(location.discoveredIn)}` : "Conocido desde el inicio"}</strong></div>
    </div>
    <a class="chronicle-link" href="lugar.html?id=${encodeURIComponent(location.id)}">Ver ficha del lugar</a>`;
}
function clamp(value,min,max){ return Number.isFinite(value) ? Math.min(max,Math.max(min,value)) : 50; }
function escapeHtml(value){ return String(value ?? "").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;"); }
