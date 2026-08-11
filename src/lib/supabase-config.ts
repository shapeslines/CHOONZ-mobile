import { normalizeApiBaseUrl, type RuntimeConfig } from '@/lib/config';

export interface PublicSupabaseCredentials {
  url: string;
  key: string;
  keySource: 'publishable' | 'legacy-anon';
  isProduction: boolean;
}

const PUBLISHABLE_KEY_PREFIX = 'sb_publishable_';

function decodeBase64Url(value: string): string | null {
  if (!/^[A-Za-z0-9_-]+$/.test(value) || value.length % 4 === 1) {
    return null;
  }

  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
  let bits = 0;
  let buffer = 0;
  let decoded = '';
  for (const character of value) {
    const index = alphabet.indexOf(character);
    if (index < 0) {
      return null;
    }
    buffer = (buffer << 6) | index;
    bits += 6;
    while (bits >= 8) {
      bits -= 8;
      decoded += String.fromCharCode((buffer >> bits) & 0xff);
    }
  }
  try {
    const escaped = Array.from(decoded, (character) =>
      `%${character.charCodeAt(0).toString(16).padStart(2, '0')}`,
    ).join('');
    return decodeURIComponent(escaped);
  } catch {
    return null;
  }
}

export function isLegacyAnonJwt(value: string): boolean {
  const parts = value.split('.');
  if (parts.length !== 3 || parts.some((part) => !/^[A-Za-z0-9_-]+$/.test(part))) {
    return false;
  }
  const payloadPart = parts[1];
  if (!payloadPart) {
    return false;
  }
  const payload = decodeBase64Url(payloadPart);
  if (!payload) {
    return false;
  }
  try {
    const parsed: unknown = JSON.parse(payload);
    return (
      Boolean(parsed) &&
      typeof parsed === 'object' &&
      !Array.isArray(parsed) &&
      (parsed as Record<string, unknown>).role === 'anon'
    );
  } catch {
    return false;
  }
}

function isPublishableKey(value: string): boolean {
  return value.startsWith(PUBLISHABLE_KEY_PREFIX) && value.length > PUBLISHABLE_KEY_PREFIX.length;
}

export function resolvePublicSupabaseCredentials(
  config: RuntimeConfig,
): PublicSupabaseCredentials | null {
  if (
    !config.supabaseUrl ||
    normalizeApiBaseUrl(config.supabaseUrl, config.isProduction) !== config.supabaseUrl
  ) {
    return null;
  }
  if (config.supabasePublishableKey) {
    if (!isPublishableKey(config.supabasePublishableKey)) {
      return null;
    }
    return {
      url: config.supabaseUrl,
      key: config.supabasePublishableKey,
      keySource: 'publishable',
      isProduction: config.isProduction,
    };
  }
  if (!config.supabaseLegacyAnonKey || !isLegacyAnonJwt(config.supabaseLegacyAnonKey)) {
    return null;
  }
  return {
    url: config.supabaseUrl,
    key: config.supabaseLegacyAnonKey,
    keySource: 'legacy-anon',
    isProduction: config.isProduction,
  };
}
