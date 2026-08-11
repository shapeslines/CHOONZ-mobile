import { describe, expect, it } from 'vitest';

import {
  ChunkedStorage,
  createLocalStorageAdapter,
  isSecureStoreCompatibleKey,
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

class FaultyStorage extends MemoryStorage {
  failSetFor: RegExp | null = null;
  failRemoveFor: RegExp | null = null;

  override async setItem(key: string, value: string): Promise<void> {
    if (this.failSetFor?.test(key)) {
      throw new Error('injected write failure');
    }
    await super.setItem(key, value);
  }

  override async removeItem(key: string): Promise<void> {
    if (this.failRemoveFor?.test(key)) {
      throw new Error('injected remove failure');
    }
    await super.removeItem(key);
  }
}

describe('session storage', () => {
  it('round-trips a large session through SecureStore-compatible chunks and removes it cleanly', async () => {
    const backing = new MemoryStorage();
    const storage = new ChunkedStorage(backing, 256);
    const session = JSON.stringify({ access_token: 'token-'.repeat(300), refresh_token: 'refresh' });

    await storage.setItem('supabase.auth.token', session);
    expect([...backing.values.keys()].some((key) => key.includes('.g1.c'))).toBe(true);
    expect([...backing.values.keys()].every(isSecureStoreCompatibleKey)).toBe(true);
    await expect(storage.getItem('supabase.auth.token')).resolves.toBe(session);

    await storage.removeItem('supabase.auth.token');
    expect(backing.values.size).toBe(0);
  });

  it('keeps the prior generation readable when a new chunk write fails', async () => {
    const backing = new FaultyStorage();
    const storage = new ChunkedStorage(backing, 256);
    const first = 'first-session-'.repeat(100);
    const second = 'second-session-'.repeat(100);

    await storage.setItem('supabase.auth.token', first);
    backing.failSetFor = /\.g2\.c0$/;
    await expect(storage.setItem('supabase.auth.token', second)).rejects.toThrow('injected write failure');
    await expect(storage.getItem('supabase.auth.token')).resolves.toBe(first);
  });

  it('keeps the manifest until chunk cleanup succeeds, making deletion retryable', async () => {
    const backing = new FaultyStorage();
    const storage = new ChunkedStorage(backing, 256);
    await storage.setItem('supabase.auth.token', 'session-'.repeat(100));

    backing.failRemoveFor = /\.g1\.c0$/;
    await expect(storage.removeItem('supabase.auth.token')).rejects.toThrow('injected remove failure');
    expect(backing.values.has('supabase.auth.token')).toBe(true);

    backing.failRemoveFor = null;
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
