import { json, body, requireAdmin, num, rows } from "../_shared.js";

export async function onRequest(context) {
  const denied = requireAdmin(context);
  if (denied) return denied;

  const url = new URL(context.request.url);
  const buildingId = num(url.searchParams.get("building"));
  if (!buildingId) return json({ ok:false, error:"building requerido" }, 400);

  try {
    if (context.request.method === "GET") return getBuildingAdmin(context.env.DB, buildingId);
    const data = await body(context.request);
    if (context.request.method === "POST") return createChild(context.env.DB, buildingId, data);
    if (context.request.method === "PUT") return updateChild(context.env.DB, buildingId, data);
    if (context.request.method === "DELETE") return deleteChild(context.env.DB, buildingId, data);
    return json({ok:false,error:"Método no permitido"},405);
  } catch (error) {
    console.error("admin-building", error);
    return json({ok:false,error:String(error?.message||error)},500);
  }
}

async function getBuildingAdmin(db,id){
  const building=await db.prepare("SELECT * FROM buildings WHERE id=?").bind(id).first();
  if(!building)return json({ok:false,error:"Edificio no encontrado"},404);
  const [services,items,incoming,npcs,relations]=await Promise.all([
    db.prepare("SELECT * FROM services WHERE building_id=? ORDER BY id").bind(id).all(),
    db.prepare("SELECT * FROM shop_items WHERE building_id=? ORDER BY category,name,id").bind(id).all(),
    db.prepare("SELECT * FROM incoming_items WHERE building_id=? ORDER BY id").bind(id).all(),
    db.prepare("SELECT id,name,title,occupation FROM npcs WHERE settlement_id=? ORDER BY name").bind(building.settlement_id).all(),
    db.prepare("SELECT npc_id,relationship FROM npc_buildings WHERE building_id=?").bind(id).all()
  ]);
  return json({ok:true,building,services:rows(services),items:rows(items),incoming:rows(incoming),npcs:rows(npcs),npcRelations:rows(relations)});
}

async function createChild(db,buildingId,data){
  if(data.type==="service"){
    await db.prepare("INSERT INTO services(building_id,name,description,price,currency,status) VALUES(?,?,?,?,?,?)").bind(buildingId,data.name||"Servicio",data.description||null,nullableNumber(data.price),data.currency||null,data.status||"Disponible").run();
    return json({ok:true});
  }
  if(data.type==="item"){
    await db.prepare("INSERT INTO shop_items(building_id,name,category,description,price,currency,quantity,status) VALUES(?,?,?,?,?,?,?,?)").bind(buildingId,data.name||"Artículo",data.category||null,data.description||null,nullableNumber(data.price),data.currency||null,nullableInt(data.quantity),data.status||"Disponible").run();
    return json({ok:true});
  }
  if(data.type==="incoming"){
    await db.prepare("INSERT INTO incoming_items(building_id,name,expected_date,source,status,notes) VALUES(?,?,?,?,?,?)").bind(buildingId,data.name||"Mercancía",data.expected_date||null,data.source||null,data.status||"Próximamente",data.notes||null).run();
    return json({ok:true});
  }
  if(data.type==="npc"){
    const npcId=num(data.npc_id); if(!npcId)return json({ok:false,error:"NPC inválido"},400);
    await db.prepare("INSERT OR REPLACE INTO npc_buildings(npc_id,building_id,relationship) VALUES(?,?,?)").bind(npcId,buildingId,data.relationship||null).run();
    return json({ok:true});
  }
  return json({ok:false,error:"Tipo inválido"},400);
}

async function updateChild(db,buildingId,data){
  const rowId=num(data.id); if(!rowId)return json({ok:false,error:"id requerido"},400);
  if(data.type==="service"){
    await db.prepare("UPDATE services SET name=?,description=?,price=?,currency=?,status=? WHERE id=? AND building_id=?").bind(data.name||"Servicio",data.description||null,nullableNumber(data.price),data.currency||null,data.status||"Disponible",rowId,buildingId).run();return json({ok:true});
  }
  if(data.type==="item"){
    await db.prepare("UPDATE shop_items SET name=?,category=?,description=?,price=?,currency=?,quantity=?,status=? WHERE id=? AND building_id=?").bind(data.name||"Artículo",data.category||null,data.description||null,nullableNumber(data.price),data.currency||null,nullableInt(data.quantity),data.status||"Disponible",rowId,buildingId).run();return json({ok:true});
  }
  if(data.type==="incoming"){
    await db.prepare("UPDATE incoming_items SET name=?,expected_date=?,source=?,status=?,notes=? WHERE id=? AND building_id=?").bind(data.name||"Mercancía",data.expected_date||null,data.source||null,data.status||"Próximamente",data.notes||null,rowId,buildingId).run();return json({ok:true});
  }
  return json({ok:false,error:"Tipo inválido"},400);
}

async function deleteChild(db,buildingId,data){
  if(data.type==="npc"){
    const npcId=num(data.npc_id);if(!npcId)return json({ok:false,error:"NPC inválido"},400);
    await db.prepare("DELETE FROM npc_buildings WHERE npc_id=? AND building_id=?").bind(npcId,buildingId).run();return json({ok:true});
  }
  const configs={service:"services",item:"shop_items",incoming:"incoming_items"};
  const table=configs[data.type],rowId=num(data.id);if(!table||!rowId)return json({ok:false,error:"Datos inválidos"},400);
  await db.prepare(`DELETE FROM ${table} WHERE id=? AND building_id=?`).bind(rowId,buildingId).run();return json({ok:true});
}
function nullableNumber(v){if(v===null||v===undefined||v==="")return null;const n=Number(v);return Number.isFinite(n)?n:null}
function nullableInt(v){const n=nullableNumber(v);return n===null?null:Math.trunc(n)}
