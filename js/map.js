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

/* NIEBLA DE GUERRA BASICA
   Integra este contenido en js/map.js reemplazando renderMap() y agregando las funciones auxiliares.
*/

function renderMap(locations) {
  const map = document.getElementById("world-map");
  map.querySelector(".map-empty-state")?.remove();

  renderFogOfWar(map, locations);

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

function renderFogOfWar(map, locations) {
  const explored = locations.filter(location => location.explored !== false);
  if (!explored.length) return;

  const svgNS = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(svgNS, "svg");
  svg.setAttribute("class", "fog-layer");
  svg.setAttribute("viewBox", "0 0 1000 667");
  svg.setAttribute("preserveAspectRatio", "none");
  svg.setAttribute("aria-hidden", "true");

  const defs = document.createElementNS(svgNS, "defs");
  const mask = document.createElementNS(svgNS, "mask");
  mask.setAttribute("id", "fog-reveal-mask");

  const white = document.createElementNS(svgNS, "rect");
  white.setAttribute("x", "0"); white.setAttribute("y", "0");
  white.setAttribute("width", "1000"); white.setAttribute("height", "667");
  white.setAttribute("fill", "white");
  mask.appendChild(white);

  explored.forEach(location => {
    addRevealCircle(mask, location, svgNS);
  });

  for (let i = 0; i < explored.length; i += 1) {
    for (let j = i + 1; j < explored.length; j += 1) {
      if (locationsConnected(explored[i], explored[j])) {
        addRevealCorridor(mask, explored[i], explored[j], svgNS);
      }
    }
  }

  defs.appendChild(mask);
  svg.appendChild(defs);

  const fog = document.createElementNS(svgNS, "rect");
  fog.setAttribute("x", "0"); fog.setAttribute("y", "0");
  fog.setAttribute("width", "1000"); fog.setAttribute("height", "667");
  fog.setAttribute("class", "fog-fill");
  fog.setAttribute("mask", "url(#fog-reveal-mask)");
  svg.appendChild(fog);

  map.prepend(svg);
}

function addRevealCircle(mask, location, svgNS) {
  const circle = document.createElementNS(svgNS, "circle");
  circle.setAttribute("cx", String(clamp(Number(location.mapX), 0, 100) * 10));
  circle.setAttribute("cy", String(clamp(Number(location.mapY), 0, 100) * 6.67));
  circle.setAttribute("r", String(Math.max(2, Number(location.revealRadius || 8)) * 8));
  circle.setAttribute("fill", "black");
  mask.appendChild(circle);
}

function addRevealCorridor(mask, a, b, svgNS) {
  const line = document.createElementNS(svgNS, "line");
  line.setAttribute("x1", String(Number(a.mapX) * 10));
  line.setAttribute("y1", String(Number(a.mapY) * 6.67));
  line.setAttribute("x2", String(Number(b.mapX) * 10));
  line.setAttribute("y2", String(Number(b.mapY) * 6.67));
  line.setAttribute("stroke", "black");
  line.setAttribute("stroke-width", String(Math.max(18, Number(a.corridorWidth || b.corridorWidth || 35))));
  line.setAttribute("stroke-linecap", "round");
  mask.appendChild(line);
}

function locationsConnected(a, b) {
  const aConnections = Array.isArray(a.connectedTo) ? a.connectedTo.map(Number) : [];
  const bConnections = Array.isArray(b.connectedTo) ? b.connectedTo.map(Number) : [];
  return aConnections.includes(Number(b.id)) || bConnections.includes(Number(a.id));
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
