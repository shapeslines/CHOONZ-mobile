export type ChoonzMode = 'fixtures' | 'api' | 'invalid';

export interface PublicEnvironment {
  EXPO_PUBLIC_CHOONZ_MODE?: string;
  EXPO_PUBLIC_CHOONZ_API_BASE_URL?: string;
  EXPO_PUBLIC_SUPABASE_URL?: string;
  EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY?: string;
  EXPO_PUBLIC_SUPABASE_ANON_KEY?: string;
}

export interface RuntimeConfig {
  mode: ChoonzMode;
  isProduction: boolean;
  apiBaseUrl: string | null;
  supabaseUrl: string | null;
  supabasePublishableKey: string | null;
  supabaseLegacyAnonKey: string | null;
  configurationIssue: string | null;
}

function trim(value: string | undefined): string | undefined {
  const next = value?.trim();
  return next ? next : undefined;
}

function isLoopbackHost(hostname: string): boolean {
  const normalized = hostname.toLowerCase().replace(/^\[|\]$/g, '');
  return normalized === 'localhost' || normalized === '127.0.0.1' || normalized === '::1';
}

/**
 * Services carrying a bearer token or password must use HTTPS in production.
 * Development permits HTTP only for explicit loopback hosts, never a LAN or
 * arbitrary remote host.
 */
export function normalizeApiBaseUrl(
  value: string | undefined,
  isProduction = false,
): string | null {
  const raw = trim(value);
  if (!raw) {
    return null;
  }

  try {
    const url = new URL(raw);
    if (!url.hostname || url.username || url.password || url.protocol !== 'https:') {
      if (
        url.protocol !== 'http:' ||
        isProduction ||
        !url.hostname ||
        !isLoopbackHost(url.hostname) ||
        url.username ||
        url.password
      ) {
        return null;
      }
    }
    if (url.protocol !== 'https:' && url.protocol !== 'http:') {
      return null;
    }
    return url.toString().replace(/\/+$/, '');
  } catch {
    return null;
  }
}

function normalizeSupabaseUrl(value: string | undefined, isProduction: boolean): string | null {
  return normalizeApiBaseUrl(value, isProduction);
}

export function resolveAppConfig(
  environment: PublicEnvironment,
  isProduction: boolean,
): RuntimeConfig {
  const configuredMode = trim(environment.EXPO_PUBLIC_CHOONZ_MODE)?.toLowerCase();
  const selectedMode = configuredMode ?? (isProduction ? undefined : 'fixtures');
  const suppliedApiBaseUrl = trim(environment.EXPO_PUBLIC_CHOONZ_API_BASE_URL);
  const apiBaseUrl = normalizeApiBaseUrl(suppliedApiBaseUrl, isProduction);
  const suppliedSupabaseUrl = trim(environment.EXPO_PUBLIC_SUPABASE_URL);
  const supabaseUrl = normalizeSupabaseUrl(suppliedSupabaseUrl, isProduction);
  const supabasePublishableKey = trim(environment.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY) ?? null;
  const supabaseLegacyAnonKey = trim(environment.EXPO_PUBLIC_SUPABASE_ANON_KEY) ?? null;

  if (selectedMode !== 'fixtures' && selectedMode !== 'api') {
    return {
      mode: 'invalid',
      isProduction,
      apiBaseUrl,
      supabaseUrl,
      supabasePublishableKey,
      supabaseLegacyAnonKey,
      configurationIssue:
        'CHOONZ mode must be explicitly set to fixtures or api in production builds.',
    };
  }

  // Validate a supplied endpoint even when the current mode does not consume it.
  // This avoids carrying a plaintext credential-bearing endpoint into a build.
  if (suppliedApiBaseUrl && !apiBaseUrl) {
    return {
      mode: 'invalid',
      isProduction,
      apiBaseUrl: null,
      supabaseUrl,
      supabasePublishableKey,
      supabaseLegacyAnonKey,
      configurationIssue:
        'API must use HTTPS in production or an explicit loopback HTTP URL in development.',
    };
  }

  if (suppliedSupabaseUrl && !supabaseUrl) {
    return {
      mode: 'invalid',
      isProduction,
      apiBaseUrl,
      supabaseUrl: null,
      supabasePublishableKey,
      supabaseLegacyAnonKey,
      configurationIssue:
        'Supabase must use HTTPS in production or an explicit loopback HTTP URL in development.',
    };
  }

  if (selectedMode === 'api' && !apiBaseUrl) {
    return {
      mode: 'invalid',
      isProduction,
      apiBaseUrl: null,
      supabaseUrl,
      supabasePublishableKey,
      supabaseLegacyAnonKey,
      configurationIssue:
        'API mode requires a valid HTTPS API URL in production or an explicit loopback HTTP URL in development.',
    };
  }

  return {
    mode: selectedMode,
    isProduction,
    apiBaseUrl,
    supabaseUrl,
    supabasePublishableKey,
    supabaseLegacyAnonKey,
    configurationIssue: null,
  };
}

function currentEnvironment(): PublicEnvironment {
  return {
    EXPO_PUBLIC_CHOONZ_MODE: process.env.EXPO_PUBLIC_CHOONZ_MODE,
    EXPO_PUBLIC_CHOONZ_API_BASE_URL: process.env.EXPO_PUBLIC_CHOONZ_API_BASE_URL,
    EXPO_PUBLIC_SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL,
    EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    EXPO_PUBLIC_SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
  };
}

declare const __DEV__: boolean | undefined;

function isProductionRuntime(): boolean {
  if (typeof __DEV__ !== 'undefined') {
    return !__DEV__;
  }
  return process.env.NODE_ENV === 'production';
}

export const appConfig = resolveAppConfig(currentEnvironment(), isProductionRuntime());

export function fixtureDataLabel(config: RuntimeConfig): string | null {
  return config.mode === 'fixtures' ? 'FIXTURE DATA — LOCAL' : null;
}
