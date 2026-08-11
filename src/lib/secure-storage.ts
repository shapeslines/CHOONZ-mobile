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

type CleanupState = 'pending' | 'retired';

interface CleanupJournalEntry {
  generation: number;
  chunks: number;
  state: CleanupState;
}

interface CleanupJournal {
  version: 1;
  entries: CleanupJournalEntry[];
}

interface LoadedCleanupJournal {
  journal: CleanupJournal;
  exists: boolean;
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

/** The journal only records chunk coordinates, never session contents or tokens. */
export function secureStoreCleanupJournalKey(key: string): string {
  assertSecureStoreKey(key);
  const next = `${key}.journal`;
  assertSecureStoreKey(next);
  return next;
}

function isPositiveSafeInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value > 0;
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
      isPositiveSafeInteger((parsed as Record<string, unknown>).chunks) &&
      isPositiveSafeInteger((parsed as Record<string, unknown>).generation)
    ) {
      return parsed as ChunkManifest;
    }
  } catch {
    // A pre-adapter value is returned as-is for the Supabase client to handle.
  }
  return null;
}

function parseCleanupJournal(value: string): CleanupJournal | null {
  try {
    const parsed: unknown = JSON.parse(value);
    if (
      !parsed ||
      typeof parsed !== 'object' ||
      Array.isArray(parsed) ||
      (parsed as Record<string, unknown>).version !== 1 ||
      !Array.isArray((parsed as Record<string, unknown>).entries)
    ) {
      return null;
    }
    const entries = (parsed as Record<string, unknown>).entries as unknown[];
    const generations = new Set<number>();
    const normalized: CleanupJournalEntry[] = [];
    for (const entry of entries) {
      if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
        return null;
      }
      const candidate = entry as Record<string, unknown>;
      if (
        !isPositiveSafeInteger(candidate.generation) ||
        !isPositiveSafeInteger(candidate.chunks) ||
        (candidate.state !== 'pending' && candidate.state !== 'retired') ||
        generations.has(candidate.generation)
      ) {
        return null;
      }
      generations.add(candidate.generation);
      normalized.push({
        generation: candidate.generation,
        chunks: candidate.chunks,
        state: candidate.state,
      });
    }
    return { version: 1, entries: normalized };
  } catch {
    return null;
  }
}

function mergeJournalEntries(
  existing: readonly CleanupJournalEntry[],
  additions: readonly CleanupJournalEntry[],
): CleanupJournal {
  const merged = new Map<number, CleanupJournalEntry>();
  for (const entry of [...existing, ...additions]) {
    const prior = merged.get(entry.generation);
    merged.set(entry.generation, {
      generation: entry.generation,
      chunks: Math.max(prior?.chunks ?? 0, entry.chunks),
      state: prior?.state === 'retired' || entry.state === 'retired' ? 'retired' : 'pending',
    });
  }
  return {
    version: 1,
    entries: [...merged.values()].sort((left, right) => left.generation - right.generation),
  };
}

function nextGeneration(previous: ChunkManifest | null, journal: CleanupJournal): number {
  const highest = Math.max(
    previous?.generation ?? 0,
    ...journal.entries.map((entry) => entry.generation),
  );
  if (highest >= Number.MAX_SAFE_INTEGER) {
    throw new Error('SecureStore session generation space is exhausted.');
  }
  return highest + 1;
}

/**
 * A native SecureStore adapter. Every payload is encoded into generation-scoped
 * chunks whose keys satisfy SecureStore's `^[\\w.-]+$` grammar. A journal records
 * only pending/retired chunk coordinates before writes or manifest replacement,
 * so failed cleanup remains retryable without retaining any session value there.
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
    await this.retryCleanupJournal(key, previous);
    const { journal } = await this.readCleanupJournal(key);
    const generation = nextGeneration(previous, journal);
    const encoded = encodeURIComponent(value);
    const chunks = Array.from(
      { length: Math.max(1, Math.ceil(encoded.length / this.chunkSize)) },
      (_, index) => encoded.slice(index * this.chunkSize, (index + 1) * this.chunkSize),
    );
    const nextManifest: ChunkManifest = {
      version: 2,
      chunks: chunks.length,
      generation,
      encoding: 'uri',
    };
    const newChunkKeys = chunks.map((_chunk, index) => chunkKey(key, generation, index));

    // Reserve both generations before any new chunk can exist. The previous
    // generation is active until the manifest switch, so cleanup skips it.
    await this.reserveCleanupGenerations(key, [
      { generation, chunks: chunks.length, state: 'pending' },
      ...(previous
        ? [{ generation: previous.generation, chunks: previous.chunks, state: 'retired' as const }]
        : []),
    ]);

    try {
      for (const [index, chunk] of chunks.entries()) {
        await this.storage.setItem(newChunkKeys[index]!, chunk);
      }
    } catch (error) {
      await this.retryCleanupJournalBestEffort(key, previous);
      throw error;
    }

    try {
      await this.storage.setItem(key, JSON.stringify(nextManifest));
    } catch (error) {
      await this.retryCleanupJournalBestEffort(key, previous);
      throw error;
    }

    // The new manifest is active. Retired and interrupted generations can now
    // be retried; failure remains recorded in the journal for a future set/remove.
    await this.retryCleanupJournalBestEffort(key, nextManifest);
  }

  async removeItem(key: string): Promise<void> {
    assertSecureStoreKey(key);
    const manifest = parseManifest(await this.storage.getItem(key));
    await this.retryCleanupJournal(key, manifest);

    if (manifest) {
      await this.reserveCleanupGenerations(key, [
        { generation: manifest.generation, chunks: manifest.chunks, state: 'retired' },
      ]);
      // Keep the active manifest until every active chunk has been deleted. If
      // a delete fails, its journal entry and the active manifest both survive.
      await this.removeChunkKeys(this.chunkKeysForManifest(key, manifest));
    }

    await this.storage.removeItem(key);
    await this.retryCleanupJournalBestEffort(key, null);
  }

  private async readCleanupJournal(key: string): Promise<LoadedCleanupJournal> {
    const value = await this.storage.getItem(secureStoreCleanupJournalKey(key));
    if (value === null) {
      return { journal: { version: 1, entries: [] }, exists: false };
    }
    const journal = parseCleanupJournal(value);
    if (!journal) {
      throw new Error('SecureStore cleanup journal is malformed.');
    }
    return { journal, exists: true };
  }

  private async persistCleanupJournal(key: string, journal: CleanupJournal): Promise<void> {
    const journalKey = secureStoreCleanupJournalKey(key);
    if (journal.entries.length === 0) {
      await this.storage.removeItem(journalKey);
      return;
    }
    await this.storage.setItem(journalKey, JSON.stringify(journal));
  }

  private async reserveCleanupGenerations(
    key: string,
    additions: readonly CleanupJournalEntry[],
  ): Promise<void> {
    const { journal } = await this.readCleanupJournal(key);
    await this.persistCleanupJournal(key, mergeJournalEntries(journal.entries, additions));
  }

  private async retryCleanupJournal(key: string, active: ChunkManifest | null): Promise<void> {
    const { journal, exists } = await this.readCleanupJournal(key);
    if (!exists) {
      return;
    }
    const remaining: CleanupJournalEntry[] = [];
    for (const entry of journal.entries) {
      if (active?.generation === entry.generation) {
        continue;
      }
      try {
        await this.removeChunkKeys(this.chunkKeysForGeneration(key, entry.generation, entry.chunks));
      } catch {
        remaining.push(entry);
      }
    }
    await this.persistCleanupJournal(key, { version: 1, entries: remaining });
  }

  private async retryCleanupJournalBestEffort(
    key: string,
    active: ChunkManifest | null,
  ): Promise<void> {
    try {
      await this.retryCleanupJournal(key, active);
    } catch {
      // The journal itself remains the durable retry record; never log session metadata.
    }
  }

  private chunkKeysForManifest(key: string, manifest: ChunkManifest): string[] {
    return this.chunkKeysForGeneration(key, manifest.generation, manifest.chunks);
  }

  private chunkKeysForGeneration(key: string, generation: number, chunks: number): string[] {
    return Array.from({ length: chunks }, (_, index) => chunkKey(key, generation, index));
  }

  private async removeChunkKeys(keys: string[]): Promise<void> {
    for (const chunk of keys) {
      await this.storage.removeItem(chunk);
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
