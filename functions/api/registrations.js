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
    if (!sessionId) return jsonResponse({ ok: false, error: "Sesión inválida." }, 400);

    const campaign = await loadCampaignData(context.request.url);
    const session = campaign.sessions.find(item => Number(item.id) === sessionId);
    if (!session) return jsonResponse({ ok: false, error: "La sesión no existe." }, 404);

    const registrations = await getRegistrations(context.env.DB, sessionId);
    return jsonResponse(buildSessionResponse(session, registrations, campaign.characters));
  } catch (error) {
    console.error("Error consultando registros:", error);
    return jsonResponse({ ok: false, error: "No fue posible consultar los registros." }, 500);
  }
}

async function handlePost(context) {
  try {
    const body = await readJsonBody(context.request);
    const sessionId = toPositiveInteger(body.sessionId);
    const characterId = toPositiveInteger(body.characterId);

    if (!sessionId || !characterId) {
      return jsonResponse({ ok: false, error: "Sesión o personaje inválido." }, 400);
    }

    const campaign = await loadCampaignData(context.request.url);
    const session = campaign.sessions.find(item => Number(item.id) === sessionId);
    const character = campaign.characters.find(item => Number(item.id) === characterId);

    if (!session) return jsonResponse({ ok: false, error: "La sesión no existe." }, 404);
    if (!character) return jsonResponse({ ok: false, error: "El personaje no existe." }, 404);

    const state = getSessionState(session);
    if (state === "completed" || state === "closed") {
      return jsonResponse({ ok: false, error: "El registro para esta sesión está cerrado." }, 409);
    }

    const existing = await context.env.DB.prepare(
      "SELECT id FROM registrations WHERE session_id = ? AND character_id = ? LIMIT 1"
    ).bind(sessionId, characterId).first();

    if (existing) {
      return jsonResponse({ ok: false, error: `${character.name} ya está registrado en esta sesión.` }, 409);
    }

    const slots = Math.max(1, Number(session.slots || 1));
    const current = await countRegistrations(context.env.DB, sessionId);

    if (current >= slots) {
      return jsonResponse({ ok: false, error: "La sesión ya no tiene lugares disponibles.", full: true }, 409);
    }

    try {
      await context.env.DB.prepare(
        "INSERT INTO registrations (session_id, character_id) VALUES (?, ?)"
      ).bind(sessionId, characterId).run();
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        return jsonResponse({ ok: false, error: `${character.name} ya está registrado en esta sesión.` }, 409);
      }
      throw error;
    }

    const registrations = await getRegistrations(context.env.DB, sessionId);

    // Segunda comprobación defensiva. Si hubiera una carrera extrema y se excedieran cupos,
    // se elimina únicamente el registro recién solicitado.
    if (registrations.length > slots) {
      await context.env.DB.prepare(
        "DELETE FROM registrations WHERE session_id = ? AND character_id = ?"
      ).bind(sessionId, characterId).run();
      return jsonResponse({ ok: false, error: "El último lugar fue ocupado por otro aventurero.", full: true }, 409);
    }

    return jsonResponse({
      ...buildSessionResponse(session, registrations, campaign.characters),
      message: `${character.name} quedó registrado correctamente.`
    }, 201);
  } catch (error) {
    console.error("Error creando registro:", error);
    return jsonResponse({ ok: false, error: "No fue posible registrar al personaje." }, 500);
  }
}

async function handleDelete(context) {
  try {
    const body = await readJsonBody(context.request);
    const sessionId = toPositiveInteger(body.sessionId);
    const characterId = toPositiveInteger(body.characterId);

    if (!sessionId || !characterId) {
      return jsonResponse({ ok: false, error: "Sesión o personaje inválido." }, 400);
    }

    const campaign = await loadCampaignData(context.request.url);
    const session = campaign.sessions.find(item => Number(item.id) === sessionId);
    const character = campaign.characters.find(item => Number(item.id) === characterId);

    if (!session) return jsonResponse({ ok: false, error: "La sesión no existe." }, 404);
    if (!character) return jsonResponse({ ok: false, error: "El personaje no existe." }, 404);

    const existing = await context.env.DB.prepare(
      "SELECT id FROM registrations WHERE session_id = ? AND character_id = ? LIMIT 1"
    ).bind(sessionId, characterId).first();

    if (!existing) {
      return jsonResponse({ ok: false, error: `${character.name} no está registrado en esta sesión.` }, 404);
    }

    await context.env.DB.prepare(
      "DELETE FROM registrations WHERE session_id = ? AND character_id = ?"
    ).bind(sessionId, characterId).run();

    const registrations = await getRegistrations(context.env.DB, sessionId);
    return jsonResponse({
      ...buildSessionResponse(session, registrations, campaign.characters),
      message: `Se canceló el registro de ${character.name}.`
    });
  } catch (error) {
    console.error("Error cancelando registro:", error);
    return jsonResponse({ ok: false, error: "No fue posible cancelar el registro." }, 500);
  }
}

async function loadCampaignData(requestUrl) {
  const origin = new URL(requestUrl).origin;
  const [sessionsResponse, charactersResponse] = await Promise.all([
    fetch(`${origin}/data/sessions.json`, { cf: { cacheTtl: 0 } }),
    fetch(`${origin}/data/characters.json`, { cf: { cacheTtl: 0 } })
  ]);

  if (!sessionsResponse.ok || !charactersResponse.ok) {
    throw new Error("No fue posible leer sessions.json o characters.json.");
  }

  return {
    sessions: await sessionsResponse.json(),
    characters: await charactersResponse.json()
  };
}

async function getRegistrations(db, sessionId) {
  const result = await db.prepare(`
    SELECT id, session_id, character_id, created_at
    FROM registrations
    WHERE session_id = ?
    ORDER BY created_at ASC, id ASC
  `).bind(sessionId).all();
  return result.results || [];
}

async function countRegistrations(db, sessionId) {
  const row = await db.prepare(
    "SELECT COUNT(*) AS total FROM registrations WHERE session_id = ?"
  ).bind(sessionId).first();
  return Number(row?.total || 0);
}

function buildSessionResponse(session, registrations, characters) {
  const slots = Math.max(1, Number(session.slots || 1));
  const characterMap = new Map(characters.map(character => [Number(character.id), character]));
  const registeredCharacters = registrations.map(registration => {
    const character = characterMap.get(Number(registration.character_id));
    return {
      registrationId: registration.id,
      characterId: Number(registration.character_id),
      name: character?.name || `Personaje #${registration.character_id}`,
      player: character?.player || "",
      createdAt: registration.created_at
    };
  });

  const registered = registrations.length;
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
  if (["completed", "closed"].includes(String(session.status || "").toLowerCase())) {
    return String(session.status).toLowerCase();
  }
  return "open";
}

function getSessionIdFromUrl(url) {
  return toPositiveInteger(new URL(url).searchParams.get("session"));
}

function toPositiveInteger(value) {
  const number = Number(value);
  return Number.isInteger(number) && number > 0 ? number : null;
}

async function readJsonBody(request) {
  try {
    return await request.json();
  } catch {
    return {};
  }
}

function isUniqueConstraintError(error) {
  return String(error?.message || error).toLowerCase().includes("unique");
}

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: JSON_HEADERS
  });
}
