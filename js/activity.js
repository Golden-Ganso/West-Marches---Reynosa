const ACTIVITY_INTERVAL = 7000;
let activityItems = [];
let activityIndex = 0;
let activityTimer = null;

const ACTIVITY_LABELS = {
  character: "Aventurero",
  expedition: "Expedición",
  location: "Descubrimiento",
  bestiary: "Bestiario",
  faction: "Facción",
  library: "Biblioteca",
  world: "Mundo"
};

document.addEventListener("DOMContentLoaded", async () => {
  const root = document.getElementById("recent-activity");
  if (!root) return;

  try {
    const response = await fetch("data/news.json");
    if (!response.ok) throw new Error("No fue posible cargar news.json");
    const data = await response.json();

    activityItems = Array.isArray(data) ? data.slice(0, 5) : [];
    if (!activityItems.length) {
      root.hidden = true;
      return;
    }

    renderActivity();
    wireActivityControls();
    startActivityTimer();
  } catch (error) {
    console.error("Error cargando actividad reciente:", error);
    root.hidden = true;
  }
});

function renderActivity() {
  const item = activityItems[activityIndex];
  const type = activityType(item.type);

  document.getElementById("activity-type").textContent = ACTIVITY_LABELS[type] || "Actividad";
  document.getElementById("activity-type").className = `activity-type activity-${type}`;
  document.getElementById("activity-title").textContent = item.title || "Actividad reciente";
  document.getElementById("activity-text").textContent = item.text || "";
  document.getElementById("activity-counter").textContent = `${activityIndex + 1} / ${activityItems.length}`;

  const link = document.getElementById("activity-link");
  if (item.link) {
    link.href = item.link;
    link.hidden = false;
  } else {
    link.hidden = true;
  }

  const content = document.getElementById("activity-content");
  content.classList.remove("activity-fade");
  void content.offsetWidth;
  content.classList.add("activity-fade");
}

function wireActivityControls() {
  document.getElementById("activity-prev").addEventListener("click", () => changeActivity(-1));
  document.getElementById("activity-next").addEventListener("click", () => changeActivity(1));

  const root = document.getElementById("recent-activity");
  root.addEventListener("mouseenter", stopActivityTimer);
  root.addEventListener("mouseleave", startActivityTimer);
  root.addEventListener("focusin", stopActivityTimer);
  root.addEventListener("focusout", startActivityTimer);
}

function changeActivity(direction) {
  if (!activityItems.length) return;
  activityIndex = (activityIndex + direction + activityItems.length) % activityItems.length;
  renderActivity();
  restartActivityTimer();
}

function startActivityTimer() {
  stopActivityTimer();
  if (activityItems.length <= 1) return;
  activityTimer = window.setInterval(() => {
    activityIndex = (activityIndex + 1) % activityItems.length;
    renderActivity();
  }, ACTIVITY_INTERVAL);
}

function stopActivityTimer() {
  if (activityTimer !== null) {
    window.clearInterval(activityTimer);
    activityTimer = null;
  }
}

function restartActivityTimer() {
  stopActivityTimer();
  startActivityTimer();
}

function activityType(value) {
  const type = String(value || "world").toLowerCase();
  return Object.prototype.hasOwnProperty.call(ACTIVITY_LABELS, type) ? type : "world";
}
