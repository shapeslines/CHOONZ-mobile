import { ChoonzClientError } from '@/lib/errors';
import {
  fixtureFighters,
  fixtureLoadouts,
  fixtureMatchSeed,
  fixtureStages,
  fixtureToons,
} from '@/lib/fixtures';
import type {
  FightAction,
  Loadout,
  LoadoutCreateInput,
  Match,
  MatchActInput,
  MatchCompleteInput,
  MatchCreateInput,
  MatchResult,
  MatchState,
  MatchStatus,
  MatchTickInput,
  Series,
  SeriesCreateInput,
  Toon,
  ToonCreateInput,
} from '@/lib/types';

const LOOP = 128;
const allowedTransitions: Record<MatchStatus, MatchStatus[]> = {
  ready: ['active', 'cancelled'],
  active: ['cancelled', 'completed', 'paused'],
  paused: ['active', 'cancelled', 'completed'],
  completed: [],
  cancelled: [],
};

const actionEffects: Record<FightAction, { damage: number; meter: number }> = {
  light: { damage: 8, meter: 0.08 },
  heavy: { damage: 14, meter: 0.13 },
  special: { damage: 20, meter: -0.2 },
  block: { damage: 0, meter: 0.03 },
};

interface FixtureMatchRecord {
  match: Match;
  tape: FightAction[];
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function responseError(status: number, message: string): never {
  throw new ChoonzClientError('response', message, status);
}

function requireInteger(value: number, label: string): void {
  if (!Number.isInteger(value)) {
    responseError(422, `${label} must be an integer.`);
  }
}

function nextTransitions(status: MatchStatus): MatchStatus[] {
  return [...allowedTransitions[status]];
}

/**
 * Local, deterministic UX scaffolding for fixture mode only. It intentionally
 * models the API contract and lifecycle, not the CHOONZ simulation.
 */
export class FixtureMatchService {
  private readonly toons = clone(fixtureToons);
  private readonly loadouts = clone(fixtureLoadouts);
  private readonly matches = new Map<number, FixtureMatchRecord>();
  private nextToonId = Math.max(...fixtureToons.map((toon) => toon.id)) + 1;
  private nextLoadoutId = Math.max(...fixtureLoadouts.map((loadout) => loadout.id)) + 1;
  private nextMatchId = 1;
  private readonly seriesRecords = new Map<number, Series>();
  private nextSeriesId = 1;

  async getToons(): Promise<Toon[]> {
    return clone(this.toons);
  }

  /** P-S3: completed practice matches gate the fixture earnable unlock. */
  completedMatchCount(): number {
    let count = 0;
    for (const record of this.matches.values()) {
      if (record.match.status === 'completed') {
        count += 1;
      }
    }
    return count;
  }

  async createToon(input: ToonCreateInput): Promise<Toon> {
    const name = input.name.trim();
    if (!name) {
      responseError(422, 'Toon name is required.');
    }
    const toon: Toon = {
      id: this.nextToonId++,
      name,
      description: input.description ?? null,
      sprite_url: input.sprite_url ?? null,
      tags: [...(input.tags ?? [])],
      attributes: clone(input.attributes ?? {}),
    };
    this.toons.push(toon);
    return clone(toon);
  }

  async getLoadouts(): Promise<Loadout[]> {
    return clone(this.loadouts);
  }

  async createLoadout(input: LoadoutCreateInput): Promise<Loadout> {
    requireInteger(input.toon_id, 'toon_id');
    this.getToon(input.toon_id);
    const gel = input.gel ?? 'sodium';
    const fighterId = input.fighter_id ?? 'AXEL';
    if (!fixtureStages.some((stage) => stage.default_gel === gel) && !['acid', 'blue', 'red', 'sodium', 'uv'].includes(gel)) {
      responseError(422, 'gel is not in the fixture catalog.');
    }
    if (!fixtureFighters.some((fighter) => fighter.id === fighterId)) {
      responseError(422, 'fighter_id is not in the fixture catalog.');
    }
    if (input.user_kit_id !== undefined && input.user_kit_id !== null) {
      requireInteger(input.user_kit_id, 'user_kit_id');
    }
    const loadout: Loadout = {
      id: this.nextLoadoutId++,
      toon_id: input.toon_id,
      name: input.name?.trim() || null,
      gel,
      fighter_id: fighterId,
      user_kit_id: input.user_kit_id ?? null,
      is_default: input.is_default ?? false,
    };
    if (loadout.is_default) {
      this.loadouts.forEach((existing) => {
        existing.is_default = false;
      });
    }
    this.loadouts.push(loadout);
    return clone(loadout);
  }

  async createMatch(input: MatchCreateInput): Promise<Match> {
    const selectedLoadout = input.p1_loadout_id
      ? this.getLoadout(input.p1_loadout_id)
      : input.use_default_loadout
        ? this.loadouts.find((loadout) => loadout.is_default) ?? responseError(404, 'No default loadout exists.')
        : null;
    const p1ToonId = selectedLoadout?.toon_id ?? input.p1_toon_id;
    if (p1ToonId === null || p1ToonId === undefined) {
      responseError(422, 'Select a Toon or loadout before creating a match.');
    }
    requireInteger(p1ToonId, 'p1_toon_id');
    this.getToon(p1ToonId);
    if (input.p2_toon_id !== undefined && input.p2_toon_id !== null) {
      this.getToon(input.p2_toon_id);
    }

    const p1Gel = selectedLoadout?.gel ?? input.p1_gel ?? 'sodium';
    const p2Gel = input.p2_gel ?? 'red';
    const p1FighterId = selectedLoadout?.fighter_id ?? input.p1_fighter_id ?? 'AXEL';
    const p2FighterId = input.p2_fighter_id ?? 'VEX';
    const stageId = input.stage_id ?? 'rooftop';
    const seed = input.seed ?? fixtureMatchSeed + this.nextMatchId - 1;
    this.validateCatalogChoice(p1Gel, p1FighterId, stageId);
    this.validateCatalogChoice(p2Gel, p2FighterId, stageId);
    requireInteger(seed, 'seed');
    if (seed < 0) {
      responseError(422, 'seed must be non-negative.');
    }
    if (
      input.p2_toon_id !== undefined &&
      input.p2_toon_id !== null &&
      (input.enforce_one_gel ?? true) &&
      !input.allow_gel_split &&
      p1Gel !== p2Gel
    ) {
      responseError(422, 'The one-gel law requires matching gels for a human rival.');
    }

    const id = this.nextMatchId++;
    const match: Match = {
      id,
      series_id: null,
      p1_toon_id: p1ToonId,
      p2_toon_id: input.p2_toon_id ?? null,
      p1_gel: p1Gel,
      p2_gel: p2Gel,
      p1_fighter_id: p1FighterId,
      p2_fighter_id: p2FighterId,
      stage_id: stageId,
      seed,
      status: 'ready',
      result: null,
      result_step: null,
      result_p1_hp: null,
      result_p2_hp: null,
      last_step: 0,
      loop: LOOP,
      share_token: null,
      telemetry: null,
      allowed_transitions: nextTransitions('ready'),
      // The fixture server echoes the requested engine and falls back to the
      // contract default, exactly as the decoder reads an omitted key.
      engine: input.engine ?? 'ah-scripted',
    };
    this.matches.set(id, { match, tape: [] });
    return clone(match);
  }

  /**
   * A fixture best-of-N series and its first bout. The engine is stamped on
   * that bout and the series reads it back **from the bout**, never from the
   * request — the same derivation the server does, so a fixture series and a
   * live one agree about who is the authority (CHOONZ #142 M5b).
   */
  async createSeries(input: SeriesCreateInput): Promise<Series> {
    const bestOf = input.best_of ?? 3;
    if (bestOf !== 3 && bestOf !== 5) {
      responseError(422, 'best_of must be 3 or 5.');
    }
    requireInteger(input.p1_toon_id, 'p1_toon_id');
    this.getToon(input.p1_toon_id);
    if (input.p2_toon_id !== undefined && input.p2_toon_id !== null) {
      this.getToon(input.p2_toon_id);
    }

    const p1Gel = input.p1_gel ?? 'sodium';
    const p2Gel = input.p2_gel ?? 'red';
    const p1FighterId = input.p1_fighter_id ?? 'AXEL';
    const p2FighterId = input.p2_fighter_id ?? 'VEX';
    const stageId = input.stage_id ?? 'rooftop';
    const seedBase = input.seed_base ?? 0;
    this.validateCatalogChoice(p1Gel, p1FighterId, stageId);
    this.validateCatalogChoice(p2Gel, p2FighterId, stageId);
    requireInteger(seedBase, 'seed_base');
    if (seedBase < 0) {
      responseError(422, 'seed_base must be non-negative.');
    }

    const bout = await this.createMatch({
      p1_toon_id: input.p1_toon_id,
      p2_toon_id: input.p2_toon_id ?? null,
      p1_gel: p1Gel,
      p2_gel: p2Gel,
      p1_fighter_id: p1FighterId,
      p2_fighter_id: p2FighterId,
      stage_id: stageId,
      seed: seedBase,
      enforce_one_gel: input.enforce_one_gel,
      allow_gel_split: input.allow_gel_split,
      engine: input.engine,
    });

    const id = this.nextSeriesId++;
    this.getRecord(bout.id).match.series_id = id;
    const series: Series = {
      id,
      best_of: bestOf,
      wins_needed: Math.floor(bestOf / 2) + 1,
      p1_wins: 0,
      p2_wins: 0,
      status: 'active',
      winner: null,
      p1_toon_id: input.p1_toon_id,
      p2_toon_id: input.p2_toon_id ?? null,
      p1_gel: p1Gel,
      p2_gel: p2Gel,
      p1_fighter_id: p1FighterId,
      p2_fighter_id: p2FighterId,
      stage_id: stageId,
      seed_base: seedBase,
      match_ids: [bout.id],
      open_match_id: bout.id,
      engine: bout.engine,
    };
    this.seriesRecords.set(id, series);
    return clone(series);
  }

  async getMatch(matchId: number): Promise<Match> {
    return clone(this.getRecord(matchId).match);
  }

  async startMatch(matchId: number): Promise<Match> {
    return this.transition(matchId, 'ready', 'active');
  }

  async pauseMatch(matchId: number): Promise<Match> {
    return this.transition(matchId, 'active', 'paused');
  }

  async resumeMatch(matchId: number): Promise<Match> {
    return this.transition(matchId, 'paused', 'active');
  }

  async completeMatch(matchId: number, input: MatchCompleteInput = {}): Promise<Match> {
    const record = this.getRecord(matchId);
    this.requireStatus(record.match, ['active', 'paused']);
    if (input.step !== undefined && input.step !== null) {
      requireInteger(input.step, 'step');
      if (input.step < 0) {
        responseError(422, 'step must be non-negative.');
      }
      record.match.last_step = input.step % LOOP;
    }
    const state = this.readState(record);
    const result = this.resultFor(state.p1.hp, state.p2.hp);
    record.match.status = 'completed';
    record.match.result = result;
    record.match.result_step = record.match.last_step;
    record.match.result_p1_hp = state.p1.hp;
    record.match.result_p2_hp = state.p2.hp;
    record.match.telemetry = {
      result,
      result_step: record.match.last_step,
      result_p1_hp: state.p1.hp,
      result_p2_hp: state.p2.hp,
      seed: record.match.seed,
      stage_id: record.match.stage_id,
      p1_fighter_id: record.match.p1_fighter_id,
      p2_fighter_id: record.match.p2_fighter_id,
      input_count: record.tape.length,
      series_id: null,
    };
    record.match.allowed_transitions = nextTransitions('completed');
    return clone(record.match);
  }

  async cancelMatch(matchId: number): Promise<Match> {
    const record = this.getRecord(matchId);
    this.requireStatus(record.match, ['ready', 'active', 'paused']);
    record.match.status = 'cancelled';
    record.match.allowed_transitions = nextTransitions('cancelled');
    return clone(record.match);
  }

  async tickMatch(matchId: number, input: MatchTickInput = {}): Promise<MatchState> {
    const record = this.getRecord(matchId);
    this.requireStatus(record.match, ['active']);
    const delta = input.delta ?? 1;
    requireInteger(delta, 'delta');
    if (delta < 1 || delta > LOOP) {
      responseError(422, `delta must be between 1 and ${LOOP}.`);
    }
    record.match.last_step = (record.match.last_step + delta) % LOOP;
    return clone(this.readState(record));
  }

  async actMatch(matchId: number, input: MatchActInput): Promise<MatchState> {
    const record = this.getRecord(matchId);
    this.requireStatus(record.match, ['active']);
    if (input.side !== undefined && input.side !== 'p1') {
      responseError(422, 'P1 mobile actions must use the p1 side.');
    }
    if (!Object.prototype.hasOwnProperty.call(actionEffects, input.action)) {
      responseError(422, 'action is not part of the P1 control set.');
    }
    record.tape.push(input.action);
    if (input.advance ?? true) {
      record.match.last_step = (record.match.last_step + 1) % LOOP;
    }
    return clone(this.readState(record));
  }

  async getMatchState(matchId: number): Promise<MatchState> {
    return clone(this.readState(this.getRecord(matchId)));
  }

  async rematch(matchId: number): Promise<Match> {
    const original = this.getRecord(matchId);
    this.requireStatus(original.match, ['completed']);
    const id = this.nextMatchId++;
    const match: Match = {
      ...clone(original.match),
      id,
      seed: original.match.seed + 1,
      status: 'ready',
      result: null,
      result_step: null,
      result_p1_hp: null,
      result_p2_hp: null,
      last_step: 0,
      share_token: null,
      telemetry: null,
      allowed_transitions: nextTransitions('ready'),
    };
    this.matches.set(id, { match, tape: [] });
    return clone(match);
  }

  private getToon(id: number): Toon {
    return this.toons.find((toon) => toon.id === id) ?? responseError(404, 'Toon was not found.');
  }

  private getLoadout(id: number): Loadout {
    return this.loadouts.find((loadout) => loadout.id === id) ?? responseError(404, 'Loadout was not found.');
  }

  private getRecord(matchId: number): FixtureMatchRecord {
    requireInteger(matchId, 'match_id');
    return this.matches.get(matchId) ?? responseError(404, 'Match was not found.');
  }

  private validateCatalogChoice(gel: string, fighterId: string, stageId: string): void {
    if (!['acid', 'blue', 'red', 'sodium', 'uv'].includes(gel)) {
      responseError(422, 'gel is not in the fixture catalog.');
    }
    if (!fixtureFighters.some((fighter) => fighter.id === fighterId)) {
      responseError(422, 'fighter_id is not in the fixture catalog.');
    }
    if (!fixtureStages.some((stage) => stage.id === stageId)) {
      responseError(422, 'stage_id is not in the fixture catalog.');
    }
  }

  private transition(matchId: number, from: MatchStatus, to: MatchStatus): Match {
    const record = this.getRecord(matchId);
    this.requireStatus(record.match, [from]);
    record.match.status = to;
    record.match.allowed_transitions = nextTransitions(to);
    return clone(record.match);
  }

  private requireStatus(match: Match, allowed: MatchStatus[]): void {
    if (!allowed.includes(match.status)) {
      responseError(409, `Command is not legal while the match is ${match.status}.`);
    }
  }

  private resultFor(p1Hp: number, p2Hp: number): MatchResult {
    if (p1Hp === p2Hp) {
      return 'draw';
    }
    return p1Hp > p2Hp ? 'p1' : 'p2';
  }

  private readState(record: FixtureMatchRecord): MatchState {
    const { match, tape } = record;
    const effect = tape.reduce(
      (total, action) => ({
        damage: total.damage + actionEffects[action].damage,
        meter: total.meter + actionEffects[action].meter,
      }),
      { damage: 0, meter: 0 },
    );
    const p1Hp = Math.max(0, 100 - Math.floor(tape.length / 3) * 3);
    const p2Hp = Math.max(0, 100 - effect.damage);
    const p1Meter = Math.max(0, Math.min(1, effect.meter));
    const p2Meter = Math.max(0, Math.min(1, tape.length * 0.03));
    const ceremony = match.last_step < 12 ? 'round_call' : match.last_step < 19 ? 'fight_call' : 'in_fight';
    const lastAction = tape.at(-1) ?? null;
    const complete = match.status === 'completed';
    const leading = complete && match.result ? match.result : this.resultFor(p1Hp, p2Hp);
    return {
      match_id: match.id,
      status: match.status,
      step: match.last_step,
      last_step: match.last_step,
      bar: Math.floor(match.last_step / 4),
      ceremony,
      p1: {
        hp: p1Hp,
        meter: p1Meter,
        rounds: complete && leading === 'p1' ? 1 : 0,
        pose: lastAction,
        frame: match.last_step,
        x: 96,
        lift: 0,
      },
      p2: {
        hp: p2Hp,
        meter: p2Meter,
        rounds: complete && leading === 'p2' ? 1 : 0,
        pose: null,
        frame: match.last_step,
        x: 224,
        lift: 0,
      },
      timer: Math.max(0, LOOP - match.last_step),
      combo: tape.length,
      p1_gel: match.p1_gel,
      p2_gel: match.p2_gel,
      p1_fighter_id: match.p1_fighter_id,
      p2_fighter_id: match.p2_fighter_id,
      stage_id: match.stage_id,
      seed: match.seed,
      loop: match.loop,
      leading,
      ann: complete && match.result ? `${match.result.toUpperCase()} RESULT` : ceremony.toUpperCase(),
      sound_hooks: lastAction ? [lastAction] : [],
      extra: { fixture: true, input_count: tape.length },
    };
  }
}
