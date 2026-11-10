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
