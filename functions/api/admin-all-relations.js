import { json, body, requireAdmin, num, rows } from "../_shared.js";

export async function onRequest(context) {
  const denied = requireAdmin(context);
  if (denied) return denied;

  const url = new URL(context.request.url);
  const entity = url.searchParams.get("entity");
  const id = num(url.searchParams.get("id"));
  if (!entity || !id) return json({ ok:false, error:"entity e id requeridos" }, 400);

  try {
    if (context.request.method === "GET") return getRelations(context.env.DB, entity, id);
    if (context.request.method === "PUT") return updateRelations(context.env.DB, entity, id, await body(context.request));
    if (context.request.method === "DELETE") return deleteRelation(context.env.DB, entity, id, await body(context.request));
    return json({ ok:false, error:"Método no permitido" }, 405);
  } catch (error) {
    console.error("admin-all-relations", error);
    return json({ ok:false, error:String(error?.message || error) }, 500);
  }
}

async function getRelations(db, entity, id) {
  if (entity === "characters") {
    const [history, achievements] = await Promise.all([
      db.prepare("SELECT id,session_id session,event_date date,title,note FROM character_history WHERE character_id=? ORDER BY event_date DESC,id DESC").bind(id).all(),
      db.prepare("SELECT id,name,description,achievement_date date FROM character_achievements WHERE character_id=? ORDER BY achievement_date DESC,id DESC").bind(id).all()
    ]);
    return json({ok:true,history:rows(history),achievements:rows(achievements)});
  }

  if (entity === "lore") {
    const [characters,factions,selectedCharacters,selectedFactions,tags] = await Promise.all([
      db.prepare("SELECT id,name FROM characters ORDER BY name").all(),
      db.prepare("SELECT id,name FROM factions ORDER BY name").all(),
      db.prepare("SELECT character_id FROM lore_characters WHERE lore_id=?").bind(id).all(),
      db.prepare("SELECT faction_id FROM lore_factions WHERE lore_id=?").bind(id).all(),
      db.prepare("SELECT id,tag FROM lore_tags WHERE lore_id=? ORDER BY id").bind(id).all()
    ]);
    return json({ok:true,options:{characters:rows(characters),factions:rows(factions)},selected:{characters:rows(selectedCharacters).map(x=>x.character_id),factions:rows(selectedFactions).map(x=>x.faction_id)},tags:rows(tags)});
  }

  if (entity === "locations") {
    const [locations,characters,creatures,factions,connections,sc,scr,sf,discoveries] = await Promise.all([
      db.prepare("SELECT id,name FROM locations WHERE id<>? ORDER BY name").bind(id).all(),
      db.prepare("SELECT id,name FROM characters ORDER BY name").all(),
      db.prepare("SELECT id,name FROM creatures ORDER BY name").all(),
      db.prepare("SELECT id,name FROM factions ORDER BY name").all(),
      db.prepare("SELECT connected_location_id FROM location_connections WHERE location_id=?").bind(id).all(),
      db.prepare("SELECT character_id FROM location_characters WHERE location_id=?").bind(id).all(),
      db.prepare("SELECT creature_id FROM location_creatures WHERE location_id=?").bind(id).all(),
      db.prepare("SELECT faction_id FROM location_factions WHERE location_id=?").bind(id).all(),
      db.prepare("SELECT id,discovery FROM location_discoveries WHERE location_id=? ORDER BY id").bind(id).all()
    ]);
    return json({ok:true,options:{locations:rows(locations),characters:rows(characters),creatures:rows(creatures),factions:rows(factions)},selected:{locations:rows(connections).map(x=>x.connected_location_id),characters:rows(sc).map(x=>x.character_id),creatures:rows(scr).map(x=>x.creature_id),factions:rows(sf).map(x=>x.faction_id)},discoveries:rows(discoveries)});
  }

  if (entity === "chronicles") {
    const [characters,selected,participants] = await Promise.all([
      db.prepare("SELECT id,name FROM characters ORDER BY name").all(),
      db.prepare("SELECT character_id FROM chronicle_characters WHERE chronicle_id=?").bind(id).all(),
      db.prepare("SELECT id,display_name FROM chronicle_participants WHERE chronicle_id=? ORDER BY id").bind(id).all()
    ]);
    return json({ok:true,options:{characters:rows(characters)},selected:{characters:rows(selected).map(x=>x.character_id)},participants:rows(participants)});
  }

  if (entity === "creatures") {
    const [characters,selected,locations] = await Promise.all([
      db.prepare("SELECT id,name FROM characters ORDER BY name").all(),
      db.prepare("SELECT character_id FROM creature_characters WHERE creature_id=?").bind(id).all(),
      db.prepare("SELECT id,location_name FROM creature_locations_text WHERE creature_id=? ORDER BY id").bind(id).all()
    ]);
    return json({ok:true,options:{characters:rows(characters)},selected:{characters:rows(selected).map(x=>x.character_id)},locations:rows(locations)});
  }

  if (entity === "factions") {
    const [characters,selected] = await Promise.all([
      db.prepare("SELECT id,name FROM characters ORDER BY name").all(),
      db.prepare("SELECT character_id FROM faction_characters WHERE faction_id=?").bind(id).all()
    ]);
    return json({ok:true,options:{characters:rows(characters)},selected:{characters:rows(selected).map(x=>x.character_id)}});
  }

  return json({ok:false,error:"Esta entidad no tiene relaciones configuradas"},400);
}

async function updateRelations(db, entity, id, data) {
  const type = data.type;

  if (entity === "characters" && type === "history") {
    await db.prepare("INSERT INTO character_history(character_id,session_id,event_date,title,note) VALUES(?,?,?,?,?)").bind(id,nullableInt(data.session),data.date||null,data.title||null,data.note||null).run();
    return json({ok:true});
  }
  if (entity === "characters" && type === "achievement") {
    await db.prepare("INSERT INTO character_achievements(character_id,name,description,achievement_date) VALUES(?,?,?,?)").bind(id,data.name||"Logro",data.description||null,data.date||null).run();
    return json({ok:true});
  }

  if (entity === "lore") {
    if (type === "characters") return replaceMany(db,"lore_characters","lore_id","character_id",id,data.ids);
    if (type === "factions") return replaceMany(db,"lore_factions","lore_id","faction_id",id,data.ids);
    if (type === "tag") { const value=String(data.value||"").trim(); if(!value)return json({ok:false,error:"Etiqueta vacía"},400); await db.prepare("INSERT INTO lore_tags(lore_id,tag) VALUES(?,?)").bind(id,value).run(); return json({ok:true}); }
  }

  if (entity === "locations") {
    if (type === "locations") return replaceMany(db,"location_connections","location_id","connected_location_id",id,data.ids);
    if (type === "characters") return replaceMany(db,"location_characters","location_id","character_id",id,data.ids);
    if (type === "creatures") return replaceMany(db,"location_creatures","location_id","creature_id",id,data.ids);
    if (type === "factions") return replaceMany(db,"location_factions","location_id","faction_id",id,data.ids);
    if (type === "discovery") { const value=String(data.value||"").trim(); if(!value)return json({ok:false,error:"Descubrimiento vacío"},400); await db.prepare("INSERT INTO location_discoveries(location_id,discovery) VALUES(?,?)").bind(id,value).run(); return json({ok:true}); }
  }

  if (entity === "chronicles") {
    if (type === "characters") return replaceMany(db,"chronicle_characters","chronicle_id","character_id",id,data.ids);
    if (type === "participant") { const value=String(data.value||"").trim(); if(!value)return json({ok:false,error:"Participante vacío"},400); await db.prepare("INSERT INTO chronicle_participants(chronicle_id,display_name) VALUES(?,?)").bind(id,value).run(); return json({ok:true}); }
  }

  if (entity === "creatures") {
    if (type === "characters") return replaceMany(db,"creature_characters","creature_id","character_id",id,data.ids);
    if (type === "location") { const value=String(data.value||"").trim(); if(!value)return json({ok:false,error:"Ubicación vacía"},400); await db.prepare("INSERT INTO creature_locations_text(creature_id,location_name) VALUES(?,?)").bind(id,value).run(); return json({ok:true}); }
  }

  if (entity === "factions" && type === "characters") return replaceMany(db,"faction_characters","faction_id","character_id",id,data.ids);

  return json({ok:false,error:"Relación no válida"},400);
}

async function deleteRelation(db, entity, id, data) {
  const tableMap = {
    "characters:history":["character_history","id","character_id"],
    "characters:achievement":["character_achievements","id","character_id"],
    "lore:tag":["lore_tags","id","lore_id"],
    "locations:discovery":["location_discoveries","id","location_id"],
    "chronicles:participant":["chronicle_participants","id","chronicle_id"],
    "creatures:location":["creature_locations_text","id","creature_id"]
  };
  const cfg = tableMap[`${entity}:${data.type}`];
  if (!cfg) return json({ok:false,error:"Relación no eliminable"},400);
  await db.prepare(`DELETE FROM ${cfg[0]} WHERE ${cfg[1]}=? AND ${cfg[2]}=?`).bind(Number(data.rowId),id).run();
  return json({ok:true});
}

async function replaceMany(db, table, ownerColumn, valueColumn, ownerId, values) {
  const ids=[...new Set((Array.isArray(values)?values:[]).map(Number).filter(Number.isInteger))];
  const statements=[db.prepare(`DELETE FROM ${table} WHERE ${ownerColumn}=?`).bind(ownerId)];
  ids.forEach(value=>statements.push(db.prepare(`INSERT OR IGNORE INTO ${table}(${ownerColumn},${valueColumn}) VALUES(?,?)`).bind(ownerId,value)));
  await db.batch(statements);
  return json({ok:true});
}
function nullableInt(v){const n=Number(v);return Number.isInteger(n)&&n>0?n:null}
