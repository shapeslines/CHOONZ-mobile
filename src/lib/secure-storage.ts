export interface KeyValueStorage {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
}

interface ChunkManifest {
  version: 2;
  chunks: number;
  generation: number;
  encoding: 'uri';
}

export const DEFAULT_SECURE_STORE_CHUNK_SIZE = 1400;
export const SECURE_STORE_KEY_PATTERN = /^[\w.-]+$/;

export function isSecureStoreCompatibleKey(key: string): boolean {
  return SECURE_STORE_KEY_PATTERN.test(key);
}

function assertSecureStoreKey(key: string): void {
  if (!isSecureStoreCompatibleKey(key)) {
    throw new Error('SecureStore key must contain only letters, numbers, underscores, periods, or hyphens.');
  }
}

function chunkKey(key: string, generation: number, index: number): string {
  const next = `${key}.g${generation}.c${index}`;
  assertSecureStoreKey(next);
  return next;
}

function parseManifest(value: string | null): ChunkManifest | null {
  if (!value) {
    return null;
  }
  try {
    const parsed: unknown = JSON.parse(value);
    if (
      parsed &&
      typeof parsed === 'object' &&
      !Array.isArray(parsed) &&
      (parsed as Record<string, unknown>).version === 2 &&
      (parsed as Record<string, unknown>).encoding === 'uri' &&
      Number.isInteger((parsed as Record<string, unknown>).chunks) &&
      Number((parsed as Record<string, unknown>).chunks) > 0 &&
      Number.isInteger((parsed as Record<string, unknown>).generation) &&
      Number((parsed as Record<string, unknown>).generation) > 0
    ) {
      return parsed as ChunkManifest;
    }
  } catch {
    // A pre-adapter value is returned as-is for the Supabase client to handle.
  }
  return null;
}

function nextGeneration(previous: ChunkManifest | null): number {
  if (!previous || previous.generation >= Number.MAX_SAFE_INTEGER - 1) {
    return 1;
  }
  return previous.generation + 1;
}

/**
 * A native SecureStore adapter. Every payload is encoded into generation-scoped
 * chunks whose keys satisfy SecureStore's `^[\\w.-]+$` grammar. New-generation
 * chunks are persisted before their manifest switches the active session.
 */
export class ChunkedStorage implements KeyValueStorage {
  constructor(
    private readonly storage: KeyValueStorage,
    private readonly chunkSize = DEFAULT_SECURE_STORE_CHUNK_SIZE,
  ) {
    if (!Number.isInteger(chunkSize) || chunkSize < 256) {
      throw new Error('ChunkedStorage chunkSize must be an integer of at least 256.');
    }
  }

  async getItem(key: string): Promise<string | null> {
    assertSecureStoreKey(key);
    const base = await this.storage.getItem(key);
    if (base === null) {
      return null;
    }

    const manifest = parseManifest(base);
    if (!manifest) {
      return base;
    }
    const chunks = await Promise.all(
      Array.from({ length: manifest.chunks }, (_, index) =>
        this.storage.getItem(chunkKey(key, manifest.generation, index)),
      ),
    );
    if (chunks.some((chunk) => chunk === null)) {
      return null;
    }
    return this.decode(chunks.join(''));
  }

  async setItem(key: string, value: string): Promise<void> {
    assertSecureStoreKey(key);
    const previous = parseManifest(await this.storage.getItem(key));
    const generation = nextGeneration(previous);
    const encoded = encodeURIComponent(value);
    const chunks = Array.from(
      { length: Math.max(1, Math.ceil(encoded.length / this.chunkSize)) },
      (_, index) => encoded.slice(index * this.chunkSize, (index + 1) * this.chunkSize),
    );
    const newChunkKeys = chunks.map((_chunk, index) => chunkKey(key, generation, index));

    try {
      for (const [index, chunk] of chunks.entries()) {
        await this.storage.setItem(newChunkKeys[index]!, chunk);
      }
    } catch (error) {
      await this.removeChunkKeysBestEffort(newChunkKeys);
      throw error;
    }

    try {
      await this.storage.setItem(
        key,
        JSON.stringify({ version: 2, chunks: chunks.length, generation, encoding: 'uri' } satisfies ChunkManifest),
      );
    } catch (error) {
      await this.removeChunkKeysBestEffort(newChunkKeys);
      throw error;
    }

    if (previous) {
      await this.removeChunkKeysBestEffort(this.chunkKeysForManifest(key, previous));
    }
  }

  async removeItem(key: string): Promise<void> {
    assertSecureStoreKey(key);
    const manifest = parseManifest(await this.storage.getItem(key));
    if (manifest) {
      // Keep the manifest until all chunks are gone, so a later retry can clean up.
      await this.removeChunkKeys(this.chunkKeysForManifest(key, manifest));
    }
    await this.storage.removeItem(key);
  }

  private chunkKeysForManifest(key: string, manifest: ChunkManifest): string[] {
    return Array.from({ length: manifest.chunks }, (_, index) =>
      chunkKey(key, manifest.generation, index),
    );
  }

  private async removeChunkKeys(keys: string[]): Promise<void> {
    for (const chunk of keys) {
      await this.storage.removeItem(chunk);
    }
  }

  private async removeChunkKeysBestEffort(keys: string[]): Promise<void> {
    try {
      await this.removeChunkKeys(keys);
    } catch {
      // A future remove can retry; never report cleanup as a failed session write.
    }
  }

  private decode(value: string): string | null {
    try {
      return decodeURIComponent(value);
    } catch {
      return null;
    }
  }
}

export function createLocalStorageAdapter(storage: Storage): KeyValueStorage {
  return {
    getItem: async (key) => storage.getItem(key),
    setItem: async (key, value) => storage.setItem(key, value),
    removeItem: async (key) => storage.removeItem(key),
  };
}
