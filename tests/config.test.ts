import { describe, expect, it } from 'vitest';

import { fixtureDataLabel, normalizeApiBaseUrl, resolveAppConfig } from '../src/lib/config';
import { resolvePublicSupabaseCredentials } from '../src/lib/supabase-config';

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

  it('normalizes only safe http(s) API bases', () => {
    expect(normalizeApiBaseUrl('https://api.choonz.example/v1/')).toBe(
      'https://api.choonz.example/v1',
    );
    expect(normalizeApiBaseUrl('ftp://api.choonz.example')).toBeNull();
    expect(normalizeApiBaseUrl('https://user:pass@api.choonz.example')).toBeNull();
  });

  it('uses a publishable Supabase key before the legacy anon fallback', () => {
    const config = resolveAppConfig(
      {
        EXPO_PUBLIC_CHOONZ_MODE: 'api',
        EXPO_PUBLIC_CHOONZ_API_BASE_URL: 'https://api.choonz.example',
        EXPO_PUBLIC_SUPABASE_URL: 'https://project.supabase.co',
        EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_client',
        EXPO_PUBLIC_SUPABASE_ANON_KEY: 'legacy-anon-key',
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
        EXPO_PUBLIC_SUPABASE_ANON_KEY: 'legacy-anon-key',
      },
      true,
    );
    expect(resolvePublicSupabaseCredentials(fallbackConfig)).toMatchObject({
      key: 'legacy-anon-key',
      keySource: 'legacy-anon',
    });
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
