import { describe, expect, it } from 'vitest';

import { ChoonzApiClient } from '../src/lib/api';
import { resolveAppConfig } from '../src/lib/config';
import {
  decodeConnection,
  decodeHealth,
  decodeKits,
  decodeMechanicsReplayReceipt,
  decodeMechanicsScenarioDetail,
  decodeMechanicsScenarioList,
} from '../src/lib/decoder';
import { ChoonzClientError, ResponseDecodeError } from '../src/lib/errors';

const apiConfig = resolveAppConfig(
  {
    EXPO_PUBLIC_CHOONZ_MODE: 'api',
    EXPO_PUBLIC_CHOONZ_API_BASE_URL: 'https://api.choonz.example/',
  },
  true,
);

describe('CHOONZ API client', () => {
  it('sends the Supabase access token as a bearer token for protected endpoints', async () => {
    let receivedHeaders: HeadersInit | undefined;
    const client = new ChoonzApiClient({
      config: apiConfig,
      getAccessToken: async () => 'access-token',
      fetcher: async (_input, init) => {
        receivedHeaders = init?.headers;
        return Response.json({
          id: 7,
          email: 'fighter@choonz.example',
          display_name: 'Fighter',
          created_at: '2026-08-10T00:00:00Z',
        });
      },
    });

    await expect(client.getMe()).resolves.toMatchObject({ id: 7 });
    expect(receivedHeaders).toMatchObject({ Authorization: 'Bearer access-token' });
  });

  it('updates the profile through the typed PATCH contract', async () => {
    let receivedInput = '';
    let receivedInit: RequestInit | undefined;
    const client = new ChoonzApiClient({
      config: apiConfig,
      getAccessToken: async () => 'access-token',
      fetcher: async (input, init) => {
        receivedInput = input;
        receivedInit = init;
        return Response.json({
          id: 7,
          email: 'fighter@choonz.example',
          display_name: 'Updated Fighter',
          created_at: '2026-08-10T00:00:00Z',
        });
      },
    });

    await expect(client.updateMe({ display_name: 'Updated Fighter' })).resolves.toMatchObject({
      display_name: 'Updated Fighter',
    });
    expect(receivedInput).toBe('https://api.choonz.example/me');
    expect(receivedInit?.method).toBe('PATCH');
    expect(JSON.parse(String(receivedInit?.body))).toEqual({ display_name: 'Updated Fighter' });
  });

  it('decodes connection lists and revokes a URL-encoded client id without reading a body', async () => {
    const requests: { input: string; init?: RequestInit }[] = [];
    const client = new ChoonzApiClient({
      config: apiConfig,
      getAccessToken: async () => 'access-token',
      fetcher: async (input, init) => {
        requests.push({ input, init });
        if (init?.method === 'DELETE') {
          return new Response(null, { status: 204 });
        }
        return Response.json([
          {
            client_id: 'cool-game',
            client_name: 'Cool Game',
            scopes: ['profile:read'],
            created_at: '2026-08-10T00:00:00Z',
          },
        ]);
      },
    });

    await expect(client.getConnections()).resolves.toEqual([
      {
        client_id: 'cool-game',
        client_name: 'Cool Game',
        scopes: ['profile:read'],
        created_at: '2026-08-10T00:00:00Z',
      },
    ]);
    await expect(client.revokeConnection('cool game/1')).resolves.toBeUndefined();
    expect(requests[1]?.input).toBe('https://api.choonz.example/me/connections/cool%20game%2F1');
    expect(requests[1]?.init?.method).toBe('DELETE');
    expect(requests[1]?.init?.headers).toMatchObject({ Authorization: 'Bearer access-token' });
  });

  it('keeps profile mutations fixture-local and never reads a live token or URL', async () => {
    let tokenReads = 0;
    let fetches = 0;
    const client = new ChoonzApiClient({
      config: resolveAppConfig({ EXPO_PUBLIC_CHOONZ_MODE: 'fixtures' }, false),
      getAccessToken: async () => {
        tokenReads += 1;
        return 'should-not-be-read';
      },
      fetcher: async () => {
        fetches += 1;
        return Response.json({});
      },
    });

    await expect(client.updateMe({ display_name: 'Practice Fighter' })).resolves.toMatchObject({
      display_name: 'Practice Fighter',
    });
    await expect(client.getMe()).resolves.toMatchObject({ display_name: 'Practice Fighter' });
    await expect(client.getConnections()).resolves.toMatchObject([
      { client_id: 'fixture-scoreboard', client_name: 'Fixture Scoreboard' },
    ]);
    await expect(client.revokeConnection('fixture-scoreboard')).resolves.toBeUndefined();
    await expect(client.getConnections()).resolves.toEqual([]);
    await expect(client.revokeConnection('missing')).rejects.toMatchObject({ status: 404 });
    expect(tokenReads).toBe(0);
    expect(fetches).toBe(0);
  });

  it('requires the revoke endpoint to return exactly 204', async () => {
    const client = new ChoonzApiClient({
      config: apiConfig,
      getAccessToken: async () => 'access-token',
      fetcher: async () => Response.json({ ok: true }),
    });

    await expect(client.revokeConnection('cool-game')).rejects.toMatchObject({
      kind: 'response',
      status: 200,
    });
  });

  it.each([403, 404, 422])('preserves exact account error status %i', async (status) => {
    const client = new ChoonzApiClient({
      config: apiConfig,
      getAccessToken: async () => 'access-token',
      fetcher: async () => new Response(null, { status }),
    });

    await expect(client.updateMe({ display_name: 'Still Local' })).rejects.toMatchObject({
      kind: 'response',
      status,
    });
  });

  it('rejects malformed account responses and reports network failures', async () => {
    const malformed = new ChoonzApiClient({
      config: apiConfig,
      getAccessToken: async () => 'access-token',
      fetcher: async () => Response.json({ display_name: 'missing required fields' }),
    });
    const offline = new ChoonzApiClient({
      config: apiConfig,
      getAccessToken: async () => 'access-token',
      fetcher: async () => {
        throw new Error('offline');
      },
    });

    await expect(malformed.updateMe({ display_name: null })).rejects.toMatchObject({
      kind: 'response',
    });
    await expect(malformed.getConnections()).rejects.toMatchObject({ kind: 'response' });
    await expect(offline.getConnections()).rejects.toMatchObject({ kind: 'network' });
  });

  it('invalidates the local session when the API returns 401', async () => {
    let invalidations = 0;
    const client = new ChoonzApiClient({
      config: apiConfig,
      getAccessToken: async () => 'expired-token',
      onUnauthorized: async () => {
        invalidations += 1;
      },
      fetcher: async () => new Response(null, { status: 401 }),
    });

    await expect(client.getCatalog()).rejects.toMatchObject({
      kind: 'authentication',
      status: 401,
    });
    expect(invalidations).toBe(1);
  });

  it('refuses to acquire or send a bearer token to a plaintext remote endpoint', async () => {
    let tokenReads = 0;
    let fetches = 0;
    const client = new ChoonzApiClient({
      config: { ...apiConfig, apiBaseUrl: 'http://api.choonz.example' },
      getAccessToken: async () => {
        tokenReads += 1;
        return 'access-token';
      },
      fetcher: async () => {
        fetches += 1;
        return Response.json({});
      },
    });

    await expect(client.getMe()).rejects.toMatchObject({ kind: 'configuration' });
    expect(tokenReads).toBe(0);
    expect(fetches).toBe(0);
  });

  it('rejects malformed response payloads instead of accepting an unsafe shape', () => {
    expect(() => decodeHealth({ status: 'ok', env: 'dev', version: 'x', engine_loop: '128' })).toThrow(
      ResponseDecodeError,
    );
    expect(() => decodeKits([{ fighter_id: 'AXEL', moves: 'not-an-array' }])).toThrow(
      ResponseDecodeError,
    );
    expect(() =>
      decodeConnection({
        client_id: 'cool-game',
        client_name: 'Cool Game',
        scopes: ['profile:read'],
        created_at: 'not-a-date',
      }),
    ).toThrow(ResponseDecodeError);
  });
});

// --------------------------------------------------------------------------- //
// Mechanics lab (ARC677 P3) — API-only, fail-closed client boundary.
// --------------------------------------------------------------------------- //

const mechanicsIdentity = {
  schema_version: '1.0',
  corpus_version: '1',
  corpus_hash: '66bb04718599049f78be740df497de4e118cee123bd47f6941513035ce0d23be',
  engine_revision: '1',
};

const scenarioSummary = {
  id: 'seed0-classic',
  title: 'Classic opening bars (seed 0)',
  description: 'The unchanged AHFight scripted loop.',
  tags: ['golden'],
  seed: 0,
  fighters: { p1: 'AXEL', p2: 'VEX' },
  gels: { p1: 'sodium', p2: 'blue' },
  stage_id: 'rooftop',
  checkpoint_count: 7,
};

const scenarioList = { ...mechanicsIdentity, scenarios: [scenarioSummary] };

const scenarioDetail = {
  ...mechanicsIdentity,
  scenario: {
    ...scenarioSummary,
    input_tape: [],
    checkpoints: [0, 12, 32, 44, 60, 98, 127],
    expected_checkpoints: {
      '0': { step: 0, bar: 0, p1: { hp: 0.78, meter: 0.24, rounds: 1 }, p2: { hp: 0.9, meter: 0.32, rounds: 0 }, timer: 60, combo: 0 },
    },
  },
};

const replayReceipt = {
  ...mechanicsIdentity,
  scenario_id: 'seed0-classic',
  overridden: false,
  normalized_inputs: {
    seed: 0,
    p1_fighter_id: 'AXEL',
    p2_fighter_id: 'VEX',
    p1_gel: 'sodium',
    p2_gel: 'blue',
    stage_id: 'rooftop',
    input_tape: [],
    checkpoints: [0, 12, 32, 44, 60, 98, 127],
  },
  actual_checkpoints: {
    '0': { step: 0, bar: 0, p1: { hp: 0.78, meter: 0.24, rounds: 1 }, p2: { hp: 0.9, meter: 0.32, rounds: 0 }, timer: 60, combo: 0 },
  },
  expected_checkpoints: {
    '0': { step: 0, bar: 0, p1: { hp: 0.78, meter: 0.24, rounds: 1 }, p2: { hp: 0.9, meter: 0.32, rounds: 0 }, timer: 60, combo: 0 },
  },
  diffs: [],
  verdict: 'pass',
};

function mechanicsApiConfig() {
  return resolveAppConfig(
    {
      EXPO_PUBLIC_CHOONZ_MODE: 'api',
      EXPO_PUBLIC_CHOONZ_API_BASE_URL: 'https://api.choonz.example/',
      EXPO_PUBLIC_CHOONZ_ENABLE_MECHANICS_LAB: 'true',
    },
    false,
  );
}

describe('CHOONZ mechanics lab client', () => {
  it('lists scenarios as an authenticated API-only call', async () => {
    let received: { url?: string; init?: RequestInit } = {};
    const client = new ChoonzApiClient({
      config: mechanicsApiConfig(),
      getAccessToken: async () => 'access-token',
      fetcher: async (input, init) => {
        received = { url: String(input), init };
        return Response.json(scenarioList);
      },
    });

    await expect(client.getMechanicsScenarios()).resolves.toMatchObject({
      corpus_hash: mechanicsIdentity.corpus_hash,
    });
    expect(received.url).toBe('https://api.choonz.example/mechanics/scenarios');
    expect(received.init?.headers).toMatchObject({ Authorization: 'Bearer access-token' });
  });

  it('fetches one scenario by id with an escaped path segment', async () => {
    let url = '';
    const client = new ChoonzApiClient({
      config: mechanicsApiConfig(),
      getAccessToken: async () => 'access-token',
      fetcher: async (input) => {
        url = String(input);
        return Response.json(scenarioDetail);
      },
    });

    await expect(client.getMechanicsScenario('seed0-classic')).resolves.toMatchObject({
      scenario: { id: 'seed0-classic' },
    });
    expect(url).toBe('https://api.choonz.example/mechanics/scenarios/seed0-classic');
  });

  it('posts a replay request and decodes the server verdict verbatim', async () => {
    let body: unknown;
    const client = new ChoonzApiClient({
      config: mechanicsApiConfig(),
      getAccessToken: async () => 'access-token',
      fetcher: async (_input, init) => {
        body = init?.body ? JSON.parse(String(init.body)) : undefined;
        return Response.json(replayReceipt);
      },
    });

    await expect(client.replayMechanics('seed0-classic')).resolves.toMatchObject({
      verdict: 'pass',
      diffs: [],
    });
    expect(body).toEqual({ scenario_id: 'seed0-classic' });
  });

  it('fails locally for ineligible configurations before observing URL, token, or fetcher', async () => {
    const ineligibleConfigs = [
      resolveAppConfig({}, false),
      resolveAppConfig(
        {
          EXPO_PUBLIC_CHOONZ_MODE: 'api',
          EXPO_PUBLIC_CHOONZ_API_BASE_URL: 'https://api.choonz.example',
        },
        true,
      ),
      resolveAppConfig(
        {
          EXPO_PUBLIC_CHOONZ_MODE: 'api',
          EXPO_PUBLIC_CHOONZ_API_BASE_URL: 'https://api.choonz.example',
          EXPO_PUBLIC_CHOONZ_ENABLE_MECHANICS_LAB: 'true',
        },
        true,
      ),
    ];

    for (const config of ineligibleConfigs) {
      let tokenReads = 0;
      let fetches = 0;
      const client = new ChoonzApiClient({
        config,
        getAccessToken: async () => {
          tokenReads += 1;
          return 'access-token';
        },
        fetcher: async () => {
          fetches += 1;
          return Response.json({});
        },
      });

      await expect(async () => client.getMechanicsScenarios()).rejects.toMatchObject({
        kind: 'configuration',
      });
      expect(tokenReads).toBe(0);
      expect(fetches).toBe(0);
    }
  });

  it('awaits 401 session invalidation and preserves 403/404/422 statuses', async () => {
    let invalidations = 0;
    const client = new ChoonzApiClient({
      config: mechanicsApiConfig(),
      getAccessToken: async () => 'expired-token',
      onUnauthorized: async () => {
        invalidations += 1;
      },
      fetcher: async () => new Response(null, { status: 401 }),
    });
    await expect(client.getMechanicsScenarios()).rejects.toMatchObject({
      kind: 'authentication',
      status: 401,
    });
    expect(invalidations).toBe(1);

    for (const status of [403, 404, 422]) {
      const strict = new ChoonzApiClient({
        config: mechanicsApiConfig(),
        getAccessToken: async () => 'access-token',
        fetcher: async () => new Response(null, { status }),
      });
      await expect(strict.getMechanicsScenario('missing')).rejects.toMatchObject({
        kind: 'response',
        status,
      });
    }
  });

  it('rejects unsupported corpus versions instead of rendering controls', () => {
    expect(() => decodeMechanicsScenarioList({ ...scenarioList, engine_revision: '9' })).toThrow(
      ResponseDecodeError,
    );
    expect(() => decodeMechanicsScenarioList({ ...scenarioList, schema_version: '2.0' })).toThrow(
      ResponseDecodeError,
    );
    expect(() => decodeMechanicsScenarioDetail({ ...scenarioDetail, corpus_version: '2' })).toThrow(
      ResponseDecodeError,
    );
    expect(() => decodeMechanicsScenarioDetail({ ...scenarioDetail, corpus_version: '' })).toThrow(
      ResponseDecodeError,
    );
  });

  it('rejects malformed receipts, diffs, and verdicts', () => {
    expect(() => decodeMechanicsReplayReceipt({ ...replayReceipt, verdict: 'maybe' })).toThrow(
      ResponseDecodeError,
    );
    expect(() =>
      decodeMechanicsReplayReceipt({ ...replayReceipt, diffs: [{ path: 'x' }] }),
    ).toThrow(ResponseDecodeError);
    expect(() =>
      decodeMechanicsReplayReceipt({
        ...replayReceipt,
        normalized_inputs: { ...replayReceipt.normalized_inputs, seed: 'zero' },
      }),
    ).toThrow(ResponseDecodeError);
  });

  it('preserves ordered diffs and the server verdict without recomputation', () => {
    const receipt = decodeMechanicsReplayReceipt({
      ...replayReceipt,
      overridden: true,
      verdict: 'not_applicable',
      diffs: [
        { path: 'checkpoints.2.p1.hp', expected: 0.78, actual: 0.81 },
        { path: 'checkpoints.10.timer', expected: 59, actual: 60 },
      ],
    });
    expect(receipt.verdict).toBe('not_applicable');
    expect(receipt.diffs.map((diff) => diff.path)).toEqual([
      'checkpoints.2.p1.hp',
      'checkpoints.10.timer',
    ]);
  });

  it('surfaces network and malformed-response failures distinctly', async () => {
    const offline = new ChoonzApiClient({
      config: mechanicsApiConfig(),
      getAccessToken: async () => 'access-token',
      fetcher: async () => {
        throw new Error('socket hang up');
      },
    });
    await expect(offline.getMechanicsScenarios()).rejects.toMatchObject({ kind: 'network' });

    const malformed = new ChoonzApiClient({
      config: mechanicsApiConfig(),
      getAccessToken: async () => 'access-token',
      fetcher: async () => new Response('not json', { status: 200 }),
    });
    await expect(malformed.getMechanicsScenarios()).rejects.toThrow(ChoonzClientError);
  });
});
