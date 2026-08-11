import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

import {
  clearProtectedQueries,
  protectedQueryKey,
  protectedQueryScope,
} from '../src/lib/protected-queries';

describe('protected query cache', () => {
  it('scopes fixture and authenticated reads while disabling all other auth states', () => {
    expect(protectedQueryScope('fixture', null)).toBe('fixture');
    expect(protectedQueryScope('authenticated', 'user-7')).toBe('user.user-7');
    expect(protectedQueryScope('unauthenticated', 'user-7')).toBeNull();
    expect(protectedQueryKey('user-7', 'catalog', 'gels')).toEqual([
      'protected',
      'user-7',
      'catalog',
      'gels',
    ]);
  });

  it('removes protected queries even when cancellation fails', async () => {
    const events: string[] = [];
    const queryClient = {
      cancelQueries: async () => {
        events.push('cancel');
        throw new Error('cancellation race');
      },
      removeQueries: () => {
        events.push('remove');
      },
    };

    await expect(clearProtectedQueries(queryClient)).rejects.toThrow('cancellation race');
    expect(events).toEqual(['cancel', 'remove']);
  });

  it('uses the centralized finalizer for sign-out and auth-state loss', () => {
    const projectRoot = fileURLToPath(new URL('..', import.meta.url));
    const authProvider = readFileSync(
      join(projectRoot, 'src/providers/auth-provider.tsx'),
      'utf8',
    );
    expect(authProvider).toContain('finally {\n      await clearProtectedCache();');
    expect(authProvider).toContain('if (!nextSession) {\n          clearProtectedCacheSilently();');
  });
});
