import {
  decodeCatalog,
  decodeEngine,
  decodeFighters,
  decodeGels,
  decodeHealth,
  decodeKits,
  decodeStages,
  decodeUser,
} from '@/lib/decoder';
import { ChoonzClientError, ResponseDecodeError } from '@/lib/errors';
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
import type { RuntimeConfig } from '@/lib/config';
import type {
  CatalogMeta,
  ChoonzUser,
  EngineMeta,
  Fighter,
  FighterKit,
  Gel,
  Health,
  Stage,
} from '@/lib/types';

export type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;
type Decoder<T> = (value: unknown) => T;

export interface ChoonzApiClientOptions {
  config: RuntimeConfig;
  getAccessToken: () => Promise<string | null>;
  onUnauthorized?: () => Promise<void> | void;
  fetcher?: FetchLike;
}

export class ChoonzApiClient {
  private readonly fetcher: FetchLike;

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
    if (config.mode !== 'api' || !config.apiBaseUrl || config.configurationIssue) {
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
  ): Promise<T> {
    const headers: Record<string, string> = { Accept: 'application/json' };
    if (requiresAuthentication) {
      const accessToken = await this.options.getAccessToken();
      if (!accessToken) {
        throw new ChoonzClientError('authentication', 'Sign in to access CHOONZ data.');
      }
      headers.Authorization = `Bearer ${accessToken}`;
    }

    let response: Response;
    try {
      response = await this.fetcher(url, { method: 'GET', headers });
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
