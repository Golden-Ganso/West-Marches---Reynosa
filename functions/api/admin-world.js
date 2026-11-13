import {json,body,requireAdmin,num,rows} from "../_shared.js";

const CFG={
 settlements:{table:"settlements",fields:["name","type","status","population","military_population","faction_id","location_id","governor_name","founded","description","image","visibility","security_level","defenses"]},
 npcs:{table:"npcs",fields:["name","alias","title","race","occupation","status","settlement_id","faction_id","description","notes","image","first_seen","visibility","age","origin","personality","public_quote"]},
 buildings:{table:"buildings",fields:["settlement_id","name","type","status","owner_npc_id","description","image","visibility","area"]},
 projects:{table:"projects",fields:["settlement_id","name","status","progress","description","started_session","completed_session","visibility"]}
};

export async function onRequest(context){
 const denied=requireAdmin(context);if(denied)return denied;
 const u=new URL(context.request.url),entity=u.searchParams.get("entity"),cfg=CFG[entity];
 if(!cfg)return json({ok:false,error:"Entidad de Mundo inválida"},400);
 try{
  if(context.request.method==="GET"){
   const r=await context.env.DB.prepare(`SELECT * FROM ${cfg.table} ORDER BY id DESC`).all();
   return json({ok:true,items:rows(r)});
  }
  const b=await body(context.request),data=b.data||{};
  if(context.request.method==="POST"){
   const supplied=num(data.id),fields=cfg.fields.filter(f=>data[f]!==undefined),cols=supplied?["id",...fields]:fields,vals=supplied?[supplied,...fields.map(f=>data[f])]:fields.map(f=>data[f]);
   if(!cols.length)return json({ok:false,error:"Sin datos"},400);
   await context.env.DB.prepare(`INSERT INTO ${cfg.table}(${cols.join(",")}) VALUES(${cols.map(()=>"?").join(",")})`).bind(...vals).run();
   return json({ok:true});
  }
  if(context.request.method==="PUT"){
   const id=num(b.id),fields=cfg.fields.filter(f=>data[f]!==undefined);if(!id)return json({ok:false,error:"ID requerido"},400);if(!fields.length)return json({ok:false,error:"Sin cambios"},400);
   await context.env.DB.prepare(`UPDATE ${cfg.table} SET ${fields.map(f=>`${f}=?`).join(",")} WHERE id=?`).bind(...fields.map(f=>data[f]),id).run();return json({ok:true});
  }
  if(context.request.method==="DELETE"){
   const id=num(b.id);if(!id)return json({ok:false,error:"ID requerido"},400);
   await context.env.DB.prepare(`DELETE FROM ${cfg.table} WHERE id=?`).bind(id).run();return json({ok:true});
  }
  return json({ok:false,error:"Método no permitido"},405);
 }catch(e){console.error("admin-world",e);return json({ok:false,error:String(e.message||e)},500)}
}
