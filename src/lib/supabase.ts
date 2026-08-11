import { createClient, type SupabaseClient } from '@supabase/supabase-js';

import { normalizeApiBaseUrl } from '@/lib/config';
import type { KeyValueStorage } from '@/lib/secure-storage';
import {
  isValidPublicSupabaseKey,
  type PublicSupabaseCredentials,
} from '@/lib/supabase-config';

export {
  isPublishableSupabaseKey,
  isValidPublicSupabaseKey,
  resolvePublicSupabaseCredentials,
  type PublicSupabaseCredentials,
} from '@/lib/supabase-config';

export function createChoonzSupabaseClient(
  credentials: PublicSupabaseCredentials,
  storage: KeyValueStorage,
): SupabaseClient {
  if (
    normalizeApiBaseUrl(credentials.url, credentials.isProduction) !== credentials.url
  ) {
    throw new Error('Supabase URL is not safe for an auth client.');
  }
  if (!isValidPublicSupabaseKey(credentials.key, credentials.keySource)) {
    throw new Error('Supabase key is not safe for an auth client.');
  }
  return createClient(credentials.url, credentials.key, {
    auth: {
      flowType: 'pkce',
      storage,
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
    },
  });
}
