import { describe, expect, it } from 'vitest';

import { ChoonzApiClient } from '../src/lib/api';
import { resolveAppConfig } from '../src/lib/config';
import { decodeHealth, decodeKits } from '../src/lib/decoder';
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

  it('rejects malformed response payloads instead of accepting an unsafe shape', () => {
    expect(() => decodeHealth({ status: 'ok', env: 'dev', version: 'x', engine_loop: '128' })).toThrow(
      ResponseDecodeError,
    );
    expect(() => decodeKits([{ fighter_id: 'AXEL', moves: 'not-an-array' }])).toThrow(
      ResponseDecodeError,
    );
  });
});
