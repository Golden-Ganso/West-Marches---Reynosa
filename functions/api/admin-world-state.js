import { json, body, requireAdmin, rows } from "../_shared.js";

export async function onRequest(context) {
  const denied = requireAdmin(context);
  if (denied) return denied;

  try {
    if (context.request.method === "GET") {
      const [state, discoveries, stats] = await Promise.all([
        context.env.DB.prepare(`
          SELECT exploration, artifacts_found AS artifactsFound
          FROM world_state
          WHERE id = 1
        `).first(),
        context.env.DB.prepare(`
          SELECT id, discovery, sort_order AS sortOrder
          FROM world_discoveries
          ORDER BY sort_order, id
        `).all(),
        context.env.DB.prepare(`
          SELECT
            (SELECT COUNT(*) FROM sessions WHERE lower(status) = 'completed') AS completedExpeditions,
            (SELECT COUNT(*) FROM locations WHERE explored = 1) AS discoveredLocations,
            (SELECT COUNT(*) FROM characters) AS registeredCharacters
        `).first()
      ]);

      return json({
        ok: true,
        state: {
          exploration: Number(state?.exploration || 0),
          artifactsFound: Number(state?.artifactsFound || 0)
        },
        stats: {
          completedExpeditions: Number(stats?.completedExpeditions || 0),
          discoveredLocations: Number(stats?.discoveredLocations || 0),
          registeredCharacters: Number(stats?.registeredCharacters || 0)
        },
        discoveries: rows(discoveries)
      });
    }

    const data = await body(context.request);

    if (context.request.method === "PUT") {
      const exploration = clampNumber(data.exploration, 0, 100);
      const artifactsFound = Math.max(0, Math.trunc(Number(data.artifactsFound || 0)));

      await context.env.DB.prepare(`
        INSERT INTO world_state
          (id, exploration, discovered_locations, completed_expeditions, artifacts_found)
        VALUES
          (1, ?, 0, 0, ?)
        ON CONFLICT(id) DO UPDATE SET
          exploration = excluded.exploration,
          artifacts_found = excluded.artifacts_found
      `).bind(exploration, artifactsFound).run();

      return json({ ok: true });
    }

    if (context.request.method === "POST") {
      const discovery = String(data.discovery || "").trim();
      if (!discovery) return json({ ok:false, error:"El descubrimiento está vacío." }, 400);

      const last = await context.env.DB.prepare(`
        SELECT COALESCE(MAX(sort_order), -1) AS maxOrder
        FROM world_discoveries
      `).first();

      await context.env.DB.prepare(`
        INSERT INTO world_discoveries(discovery, sort_order)
        VALUES(?, ?)
      `).bind(discovery, Number(last?.maxOrder || 0) + 1).run();

      return json({ ok:true });
    }

    if (context.request.method === "DELETE") {
      const id = Number(data.id);
      if (!Number.isInteger(id) || id <= 0) return json({ok:false,error:"ID inválido."},400);
      await context.env.DB.prepare("DELETE FROM world_discoveries WHERE id = ?").bind(id).run();
      return json({ok:true});
    }

    return json({ok:false,error:"Método no permitido."},405);
  } catch (error) {
    console.error("admin-world-state", error);
    return json({ok:false,error:String(error?.message || error)},500);
  }
}

function clampNumber(value, min, max) {
  const number = Number(value);
  if (!Number.isFinite(number)) return min;
  return Math.min(max, Math.max(min, number));
}
