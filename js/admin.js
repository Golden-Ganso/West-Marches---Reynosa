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
  menu.innerHTML = Object.entries(ADMIN_ENTITIES).map(([key,value]) => `<button type="button" data-entity="${key}">${escapeAdmin(value.title)}</button>`).join("");
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
  const response = await fetch("/api/admin-auth", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ username:document.getElementById("admin-username").value, password:document.getElementById("admin-password").value }) });
  const data = await response.json();
  if (!response.ok || !data.ok) { message.textContent = data.error || "No fue posible iniciar sesión."; message.classList.add("error"); return; }
  document.getElementById("admin-password").value = "";
  setAdminLoggedIn(true);
}

async function logoutAdmin() { await fetch("/api/admin-auth", { method:"DELETE" }); setAdminLoggedIn(false); }
function setAdminLoggedIn(loggedIn) { document.getElementById("admin-login").hidden = loggedIn; document.getElementById("admin-panel").hidden = !loggedIn; if (loggedIn) loadAdminEntity(); }

async function loadAdminEntity() {
  setAdminMessage("Cargando...");
  removeRelationPanels();
  document.querySelectorAll("#admin-menu button[data-entity]").forEach(button => button.classList.toggle("active", button.dataset.entity === adminEntity));
  const config = ADMIN_ENTITIES[adminEntity];
  document.getElementById("admin-entity-title").textContent = config.title;
  document.getElementById("admin-help").textContent = "Los cambios se guardan directamente en D1.";
  const response = await fetch(`/api/admin?entity=${encodeURIComponent(adminEntity)}`, { cache:"no-store" });
  if (response.status === 401) { setAdminLoggedIn(false); return; }
  const data = await response.json();
  if (!response.ok || !data.ok) { setAdminMessage(data.error || "No fue posible consultar la tabla.", true); return; }
  adminItems = Array.isArray(data.items) ? data.items : [];
  renderAdminTable();
  renderAdminForm({});
  setAdminMessage("");
}

function renderAdminTable() {
  const config = ADMIN_ENTITIES[adminEntity];
  const table = document.getElementById("admin-table");
  table.innerHTML = `<table><thead><tr><th>ID</th><th>Nombre / Título</th><th>Estado</th><th></th></tr></thead><tbody>${adminItems.map(item => `<tr><td>${escapeAdmin(item.id)}</td><td>${escapeAdmin(item[config.nameField] || "")}</td><td>${escapeAdmin(item.status || item.relationship || "")}</td><td><button type="button" class="admin-button" data-edit-id="${item.id}">Editar</button></td></tr>`).join("")}</tbody></table>`;
  table.querySelectorAll("button[data-edit-id]").forEach(button => button.addEventListener("click", () => { const id=Number(button.dataset.editId); const item=adminItems.find(entry=>Number(entry.id)===id); if(item)renderAdminForm(item); }));
}

function renderAdminForm(item) {
  const config = ADMIN_ENTITIES[adminEntity];
  selectedAdminId = Number(item.id) || null;
  removeRelationPanels();
  document.getElementById("admin-form").innerHTML = config.fields.map(field => {
    const value=item[field]??"", wide=config.wide.includes(field), readonly=field==="id"&&selectedAdminId;
    if(wide)return `<label class="admin-wide">${escapeAdmin(field)}<textarea name="${field}">${escapeAdmin(value)}</textarea></label>`;
    return `<label>${escapeAdmin(field)}<input name="${field}" value="${escapeAdmin(value)}" ${readonly?"readonly":""}></label>`;
  }).join("");
  document.getElementById("admin-delete").disabled=!selectedAdminId;
  setAdminMessage(selectedAdminId?`Editando ID ${selectedAdminId}.`:"Nuevo registro.");
  if (!selectedAdminId) return;
  if (adminEntity === "sessions" && typeof openSessionRelations === "function") openSessionRelations(selectedAdminId);
  else if (typeof openGenericRelations === "function") openGenericRelations(adminEntity, selectedAdminId);
}

function removeRelationPanels() {
  document.getElementById("admin-relations")?.remove();
  document.getElementById("admin-generic-relations")?.remove();
}

async function saveAdminItem() {
  const raw=Object.fromEntries(new FormData(document.getElementById("admin-form")).entries()), data={};
  Object.entries(raw).forEach(([key,value])=>{ if(key==="id"){if(value!=="")data.id=Number(value);return;} data[key]=value===""?null:normalizeAdminValue(key,value); });
  if(!selectedAdminId&&raw.id!=="")data.id=Number(raw.id);
  const response=await fetch(`/api/admin?entity=${encodeURIComponent(adminEntity)}`,{method:selectedAdminId?"PUT":"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(selectedAdminId?{id:selectedAdminId,data}:{data})});
  const result=await response.json();
  if(!response.ok||!result.ok){setAdminMessage(result.error||"No fue posible guardar.",true);return;}
  setAdminMessage("Registro guardado correctamente."); await loadAdminEntity();
}

async function deleteAdminItem() {
  if(!selectedAdminId||!window.confirm(`¿Eliminar el registro ID ${selectedAdminId}?`))return;
  const response=await fetch(`/api/admin?entity=${encodeURIComponent(adminEntity)}`,{method:"DELETE",headers:{"Content-Type":"application/json"},body:JSON.stringify({id:selectedAdminId})});
  const result=await response.json();
  if(!response.ok||!result.ok){setAdminMessage(result.error||"No fue posible eliminar.",true);return;}
  selectedAdminId=null; await loadAdminEntity();
}

function normalizeAdminValue(field,value){const numeric=new Set(["level","slots","session_id","first_seen","danger","first_contact","discovered_in","map_x","map_y","explored","reveal_radius","corridor_width","found_in_session","found_at_location"]);if(numeric.has(field)){const n=Number(value);return Number.isFinite(n)?n:null;}return value;}
function setAdminMessage(message,error=false){const e=document.getElementById("admin-message");e.textContent=message;e.classList.toggle("error",error);}
function escapeAdmin(value){return String(value??"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;");}

// ===== RELACIONES DE EXPEDICIONES =====
async function openSessionRelations(sessionId) {
  const response=await fetch(`/api/admin-relations?session=${sessionId}`,{cache:"no-store"}),data=await response.json();
  if(!response.ok||!data.ok)return setAdminMessage(data.error||"No fue posible cargar relaciones.",true);
  const box=document.getElementById("admin-relations")||createSessionRelationsBox();
  box.innerHTML=`<h2>Relaciones y registros</h2><div class="admin-actions"><button type="button" class="admin-button" id="slot-minus">-1 cupo</button><strong>${data.session.slots} cupos</strong><button type="button" class="admin-button" id="slot-plus">+1 cupo</button><select id="session-status"><option value="open">Abierta</option><option value="closed">Cerrada</option><option value="completed">Finalizada</option></select></div>${relationSelect("Personajes históricos","characters",data.options.characters,data.selected.characters)}${relationSelect("Criaturas","creatures",data.options.creatures,data.selected.creatures)}${relationSelect("Facciones","factions",data.options.factions,data.selected.factions)}${relationSelect("Ubicaciones","locations",data.options.locations,data.selected.locations)}<div class="card detail-panel"><h3>Inscritos actuales</h3>${data.registrations.length?data.registrations.map(x=>`<div class="detail-list-item"><span>${escapeAdmin(x.name)}${x.player?` (${escapeAdmin(x.player)})`:""}</span><button type="button" class="admin-button admin-danger" data-remove-registration="${x.characterId}">Quitar</button></div>`).join(""):"<p>Sin inscritos.</p>"}</div><div class="card detail-panel"><h3>Descubrimientos</h3>${data.discoveries.map(x=>`<div class="detail-list-item"><span>${escapeAdmin(x.discovery)}</span><button type="button" class="admin-button admin-danger" data-delete-discovery="${x.id}">Quitar</button></div>`).join("")}<div class="admin-actions"><input id="new-discovery" placeholder="Nuevo descubrimiento"><button type="button" id="add-discovery" class="admin-button">Agregar</button></div></div>`;
  document.getElementById("session-status").value=data.session.status;
  document.getElementById("slot-minus").onclick=()=>sessionRelationAction(sessionId,{type:"slots",slots:Math.max(1,data.session.slots-1)});
  document.getElementById("slot-plus").onclick=()=>sessionRelationAction(sessionId,{type:"slots",slots:data.session.slots+1});
  document.getElementById("session-status").onchange=e=>sessionRelationAction(sessionId,{type:"status",status:e.target.value});
  box.querySelectorAll("select[data-relation]").forEach(s=>s.onchange=()=>sessionRelationAction(sessionId,{type:s.dataset.relation,ids:[...s.selectedOptions].map(o=>Number(o.value))}));
  box.querySelectorAll("[data-remove-registration]").forEach(b=>b.onclick=()=>removeRegistrationAdmin(sessionId,Number(b.dataset.removeRegistration)));
  box.querySelectorAll("[data-delete-discovery]").forEach(b=>b.onclick=()=>sessionRelationAction(sessionId,{type:"deleteDiscovery",id:Number(b.dataset.deleteDiscovery)}));
  document.getElementById("add-discovery").onclick=()=>sessionRelationAction(sessionId,{type:"discovery",value:document.getElementById("new-discovery").value});
}
function createSessionRelationsBox(){const box=document.createElement("section");box.id="admin-relations";box.className="admin-wide";document.querySelector(".admin-content").appendChild(box);return box;}
function relationSelect(title,type,items,selected){const set=new Set(selected.map(Number));return `<label class="admin-wide">${title}<select multiple size="5" data-relation="${type}">${items.map(x=>`<option value="${x.id}" ${set.has(Number(x.id))?"selected":""}>${escapeAdmin(x.name)}</option>`).join("")}</select></label>`;}
async function sessionRelationAction(sessionId,payload){const r=await fetch(`/api/admin-relations?session=${sessionId}`,{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)}),d=await r.json();if(!r.ok||!d.ok)return setAdminMessage(d.error||"Error",true);await openSessionRelations(sessionId);}
async function removeRegistrationAdmin(sessionId,characterId){const r=await fetch(`/api/admin-relations?session=${sessionId}`,{method:"DELETE",headers:{"Content-Type":"application/json"},body:JSON.stringify({characterId})}),d=await r.json();if(!r.ok||!d.ok)return setAdminMessage(d.error||"Error",true);await openSessionRelations(sessionId);}

// ===== RELACIONES GENERALES =====
async function openGenericRelations(entity,id){
  if(entity==="sessions"||!["characters","lore","locations","chronicles","creatures","factions"].includes(entity))return;
  const r=await fetch(`/api/admin-all-relations?entity=${entity}&id=${id}`,{cache:"no-store"}),d=await r.json();
  if(!r.ok||!d.ok)return setAdminMessage(d.error||"No fue posible cargar relaciones.",true);
  const box=document.getElementById("admin-generic-relations")||createGenericBox();
  if(entity==="characters")box.innerHTML=characterRelations(d);
  if(entity==="lore")box.innerHTML=loreRelations(d);
  if(entity==="locations")box.innerHTML=locationRelations(d);
  if(entity==="chronicles")box.innerHTML=chronicleRelations(d);
  if(entity==="creatures")box.innerHTML=creatureRelations(d);
  if(entity==="factions")box.innerHTML=factionRelations(d);
  wireGeneric(box,entity,id);
}
function createGenericBox(){const b=document.createElement("section");b.id="admin-generic-relations";b.className="admin-wide";document.querySelector(".admin-content").appendChild(b);return b;}
function genericMulti(title,type,items,selected){const set=new Set((selected||[]).map(Number));return `<label class="admin-wide">${title}<select multiple size="5" data-generic-type="${type}">${items.map(x=>`<option value="${x.id}" ${set.has(Number(x.id))?"selected":""}>${escapeAdmin(x.name||x.title)}</option>`).join("")}</select></label>`;}
function genericRows(items,type,label){return items.length?items.map(x=>`<div class="detail-list-item"><span>${escapeAdmin(x[label]||x.title||x.name||"")}</span><button type="button" class="admin-button admin-danger" data-generic-delete="${type}" data-row-id="${x.id}">Quitar</button></div>`).join(""):"<p class='admin-help'>Sin registros.</p>";}
function characterRelations(d){return `<h2>Historial y logros</h2><div class="card detail-panel"><h3>Historial</h3>${genericRows(d.history,"history","title")}<div class="admin-form"><label>Expedición<input id="rel-session" type="number"></label><label>Fecha<input id="rel-date" type="date"></label><label>Título<input id="rel-title"></label><label class="admin-wide">Nota<textarea id="rel-note"></textarea></label></div><button class="admin-button" data-generic-add="history">Agregar historial</button></div><div class="card detail-panel"><h3>Logros</h3>${genericRows(d.achievements,"achievement","name")}<div class="admin-form"><label>Nombre<input id="ach-name"></label><label>Fecha<input id="ach-date" type="date"></label><label class="admin-wide">Descripción<textarea id="ach-description"></textarea></label></div><button class="admin-button" data-generic-add="achievement">Agregar logro</button></div>`;}
function loreRelations(d){return `<h2>Relaciones de Biblioteca</h2>${genericMulti("Personajes relacionados","characters",d.options.characters,d.selected.characters)}${genericMulti("Facciones relacionadas","factions",d.options.factions,d.selected.factions)}<div class="card detail-panel"><h3>Etiquetas</h3>${genericRows(d.tags,"tag","tag")}<div class="admin-actions"><input id="generic-value" placeholder="Nueva etiqueta"><button class="admin-button" data-generic-add="tag">Agregar</button></div></div>`;}
function locationRelations(d){return `<h2>Relaciones del lugar</h2>${genericMulti("Conexiones del mapa","locations",d.options.locations,d.selected.locations)}${genericMulti("Personajes","characters",d.options.characters,d.selected.characters)}${genericMulti("Criaturas","creatures",d.options.creatures,d.selected.creatures)}${genericMulti("Facciones","factions",d.options.factions,d.selected.factions)}<div class="card detail-panel"><h3>Descubrimientos</h3>${genericRows(d.discoveries,"discovery","discovery")}<div class="admin-actions"><input id="generic-value" placeholder="Nuevo descubrimiento"><button class="admin-button" data-generic-add="discovery">Agregar</button></div></div>`;}
function chronicleRelations(d){return `<h2>Relaciones de la crónica</h2>${genericMulti("Personajes relacionados","characters",d.options.characters,d.selected.characters)}<div class="card detail-panel"><h3>Participantes escritos</h3>${genericRows(d.participants,"participant","display_name")}<div class="admin-actions"><input id="generic-value" placeholder="Nombre del participante"><button class="admin-button" data-generic-add="participant">Agregar</button></div></div>`;}
function creatureRelations(d){return `<h2>Relaciones de la criatura</h2>${genericMulti("Personajes que la conocen","characters",d.options.characters,d.selected.characters)}<div class="card detail-panel"><h3>Ubicaciones conocidas</h3>${genericRows(d.locations,"location","location_name")}<div class="admin-actions"><input id="generic-value" placeholder="Ubicación"><button class="admin-button" data-generic-add="location">Agregar</button></div></div>`;}
function factionRelations(d){return `<h2>Relaciones de la facción</h2>${genericMulti("Personajes relacionados","characters",d.options.characters,d.selected.characters)}`;}
function wireGeneric(box,entity,id){box.querySelectorAll("select[data-generic-type]").forEach(s=>s.onchange=()=>genericPut(entity,id,{type:s.dataset.genericType,ids:[...s.selectedOptions].map(o=>Number(o.value))}));box.querySelectorAll("[data-generic-delete]").forEach(b=>b.onclick=()=>genericDelete(entity,id,b.dataset.genericDelete,Number(b.dataset.rowId)));box.querySelectorAll("[data-generic-add]").forEach(b=>b.onclick=()=>genericAdd(entity,id,b.dataset.genericAdd));}
async function genericAdd(entity,id,type){let payload={type};if(type==="history")payload={type,session:document.getElementById("rel-session").value,date:document.getElementById("rel-date").value,title:document.getElementById("rel-title").value,note:document.getElementById("rel-note").value};else if(type==="achievement")payload={type,name:document.getElementById("ach-name").value,date:document.getElementById("ach-date").value,description:document.getElementById("ach-description").value};else payload.value=document.getElementById("generic-value").value;await genericPut(entity,id,payload);}
async function genericPut(entity,id,payload){const r=await fetch(`/api/admin-all-relations?entity=${entity}&id=${id}`,{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)}),d=await r.json();if(!r.ok||!d.ok)return setAdminMessage(d.error||"Error",true);await openGenericRelations(entity,id);}
async function genericDelete(entity,id,type,rowId){const r=await fetch(`/api/admin-all-relations?entity=${entity}&id=${id}`,{method:"DELETE",headers:{"Content-Type":"application/json"},body:JSON.stringify({type,rowId})}),d=await r.json();if(!r.ok||!d.ok)return setAdminMessage(d.error||"Error",true);await openGenericRelations(entity,id);}
