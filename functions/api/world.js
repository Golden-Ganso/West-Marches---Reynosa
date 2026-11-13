import { json, num, rows } from "../_shared.js";

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const entity = url.searchParams.get("entity") || "settlements";
  const id = num(url.searchParams.get("id"));

  try {
    if (entity === "settlements") {
      return settlements(env.DB, id);
    }

    if (entity === "buildings") {
      return buildings(
        env.DB,
        id,
        num(url.searchParams.get("settlement"))
      );
    }

    if (entity === "npcs") {
      return npcs(
        env.DB,
        id,
        num(url.searchParams.get("settlement"))
      );
    }

    if (entity === "projects") {
      return projects(
        env.DB,
        id,
        num(url.searchParams.get("settlement"))
      );
    }

    return json(
      { ok: false, error: "Entidad de mundo desconocida." },
      404
    );
  } catch (error) {
    console.error("world api", error);

    return json(
      { ok: false, error: "No fue posible consultar el mundo." },
      500
    );
  }
}

async function settlements(db, id) {
  const result = await db
    .prepare(`
      SELECT *
      FROM settlements
      WHERE visibility = 'public'
      ${id ? "AND id = ?" : "ORDER BY name"}
    `)
    .bind(...(id ? [id] : []))
    .all();

  const list = rows(result);

  for (const settlement of list) {
    const [buildingsResult, npcsResult, projectsResult] = await Promise.all([
      db.prepare(`
        SELECT
          id,
          name,
          type,
          status,
          owner_npc_id,
          area,
          description,
          image
        FROM buildings
        WHERE settlement_id = ?
          AND visibility = 'public'
        ORDER BY id
      `)
        .bind(settlement.id)
        .all(),

      db.prepare(`
        SELECT
          id,
          name,
          alias,
          title,
          race,
          occupation,
          status,
          description,
          image,
          age,
          origin,
          personality,
          public_quote
        FROM npcs
        WHERE settlement_id = ?
          AND visibility = 'public'
        ORDER BY name
      `)
        .bind(settlement.id)
        .all(),

      db.prepare(`
        SELECT
          id,
          name,
          status,
          progress,
          description,
          started_session,
          completed_session
        FROM projects
        WHERE settlement_id = ?
          AND visibility = 'public'
        ORDER BY
          CASE status
            WHEN 'Activo' THEN 0
            WHEN 'Propuesto' THEN 1
            WHEN 'Completado' THEN 2
            ELSE 3
          END,
          id
      `)
        .bind(settlement.id)
        .all()
    ]);

    const settlementProjects = rows(projectsResult);

    // Esta era la pieza que faltaba: al devolver un asentamiento,
    // cada proyecto debe incluir también project_resources.
    await attachResourcesToProjects(db, settlementProjects);

    settlement.buildings = rows(buildingsResult);
    settlement.npcs = rows(npcsResult);
    settlement.projects = settlementProjects;
  }

  return json(
    id
      ? (list[0] || null)
      : list
  );
}

async function buildings(db, id, settlementId) {
  let sql = `
    SELECT
      b.*,
      n.name AS owner_name,
      n.title AS owner_title
    FROM buildings b
    LEFT JOIN npcs n
      ON n.id = b.owner_npc_id
    WHERE b.visibility = 'public'
  `;

  const values = [];

  if (id) {
    sql += " AND b.id = ?";
    values.push(id);
  } else if (settlementId) {
    sql += " AND b.settlement_id = ?";
    values.push(settlementId);
  }

  sql += " ORDER BY b.id";

  const result = await db
    .prepare(sql)
    .bind(...values)
    .all();

  const list = rows(result);

  for (const building of list) {
    const [servicesResult, itemsResult, incomingResult, peopleResult] =
      await Promise.all([
        db.prepare(`
          SELECT
            id,
            name,
            description,
            price,
            currency,
            status
          FROM services
          WHERE building_id = ?
          ORDER BY id
        `)
          .bind(building.id)
          .all(),

        db.prepare(`
          SELECT
            id,
            name,
            category,
            description,
            price,
            currency,
            quantity,
            status
          FROM shop_items
          WHERE building_id = ?
          ORDER BY category, name
        `)
          .bind(building.id)
          .all(),

        db.prepare(`
          SELECT
            id,
            name,
            expected_date,
            source,
            status,
            notes
          FROM incoming_items
          WHERE building_id = ?
          ORDER BY id
        `)
          .bind(building.id)
          .all(),

        db.prepare(`
          SELECT
            n.id,
            n.name,
            n.alias,
            n.title,
            n.occupation,
            nb.relationship
          FROM npc_buildings nb
          JOIN npcs n
            ON n.id = nb.npc_id
          WHERE nb.building_id = ?
            AND n.visibility = 'public'
          ORDER BY n.name
        `)
          .bind(building.id)
          .all()
      ]);

    building.services = rows(servicesResult);
    building.items = rows(itemsResult);
    building.incomingItems = rows(incomingResult);
    building.people = rows(peopleResult);
  }

  return json(
    id
      ? (list[0] || null)
      : list
  );
}

async function npcs(db, id, settlementId) {
  let sql = `
    SELECT *
    FROM npcs
    WHERE visibility = 'public'
  `;

  let values = [];

  if (id) {
    sql += " AND id = ?";
    values = [id];
  } else if (settlementId) {
    sql += " AND settlement_id = ?";
    values = [settlementId];
  }

  sql += " ORDER BY name";

  const result = await db
    .prepare(sql)
    .bind(...values)
    .all();

  const list = rows(result);

  for (const npc of list) {
    npc.buildings = rows(
      await db.prepare(`
        SELECT
          b.id,
          b.name,
          b.type,
          nb.relationship
        FROM npc_buildings nb
        JOIN buildings b
          ON b.id = nb.building_id
        WHERE nb.npc_id = ?
          AND b.visibility = 'public'
        ORDER BY b.name
      `)
        .bind(npc.id)
        .all()
    );
  }

  return json(
    id
      ? (list[0] || null)
      : list
  );
}

async function projects(db, id, settlementId) {
  let sql = `
    SELECT *
    FROM projects
    WHERE visibility = 'public'
  `;

  let values = [];

  if (id) {
    sql += " AND id = ?";
    values = [id];
  } else if (settlementId) {
    sql += " AND settlement_id = ?";
    values = [settlementId];
  }

  sql += `
    ORDER BY
      CASE status
        WHEN 'Activo' THEN 0
        WHEN 'Propuesto' THEN 1
        WHEN 'Completado' THEN 2
        ELSE 3
      END,
      id
  `;

  const result = await db
    .prepare(sql)
    .bind(...values)
    .all();

  const list = rows(result);

  await attachResourcesToProjects(db, list);

  return json(
    id
      ? (list[0] || null)
      : list
  );
}

async function attachResourcesToProjects(db, projectList) {
  if (!projectList.length) return;

  // Se consulta cada proyecto para mantener la estructura sencilla.
  // Para la cantidad actual de proyectos de Nueva Pyra es más que suficiente.
  await Promise.all(
    projectList.map(async project => {
      const resourcesResult = await db
        .prepare(`
          SELECT
            id,
            resource,
            required,
            current,
            unit
          FROM project_resources
          WHERE project_id = ?
          ORDER BY id
        `)
        .bind(project.id)
        .all();

      project.resources = rows(resourcesResult);
    })
  );
}
