import { describe, expect, it } from 'vitest';

import {
  ChunkedStorage,
  createLocalStorageAdapter,
  type KeyValueStorage,
} from '../src/lib/secure-storage';

class MemoryStorage implements KeyValueStorage {
  readonly values = new Map<string, string>();

  async getItem(key: string): Promise<string | null> {
    return this.values.get(key) ?? null;
  }

  async setItem(key: string, value: string): Promise<void> {
    this.values.set(key, value);
  }

  async removeItem(key: string): Promise<void> {
    this.values.delete(key);
  }
}

describe('session storage', () => {
  it('round-trips a large session through SecureStore-compatible chunks and removes it cleanly', async () => {
    const backing = new MemoryStorage();
    const storage = new ChunkedStorage(backing, 256);
    const session = JSON.stringify({ access_token: 'token-'.repeat(300), refresh_token: 'refresh' });

    await storage.setItem('supabase.auth.token', session);
    expect([...backing.values.keys()].some((key) => key.includes('::chunk::'))).toBe(true);
    await expect(storage.getItem('supabase.auth.token')).resolves.toBe(session);

    await storage.removeItem('supabase.auth.token');
    expect(backing.values.size).toBe(0);
  });

  it('uses a direct localStorage-shaped adapter on web', async () => {
    const values = new Map<string, string>();
    const localStorage = {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
      removeItem: (key: string) => values.delete(key),
      clear: () => values.clear(),
      key: (_index: number) => null,
      length: 0,
    } as Storage;
    const storage = createLocalStorageAdapter(localStorage);

    await storage.setItem('browser-session', 'value');
    await expect(storage.getItem('browser-session')).resolves.toBe('value');
    await storage.removeItem('browser-session');
    await expect(storage.getItem('browser-session')).resolves.toBeNull();
  });
});
