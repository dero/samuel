/**
 * Samuel shared SQLite DB worker.
 *
 * ONE dedicated worker per app session hosts the entire words.db dictionary
 * (words, ruian, world_flags tables) using @sqlite.org/sqlite-wasm with the
 * OPFS "sahpool" VFS. Unlike the previous sql.js setup, the database is never
 * fully copied into the WASM heap: SQLite reads pages on demand straight from
 * OPFS, so opening/using the DB costs a few KB of memory instead of ~100+ MB.
 *
 * This worker is started lazily on first need and is NEVER terminated for the
 * lifetime of the app session (module workers used to be spun up/torn down on
 * every module enter/exit, forcing a full re-read of the DB each time).
 *
 * RPC protocol: every request `{ id, op, ...payload }` posted to this worker
 * gets exactly one `{ id, ok: true, result }` or `{ id, ok: false, error }`
 * response. Long-running ops (currently only 'downloadDb') may additionally
 * post `{ id, type: 'progress', ...payload }` messages before the final
 * response - these are not terminal and do not resolve the RPC promise.
 *
 * --- How to add a new DB-backed op (for follow-up agents, e.g. Morse/Caesar
 * lexicon work) ---
 * 1. Add a case to the `handleOp` switch below that reads whatever it needs
 *    via `getDb()` (see `opWordsSearch` / `opT9Query` for examples using
 *    prepared statements, or just call `runQuery()` for a plain SELECT).
 * 2. Add a typed wrapper method on `DbClient` in `dbClient.ts` that calls
 *    `callWorker('yourOp', payload)`.
 * 3. If the query is a simple ad-hoc read-only SELECT with no server-side
 *    post-processing, you don't need a new op at all - use the existing
 *    generic `query` op via `dbClient.query(sql, params)`.
 */

import sqlite3InitModule, {
  type Database,
  type Sqlite3Static,
  type SAHPoolUtil
} from '@sqlite.org/sqlite-wasm';
import { removeDiacritics } from '../utils/text';
import { computeMaskNodiac, isExactAnagram, isSubAnagram, type WordMatch } from '../modules/words/wordsData';
import { T9_PUNCTUATION, DIGIT_TO_GLOB, getFallbackT9Word } from '../modules/mobile/t9Data';
import { Sha256Incremental } from './sha256';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SAHPOOL_VFS_NAME = 'samuel-opfs-sahpool';
// The sahpool VFS has no rename, so every installed DB gets its own unique
// pool filename (`/words-<tag>.db`) and a tiny plain-OPFS pointer file names
// the active one. An update streams into a fresh filename, is verified in
// place, then the pointer is flipped and the old file unlinked - the ~100 MB
// payload is never copied or read back into memory.
const DB_FILE_PREFIX = '/words-';
const DB_FILE_SUFFIX = '.db';
const ACTIVE_POINTER_FILENAME = 'samuel-db-active.txt';
const LEGACY_CACHE_NAME = 'samuel-db';
const LEGACY_CACHE_URL = '/words.db';

function newDbFilename(tag?: string): string {
  const safeTag = (tag || Date.now().toString(36)).replace(/[^a-z0-9]/gi, '');
  return `${DB_FILE_PREFIX}${safeTag}${DB_FILE_SUFFIX}`;
}

async function readActivePointer(): Promise<string | null> {
  try {
    const root = await navigator.storage.getDirectory();
    const handle = await root.getFileHandle(ACTIVE_POINTER_FILENAME);
    const text = (await (await handle.getFile()).text()).trim();
    return text.startsWith(DB_FILE_PREFIX) ? text : null;
  } catch {
    return null;
  }
}

// Uses a sync access handle (available in dedicated workers on every browser
// that supports sahpool) rather than createWritable(), which older Safari lacks.
async function writeActivePointer(filename: string): Promise<void> {
  const root = await navigator.storage.getDirectory();
  const handle = await root.getFileHandle(ACTIVE_POINTER_FILENAME, { create: true });
  const access = await (handle as any).createSyncAccessHandle();
  try {
    const bytes = new TextEncoder().encode(filename);
    access.truncate(0);
    access.write(bytes, { at: 0 });
    access.flush();
  } finally {
    access.close();
  }
}

async function deleteActivePointer(): Promise<void> {
  try {
    const root = await navigator.storage.getDirectory();
    await root.removeEntry(ACTIVE_POINTER_FILENAME);
  } catch {
    // ignore - may not exist
  }
}

/** Unlinks every pool file (incl. journals) except those belonging to `keep`. */
function unlinkPoolFilesExcept(keep: string | null): void {
  if (!poolUtil) return;
  for (const name of poolUtil.getFileNames()) {
    if (keep && name.startsWith(keep)) continue;
    try {
      poolUtil.unlink(name);
    } catch {
      // ignore
    }
  }
}

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

type StorageMode = 'opfs' | 'memory' | 'none';

let sqlite3: Sqlite3Static | null = null;
let poolUtil: SAHPoolUtil | null = null;
let db: Database | null = null;
let storageMode: StorageMode = 'none';
let initPromise: Promise<void> | null = null;
const regexCache = new Map<string, RegExp | null>();

// ---------------------------------------------------------------------------
// RPC plumbing
// ---------------------------------------------------------------------------

interface RpcRequest {
  id: number;
  op: string;
  [key: string]: unknown;
}

function postProgress(id: number, payload: Record<string, unknown>): void {
  (self as unknown as Worker).postMessage({ id, type: 'progress', ...payload });
}

self.onmessage = async (e: MessageEvent<RpcRequest>) => {
  const { id, op, ...payload } = e.data;
  try {
    const result = await handleOp(op, payload, id);
    (self as unknown as Worker).postMessage({ id, ok: true, result });
  } catch (err: any) {
    (self as unknown as Worker).postMessage({ id, ok: false, error: err?.message || String(err) });
  }
};

async function handleOp(op: string, payload: any, id: number): Promise<unknown> {
  switch (op) {
    case 'init':
      await ensureInit();
      return { storageMode };
    case 'status':
      // Opening the active OPFS DB (or migrating a legacy one) is what makes
      // it "installed", so status must initialize first. Init failures just
      // report "not installed".
      await ensureInit().catch((err) => console.warn('[dbWorker] init failed:', err));
      return opStatus();
    case 'wordsSearch':
      await ensureInit();
      return opWordsSearch(payload);
    case 't9Query':
      await ensureInit();
      return opT9Query(payload);
    case 'getWorldFlags':
      await ensureInit();
      return opGetWorldFlags();
    case 'query':
      await ensureInit();
      return opGenericQuery(payload);
    case 'downloadDb':
      // Must run ensureInit() first: on a brand-new install this download
      // call is the very first RPC the worker ever receives (bootstrap.ts),
      // so sqlite3/poolUtil would otherwise still be null here, wrongly
      // tripping the in-memory fallback instead of using OPFS.
      await ensureInit();
      return opDownloadDb(payload, id);
    case 'deleteDb':
      return opDeleteDb();
    default:
      throw new Error(`Unknown DB worker op: ${op}`);
  }
}

// ---------------------------------------------------------------------------
// Init / storage backend selection
// ---------------------------------------------------------------------------

async function ensureInit(): Promise<void> {
  if (db) return;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    sqlite3 = await sqlite3InitModule();

    const opfsAvailable = await tryInstallSahPool();

    if (opfsAvailable) {
      await openOrBootstrapOpfsDb();
    } else {
      console.warn('[dbWorker] OPFS sahpool VFS unavailable, falling back to in-memory DB (one copy only).');
      await openInMemoryDb();
    }

    if (db) {
      registerRegexFunction(db);
    }
  })();

  try {
    await initPromise;
  } catch (err) {
    initPromise = null;
    throw err;
  }
}

// When the page reloads, the previous page's DB worker can keep its OPFS
// access handles for a moment after the new worker starts; another open tab
// holds them indefinitely. Retry for a while before giving up.
const SAHPOOL_LOCK_RETRY_MS = [100, 200, 400, 800, 1200, 1600, 2000, 2500];

class OpfsLockedError extends Error {}

/**
 * Returns true when the OPFS pool is ready, false when the browser lacks the
 * required APIs (caller falls back to an in-memory DB). Throws when OPFS
 * exists but stays locked by another tab - falling back to memory there
 * would wrongly report the installed dictionary as missing.
 */
async function tryInstallSahPool(): Promise<boolean> {
  if (!sqlite3 || typeof sqlite3.installOpfsSAHPoolVfs !== 'function') return false;
  for (let attempt = 0; ; attempt++) {
    try {
      const options = {
        name: SAHPOOL_VFS_NAME,
        // 2 slots per DB file (main + journal); during an update the old and
        // the new DB coexist briefly, so reserve room for both plus spare.
        initialCapacity: 8,
        // The library caches a failed install; allow retrying after a lock.
        // Supported at runtime but missing from the bundled typings.
        forceReinitIfPreviouslyFailed: true
      };
      poolUtil = await sqlite3.installOpfsSAHPoolVfs(options);
      return true;
    } catch (err: any) {
      poolUtil = null;
      if (err?.name !== 'NoModificationAllowedError') {
        console.warn('[dbWorker] installOpfsSAHPoolVfs failed:', err);
        return false;
      }
      if (attempt >= SAHPOOL_LOCK_RETRY_MS.length) {
        throw new OpfsLockedError(
          'Slovník je právě používán v jiné záložce. Zavřete ostatní záložky se Samuelem a aplikaci obnovte.'
        );
      }
      await new Promise((r) => setTimeout(r, SAHPOOL_LOCK_RETRY_MS[attempt]));
    }
  }
}

async function openOrBootstrapOpfsDb(): Promise<void> {
  if (!poolUtil) throw new Error('OPFS pool not installed');

  storageMode = 'opfs';
  const active = await readActivePointer();

  if (active && poolUtil.getFileNames().includes(active)) {
    // Drop leftovers of an interrupted download (never pointed to = unverified).
    unlinkPoolFilesExcept(active);
    db = new poolUtil.OpfsSAHPoolDb(active);
    return;
  }

  // No valid active DB: anything in the pool is an unverified leftover.
  unlinkPoolFilesExcept(null);

  // Migration path: pre-existing sql.js users have the DB in CacheStorage.
  const migrated = await migrateFromCacheStorage();
  if (migrated) {
    db = new poolUtil.OpfsSAHPoolDb(migrated);
    return;
  }

  // Dev mode: DB is served statically by Vite at /words.db - auto-import on
  // first use so `yarn dev` works without a manual download step.
  if (import.meta.env.DEV) {
    const imported = await importFromNetwork('/words.db');
    if (imported) {
      db = new poolUtil.OpfsSAHPoolDb(imported);
      return;
    }
  }

  // No DB available yet - isDbInstalled() reports false until a download.
}

async function openInMemoryDb(): Promise<void> {
  if (!sqlite3) throw new Error('sqlite3 not initialized');

  let buffer: Uint8Array | null = await readLegacyCacheBuffer();
  if (!buffer && import.meta.env.DEV) {
    try {
      const resp = await fetch('/words.db');
      if (resp.ok) buffer = new Uint8Array(await resp.arrayBuffer());
    } catch {
      // ignore
    }
  }

  if (!buffer) {
    storageMode = 'memory';
    db = null;
    return;
  }

  db = new sqlite3.oo1.DB(':memory:', 'c');
  sqlite3.capi.sqlite3_deserialize(
    db.pointer!,
    'main',
    sqlite3.wasm.allocFromTypedArray(buffer),
    buffer.byteLength,
    buffer.byteLength,
    sqlite3.capi.SQLITE_DESERIALIZE_FREEONCLOSE | sqlite3.capi.SQLITE_DESERIALIZE_RESIZEABLE
  );
  storageMode = 'memory';

  if (await cacheStorageHasDb()) {
    await deleteLegacyCache();
  }
}

function registerRegexFunction(target: Database): void {
  // Arity is explicit: sqlite-wasm otherwise derives it from fn.length, which
  // rest parameters would make 0 ("wrong number of arguments to REGEXP").
  const regexpFn = (_ctx: number, pattern: unknown, text: unknown) => {
    if (pattern == null || text == null) return 0;
    const patternStr = String(pattern);
    let re = regexCache.get(patternStr);
    if (re === undefined) {
      try {
        re = new RegExp(patternStr, 'i');
      } catch {
        re = null;
      }
      regexCache.set(patternStr, re);
    }
    if (!re) return 0;
    return re.test(String(text)) ? 1 : 0;
  };
  target.createFunction('REGEXP', regexpFn, { arity: 2, deterministic: true });
}

// ---------------------------------------------------------------------------
// Migration: CacheStorage 'samuel-db' -> OPFS (streamed, no full buffer)
// ---------------------------------------------------------------------------

async function cacheStorageHasDb(): Promise<boolean> {
  try {
    if (typeof self === 'undefined' || !('caches' in self)) return false;
    const cache = await self.caches.open(LEGACY_CACHE_NAME);
    const match = await cache.match(LEGACY_CACHE_URL);
    return Boolean(match);
  } catch {
    return false;
  }
}

async function readLegacyCacheBuffer(): Promise<Uint8Array | null> {
  try {
    if (typeof self === 'undefined' || !('caches' in self)) return null;
    const cache = await self.caches.open(LEGACY_CACHE_NAME);
    const match = await cache.match(LEGACY_CACHE_URL);
    if (!match) return null;
    return new Uint8Array(await match.arrayBuffer());
  } catch {
    return null;
  }
}

async function deleteLegacyCache(): Promise<void> {
  try {
    if (typeof self === 'undefined' || !('caches' in self)) return;
    await self.caches.delete(LEGACY_CACHE_NAME);
  } catch {
    // ignore
  }
}

// Max bytes handed to a single sahpool `sah.write()` call. Single writes in
// the ~100 MB range were observed to fail or silently truncate, so in-memory
// buffers (only the rare no-`response.body` path) are imported in slices.
// Streamed network/CacheStorage bodies are naturally chunked and unaffected.
const MAX_SAH_WRITE_CHUNK = 4 * 1024 * 1024;

/**
 * Imports an in-memory buffer via the sahpool's *chunked* `importDb(name, fn)`
 * overload, feeding it in bounded-size slices (see MAX_SAH_WRITE_CHUNK) rather
 * than the plain `importDb(name, Uint8Array)` overload or a single giant
 * chunked call - both were found to corrupt/misreport on buffers this large.
 */
function importBufferChunked(name: string, buffer: Uint8Array): Promise<number> {
  if (!poolUtil) throw new Error('OPFS pool not installed');
  let offset = 0;
  return poolUtil.importDb(name, () => {
    if (offset >= buffer.byteLength) return undefined;
    const end = Math.min(offset + MAX_SAH_WRITE_CHUNK, buffer.byteLength);
    const slice = buffer.subarray(offset, end);
    offset = end;
    return slice;
  });
}

/**
 * Streams a Response body into an OPFS sahpool-managed file via the chunked
 * `importDb(name, asyncCallback)` API, never buffering the whole file.
 */
async function importResponseStreamed(response: Response, targetName: string): Promise<number> {
  if (!poolUtil) throw new Error('OPFS pool not installed');
  if (!response.body) {
    const buf = new Uint8Array(await response.arrayBuffer());
    return importBufferChunked(targetName, buf);
  }
  const reader = response.body.getReader();
  const size = await poolUtil.importDb(targetName, async () => {
    const { done, value } = await reader.read();
    if (done) return undefined;
    return value;
  });
  return size;
}

async function migrateFromCacheStorage(): Promise<string | null> {
  if (!poolUtil) return null;
  const target = newDbFilename('migrated');

  try {
    const cache = await self.caches.open(LEGACY_CACHE_NAME);
    const match = await cache.match(LEGACY_CACHE_URL);
    if (!match) return null;

    console.log('[dbWorker] Migrating legacy CacheStorage words.db into OPFS...');
    await importResponseStreamed(match, target);

    // No expected hash is available here, so verify the page structure instead.
    if (!verifyOpfsDb(target)) {
      console.warn('[dbWorker] Migrated DB failed integrity check, discarding.');
      poolUtil.unlink(target);
      return null;
    }

    await writeActivePointer(target);
    await deleteLegacyCache();
    console.log('[dbWorker] Migration complete, legacy CacheStorage entry removed.');
    return target;
  } catch (err) {
    console.warn('[dbWorker] Migration from CacheStorage failed:', err);
    try {
      poolUtil.unlink(target);
    } catch {
      // ignore
    }
    return null;
  }
}

async function importFromNetwork(url: string): Promise<string | null> {
  if (!poolUtil) return null;
  const target = newDbFilename();
  try {
    const resp = await fetch(url);
    if (!resp.ok) return null;
    await importResponseStreamed(resp, target);
    if (!verifyOpfsDb(target)) throw new Error('integrity check failed');
    await writeActivePointer(target);
    return target;
  } catch (err) {
    console.warn('[dbWorker] importFromNetwork failed:', err);
    try {
      poolUtil.unlink(target);
    } catch {
      // ignore
    }
    return null;
  }
}

function verifyOpfsDb(name: string): boolean {
  if (!poolUtil) return false;
  let testDb: Database | null = null;
  try {
    testDb = new poolUtil.OpfsSAHPoolDb(name);
    const rows = testDb.selectArrays('PRAGMA quick_check');
    const ok = rows.length > 0 && String(rows[0][0]).toLowerCase() === 'ok';
    return ok;
  } catch {
    return false;
  } finally {
    try {
      testDb?.close();
    } catch {
      // ignore
    }
  }
}

// ---------------------------------------------------------------------------
// Op: status
// ---------------------------------------------------------------------------

function opStatus(): { installed: boolean; storageMode: StorageMode } {
  return { installed: Boolean(db), storageMode };
}

// ---------------------------------------------------------------------------
// Op: generic read-only query (used by Morse/Shifts lexicon loading, etc.)
// ---------------------------------------------------------------------------

function opGenericQuery(payload: { sql: string; params?: Record<string, unknown> }): unknown[] {
  const db2 = requireDb();
  const sql = String(payload.sql || '').trim();
  if (!/^select/i.test(sql)) {
    throw new Error('Generic query op only allows read-only SELECT statements');
  }
  return db2.selectObjects(sql, payload.params as any);
}

function requireDb(): Database {
  if (!db) throw new Error('DB_NOT_INSTALLED');
  return db;
}

// ---------------------------------------------------------------------------
// Op: words mask/anagram search (moved from words.worker.ts)
// ---------------------------------------------------------------------------

interface WordsSearchPayload {
  query: string;
  mode: 'mask' | 'anagram';
  useRegex?: boolean;
  ignoreDiacritics?: boolean;
  onlySubstantives?: boolean;
  includeProperNames?: boolean;
  includeRuian?: boolean;
  limit?: number;
}

function opWordsSearch(payload: WordsSearchPayload): { results: WordMatch[]; hasMore: boolean } {
  const {
    query,
    mode,
    useRegex = false,
    ignoreDiacritics = true,
    onlySubstantives = true,
    includeProperNames = false,
    includeRuian = true,
    limit = 1000
  } = payload;

  const trimmed = (query || '').trim();
  if (!trimmed) return { results: [], hasMore: false };

  if (mode === 'mask') {
    return executeMaskSearch(trimmed, useRegex, ignoreDiacritics, onlySubstantives, includeProperNames, includeRuian, limit);
  }
  return executeAnagramSearch(trimmed, ignoreDiacritics, onlySubstantives, includeProperNames, includeRuian, limit);
}

function executeMaskSearch(
  query: string,
  useRegex: boolean,
  ignoreDiacritics: boolean,
  onlySubstantives: boolean,
  includeProperNames: boolean,
  includeRuian: boolean,
  limit: number
): { results: WordMatch[]; hasMore: boolean } {
  const db2 = requireDb();
  const col = ignoreDiacritics ? 'word_nodiac' : 'word';
  const substPart = onlySubstantives ? 'is_subst = 1' : '1=1';
  const namePart = includeProperNames ? '1=1' : 'is_name = 0';
  const filterCond = `${substPart} AND ${namePart}`;

  let sql = '';
  let params: Record<string, any> = {};

  if (useRegex) {
    try {
      new RegExp(query, 'i');
    } catch {
      throw new Error('Neplatný regulární výraz');
    }

    // Cheap column filters first: SQLite evaluates these terms in order, so the
    // JS REGEXP callback only runs on rows that pass them (~3x fewer calls).
    sql = `
      SELECT word, freq, len, is_name FROM words
      WHERE ${filterCond} AND ${col} REGEXP $pattern
      ${includeRuian ? `UNION ALL SELECT word, 150 as freq, len, 1 as is_name FROM ruian WHERE ${col} REGEXP $pattern` : ''}
      ORDER BY freq DESC
      LIMIT $fetchLimit
    `;
    params = { $pattern: query, $fetchLimit: limit * 2 };
  } else {
    const cleanQ = ignoreDiacritics ? removeDiacritics(query).toLowerCase() : query.toLowerCase();
    const hasWildcard = cleanQ.includes('*');
    const globPattern = cleanQ.replace(/\./g, '?');

    if (!hasWildcard) {
      sql = `
        SELECT word, freq, len, is_name FROM words
        WHERE len = $len AND ${col} GLOB $glob AND ${filterCond}
        ${includeRuian ? `UNION ALL SELECT word, 150 as freq, len, 1 as is_name FROM ruian WHERE len = $len AND ${col} GLOB $glob` : ''}
        ORDER BY freq DESC
        LIMIT $fetchLimit
      `;
      params = { $len: cleanQ.length, $glob: globPattern, $fetchLimit: limit * 2 };
    } else {
      sql = `
        SELECT word, freq, len, is_name FROM words
        WHERE ${col} GLOB $glob AND ${filterCond}
        ${includeRuian ? `UNION ALL SELECT word, 150 as freq, len, 1 as is_name FROM ruian WHERE ${col} GLOB $glob` : ''}
        ORDER BY freq DESC
        LIMIT $fetchLimit
      `;
      params = { $glob: globPattern, $fetchLimit: limit * 2 };
    }
  }

  const stmt = db2.prepare(sql);
  stmt.bind(params);

  const seen = new Set<string>();
  const matches: WordMatch[] = [];
  let hasMore = false;
  try {
    while (stmt.step()) {
      if (matches.length >= limit) {
        hasMore = true;
        break;
      }
      const row = stmt.get({}) as { word: string; freq: number; len: number; is_name: number };
      const upper = row.word.toLocaleUpperCase('cs-CZ');
      if (!seen.has(upper)) {
        seen.add(upper);
        matches.push({
          word: upper,
          freq: Number(row.freq) || 0,
          len: Number(row.len) || row.word.length,
          isName: Number(row.is_name) === 1
        });
      }
    }
  } finally {
    stmt.finalize();
  }
  return { results: matches, hasMore };
}

function executeAnagramSearch(
  query: string,
  ignoreDiacritics: boolean,
  onlySubstantives: boolean,
  includeProperNames: boolean,
  includeRuian: boolean,
  limit: number
): { results: WordMatch[]; hasMore: boolean } {
  const db2 = requireDb();
  const clean = query.replace(/[^\p{L}]/gu, '');
  const norm = ignoreDiacritics ? removeDiacritics(clean).toLowerCase() : clean.toLowerCase();

  if (norm.length < 2) return { results: [], hasMore: false };

  const targetLen = norm.length;
  const targetMask = computeMaskNodiac(removeDiacritics(clean).toLowerCase());
  const targetCounts: Record<string, number> = {};
  for (let i = 0; i < norm.length; i++) {
    const c = norm[i];
    targetCounts[c] = (targetCounts[c] || 0) + 1;
  }

  const substPart = onlySubstantives ? 'is_subst = 1' : '1=1';
  const namePart = includeProperNames ? '1=1' : 'is_name = 0';
  const filterCond = `${substPart} AND ${namePart}`;
  const results: WordMatch[] = [];
  const seenWords = new Set<string>();
  let hasMore = false;

  const stmtExact = db2.prepare(`
    SELECT word, word_nodiac, freq, len, is_name FROM words
    WHERE len = $len AND mask_nodiac = $mask AND ${filterCond}
    ${includeRuian ? `UNION ALL SELECT word, word_nodiac, 150 as freq, len, 1 as is_name FROM ruian WHERE len = $len AND mask_nodiac = $mask` : ''}
    ORDER BY freq DESC
    LIMIT 1500
  `);
  stmtExact.bind({ $len: targetLen, $mask: targetMask });

  try {
    while (stmtExact.step()) {
      if (results.length >= limit) {
        hasMore = true;
        break;
      }
      const row = stmtExact.get({}) as { word: string; word_nodiac: string; freq: number; len: number; is_name: number };
      const checkWord = ignoreDiacritics ? row.word_nodiac.toLowerCase() : row.word.toLowerCase();
      if (isExactAnagram(checkWord, targetCounts, targetLen)) {
        const upper = row.word.toLocaleUpperCase('cs-CZ');
        if (!seenWords.has(upper)) {
          seenWords.add(upper);
          results.push({
            word: upper,
            freq: Number(row.freq) || 0,
            len: Number(row.len) || row.word.length,
            isName: Number(row.is_name) === 1
          });
        }
      }
    }
  } finally {
    stmtExact.finalize();
  }

  if (norm.length >= 3 && results.length < limit) {
    const stmtSub = db2.prepare(`
      SELECT word, word_nodiac, freq, len, is_name FROM words
      WHERE len < $maxLen AND len >= 3 AND (mask_nodiac & ~$mask) = 0 AND ${filterCond} ${onlySubstantives ? '' : 'AND freq >= 5'}
      ${includeRuian ? `UNION ALL SELECT word, word_nodiac, 150 as freq, len, 1 as is_name FROM ruian WHERE len < $maxLen AND len >= 3 AND (mask_nodiac & ~$mask) = 0` : ''}
      ORDER BY len DESC, freq DESC
      LIMIT 5000
    `);
    stmtSub.bind({ $maxLen: targetLen, $mask: targetMask });

    try {
      while (stmtSub.step()) {
        if (results.length >= limit) {
          hasMore = true;
          break;
        }
        const row = stmtSub.get({}) as { word: string; word_nodiac: string; freq: number; len: number; is_name: number };
        const checkWord = ignoreDiacritics ? row.word_nodiac.toLowerCase() : row.word.toLowerCase();
        if (isSubAnagram(checkWord, targetCounts)) {
          const upper = row.word.toLocaleUpperCase('cs-CZ');
          if (!seenWords.has(upper)) {
            seenWords.add(upper);
            results.push({
              word: upper,
              freq: Number(row.freq) || 0,
              len: Number(row.len) || row.word.length,
              isName: Number(row.is_name) === 1
            });
          }
        }
      }
    } finally {
      stmtSub.finalize();
    }
  }

  return { results, hasMore: hasMore || results.length >= limit };
}

// ---------------------------------------------------------------------------
// Op: T9 predictive query (moved from t9.worker.ts)
// ---------------------------------------------------------------------------

function opT9Query(payload: { digits: string; limit?: number }): { digits: string; candidates: string[] } {
  const { digits, limit = 12 } = payload;

  if (!digits) return { digits, candidates: [] };

  if (!/^[2-9]+$/.test(digits)) {
    if (digits === '1') return { digits, candidates: T9_PUNCTUATION };
    return { digits, candidates: [digits] };
  }

  const db2 = requireDb();
  const globExact = digits
    .split('')
    .map((d: string) => DIGIT_TO_GLOB[d] || '')
    .join('');

  const seen = new Set<string>();
  const candidates: string[] = [];

  const exactLimit = Math.min(limit, 7);
  try {
    const stmtExact = db2.prepare(
      `SELECT word FROM words WHERE len = $len AND word_nodiac GLOB $glob ORDER BY freq DESC LIMIT $limit`
    );
    try {
      stmtExact.bind({ $len: digits.length, $glob: globExact, $limit: exactLimit });
      while (stmtExact.step()) {
        const row = stmtExact.get({}) as { word: string };
        const upper = row.word.toUpperCase();
        if (!seen.has(upper)) {
          seen.add(upper);
          candidates.push(upper);
        }
      }
    } finally {
      stmtExact.finalize();
    }
  } catch {
    // ignore
  }

  if (candidates.length < limit) {
    const globPrefix = globExact + '*';
    const maxLen = Math.min(digits.length + 4, 18);
    for (let l = digits.length + 1; l <= maxLen && candidates.length < limit; l++) {
      try {
        const stmtPrefix = db2.prepare(
          `SELECT word FROM words WHERE len = $len AND word_nodiac GLOB $globPrefix ORDER BY freq DESC LIMIT 2`
        );
        try {
          stmtPrefix.bind({ $len: l, $globPrefix: globPrefix });
          while (stmtPrefix.step()) {
            const row = stmtPrefix.get({}) as { word: string };
            const upper = row.word.toUpperCase();
            if (!seen.has(upper)) {
              seen.add(upper);
              candidates.push(upper);
            }
            if (candidates.length >= limit) break;
          }
        } finally {
          stmtPrefix.finalize();
        }
      } catch {
        // ignore
      }
    }
  }

  if (candidates.length === 0) {
    candidates.push(getFallbackT9Word(digits));
  }

  return { digits, candidates: candidates.slice(0, limit) };
}

// ---------------------------------------------------------------------------
// Op: world flags
// ---------------------------------------------------------------------------

function opGetWorldFlags(): unknown[] {
  const db2 = requireDb();
  return db2.selectObjects(`
    SELECT id, code, code3, name_cs, name_cs_nodiac, name_en, capital_cs, capital_cs_nodiac, capital_en, continent, colors, features, svg_4x3, svg_1x1
    FROM world_flags
    ORDER BY name_cs_nodiac ASC
  `);
}

// ---------------------------------------------------------------------------
// Op: streaming, verified download (Task 5)
// ---------------------------------------------------------------------------

interface DownloadPayload {
  url: string;
  expectedSizeBytes?: number;
  expectedHash?: string;
}

async function opDownloadDb(payload: DownloadPayload, id: number): Promise<{ sizeBytes: number; hash: string }> {
  if (!poolUtil) {
    // No OPFS available - fall back to fetching into memory (in-memory mode).
    return downloadIntoMemory(payload, id);
  }

  const { url, expectedSizeBytes, expectedHash } = payload;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Chyba při stahování slovníku: ${response.status} ${response.statusText}`);
  }

  const contentLength = response.headers.get('content-length');
  const totalBytes = contentLength ? parseInt(contentLength, 10) : expectedSizeBytes || 0;

  // Stream into a brand-new pool file; the currently active DB stays open and
  // fully usable until the new one is verified and the pointer flipped.
  const previous = await readActivePointer();
  const target = newDbFilename(expectedHash);
  if (target === previous) {
    throw new Error('Tato verze databáze je již nainstalována.');
  }

  const hasher = new Sha256Incremental();
  let received = 0;

  try {
    if (!response.body) {
      const buf = new Uint8Array(await response.arrayBuffer());
      hasher.update(buf);
      received = buf.byteLength;
      await importBufferChunked(target, buf);
    } else {
      const reader = response.body.getReader();
      await poolUtil.importDb(target, async () => {
        const { done, value } = await reader.read();
        if (done) return undefined;
        hasher.update(value);
        received += value.length;
        if (totalBytes > 0) {
          const percent = Math.min(99, Math.round((received / totalBytes) * 100));
          postProgress(id, { percent, loadedBytes: received, totalBytes });
        }
        return value;
      });
    }
  } catch (err) {
    unlinkQuietly(target);
    throw err;
  }

  const computedHash = hasher.hexDigest().slice(0, 16);

  if (expectedSizeBytes && received !== expectedSizeBytes) {
    unlinkQuietly(target);
    throw new Error(
      `Stažený soubor má neočekávanou velikost (${received} B, očekáváno ${expectedSizeBytes} B). Databáze nebyla aktualizována.`
    );
  }

  if (expectedHash && computedHash !== expectedHash) {
    unlinkQuietly(target);
    throw new Error('Kontrolní součet stažené databáze nesouhlasí. Databáze nebyla aktualizována.');
  }

  // A matching SHA-256 already proves the bytes are exactly what was built;
  // only fall back to a structural check when there was no hash to compare.
  if (!expectedHash && !verifyOpfsDb(target)) {
    unlinkQuietly(target);
    throw new Error('Stažená databáze je poškozená (selhala kontrola integrity). Databáze nebyla aktualizována.');
  }

  // Activate: flip the pointer first (the commit point), then swap handles.
  await writeActivePointer(target);
  if (db) {
    try {
      db.close();
    } catch {
      // ignore
    }
  }
  db = new poolUtil.OpfsSAHPoolDb(target);
  registerRegexFunction(db);
  storageMode = 'opfs';
  unlinkPoolFilesExcept(target);

  postProgress(id, { percent: 100, loadedBytes: received, totalBytes: totalBytes || received });

  return { sizeBytes: received, hash: computedHash };
}

function unlinkQuietly(name: string): void {
  try {
    poolUtil?.unlink(name);
  } catch {
    // ignore
  }
}

async function downloadIntoMemory(payload: DownloadPayload, id: number): Promise<{ sizeBytes: number; hash: string }> {
  if (!sqlite3) throw new Error('sqlite3 not initialized');
  const { url, expectedSizeBytes, expectedHash } = payload;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Chyba při stahování slovníku: ${response.status} ${response.statusText}`);
  }

  const contentLength = response.headers.get('content-length');
  const totalBytes = contentLength ? parseInt(contentLength, 10) : expectedSizeBytes || 0;
  const hasher = new Sha256Incremental();
  const chunks: Uint8Array[] = [];
  let received = 0;

  if (response.body) {
    const reader = response.body.getReader();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) {
        chunks.push(value);
        hasher.update(value);
        received += value.length;
        if (totalBytes > 0) {
          const percent = Math.min(99, Math.round((received / totalBytes) * 100));
          postProgress(id, { percent, loadedBytes: received, totalBytes });
        }
      }
    }
  } else {
    const buf = new Uint8Array(await response.arrayBuffer());
    chunks.push(buf);
    hasher.update(buf);
    received = buf.length;
  }

  const computedHash = hasher.hexDigest().slice(0, 16);
  if (expectedSizeBytes && received !== expectedSizeBytes) {
    throw new Error('Stažený soubor má neočekávanou velikost. Databáze nebyla aktualizována.');
  }
  if (expectedHash && computedHash !== expectedHash) {
    throw new Error('Kontrolní součet stažené databáze nesouhlasí. Databáze nebyla aktualizována.');
  }

  const merged = new Uint8Array(received);
  let offset = 0;
  for (const c of chunks) {
    merged.set(c, offset);
    offset += c.length;
  }

  if (db) {
    try {
      db.close();
    } catch {
      // ignore
    }
  }
  db = new sqlite3.oo1.DB(':memory:', 'c');
  sqlite3.capi.sqlite3_deserialize(
    db.pointer!,
    'main',
    sqlite3.wasm.allocFromTypedArray(merged),
    merged.byteLength,
    merged.byteLength,
    sqlite3.capi.SQLITE_DESERIALIZE_FREEONCLOSE | sqlite3.capi.SQLITE_DESERIALIZE_RESIZEABLE
  );
  registerRegexFunction(db);
  storageMode = 'memory';

  postProgress(id, { percent: 100, loadedBytes: received, totalBytes: totalBytes || received });
  return { sizeBytes: received, hash: computedHash };
}

// ---------------------------------------------------------------------------
// Op: delete DB
// ---------------------------------------------------------------------------

async function opDeleteDb(): Promise<void> {
  if (db) {
    try {
      db.close();
    } catch {
      // ignore
    }
    db = null;
  }
  await deleteActivePointer();
  unlinkPoolFilesExcept(null);
  await deleteLegacyCache();
}
