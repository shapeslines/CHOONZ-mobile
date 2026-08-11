export interface KeyValueStorage {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
}

interface ChunkManifest {
  version: 1;
  chunks: number;
  encoding: 'uri';
}

export const DEFAULT_SECURE_STORE_CHUNK_SIZE = 1400;
const INLINE_PREFIX = 'choonz:v1:';
const CHUNK_MARKER = '::chunk::';

function chunkKey(key: string, index: number): string {
  return `${key}${CHUNK_MARKER}${index}`;
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
      (parsed as Record<string, unknown>).version === 1 &&
      (parsed as Record<string, unknown>).encoding === 'uri' &&
      Number.isInteger((parsed as Record<string, unknown>).chunks) &&
      Number((parsed as Record<string, unknown>).chunks) > 0
    ) {
      return parsed as ChunkManifest;
    }
  } catch {
    // A legacy raw Supabase value is not a chunk manifest.
  }
  return null;
}

/**
 * A Supabase storage adapter for native SecureStore. SecureStore values have a
 * conservative size boundary, so encoded sessions are split before storage.
 * The base key is a manifest only after all chunks have been persisted.
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
    const base = await this.storage.getItem(key);
    if (base === null) {
      return null;
    }
    if (base.startsWith(INLINE_PREFIX)) {
      return this.decode(base.slice(INLINE_PREFIX.length));
    }

    const manifest = parseManifest(base);
    if (!manifest) {
      return base;
    }

    const chunks = await Promise.all(
      Array.from({ length: manifest.chunks }, (_, index) => this.storage.getItem(chunkKey(key, index))),
    );
    if (chunks.some((chunk) => chunk === null)) {
      return null;
    }
    return this.decode(chunks.join(''));
  }

  async setItem(key: string, value: string): Promise<void> {
    const previous = parseManifest(await this.storage.getItem(key));
    const encoded = encodeURIComponent(value);

    if (encoded.length <= this.chunkSize) {
      await this.storage.setItem(key, `${INLINE_PREFIX}${encoded}`);
      await this.removeChunks(key, previous?.chunks ?? 0);
      return;
    }

    const chunks = Array.from(
      { length: Math.ceil(encoded.length / this.chunkSize) },
      (_, index) => encoded.slice(index * this.chunkSize, (index + 1) * this.chunkSize),
    );
    await Promise.all(chunks.map((chunk, index) => this.storage.setItem(chunkKey(key, index), chunk)));
    await this.storage.setItem(
      key,
      JSON.stringify({ version: 1, chunks: chunks.length, encoding: 'uri' } satisfies ChunkManifest),
    );
    await this.removeChunks(key, Math.max(0, (previous?.chunks ?? 0) - chunks.length), chunks.length);
  }

  async removeItem(key: string): Promise<void> {
    const manifest = parseManifest(await this.storage.getItem(key));
    await this.storage.removeItem(key);
    await this.removeChunks(key, manifest?.chunks ?? 0);
  }

  private async removeChunks(key: string, count: number, startAt = 0): Promise<void> {
    await Promise.all(
      Array.from({ length: count }, (_, index) => this.storage.removeItem(chunkKey(key, startAt + index))),
    );
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
