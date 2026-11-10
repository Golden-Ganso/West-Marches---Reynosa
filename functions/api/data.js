import {json,num,rows} from "../_shared.js";

const simple = {
  rumors: ["id","title","text","status"],
  news: ["id","type","news_date","title","text","link"]
};

export async function onRequestGet({request,env}) {
  const u = new URL(request.url);
  const entity = u.searchParams.get("entity");
  const id = num(u.searchParams.get("id"));

  if (!entity) return json({ok:false,error:"entity requerido"},400);

  try {
    if (entity === "world") return world(env.DB);
    if (entity === "characters") return characters(env.DB,id);
    if (entity === "sessions") return sessions(env.DB,id);
    if (entity === "chronicles") return chronicles(env.DB,id);
    if (entity === "creatures") return creatures(env.DB,id);
    if (entity === "factions") return factions(env.DB,id);
    if (entity === "locations") return locations(env.DB,id);
    if (entity === "lore") return lore(env.DB,id);

    if (simple[entity]) {
      const r = await env.DB
        .prepare(`SELECT * FROM ${entity}${id ? " WHERE id=?" : " ORDER BY id"}`)
        .bind(...(id ? [id] : []))
        .all();
      return json(id ? (r.results?.[0] || null) : rows(r));
    }

    return json({ok:false,error:"Entidad desconocida"},404);
  } catch (e) {
    console.error(e);
    return json({ok:false,error:"Error consultando datos"},500);
  }
}

async function characters(db,id) {
  const r = await db.prepare(`SELECT * FROM characters${id ? " WHERE id=?" : " ORDER BY id"}`).bind(...(id ? [id] : [])).all();
  const list = rows(r);
  for (const x of list) {
    x.class = x.class_name;
    delete x.class_name;
    x.history = rows(await db.prepare("SELECT session_id session,event_date date,title,note FROM character_history WHERE character_id=? ORDER BY event_date DESC").bind(x.id).all());
    x.achievements = rows(await db.prepare("SELECT name,description,achievement_date date FROM character_achievements WHERE character_id=? ORDER BY achievement_date DESC").bind(x.id).all());
  }
  return json(id ? (list[0] || null) : list);
}

async function sessions(db,id) {
  const r = await db.prepare(`SELECT * FROM sessions${id ? " WHERE id=?" : " ORDER BY id"}`).bind(...(id ? [id] : [])).all();
  const list = rows(r);
  for (const x of list) {
    x.date = x.session_date;
    x.time = x.session_time;
    delete x.session_date;
    delete x.session_time;
    x.characterIds = rows(await db.prepare("SELECT character_id FROM session_characters WHERE session_id=?").bind(x.id).all()).map(z=>z.character_id);
    x.players = rows(await db.prepare("SELECT display_name FROM session_players WHERE session_id=? ORDER BY id").bind(x.id).all()).map(z=>z.display_name);
    x.discoveries = rows(await db.prepare("SELECT discovery FROM session_discoveries WHERE session_id=? ORDER BY id").bind(x.id).all()).map(z=>z.discovery);
    x.creatureIds = rows(await db.prepare("SELECT creature_id FROM session_creatures WHERE session_id=?").bind(x.id).all()).map(z=>z.creature_id);
    x.factionIds = rows(await db.prepare("SELECT faction_id FROM session_factions WHERE session_id=?").bind(x.id).all()).map(z=>z.faction_id);
    x.locationIds = rows(await db.prepare("SELECT location_id FROM session_locations WHERE session_id=?").bind(x.id).all()).map(z=>z.location_id);
  }
  return json(id ? (list[0] || null) : list);
}

async function chronicles(db,id) {
  const r = await db.prepare(`SELECT id,session_id session,title,chronicle_date date,author,image,summary FROM chronicles${id ? " WHERE id=?" : " ORDER BY id"}`).bind(...(id ? [id] : [])).all();
  const list = rows(r);
  for (const x of list) {
    x.characterIds = rows(await db.prepare("SELECT character_id FROM chronicle_characters WHERE chronicle_id=?").bind(x.id).all()).map(z=>z.character_id);
    x.participants = rows(await db.prepare("SELECT display_name FROM chronicle_participants WHERE chronicle_id=? ORDER BY id").bind(x.id).all()).map(z=>z.display_name);
  }
  return json(id ? (list[0] || null) : list);
}

async function creatures(db,id) {
  const r = await db.prepare(`SELECT id,name,type,status,first_seen firstSeen,danger,image,description,notes FROM creatures${id ? " WHERE id=?" : " ORDER BY id"}`).bind(...(id ? [id] : [])).all();
  const list = rows(r);
  for (const x of list) {
    x.characterIds = rows(await db.prepare("SELECT character_id FROM creature_characters WHERE creature_id=?").bind(x.id).all()).map(z=>z.character_id);
    x.locations = rows(await db.prepare("SELECT location_name FROM creature_locations_text WHERE creature_id=? ORDER BY id").bind(x.id).all()).map(z=>z.location_name);
  }
  return json(id ? (list[0] || null) : list);
}

async function factions(db,id) {
  const r = await db.prepare(`SELECT id,name,status,relationship,image,description,first_contact firstContact,notes FROM factions${id ? " WHERE id=?" : " ORDER BY id"}`).bind(...(id ? [id] : [])).all();
  const list = rows(r);
  for (const x of list) {
    x.characterIds = rows(await db.prepare("SELECT character_id FROM faction_characters WHERE faction_id=?").bind(x.id).all()).map(z=>z.character_id);
  }
  return json(id ? (list[0] || null) : list);
}

async function locations(db,id) {
  const r = await db.prepare(`SELECT id,name,type,status,danger,discovered_in discoveredIn,image,map_x mapX,map_y mapY,explored,reveal_radius revealRadius,corridor_width corridorWidth,description,notes FROM locations${id ? " WHERE id=?" : " ORDER BY id"}`).bind(...(id ? [id] : [])).all();
  const list = rows(r);
  for (const x of list) {
    x.explored = !!x.explored;
    x.connectedTo = rows(await db.prepare("SELECT connected_location_id FROM location_connections WHERE location_id=?").bind(x.id).all()).map(z=>z.connected_location_id);
    x.discoveries = rows(await db.prepare("SELECT discovery FROM location_discoveries WHERE location_id=? ORDER BY id").bind(x.id).all()).map(z=>z.discovery);
    x.characterIds = rows(await db.prepare("SELECT character_id FROM location_characters WHERE location_id=?").bind(x.id).all()).map(z=>z.character_id);
    x.creatureIds = rows(await db.prepare("SELECT creature_id FROM location_creatures WHERE location_id=?").bind(x.id).all()).map(z=>z.creature_id);
    x.factionIds = rows(await db.prepare("SELECT faction_id FROM location_factions WHERE location_id=?").bind(x.id).all()).map(z=>z.faction_id);
  }
  return json(id ? (list[0] || null) : list);
}

async function lore(db,id) {
  const r = await db.prepare(`SELECT id,title,type,category,author,status,knowledge,image,found_in_session foundInSession,found_at_location foundAtLocation,summary,content FROM lore${id ? " WHERE id=?" : " ORDER BY id"}`).bind(...(id ? [id] : [])).all();
  const list = rows(r);
  for (const x of list) {
    x.characterIds = rows(await db.prepare("SELECT character_id FROM lore_characters WHERE lore_id=?").bind(x.id).all()).map(z=>z.character_id);
    x.factionIds = rows(await db.prepare("SELECT faction_id FROM lore_factions WHERE lore_id=?").bind(x.id).all()).map(z=>z.faction_id);
    x.tags = rows(await db.prepare("SELECT tag FROM lore_tags WHERE lore_id=? ORDER BY id").bind(x.id).all()).map(z=>z.tag);
  }
  return json(id ? (list[0] || null) : list);
}

async function world(db) {
  const x = await db.prepare("SELECT exploration,discovered_locations discoveredLocations,completed_expeditions completedExpeditions,artifacts_found artifactsFound FROM world_state WHERE id=1").first() || {exploration:0,discoveredLocations:0,completedExpeditions:0,artifactsFound:0};
  x.latestDiscoveries = rows(await db.prepare("SELECT discovery FROM world_discoveries ORDER BY sort_order,id").all()).map(z=>z.discovery);
  return json(x);
}
