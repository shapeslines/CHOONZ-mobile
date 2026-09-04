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
  SUPPORTED_MECHANICS_ENGINE_REVISIONS,
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
// Mechanics lab (ARC677 P3) â€” API-only, fail-closed client boundary.
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

  it('accepts every supported engine revision and rejects the rest', () => {
    expect(SUPPORTED_MECHANICS_ENGINE_REVISIONS).toEqual(['1', '2']);
    for (const engine_revision of SUPPORTED_MECHANICS_ENGINE_REVISIONS) {
      expect(decodeMechanicsScenarioList({ ...scenarioList, engine_revision })).toMatchObject({
        engine_revision,
      });
      expect(decodeMechanicsScenarioDetail({ ...scenarioDetail, engine_revision })).toMatchObject({
        engine_revision,
      });
      expect(decodeMechanicsReplayReceipt({ ...replayReceipt, engine_revision })).toMatchObject({
        engine_revision,
      });
    }
    for (const engine_revision of ['3', '', '2.0']) {
      expect(() => decodeMechanicsScenarioList({ ...scenarioList, engine_revision })).toThrow(
        ResponseDecodeError,
      );
      expect(() => decodeMechanicsReplayReceipt({ ...replayReceipt, engine_revision })).toThrow(
        ResponseDecodeError,
      );
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

  it('deletes the account with a typed confirm body and 204 contract', async () => {
    let receivedInput = '';
    const client = new ChoonzApiClient({
      config: apiConfig,
      getAccessToken: async () => 'access-token',
      fetcher: async (_input, init) => {
        receivedInput = String(init?.body ?? '');
        return new Response(null, { status: 204 });
      },
    });

    await expect(client.deleteAccount()).resolves.toBeUndefined();
    expect(receivedInput).toBe(JSON.stringify({ confirm: true }));
  });

  it('rejects account deletion with the decoded 422 detail', async () => {
    const client = new ChoonzApiClient({
      config: apiConfig,
      getAccessToken: async () => 'access-token',
      fetcher: async () =>
        new Response(
          JSON.stringify({
            detail: { code: 'confirm_required', message: 'Deletion requires confirm=true.' },
            error_id: 'err-1',
          }),
          { status: 422, headers: { 'Content-Type': 'application/json' } },
        ),
    });

    await expect(client.deleteAccount()).rejects.toMatchObject({
      kind: 'response',
      status: 422,
      detail: { code: 'confirm_required', message: 'Deletion requires confirm=true.' },
    });
  });

  it('fails closed for account deletion in fixture mode', async () => {
    const fixtureConfig = resolveAppConfig({ EXPO_PUBLIC_CHOONZ_MODE: 'fixtures' }, true);
    const client = new ChoonzApiClient({
      config: fixtureConfig,
      getAccessToken: async () => null,
    });
    await expect(client.deleteAccount()).rejects.toMatchObject({ status: 403 });
  });

  it('decodes the skins catalog in fixture mode', async () => {
    const fixtureConfig = resolveAppConfig({ EXPO_PUBLIC_CHOONZ_MODE: 'fixtures' }, true);
    const client = new ChoonzApiClient({
      config: fixtureConfig,
      getAccessToken: async () => null,
    });
    const catalog = await client.getSkins();
    expect(catalog.schema_version).toBe('1.0');
    expect(catalog.skins).toHaveLength(13);
    expect(catalog.skins.find((skin) => skin.id === 'gel:sodium')?.default).toBe(true);
  });

  it('attaches object-valued detail to 4xx errors and keeps string / empty detail behaviour', async () => {
    const make = (body: BodyInit | null, status: number) =>
      new ChoonzApiClient({
        config: apiConfig,
        getAccessToken: async () => 'access-token',
        fetcher: async () => new Response(body, { status, headers: { 'Content-Type': 'application/json' } }),
      });
    await expect(
      make(JSON.stringify({ detail: { code: 'x', message: 'm', receipt: { r: 1 } }, error_id: 'e' }), 409).getMe(),
    ).rejects.toMatchObject({
      kind: 'response',
      status: 409,
      detail: { code: 'x', message: 'm', extra: { receipt: { r: 1 } } },
    });
    await expect(make(JSON.stringify({ detail: 'nope' }), 403).getMe()).rejects.toMatchObject({
      status: 403,
      detail: { code: 'unknown', message: 'nope' },
    });
    const empty = await make(null, 403).getMe().catch((error: unknown) => error);
    expect(empty).toBeInstanceOf(ChoonzClientError);
    expect((empty as ChoonzClientError).detail).toBeUndefined();
  });

  it('unlockSkin returns a granted receipt from a 200', async () => {
    let requested = '';
    let method = '';
    const client = new ChoonzApiClient({
      config: apiConfig,
      getAccessToken: async () => 'access-token',
      fetcher: async (input, init) => {
        requested = input;
        method = init?.method ?? '';
        return Response.json({
          skin_id: 'gel:sodium-ember',
          source: 'earnable',
          granted_at: '2026-09-03T00:00:00Z',
          condition: { id: 'complete_n_matches', required: 5, observed: 5 },
        });
      },
    });
    const outcome = await client.unlockSkin('gel:sodium-ember');
    expect(requested).toBe('https://api.choonz.example/me/skins/gel%3Asodium-ember/unlock');
    expect(method).toBe('POST');
    expect(outcome).toMatchObject({ status: 'granted', receipt: { condition: { observed: 5 } } });
  });

  it('unlockSkin surfaces a 403 condition report without throwing', async () => {
    const client = new ChoonzApiClient({
      config: apiConfig,
      getAccessToken: async () => 'access-token',
      fetcher: async () =>
        new Response(
          JSON.stringify({
            detail: {
              code: 'condition_not_met',
              message: 'not yet',
              condition: { id: 'complete_n_matches', required: 5, observed: 2 },
            },
          }),
          { status: 403, headers: { 'Content-Type': 'application/json' } },
        ),
    });
    await expect(client.unlockSkin('gel:sodium-ember')).resolves.toEqual({
      status: 'condition_not_met',
      condition: { id: 'complete_n_matches', required: 5, observed: 2 },
    });
  });

  it.each([404, 422])('unlockSkin rethrows %i', async (status) => {
    const client = new ChoonzApiClient({
      config: apiConfig,
      getAccessToken: async () => 'access-token',
      fetcher: async () => new Response(null, { status }),
    });
    await expect(client.unlockSkin('gel:nope')).rejects.toMatchObject({ kind: 'response', status });
  });

  it('unlockSkin rethrows a 403 with an unknown code', async () => {
    const client = new ChoonzApiClient({
      config: apiConfig,
      getAccessToken: async () => 'access-token',
      fetcher: async () =>
        new Response(JSON.stringify({ detail: { code: 'weird' } }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        }),
    });
    await expect(client.unlockSkin('gel:sodium-ember')).rejects.toMatchObject({ status: 403 });
  });

  it('fixture unlock fails closed until five matches complete, then persists the grant', async () => {
    const fixtureConfig = resolveAppConfig({ EXPO_PUBLIC_CHOONZ_MODE: 'fixtures' }, true);
    const client = new ChoonzApiClient({ config: fixtureConfig, getAccessToken: async () => null });
    await expect(client.unlockSkin('gel:sodium-ember')).resolves.toMatchObject({
      status: 'condition_not_met',
      condition: { required: 5, observed: 0 },
    });
    await expect(client.unlockSkin('gel:nope')).rejects.toMatchObject({ status: 404 });
    await expect(client.unlockSkin('gel:red')).rejects.toMatchObject({ status: 422 });

    const toon = (await client.getToons())[0];
    if (!toon) {
      throw new Error('fixture toons must not be empty');
    }
    for (let i = 0; i < 5; i += 1) {
      const match = await client.createMatch({ p1_toon_id: toon.id });
      await client.startMatch(match.id);
      await client.completeMatch(match.id);
    }
    await expect(client.unlockSkin('gel:sodium-ember')).resolves.toMatchObject({ status: 'granted' });
    const loadout = await client.getMySkins();
    expect(loadout.owned.map((grant) => grant.skin_id)).toEqual(['gel:sodium-ember']);
    const again = await client.updateMySkins({ kind: 'ui_theme', skin_id: 'gel:sodium-ember' });
    expect(again.owned).toHaveLength(1);
    expect(again.selection.ui_theme).toBe('gel:sodium-ember');
  });
});
