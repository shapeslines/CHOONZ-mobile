import type { RuntimeConfig } from '@/lib/config';

export interface PublicSupabaseCredentials {
  url: string;
  key: string;
  keySource: 'publishable' | 'legacy-anon';
}

function isUnsafeClientKey(value: string): boolean {
  return value.startsWith('sb_secret_') || /service[_-]?role/i.test(value);
}

export function resolvePublicSupabaseCredentials(
  config: RuntimeConfig,
): PublicSupabaseCredentials | null {
  if (!config.supabaseUrl) {
    return null;
  }
  const key = config.supabasePublishableKey ?? config.supabaseLegacyAnonKey;
  if (!key || isUnsafeClientKey(key)) {
    return null;
  }
  return {
    url: config.supabaseUrl,
    key,
    keySource: config.supabasePublishableKey ? 'publishable' : 'legacy-anon',
  };
}
