import {
  decodeCatalog,
  decodeEngine,
  decodeFighters,
  decodeGels,
  decodeHealth,
  decodeKits,
  decodeLoadout,
  decodeLoadouts,
  decodeMatch,
  decodeMatchState,
  decodeStages,
  decodeToon,
  decodeToons,
  decodeUser,
} from '@/lib/decoder';
import { ChoonzClientError, ResponseDecodeError } from '@/lib/errors';
import { FixtureMatchService } from '@/lib/fixture-match-service';
import {
  fixtureCatalog,
  fixtureEngine,
  fixtureFighters,
  fixtureGels,
  fixtureHealth,
  fixtureKits,
  fixtureStages,
  fixtureUser,
} from '@/lib/fixtures';
import { normalizeApiBaseUrl, type RuntimeConfig } from '@/lib/config';
import type {
  CatalogMeta,
  ChoonzUser,
  EngineMeta,
  Fighter,
  FighterKit,
  Gel,
  Health,
  Loadout,
  LoadoutCreateInput,
  Match,
  MatchActInput,
  MatchCompleteInput,
  MatchCreateInput,
  MatchState,
  MatchTickInput,
  Stage,
  Toon,
  ToonCreateInput,
} from '@/lib/types';

export type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;
type Decoder<T> = (value: unknown) => T;
type HttpMethod = 'GET' | 'POST';

export interface ChoonzApi {
  getHealth(): Promise<Health>;
  getMe(): Promise<ChoonzUser>;
  getCatalog(): Promise<CatalogMeta>;
  getEngine(): Promise<EngineMeta>;
  getGels(): Promise<Gel[]>;
  getFighters(): Promise<Fighter[]>;
  getStages(): Promise<Stage[]>;
  getKits(): Promise<FighterKit[]>;
  getToons(): Promise<Toon[]>;
  createToon(input: ToonCreateInput): Promise<Toon>;
  getLoadouts(): Promise<Loadout[]>;
  createLoadout(input: LoadoutCreateInput): Promise<Loadout>;
  createMatch(input: MatchCreateInput): Promise<Match>;
  getMatch(matchId: number): Promise<Match>;
  startMatch(matchId: number): Promise<Match>;
  pauseMatch(matchId: number): Promise<Match>;
  resumeMatch(matchId: number): Promise<Match>;
  completeMatch(matchId: number, input?: MatchCompleteInput): Promise<Match>;
  cancelMatch(matchId: number): Promise<Match>;
  tickMatch(matchId: number, input?: MatchTickInput): Promise<MatchState>;
  actMatch(matchId: number, input: MatchActInput): Promise<MatchState>;
  getMatchState(matchId: number): Promise<MatchState>;
  rematch(matchId: number): Promise<Match>;
}

export interface ChoonzApiClientOptions {
  config: RuntimeConfig;
  getAccessToken: () => Promise<string | null>;
  onUnauthorized?: () => Promise<void> | void;
  fetcher?: FetchLike;
}

/**
 * The one service boundary for both API snapshots and labelled fixture mode.
 * The fixture service is intentionally never passed a token, URL, or fetcher.
 */
export class ChoonzApiClient implements ChoonzApi {
  private readonly fetcher: FetchLike;
  private readonly fixtures = new FixtureMatchService();

  constructor(private readonly options: ChoonzApiClientOptions) {
    this.fetcher = options.fetcher ?? fetch;
  }

  getHealth(): Promise<Health> {
    return this.fromMode('/health', decodeHealth, fixtureHealth, false);
  }

  getMe(): Promise<ChoonzUser> {
    return this.fromMode('/me', decodeUser, fixtureUser, true);
  }

  getCatalog(): Promise<CatalogMeta> {
    return this.fromMode('/catalog', decodeCatalog, fixtureCatalog, true);
  }

  getEngine(): Promise<EngineMeta> {
    return this.fromMode('/catalog/engine', decodeEngine, fixtureEngine, true);
  }

  getGels(): Promise<Gel[]> {
    return this.fromMode('/catalog/gels', decodeGels, fixtureGels, true);
  }

  getFighters(): Promise<Fighter[]> {
    return this.fromMode('/catalog/fighters', decodeFighters, fixtureFighters, true);
  }

  getStages(): Promise<Stage[]> {
    return this.fromMode('/catalog/stages', decodeStages, fixtureStages, true);
  }

  getKits(): Promise<FighterKit[]> {
    return this.fromMode('/catalog/kits', decodeKits, fixtureKits, true);
  }

  getToons(): Promise<Toon[]> {
    return this.fromFightMode('/toons', decodeToons, () => this.fixtures.getToons());
  }

  createToon(input: ToonCreateInput): Promise<Toon> {
    return this.fromFightMode('/toons', decodeToon, () => this.fixtures.createToon(input), 'POST', input);
  }

  getLoadouts(): Promise<Loadout[]> {
    return this.fromFightMode('/loadouts', decodeLoadouts, () => this.fixtures.getLoadouts());
  }

  createLoadout(input: LoadoutCreateInput): Promise<Loadout> {
    return this.fromFightMode(
      '/loadouts',
      decodeLoadout,
      () => this.fixtures.createLoadout(input),
      'POST',
      input,
    );
  }

  createMatch(input: MatchCreateInput): Promise<Match> {
    return this.fromFightMode('/matches', decodeMatch, () => this.fixtures.createMatch(input), 'POST', input);
  }

  getMatch(matchId: number): Promise<Match> {
    return this.fromFightMode(`/matches/${matchId}`, decodeMatch, () => this.fixtures.getMatch(matchId));
  }

  startMatch(matchId: number): Promise<Match> {
    return this.fromFightMode(
      `/matches/${matchId}/start`,
      decodeMatch,
      () => this.fixtures.startMatch(matchId),
      'POST',
    );
  }

  pauseMatch(matchId: number): Promise<Match> {
    return this.fromFightMode(
      `/matches/${matchId}/pause`,
      decodeMatch,
      () => this.fixtures.pauseMatch(matchId),
      'POST',
    );
  }

  resumeMatch(matchId: number): Promise<Match> {
    return this.fromFightMode(
      `/matches/${matchId}/resume`,
      decodeMatch,
      () => this.fixtures.resumeMatch(matchId),
      'POST',
    );
  }

  completeMatch(matchId: number, input: MatchCompleteInput = {}): Promise<Match> {
    return this.fromFightMode(
      `/matches/${matchId}/complete`,
      decodeMatch,
      () => this.fixtures.completeMatch(matchId, input),
      'POST',
      input,
    );
  }

  cancelMatch(matchId: number): Promise<Match> {
    return this.fromFightMode(
      `/matches/${matchId}/cancel`,
      decodeMatch,
      () => this.fixtures.cancelMatch(matchId),
      'POST',
    );
  }

  tickMatch(matchId: number, input: MatchTickInput = {}): Promise<MatchState> {
    return this.fromFightMode(
      `/matches/${matchId}/tick`,
      decodeMatchState,
      () => this.fixtures.tickMatch(matchId, input),
      'POST',
      input,
    );
  }

  actMatch(matchId: number, input: MatchActInput): Promise<MatchState> {
    return this.fromFightMode(
      `/matches/${matchId}/act`,
      decodeMatchState,
      () => this.fixtures.actMatch(matchId, input),
      'POST',
      input,
    );
  }

  getMatchState(matchId: number): Promise<MatchState> {
    return this.fromFightMode(
      `/matches/${matchId}/state`,
      decodeMatchState,
      () => this.fixtures.getMatchState(matchId),
    );
  }

  rematch(matchId: number): Promise<Match> {
    return this.fromFightMode(
      `/matches/${matchId}/rematch`,
      decodeMatch,
      () => this.fixtures.rematch(matchId),
      'POST',
    );
  }

  private async fromFightMode<T>(
    path: string,
    decoder: Decoder<T>,
    fixture: () => Promise<T>,
    method: HttpMethod = 'GET',
    body?: unknown,
  ): Promise<T> {
    if (this.options.config.mode === 'fixtures') {
      return fixture();
    }
    const config = this.requireApiConfiguration();
    return this.request(`${config.apiBaseUrl}${path}`, decoder, true, method, body);
  }

  private async fromMode<T>(
    path: string,
    decoder: Decoder<T>,
    fixture: T,
    requiresAuthentication: boolean,
  ): Promise<T> {
    if (this.options.config.mode === 'fixtures') {
      return fixture;
    }
    const config = this.requireApiConfiguration();
    return this.request(`${config.apiBaseUrl}${path}`, decoder, requiresAuthentication);
  }

  private requireApiConfiguration(): { apiBaseUrl: string } {
    const { config } = this.options;
    if (
      config.mode !== 'api' ||
      !config.apiBaseUrl ||
      config.configurationIssue ||
      normalizeApiBaseUrl(config.apiBaseUrl, config.isProduction) !== config.apiBaseUrl
    ) {
      throw new ChoonzClientError(
        'configuration',
        config.configurationIssue ?? 'CHOONZ API mode is not safely configured.',
      );
    }
    return { apiBaseUrl: config.apiBaseUrl };
  }

  private async request<T>(
    url: string,
    decoder: Decoder<T>,
    requiresAuthentication: boolean,
    method: HttpMethod = 'GET',
    body?: unknown,
  ): Promise<T> {
    const headers: Record<string, string> = { Accept: 'application/json' };
    if (body !== undefined) {
      headers['Content-Type'] = 'application/json';
    }
    if (requiresAuthentication) {
      const accessToken = await this.options.getAccessToken();
      if (!accessToken) {
        throw new ChoonzClientError('authentication', 'Sign in to access CHOONZ data.');
      }
      headers.Authorization = `Bearer ${accessToken}`;
    }

    let response: Response;
    try {
      response = await this.fetcher(url, {
        method,
        headers,
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      });
    } catch {
      throw new ChoonzClientError('network', 'Could not reach the CHOONZ API.');
    }

    if (response.status === 401) {
      try {
        await this.options.onUnauthorized?.();
      } catch {
        // The request still reports an auth failure even if local cleanup races.
      }
      throw new ChoonzClientError('authentication', 'Your session has expired. Sign in again.', 401);
    }

    if (!response.ok) {
      throw new ChoonzClientError(
        'response',
        `CHOONZ API returned ${response.status}.`,
        response.status,
      );
    }

    let payload: unknown;
    try {
      payload = await response.json();
    } catch {
      throw new ChoonzClientError('response', 'CHOONZ API returned invalid JSON.', response.status);
    }

    try {
      return decoder(payload);
    } catch (error) {
      if (error instanceof ResponseDecodeError) {
        throw new ChoonzClientError('response', `CHOONZ API response was malformed: ${error.message}`);
      }
      throw error;
    }
  }
}
