export function json(data,status=200){return new Response(JSON.stringify(data),{status,headers:{"Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store"}})}
export function num(v){const n=Number(v);return Number.isInteger(n)&&n>0?n:null}
export async function body(req){try{return await req.json()}catch{return {}}}
export function adminCookieOk(request,env){const cookie=request.headers.get("Cookie")||"";return cookie.split(/;\s*/).some(x=>x===`wm_admin=${env.ADMIN_PASSWORD||""}`)}
export function requireAdmin(context){return adminCookieOk(context.request,context.env)?null:json({ok:false,error:"No autorizado"},401)}
export function rows(result){return result?.results||[]}
