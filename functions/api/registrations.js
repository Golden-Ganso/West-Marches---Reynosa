const JSON_HEADERS = {
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "no-store"
};

export async function onRequest(context) {
  const method = context.request.method.toUpperCase();

  if (method === "GET") return handleGet(context);
  if (method === "POST") return handlePost(context);
  if (method === "DELETE") return handleDelete(context);
  if (method === "OPTIONS") return new Response(null, { status: 204 });

  return jsonResponse({ ok: false, error: "Método no permitido." }, 405);
}

async function handleGet(context) {
  try {
    const sessionId = getSessionIdFromUrl(context.request.url);

    if (!sessionId) {
      return jsonResponse({ ok: false, error: "Sesión inválida." }, 400);
    }

    const session = await getSession(context.env.DB, sessionId);

    if (!session) {
      return jsonResponse({ ok: false, error: "La sesión no existe." }, 404);
    }

    const registrations = await getRegistrations(context.env.DB, sessionId);

    return jsonResponse(
      buildSessionResponse(session, registrations)
    );
  } catch (error) {
    console.error("Error consultando registros:", error);

    return jsonResponse(
      { ok: false, error: "No fue posible consultar los registros." },
      500
    );
  }
}

async function handlePost(context) {
  try {
    const requestBody = await readJsonBody(context.request);
    const sessionId = toPositiveInteger(requestBody.sessionId);
    const characterId = toPositiveInteger(requestBody.characterId);

    if (!sessionId || !characterId) {
      return jsonResponse(
        { ok: false, error: "Sesión o personaje inválido." },
        400
      );
    }

    const [session, character] = await Promise.all([
      getSession(context.env.DB, sessionId),
      getCharacter(context.env.DB, characterId)
    ]);

    if (!session) {
      return jsonResponse(
        { ok: false, error: "La sesión no existe." },
        404
      );
    }

    if (!character) {
      return jsonResponse(
        { ok: false, error: "El personaje no existe." },
        404
      );
    }

    if (String(character.status || "").toLowerCase() !== "activo") {
      return jsonResponse(
        {
          ok: false,
          error: `${character.name} no está marcado como personaje activo.`
        },
        409
      );
    }

    const state = getSessionState(session);

    if (state === "completed" || state === "closed") {
      return jsonResponse(
        {
          ok: false,
          error: "El registro para esta sesión está cerrado."
        },
        409
      );
    }

    const existing = await context.env.DB
      .prepare(`
        SELECT id
        FROM registrations
        WHERE session_id = ? AND character_id = ?
        LIMIT 1
      `)
      .bind(sessionId, characterId)
      .first();

    if (existing) {
      return jsonResponse(
        {
          ok: false,
          error: `${character.name} ya está registrado en esta sesión.`
        },
        409
      );
    }

    const slots = normalizeSlots(session.slots);
    const current = await countRegistrations(context.env.DB, sessionId);

    if (current >= slots) {
      return jsonResponse(
        {
          ok: false,
          error: "La sesión ya no tiene lugares disponibles.",
          full: true
        },
        409
      );
    }

    try {
      await context.env.DB
        .prepare(`
          INSERT INTO registrations (session_id, character_id)
          VALUES (?, ?)
        `)
        .bind(sessionId, characterId)
        .run();
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        return jsonResponse(
          {
            ok: false,
            error: `${character.name} ya está registrado en esta sesión.`
          },
          409
        );
      }

      throw error;
    }

    const registrations = await getRegistrations(
      context.env.DB,
      sessionId
    );

    // Protección adicional si dos registros entran casi al mismo tiempo.
    if (registrations.length > slots) {
      await context.env.DB
        .prepare(`
          DELETE FROM registrations
          WHERE session_id = ? AND character_id = ?
        `)
        .bind(sessionId, characterId)
        .run();

      return jsonResponse(
        {
          ok: false,
          error: "El último lugar fue ocupado por otro aventurero.",
          full: true
        },
        409
      );
    }

    return jsonResponse(
      {
        ...buildSessionResponse(session, registrations),
        message: `${character.name} quedó registrado correctamente.`
      },
      201
    );
  } catch (error) {
    console.error("Error creando registro:", error);

    return jsonResponse(
      { ok: false, error: "No fue posible registrar al personaje." },
      500
    );
  }
}

async function handleDelete(context) {
  try {
    const requestBody = await readJsonBody(context.request);
    const sessionId = toPositiveInteger(requestBody.sessionId);
    const characterId = toPositiveInteger(requestBody.characterId);

    if (!sessionId || !characterId) {
      return jsonResponse(
        { ok: false, error: "Sesión o personaje inválido." },
        400
      );
    }

    const [session, character] = await Promise.all([
      getSession(context.env.DB, sessionId),
      getCharacter(context.env.DB, characterId)
    ]);

    if (!session) {
      return jsonResponse(
        { ok: false, error: "La sesión no existe." },
        404
      );
    }

    if (!character) {
      return jsonResponse(
        { ok: false, error: "El personaje no existe." },
        404
      );
    }

    const existing = await context.env.DB
      .prepare(`
        SELECT id
        FROM registrations
        WHERE session_id = ? AND character_id = ?
        LIMIT 1
      `)
      .bind(sessionId, characterId)
      .first();

    if (!existing) {
      return jsonResponse(
        {
          ok: false,
          error: `${character.name} no está registrado en esta sesión.`
        },
        404
      );
    }

    await context.env.DB
      .prepare(`
        DELETE FROM registrations
        WHERE session_id = ? AND character_id = ?
      `)
      .bind(sessionId, characterId)
      .run();

    const registrations = await getRegistrations(
      context.env.DB,
      sessionId
    );

    return jsonResponse({
      ...buildSessionResponse(session, registrations),
      message: `Se canceló el registro de ${character.name}.`
    });
  } catch (error) {
    console.error("Error cancelando registro:", error);

    return jsonResponse(
      { ok: false, error: "No fue posible cancelar el registro." },
      500
    );
  }
}

async function getSession(db, sessionId) {
  return db
    .prepare(`
      SELECT
        id,
        title,
        status,
        slots,
        session_date,
        session_time,
        level
      FROM sessions
      WHERE id = ?
      LIMIT 1
    `)
    .bind(sessionId)
    .first();
}

async function getCharacter(db, characterId) {
  return db
    .prepare(`
      SELECT
        id,
        name,
        player,
        status
      FROM characters
      WHERE id = ?
      LIMIT 1
    `)
    .bind(characterId)
    .first();
}

async function getRegistrations(db, sessionId) {
  const result = await db
    .prepare(`
      SELECT
        r.id AS registration_id,
        r.session_id,
        r.character_id,
        r.created_at,
        c.name,
        c.player
      FROM registrations r
      INNER JOIN characters c
        ON c.id = r.character_id
      WHERE r.session_id = ?
      ORDER BY r.created_at ASC, r.id ASC
    `)
    .bind(sessionId)
    .all();

  return result.results || [];
}

async function countRegistrations(db, sessionId) {
  const row = await db
    .prepare(`
      SELECT COUNT(*) AS total
      FROM registrations
      WHERE session_id = ?
    `)
    .bind(sessionId)
    .first();

  return Number(row?.total || 0);
}

function buildSessionResponse(session, registrations) {
  const slots = normalizeSlots(session.slots);

  const registeredCharacters = registrations.map(registration => ({
    registrationId: Number(registration.registration_id),
    characterId: Number(registration.character_id),
    name: registration.name || `Personaje #${registration.character_id}`,
    player: registration.player || "",
    createdAt: registration.created_at
  }));

  const registered = registeredCharacters.length;

  return {
    ok: true,
    sessionId: Number(session.id),
    title: session.title || "Sesión",
    status: session.status || "open",
    slots,
    registered,
    available: Math.max(0, slots - registered),
    full: registered >= slots,
    overbooked: registered > slots,
    registrations: registeredCharacters
  };
}

function getSessionState(session) {
  const status = String(session.status || "open").toLowerCase();

  if (status === "completed" || status === "closed") {
    return status;
  }

  return "open";
}

function getSessionIdFromUrl(url) {
  return toPositiveInteger(
    new URL(url).searchParams.get("session")
  );
}

function normalizeSlots(value) {
  const slots = Number(value);

  return Number.isInteger(slots) && slots > 0
    ? slots
    : 1;
}

function toPositiveInteger(value) {
  const number = Number(value);

  return Number.isInteger(number) && number > 0
    ? number
    : null;
}

async function readJsonBody(request) {
  try {
    return await request.json();
  } catch {
    return {};
  }
}

function isUniqueConstraintError(error) {
  const message = String(error?.message || error).toLowerCase();

  return (
    message.includes("unique") ||
    message.includes("constraint") &&
    message.includes("registrations")
  );
}

function jsonResponse(data, status = 200) {
  return new Response(
    JSON.stringify(data),
    {
      status,
      headers: JSON_HEADERS
    }
  );
}
