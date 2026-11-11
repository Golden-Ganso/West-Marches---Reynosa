import { json, body, requireAdmin, num, rows } from "../_shared.js";

export async function onRequest(context) {
  const denied = requireAdmin(context);
  if (denied) return denied;

  const url = new URL(context.request.url);
  const sessionId = num(url.searchParams.get("session"));
  if (!sessionId) return json({ ok:false, error:"session requerido" }, 400);

  try {
    if (context.request.method === "GET") return getSessionRelations(context.env.DB, sessionId);
    if (context.request.method === "PUT") return updateSessionRelations(context.env.DB, sessionId, await body(context.request));
    if (context.request.method === "DELETE") return deleteRegistration(context.env.DB, sessionId, await body(context.request));
    return json({ ok:false, error:"Método no permitido" }, 405);
  } catch (error) {
    console.error("Admin relations:", error);
    return json({ ok:false, error:String(error?.message || error) }, 500);
  }
}

async function getSessionRelations(db, sessionId) {
  const session = await db.prepare("SELECT id,title,status,slots FROM sessions WHERE id=?").bind(sessionId).first();
  if (!session) return json({ok:false,error:"Expedición no encontrada"},404);

  const [characters, creatures, factions, locations, sc, scr, sf, sl, discoveries, registrations] = await Promise.all([
    db.prepare("SELECT id,name,player FROM characters WHERE lower(status)='activo' ORDER BY name").all(),
    db.prepare("SELECT id,name FROM creatures ORDER BY name").all(),
    db.prepare("SELECT id,name FROM factions ORDER BY name").all(),
    db.prepare("SELECT id,name FROM locations ORDER BY name").all(),
    db.prepare("SELECT character_id FROM session_characters WHERE session_id=?").bind(sessionId).all(),
    db.prepare("SELECT creature_id FROM session_creatures WHERE session_id=?").bind(sessionId).all(),
    db.prepare("SELECT faction_id FROM session_factions WHERE session_id=?").bind(sessionId).all(),
    db.prepare("SELECT location_id FROM session_locations WHERE session_id=?").bind(sessionId).all(),
    db.prepare("SELECT id,discovery FROM session_discoveries WHERE session_id=? ORDER BY id").bind(sessionId).all(),
    db.prepare(`SELECT r.id registrationId,r.character_id characterId,c.name,c.player,r.created_at createdAt FROM registrations r JOIN characters c ON c.id=r.character_id WHERE r.session_id=? ORDER BY r.created_at,r.id`).bind(sessionId).all()
  ]);

  return json({ok:true,session,
    options:{characters:rows(characters),creatures:rows(creatures),factions:rows(factions),locations:rows(locations)},
    selected:{characters:rows(sc).map(x=>x.character_id),creatures:rows(scr).map(x=>x.creature_id),factions:rows(sf).map(x=>x.faction_id),locations:rows(sl).map(x=>x.location_id)},
    discoveries:rows(discoveries), registrations:rows(registrations)
  });
}

async function updateSessionRelations(db, sessionId, data) {
  const type = data.type;
  if (type === "slots") {
    const slots = Math.max(1, Number(data.slots || 1));
    await db.prepare("UPDATE sessions SET slots=? WHERE id=?").bind(slots,sessionId).run();
    return json({ok:true});
  }
  if (type === "status") {
    const status = ["open","closed","completed"].includes(data.status) ? data.status : "open";
    await db.prepare("UPDATE sessions SET status=? WHERE id=?").bind(status,sessionId).run();
    return json({ok:true});
  }
  if (type === "discovery") {
    const value = String(data.value || "").trim();
    if (!value) return json({ok:false,error:"Descubrimiento vacío"},400);
    await db.prepare("INSERT INTO session_discoveries(session_id,discovery) VALUES(?,?)").bind(sessionId,value).run();
    return json({ok:true});
  }
  if (type === "deleteDiscovery") {
    await db.prepare("DELETE FROM session_discoveries WHERE id=? AND session_id=?").bind(Number(data.id),sessionId).run();
    return json({ok:true});
  }

  const mapping = {
    characters:["session_characters","character_id"],
    creatures:["session_creatures","creature_id"],
    factions:["session_factions","faction_id"],
    locations:["session_locations","location_id"]
  };
  const cfg = mapping[type];
  if (!cfg) return json({ok:false,error:"Tipo de relación inválido"},400);
  const ids = Array.isArray(data.ids) ? [...new Set(data.ids.map(Number).filter(Number.isInteger))] : [];
  const statements = [db.prepare(`DELETE FROM ${cfg[0]} WHERE session_id=?`).bind(sessionId)];
  ids.forEach(id => statements.push(db.prepare(`INSERT OR IGNORE INTO ${cfg[0]}(session_id,${cfg[1]}) VALUES(?,?)`).bind(sessionId,id)));
  await db.batch(statements);
  return json({ok:true});
}

async function deleteRegistration(db, sessionId, data) {
  const characterId = num(data.characterId);
  if (!characterId) return json({ok:false,error:"characterId requerido"},400);
  await db.prepare("DELETE FROM registrations WHERE session_id=? AND character_id=?").bind(sessionId,characterId).run();
  return json({ok:true});
}
