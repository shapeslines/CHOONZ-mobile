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

export interface UserUpdateInput {
  display_name: string | null;
}

export interface ChoonzConnection {
  client_id: string;
  client_name: string;
  scopes: string[];
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

export interface Toon {
  id: number;
  name: string;
  description: string | null;
  sprite_url: string | null;
  tags: string[];
  attributes: Record<string, unknown>;
}

export interface ToonCreateInput {
  name: string;
  description?: string | null;
  sprite_url?: string | null;
  tags?: string[];
  attributes?: Record<string, unknown>;
}

export interface Loadout {
  id: number;
  toon_id: number;
  name: string | null;
  gel: string;
  fighter_id: string;
  user_kit_id: number | null;
  is_default: boolean;
}

export interface LoadoutCreateInput {
  toon_id: number;
  name?: string | null;
  gel?: string;
  fighter_id?: string;
  user_kit_id?: number | null;
  is_default?: boolean;
}

export type MatchStatus = 'ready' | 'active' | 'paused' | 'completed' | 'cancelled';
export type MatchResult = 'p1' | 'p2' | 'draw';
export type FightAction = 'light' | 'heavy' | 'special' | 'block';

export interface MatchTelemetry {
  result: MatchResult;
  result_step: number;
  result_p1_hp: number;
  result_p2_hp: number;
  seed: number;
  stage_id: string;
  p1_fighter_id: string;
  p2_fighter_id: string;
  input_count: number;
  series_id: number | null;
}

export interface Match {
  id: number;
  series_id: number | null;
  p1_toon_id: number;
  p2_toon_id: number | null;
  p1_gel: string;
  p2_gel: string;
  p1_fighter_id: string;
  p2_fighter_id: string;
  stage_id: string;
  seed: number;
  status: MatchStatus;
  result: MatchResult | null;
  result_step: number | null;
  result_p1_hp: number | null;
  result_p2_hp: number | null;
  last_step: number;
  loop: number;
  share_token: string | null;
  telemetry: MatchTelemetry | null;
  allowed_transitions: MatchStatus[];
}

export interface FighterHud {
  hp: number;
  meter: number;
  rounds: number;
  pose: string | null;
  frame: number | null;
  x: number | null;
  lift: number | null;
}

export interface MatchState {
  match_id: number;
  status: MatchStatus;
  step: number;
  last_step: number;
  bar: number;
  ceremony: 'round_call' | 'fight_call' | 'in_fight';
  p1: FighterHud;
  p2: FighterHud;
  timer: number;
  combo: number;
  p1_gel: string;
  p2_gel: string;
  p1_fighter_id: string;
  p2_fighter_id: string;
  stage_id: string;
  seed: number;
  loop: number;
  leading: MatchResult | null;
  ann: string | null;
  sound_hooks: string[];
  extra: Record<string, unknown>;
}

export interface MatchCreateInput {
  p1_toon_id?: number | null;
  p2_toon_id?: number | null;
  p1_loadout_id?: number | null;
  p2_loadout_id?: number | null;
  use_default_loadout?: boolean;
  p1_gel?: string;
  p2_gel?: string;
  enforce_one_gel?: boolean;
  allow_gel_split?: boolean;
  p1_fighter_id?: string;
  p2_fighter_id?: string;
  stage_id?: string;
  seed?: number;
}

export interface MatchActInput {
  action: FightAction;
  side?: 'p1';
  advance?: boolean;
}

export interface MatchTickInput {
  delta?: number;
}

export interface MatchCompleteInput {
  step?: number | null;
}

export type MechanicsVerdict = 'pass' | 'fail' | 'not_applicable';

export interface MechanicsCorpusIdentity {
  schema_version: string;
  corpus_version: string;
  corpus_hash: string;
  engine_revision: string;
}

export interface MechanicsFighterPair {
  p1: string;
  p2: string;
}

export interface MechanicsGelPair {
  p1: string;
  p2: string;
}

export interface MechanicsInputEvent {
  step: number;
  side: 'p1' | 'p2';
  action: FightAction;
}

export interface MechanicsScenarioSummary {
  id: string;
  title: string;
  description: string;
  tags: string[];
  seed: number;
  fighters: MechanicsFighterPair;
  gels: MechanicsGelPair;
  stage_id: string;
  checkpoint_count: number;
}

export interface MechanicsScenarioList extends MechanicsCorpusIdentity {
  scenarios: MechanicsScenarioSummary[];
}

export interface MechanicsScenario {
  id: string;
  title: string;
  description: string;
  tags: string[];
  seed: number;
  fighters: MechanicsFighterPair;
  gels: MechanicsGelPair;
  stage_id: string;
  input_tape: MechanicsInputEvent[];
  checkpoints: number[];
  expected_checkpoints: Record<string, Record<string, unknown>>;
}

export interface MechanicsScenarioDetail extends MechanicsCorpusIdentity {
  scenario: MechanicsScenario;
}

export interface MechanicsReplayOverrides {
  seed?: number | null;
  p1_fighter_id?: string | null;
  p2_fighter_id?: string | null;
  p1_gel?: string | null;
  p2_gel?: string | null;
  stage_id?: string | null;
  input_tape?: MechanicsInputEvent[] | null;
  checkpoints?: number[] | null;
}

export interface MechanicsDiffRecord {
  path: string;
  expected: unknown;
  actual: unknown;
}

export interface MechanicsNormalizedInputs {
  seed: number;
  p1_fighter_id: string;
  p2_fighter_id: string;
  p1_gel: string;
  p2_gel: string;
  stage_id: string;
  input_tape: MechanicsInputEvent[];
  checkpoints: number[];
}

export interface MechanicsReplayReceipt extends MechanicsCorpusIdentity {
  scenario_id: string;
  overridden: boolean;
  normalized_inputs: MechanicsNormalizedInputs;
  actual_checkpoints: Record<string, Record<string, unknown>>;
  expected_checkpoints: Record<string, Record<string, unknown>>;
  diffs: MechanicsDiffRecord[];
  verdict: MechanicsVerdict;
}
