import {
    json,
    body
}
from "../_shared";

export async function onRequestPost(context){

    const db = context.env.DB;

    const data =
        await body(
            context.request
        );

    const result =
        await db.prepare(`
            INSERT INTO guild_objects
            (
                floor,
                object_type,
                name,
                owner_name,
                description,
                grid_x,
                grid_y
            )
            VALUES
            (?,?,?,?,?,?,?)
        `)
        .bind(
            data.floor ?? "ground",
            data.object_type,
            data.name,
            data.owner_name ?? null,
            data.description ?? "",
            data.grid_x,
            data.grid_y
        )
        .run();

    return json({

        ok:true,

        id:result.meta.last_row_id

    });

}