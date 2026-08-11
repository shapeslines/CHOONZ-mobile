import { describe, expect, it } from 'vitest';

import type { KeyValueStorage } from '../src/lib/secure-storage';
import { createChoonzSupabaseClient } from '../src/lib/supabase';

const storage: KeyValueStorage = {
  getItem: async () => null,
  setItem: async () => undefined,
  removeItem: async () => undefined,
};

function syntheticLegacyJwt(role: string): string {
  const encode = (value: object) => Buffer.from(JSON.stringify(value)).toString('base64url');
  return `${encode({ alg: 'HS256', typ: 'JWT' })}.${encode({ role })}.signature`;
}

describe('Supabase client construction', () => {
  it('rejects a directly constructed invalid publishable key before creating a client', () => {
    expect(() =>
      createChoonzSupabaseClient(
        {
          url: 'https://project.supabase.co',
          key: 'not-a-publishable-key',
          keySource: 'publishable',
          isProduction: true,
        },
        storage,
      ),
    ).toThrow('Supabase key is not safe');
  });

  it('rejects a directly constructed legacy service-role JWT before creating a client', () => {
    expect(() =>
      createChoonzSupabaseClient(
        {
          url: 'https://project.supabase.co',
          key: syntheticLegacyJwt('service_role'),
          keySource: 'legacy-anon',
          isProduction: true,
        },
        storage,
      ),
    ).toThrow('Supabase key is not safe');
  });
});
