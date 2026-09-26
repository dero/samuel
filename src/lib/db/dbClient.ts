/**
 * Typed promise-based RPC client for Samuel's single shared DB worker
 * (`dbWorker.ts`). Exactly one worker instance is created per app session,
 * lazily on first use, and it is never terminated - see dbWorker.ts for the
 * full architecture rationale and instructions on adding new DB-backed ops.
 */

import {
  LEXICON_SQL_QUERY,
  RUIAN_MULTIWORD_SQL_QUERY,
  parseLexiconRows,
  type RawLexiconWord
} from './lexiconDb';
import type { WordMatch } from '../modules/words/wordsData';

export interface WorldFlagRecord {
  id: number;
  code: string;
  code3: string;
  name_cs: string;
  name_cs_nodiac: string;
  name_en: string;
  capital_cs: string;
  capital_cs_nodiac: string;
  capital_en: string;
  continent: string;
  colors: string[];
  features: string[];
  svg_4x3: string;
  svg_1x1: string;
}

export interface LexiconWordItem {
  word: string;
  isCipher: boolean;
  isRuian: boolean;
  freq: number;
}

export interface WordsSearchParams {
  query: string;
  mode: 'mask' | 'anagram';
  useRegex?: boolean;
  ignoreDiacritics?: boolean;
  onlySubstantives?: boolean;
  includeProperNames?: boolean;
  includeRuian?: boolean;
  limit?: number;
}

export interface WordsSearchResult {
  results: WordMatch[];
  hasMore: boolean;
}

export interface T9QueryResult {
  digits: string;
  candidates: string[];
}

export interface DbDownloadProgress {
  percent: number;
  loadedBytes: number;
  totalBytes: number;
}

export interface DbDownloadResult {
  sizeBytes: number;
  hash: string;
}

/** Thrown when a queued `searchWords()` call is superseded by a newer one. */
export class SupersededError extends Error {
  constructor() {
    super('Superseded by a newer request');
    this.name = 'SupersededError';
  }
}

// ---------------------------------------------------------------------------
// Worker lifecycle + raw RPC
// ---------------------------------------------------------------------------

let worker: Worker | null = null;
let nextId = 1;

interface PendingEntry {
  resolve: (value: any) => void;
  reject: (err: any) => void;
  onProgress?: (progress: DbDownloadProgress) => void;
}

const pending = new Map<number, PendingEntry>();

function getWorker(): Worker {
  if (worker) return worker;

  worker = new Worker(new URL('./dbWorker.ts', import.meta.url), { type: 'module' });

  worker.onmessage = (e: MessageEvent) => {
    const { id, type } = e.data;
    if (type === 'progress') {
      pending.get(id)?.onProgress?.(e.data as DbDownloadProgress);
      return;
    }
    const entry = pending.get(id);
    if (!entry) return;
    pending.delete(id);
    if (e.data.ok) {
      entry.resolve(e.data.result);
    } else {
      entry.reject(new Error(e.data.error || 'DB worker error'));
    }
  };

  worker.onerror = (err) => {
    console.error('[dbClient] DB worker crashed:', err);
  };

  return worker;
}

function callWorker<T>(
  op: string,
  payload: Record<string, unknown> = {},
  onProgress?: (progress: DbDownloadProgress) => void
): Promise<T> {
  const w = getWorker();
  const id = nextId++;
  return new Promise<T>((resolve, reject) => {
    pending.set(id, { resolve, reject, onProgress });
    w.postMessage({ id, op, ...payload });
  });
}

// ---------------------------------------------------------------------------
// Single-flight request gate (Task 6: request gating for words search)
// ---------------------------------------------------------------------------

class SingleFlightGate<P, R> {
  private inFlight = false;
  private queued: { params: P; resolve: (r: R) => void; reject: (e: any) => void } | null = null;

  constructor(private readonly exec: (params: P) => Promise<R>) {}

  run(params: P): Promise<R> {
    return new Promise<R>((resolve, reject) => {
      if (!this.inFlight) {
        this.inFlight = true;
        this.execAndDrain(params, resolve, reject);
      } else {
        // A request is already running: keep only the newest pending one and
        // drop (reject with SupersededError) whatever was queued before it.
        this.queued?.reject(new SupersededError());
        this.queued = { params, resolve, reject };
      }
    });
  }

  private execAndDrain(params: P, resolve: (r: R) => void, reject: (e: any) => void): void {
    this.exec(params).then(
      (result) => {
        resolve(result);
        this.next();
      },
      (err) => {
        reject(err);
        this.next();
      }
    );
  }

  private next(): void {
    if (this.queued) {
      const { params, resolve, reject } = this.queued;
      this.queued = null;
      this.execAndDrain(params, resolve, reject);
    } else {
      this.inFlight = false;
    }
  }
}

const wordsSearchGate = new SingleFlightGate<WordsSearchParams, WordsSearchResult>((params) =>
  callWorker<WordsSearchResult>('wordsSearch', params as unknown as Record<string, unknown>)
);

// ---------------------------------------------------------------------------
// Public client API
// ---------------------------------------------------------------------------

let cachedLexiconWords: LexiconWordItem[] | null = null;
let cachedWorldFlags: WorldFlagRecord[] | null = null;

class DbClient {
  /**
   * Runs a mask/anagram words search. At most one search runs against the DB
   * worker at a time; if called again while a search is in flight, only the
   * latest call survives and superseded ones reject with SupersededError
   * (callers should catch and silently ignore it - see WordsModule.svelte).
   */
  searchWords(params: WordsSearchParams): Promise<WordsSearchResult> {
    return wordsSearchGate.run(params);
  }

  t9Query(digits: string, limit = 12): Promise<T9QueryResult> {
    if (!digits) return Promise.resolve({ digits: '', candidates: [] });
    return callWorker<T9QueryResult>('t9Query', { digits, limit });
  }

  async getWorldFlags(): Promise<WorldFlagRecord[]> {
    if (cachedWorldFlags) return cachedWorldFlags;
    const rows = await callWorker<any[]>('getWorldFlags');
    cachedWorldFlags = rows.map((row) => {
      let colors: string[] = [];
      let features: string[] = [];
      try {
        colors = JSON.parse(String(row.colors || '[]'));
      } catch {
        // ignore
      }
      try {
        features = JSON.parse(String(row.features || '[]'));
      } catch {
        // ignore
      }
      return {
        id: Number(row.id),
        code: String(row.code),
        code3: String(row.code3),
        name_cs: String(row.name_cs),
        name_cs_nodiac: String(row.name_cs_nodiac),
        name_en: String(row.name_en),
        capital_cs: String(row.capital_cs),
        capital_cs_nodiac: String(row.capital_cs_nodiac),
        capital_en: String(row.capital_en),
        continent: String(row.continent),
        colors,
        features,
        svg_4x3: String(row.svg_4x3 || ''),
        svg_1x1: String(row.svg_1x1 || '')
      };
    });
    return cachedWorldFlags;
  }

  /**
   * Loads the shared lexicon vocabulary (puzzle keywords + RUIAN place names +
   * Czech substantives/corpus words) used by Morse's unspaced solver and the
   * Caesar/Vigenere/Autokey scorer in Shifts. Both previously opened their own
   * copy of the whole DB in a dedicated worker; now they fetch the same rows
   * from the one shared DB worker through the generic `query` op.
   */
  async getLexiconWords(): Promise<LexiconWordItem[]> {
    if (cachedLexiconWords) return cachedLexiconWords;

    const rows = await this.query<{ w: string | number; is_cipher: number; is_ruian: number; freq: number }>(
      LEXICON_SQL_QUERY
    );
    const multiRows = await this.query<{ word_nodiac: string }>(RUIAN_MULTIWORD_SQL_QUERY);

    const raw: RawLexiconWord[] = parseLexiconRows(rows, multiRows);
    cachedLexiconWords = raw.map((r) => ({
      word: r.word,
      isCipher: r.isCipher,
      isRuian: r.isRuian,
      freq: r.freq
    }));
    return cachedLexiconWords;
  }

  /** Generic read-only SELECT passthrough - see dbWorker.ts for how to add a dedicated op instead. */
  query<T = Record<string, unknown>>(sql: string, params?: Record<string, unknown>): Promise<T[]> {
    return callWorker<T[]>('query', { sql, params });
  }

  async isDbInstalled(): Promise<boolean> {
    try {
      const status = await callWorker<{ installed: boolean }>('status');
      return status.installed;
    } catch {
      return false;
    }
  }

  async getStorageMode(): Promise<'opfs' | 'memory' | 'none'> {
    try {
      const status = await callWorker<{ storageMode: 'opfs' | 'memory' | 'none' }>('status');
      return status.storageMode;
    } catch {
      return 'none';
    }
  }

  /**
   * Streams `url` directly into OPFS inside the worker (or into a single
   * in-memory buffer if OPFS is unavailable), verifying size + SHA-256 + a
   * `PRAGMA quick_check` before activating it. The previous DB (if any) stays
   * fully usable until the new one is verified.
   */
  async downloadDatabase(
    url: string,
    expected: { sizeBytes?: number; hash?: string },
    onProgress?: (progress: DbDownloadProgress) => void
  ): Promise<DbDownloadResult> {
    const result = await callWorker<DbDownloadResult>(
      'downloadDb',
      { url, expectedSizeBytes: expected.sizeBytes, expectedHash: expected.hash },
      onProgress
    );
    this.resetCaches();
    return result;
  }

  async deleteDb(): Promise<void> {
    await callWorker<void>('deleteDb');
    this.resetCaches();
  }

  /** Clears client-side caches (lexicon words, world flags) after a DB swap/delete. */
  resetCaches(): void {
    cachedLexiconWords = null;
    cachedWorldFlags = null;
  }
}

export const dbClient = new DbClient();
