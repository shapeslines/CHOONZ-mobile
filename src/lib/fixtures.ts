import type {
  CatalogMeta,
  ChoonzUser,
  EngineMeta,
  Fighter,
  FighterKit,
  Gel,
  Health,
  Loadout,
  MySkins,
  SkinCatalog,
  Stage,
  Toon,
} from '@/lib/types';

export const fixtureHealth: Health = {
  status: 'ok',
  env: 'fixtures',
  version: '0.1.0-fixture',
  engine_loop: 128,
};

export const fixtureUser: ChoonzUser = {
  id: 0,
  email: 'fixture@choonz.local',
  display_name: 'Fixture Fighter',
  created_at: '2026-08-09T00:00:00Z',
};

export const fixtureGels: Gel[] = [
  { id: 'acid', hot: '#63A014', mid: '#1E3A0E', deep: '#050E06' },
  { id: 'blue', hot: '#3D4BE0', mid: '#2530A8', deep: '#0A0E2E' },
  { id: 'red', hot: '#B81410', mid: '#48090B', deep: '#12040A' },
  { id: 'sodium', hot: '#E08818', mid: '#6E4408', deep: '#140C02' },
  { id: 'uv', hot: '#6C35C8', mid: '#3A1C6E', deep: '#160C2A' },
];

export const fixtureFighters: Fighter[] = [
  {
    id: 'AXEL',
    display_name: 'AXEL',
    title: 'Neon Striker',
    default_side: 'p1',
    faces: 'right',
    notes: 'Player default; wears picked gel as mid/deep + cream rim.',
    hp_mod: 0,
    meter_mod: 0,
  },
  {
    id: 'VEX',
    display_name: 'VEX',
    title: 'Crimson Fury',
    default_side: 'p2',
    faces: 'left',
    notes: 'Rival default; ink body with gel-hot rim under one-gel scene law.',
    hp_mod: 0,
    meter_mod: 0,
  },
  {
    id: 'NYX',
    display_name: 'NYX',
    title: 'UV Ghost',
    default_side: 'p1',
    faces: 'right',
    notes: 'Fast tech; lower open HP, higher meter bank.',
    hp_mod: -0.04,
    meter_mod: 0.08,
  },
  {
    id: 'REX',
    display_name: 'REX',
    title: 'Brick Battery',
    default_side: 'p2',
    faces: 'left',
    notes: 'Heavy pressure; higher open HP, slower meter.',
    hp_mod: 0.06,
    meter_mod: -0.05,
  },
  {
    id: 'KAI',
    display_name: 'KAI',
    title: 'Acid Dancer',
    default_side: 'p1',
    faces: 'right',
    notes: 'Mid-range foil; balanced mods, acid-lane default.',
    hp_mod: 0.02,
    meter_mod: 0.03,
  },
];

export const fixtureStages: Stage[] = [
  {
    id: 'rooftop',
    display_name: 'Rooftop over the strip',
    default_gel: 'sodium',
    deck_y: 152,
    width: 320,
    height: 180,
    scene_id: 'ah-fight-rooftop',
    status: 'built',
  },
  {
    id: 'neon_alley',
    display_name: 'Neon alley cut-through',
    default_gel: 'uv',
    deck_y: 148,
    width: 320,
    height: 180,
    scene_id: 'ah-fight-neon-alley',
    status: 'built',
  },
  {
    id: 'club_floor',
    display_name: 'Club floor under sodium',
    default_gel: 'acid',
    deck_y: 156,
    width: 320,
    height: 180,
    scene_id: 'ah-fight-club-floor',
    status: 'built',
  },
  {
    id: 'warehouse',
    display_name: 'Warehouse loading bay',
    default_gel: 'blue',
    deck_y: 150,
    width: 320,
    height: 180,
    scene_id: 'ah-fight-warehouse',
    status: 'built',
  },
];

export const fixtureCatalog: CatalogMeta = {
  toon_attribute_fighter_key: 'fighter_id',
  loop: 128,
  gels_count: fixtureGels.length,
  fighters_count: fixtureFighters.length,
  stages_count: fixtureStages.length,
};

export const fixtureEngine: EngineMeta = {
  loop: 128,
  ceremony_phases: ['round_call', 'fight_call', 'in_fight'],
  ceremony_bounds: { round_call_end: 12, fight_call_end: 19, in_fight_from: 19 },
  winner_rules: ['higher_hp_wins', 'equal_hp_higher_meter_wins', 'still_equal_draw'],
  outcome_fields: ['result', 'result_step', 'result_p1_hp', 'result_p2_hp'],
  sound_map_status: 'mapped',
  sound_hooks: ['round_call', 'fight_call', 'hit_light', 'hit_heavy', 'special', 'block'],
  sound_events: [
    { hook: 'round_call', kind: 'span', step: 0, end_step: 11, note: 'ROUND call' },
    { hook: 'fight_call', kind: 'span', step: 12, end_step: 18, note: 'FIGHT call' },
  ],
  one_gel_law: {
    default_enforce: true,
    applies_to: '2P human matches',
    stock_rival_exempt: true,
  },
};

const axelMoves = [
  { action: 'light', dmg: 12, meter_gain: 0.08, meter_cost: 0, duration: 2, heavy: false, block_chip: 0 },
  { action: 'heavy', dmg: 22, meter_gain: 0.14, meter_cost: 0, duration: 4, heavy: true, block_chip: 0.05 },
  { action: 'special', dmg: 30, meter_gain: 0, meter_cost: 0.25, duration: 5, heavy: true, block_chip: 0.1 },
  { action: 'block', dmg: 0, meter_gain: 0, meter_cost: 0, duration: 3, heavy: false, block_chip: 0 },
];

export const fixtureKits: FighterKit[] = fixtureFighters.map((fighter) => ({
  fighter_id: fighter.id,
  display_name: fighter.display_name,
  title: fighter.title,
  archetype:
    fighter.id === 'VEX' ? 'rush' : fighter.id === 'REX' ? 'tank' : fighter.id === 'NYX' ? 'trick' : 'striker',
  hp_mod: fighter.hp_mod,
  meter_mod: fighter.meter_mod,
  notes: fighter.notes,
  moves: axelMoves,
}));

/** The P1 fixture identity is deterministic and never comes from a live session. */
export const fixtureToons: Toon[] = [
  {
    id: 1,
    name: 'Fixture Axel',
    description: 'Local deterministic practice Toon.',
    sprite_url: null,
    tags: ['fixture', 'practice'],
    attributes: { fighter_id: 'AXEL' },
  },
];

export const fixtureLoadouts: Loadout[] = [
  {
    id: 1,
    toon_id: fixtureToons[0]!.id,
    name: 'Fixture sodium loadout',
    gel: 'sodium',
    fighter_id: 'AXEL',
    user_kit_id: null,
    is_default: true,
  },
];

export const fixtureMatchSeed = 677;

export const fixtureSkinCatalog: SkinCatalog = {
  schema_version: '1.0',
  catalog_hash: 'fixture-skin-catalog-v1',
  count: 12,
  skins: [
    { id: 'gel:acid', kind: 'ui_theme', display_name: 'Acid', description: 'The acid gel palette as an app and HUD theme.', entitlement: 'free', base_gel: 'acid', default: false, status: 'built' },
    { id: 'gel:blue', kind: 'ui_theme', display_name: 'Blue', description: 'The blue gel palette as an app and HUD theme.', entitlement: 'free', base_gel: 'blue', default: false, status: 'built' },
    { id: 'gel:red', kind: 'ui_theme', display_name: 'Red', description: 'The red gel palette as an app and HUD theme.', entitlement: 'free', base_gel: 'red', default: false, status: 'built' },
    { id: 'gel:sodium', kind: 'ui_theme', display_name: 'Sodium', description: 'The sodium gel palette as an app and HUD theme.', entitlement: 'free', base_gel: 'sodium', default: true, status: 'built' },
    { id: 'gel:uv', kind: 'ui_theme', display_name: 'Uv', description: 'The uv gel palette as an app and HUD theme.', entitlement: 'free', base_gel: 'uv', default: false, status: 'built' },
    { id: 'vibe:rooftop', kind: 'scene_vibe', display_name: 'Rooftop', description: 'The stock rooftop stage presentation.', entitlement: 'free', base_gel: 'sodium', default: true, status: 'built' },
    { id: 'vibe:warehouse-rain', kind: 'scene_vibe', display_name: 'Warehouse Rain', description: 'A warehouse stage variant (assets pending).', entitlement: 'free', base_gel: 'blue', default: false, status: 'planned' },
    { id: 'char:axel-stock', kind: 'character', display_name: 'AXEL', description: 'Stock AXEL look (no asset pack required).', entitlement: 'free', base_gel: 'sodium', default: true, status: 'built' },
    { id: 'char:kai-stock', kind: 'character', display_name: 'KAI', description: 'Stock KAI look (no asset pack required).', entitlement: 'free', base_gel: 'sodium', default: true, status: 'built' },
    { id: 'char:nyx-stock', kind: 'character', display_name: 'NYX', description: 'Stock NYX look (no asset pack required).', entitlement: 'free', base_gel: 'sodium', default: true, status: 'built' },
    { id: 'char:rex-stock', kind: 'character', display_name: 'REX', description: 'Stock REX look (no asset pack required).', entitlement: 'free', base_gel: 'sodium', default: true, status: 'built' },
    { id: 'char:vex-stock', kind: 'character', display_name: 'VEX', description: 'Stock VEX look (no asset pack required).', entitlement: 'free', base_gel: 'sodium', default: true, status: 'built' },
  ],
};

export const fixtureMySkins: MySkins = {
  owned: [],
  selection: {
    ui_theme: 'gel:sodium',
    scene_vibe: 'vibe:rooftop',
    character: 'char:axel-stock',
  },
};