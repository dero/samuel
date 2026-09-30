/**
 * Typed promise-based RPC client for Samuel's single shared DB worker
 * (`dbWorker.ts`). One worker instance is created lazily on first use and
 * kept for the session. It is disposable: cancelling a download and deleting
 * the DB terminate it (pending calls reject) and the next call spawns a fresh
 * one - see dbWorker.ts for the rationale and how to add new DB-backed ops.
 */

import { ACTIVE_POINTER_FILENAME } from './opfsLayout';

import type { WordMatch } from '../modules/words/wordsData';
import type { BruteforceResult, MorseSolverWeights } from '../modules/morse/morseSolver';
import type { CaesarCandidateRawScore } from '../modules/shifts/caesarScorer';

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

export type CaesarScoredCandidate = CaesarCandidateRawScore & { shift: number; isBest: boolean };

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

/** Rejection of a `downloadDatabase()` call cancelled via `cancelDownload()`. */
export class DownloadCancelledError extends Error {
  constructor() {
    super('Stahování slovníku bylo zrušeno.');
    this.name = 'DownloadCancelledError';
  }
}

/** A download reporting no progress for this long is treated as dead. */
const DOWNLOAD_STALL_TIMEOUT_MS = 30000;

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

let cachedWorldFlags: WorldFlagRecord[] | null = null;

/**
 * Synchronously kills the DB worker - aborting any in-flight download and
 * releasing its OPFS handles - and rejects every pending call with `reason`.
 * Never throws; the next call spawns a fresh worker.
 */
export function terminateWorker(reason: Error = new Error('DB worker terminated')): void {
  const w = worker;
  worker = null;
  cachedWorldFlags = null;
  try {
    w?.terminate();
  } catch (e) {
    console.warn('[dbClient] Error terminating worker:', e);
  }
  const entries = [...pending.values()];
  pending.clear();
  for (const entry of entries) entry.reject(reason);
}

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
    terminateWorker(new Error('DB worker crashed'));
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

// Caesar re-scores on every keystroke; only the latest text matters.
const caesarScoreGate = new SingleFlightGate<string[], CaesarScoredCandidate[]>((shiftedTexts) =>
  callWorker<CaesarScoredCandidate[]>('caesarScore', { shiftedTexts })
);

// ---------------------------------------------------------------------------
// Public client API
// ---------------------------------------------------------------------------

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
   * Starts building the shared Morse/Caesar lexicon in the DB worker ahead of
   * use (the first build takes a few seconds on phones). Fire-and-forget.
   */
  warmLexicon(kind: 'morse' | 'caesar'): void {
    callWorker('warmLexicon', { kind }).catch(() => {
      // DB not installed - the solvers report that themselves when used.
    });
  }

  /** Unspaced Morse solve against the dictionary lexicon, run in the DB worker. */
  morseSolve(code: string, maxResults = 50, weights?: Partial<MorseSolverWeights>): Promise<BruteforceResult> {
    return callWorker<BruteforceResult>('morseSolve', { code, maxResults, weights });
  }

  /**
   * Scores Caesar shift candidates against the dictionary lexicon in the DB
   * worker. Single-flight like searchWords(): superseded calls reject with
   * SupersededError.
   */
  caesarScore(shiftedTexts: string[]): Promise<CaesarScoredCandidate[]> {
    return caesarScoreGate.run(shiftedTexts);
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
   *
   * Rejects with DownloadCancelledError after `cancelDownload()`. A download
   * that stops reporting progress kills the worker and rejects, so it can
   * never hang.
   */
  async downloadDatabase(
    url: string,
    expected: { sizeBytes?: number; hash?: string },
    onProgress?: (progress: DbDownloadProgress) => void
  ): Promise<DbDownloadResult> {
    let stallTimer: ReturnType<typeof setTimeout> | undefined;
    const armStallTimer = () => {
      clearTimeout(stallTimer);
      stallTimer = setTimeout(() => {
        terminateWorker(new Error('Stahování slovníku se zastavilo (síťové spojení neodpovídá).'));
      }, DOWNLOAD_STALL_TIMEOUT_MS);
    };

    armStallTimer();
    try {
      const result = await callWorker<DbDownloadResult>(
        'downloadDb',
        { url, expectedSizeBytes: expected.sizeBytes, expectedHash: expected.hash },
        (progress) => {
          armStallTimer();
          onProgress?.(progress);
        }
      );
      this.resetCaches();
      return result;
    } finally {
      clearTimeout(stallTimer);
    }
  }

  /** Aborts an in-flight download by killing the worker. The active DB is untouched. */
  cancelDownload(): void {
    terminateWorker(new DownloadCancelledError());
  }

  /**
   * Deletes the dictionary without the worker's cooperation: kills it, then
   * removes the active pointer so no DB counts as installed. The next worker
   * unlinks the orphaned pool files during its init.
   */
  async deleteDb(): Promise<void> {
    terminateWorker();
    if (!navigator.storage?.getDirectory) return; // in-memory mode: nothing persisted
    const root = await navigator.storage.getDirectory();
    await root.removeEntry(ACTIVE_POINTER_FILENAME).catch((err: unknown) => {
      if ((err as DOMException)?.name !== 'NotFoundError') throw err;
    });
  }

  /** Clears client-side caches (world flags) after a DB swap/delete. */
  resetCaches(): void {
    cachedWorldFlags = null;
  }
}

export const dbClient = new DbClient();
