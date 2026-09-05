import { describe, expect, it } from 'vitest';

import { ChoonzApiClient } from '../src/lib/api';
import {
  decodeMechanicsReplayReceipt,
  decodeMechanicsScenarioDetail,
  decodeMechanicsScenarioList,
} from '../src/lib/decoder';
import { resolveAppConfig } from '../src/lib/config';
import { ResponseDecodeError } from '../src/lib/errors';

const identity = {
  schema_version: '1.0',
  corpus_version: '1',
  corpus_hash: '66bb04718599049f78be740df497de4e118cee123bd47f6941513035ce0d23be',
  engine_revision: '1',
};

const summary = {
  id: 'seed0-classic',
  title: 'Classic opening bars (seed 0)',
  description: 'The unchanged AHFight scripted loop.',
  tags: ['golden'],
  seed: 0,
  fighters: { p1: 'AXEL', p2: 'VEX' },
  gels: { p1: 'sodium', p2: 'blue' },
  stage_id: 'rooftop',
  checkpoint_count: 1,
};

const checkpoint = {
  step: 0,
  bar: 0,
  p1: { hp: 0.78, meter: 0.24, rounds: 1 },
  p2: { hp: 0.9, meter: 0.32, rounds: 0 },
  timer: 60,
  combo: 0,
};

const scenarioList = { ...identity, scenarios: [summary] };
const scenarioDetail = {
  ...identity,
  scenario: {
    ...summary,
    input_tape: [{ step: 30, side: 'p1', action: 'heavy' }],
    checkpoints: [0],
    expected_checkpoints: { '0': checkpoint },
  },
};
const replayReceipt = {
  ...identity,
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
    checkpoints: [0],
  },
  actual_checkpoints: { '0': checkpoint },
  expected_checkpoints: { '0': checkpoint },
  diffs: [],
  verdict: 'pass',
};

function mechanicsConfig() {
  return resolveAppConfig(
    {
      EXPO_PUBLIC_CHOONZ_MODE: 'api',
      EXPO_PUBLIC_CHOONZ_API_BASE_URL: 'https://api.choonz.example/',
      EXPO_PUBLIC_CHOONZ_ENABLE_MECHANICS_LAB: 'true',
    },
    false,
  );
}

describe('CHOONZ mechanics lab typed client', () => {
  it.each(['1', '2'])('accepts revision %s across list, detail and replay identities', (revision) => {
    expect(decodeMechanicsScenarioList({ ...scenarioList, engine_revision: revision }).engine_revision).toBe(revision);
    expect(decodeMechanicsScenarioDetail({ ...scenarioDetail, engine_revision: revision }).engine_revision).toBe(revision);
    expect(decodeMechanicsReplayReceipt({ ...replayReceipt, engine_revision: revision }).engine_revision).toBe(revision);
  });

  it.each(['3', '', null, 2, undefined])('rejects unsupported revision %s on every mechanics shape', (revision) => {
    expect(() => decodeMechanicsScenarioList({ ...scenarioList, engine_revision: revision })).toThrow(ResponseDecodeError);
    expect(() => decodeMechanicsScenarioDetail({ ...scenarioDetail, engine_revision: revision })).toThrow(ResponseDecodeError);
    expect(() => decodeMechanicsReplayReceipt({ ...replayReceipt, engine_revision: revision })).toThrow(ResponseDecodeError);
  });

  it('lists scenarios with the authenticated API boundary', async () => {
    let receivedUrl = '';
    let receivedInit: RequestInit | undefined;
    const client = new ChoonzApiClient({
      config: mechanicsConfig(),
      getAccessToken: async () => 'access-token',
      fetcher: async (url, init) => {
        receivedUrl = url;
        receivedInit = init;
        return Response.json(scenarioList);
      },
    });

    await expect(client.getMechanicsScenarios()).resolves.toMatchObject({
      corpus_hash: identity.corpus_hash,
      scenarios: [{ id: 'seed0-classic' }],
    });
    expect(receivedUrl).toBe('https://api.choonz.example/mechanics/scenarios');
    expect(receivedInit?.method).toBe('GET');
    expect(receivedInit?.headers).toMatchObject({ Authorization: 'Bearer access-token' });
  });

  it('fetches a scenario detail with an escaped path segment', async () => {
    let receivedUrl = '';
    const client = new ChoonzApiClient({
      config: mechanicsConfig(),
      getAccessToken: async () => 'access-token',
      fetcher: async (url) => {
        receivedUrl = url;
        return Response.json(scenarioDetail);
      },
    });

    await expect(client.getMechanicsScenario('seed 0/classic')).resolves.toMatchObject({
      scenario: { id: 'seed0-classic' },
    });
    expect(receivedUrl).toBe(
      'https://api.choonz.example/mechanics/scenarios/seed%200%2Fclassic',
    );
  });

  it('posts replay requests and returns the server receipt without grading locally', async () => {
    let receivedInit: RequestInit | undefined;
    const client = new ChoonzApiClient({
      config: mechanicsConfig(),
      getAccessToken: async () => 'access-token',
      fetcher: async (_url, init) => {
        receivedInit = init;
        return Response.json({
          ...replayReceipt,
          verdict: 'not_applicable',
          overridden: true,
          diffs: [
            { path: 'checkpoints.10.timer', expected: 59, actual: 60 },
            { path: 'checkpoints.2.p1.hp', expected: 0.78, actual: 0.81 },
          ],
        });
      },
    });

    await expect(client.replayMechanics('seed0-classic', { seed: 0 })).resolves.toMatchObject({
      verdict: 'not_applicable',
      overridden: true,
      diffs: [
        { path: 'checkpoints.10.timer' },
        { path: 'checkpoints.2.p1.hp' },
      ],
    });
    expect(receivedInit?.method).toBe('POST');
    expect(receivedInit?.headers).toMatchObject({
      Authorization: 'Bearer access-token',
      'Content-Type': 'application/json',
    });
    expect(JSON.parse(String(receivedInit?.body))).toEqual({
      scenario_id: 'seed0-classic',
      overrides: { seed: 0 },
    });
  });

  it('fails closed before observing a token, URL, or fetcher when the lab is ineligible', async () => {
    const configs = [
      resolveAppConfig({}, false),
      resolveAppConfig(
        {
          EXPO_PUBLIC_CHOONZ_MODE: 'api',
          EXPO_PUBLIC_CHOONZ_API_BASE_URL: 'https://api.choonz.example',
          EXPO_PUBLIC_CHOONZ_ENABLE_MECHANICS_LAB: 'true',
        },
        true,
      ),
      resolveAppConfig(
        {
          EXPO_PUBLIC_CHOONZ_MODE: 'api',
          EXPO_PUBLIC_CHOONZ_API_BASE_URL: 'https://api.choonz.example',
        },
        false,
      ),
    ];

    for (const config of configs) {
      Object.defineProperty(config, 'apiBaseUrl', {
        get: () => { throw new Error('Ineligible lab observed the API URL'); },
      });
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

      for (const call of [
        () => client.getMechanicsScenarios('2'),
        () => client.getMechanicsScenario('seed0-classic', '2'),
        () => client.replayMechanics('seed0-classic', { seed: 0 }, '2'),
      ]) {
        await expect((async () => call())()).rejects.toMatchObject({ kind: 'configuration' });
      }
      expect(tokenReads).toBe(0);
      expect(fetches).toBe(0);
    }
  });

  it('preserves 401 invalidation and backend status codes', async () => {
    let invalidations = 0;
    const unauthorized = new ChoonzApiClient({
      config: mechanicsConfig(),
      getAccessToken: async () => 'expired-token',
      onUnauthorized: async () => {
        invalidations += 1;
      },
      fetcher: async () => new Response(null, { status: 401 }),
    });

    await expect(unauthorized.getMechanicsScenarios()).rejects.toMatchObject({
      kind: 'authentication',
      status: 401,
    });
    expect(invalidations).toBe(1);

    for (const status of [403, 404, 422]) {
      const client = new ChoonzApiClient({
        config: mechanicsConfig(),
        getAccessToken: async () => 'access-token',
        fetcher: async () => new Response(null, { status }),
      });
      await expect(client.getMechanicsScenario('missing')).rejects.toMatchObject({
        kind: 'response',
        status,
      });
    }
  });

  it('rejects unsupported versions and malformed server receipts', () => {
    expect(() => decodeMechanicsScenarioList({ ...scenarioList, schema_version: '2.0' })).toThrow(
      ResponseDecodeError,
    );
    expect(() => decodeMechanicsScenarioDetail({ ...scenarioDetail, corpus_version: '2' })).toThrow(
      ResponseDecodeError,
    );
    expect(() => decodeMechanicsReplayReceipt({ ...replayReceipt, verdict: 'maybe' })).toThrow(
      ResponseDecodeError,
    );
    expect(() =>
      decodeMechanicsReplayReceipt({
        ...replayReceipt,
        diffs: [{ path: 'checkpoints.0', expected: undefined, actual: null }],
      }),
    ).toThrow(ResponseDecodeError);
  });
});
