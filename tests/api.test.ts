import { describe, expect, it } from 'vitest';

import { ChoonzApiClient } from '../src/lib/api';
import { resolveAppConfig } from '../src/lib/config';
import { decodeConnection, decodeHealth, decodeKits } from '../src/lib/decoder';
import { ResponseDecodeError } from '../src/lib/errors';

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
