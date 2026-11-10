export async function onRequestGet(context) {

  try {

    const url = new URL(context.request.url);

    const sessionId = Number(
      url.searchParams.get("session")
    );

    if (!Number.isInteger(sessionId) || sessionId <= 0) {

      return Response.json(
        {
          ok: false,
          error: "Sesión inválida."
        },
        {
          status: 400
        }
      );

    }


    const result = await context.env.DB
      .prepare(`
        SELECT
          id,
          session_id,
          character_id,
          created_at
        FROM registrations
        WHERE session_id = ?
        ORDER BY created_at ASC
      `)
      .bind(sessionId)
      .all();


    return Response.json({
      ok: true,
      sessionId: sessionId,
      registrations: result.results
    });


  } catch (error) {

    console.error(
      "Error consultando registros:",
      error
    );

    return Response.json(
      {
        ok: false,
        error: "No fue posible consultar los registros."
      },
      {
        status: 500
      }
    );

  }

}