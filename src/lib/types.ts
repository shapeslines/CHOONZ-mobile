export interface Health {
  status: string;
  env: string;
  version: string;
  engine_loop: number;
}

export interface ChoonzUser {
  id: number;
  email: string | null;
  display_name: string | null;
  created_at: string;
}

export interface Gel {
  id: string;
  hot: string;
  mid: string;
  deep: string;
}

export interface Fighter {
  id: string;
  display_name: string;
  title: string;
  default_side: string;
  faces: string;
  notes: string;
  hp_mod: number;
  meter_mod: number;
}

export interface Stage {
  id: string;
  display_name: string;
  default_gel: string;
  deck_y: number;
  width: number;
  height: number;
  scene_id: string;
  status: string;
}

export interface CatalogMeta {
  toon_attribute_fighter_key: string;
  loop: number;
  gels_count: number;
  fighters_count: number;
  stages_count: number;
}

export interface SoundEvent {
  hook: string;
  kind: 'oneshot' | 'span';
  step: number;
  end_step: number | null;
  note: string;
}

export interface EngineMeta {
  loop: number;
  ceremony_phases: string[];
  ceremony_bounds: Record<string, number>;
  winner_rules: string[];
  outcome_fields: string[];
  sound_map_status: string;
  sound_hooks: string[];
  sound_events: SoundEvent[];
  one_gel_law: Record<string, unknown>;
}

export interface KitMove {
  action: string;
  dmg: number;
  meter_gain: number;
  meter_cost: number;
  duration: number;
  heavy: boolean;
  block_chip: number;
}

export interface FighterKit {
  fighter_id: string;
  display_name: string;
  title: string;
  archetype: string;
  hp_mod: number;
  meter_mod: number;
  notes: string;
  moves: KitMove[];
}
