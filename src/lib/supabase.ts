import { createClient, type SupabaseClient } from '@supabase/supabase-js';

import { normalizeApiBaseUrl } from '@/lib/config';
import { createSessionStorage } from '@/lib/session-storage';
import type { KeyValueStorage } from '@/lib/secure-storage';
import type { PublicSupabaseCredentials } from '@/lib/supabase-config';

export {
  resolvePublicSupabaseCredentials,
  type PublicSupabaseCredentials,
} from '@/lib/supabase-config';

export function createChoonzSupabaseClient(
  credentials: PublicSupabaseCredentials,
  storage: KeyValueStorage = createSessionStorage(),
): SupabaseClient {
  if (
    normalizeApiBaseUrl(credentials.url, credentials.isProduction) !== credentials.url
  ) {
    throw new Error('Supabase URL is not safe for an auth client.');
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
