PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS characters (
 id INTEGER PRIMARY KEY, name TEXT NOT NULL, pronunciation TEXT, race TEXT, class_name TEXT, level INTEGER NOT NULL DEFAULT 1,
 status TEXT NOT NULL DEFAULT 'Activo', player TEXT, image TEXT, bio TEXT, background TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP,
 updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS character_history (id INTEGER PRIMARY KEY AUTOINCREMENT, character_id INTEGER NOT NULL REFERENCES characters(id) ON DELETE CASCADE, session_id INTEGER, event_date TEXT, title TEXT, note TEXT);
CREATE TABLE IF NOT EXISTS character_achievements (id INTEGER PRIMARY KEY AUTOINCREMENT, character_id INTEGER NOT NULL REFERENCES characters(id) ON DELETE CASCADE, name TEXT NOT NULL, description TEXT, achievement_date TEXT);

CREATE TABLE IF NOT EXISTS sessions (
 id INTEGER PRIMARY KEY, title TEXT NOT NULL, session_date TEXT, session_time TEXT, status TEXT NOT NULL DEFAULT 'open', slots INTEGER NOT NULL DEFAULT 6,
 level TEXT, description TEXT, objective TEXT, result TEXT, result_summary TEXT, notes TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP, updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS registrations (id INTEGER PRIMARY KEY AUTOINCREMENT, session_id INTEGER NOT NULL REFERENCES sessions(id) ON DELETE CASCADE, character_id INTEGER NOT NULL REFERENCES characters(id) ON DELETE CASCADE, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, UNIQUE(session_id, character_id));
CREATE INDEX IF NOT EXISTS idx_registrations_session ON registrations(session_id);
CREATE TABLE IF NOT EXISTS session_characters (session_id INTEGER NOT NULL REFERENCES sessions(id) ON DELETE CASCADE, character_id INTEGER NOT NULL REFERENCES characters(id) ON DELETE CASCADE, PRIMARY KEY(session_id, character_id));
CREATE TABLE IF NOT EXISTS session_players (id INTEGER PRIMARY KEY AUTOINCREMENT, session_id INTEGER NOT NULL REFERENCES sessions(id) ON DELETE CASCADE, display_name TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS session_discoveries (id INTEGER PRIMARY KEY AUTOINCREMENT, session_id INTEGER NOT NULL REFERENCES sessions(id) ON DELETE CASCADE, discovery TEXT NOT NULL);

CREATE TABLE IF NOT EXISTS chronicles (id INTEGER PRIMARY KEY, session_id INTEGER REFERENCES sessions(id), title TEXT NOT NULL, chronicle_date TEXT, author TEXT, image TEXT, summary TEXT);
CREATE TABLE IF NOT EXISTS chronicle_characters (chronicle_id INTEGER NOT NULL REFERENCES chronicles(id) ON DELETE CASCADE, character_id INTEGER NOT NULL REFERENCES characters(id) ON DELETE CASCADE, PRIMARY KEY(chronicle_id, character_id));
CREATE TABLE IF NOT EXISTS chronicle_participants (id INTEGER PRIMARY KEY AUTOINCREMENT, chronicle_id INTEGER NOT NULL REFERENCES chronicles(id) ON DELETE CASCADE, display_name TEXT NOT NULL);

CREATE TABLE IF NOT EXISTS creatures (id INTEGER PRIMARY KEY, name TEXT NOT NULL, type TEXT, status TEXT, first_seen INTEGER REFERENCES sessions(id), danger INTEGER, image TEXT, description TEXT, notes TEXT);
CREATE TABLE IF NOT EXISTS creature_characters (creature_id INTEGER NOT NULL REFERENCES creatures(id) ON DELETE CASCADE, character_id INTEGER NOT NULL REFERENCES characters(id) ON DELETE CASCADE, PRIMARY KEY(creature_id, character_id));
CREATE TABLE IF NOT EXISTS creature_locations_text (id INTEGER PRIMARY KEY AUTOINCREMENT, creature_id INTEGER NOT NULL REFERENCES creatures(id) ON DELETE CASCADE, location_name TEXT NOT NULL);

CREATE TABLE IF NOT EXISTS factions (id INTEGER PRIMARY KEY, name TEXT NOT NULL, status TEXT, relationship TEXT, image TEXT, description TEXT, first_contact INTEGER REFERENCES sessions(id), notes TEXT);
CREATE TABLE IF NOT EXISTS faction_characters (faction_id INTEGER NOT NULL REFERENCES factions(id) ON DELETE CASCADE, character_id INTEGER NOT NULL REFERENCES characters(id) ON DELETE CASCADE, PRIMARY KEY(faction_id, character_id));

CREATE TABLE IF NOT EXISTS locations (
 id INTEGER PRIMARY KEY, name TEXT NOT NULL, type TEXT, status TEXT, danger INTEGER, discovered_in INTEGER REFERENCES sessions(id), image TEXT,
 map_x REAL, map_y REAL, explored INTEGER NOT NULL DEFAULT 1, reveal_radius REAL, corridor_width REAL, description TEXT, notes TEXT
);
CREATE TABLE IF NOT EXISTS location_connections (location_id INTEGER NOT NULL REFERENCES locations(id) ON DELETE CASCADE, connected_location_id INTEGER NOT NULL REFERENCES locations(id) ON DELETE CASCADE, PRIMARY KEY(location_id, connected_location_id));
CREATE TABLE IF NOT EXISTS location_discoveries (id INTEGER PRIMARY KEY AUTOINCREMENT, location_id INTEGER NOT NULL REFERENCES locations(id) ON DELETE CASCADE, discovery TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS location_characters (location_id INTEGER NOT NULL REFERENCES locations(id) ON DELETE CASCADE, character_id INTEGER NOT NULL REFERENCES characters(id) ON DELETE CASCADE, PRIMARY KEY(location_id, character_id));
CREATE TABLE IF NOT EXISTS location_creatures (location_id INTEGER NOT NULL REFERENCES locations(id) ON DELETE CASCADE, creature_id INTEGER NOT NULL REFERENCES creatures(id) ON DELETE CASCADE, PRIMARY KEY(location_id, creature_id));
CREATE TABLE IF NOT EXISTS location_factions (location_id INTEGER NOT NULL REFERENCES locations(id) ON DELETE CASCADE, faction_id INTEGER NOT NULL REFERENCES factions(id) ON DELETE CASCADE, PRIMARY KEY(location_id, faction_id));

CREATE TABLE IF NOT EXISTS lore (id INTEGER PRIMARY KEY, title TEXT NOT NULL, type TEXT, category TEXT, author TEXT, status TEXT, knowledge TEXT, image TEXT, found_in_session INTEGER REFERENCES sessions(id), found_at_location INTEGER REFERENCES locations(id), summary TEXT, content TEXT);
CREATE TABLE IF NOT EXISTS lore_characters (lore_id INTEGER NOT NULL REFERENCES lore(id) ON DELETE CASCADE, character_id INTEGER NOT NULL REFERENCES characters(id) ON DELETE CASCADE, PRIMARY KEY(lore_id, character_id));
CREATE TABLE IF NOT EXISTS lore_factions (lore_id INTEGER NOT NULL REFERENCES lore(id) ON DELETE CASCADE, faction_id INTEGER NOT NULL REFERENCES factions(id) ON DELETE CASCADE, PRIMARY KEY(lore_id, faction_id));
CREATE TABLE IF NOT EXISTS lore_tags (id INTEGER PRIMARY KEY AUTOINCREMENT, lore_id INTEGER NOT NULL REFERENCES lore(id) ON DELETE CASCADE, tag TEXT NOT NULL);

CREATE TABLE IF NOT EXISTS session_creatures (session_id INTEGER NOT NULL REFERENCES sessions(id) ON DELETE CASCADE, creature_id INTEGER NOT NULL REFERENCES creatures(id) ON DELETE CASCADE, PRIMARY KEY(session_id, creature_id));
CREATE TABLE IF NOT EXISTS session_factions (session_id INTEGER NOT NULL REFERENCES sessions(id) ON DELETE CASCADE, faction_id INTEGER NOT NULL REFERENCES factions(id) ON DELETE CASCADE, PRIMARY KEY(session_id, faction_id));
CREATE TABLE IF NOT EXISTS session_locations (session_id INTEGER NOT NULL REFERENCES sessions(id) ON DELETE CASCADE, location_id INTEGER NOT NULL REFERENCES locations(id) ON DELETE CASCADE, PRIMARY KEY(session_id, location_id));

CREATE TABLE IF NOT EXISTS rumors (id INTEGER PRIMARY KEY, title TEXT NOT NULL, text TEXT, status TEXT);
CREATE TABLE IF NOT EXISTS news (id INTEGER PRIMARY KEY, type TEXT, news_date TEXT, title TEXT NOT NULL, text TEXT, link TEXT);
CREATE TABLE IF NOT EXISTS world_state (id INTEGER PRIMARY KEY CHECK(id=1), exploration INTEGER DEFAULT 0, discovered_locations INTEGER DEFAULT 0, completed_expeditions INTEGER DEFAULT 0, artifacts_found INTEGER DEFAULT 0);
CREATE TABLE IF NOT EXISTS world_discoveries (id INTEGER PRIMARY KEY AUTOINCREMENT, discovery TEXT NOT NULL, sort_order INTEGER DEFAULT 0);
