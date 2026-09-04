import { describe, expect, it } from 'vitest';

import { ChoonzApiClient, type FetchLike } from '../src/lib/api';
import { resolveAppConfig } from '../src/lib/config';
import { decodeMatch, decodeMatchState, decodeSeries } from '../src/lib/decoder';
import { ResponseDecodeError } from '../src/lib/errors';

const apiConfig = resolveAppConfig(
  {
    EXPO_PUBLIC_CHOONZ_MODE: 'api',
    EXPO_PUBLIC_CHOONZ_API_BASE_URL: 'https://api.choonz.example/',
  },
  true,
);

function matchPayload(status: 'ready' | 'active' | 'paused' | 'completed' | 'cancelled' = 'ready') {
  return {
    id: 19,
    series_id: null,
    p1_toon_id: 4,
    p2_toon_id: null,
    p1_gel: 'sodium',
    p2_gel: 'red',
    p1_fighter_id: 'AXEL',
    p2_fighter_id: 'VEX',
    stage_id: 'rooftop',
    seed: 677,
    status,
    result: status === 'completed' ? 'p1' : null,
    result_step: status === 'completed' ? 3 : null,
    result_p1_hp: status === 'completed' ? 90 : null,
    result_p2_hp: status === 'completed' ? 75 : null,
    last_step: 3,
    loop: 128,
    share_token: null,
    telemetry: null,
    allowed_transitions: [],
  };
}

function statePayload() {
  return {
    match_id: 19,
    status: 'active',
    step: 3,
    last_step: 3,
    bar: 0,
    ceremony: 'round_call',
    p1: { hp: 100, meter: 0.2, rounds: 0, pose: null, frame: null, x: null, lift: null },
    p2: { hp: 92, meter: 0.1, rounds: 0, pose: null, frame: null, x: null, lift: null },
    timer: 125,
    combo: 1,
    p1_gel: 'sodium',
    p2_gel: 'red',
    p1_fighter_id: 'AXEL',
    p2_fighter_id: 'VEX',
    stage_id: 'rooftop',
    seed: 677,
    loop: 128,
    leading: 'p1',
    ann: 'ROUND CALL',
    sound_hooks: ['light'],
    extra: { fixture: false },
  };
}

function responseFor(input: string, method: string | undefined): unknown {
  if (input.endsWith('/toons')) {
    const toon = { id: 4, name: 'Pilot Toon', description: null, sprite_url: null, tags: [], attributes: {} };
    return method === 'GET' ? [toon] : toon;
  }
  if (input.endsWith('/loadouts')) {
    const loadout = { id: 8, toon_id: 4, name: null, gel: 'sodium', fighter_id: 'AXEL', user_kit_id: null, is_default: true };
    return method === 'GET' ? [loadout] : loadout;
  }
  if (input.endsWith('/state') || input.endsWith('/tick') || input.endsWith('/act')) {
    return statePayload();
  }
  return matchPayload();
}

describe('fight API boundary', () => {
  it('uses every frozen P1 route/body with bearer headers after URL validation', async () => {
    const calls: { url: string; init: RequestInit | undefined }[] = [];
    const fetcher: FetchLike = async (input, init) => {
      calls.push({ url: input, init });
      return Response.json(responseFor(input, init?.method));
    };
    const client = new ChoonzApiClient({
      config: apiConfig,
      getAccessToken: async () => 'token-19',
      fetcher,
    });

    await client.getToons();
    await client.createToon({ name: 'Pilot Toon' });
    await client.getLoadouts();
    await client.createLoadout({ toon_id: 4, gel: 'sodium', fighter_id: 'AXEL' });
    await client.createMatch({ p1_toon_id: 4, seed: 677 });
    await client.getMatch(19);
    await client.startMatch(19);
    await client.pauseMatch(19);
    await client.resumeMatch(19);
    await client.completeMatch(19, { step: 3 });
    await client.cancelMatch(19);
    await client.tickMatch(19, { delta: 2 });
    await client.actMatch(19, { action: 'heavy', side: 'p1', advance: true });
    await client.getMatchState(19);
    await client.rematch(19);

    expect(calls.map((call) => `${call.init?.method}:${new URL(call.url).pathname}`)).toEqual([
      'GET:/toons',
      'POST:/toons',
      'GET:/loadouts',
      'POST:/loadouts',
      'POST:/matches',
      'GET:/matches/19',
      'POST:/matches/19/start',
      'POST:/matches/19/pause',
      'POST:/matches/19/resume',
      'POST:/matches/19/complete',
      'POST:/matches/19/cancel',
      'POST:/matches/19/tick',
      'POST:/matches/19/act',
      'GET:/matches/19/state',
      'POST:/matches/19/rematch',
    ]);
    expect(calls.every((call) => (call.init?.headers as Record<string, string>).Authorization === 'Bearer token-19')).toBe(true);
    expect(calls[1]?.init?.body).toBe(JSON.stringify({ name: 'Pilot Toon' }));
    expect(calls[9]?.init?.body).toBe(JSON.stringify({ step: 3 }));
    expect(calls[11]?.init?.body).toBe(JSON.stringify({ delta: 2 }));
    expect(calls[12]?.init?.body).toBe(JSON.stringify({ action: 'heavy', side: 'p1', advance: true }));
    expect((calls[5]?.init?.headers as Record<string, string>)['Content-Type']).toBeUndefined();
  });

  it('settles 401 after cleanup and retains status-bearing 403/404/409/422 failures', async () => {
    let cleanups = 0;
    const expired = new ChoonzApiClient({
      config: apiConfig,
      getAccessToken: async () => 'expired',
      onUnauthorized: async () => {
        cleanups += 1;
      },
      fetcher: async () => new Response(null, { status: 401 }),
    });
    await expect(expired.getMatch(19)).rejects.toMatchObject({ kind: 'authentication', status: 401 });
    expect(cleanups).toBe(1);

    for (const status of [403, 404, 409, 422]) {
      const client = new ChoonzApiClient({
        config: apiConfig,
        getAccessToken: async () => 'token',
        fetcher: async () => new Response(null, { status }),
      });
      await expect(client.getMatch(19)).rejects.toMatchObject({ kind: 'response', status });
    }
  });

  it('preserves distinct network, JSON, and decode failures', async () => {
    const network = new ChoonzApiClient({
      config: apiConfig,
      getAccessToken: async () => 'token',
      fetcher: async () => {
        throw new Error('offline');
      },
    });
    await expect(network.getToons()).rejects.toMatchObject({ kind: 'network' });

    const malformedJson = new ChoonzApiClient({
      config: apiConfig,
      getAccessToken: async () => 'token',
      fetcher: async () =>
        ({ ok: true, status: 200, json: async () => { throw new Error('bad json'); } }) as unknown as Response,
    });
    await expect(malformedJson.getToons()).rejects.toMatchObject({ kind: 'response', message: 'CHOONZ API returned invalid JSON.' });

    const malformedShape = new ChoonzApiClient({
      config: apiConfig,
      getAccessToken: async () => 'token',
      fetcher: async () => Response.json([{ id: 'not-an-integer' }]),
    });
    await expect(malformedShape.getToons()).rejects.toMatchObject({ kind: 'response' });
  });

  it('keeps fixture fights off tokens, fetch, and a live API URL', async () => {
    let tokenReads = 0;
    let fetches = 0;
    const fixtureConfig = resolveAppConfig({ EXPO_PUBLIC_CHOONZ_MODE: 'fixtures' }, false);
    const client = new ChoonzApiClient({
      config: fixtureConfig,
      getAccessToken: async () => {
        tokenReads += 1;
        return 'should-not-be-read';
      },
      fetcher: async () => {
        fetches += 1;
        return Response.json({});
      },
    });
    const toon = (await client.getToons())[0]!;
    const match = await client.createMatch({ p1_toon_id: toon.id });
    await client.startMatch(match.id);
    await client.actMatch(match.id, { action: 'light' });
    expect(await client.getMatchState(match.id)).toMatchObject({ combo: 1 });
    expect(tokenReads).toBe(0);
    expect(fetches).toBe(0);
  });
});

// --------------------------------------------------------------------------- //
// Engine revision 2 (CHOONZ #135 M4/M5) — additive, never inferred.
// --------------------------------------------------------------------------- //

describe('fight-v2 additive shapes', () => {
  it('defaults Match.engine to ah-scripted when an older server omits the key', () => {
    const older = matchPayload();
    expect('engine' in older).toBe(false);
    expect(decodeMatch(older).engine).toBe('ah-scripted');
  });

  it('decodes a declared Match.engine and rejects an unknown one', () => {
    expect(decodeMatch({ ...matchPayload(), engine: 'fight-v2' }).engine).toBe('fight-v2');
    expect(decodeMatch({ ...matchPayload(), engine: 'ah-scripted' }).engine).toBe('ah-scripted');
    expect(() => decodeMatch({ ...matchPayload(), engine: 'fight-v3' })).toThrow(
      ResponseDecodeError,
    );
    expect(() => decodeMatch({ ...matchPayload(), engine: null })).toThrow(ResponseDecodeError);
  });

  it('still decodes a full read that carries none of the fight-v2 keys', () => {
    const state = decodeMatchState(statePayload());
    expect(state.engine).toBeUndefined();
    expect(state.over).toBeUndefined();
    expect(state.winner).toBeUndefined();
    expect(state.p1.state).toBeUndefined();
    expect(state.p1.legal_actions).toBeUndefined();
    expect(state.p1.move_costs).toBeUndefined();
    expect(state.ann).toBe('ROUND CALL');
  });

  it('decodes the fight-v2 additive keys and ignores boxes like any unknown key', () => {
    const base = statePayload();
    const state = decodeMatchState({
      ...base,
      engine: 'fight-v2',
      over: true,
      winner: 'p2',
      p1: {
        ...base.p1,
        state: 'recovery',
        legal_actions: ['light', 'block'],
        move_costs: { special: 0.25, heavy: 0 },
        boxes: [{ kind: 'hurt', x: 1, y: 2, w: 3, h: 4 }],
      },
    });

    expect(state.engine).toBe('fight-v2');
    expect(state.over).toBe(true);
    expect(state.winner).toBe('p2');
    expect(state.p1.state).toBe('recovery');
    expect(state.p1.legal_actions).toEqual(['light', 'block']);
    expect(state.p1.move_costs).toEqual({ special: 0.25, heavy: 0 });
    expect(state.p1).not.toHaveProperty('boxes');
    expect(state.p2.state).toBeUndefined();
  });

  it('fails closed when a present fight-v2 key has the wrong type', () => {
    const base = statePayload();
    expect(() => decodeMatchState({ ...base, over: 'yes' })).toThrow(ResponseDecodeError);
    expect(() => decodeMatchState({ ...base, winner: 'p3' })).toThrow(ResponseDecodeError);
    expect(() => decodeMatchState({ ...base, engine: 'fight-v3' })).toThrow(ResponseDecodeError);
    expect(() => decodeMatchState({ ...base, p1: { ...base.p1, state: 7 } })).toThrow(
      ResponseDecodeError,
    );
    expect(() =>
      decodeMatchState({ ...base, p1: { ...base.p1, legal_actions: 'light' } }),
    ).toThrow(ResponseDecodeError);
    expect(() =>
      decodeMatchState({ ...base, p1: { ...base.p1, move_costs: { special: 'free' } } }),
    ).toThrow(ResponseDecodeError);
  });

  it('reads an explicit null revision-2 key as "the engine said nothing"', () => {
    // M5 sends these as null (not absent) whenever the match runs ah-scripted.
    const state = decodeMatchState({
      ...statePayload(),
      engine: 'ah-scripted',
      over: null,
      winner: null,
      p1: { ...statePayload().p1, state: null, legal_actions: null, move_costs: null },
    });

    expect(state.engine).toBe('ah-scripted');
    expect(state.over).toBeUndefined();
    expect(state.winner).toBeNull();
    expect(state.p1.state).toBeUndefined();
    expect(state.p1.legal_actions).toBeUndefined();
    expect(state.p1.move_costs).toBeUndefined();
  });

  it('passes an engine request through the create body without inventing one', async () => {
    const bodies: (string | undefined)[] = [];
    const client = new ChoonzApiClient({
      config: apiConfig,
      getAccessToken: async () => 'token-19',
      fetcher: async (_input, init) => {
        bodies.push(typeof init?.body === 'string' ? init.body : undefined);
        return Response.json({ ...matchPayload(), engine: 'fight-v2' });
      },
    });

    await expect(client.createMatch({ p1_toon_id: 4, engine: 'fight-v2' })).resolves.toMatchObject({
      engine: 'fight-v2',
    });
    await client.createMatch({ p1_toon_id: 4 });

    expect(bodies[0]).toBe(JSON.stringify({ p1_toon_id: 4, engine: 'fight-v2' }));
    expect(bodies[1]).toBe(JSON.stringify({ p1_toon_id: 4 }));
  });
});

// --------------------------------------------------------------------------- //
// Series engine (CHOONZ #142 M5b) — one engine per series, derived, never
// inferred by the client.
// --------------------------------------------------------------------------- //

function seriesPayload() {
  return {
    id: 7,
    best_of: 3,
    wins_needed: 2,
    p1_wins: 0,
    p2_wins: 0,
    status: 'active',
    winner: null,
    p1_toon_id: 4,
    p2_toon_id: null,
    p1_gel: 'sodium',
    p2_gel: 'red',
    p1_fighter_id: 'AXEL',
    p2_fighter_id: 'VEX',
    stage_id: 'rooftop',
    seed_base: 0,
    match_ids: [19],
    open_match_id: 19,
  };
}

describe('series engine', () => {
  it('defaults Series.engine to ah-scripted when a pre-M5b server omits the key', () => {
    const older = seriesPayload();
    expect('engine' in older).toBe(false);
    expect(decodeSeries(older).engine).toBe('ah-scripted');
  });

  it('decodes a declared Series.engine and fails closed on a bad one', () => {
    expect(decodeSeries({ ...seriesPayload(), engine: 'fight-v2' }).engine).toBe('fight-v2');
    expect(decodeSeries({ ...seriesPayload(), engine: 'ah-scripted' }).engine).toBe('ah-scripted');
    expect(() => decodeSeries({ ...seriesPayload(), engine: 'fight-v3' })).toThrow(
      ResponseDecodeError,
    );
    expect(() => decodeSeries({ ...seriesPayload(), engine: null })).toThrow(ResponseDecodeError);
    expect(() => decodeSeries({ ...seriesPayload(), engine: 2 })).toThrow(ResponseDecodeError);
  });

  it('decodes the rest of the series shape strictly', () => {
    const series = decodeSeries({ ...seriesPayload(), status: 'completed', winner: 'p2' });
    expect(series).toMatchObject({ id: 7, best_of: 3, status: 'completed', winner: 'p2' });
    expect(series.match_ids).toEqual([19]);
    expect(() => decodeSeries({ ...seriesPayload(), status: 'ready' })).toThrow(
      ResponseDecodeError,
    );
    expect(() => decodeSeries({ ...seriesPayload(), winner: 'draw' })).toThrow(
      ResponseDecodeError,
    );
  });

  it('forwards an engine request through the createSeries body without inventing one', async () => {
    const bodies: (string | undefined)[] = [];
    const client = new ChoonzApiClient({
      config: apiConfig,
      getAccessToken: async () => 'token-7',
      fetcher: async (input, init) => {
        expect(input).toBe('https://api.choonz.example/series');
        bodies.push(typeof init?.body === 'string' ? init.body : undefined);
        return Response.json({ ...seriesPayload(), engine: 'fight-v2' });
      },
    });

    await expect(client.createSeries({ p1_toon_id: 4, engine: 'fight-v2' })).resolves.toMatchObject(
      { engine: 'fight-v2' },
    );
    await client.createSeries({ p1_toon_id: 4 });

    expect(bodies[0]).toBe(JSON.stringify({ p1_toon_id: 4, engine: 'fight-v2' }));
    expect(bodies[1]).toBe(JSON.stringify({ p1_toon_id: 4 }));
  });
});
