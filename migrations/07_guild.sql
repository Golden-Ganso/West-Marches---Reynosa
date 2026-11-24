CREATE TABLE guild_rooms (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    floor TEXT NOT NULL,
    name TEXT NOT NULL,
    room_type TEXT NOT NULL,
    x INTEGER NOT NULL,
    y INTEGER NOT NULL,
    width INTEGER NOT NULL,
    height INTEGER NOT NULL,
    description TEXT
);

CREATE TABLE guild_objects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    floor TEXT NOT NULL,

    room_id INTEGER,

    object_type TEXT NOT NULL,

    name TEXT NOT NULL,

    owner_name TEXT,

    description TEXT,

    grid_x INTEGER NOT NULL,

    grid_y INTEGER NOT NULL,

    width INTEGER DEFAULT 1,

    height INTEGER DEFAULT 1,

    rotation INTEGER DEFAULT 0,

    is_container INTEGER DEFAULT 0
);

CREATE TABLE guild_container_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    object_id INTEGER NOT NULL,

    item_name TEXT NOT NULL,

    quantity INTEGER DEFAULT 1,

    notes TEXT
);