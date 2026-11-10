const ADMIN_ENTITIES = {
  characters: { title: "Personajes", nameField: "name", fields: ["id","name","pronunciation","race","class_name","level","status","player","image","bio","background"], wide: ["bio","background"] },
  sessions: { title: "Expediciones", nameField: "title", fields: ["id","title","session_date","session_time","status","slots","level","description","objective","result","result_summary","notes"], wide: ["description","objective","result_summary","notes"] },
  chronicles: { title: "Crónicas", nameField: "title", fields: ["id","session_id","title","chronicle_date","author","image","summary"], wide: ["summary"] },
  creatures: { title: "Bestiario", nameField: "name", fields: ["id","name","type","status","first_seen","danger","image","description","notes"], wide: ["description","notes"] },
  factions: { title: "Facciones", nameField: "name", fields: ["id","name","status","relationship","image","description","first_contact","notes"], wide: ["description","notes"] },
  locations: { title: "Ubicaciones", nameField: "name", fields: ["id","name","type","status","danger","discovered_in","image","map_x","map_y","explored","reveal_radius","corridor_width","description","notes"], wide: ["description","notes"] },
  lore: { title: "Biblioteca", nameField: "title", fields: ["id","title","type","category","author","status","knowledge","image","found_in_session","found_at_location","summary","content"], wide: ["summary","content"] },
  rumors: { title: "Rumores", nameField: "title", fields: ["id","title","text","status"], wide: ["text"] },
  news: { title: "Noticias", nameField: "title", fields: ["id","type","news_date","title","text","link"], wide: ["text"] }
};

let adminEntity = "characters";
let selectedAdminId = null;
let adminItems = [];

document.addEventListener("DOMContentLoaded", initializeAdmin);

async function initializeAdmin() {
  buildAdminMenu();

  document.getElementById("admin-login-form").addEventListener("submit", loginAdmin);
  document.getElementById("admin-logout").addEventListener("click", logoutAdmin);
  document.getElementById("admin-new").addEventListener("click", () => renderAdminForm({}));
  document.getElementById("admin-save").addEventListener("click", saveAdminItem);
  document.getElementById("admin-delete").addEventListener("click", deleteAdminItem);

  try {
    const response = await fetch("/api/admin-auth", { cache: "no-store" });
    const data = await response.json();
    setAdminLoggedIn(Boolean(data.authenticated));
  } catch {
    setAdminLoggedIn(false);
  }
}

function buildAdminMenu() {
  const menu = document.getElementById("admin-menu");
  menu.innerHTML = Object.entries(ADMIN_ENTITIES)
    .map(([key, value]) => `<button type="button" data-entity="${key}">${escapeAdmin(value.title)}</button>`)
    .join("");

  menu.addEventListener("click", event => {
    const button = event.target.closest("button[data-entity]");
    if (!button) return;
    adminEntity = button.dataset.entity;
    selectedAdminId = null;
    loadAdminEntity();
  });
}

async function loginAdmin(event) {
  event.preventDefault();
  const message = document.getElementById("admin-login-message");
  message.textContent = "Validando...";
  message.classList.remove("error");

  const response = await fetch("/api/admin-auth", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username: document.getElementById("admin-username").value,
      password: document.getElementById("admin-password").value
    })
  });

  const data = await response.json();
  if (!response.ok || !data.ok) {
    message.textContent = data.error || "No fue posible iniciar sesión.";
    message.classList.add("error");
    return;
  }

  document.getElementById("admin-password").value = "";
  setAdminLoggedIn(true);
}

async function logoutAdmin() {
  await fetch("/api/admin-auth", { method: "DELETE" });
  setAdminLoggedIn(false);
}

function setAdminLoggedIn(loggedIn) {
  document.getElementById("admin-login").hidden = loggedIn;
  document.getElementById("admin-panel").hidden = !loggedIn;

  if (loggedIn) loadAdminEntity();
}

async function loadAdminEntity() {
  setAdminMessage("Cargando...");

  document.querySelectorAll("#admin-menu button[data-entity]").forEach(button => {
    button.classList.toggle("active", button.dataset.entity === adminEntity);
  });

  const config = ADMIN_ENTITIES[adminEntity];
  document.getElementById("admin-entity-title").textContent = config.title;
  document.getElementById("admin-help").textContent = "Los cambios se guardan directamente en D1. Las relaciones avanzadas entre tablas se agregarán al panel después de validar este CRUD principal.";

  const response = await fetch(`/api/admin?entity=${encodeURIComponent(adminEntity)}`, { cache: "no-store" });

  if (response.status === 401) {
    setAdminLoggedIn(false);
    return;
  }

  const data = await response.json();
  if (!response.ok || !data.ok) {
    setAdminMessage(data.error || "No fue posible consultar la tabla.", true);
    return;
  }

  adminItems = Array.isArray(data.items) ? data.items : [];
  renderAdminTable();
  renderAdminForm({});
  setAdminMessage("");
}

function renderAdminTable() {
  const config = ADMIN_ENTITIES[adminEntity];
  const table = document.getElementById("admin-table");

  table.innerHTML = `
    <table>
      <thead><tr><th>ID</th><th>Nombre / Título</th><th>Estado</th><th></th></tr></thead>
      <tbody>
        ${adminItems.map(item => `
          <tr>
            <td>${escapeAdmin(item.id)}</td>
            <td>${escapeAdmin(item[config.nameField] || "")}</td>
            <td>${escapeAdmin(item.status || item.relationship || "")}</td>
            <td><button type="button" class="admin-button" data-edit-id="${item.id}">Editar</button></td>
          </tr>`).join("")}
      </tbody>
    </table>`;

  table.querySelectorAll("button[data-edit-id]").forEach(button => {
    button.addEventListener("click", () => {
      const id = Number(button.dataset.editId);
      const item = adminItems.find(entry => Number(entry.id) === id);
      if (item) renderAdminForm(item);
    });
  });
}

function renderAdminForm(item) {
  const config = ADMIN_ENTITIES[adminEntity];
  selectedAdminId = Number(item.id) || null;

  document.getElementById("admin-form").innerHTML = config.fields.map(field => {
    const value = item[field] ?? "";
    const wide = config.wide.includes(field);
    const readonly = field === "id" && selectedAdminId;

    if (wide) {
      return `<label class="admin-wide">${escapeAdmin(field)}<textarea name="${field}">${escapeAdmin(value)}</textarea></label>`;
    }

    return `<label>${escapeAdmin(field)}<input name="${field}" value="${escapeAdmin(value)}" ${readonly ? "readonly" : ""}></label>`;
  }).join("");

  document.getElementById("admin-delete").disabled = !selectedAdminId;
  setAdminMessage(selectedAdminId ? `Editando ID ${selectedAdminId}.` : "Nuevo registro.");
}

async function saveAdminItem() {
  const form = document.getElementById("admin-form");
  const raw = Object.fromEntries(new FormData(form).entries());
  const data = {};

  Object.entries(raw).forEach(([key, value]) => {
    if (key === "id") {
      if (value !== "") data.id = Number(value);
      return;
    }
    data[key] = value === "" ? null : normalizeAdminValue(key, value);
  });

  if (!selectedAdminId && raw.id !== "") data.id = Number(raw.id);

  const response = await fetch(`/api/admin?entity=${encodeURIComponent(adminEntity)}`, {
    method: selectedAdminId ? "PUT" : "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(selectedAdminId ? { id: selectedAdminId, data } : { data })
  });

  const result = await response.json();
  if (!response.ok || !result.ok) {
    setAdminMessage(result.error || "No fue posible guardar.", true);
    return;
  }

  setAdminMessage("Registro guardado correctamente.");
  await loadAdminEntity();
}

async function deleteAdminItem() {
  if (!selectedAdminId) return;
  if (!window.confirm(`¿Eliminar el registro ID ${selectedAdminId}?`)) return;

  const response = await fetch(`/api/admin?entity=${encodeURIComponent(adminEntity)}`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id: selectedAdminId })
  });

  const result = await response.json();
  if (!response.ok || !result.ok) {
    setAdminMessage(result.error || "No fue posible eliminar.", true);
    return;
  }

  selectedAdminId = null;
  await loadAdminEntity();
}

function normalizeAdminValue(field, value) {
  const numericFields = new Set([
    "level","slots","session_id","first_seen","danger","first_contact",
    "discovered_in","map_x","map_y","explored","reveal_radius","corridor_width",
    "found_in_session","found_at_location"
  ]);

  if (numericFields.has(field)) {
    const number = Number(value);
    return Number.isFinite(number) ? number : null;
  }

  return value;
}

function setAdminMessage(message, error = false) {
  const element = document.getElementById("admin-message");
  element.textContent = message;
  element.classList.toggle("error", error);
}

function escapeAdmin(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
