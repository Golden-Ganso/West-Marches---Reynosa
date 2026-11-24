import { json } from "../_shared";

export async function onRequestGet(context){

    const db = context.env.DB;

    const rooms =
        await db
        .prepare(
            "SELECT * FROM guild_rooms"
        )
        .all();

    const objects =
        await db
        .prepare(
            "SELECT * FROM guild_objects"
        )
        .all();

    return json({

        rooms: rooms.results,

        objects: objects.results

    });

}