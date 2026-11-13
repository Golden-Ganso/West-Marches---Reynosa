import { json, body, requireAdmin, num, rows } from "../_shared.js";

const CONFIGS = {
  characters: { table: "characters", fields: ["name","pronunciation","race","class_name","level","status","player","image","bio","background"] },
  sessions: { table: "sessions", fields: ["title","session_date","session_time","status","slots","level","description","objective","result","result_summary","notes"] },
  chronicles: { table: "chronicles", fields: ["session_id","title","chronicle_date","author","image","summary"] },
  creatures: { table: "creatures", fields: ["name","type","status","first_seen","danger","image","description","notes"] },
  factions: { table: "factions", fields: ["name","status","relationship","image","description","first_contact","notes"] },
  locations: { table: "locations", fields: ["name","type","status","danger","discovered_in","image","map_x","map_y","explored","reveal_radius","corridor_width","description","notes"] },
  lore: { table: "lore", fields: ["title","type","category","author","status","knowledge","image","found_in_session","found_at_location","summary","content"] },
  rumors: { table: "rumors", fields: ["title","text","status"] },
  news: { table: "news", fields: ["type","news_date","title","text","link"] }
};

export async function onRequest(context) {
  const denied = requireAdmin(context);
  if (denied) return denied;

  const url = new URL(context.request.url);
  const entity = url.searchParams.get("entity");
  const config = CONFIGS[entity];

  if (!config) return json({ ok: false, error: "Entidad inválida." }, 400);

  try {
    if (context.request.method === "GET") {
      const result = await context.env.DB.prepare(`SELECT * FROM ${config.table} ORDER BY id DESC`).all();
      return json({ ok: true, items: rows(result) });
    }

    const requestBody = await body(context.request);

    if (context.request.method === "POST") {
      const data = requestBody.data || {};
      const suppliedId = num(data.id);
      const fields = config.fields.filter(field => data[field] !== undefined);
      const columns = suppliedId ? ["id", ...fields] : fields;
      const values = suppliedId ? [suppliedId, ...fields.map(field => data[field])] : fields.map(field => data[field]);

      if (!columns.length) return json({ ok: false, error: "No hay información para guardar." }, 400);

      const placeholders = columns.map(() => "?").join(",");
      await context.env.DB
        .prepare(`INSERT INTO ${config.table} (${columns.join(",")}) VALUES (${placeholders})`)
        .bind(...values)
        .run();

      return json({ ok: true });
    }

    if (context.request.method === "PUT") {
      const id = num(requestBody.id);
      const data = requestBody.data || {};
      if (!id) return json({ ok: false, error: "ID requerido." }, 400);

      const fields = config.fields.filter(field => data[field] !== undefined);
      if (!fields.length) return json({ ok: false, error: "No hay cambios para guardar." }, 400);

      await context.env.DB
        .prepare(`UPDATE ${config.table} SET ${fields.map(field => `${field}=?`).join(",")} WHERE id=?`)
        .bind(...fields.map(field => data[field]), id)
        .run();

      return json({ ok: true });
    }

    if (context.request.method === "DELETE") {
      const id = num(requestBody.id);
      if (!id) return json({ ok: false, error: "ID requerido." }, 400);

      await context.env.DB.prepare(`DELETE FROM ${config.table} WHERE id=?`).bind(id).run();
      return json({ ok: true });
    }

    return json({ ok: false, error: "Método no permitido." }, 405);
  } catch (error) {
    console.error("Error Admin:", error);
    return json({ ok: false, error: String(error?.message || error) }, 500);
  }
}

// ADMIN V2 - añadir al final de js/admin.js
async function openSessionRelations(sessionId) {
  const response = await fetch(`/api/admin-relations?session=${sessionId}`, {cache:"no-store"});
  const data = await response.json();
  if (!response.ok || !data.ok) return setAdminMessage(data.error || "No fue posible cargar relaciones.", true);

  const box = document.getElementById("admin-relations") || createRelationsBox();
  box.innerHTML = `
    <div class="section-heading compact"><div><p class="section-kicker">Expedición #${data.session.id}</p><h2>Relaciones y registros</h2></div></div>
    <div class="admin-actions"><button type="button" class="admin-button" id="slot-minus">-1 cupo</button><strong>${data.session.slots} cupos</strong><button type="button" class="admin-button" id="slot-plus">+1 cupo</button><select id="session-status"><option value="open">Abierta</option><option value="closed">Cerrada</option><option value="completed">Finalizada</option></select></div>
    ${relationSelect("Personajes históricos","characters",data.options.characters,data.selected.characters,"name")}
    ${relationSelect("Criaturas","creatures",data.options.creatures,data.selected.creatures,"name")}
    ${relationSelect("Facciones","factions",data.options.factions,data.selected.factions,"name")}
    ${relationSelect("Ubicaciones","locations",data.options.locations,data.selected.locations,"name")}
    <div class="card detail-panel"><h3>Inscritos actuales</h3>${data.registrations.length?data.registrations.map(x=>`<div class="detail-list-item"><span>${escapeAdmin(x.name)}${x.player?` (${escapeAdmin(x.player)})`:""}</span><button type="button" class="admin-button admin-danger" data-remove-registration="${x.characterId}">Quitar</button></div>`).join(""):"<p>Sin inscritos.</p>"}</div>
    <div class="card detail-panel"><h3>Descubrimientos</h3>${data.discoveries.map(x=>`<div class="detail-list-item"><span>${escapeAdmin(x.discovery)}</span><button type="button" class="admin-button admin-danger" data-delete-discovery="${x.id}">Quitar</button></div>`).join("")}<div class="admin-actions"><input id="new-discovery" placeholder="Nuevo descubrimiento"><button type="button" id="add-discovery" class="admin-button">Agregar</button></div></div>`;

  document.getElementById("session-status").value=data.session.status;
  document.getElementById("slot-minus").onclick=()=>relationAction(sessionId,{type:"slots",slots:Math.max(1,data.session.slots-1)});
  document.getElementById("slot-plus").onclick=()=>relationAction(sessionId,{type:"slots",slots:data.session.slots+1});
  document.getElementById("session-status").onchange=e=>relationAction(sessionId,{type:"status",status:e.target.value});
  box.querySelectorAll("select[data-relation]").forEach(select=>select.onchange=()=>relationAction(sessionId,{type:select.dataset.relation,ids:[...select.selectedOptions].map(o=>Number(o.value))}));
  box.querySelectorAll("[data-remove-registration]").forEach(b=>b.onclick=()=>removeRegistrationAdmin(sessionId,Number(b.dataset.removeRegistration)));
  box.querySelectorAll("[data-delete-discovery]").forEach(b=>b.onclick=()=>relationAction(sessionId,{type:"deleteDiscovery",id:Number(b.dataset.deleteDiscovery)}));
  document.getElementById("add-discovery").onclick=()=>relationAction(sessionId,{type:"discovery",value:document.getElementById("new-discovery").value});
}
function relationSelect(title,type,items,selected,label){const set=new Set(selected.map(Number));return `<label class="admin-wide">${title}<select multiple size="5" data-relation="${type}">${items.map(x=>`<option value="${x.id}" ${set.has(Number(x.id))?"selected":""}>${escapeAdmin(x[label])}</option>`).join("")}</select></label>`}
function createRelationsBox(){const box=document.createElement("section");box.id="admin-relations";box.className="admin-wide";document.querySelector(".admin-content").appendChild(box);return box}
async function relationAction(sessionId,payload){const r=await fetch(`/api/admin-relations?session=${sessionId}`,{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)}),d=await r.json();if(!r.ok||!d.ok)return setAdminMessage(d.error||"Error",true);await openSessionRelations(sessionId)}
async function removeRegistrationAdmin(sessionId,characterId){const r=await fetch(`/api/admin-relations?session=${sessionId}`,{method:"DELETE",headers:{"Content-Type":"application/json"},body:JSON.stringify({characterId})}),d=await r.json();if(!r.ok||!d.ok)return setAdminMessage(d.error||"Error",true);await openSessionRelations(sessionId)}
function createGenericBox(){const b=document.createElement("section");b.id="admin-generic-relations";b.className="admin-wide";document.querySelector(".admin-content").appendChild(b);return b}
function multi(title,type,items,selected){const s=new Set((selected||[]).map(Number));return `<label class="admin-wide">${title}<select multiple size="5" data-generic-type="${type}">${items.map(x=>`<option value="${x.id}" ${s.has(Number(x.id))?"selected":""}>${escapeAdmin(x.name||x.title)}</option>`).join("")}</select></label>`}
function listRows(items,type,label){return items.length?items.map(x=>`<div class="detail-list-item"><span>${escapeAdmin(x[label]||x.title||x.name||"")}</span><button type="button" class="admin-button admin-danger" data-generic-delete="${type}" data-row-id="${x.id}">Quitar</button></div>`).join(""):"<p class='admin-help'>Sin registros.</p>"}
function characterRelations(id,d){return `<h2>Historial y logros</h2><div class="card detail-panel"><h3>Historial</h3>${listRows(d.history,"history","title")}<div class="admin-form"><label>Expedición<input id="rel-session" type="number"></label><label>Fecha<input id="rel-date" type="date"></label><label>Título<input id="rel-title"></label><label class="admin-wide">Nota<textarea id="rel-note"></textarea></label></div><button class="admin-button" data-generic-add="history">Agregar historial</button></div><div class="card detail-panel"><h3>Logros</h3>${listRows(d.achievements,"achievement","name")}<div class="admin-form"><label>Nombre<input id="ach-name"></label><label>Fecha<input id="ach-date" type="date"></label><label class="admin-wide">Descripción<textarea id="ach-description"></textarea></label></div><button class="admin-button" data-generic-add="achievement">Agregar logro</button></div>`}
function loreRelations(id,d){return `<h2>Relaciones de Biblioteca</h2>${multi("Personajes relacionados","characters",d.options.characters,d.selected.characters)}${multi("Facciones relacionadas","factions",d.options.factions,d.selected.factions)}<div class="card detail-panel"><h3>Etiquetas</h3>${listRows(d.tags,"tag","tag")}<div class="admin-actions"><input id="generic-value" placeholder="Nueva etiqueta"><button class="admin-button" data-generic-add="tag">Agregar</button></div></div>`}
function locationRelations(id,d){return `<h2>Relaciones del lugar</h2>${multi("Conexiones del mapa","locations",d.options.locations,d.selected.locations)}${multi("Personajes","characters",d.options.characters,d.selected.characters)}${multi("Criaturas","creatures",d.options.creatures,d.selected.creatures)}${multi("Facciones","factions",d.options.factions,d.selected.factions)}<div class="card detail-panel"><h3>Descubrimientos</h3>${listRows(d.discoveries,"discovery","discovery")}<div class="admin-actions"><input id="generic-value" placeholder="Nuevo descubrimiento"><button class="admin-button" data-generic-add="discovery">Agregar</button></div></div>`}
function chronicleRelations(id,d){return `<h2>Relaciones de la crónica</h2>${multi("Personajes relacionados","characters",d.options.characters,d.selected.characters)}<div class="card detail-panel"><h3>Participantes escritos</h3>${listRows(d.participants,"participant","display_name")}<div class="admin-actions"><input id="generic-value" placeholder="Nombre del participante"><button class="admin-button" data-generic-add="participant">Agregar</button></div></div>`}
function creatureRelations(id,d){return `<h2>Relaciones de la criatura</h2>${multi("Personajes que la conocen","characters",d.options.characters,d.selected.characters)}<div class="card detail-panel"><h3>Ubicaciones conocidas</h3>${listRows(d.locations,"location","location_name")}<div class="admin-actions"><input id="generic-value" placeholder="Ubicación"><button class="admin-button" data-generic-add="location">Agregar</button></div></div>`}
function factionRelations(id,d){return `<h2>Relaciones de la facción</h2>${multi("Personajes relacionados","characters",d.options.characters,d.selected.characters)}`}
function wireGeneric(box,entity,id){box.querySelectorAll("select[data-generic-type]").forEach(s=>s.onchange=()=>genericPut(entity,id,{type:s.dataset.genericType,ids:[...s.selectedOptions].map(o=>Number(o.value))}));box.querySelectorAll("[data-generic-delete]").forEach(b=>b.onclick=()=>genericDelete(entity,id,b.dataset.genericDelete,Number(b.dataset.rowId)));box.querySelectorAll("[data-generic-add]").forEach(b=>b.onclick=()=>genericAdd(entity,id,b.dataset.genericAdd))}
async function genericAdd(entity,id,type){let payload={type};if(type==="history")payload={type,session:document.getElementById("rel-session").value,date:document.getElementById("rel-date").value,title:document.getElementById("rel-title").value,note:document.getElementById("rel-note").value};else if(type==="achievement")payload={type,name:document.getElementById("ach-name").value,date:document.getElementById("ach-date").value,description:document.getElementById("ach-description").value};else payload.value=document.getElementById("generic-value").value;await genericPut(entity,id,payload)}
async function genericPut(entity,id,payload){const r=await fetch(`/api/admin-all-relations?entity=${entity}&id=${id}`,{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)}),d=await r.json();if(!r.ok||!d.ok)return setAdminMessage(d.error||"Error",true);await openGenericRelations(entity,id)}
async function genericDelete(entity,id,type,rowId){const r=await fetch(`/api/admin-all-relations?entity=${entity}&id=${id}`,{method:"DELETE",headers:{"Content-Type":"application/json"},body:JSON.stringify({type,rowId})}),d=await r.json();if(!r.ok||!d.ok)return setAdminMessage(d.error||"Error",true);await openGenericRelations(entity,id)}

// ADMIN EDIFICIOS - añadir al final de js/admin.js
async function openBuildingCommerce(buildingId){const r=await fetch(`/api/admin-building?building=${buildingId}`,{cache:"no-store"}),d=await r.json();if(!r.ok||!d.ok)return setAdminMessage(d.error||"No fue posible cargar el edificio.",true);const box=document.getElementById("admin-building-commerce")||createCommerceBox();box.innerHTML=`<h2>Servicios y catálogo</h2>${commerceSection("Servicios",d.services,"service")}${commerceSection("Catálogo",d.items,"item")}${commerceSection("Próximamente",d.incoming,"incoming")}<div class="card detail-panel"><h3>Personas relacionadas</h3>${d.npcRelations.map(rel=>{const n=d.npcs.find(x=>x.id===rel.npc_id);return `<div class="detail-list-item"><span>${escapeAdmin(n?.name||`NPC #${rel.npc_id}`)} · ${escapeAdmin(rel.relationship||"")}</span><button type="button" class="admin-button admin-danger" data-commerce-delete="npc" data-npc-id="${rel.npc_id}">Quitar</button></div>`}).join("")||"<p>Sin relaciones.</p>"}<div class="admin-actions"><select id="commerce-npc">${d.npcs.map(n=>`<option value="${n.id}">${escapeAdmin(n.name)}</option>`).join("")}</select><input id="commerce-npc-relation" placeholder="Relación: Propietario"><button type="button" class="admin-button" id="commerce-add-npc">Relacionar</button></div></div>`;wireCommerce(box,buildingId)}
function createCommerceBox(){const b=document.createElement("section");b.id="admin-building-commerce";b.className="admin-wide";document.querySelector(".admin-content").appendChild(b);return b}
function commerceSection(title,items,type){return `<div class="card detail-panel"><div class="card-topline"><h3>${title}</h3><button type="button" class="admin-button" data-commerce-new="${type}">Nuevo</button></div>${items.map(x=>`<div class="detail-list-item"><span><strong>${escapeAdmin(x.name)}</strong>${commerceMeta(x,type)}</span><span><button type="button" class="admin-button" data-commerce-edit="${type}" data-row-id="${x.id}">Editar</button> <button type="button" class="admin-button admin-danger" data-commerce-delete="${type}" data-row-id="${x.id}">Eliminar</button></span></div>`).join("")||"<p>Sin registros.</p>"}</div>`}
function commerceMeta(x,type){if(type==="service")return ` · ${x.price!=null?`${x.price} ${escapeAdmin(x.currency||"")}`:"Sin precio"} · ${escapeAdmin(x.status||"")}`;if(type==="item")return ` · ${escapeAdmin(x.category||"")} · ${x.price!=null?`${x.price} ${escapeAdmin(x.currency||"")}`:"Sin precio"} · Cant: ${x.quantity??"∞"} · ${escapeAdmin(x.status||"")}`;return ` · ${escapeAdmin(x.status||"")}${x.source?` · ${escapeAdmin(x.source)}`:""}${x.expected_date?` · ${escapeAdmin(x.expected_date)}`:""}`}
function wireCommerce(box,buildingId){box.querySelectorAll("[data-commerce-new]").forEach(b=>b.onclick=()=>commerceEditor(buildingId,b.dataset.commerceNew,{}));box.querySelectorAll("[data-commerce-edit]").forEach(b=>b.onclick=async()=>{const r=await fetch(`/api/admin-building?building=${buildingId}`,{cache:"no-store"}),d=await r.json(),type=b.dataset.commerceEdit,list=type==="service"?d.services:type==="item"?d.items:d.incoming;commerceEditor(buildingId,type,list.find(x=>Number(x.id)===Number(b.dataset.rowId))||{})});box.querySelectorAll("[data-commerce-delete]").forEach(b=>b.onclick=()=>commerceDelete(buildingId,b.dataset.commerceDelete,Number(b.dataset.rowId),Number(b.dataset.npcId)));document.getElementById("commerce-add-npc").onclick=()=>commerceSave(buildingId,"POST",{type:"npc",npc_id:Number(document.getElementById("commerce-npc").value),relationship:document.getElementById("commerce-npc-relation").value})}
function commerceEditor(buildingId,type,item){document.getElementById("commerce-editor")?.remove();const d=document.createElement("div");d.id="commerce-editor";d.className="card detail-panel";const fields=type==="service"?["name","description","price","currency","status"]:type==="item"?["name","category","description","price","currency","quantity","status"]:["name","expected_date","source","status","notes"];d.innerHTML=`<h3>${item.id?"Editar":"Nuevo"} ${type}</h3><div class="admin-form">${fields.map(f=>`<label class="${["description","notes"].includes(f)?"admin-wide":""}">${f}${["description","notes"].includes(f)?`<textarea data-commerce-field="${f}">${escapeAdmin(item[f]??"")}</textarea>`:`<input data-commerce-field="${f}" value="${escapeAdmin(item[f]??"")}">`}</label>`).join("")}</div><div class="admin-actions"><button type="button" class="admin-button" id="commerce-save">Guardar</button><button type="button" class="admin-button" id="commerce-cancel">Cancelar</button></div>`;document.getElementById("admin-building-commerce").appendChild(d);document.getElementById("commerce-cancel").onclick=()=>d.remove();document.getElementById("commerce-save").onclick=()=>{const payload={type,id:item.id};d.querySelectorAll("[data-commerce-field]").forEach(e=>payload[e.dataset.commerceField]=e.value);commerceSave(buildingId,item.id?"PUT":"POST",payload)}}
async function commerceSave(buildingId,method,payload){const r=await fetch(`/api/admin-building?building=${buildingId}`,{method,headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)}),d=await r.json();if(!r.ok||!d.ok)return setAdminMessage(d.error||"Error",true);await openBuildingCommerce(buildingId)}
async function commerceDelete(buildingId,type,id,npcId){if(!confirm("¿Eliminar este registro?"))return;const payload=type==="npc"?{type,npc_id:npcId}:{type,id};const r=await fetch(`/api/admin-building?building=${buildingId}`,{method:"DELETE",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)}),d=await r.json();if(!r.ok||!d.ok)return setAdminMessage(d.error||"Error",true);await openBuildingCommerce(buildingId)}
