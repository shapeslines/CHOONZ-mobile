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

export function normalizeApiBaseUrl(value: string | undefined): string | null {
  const raw = trim(value);
  if (!raw) {
    return null;
  }

  try {
    const url = new URL(raw);
    if (
      (url.protocol !== 'https:' && url.protocol !== 'http:') ||
      !url.hostname ||
      url.username ||
      url.password
    ) {
      return null;
    }
    return url.toString().replace(/\/+$/, '');
  } catch {
    return null;
  }
}

function normalizeSupabaseUrl(value: string | undefined): string | null {
  return normalizeApiBaseUrl(value);
}

export function resolveAppConfig(
  environment: PublicEnvironment,
  isProduction: boolean,
): RuntimeConfig {
  const configuredMode = trim(environment.EXPO_PUBLIC_CHOONZ_MODE)?.toLowerCase();
  const selectedMode = configuredMode ?? (isProduction ? undefined : 'fixtures');
  const apiBaseUrl = normalizeApiBaseUrl(environment.EXPO_PUBLIC_CHOONZ_API_BASE_URL);
  const supabaseUrl = normalizeSupabaseUrl(environment.EXPO_PUBLIC_SUPABASE_URL);
  const supabasePublishableKey = trim(environment.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY) ?? null;
  const supabaseLegacyAnonKey = trim(environment.EXPO_PUBLIC_SUPABASE_ANON_KEY) ?? null;

  if (selectedMode !== 'fixtures' && selectedMode !== 'api') {
    return {
      mode: 'invalid',
      apiBaseUrl,
      supabaseUrl,
      supabasePublishableKey,
      supabaseLegacyAnonKey,
      configurationIssue:
        'CHOONZ mode must be explicitly set to fixtures or api in production builds.',
    };
  }

  if (selectedMode === 'api' && !apiBaseUrl) {
    return {
      mode: 'invalid',
      apiBaseUrl: null,
      supabaseUrl,
      supabasePublishableKey,
      supabaseLegacyAnonKey,
      configurationIssue:
        'API mode requires a valid EXPO_PUBLIC_CHOONZ_API_BASE_URL using http or https.',
    };
  }

  return {
    mode: selectedMode,
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
