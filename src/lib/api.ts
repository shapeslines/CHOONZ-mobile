import {
  decodeCatalog,
  decodeConnections,
  decodeEngine,
  decodeFighters,
  decodeGels,
  decodeHealth,
  decodeKits,
  decodeLoadout,
  decodeLoadouts,
  decodeMatch,
  decodeMatchState,
  decodeMechanicsReplayReceipt,
  decodeMechanicsScenarioDetail,
  decodeMechanicsScenarioList,
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
  ChoonzConnection,
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
  MechanicsReplayOverrides,
  MechanicsReplayReceipt,
  MechanicsScenarioDetail,
  MechanicsScenarioList,
  Stage,
  Toon,
  ToonCreateInput,
  UserUpdateInput,
} from '@/lib/types';

export type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;
type Decoder<T> = (value: unknown) => T;
type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'DELETE';

const fixtureAccountConnections: ChoonzConnection[] = [
  {
    client_id: 'fixture-scoreboard',
    client_name: 'Fixture Scoreboard',
    scopes: ['profile:read', 'matches:read'],
    created_at: '2026-08-10T00:00:00Z',
  },
];

export interface ChoonzApi {
  getHealth(): Promise<Health>;
  getMe(): Promise<ChoonzUser>;
  updateMe(input: UserUpdateInput): Promise<ChoonzUser>;
  getConnections(): Promise<ChoonzConnection[]>;
  revokeConnection(clientId: string): Promise<void>;
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
  getMechanicsScenarios(): Promise<MechanicsScenarioList>;
  getMechanicsScenario(scenarioId: string): Promise<MechanicsScenarioDetail>;
  replayMechanics(
    scenarioId: string,
    overrides?: MechanicsReplayOverrides,
  ): Promise<MechanicsReplayReceipt>;
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
  private readonly fixtureProfile: ChoonzUser = { ...fixtureUser };
  private readonly fixtureConnections = fixtureAccountConnections.map((connection) => ({
    ...connection,
    scopes: [...connection.scopes],
  }));

  constructor(private readonly options: ChoonzApiClientOptions) {
    this.fetcher = options.fetcher ?? fetch;
  }

  getHealth(): Promise<Health> {
    return this.fromMode('/health', decodeHealth, fixtureHealth, false);
  }

  getMe(): Promise<ChoonzUser> {
    return this.fromMode('/me', decodeUser, () => Promise.resolve({ ...this.fixtureProfile }), true);
  }

  updateMe(input: UserUpdateInput): Promise<ChoonzUser> {
    return this.fromMode(
      '/me',
      decodeUser,
      () => {
        this.fixtureProfile.display_name = input.display_name ?? null;
        return Promise.resolve({ ...this.fixtureProfile });
      },
      true,
      'PATCH',
      input,
    );
  }

  getConnections(): Promise<ChoonzConnection[]> {
    return this.fromMode(
      '/me/connections',
      decodeConnections,
      () =>
        Promise.resolve(
          this.fixtureConnections.map((connection) => ({
            ...connection,
            scopes: [...connection.scopes],
          })),
        ),
      true,
    );
  }

  revokeConnection(clientId: string): Promise<void> {
    return this.fromMode(
      `/me/connections/${encodeURIComponent(clientId)}`,
      null,
      () => {
        const index = this.fixtureConnections.findIndex((connection) => connection.client_id === clientId);
        if (index < 0) {
          throw new ChoonzClientError('response', 'No such connection.', 404);
        }
        this.fixtureConnections.splice(index, 1);
        return Promise.resolve();
      },
      true,
      'DELETE',
      undefined,
      204,
    );
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

  getMechanicsScenarios(): Promise<MechanicsScenarioList> {
    this.requireMechanicsEligibility();
    return this.fromMechanicsMode('/mechanics/scenarios', decodeMechanicsScenarioList);
  }

  getMechanicsScenario(scenarioId: string): Promise<MechanicsScenarioDetail> {
    this.requireMechanicsEligibility();
    return this.fromMechanicsMode(
      `/mechanics/scenarios/${encodeURIComponent(scenarioId)}`,
      decodeMechanicsScenarioDetail,
    );
  }

  replayMechanics(
    scenarioId: string,
    overrides?: MechanicsReplayOverrides,
  ): Promise<MechanicsReplayReceipt> {
    this.requireMechanicsEligibility();
    const body: { scenario_id: string; overrides?: MechanicsReplayOverrides } = {
      scenario_id: scenarioId,
    };
    if (overrides) {
      body.overrides = overrides;
    }
    return this.fromMechanicsMode('/mechanics/replay', decodeMechanicsReplayReceipt, 'POST', body);
  }

  /**
   * The lab is API-only and developer-only. Any ineligible configuration
   * fails locally before the API URL, token, or fetcher is ever observed.
   */
  private requireMechanicsEligibility(): void {
    const { config } = this.options;
    if (!config.mechanicsLabEnabled || config.mode !== 'api' || config.isProduction) {
      throw new ChoonzClientError(
        'configuration',
        'The mechanics lab requires an eligible non-production API configuration.',
      );
    }
  }

  private async fromMechanicsMode<T>(
    path: string,
    decoder: Decoder<T>,
    method: HttpMethod = 'GET',
    body?: unknown,
  ): Promise<T> {
    const config = this.requireApiConfiguration();
    return this.request(`${config.apiBaseUrl}${path}`, decoder, true, method, body);
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
    decoder: Decoder<T> | null,
    fixture: T | (() => Promise<T>),
    requiresAuthentication: boolean,
    method: HttpMethod = 'GET',
    body?: unknown,
    expectedStatus?: number,
  ): Promise<T> {
    if (this.options.config.mode === 'fixtures') {
      return typeof fixture === 'function' ? await (fixture as () => Promise<T>)() : fixture;
    }
    const config = this.requireApiConfiguration();
    return this.request(
      `${config.apiBaseUrl}${path}`,
      decoder,
      requiresAuthentication,
      method,
      body,
      expectedStatus,
    );
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
    decoder: Decoder<T> | null,
    requiresAuthentication: boolean,
    method: HttpMethod = 'GET',
    body?: unknown,
    expectedStatus?: number,
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

    if (expectedStatus !== undefined && response.status !== expectedStatus) {
      throw new ChoonzClientError(
        'response',
        `CHOONZ API returned ${response.status}; expected ${expectedStatus}.`,
        response.status,
      );
    }

    if (decoder === null) {
      return undefined as T;
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
