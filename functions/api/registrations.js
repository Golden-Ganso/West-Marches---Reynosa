let registrationCharacters = [];

async function loadRegistrationCharacters() {
  if (registrationCharacters.length) return registrationCharacters;

  const response = await fetch("data/characters.json", { cache: "no-store" });
  if (!response.ok) throw new Error("No fue posible cargar characters.json");

  const characters = await response.json();
  registrationCharacters = characters
    .filter(character => String(character.status || "").toLowerCase() === "activo")
    .sort((a, b) => String(a.name).localeCompare(String(b.name), "es"));

  return registrationCharacters;
}

function registrationPanelHtml(session) {
  const sessionId = Number(session.id);
  const isOpen = String(session.status || "").toLowerCase() === "open";

  if (!isOpen) {
    return `
      <div class="registration-panel registration-closed">
        <p class="registration-message">Inscripciones cerradas.</p>
      </div>
    `;
  }

  return `
    <div class="registration-panel" data-registration-session="${sessionId}">
      <div class="registration-summary">
        <strong class="registration-count">Cargando registros...</strong>
        <span class="registration-availability"></span>
      </div>

      <div class="registration-list" aria-live="polite"></div>

      <div class="registration-actions">
        <label>
          <span>Personaje</span>
          <select class="registration-character-select">
            <option value="">Cargando personajes...</option>
          </select>
        </label>

        <button type="button" class="registration-join-button">Apartar lugar</button>
        <button type="button" class="registration-cancel-button">Cancelar registro</button>
      </div>

      <p class="registration-feedback" aria-live="polite"></p>
    </div>
  `;
}

async function initializeRegistrationPanels(root = document) {
  const panels = [...root.querySelectorAll("[data-registration-session]")];
  if (!panels.length) return;

  const characters = await loadRegistrationCharacters();

  for (const panel of panels) {
    populateCharacterSelect(panel, characters);
    wireRegistrationPanel(panel);
    await refreshRegistrationPanel(panel);
  }
}

function populateCharacterSelect(panel, characters) {
  const select = panel.querySelector(".registration-character-select");
  select.innerHTML = `
    <option value="">Selecciona un personaje</option>
    ${characters.map(character => `
      <option value="${Number(character.id)}">
        ${escapeRegistrationHtml(character.name)}${character.player ? ` · ${escapeRegistrationHtml(character.player)}` : ""}
      </option>
    `).join("")}
  `;
}

function wireRegistrationPanel(panel) {
  if (panel.dataset.wired === "true") return;
  panel.dataset.wired = "true";

  panel.querySelector(".registration-join-button").addEventListener("click", () => submitRegistration(panel, "POST"));
  panel.querySelector(".registration-cancel-button").addEventListener("click", () => submitRegistration(panel, "DELETE"));
}

async function refreshRegistrationPanel(panel) {
  const sessionId = Number(panel.dataset.registrationSession);
  setRegistrationBusy(panel, true, "Actualizando registros...");

  try {
    const response = await fetch(`/api/registrations?session=${encodeURIComponent(sessionId)}`, { cache: "no-store" });
    const data = await response.json();

    if (!response.ok || !data.ok) throw new Error(data.error || "No fue posible consultar los registros.");

    renderRegistrationState(panel, data);
    setRegistrationFeedback(panel, "");
  } catch (error) {
    setRegistrationFeedback(panel, error.message, true);
  } finally {
    setRegistrationBusy(panel, false);
  }
}

async function submitRegistration(panel, method) {
  const sessionId = Number(panel.dataset.registrationSession);
  const select = panel.querySelector(".registration-character-select");
  const characterId = Number(select.value);

  if (!Number.isInteger(characterId) || characterId <= 0) {
    setRegistrationFeedback(panel, "Selecciona un personaje.", true);
    return;
  }

  setRegistrationBusy(panel, true, method === "POST" ? "Registrando..." : "Cancelando...");

  try {
    const response = await fetch("/api/registrations", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId, characterId })
    });

    const data = await response.json();
    if (!response.ok || !data.ok) throw new Error(data.error || "No fue posible completar la operación.");

    renderRegistrationState(panel, data);
    setRegistrationFeedback(panel, data.message || "Listo.");
  } catch (error) {
    setRegistrationFeedback(panel, error.message, true);
    await refreshRegistrationPanel(panel);
  } finally {
    setRegistrationBusy(panel, false);
  }
}

function renderRegistrationState(panel, data) {
  const count = panel.querySelector(".registration-count");
  const availability = panel.querySelector(".registration-availability");
  const list = panel.querySelector(".registration-list");
  const joinButton = panel.querySelector(".registration-join-button");

  count.textContent = `${data.registered} / ${data.slots} inscritos`;

  if (data.overbooked) {
    availability.textContent = "Sesión sobrecargada";
    availability.className = "registration-availability warning";
  } else if (data.full) {
    availability.textContent = "Sesión completa";
    availability.className = "registration-availability full";
  } else {
    availability.textContent = `${data.available} lugar${data.available === 1 ? "" : "es"} disponible${data.available === 1 ? "" : "s"}`;
    availability.className = "registration-availability open";
  }

  const registrations = Array.isArray(data.registrations) ? data.registrations : [];
  list.innerHTML = registrations.length
    ? `<strong>Inscritos</strong><ul>${registrations.map(item => `<li>${escapeRegistrationHtml(item.name)}${item.player ? ` <span>(${escapeRegistrationHtml(item.player)})</span>` : ""}</li>`).join("")}</ul>`
    : `<span class="muted-text">Todavía no hay personajes registrados.</span>`;

  joinButton.disabled = Boolean(data.full);
  joinButton.textContent = data.full ? "Sesión completa" : "Apartar lugar";
}

function setRegistrationBusy(panel, busy, message = "") {
  panel.querySelectorAll("button, select").forEach(control => control.disabled = busy);
  panel.classList.toggle("is-busy", busy);
  if (message) setRegistrationFeedback(panel, message);
}

function setRegistrationFeedback(panel, message, isError = false) {
  const feedback = panel.querySelector(".registration-feedback");
  feedback.textContent = message;
  feedback.classList.toggle("error", Boolean(isError));
}

function escapeRegistrationHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
