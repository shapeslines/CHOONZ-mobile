import { ResponseDecodeError } from '@/lib/errors';
import type {
  CatalogMeta,
  ChoonzUser,
  EngineMeta,
  Fighter,
  FighterKit,
  Gel,
  Health,
  KitMove,
  SoundEvent,
  Stage,
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
  return record(value, label);
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
  const createdAt = string(input.created_at, 'user.created_at');
  if (Number.isNaN(Date.parse(createdAt))) {
    throw new ResponseDecodeError('user.created_at must be an ISO date string.');
  }
  return {
    id: integer(input.id, 'user.id'),
    email: nullableString(input.email, 'user.email'),
    display_name: nullableString(input.display_name, 'user.display_name'),
    created_at: createdAt,
  };
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
