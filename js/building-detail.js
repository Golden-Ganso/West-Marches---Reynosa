document.addEventListener("DOMContentLoaded", async () => {
  const container = document.getElementById("building-detail");
  if (!container) return;

  try {
    const id = Number(new URLSearchParams(location.search).get("id"));
    if (!Number.isInteger(id) || id <= 0) throw new Error("ID de edificio inválido.");

    const response = await fetch(`/api/world?entity=buildings&id=${id}`, { cache: "no-store" });
    if (!response.ok) throw new Error("No fue posible cargar el edificio.");

    const building = await response.json();
    document.title = `${building.name} | Mundo`;
    renderBuilding(container, building);
    setupCatalogFilters(building.items || []);
  } catch (error) {
    console.error(error);
    container.innerHTML = `<div class="card loading-card">No fue posible cargar el edificio.</div>`;
  }
});

function renderBuilding(container, building) {
  const items = Array.isArray(building.items) ? building.items : [];
  const categories = [...new Set(items.map(item => item.category).filter(Boolean))]
    .sort((a, b) => a.localeCompare(b, "es"));
  const statuses = [...new Set(items.map(item => item.status).filter(Boolean))]
    .sort((a, b) => a.localeCompare(b, "es"));

  container.innerHTML = `
    <section class="card detail-panel">
      <p class="section-kicker">${escapeHtml(building.type || "Edificio")}</p>
      <h2>${escapeHtml(building.name || "Edificio")}</h2>
      <p>${escapeHtml(building.description || "")}</p>
      <div class="meta-list">
        <div><span>Estado</span><strong>${escapeHtml(building.status || "")}</strong></div>
        <div><span>Área</span><strong>${escapeHtml(building.area || "")}</strong></div>
        <div><span>Responsable</span><strong>${escapeHtml(building.owner_name || "Sin registrar")}</strong></div>
      </div>
    </section>

    ${renderServices(building.services || [])}

    ${items.length ? `
      <section class="section-block">
        <div class="section-heading">
          <div><p class="section-kicker">Mercancía disponible</p><h2>Catálogo</h2></div>
          <span id="catalog-count" class="section-help"></span>
        </div>

        <div class="card detail-panel catalog-filters">
          <label class="catalog-search-field">
            <span>Buscar</span>
            <input id="catalog-search" type="search" placeholder="Espada, cuerda, armadura..." autocomplete="off">
          </label>

          <label>
            <span>Categoría</span>
            <select id="catalog-category">
              <option value="">Todas</option>
              ${categories.map(category => `<option value="${escapeHtml(category)}">${escapeHtml(category)}</option>`).join("")}
            </select>
          </label>

          <label>
            <span>Estado</span>
            <select id="catalog-status">
              <option value="">Todos</option>
              ${statuses.map(status => `<option value="${escapeHtml(status)}">${escapeHtml(status)}</option>`).join("")}
            </select>
          </label>

          <label>
            <span>Precio mínimo</span>
            <input id="catalog-min-price" type="number" min="0" step="0.01" placeholder="0">
          </label>

          <label>
            <span>Precio máximo</span>
            <input id="catalog-max-price" type="number" min="0" step="0.01" placeholder="Sin límite">
          </label>

          <label>
            <span>Moneda</span>
            <select id="catalog-currency">
              <option value="">Todas</option>
              <option value="pc">pc</option>
              <option value="pp">pp</option>
              <option value="po">po</option>
              <option value="pe">pe</option>
              <option value="ppt">ppt</option>
            </select>
          </label>

          <label>
            <span>Ordenar</span>
            <select id="catalog-sort">
              <option value="name">Nombre A-Z</option>
              <option value="price-asc">Precio menor a mayor</option>
              <option value="price-desc">Precio mayor a menor</option>
              <option value="category">Categoría</option>
            </select>
          </label>

          <button id="catalog-reset" type="button" class="catalog-reset-button">Limpiar filtros</button>
        </div>

        <div id="catalog-results" class="card detail-panel"></div>
      </section>
    ` : ""}

    ${renderIncoming(building.incomingItems || [])}
    ${renderPeople(building.people || [])}
  `;
}

function setupCatalogFilters(items) {
  const results = document.getElementById("catalog-results");
  if (!results) return;

  const controls = {
    search: document.getElementById("catalog-search"),
    category: document.getElementById("catalog-category"),
    status: document.getElementById("catalog-status"),
    minPrice: document.getElementById("catalog-min-price"),
    maxPrice: document.getElementById("catalog-max-price"),
    currency: document.getElementById("catalog-currency"),
    sort: document.getElementById("catalog-sort"),
    reset: document.getElementById("catalog-reset"),
    count: document.getElementById("catalog-count")
  };

  const update = () => {
    const query = normalizeText(controls.search.value);
    const category = controls.category.value;
    const status = controls.status.value;
    const currency = controls.currency.value;
    const min = parseOptionalNumber(controls.minPrice.value);
    const max = parseOptionalNumber(controls.maxPrice.value);

    let filtered = items.filter(item => {
      const haystack = normalizeText(`${item.name || ""} ${item.category || ""} ${item.description || ""} ${item.status || ""}`);
      if (query && !haystack.includes(query)) return false;
      if (category && item.category !== category) return false;
      if (status && item.status !== status) return false;
      if (currency && item.currency !== currency) return false;

      const price = item.price == null ? null : Number(item.price);
      if (min != null && (price == null || price < min)) return false;
      if (max != null && (price == null || price > max)) return false;
      return true;
    });

    filtered = sortCatalog(filtered, controls.sort.value);
    renderCatalogResults(results, filtered);
    controls.count.textContent = `${filtered.length} de ${items.length} artículo${items.length === 1 ? "" : "s"}`;
  };

  [controls.search, controls.category, controls.status, controls.minPrice, controls.maxPrice, controls.currency, controls.sort]
    .forEach(control => {
      control.addEventListener("input", update);
      control.addEventListener("change", update);
    });

  controls.reset.addEventListener("click", () => {
    controls.search.value = "";
    controls.category.value = "";
    controls.status.value = "";
    controls.minPrice.value = "";
    controls.maxPrice.value = "";
    controls.currency.value = "";
    controls.sort.value = "name";
    update();
  });

  update();
}

function renderCatalogResults(container, items) {
  if (!items.length) {
    container.innerHTML = `<p class="muted-text">No hay artículos que coincidan con los filtros.</p>`;
    return;
  }

  container.innerHTML = items.map(item => `
    <article class="catalog-item">
      <div class="catalog-item-main">
        <strong>${escapeHtml(item.name || "Artículo")}</strong>
        <span>${escapeHtml(item.category || "Sin categoría")}</span>
        ${item.description ? `<p>${escapeHtml(item.description)}</p>` : ""}
      </div>
      <div class="catalog-item-data">
        <strong>${formatPrice(item)}</strong>
        <span>${escapeHtml(item.status || "")}</span>
        ${item.quantity != null ? `<small>Cantidad: ${Number(item.quantity)}</small>` : ""}
      </div>
    </article>
  `).join("");
}

function sortCatalog(items, mode) {
  const copy = [...items];
  if (mode === "price-asc") return copy.sort((a,b) => sortablePrice(a) - sortablePrice(b));
  if (mode === "price-desc") return copy.sort((a,b) => sortablePrice(b) - sortablePrice(a));
  if (mode === "category") return copy.sort((a,b) => String(a.category || "").localeCompare(String(b.category || ""), "es") || String(a.name || "").localeCompare(String(b.name || ""), "es"));
  return copy.sort((a,b) => String(a.name || "").localeCompare(String(b.name || ""), "es"));
}

function sortablePrice(item) {
  if (item.price == null) return Number.MAX_SAFE_INTEGER;
  const price = Number(item.price);
  // Conversión solo para ORDENAR entre monedas de D&D, no modifica el precio mostrado.
  const copperMultiplier = { pc:1, pp:10, pe:50, po:100, ppt:1000 };
  return price * (copperMultiplier[item.currency] || 100);
}

function renderServices(services) {
  if (!services.length) return "";
  return `<section class="section-block"><div class="section-heading"><div><p class="section-kicker">Atención</p><h2>Servicios</h2></div></div><div class="card detail-panel">${services.map(service => `<div class="detail-list-item"><div><strong>${escapeHtml(service.name)}</strong>${service.description ? `<p>${escapeHtml(service.description)}</p>` : ""}</div><span>${service.price != null ? `${service.price} ${escapeHtml(service.currency || "")}` : escapeHtml(service.status || "Disponible")}</span></div>`).join("")}</div></section>`;
}

function renderIncoming(items) {
  if (!items.length) return "";
  return `<section class="section-block"><div class="section-heading"><div><p class="section-kicker">Próximos cargamentos</p><h2>Próximamente</h2></div></div><div class="card detail-panel">${items.map(item => `<div class="detail-list-item"><div><strong>${escapeHtml(item.name)}</strong>${item.notes ? `<p>${escapeHtml(item.notes)}</p>` : ""}</div><span>${escapeHtml(item.status || "")}${item.source ? ` · ${escapeHtml(item.source)}` : ""}${item.expected_date ? ` · ${escapeHtml(item.expected_date)}` : ""}</span></div>`).join("")}</div></section>`;
}

function renderPeople(people) {
  if (!people.length) return "";
  return `<section class="section-block"><div class="section-heading"><div><p class="section-kicker">Personas</p><h2>Relacionados</h2></div></div><div class="card detail-panel">${people.map(person => `<div class="detail-list-item"><a class="chronicle-link" href="npc.html?id=${person.id}">${escapeHtml(person.name)}</a><span>${escapeHtml(person.relationship || person.title || "")}</span></div>`).join("")}</div></section>`;
}

function formatPrice(item) {
  return item.price != null
    ? `${Number(item.price)} ${escapeHtml(item.currency || "")}`
    : "Precio variable";
}

function parseOptionalNumber(value) {
  if (value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function normalizeText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
