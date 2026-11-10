import { json, body, adminCookieOk } from "../_shared.js";

export async function onRequest({ request, env }) {
  if (request.method === "GET") {
    return json({ ok: true, authenticated: adminCookieOk(request, env) });
  }

  if (request.method === "DELETE") {
    return new Response(JSON.stringify({ ok: true }), {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "no-store",
        "Set-Cookie": "wm_admin=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Strict"
      }
    });
  }

  if (request.method !== "POST") {
    return json({ ok: false, error: "Método no permitido." }, 405);
  }

  const data = await body(request);

  if (!env.ADMIN_PASSWORD) {
    return json({ ok: false, error: "ADMIN_PASSWORD no está configurada en Cloudflare." }, 500);
  }

  if (data.username !== "Miguel" || data.password !== env.ADMIN_PASSWORD) {
    return json({ ok: false, error: "Credenciales inválidas." }, 401);
  }

  return new Response(JSON.stringify({ ok: true }), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      "Set-Cookie": `wm_admin=${env.ADMIN_PASSWORD}; Path=/; Max-Age=28800; HttpOnly; Secure; SameSite=Strict`
    }
  });
}
