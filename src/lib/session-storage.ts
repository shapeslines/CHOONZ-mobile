import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

import {
  ChunkedStorage,
  createLocalStorageAdapter,
  type KeyValueStorage,
} from '@/lib/secure-storage';

class MemoryStorage implements KeyValueStorage {
  private readonly values = new Map<string, string>();

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

const secureStoreAdapter: KeyValueStorage = {
  getItem: (key) => SecureStore.getItemAsync(key),
  setItem: (key, value) => SecureStore.setItemAsync(key, value),
  removeItem: (key) => SecureStore.deleteItemAsync(key),
};

/**
 * Web sessions use browser localStorage; native sessions use SecureStore through
 * a conservative chunking adapter so a large refresh-session never crosses the
 * SecureStore value boundary.
 */
export function createSessionStorage(): KeyValueStorage {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    try {
      return createLocalStorageAdapter(window.localStorage);
    } catch {
      return new MemoryStorage();
    }
  }
  return new ChunkedStorage(secureStoreAdapter);
}
