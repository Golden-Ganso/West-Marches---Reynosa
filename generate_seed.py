import json
from pathlib import Path

DATA = Path('data')
OUT = Path('migrations/02_seed.sql')


def load(name, default):
    path = DATA / name
    return json.loads(path.read_text(encoding='utf-8')) if path.exists() else default


def q(value):
    if value is None:
        return 'NULL'
    if isinstance(value, bool):
        return '1' if value else '0'
    if isinstance(value, (int, float)):
        return str(value)
    return "'" + str(value).replace("'", "''") + "'"


def insert(table, columns, values, mode='OR REPLACE'):
    cols = ','.join(columns)
    vals = ','.join(q(v) for v in values)
    return f'INSERT {mode} INTO {table}({cols}) VALUES({vals});'


characters = load('characters.json', [])
sessions = load('sessions.json', [])
chronicles = load('chronicles.json', [])
creatures = load('bestiary.json', [])
factions = load('factions.json', [])
locations = load('locations.json', [])
lore = load('lore.json', [])
rumors = load('rumors.json', [])
news = load('news.json', [])
world = load('world.json', {})

# Correcciones conocidas antes de generar el seed.
for session in sessions:
    if session.get('date') == '2026-17-03':
        session['date'] = '2026-03-17'

lines = [
    '-- Seed generado automáticamente desde data/*.json.',
    '-- Las tablas principales se insertan primero; las relaciones se insertan después.',
    '-- No usar BEGIN/COMMIT aquí: D1 administra las escrituras de forma independiente.',
    ''
]

# -----------------------------------------------------------------------------
# FASE 1: TABLAS PRINCIPALES
# -----------------------------------------------------------------------------

lines.append('-- === CHARACTERS ===')
for c in characters:
    lines.append(insert(
        'characters',
        ['id','name','pronunciation','race','class_name','level','status','player','image','bio','background'],
        [c.get('id'), c.get('name'), c.get('pronunciation'), c.get('race'), c.get('class'),
         c.get('level', 1), c.get('status'), c.get('player'), c.get('image'), c.get('bio'), c.get('background')]
    ))

lines.append('\n-- === SESSIONS ===')
for s in sessions:
    lines.append(insert(
        'sessions',
        ['id','title','session_date','session_time','status','slots','level','description','objective','result','result_summary','notes'],
        [s.get('id'), s.get('title'), s.get('date'), s.get('time'), s.get('status'), s.get('slots'),
         s.get('level'), s.get('description'), s.get('objective'), s.get('result'), s.get('resultSummary'), s.get('notes')]
    ))

lines.append('\n-- === CHRONICLES ===')
for x in chronicles:
    lines.append(insert(
        'chronicles',
        ['id','session_id','title','chronicle_date','author','image','summary'],
        [x.get('id'), x.get('session'), x.get('title'), x.get('date'), x.get('author'), x.get('image'), x.get('summary')]
    ))

lines.append('\n-- === CREATURES ===')
for x in creatures:
    lines.append(insert(
        'creatures',
        ['id','name','type','status','first_seen','danger','image','description','notes'],
        [x.get('id'), x.get('name'), x.get('type'), x.get('status'), x.get('firstSeen'), x.get('danger'),
         x.get('image'), x.get('description'), x.get('notes')]
    ))

lines.append('\n-- === FACTIONS ===')
for x in factions:
    lines.append(insert(
        'factions',
        ['id','name','status','relationship','image','description','first_contact','notes'],
        [x.get('id'), x.get('name'), x.get('status'), x.get('relationship'), x.get('image'),
         x.get('description'), x.get('firstContact'), x.get('notes')]
    ))

lines.append('\n-- === LOCATIONS ===')
for x in locations:
    lines.append(insert(
        'locations',
        ['id','name','type','status','danger','discovered_in','image','map_x','map_y','explored',
         'reveal_radius','corridor_width','description','notes'],
        [x.get('id'), x.get('name'), x.get('type'), x.get('status'), x.get('danger'), x.get('discoveredIn'),
         x.get('image'), x.get('mapX'), x.get('mapY'), x.get('explored', True), x.get('revealRadius'),
         x.get('corridorWidth'), x.get('description'), x.get('notes')]
    ))

lines.append('\n-- === LORE ===')
for x in lore:
    lines.append(insert(
        'lore',
        ['id','title','type','category','author','status','knowledge','image','found_in_session','found_at_location','summary','content'],
        [x.get('id'), x.get('title'), x.get('type'), x.get('category'), x.get('author'), x.get('status'),
         x.get('knowledge'), x.get('image'), x.get('foundInSession'), x.get('foundAtLocation'),
         x.get('summary'), x.get('content')]
    ))

lines.append('\n-- === RUMORS ===')
for x in rumors:
    lines.append(insert('rumors', ['id','title','text','status'], [x.get('id'), x.get('title'), x.get('text'), x.get('status')]))

lines.append('\n-- === NEWS ===')
# Corrige IDs duplicados conservando el orden visual actual de las noticias.
for new_id, x in enumerate(news, 1):
    lines.append(insert(
        'news', ['id','type','news_date','title','text','link'],
        [new_id, x.get('type'), x.get('date'), x.get('title'), x.get('text'), x.get('link')]
    ))

lines.append('\n-- === WORLD ===')
lines.append(insert(
    'world_state',
    ['id','exploration','discovered_locations','completed_expeditions','artifacts_found'],
    [1, world.get('exploration', 0), world.get('discoveredLocations', 0),
     world.get('completedExpeditions', 0), world.get('artifactsFound', 0)]
))

# -----------------------------------------------------------------------------
# FASE 2: RELACIONES Y TABLAS DEPENDIENTES
# -----------------------------------------------------------------------------

lines.append('\n-- === CHARACTER HISTORY / ACHIEVEMENTS ===')
for c in characters:
    for h in c.get('history', []):
        lines.append(insert(
            'character_history', ['character_id','session_id','event_date','title','note'],
            [c['id'], h.get('session'), h.get('date'), h.get('title'), h.get('note')], mode=''
        ))
    for a in c.get('achievements', []):
        lines.append(insert(
            'character_achievements', ['character_id','name','description','achievement_date'],
            [c['id'], a.get('name'), a.get('description'), a.get('date')], mode=''
        ))

lines.append('\n-- === SESSION RELATIONS ===')
for s in sessions:
    sid = s['id']
    for player in s.get('players', []):
        lines.append(insert('session_players', ['session_id','display_name'], [sid, player], mode=''))
    for cid in s.get('characterIds', []):
        lines.append(insert('session_characters', ['session_id','character_id'], [sid, cid], mode='OR IGNORE'))
    for discovery in s.get('discoveries', []):
        lines.append(insert('session_discoveries', ['session_id','discovery'], [sid, discovery], mode=''))
    for creature_id in s.get('creatureIds', []):
        lines.append(insert('session_creatures', ['session_id','creature_id'], [sid, creature_id], mode='OR IGNORE'))
    for faction_id in s.get('factionIds', []):
        lines.append(insert('session_factions', ['session_id','faction_id'], [sid, faction_id], mode='OR IGNORE'))
    for location_id in s.get('locationIds', []):
        lines.append(insert('session_locations', ['session_id','location_id'], [sid, location_id], mode='OR IGNORE'))

lines.append('\n-- === CHRONICLE RELATIONS ===')
for x in chronicles:
    for cid in x.get('characterIds', []):
        lines.append(insert('chronicle_characters', ['chronicle_id','character_id'], [x['id'], cid], mode='OR IGNORE'))
    for participant in x.get('participants', []):
        lines.append(insert('chronicle_participants', ['chronicle_id','display_name'], [x['id'], participant], mode=''))

lines.append('\n-- === CREATURE RELATIONS ===')
for x in creatures:
    for cid in x.get('characterIds', []):
        lines.append(insert('creature_characters', ['creature_id','character_id'], [x['id'], cid], mode='OR IGNORE'))
    for location_name in x.get('locations', []):
        lines.append(insert('creature_locations_text', ['creature_id','location_name'], [x['id'], location_name], mode=''))

lines.append('\n-- === FACTION RELATIONS ===')
for x in factions:
    for cid in x.get('characterIds', []):
        lines.append(insert('faction_characters', ['faction_id','character_id'], [x['id'], cid], mode='OR IGNORE'))

lines.append('\n-- === LOCATION RELATIONS ===')
for x in locations:
    lid = x['id']
    for connected_id in x.get('connectedTo', []):
        lines.append(insert('location_connections', ['location_id','connected_location_id'], [lid, connected_id], mode='OR IGNORE'))
    for discovery in x.get('discoveries', []):
        lines.append(insert('location_discoveries', ['location_id','discovery'], [lid, discovery], mode=''))
    for cid in x.get('characterIds', []):
        lines.append(insert('location_characters', ['location_id','character_id'], [lid, cid], mode='OR IGNORE'))
    for creature_id in x.get('creatureIds', []):
        lines.append(insert('location_creatures', ['location_id','creature_id'], [lid, creature_id], mode='OR IGNORE'))
    for faction_id in x.get('factionIds', []):
        lines.append(insert('location_factions', ['location_id','faction_id'], [lid, faction_id], mode='OR IGNORE'))

lines.append('\n-- === LORE RELATIONS ===')
for x in lore:
    lid = x['id']
    for cid in x.get('characterIds', []):
        lines.append(insert('lore_characters', ['lore_id','character_id'], [lid, cid], mode='OR IGNORE'))
    for faction_id in x.get('factionIds', []):
        lines.append(insert('lore_factions', ['lore_id','faction_id'], [lid, faction_id], mode='OR IGNORE'))
    for tag in x.get('tags', []):
        lines.append(insert('lore_tags', ['lore_id','tag'], [lid, tag], mode=''))

lines.append('\n-- === WORLD DISCOVERIES ===')
for order, discovery in enumerate(world.get('latestDiscoveries', [])):
    lines.append(insert('world_discoveries', ['discovery','sort_order'], [discovery, order], mode=''))

OUT.parent.mkdir(exist_ok=True)
OUT.write_text('\n'.join(lines) + '\n', encoding='utf-8')

print(f'{OUT} creado')
print(f'Personajes: {len(characters)}')
print(f'Expediciones: {len(sessions)}')
print(f'Crónicas: {len(chronicles)}')
print(f'Criaturas: {len(creatures)}')
print(f'Facciones: {len(factions)}')
print(f'Ubicaciones: {len(locations)}')
print(f'Biblioteca: {len(lore)}')
print(f'Rumores: {len(rumors)}')
print(f'Noticias: {len(news)}')
