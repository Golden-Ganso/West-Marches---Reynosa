PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS settlements (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT,
    status TEXT NOT NULL DEFAULT 'Activo',

    population INTEGER NOT NULL DEFAULT 0,
    military_population INTEGER NOT NULL DEFAULT 0,

    faction_id INTEGER,
    location_id INTEGER,

    governor_name TEXT,
    founded TEXT,

    description TEXT,
    image TEXT,

    visibility TEXT NOT NULL DEFAULT 'public',

    FOREIGN KEY (faction_id)
        REFERENCES factions(id),

    FOREIGN KEY (location_id)
        REFERENCES locations(id)
);


CREATE TABLE IF NOT EXISTS npcs (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,

    title TEXT,
    race TEXT,
    occupation TEXT,
    status TEXT NOT NULL DEFAULT 'Activo',

    settlement_id INTEGER,
    faction_id INTEGER,

    description TEXT,
    notes TEXT,
    image TEXT,

    first_seen INTEGER,

    visibility TEXT NOT NULL DEFAULT 'public',

    FOREIGN KEY (settlement_id)
        REFERENCES settlements(id),

    FOREIGN KEY (faction_id)
        REFERENCES factions(id),

    FOREIGN KEY (first_seen)
        REFERENCES sessions(id)
);


CREATE TABLE IF NOT EXISTS buildings (
    id INTEGER PRIMARY KEY,
    settlement_id INTEGER NOT NULL,

    name TEXT NOT NULL,
    type TEXT,

    status TEXT NOT NULL DEFAULT 'Abierto',

    owner_npc_id INTEGER,

    description TEXT,
    image TEXT,

    visibility TEXT NOT NULL DEFAULT 'public',

    FOREIGN KEY (settlement_id)
        REFERENCES settlements(id)
        ON DELETE CASCADE,

    FOREIGN KEY (owner_npc_id)
        REFERENCES npcs(id)
);


CREATE TABLE IF NOT EXISTS services (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    building_id INTEGER NOT NULL,

    name TEXT NOT NULL,
    description TEXT,

    price REAL,
    currency TEXT DEFAULT 'po',

    status TEXT NOT NULL DEFAULT 'Disponible',

    FOREIGN KEY (building_id)
        REFERENCES buildings(id)
        ON DELETE CASCADE
);


CREATE TABLE IF NOT EXISTS shop_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    building_id INTEGER NOT NULL,

    name TEXT NOT NULL,
    category TEXT,

    description TEXT,

    price REAL,
    currency TEXT DEFAULT 'po',

    quantity INTEGER,

    status TEXT NOT NULL DEFAULT 'Disponible',

    FOREIGN KEY (building_id)
        REFERENCES buildings(id)
        ON DELETE CASCADE
);


CREATE TABLE IF NOT EXISTS incoming_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    building_id INTEGER NOT NULL,

    name TEXT NOT NULL,

    expected_date TEXT,
    source TEXT,

    status TEXT NOT NULL DEFAULT 'Próximamente',

    notes TEXT,

    FOREIGN KEY (building_id)
        REFERENCES buildings(id)
        ON DELETE CASCADE
);


CREATE TABLE IF NOT EXISTS projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    settlement_id INTEGER NOT NULL,

    name TEXT NOT NULL,

    status TEXT NOT NULL DEFAULT 'Propuesto',

    progress INTEGER NOT NULL DEFAULT 0,

    description TEXT,

    started_session INTEGER,
    completed_session INTEGER,

    visibility TEXT NOT NULL DEFAULT 'public',

    FOREIGN KEY (settlement_id)
        REFERENCES settlements(id)
        ON DELETE CASCADE,

    FOREIGN KEY (started_session)
        REFERENCES sessions(id),

    FOREIGN KEY (completed_session)
        REFERENCES sessions(id)
);


CREATE TABLE IF NOT EXISTS project_resources (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    project_id INTEGER NOT NULL,

    resource TEXT NOT NULL,

    required REAL NOT NULL DEFAULT 0,
    current REAL NOT NULL DEFAULT 0,

    unit TEXT,

    FOREIGN KEY (project_id)
        REFERENCES projects(id)
        ON DELETE CASCADE
);


CREATE TABLE IF NOT EXISTS npc_sessions (
    npc_id INTEGER NOT NULL,
    session_id INTEGER NOT NULL,

    PRIMARY KEY (
        npc_id,
        session_id
    ),

    FOREIGN KEY (npc_id)
        REFERENCES npcs(id)
        ON DELETE CASCADE,

    FOREIGN KEY (session_id)
        REFERENCES sessions(id)
        ON DELETE CASCADE
);


CREATE TABLE IF NOT EXISTS npc_buildings (
    npc_id INTEGER NOT NULL,
    building_id INTEGER NOT NULL,

    relationship TEXT,

    PRIMARY KEY (
        npc_id,
        building_id
    ),

    FOREIGN KEY (npc_id)
        REFERENCES npcs(id)
        ON DELETE CASCADE,

    FOREIGN KEY (building_id)
        REFERENCES buildings(id)
        ON DELETE CASCADE
);