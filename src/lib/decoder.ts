import { ResponseDecodeError } from '@/lib/errors';
import type {
  CatalogMeta,
  ChoonzConnection,
  ChoonzUser,
  EngineMeta,
  Fighter,
  FighterHud,
  FighterKit,
  Gel,
  Health,
  KitMove,
  Loadout,
  Match,
  MatchResult,
  MatchState,
  MatchStatus,
  MatchTelemetry,
  MechanicsCorpusIdentity,
  MechanicsDiffRecord,
  MechanicsFighterPair,
  MechanicsGelPair,
  MechanicsInputEvent,
  MechanicsNormalizedInputs,
  MechanicsReplayReceipt,
  MechanicsScenario,
  MechanicsScenarioDetail,
  MechanicsScenarioList,
  MechanicsScenarioSummary,
  MechanicsVerdict,
  MySkins,
  Skin,
  SkinCatalog,
  SkinSummary,
  SoundEvent,
  Stage,
  Toon,
} from '@/lib/types';

type RecordValue = Record<string, unknown>;

function record(value: unknown, label: string): RecordValue {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new ResponseDecodeError(`${label} must be an object.`);
  }
  return value as RecordValue;
}

function string(value: unknown, label: string): string {
  if (typeof value !== 'string') {
    throw new ResponseDecodeError(`${label} must be a string.`);
  }
  return value;
}

function nullableString(value: unknown, label: string): string | null {
  return value === null ? null : string(value, label);
}

function number(value: unknown, label: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new ResponseDecodeError(`${label} must be a finite number.`);
  }
  return value;
}

function integer(value: unknown, label: string): number {
  const next = number(value, label);
  if (!Number.isInteger(next)) {
    throw new ResponseDecodeError(`${label} must be an integer.`);
  }
  return next;
}

function boolean(value: unknown, label: string): boolean {
  if (typeof value !== 'boolean') {
    throw new ResponseDecodeError(`${label} must be a boolean.`);
  }
  return value;
}

function array(value: unknown, label: string): unknown[] {
  if (!Array.isArray(value)) {
    throw new ResponseDecodeError(`${label} must be an array.`);
  }
  return value;
}

function stringArray(value: unknown, label: string): string[] {
  return array(value, label).map((item, index) => string(item, `${label}[${index}]`));
}

function numberRecord(value: unknown, label: string): Record<string, number> {
  return Object.fromEntries(
    Object.entries(record(value, label)).map(([key, item]) => [
      key,
      integer(item, `${label}.${key}`),
    ]),
  );
}

function jsonRecord(value: unknown, label: string): Record<string, unknown> {
  const input = record(value, label);
  for (const [key, item] of Object.entries(input)) {
    jsonValue(item, `${label}.${key}`);
  }
  return input;
}

function jsonRecordOfRecords(
  value: unknown,
  label: string,
): Record<string, Record<string, unknown>> {
  const input = record(value, label);
  const output: Record<string, Record<string, unknown>> = {};
  for (const [key, item] of Object.entries(input)) {
    const inner = record(item, `${label}.${key}`);
    for (const [innerKey, leaf] of Object.entries(inner)) {
      jsonValue(leaf, `${label}.${key}.${innerKey}`);
    }
    output[key] = inner;
  }
  return output;
}

function nullableNumber(value: unknown, label: string): number | null {
  return value === null ? null : number(value, label);
}

function nullableInteger(value: unknown, label: string): number | null {
  return value === null ? null : integer(value, label);
}

function isoDate(value: unknown, label: string): string {
  const next = string(value, label);
  if (Number.isNaN(Date.parse(next))) {
    throw new ResponseDecodeError(`${label} must be an ISO date string.`);
  }
  return next;
}

function jsonValue(value: unknown, label: string): void {
  if (value === null || typeof value === 'string' || typeof value === 'boolean') {
    return;
  }
  if (typeof value === 'number') {
    number(value, label);
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((item, index) => jsonValue(item, `${label}[${index}]`));
    return;
  }
  const input = record(value, label);
  for (const [key, item] of Object.entries(input)) {
    jsonValue(item, `${label}.${key}`);
  }
}

const matchStatuses = ['ready', 'active', 'paused', 'completed', 'cancelled'] as const;
const matchResults = ['p1', 'p2', 'draw'] as const;
const ceremonyStates = ['round_call', 'fight_call', 'in_fight'] as const;

function literal<T extends string>(value: unknown, allowed: readonly T[], label: string): T {
  const next = string(value, label);
  if (!allowed.includes(next as T)) {
    throw new ResponseDecodeError(`${label} must be one of ${allowed.join(', ')}.`);
  }
  return next as T;
}

function matchStatus(value: unknown, label: string): MatchStatus {
  return literal(value, matchStatuses, label);
}

function nullableMatchResult(value: unknown, label: string): MatchResult | null {
  return value === null ? null : literal(value, matchResults, label);
}

export function decodeHealth(value: unknown): Health {
  const input = record(value, 'health');
  return {
    status: string(input.status, 'health.status'),
    env: string(input.env, 'health.env'),
    version: string(input.version, 'health.version'),
    engine_loop: integer(input.engine_loop, 'health.engine_loop'),
  };
}

export function decodeUser(value: unknown): ChoonzUser {
  const input = record(value, 'user');
  const createdAt = isoDate(input.created_at, 'user.created_at');
  return {
    id: integer(input.id, 'user.id'),
    email: nullableString(input.email, 'user.email'),
    display_name: nullableString(input.display_name, 'user.display_name'),
    created_at: createdAt,
  };
}

export function decodeConnection(value: unknown): ChoonzConnection {
  const input = record(value, 'connection');
  return {
    client_id: string(input.client_id, 'connection.client_id'),
    client_name: string(input.client_name, 'connection.client_name'),
    scopes: stringArray(input.scopes, 'connection.scopes'),
    created_at: isoDate(input.created_at, 'connection.created_at'),
  };
}

export function decodeConnections(value: unknown): ChoonzConnection[] {
  return array(value, 'connections').map(decodeConnection);
}

export function decodeGel(value: unknown): Gel {
  const input = record(value, 'gel');
  return {
    id: string(input.id, 'gel.id'),
    hot: string(input.hot, 'gel.hot'),
    mid: string(input.mid, 'gel.mid'),
    deep: string(input.deep, 'gel.deep'),
  };
}

export function decodeGels(value: unknown): Gel[] {
  return array(value, 'gels').map(decodeGel);
}

export function decodeFighter(value: unknown): Fighter {
  const input = record(value, 'fighter');
  return {
    id: string(input.id, 'fighter.id'),
    display_name: string(input.display_name, 'fighter.display_name'),
    title: string(input.title, 'fighter.title'),
    default_side: string(input.default_side, 'fighter.default_side'),
    faces: string(input.faces, 'fighter.faces'),
    notes: string(input.notes, 'fighter.notes'),
    hp_mod: number(input.hp_mod, 'fighter.hp_mod'),
    meter_mod: number(input.meter_mod, 'fighter.meter_mod'),
  };
}

export function decodeFighters(value: unknown): Fighter[] {
  return array(value, 'fighters').map(decodeFighter);
}

export function decodeStage(value: unknown): Stage {
  const input = record(value, 'stage');
  return {
    id: string(input.id, 'stage.id'),
    display_name: string(input.display_name, 'stage.display_name'),
    default_gel: string(input.default_gel, 'stage.default_gel'),
    deck_y: integer(input.deck_y, 'stage.deck_y'),
    width: integer(input.width, 'stage.width'),
    height: integer(input.height, 'stage.height'),
    scene_id: string(input.scene_id, 'stage.scene_id'),
    status: string(input.status, 'stage.status'),
  };
}

export function decodeStages(value: unknown): Stage[] {
  return array(value, 'stages').map(decodeStage);
}

export function decodeCatalog(value: unknown): CatalogMeta {
  const input = record(value, 'catalog');
  return {
    toon_attribute_fighter_key: string(
      input.toon_attribute_fighter_key,
      'catalog.toon_attribute_fighter_key',
    ),
    loop: integer(input.loop, 'catalog.loop'),
    gels_count: integer(input.gels_count, 'catalog.gels_count'),
    fighters_count: integer(input.fighters_count, 'catalog.fighters_count'),
    stages_count: integer(input.stages_count, 'catalog.stages_count'),
  };
}

function decodeSoundEvent(value: unknown): SoundEvent {
  const input = record(value, 'sound event');
  const kind = string(input.kind, 'sound event.kind');
  if (kind !== 'oneshot' && kind !== 'span') {
    throw new ResponseDecodeError('sound event.kind must be oneshot or span.');
  }
  return {
    hook: string(input.hook, 'sound event.hook'),
    kind,
    step: integer(input.step, 'sound event.step'),
    end_step: input.end_step === null ? null : integer(input.end_step, 'sound event.end_step'),
    note: string(input.note, 'sound event.note'),
  };
}

export function decodeEngine(value: unknown): EngineMeta {
  const input = record(value, 'engine');
  return {
    loop: integer(input.loop, 'engine.loop'),
    ceremony_phases: stringArray(input.ceremony_phases, 'engine.ceremony_phases'),
    ceremony_bounds: numberRecord(input.ceremony_bounds, 'engine.ceremony_bounds'),
    winner_rules: stringArray(input.winner_rules, 'engine.winner_rules'),
    outcome_fields: stringArray(input.outcome_fields, 'engine.outcome_fields'),
    sound_map_status: string(input.sound_map_status, 'engine.sound_map_status'),
    sound_hooks: stringArray(input.sound_hooks, 'engine.sound_hooks'),
    sound_events: array(input.sound_events, 'engine.sound_events').map(decodeSoundEvent),
    one_gel_law: jsonRecord(input.one_gel_law, 'engine.one_gel_law'),
  };
}

function decodeMove(value: unknown): KitMove {
  const input = record(value, 'kit move');
  return {
    action: string(input.action, 'kit move.action'),
    dmg: integer(input.dmg, 'kit move.dmg'),
    meter_gain: number(input.meter_gain, 'kit move.meter_gain'),
    meter_cost: number(input.meter_cost, 'kit move.meter_cost'),
    duration: integer(input.duration, 'kit move.duration'),
    heavy: boolean(input.heavy, 'kit move.heavy'),
    block_chip: number(input.block_chip, 'kit move.block_chip'),
  };
}

export function decodeKit(value: unknown): FighterKit {
  const input = record(value, 'kit');
  return {
    fighter_id: string(input.fighter_id, 'kit.fighter_id'),
    display_name: string(input.display_name, 'kit.display_name'),
    title: string(input.title, 'kit.title'),
    archetype: string(input.archetype, 'kit.archetype'),
    hp_mod: number(input.hp_mod, 'kit.hp_mod'),
    meter_mod: number(input.meter_mod, 'kit.meter_mod'),
    notes: string(input.notes, 'kit.notes'),
    moves: array(input.moves, 'kit.moves').map(decodeMove),
  };
}

export function decodeKits(value: unknown): FighterKit[] {
  return array(value, 'kits').map(decodeKit);
}

export function decodeToon(value: unknown): Toon {
  const input = record(value, 'toon');
  return {
    id: integer(input.id, 'toon.id'),
    name: string(input.name, 'toon.name'),
    description: nullableString(input.description, 'toon.description'),
    sprite_url: nullableString(input.sprite_url, 'toon.sprite_url'),
    tags: stringArray(input.tags, 'toon.tags'),
    attributes: jsonRecord(input.attributes, 'toon.attributes'),
  };
}

export function decodeToons(value: unknown): Toon[] {
  return array(value, 'toons').map(decodeToon);
}

export function decodeLoadout(value: unknown): Loadout {
  const input = record(value, 'loadout');
  return {
    id: integer(input.id, 'loadout.id'),
    toon_id: integer(input.toon_id, 'loadout.toon_id'),
    name: nullableString(input.name, 'loadout.name'),
    gel: string(input.gel, 'loadout.gel'),
    fighter_id: string(input.fighter_id, 'loadout.fighter_id'),
    user_kit_id: nullableInteger(input.user_kit_id, 'loadout.user_kit_id'),
    is_default: boolean(input.is_default, 'loadout.is_default'),
  };
}

export function decodeLoadouts(value: unknown): Loadout[] {
  return array(value, 'loadouts').map(decodeLoadout);
}

function decodeTelemetry(value: unknown): MatchTelemetry {
  const input = record(value, 'match.telemetry');
  return {
    result: literal(input.result, matchResults, 'match.telemetry.result'),
    result_step: integer(input.result_step, 'match.telemetry.result_step'),
    result_p1_hp: number(input.result_p1_hp, 'match.telemetry.result_p1_hp'),
    result_p2_hp: number(input.result_p2_hp, 'match.telemetry.result_p2_hp'),
    seed: integer(input.seed, 'match.telemetry.seed'),
    stage_id: string(input.stage_id, 'match.telemetry.stage_id'),
    p1_fighter_id: string(input.p1_fighter_id, 'match.telemetry.p1_fighter_id'),
    p2_fighter_id: string(input.p2_fighter_id, 'match.telemetry.p2_fighter_id'),
    input_count: integer(input.input_count, 'match.telemetry.input_count'),
    series_id: nullableInteger(input.series_id, 'match.telemetry.series_id'),
  };
}

export function decodeMatch(value: unknown): Match {
  const input = record(value, 'match');
  return {
    id: integer(input.id, 'match.id'),
    series_id: nullableInteger(input.series_id, 'match.series_id'),
    p1_toon_id: integer(input.p1_toon_id, 'match.p1_toon_id'),
    p2_toon_id: nullableInteger(input.p2_toon_id, 'match.p2_toon_id'),
    p1_gel: string(input.p1_gel, 'match.p1_gel'),
    p2_gel: string(input.p2_gel, 'match.p2_gel'),
    p1_fighter_id: string(input.p1_fighter_id, 'match.p1_fighter_id'),
    p2_fighter_id: string(input.p2_fighter_id, 'match.p2_fighter_id'),
    stage_id: string(input.stage_id, 'match.stage_id'),
    seed: integer(input.seed, 'match.seed'),
    status: matchStatus(input.status, 'match.status'),
    result: nullableMatchResult(input.result, 'match.result'),
    result_step: nullableInteger(input.result_step, 'match.result_step'),
    result_p1_hp: nullableNumber(input.result_p1_hp, 'match.result_p1_hp'),
    result_p2_hp: nullableNumber(input.result_p2_hp, 'match.result_p2_hp'),
    last_step: integer(input.last_step, 'match.last_step'),
    loop: integer(input.loop, 'match.loop'),
    share_token: nullableString(input.share_token, 'match.share_token'),
    telemetry: input.telemetry === null ? null : decodeTelemetry(input.telemetry),
    allowed_transitions: array(input.allowed_transitions, 'match.allowed_transitions').map(
      (item, index) => matchStatus(item, `match.allowed_transitions[${index}]`),
    ),
  };
}

function decodeFighterHud(value: unknown, label: string): FighterHud {
  const input = record(value, label);
  return {
    hp: number(input.hp, `${label}.hp`),
    meter: number(input.meter, `${label}.meter`),
    rounds: integer(input.rounds, `${label}.rounds`),
    pose: nullableString(input.pose, `${label}.pose`),
    frame: nullableInteger(input.frame, `${label}.frame`),
    x: nullableNumber(input.x, `${label}.x`),
    lift: nullableNumber(input.lift, `${label}.lift`),
  };
}

export function decodeMatchState(value: unknown): MatchState {
  const input = record(value, 'match state');
  return {
    match_id: integer(input.match_id, 'match state.match_id'),
    status: matchStatus(input.status, 'match state.status'),
    step: integer(input.step, 'match state.step'),
    last_step: integer(input.last_step, 'match state.last_step'),
    bar: integer(input.bar, 'match state.bar'),
    ceremony: literal(input.ceremony, ceremonyStates, 'match state.ceremony'),
    p1: decodeFighterHud(input.p1, 'match state.p1'),
    p2: decodeFighterHud(input.p2, 'match state.p2'),
    timer: integer(input.timer, 'match state.timer'),
    combo: integer(input.combo, 'match state.combo'),
    p1_gel: string(input.p1_gel, 'match state.p1_gel'),
    p2_gel: string(input.p2_gel, 'match state.p2_gel'),
    p1_fighter_id: string(input.p1_fighter_id, 'match state.p1_fighter_id'),
    p2_fighter_id: string(input.p2_fighter_id, 'match state.p2_fighter_id'),
    stage_id: string(input.stage_id, 'match state.stage_id'),
    seed: integer(input.seed, 'match state.seed'),
    loop: integer(input.loop, 'match state.loop'),
    leading: nullableMatchResult(input.leading, 'match state.leading'),
    ann: nullableString(input.ann, 'match state.ann'),
    sound_hooks: stringArray(input.sound_hooks, 'match state.sound_hooks'),
    extra: jsonRecord(input.extra, 'match state.extra'),
  };
}

// --------------------------------------------------------------------------- //
// Mechanics lab (ARC677 P3) — strict, version-gated decoders.
// --------------------------------------------------------------------------- //

const mechanicsVerdicts = ['pass', 'fail', 'not_applicable'] as const;
const mechanicsSides = ['p1', 'p2'] as const;
const mechanicsActions = ['light', 'heavy', 'special', 'block'] as const;

const MECHANICS_SCHEMA_VERSION = '1.0';
const MECHANICS_CORPUS_VERSION = '1';
const MECHANICS_ENGINE_REVISION = '1';

function mechanicsVerdict(value: unknown, label: string): MechanicsVerdict {
  return literal(value, mechanicsVerdicts, label);
}

function decodeMechanicsFighterPair(value: unknown, label: string): MechanicsFighterPair {
  const input = record(value, label);
  return {
    p1: string(input.p1, `${label}.p1`),
    p2: string(input.p2, `${label}.p2`),
  };
}

function decodeMechanicsGelPair(value: unknown, label: string): MechanicsGelPair {
  const input = record(value, label);
  return {
    p1: string(input.p1, `${label}.p1`),
    p2: string(input.p2, `${label}.p2`),
  };
}

function decodeMechanicsInputEvent(value: unknown, label: string): MechanicsInputEvent {
  const input = record(value, label);
  return {
    step: integer(input.step, `${label}.step`),
    side: literal(input.side, mechanicsSides, `${label}.side`),
    action: literal(input.action, mechanicsActions, `${label}.action`),
  };
}

function decodeMechanicsIdentity(input: RecordValue, label: string): MechanicsCorpusIdentity {
  const schemaVersion = string(input.schema_version, `${label}.schema_version`);
  if (schemaVersion !== MECHANICS_SCHEMA_VERSION) {
    throw new ResponseDecodeError(
      `${label}.schema_version ${schemaVersion} is not supported by this client.`,
    );
  }
  const corpusVersion = string(input.corpus_version, `${label}.corpus_version`);
  if (corpusVersion !== MECHANICS_CORPUS_VERSION) {
    throw new ResponseDecodeError(
      `${label}.corpus_version ${corpusVersion} is not supported by this client.`,
    );
  }
  const engineRevision = string(input.engine_revision, `${label}.engine_revision`);
  if (engineRevision !== MECHANICS_ENGINE_REVISION) {
    throw new ResponseDecodeError(
      `${label}.engine_revision ${engineRevision} is not supported by this client.`,
    );
  }
  return {
    schema_version: schemaVersion,
    corpus_version: corpusVersion,
    corpus_hash: string(input.corpus_hash, `${label}.corpus_hash`),
    engine_revision: engineRevision,
  };
}

function decodeMechanicsScenarioSummary(value: unknown): MechanicsScenarioSummary {
  const input = record(value, 'mechanics scenario summary');
  return {
    id: string(input.id, 'scenario summary.id'),
    title: string(input.title, 'scenario summary.title'),
    description: string(input.description, 'scenario summary.description'),
    tags: stringArray(input.tags, 'scenario summary.tags'),
    seed: integer(input.seed, 'scenario summary.seed'),
    fighters: decodeMechanicsFighterPair(input.fighters, 'scenario summary.fighters'),
    gels: decodeMechanicsGelPair(input.gels, 'scenario summary.gels'),
    stage_id: string(input.stage_id, 'scenario summary.stage_id'),
    checkpoint_count: integer(input.checkpoint_count, 'scenario summary.checkpoint_count'),
  };
}

export function decodeMechanicsScenarioList(value: unknown): MechanicsScenarioList {
  const input = record(value, 'mechanics scenario list');
  return {
    ...decodeMechanicsIdentity(input, 'mechanics scenario list'),
    scenarios: array(input.scenarios, 'mechanics scenario list.scenarios').map(
      decodeMechanicsScenarioSummary,
    ),
  };
}

function decodeMechanicsScenario(value: unknown): MechanicsScenario {
  const input = record(value, 'mechanics scenario');
  return {
    id: string(input.id, 'scenario.id'),
    title: string(input.title, 'scenario.title'),
    description: string(input.description, 'scenario.description'),
    tags: stringArray(input.tags, 'scenario.tags'),
    seed: integer(input.seed, 'scenario.seed'),
    fighters: decodeMechanicsFighterPair(input.fighters, 'scenario.fighters'),
    gels: decodeMechanicsGelPair(input.gels, 'scenario.gels'),
    stage_id: string(input.stage_id, 'scenario.stage_id'),
    input_tape: array(input.input_tape, 'scenario.input_tape').map((item, index) =>
      decodeMechanicsInputEvent(item, `scenario.input_tape[${index}]`),
    ),
    checkpoints: array(input.checkpoints, 'scenario.checkpoints').map((item, index) =>
      integer(item, `scenario.checkpoints[${index}]`),
    ),
    expected_checkpoints: jsonRecordOfRecords(
      input.expected_checkpoints,
      'scenario.expected_checkpoints',
    ),
  };
}

export function decodeMechanicsScenarioDetail(value: unknown): MechanicsScenarioDetail {
  const input = record(value, 'mechanics scenario detail');
  return {
    ...decodeMechanicsIdentity(input, 'mechanics scenario detail'),
    scenario: decodeMechanicsScenario(input.scenario),
  };
}

function decodeMechanicsDiffRecord(value: unknown): MechanicsDiffRecord {
  const input = record(value, 'mechanics diff');
  jsonValue(input.expected, 'mechanics diff.expected');
  jsonValue(input.actual, 'mechanics diff.actual');
  return {
    path: string(input.path, 'mechanics diff.path'),
    expected: input.expected,
    actual: input.actual,
  };
}

function decodeMechanicsNormalizedInputs(value: unknown): MechanicsNormalizedInputs {
  const input = record(value, 'normalized inputs');
  return {
    seed: integer(input.seed, 'normalized inputs.seed'),
    p1_fighter_id: string(input.p1_fighter_id, 'normalized inputs.p1_fighter_id'),
    p2_fighter_id: string(input.p2_fighter_id, 'normalized inputs.p2_fighter_id'),
    p1_gel: string(input.p1_gel, 'normalized inputs.p1_gel'),
    p2_gel: string(input.p2_gel, 'normalized inputs.p2_gel'),
    stage_id: string(input.stage_id, 'normalized inputs.stage_id'),
    input_tape: array(input.input_tape, 'normalized inputs.input_tape').map((item, index) =>
      decodeMechanicsInputEvent(item, `normalized inputs.input_tape[${index}]`),
    ),
    checkpoints: array(input.checkpoints, 'normalized inputs.checkpoints').map((item, index) =>
      integer(item, `normalized inputs.checkpoints[${index}]`),
    ),
  };
}

export function decodeMechanicsReplayReceipt(value: unknown): MechanicsReplayReceipt {
  const input = record(value, 'mechanics replay receipt');
  return {
    ...decodeMechanicsIdentity(input, 'mechanics replay receipt'),
    scenario_id: string(input.scenario_id, 'replay receipt.scenario_id'),
    overridden: boolean(input.overridden, 'replay receipt.overridden'),
    normalized_inputs: decodeMechanicsNormalizedInputs(input.normalized_inputs),
    actual_checkpoints: jsonRecordOfRecords(
      input.actual_checkpoints,
      'replay receipt.actual_checkpoints',
    ),
    expected_checkpoints: jsonRecordOfRecords(
      input.expected_checkpoints,
      'replay receipt.expected_checkpoints',
    ),
    diffs: array(input.diffs, 'replay receipt.diffs').map(decodeMechanicsDiffRecord),
    verdict: mechanicsVerdict(input.verdict, 'replay receipt.verdict'),
  };
}

const skinKinds = ['ui_theme', 'scene_vibe', 'character'] as const;
const skinEntitlements = ['free', 'earnable', 'iap'] as const;
const skinStatuses = ['built', 'planned'] as const;

export function decodeSkinSummary(value: unknown): SkinSummary {
  const input = record(value, 'skin');
  return {
    id: string(input.id, 'skin.id'),
    kind: literal(input.kind, skinKinds, 'skin.kind'),
    display_name: string(input.display_name, 'skin.display_name'),
    description: string(input.description, 'skin.description'),
    entitlement: literal(input.entitlement, skinEntitlements, 'skin.entitlement'),
    base_gel: string(input.base_gel, 'skin.base_gel'),
    default: boolean(input.default, 'skin.default'),
    status: literal(input.status, skinStatuses, 'skin.status'),
  };
}

export function decodeSkinCatalog(value: unknown): SkinCatalog {
  const input = record(value, 'skin catalog');
  const skins = array(input.skins, 'skin catalog.skins').map((item, index) =>
    decodeSkinSummary(item),
  );
  return {
    schema_version: string(input.schema_version, 'skin catalog.schema_version'),
    catalog_hash: string(input.catalog_hash, 'skin catalog.catalog_hash'),
    count: integer(input.count, 'skin catalog.count'),
    skins,
  };
}

export function decodeSkin(value: unknown): Skin {
  const input = record(value, 'skin detail');
  const summary = decodeSkinSummary(input);
  const paletteInput = record(input.palette, 'skin detail.palette');
  return {
    ...summary,
    palette: Object.fromEntries(
      Object.entries(paletteInput).map(([key, item]) => [key, string(item, `skin detail.palette.${key}`)]),
    ),
    asset_refs: stringArray(input.asset_refs, 'skin detail.asset_refs'),
  };
}

export function decodeMySkins(value: unknown): MySkins {
  const input = record(value, 'my skins');
  const owned = array(input.owned, 'my skins.owned').map((item, index) => {
    const grant = record(item, `my skins.owned[${index}]`);
    return {
      skin_id: string(grant.skin_id, `my skins.owned[${index}].skin_id`),
      source: literal(grant.source, skinEntitlements, `my skins.owned[${index}].source`),
      granted_at: string(grant.granted_at, `my skins.owned[${index}].granted_at`),
    };
  });
  const selectionInput = record(input.selection, 'my skins.selection');
  return {
    owned,
    selection: {
      ui_theme: string(selectionInput.ui_theme, 'my skins.selection.ui_theme'),
      scene_vibe: string(selectionInput.scene_vibe, 'my skins.selection.scene_vibe'),
      character: string(selectionInput.character, 'my skins.selection.character'),
    },
  };
}