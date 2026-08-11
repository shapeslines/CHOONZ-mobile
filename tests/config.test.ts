import { describe, expect, it } from 'vitest';

import { fixtureDataLabel, normalizeApiBaseUrl, resolveAppConfig } from '../src/lib/config';
import {
  isLegacyAnonJwt,
  resolvePublicSupabaseCredentials,
} from '../src/lib/supabase-config';

function syntheticLegacyJwt(role: string): string {
  const encode = (value: object) =>
    Buffer.from(JSON.stringify(value)).toString('base64url');
  return `${encode({ alg: 'HS256', typ: 'JWT' })}.${encode({ role })}.signature`;
}

describe('CHOONZ public runtime configuration', () => {
  it('defaults to fixture mode only for development and fails closed in production', () => {
    expect(resolveAppConfig({}, false)).toMatchObject({ mode: 'fixtures', configurationIssue: null });
    expect(resolveAppConfig({}, true)).toMatchObject({ mode: 'invalid' });
    expect(
      resolveAppConfig(
        { EXPO_PUBLIC_CHOONZ_MODE: 'api', EXPO_PUBLIC_CHOONZ_API_BASE_URL: 'not a url' },
        true,
      ),
    ).toMatchObject({ mode: 'invalid' });
    expect(resolveAppConfig({ EXPO_PUBLIC_CHOONZ_MODE: 'unknown' }, true)).toMatchObject({
      mode: 'invalid',
    });
  });

  it('allows HTTPS everywhere and HTTP only on development loopback', () => {
    expect(normalizeApiBaseUrl('https://api.choonz.example/v1/')).toBe(
      'https://api.choonz.example/v1',
    );
    expect(normalizeApiBaseUrl('http://localhost:8000')).toBe('http://localhost:8000');
    expect(normalizeApiBaseUrl('http://127.0.0.1:8000')).toBe('http://127.0.0.1:8000');
    expect(normalizeApiBaseUrl('http://[::1]:8000')).toBe('http://[::1]:8000');
    expect(normalizeApiBaseUrl('http://api.choonz.example')).toBeNull();
    expect(normalizeApiBaseUrl('http://localhost:8000', true)).toBeNull();
    expect(normalizeApiBaseUrl('https://user:pass@api.choonz.example')).toBeNull();
    expect(normalizeApiBaseUrl('ftp://api.choonz.example')).toBeNull();
  });

  it('fails closed for production plaintext API and Supabase URLs', () => {
    expect(
      resolveAppConfig(
        {
          EXPO_PUBLIC_CHOONZ_MODE: 'api',
          EXPO_PUBLIC_CHOONZ_API_BASE_URL: 'http://localhost:8000',
        },
        true,
      ),
    ).toMatchObject({ mode: 'invalid' });
    expect(
      resolveAppConfig(
        {
          EXPO_PUBLIC_CHOONZ_MODE: 'api',
          EXPO_PUBLIC_CHOONZ_API_BASE_URL: 'https://api.choonz.example',
          EXPO_PUBLIC_SUPABASE_URL: 'http://project.supabase.co',
        },
        true,
      ),
    ).toMatchObject({ mode: 'invalid', supabaseUrl: null });
    expect(
      resolveAppConfig(
        {
          EXPO_PUBLIC_CHOONZ_MODE: 'fixtures',
          EXPO_PUBLIC_SUPABASE_URL: 'http://project.supabase.co',
        },
        true,
      ),
    ).toMatchObject({ mode: 'invalid', supabaseUrl: null });
  });

  it('uses a publishable Supabase key before the legacy anon fallback', () => {
    const config = resolveAppConfig(
      {
        EXPO_PUBLIC_CHOONZ_MODE: 'api',
        EXPO_PUBLIC_CHOONZ_API_BASE_URL: 'https://api.choonz.example',
        EXPO_PUBLIC_SUPABASE_URL: 'https://project.supabase.co',
        EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_client',
        EXPO_PUBLIC_SUPABASE_ANON_KEY: syntheticLegacyJwt('anon'),
      },
      true,
    );
    expect(resolvePublicSupabaseCredentials(config)).toMatchObject({
      key: 'sb_publishable_client',
      keySource: 'publishable',
    });

    const fallbackConfig = resolveAppConfig(
      {
        EXPO_PUBLIC_CHOONZ_MODE: 'api',
        EXPO_PUBLIC_CHOONZ_API_BASE_URL: 'https://api.choonz.example',
        EXPO_PUBLIC_SUPABASE_URL: 'https://project.supabase.co',
        EXPO_PUBLIC_SUPABASE_ANON_KEY: syntheticLegacyJwt('anon'),
      },
      true,
    );
    expect(resolvePublicSupabaseCredentials(fallbackConfig)).toMatchObject({
      key: syntheticLegacyJwt('anon'),
      keySource: 'legacy-anon',
    });
  });

  it('rejects malformed, privileged legacy keys and never falls back from an invalid primary', () => {
    expect(isLegacyAnonJwt('not-a-jwt')).toBe(false);
    expect(isLegacyAnonJwt(syntheticLegacyJwt('service_role'))).toBe(false);
    expect(isLegacyAnonJwt(syntheticLegacyJwt('anon'))).toBe(true);

    const config = resolveAppConfig(
      {
        EXPO_PUBLIC_CHOONZ_MODE: 'api',
        EXPO_PUBLIC_CHOONZ_API_BASE_URL: 'https://api.choonz.example',
        EXPO_PUBLIC_SUPABASE_URL: 'https://project.supabase.co',
        EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'not-a-publishable-key',
        EXPO_PUBLIC_SUPABASE_ANON_KEY: syntheticLegacyJwt('anon'),
      },
      true,
    );
    expect(resolvePublicSupabaseCredentials(config)).toBeNull();
    expect(
      resolvePublicSupabaseCredentials({
        ...resolveAppConfig(
          {
            EXPO_PUBLIC_CHOONZ_MODE: 'api',
            EXPO_PUBLIC_CHOONZ_API_BASE_URL: 'https://api.choonz.example',
            EXPO_PUBLIC_SUPABASE_URL: 'https://project.supabase.co',
            EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_client',
          },
          true,
        ),
        supabaseUrl: 'http://project.supabase.co',
      }),
    ).toBeNull();
  });

  it('keeps fixture data visibly labelled and omits it for live API mode', () => {
    expect(fixtureDataLabel(resolveAppConfig({}, false))).toBe('FIXTURE DATA — LOCAL');
    expect(
      fixtureDataLabel(
        resolveAppConfig(
          {
            EXPO_PUBLIC_CHOONZ_MODE: 'api',
            EXPO_PUBLIC_CHOONZ_API_BASE_URL: 'https://api.choonz.example',
          },
          true,
        ),
      ),
    ).toBeNull();
  });

});
