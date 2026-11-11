const MAP_ZOOM_MIN = 1;
const MAP_ZOOM_MAX = 4;
const MAP_ZOOM_STEP = 0.25;

let mapScale = 1;
let mapOffsetX = 0;
let mapOffsetY = 0;
let mapDragging = false;
let mapDragPointerId = null;
let mapDragStartX = 0;
let mapDragStartY = 0;
let mapDragOriginX = 0;
let mapDragOriginY = 0;

document.addEventListener("DOMContentLoaded", async () => {
  try {
    const response = await fetch("/api/data?entity=locations", {
      cache: "no-store"
    });

    if (!response.ok) {
      throw new Error("No fue posible cargar las ubicaciones desde D1.");
    }

    const locations = await response.json();

    if (!Array.isArray(locations)) {
      throw new Error("La API de ubicaciones devolvió un formato inválido.");
    }

    renderMap(locations);
    setupMapInteraction();
  } catch (error) {
    console.error("Error cargando el mapa:", error);

    const panel = document.getElementById("map-place-panel");
    if (panel) {
      panel.innerHTML = `<p>No fue posible cargar los lugares del mapa.</p>`;
    }
  }
});

function setupMapInteraction() {
  const viewport = document.getElementById("map-viewport");
  const zoomIn = document.getElementById("map-zoom-in");
  const zoomOut = document.getElementById("map-zoom-out");
  const reset = document.getElementById("map-reset");

  if (!viewport) {
    console.warn("No se encontró #map-viewport. El mapa funcionará sin controles de zoom.");
    return;
  }

  if (zoomIn) {
    zoomIn.addEventListener("click", () => {
      setMapZoom(mapScale + MAP_ZOOM_STEP);
    });
  }

  if (zoomOut) {
    zoomOut.addEventListener("click", () => {
      setMapZoom(mapScale - MAP_ZOOM_STEP);
    });
  }

  if (reset) {
    reset.addEventListener("click", resetMapView);
  }

  viewport.addEventListener(
    "wheel",
    event => {
      event.preventDefault();

      const rect = viewport.getBoundingClientRect();
      const anchorX = event.clientX - rect.left;
      const anchorY = event.clientY - rect.top;
      const direction = event.deltaY < 0 ? MAP_ZOOM_STEP : -MAP_ZOOM_STEP;

      zoomAroundPoint(
        mapScale + direction,
        anchorX,
        anchorY
      );
    },
    { passive: false }
  );

  viewport.addEventListener("pointerdown", event => {
    if (mapScale <= 1) return;

    // Permite seguir pulsando los marcadores sin iniciar un arrastre.
    if (event.target.closest(".map-marker")) return;

    mapDragging = true;
    mapDragPointerId = event.pointerId;
    mapDragStartX = event.clientX;
    mapDragStartY = event.clientY;
    mapDragOriginX = mapOffsetX;
    mapDragOriginY = mapOffsetY;

    viewport.classList.add("is-dragging");
    viewport.setPointerCapture(event.pointerId);
  });

  viewport.addEventListener("pointermove", event => {
    if (!mapDragging || event.pointerId !== mapDragPointerId) return;

    mapOffsetX = mapDragOriginX + (event.clientX - mapDragStartX);
    mapOffsetY = mapDragOriginY + (event.clientY - mapDragStartY);

    constrainMapOffset();
    applyMapTransform();
  });

  const finishDrag = event => {
    if (!mapDragging || event.pointerId !== mapDragPointerId) return;

    mapDragging = false;
    mapDragPointerId = null;
    viewport.classList.remove("is-dragging");

    if (viewport.hasPointerCapture(event.pointerId)) {
      viewport.releasePointerCapture(event.pointerId);
    }
  };

  viewport.addEventListener("pointerup", finishDrag);
  viewport.addEventListener("pointercancel", finishDrag);

  window.addEventListener("resize", () => {
    constrainMapOffset();
    applyMapTransform();
  });

  applyMapTransform();
}

function setMapZoom(nextScale) {
  const viewport = document.getElementById("map-viewport");
  if (!viewport) return;

  zoomAroundPoint(
    nextScale,
    viewport.clientWidth / 2,
    viewport.clientHeight / 2
  );
}

function zoomAroundPoint(nextScale, anchorX, anchorY) {
  const oldScale = mapScale;
  const newScale = clamp(nextScale, MAP_ZOOM_MIN, MAP_ZOOM_MAX);

  if (newScale === oldScale) return;

  const mapX = (anchorX - mapOffsetX) / oldScale;
  const mapY = (anchorY - mapOffsetY) / oldScale;

  mapScale = newScale;
  mapOffsetX = anchorX - mapX * newScale;
  mapOffsetY = anchorY - mapY * newScale;

  if (mapScale === 1) {
    mapOffsetX = 0;
    mapOffsetY = 0;
  }

  constrainMapOffset();
  applyMapTransform();
}

function resetMapView() {
  mapScale = 1;
  mapOffsetX = 0;
  mapOffsetY = 0;
  applyMapTransform();
}

function constrainMapOffset() {
  const viewport = document.getElementById("map-viewport");

  if (!viewport) return;

  if (mapScale <= 1) {
    mapOffsetX = 0;
    mapOffsetY = 0;
    return;
  }

  const minX = viewport.clientWidth - viewport.clientWidth * mapScale;
  const minY = viewport.clientHeight - viewport.clientHeight * mapScale;

  mapOffsetX = clamp(mapOffsetX, minX, 0);
  mapOffsetY = clamp(mapOffsetY, minY, 0);
}

function applyMapTransform() {
  const map = document.getElementById("world-map");
  const label = document.getElementById("map-zoom-label");
  const zoomIn = document.getElementById("map-zoom-in");
  const zoomOut = document.getElementById("map-zoom-out");

  if (!map) return;

  map.style.transform = `translate(${mapOffsetX}px, ${mapOffsetY}px) scale(${mapScale})`;

  if (label) {
    label.textContent = `${Math.round(mapScale * 100)}%`;
  }

  if (zoomIn) {
    zoomIn.disabled = mapScale >= MAP_ZOOM_MAX;
  }

  if (zoomOut) {
    zoomOut.disabled = mapScale <= MAP_ZOOM_MIN;
  }
}

function renderMap(locations) {
  const map = document.getElementById("world-map");

  if (!map) {
    throw new Error("No se encontró el elemento #world-map.");
  }

  // Elimina únicamente capas generadas anteriormente.
  map.querySelector(".map-empty-state")?.remove();
  map.querySelector(".fog-layer")?.remove();
  map.querySelectorAll(".map-marker").forEach(marker => marker.remove());

  // IMPORTANTE: niebla y marcadores se agregan dentro de world-map.
  // De esta forma el zoom transforma todas las capas juntas.
  renderFogOfWar(map, locations);

  locations.forEach(location => {
    const x = clamp(Number(location.mapX), 0, 100);
    const y = clamp(Number(location.mapY), 0, 100);

    const marker = document.createElement("button");
    marker.type = "button";
    marker.className = `map-marker danger-${Math.min(
      5,
      Math.max(0, Number(location.danger || 0))
    )}`;

    marker.style.left = `${x}%`;
    marker.style.top = `${y}%`;

    marker.setAttribute(
      "aria-label",
      location.name || "Lugar"
    );

    marker.innerHTML = `
      <span class="map-marker-dot"></span>
      <span class="map-marker-label">
        ${escapeHtml(location.name || "Lugar")}
      </span>
    `;

    marker.addEventListener("click", event => {
      event.stopPropagation();
      renderMapPanel(location);
    });

    map.appendChild(marker);
  });

  if (locations.length) {
    renderMapPanel(locations[0]);
  }
}

function renderFogOfWar(map, locations) {
  const explored = locations.filter(
    location => location.explored !== false
  );

  const svgNS = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(svgNS, "svg");

  svg.setAttribute("class", "fog-layer");
  svg.setAttribute("viewBox", "0 0 1000 667");
  svg.setAttribute("preserveAspectRatio", "none");
  svg.setAttribute("aria-hidden", "true");

  const defs = document.createElementNS(svgNS, "defs");
  const mask = document.createElementNS(svgNS, "mask");

  // ID único para evitar conflictos si la página se vuelve a renderizar.
  const maskId = "fog-reveal-mask";
  mask.setAttribute("id", maskId);

  // Blanco = la niebla es visible.
  const whiteBackground = document.createElementNS(svgNS, "rect");
  whiteBackground.setAttribute("x", "0");
  whiteBackground.setAttribute("y", "0");
  whiteBackground.setAttribute("width", "1000");
  whiteBackground.setAttribute("height", "667");
  whiteBackground.setAttribute("fill", "white");
  mask.appendChild(whiteBackground);

  // Negro = abre agujeros en la niebla.
  explored.forEach(location => {
    addRevealCircle(mask, location, svgNS);
  });

  // Abre corredores entre sitios conectados y explorados.
  for (let i = 0; i < explored.length; i += 1) {
    for (let j = i + 1; j < explored.length; j += 1) {
      if (locationsConnected(explored[i], explored[j])) {
        addRevealCorridor(
          mask,
          explored[i],
          explored[j],
          svgNS
        );
      }
    }
  }

  defs.appendChild(mask);
  svg.appendChild(defs);

  const fog = document.createElementNS(svgNS, "rect");
  fog.setAttribute("x", "0");
  fog.setAttribute("y", "0");
  fog.setAttribute("width", "1000");
  fog.setAttribute("height", "667");
  fog.setAttribute("class", "fog-fill");
  fog.setAttribute("mask", `url(#${maskId})`);

  svg.appendChild(fog);

  // Prepend coloca la niebla debajo de los marcadores añadidos después.
  map.prepend(svg);
}

function addRevealCircle(mask, location, svgNS) {
  const x = clamp(Number(location.mapX), 0, 100) * 10;
  const y = clamp(Number(location.mapY), 0, 100) * 6.67;

  // revealRadius trabaja aproximadamente como porcentaje visual del mapa.
  const radius = Math.max(
    2,
    Number(location.revealRadius || 8)
  ) * 8;

  const circle = document.createElementNS(svgNS, "circle");
  circle.setAttribute("cx", String(x));
  circle.setAttribute("cy", String(y));
  circle.setAttribute("r", String(radius));
  circle.setAttribute("fill", "black");

  mask.appendChild(circle);
}

function addRevealCorridor(mask, a, b, svgNS) {
  const line = document.createElementNS(svgNS, "line");

  line.setAttribute(
    "x1",
    String(clamp(Number(a.mapX), 0, 100) * 10)
  );
  line.setAttribute(
    "y1",
    String(clamp(Number(a.mapY), 0, 100) * 6.67)
  );
  line.setAttribute(
    "x2",
    String(clamp(Number(b.mapX), 0, 100) * 10)
  );
  line.setAttribute(
    "y2",
    String(clamp(Number(b.mapY), 0, 100) * 6.67)
  );

  line.setAttribute("stroke", "black");

  // Usa el ancho configurado en cualquiera de los dos extremos.
  const width = Math.max(
    18,
    Number(
      a.corridorWidth ||
      b.corridorWidth ||
      35
    )
  );

  line.setAttribute("stroke-width", String(width));
  line.setAttribute("stroke-linecap", "round");

  mask.appendChild(line);
}

function locationsConnected(a, b) {
  const aConnections = Array.isArray(a.connectedTo)
    ? a.connectedTo.map(Number)
    : [];

  const bConnections = Array.isArray(b.connectedTo)
    ? b.connectedTo.map(Number)
    : [];

  return (
    aConnections.includes(Number(b.id)) ||
    bConnections.includes(Number(a.id))
  );
}

function renderMapPanel(location) {
  const panel = document.getElementById("map-place-panel");
  if (!panel) return;

  const danger = Math.min(
    5,
    Math.max(0, Number(location.danger || 0))
  );

  const dangerText = danger > 0
    ? `${"★".repeat(danger)}${"☆".repeat(5 - danger)}`
    : "Seguro / sin clasificar";

  panel.innerHTML = `
    <p class="section-kicker">
      ${escapeHtml(location.type || "Lugar")}
    </p>

    <h2>${escapeHtml(location.name || "Sin nombre")}</h2>

    <p>
      ${escapeHtml(location.description || "Sin descripción.")}
    </p>

    <div class="map-panel-stats">
      <div>
        <span>Estado</span>
        <strong>${escapeHtml(location.status || "Desconocido")}</strong>
      </div>

      <div>
        <span>Peligro</span>
        <strong>${dangerText}</strong>
      </div>

      <div>
        <span>Descubierto</span>
        <strong>
          ${
            location.discoveredIn
              ? `Expedición #${escapeHtml(location.discoveredIn)}`
              : "Conocido desde el inicio"
          }
        </strong>
      </div>
    </div>

    <a
      class="chronicle-link"
      href="lugar.html?id=${encodeURIComponent(location.id)}"
    >
      Ver ficha del lugar
    </a>
  `;
}

function clamp(value, min, max) {
  return Number.isFinite(value)
    ? Math.min(max, Math.max(min, value))
    : min;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
