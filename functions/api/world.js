import { json, num, rows } from "../_shared.js";

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const entity = url.searchParams.get("entity") || "settlements";
  const id = num(url.searchParams.get("id"));

  try {
    if (entity === "settlements") return settlements(env.DB, id);
    if (entity === "buildings") return buildings(env.DB, id, num(url.searchParams.get("settlement")));
    if (entity === "npcs") return npcs(env.DB, id, num(url.searchParams.get("settlement")));
    if (entity === "projects") return projects(env.DB, id, num(url.searchParams.get("settlement")));
    return json({ ok:false, error:"Entidad de mundo desconocida." }, 404);
  } catch (error) {
    console.error("world api", error);
    return json({ ok:false, error:"No fue posible consultar el mundo." }, 500);
  }
}

async function settlements(db,id){
  const r=await db.prepare(`SELECT * FROM settlements WHERE visibility='public'${id?" AND id=?":" ORDER BY name"}`).bind(...(id?[id]:[])).all();
  const list=rows(r);
  for(const x of list){
    const [b,n,p]=await Promise.all([
      db.prepare("SELECT id,name,type,status,owner_npc_id,area,description,image FROM buildings WHERE settlement_id=? AND visibility='public' ORDER BY id").bind(x.id).all(),
      db.prepare("SELECT id,name,title,race,occupation,status,description,image FROM npcs WHERE settlement_id=? AND visibility='public' ORDER BY name").bind(x.id).all(),
      db.prepare("SELECT id,name,status,progress,description FROM projects WHERE settlement_id=? AND visibility='public' ORDER BY CASE status WHEN 'Activo' THEN 0 WHEN 'Propuesto' THEN 1 ELSE 2 END,id").bind(x.id).all()
    ]);
    x.buildings=rows(b);x.npcs=rows(n);x.projects=rows(p);
  }
  return json(id?(list[0]||null):list);
}

async function buildings(db,id,settlementId){
  let sql="SELECT b.*,n.name owner_name,n.title owner_title FROM buildings b LEFT JOIN npcs n ON n.id=b.owner_npc_id WHERE b.visibility='public'";
  const vals=[]; if(id){sql+=" AND b.id=?";vals.push(id)} else if(settlementId){sql+=" AND b.settlement_id=?";vals.push(settlementId)} sql+=" ORDER BY b.id";
  const r=await db.prepare(sql).bind(...vals).all(),list=rows(r);
  for(const x of list){
    const [s,i,inc,people]=await Promise.all([
      db.prepare("SELECT id,name,description,price,currency,status FROM services WHERE building_id=? ORDER BY id").bind(x.id).all(),
      db.prepare("SELECT id,name,category,description,price,currency,quantity,status FROM shop_items WHERE building_id=? ORDER BY category,name").bind(x.id).all(),
      db.prepare("SELECT id,name,expected_date,source,status,notes FROM incoming_items WHERE building_id=? ORDER BY id").bind(x.id).all(),
      db.prepare("SELECT n.id,n.name,n.title,n.occupation,nb.relationship FROM npc_buildings nb JOIN npcs n ON n.id=nb.npc_id WHERE nb.building_id=? AND n.visibility='public' ORDER BY n.name").bind(x.id).all()
    ]);
    x.services=rows(s);x.items=rows(i);x.incomingItems=rows(inc);x.people=rows(people);
  }
  return json(id?(list[0]||null):list);
}

async function npcs(db,id,settlementId){
  let sql="SELECT * FROM npcs WHERE visibility='public'",vals=[];if(id){sql+=" AND id=?";vals=[id]}else if(settlementId){sql+=" AND settlement_id=?";vals=[settlementId]}sql+=" ORDER BY name";
  const r=await db.prepare(sql).bind(...vals).all(),list=rows(r);
  for(const x of list){x.buildings=rows(await db.prepare("SELECT b.id,b.name,b.type,nb.relationship FROM npc_buildings nb JOIN buildings b ON b.id=nb.building_id WHERE nb.npc_id=? AND b.visibility='public'").bind(x.id).all())}
  return json(id?(list[0]||null):list);
}

async function projects(db,id,settlementId){
  let sql="SELECT * FROM projects WHERE visibility='public'",vals=[];if(id){sql+=" AND id=?";vals=[id]}else if(settlementId){sql+=" AND settlement_id=?";vals=[settlementId]}sql+=" ORDER BY id";
  const r=await db.prepare(sql).bind(...vals).all(),list=rows(r);
  for(const x of list)x.resources=rows(await db.prepare("SELECT id,resource,required,current,unit FROM project_resources WHERE project_id=? ORDER BY id").bind(x.id).all());
  return json(id?(list[0]||null):list);
}
