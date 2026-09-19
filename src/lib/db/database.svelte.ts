/**
 * SQLite Database Service for Samuel (Offline PWA)
 * Manages client-side SQLite WASM via sql.js with IndexedDB caching.
 */

import initSqlJs, { type Database as SqlDatabase } from 'sql.js';
import sqlWasmUrl from 'sql.js/dist/sql-wasm.wasm?url';
import {
  LEXICON_SQL_QUERY,
  RUIAN_MULTIWORD_SQL_QUERY,
  parseLexiconRows
} from './lexiconDb';

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

import type { AppVersionInfo, LocalDbMeta } from '../services/offlineCacheService';
export type { AppVersionInfo, LocalDbMeta };

export interface DbState {
  status: 'idle' | 'loading' | 'ready' | 'error';
  progress: number; // 0 to 100
  totalRows: number;
  error: string | null;
  meta: LocalDbMeta | null;
  remoteVersion: AppVersionInfo | null;
  updateAvailable: boolean;
  appUpdateAvailable: boolean;
  dbUpdateAvailable: boolean;
}

// Reactive Svelte 5 state for DB status
export const dbState: DbState = $state({
  status: 'idle',
  progress: 0,
  totalRows: 0,
  error: null,
  meta: null,
  remoteVersion: null,
  updateAvailable: false,
  appUpdateAvailable: false,
  dbUpdateAvailable: false
});

import {
  DB_CACHE_NAME,
  getLocalDbMeta,
  setLocalDbMeta
} from '../services/offlineCacheService';
import { versionService } from '../services/versionService.svelte';

let dbInstance: SqlDatabase | null = null;
let initPromise: Promise<SqlDatabase> | null = null;

async function getCachedDb(): Promise<ArrayBuffer | null> {
  try {
    if (typeof window === 'undefined' || !('caches' in window)) return null;
    const cache = await caches.open(DB_CACHE_NAME);
    const match = await cache.match('/words.db');
    if (!match) return null;
    return await match.arrayBuffer();
  } catch {
    return null;
  }
}

function getCachedMeta(): LocalDbMeta | null {
  return getLocalDbMeta();
}

async function setCachedDb(buffer: ArrayBuffer, meta: LocalDbMeta): Promise<void> {
  try {
    if (typeof window === 'undefined' || !('caches' in window)) return;
    const cache = await caches.open(DB_CACHE_NAME);
    await cache.put(
      '/words.db',
      new Response(buffer, {
        headers: { 'Content-Type': 'application/x-sqlite3' }
      })
    );
    setLocalDbMeta(meta);
  } catch (e) {
    console.warn('Failed to cache db in CacheStorage:', e);
  }
}

/**
 * Clears local CacheStorage database cache and in-memory instances to force re-download.
 */
export async function clearDbCache(): Promise<void> {
  await versionService.deleteDb();
  dbInstance = null;
  initPromise = null;
  cachedLexiconWords = null;
  cachedWorldFlags = null;
  dbState.status = 'idle';
  dbState.progress = 0;
  dbState.totalRows = 0;
  dbState.meta = null;
  dbState.updateAvailable = versionService.state.updateAvailable;
  dbState.appUpdateAvailable = versionService.state.appUpdateAvailable;
  dbState.dbUpdateAvailable = false;
}

/**
 * Checks for updates on app launch / refresh:
 * Authoritatively delegates to versionService (which also cleans up legacy IndexedDB).
 */
export async function checkUpdatesOnInit(): Promise<void> {
  await versionService.checkUpdates();
  dbState.meta = versionService.state.dbMeta;
  dbState.remoteVersion = versionService.state.remoteVersion;
  dbState.appUpdateAvailable = versionService.state.appUpdateAvailable;
  dbState.dbUpdateAvailable = versionService.state.dbUpdateAvailable;
  dbState.updateAvailable = versionService.state.updateAvailable;
}

/**
 * Explicitly triggers download of the latest database from server.
 * When the update finishes and a newer app version is also available,
 * reloads the application to eliminate DB schema drift.
 */
export async function updateDatabase(): Promise<SqlDatabase> {
  return getDatabase({ forceRefresh: true });
}

/**
 * Initializes sql.js and loads the words.db database.
 * NEVER automatically downloads words.db if a cached version already exists in CacheStorage!
 * Only downloads if:
 * 1. options.forceRefresh is true (user explicitly requested update), OR
 * 2. No database is cached locally yet.
 */
export async function getDatabase(options: { forceRefresh?: boolean } = {}): Promise<SqlDatabase> {
  if (options.forceRefresh) {
    dbInstance = null;
    initPromise = null;
    cachedLexiconWords = null;
    cachedWorldFlags = null;
  }
  if (dbInstance) return dbInstance;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    dbState.status = 'loading';
    dbState.progress = 20;
    dbState.error = null;

    try {
      // 1. Read buffer strictly from local CacheStorage (NO network downloads!)
      const buffer = await getCachedDb();
      if (!buffer) {
        dbState.status = 'idle';
        initPromise = null;
        throw new Error('Slovníková databáze není lokálně dostupná. Přejděte do Nastavení pro její stažení.');
      }

      const localMeta = await getCachedMeta();
      if (localMeta) {
        dbState.meta = localMeta;
      }

      // 2. Initialize sql.js WASM
      const SQL = await initSqlJs({
        locateFile: () => sqlWasmUrl
      });
      dbState.progress = 60;

      // 3. Mount SQLite database from offline buffer
      dbInstance = new SQL.Database(new Uint8Array(buffer));

      // Get count across all 5 tables
      const countRes = dbInstance.exec(`
        SELECT 
          (SELECT COUNT(*) FROM puzzle_words) +
          (SELECT COUNT(*) FROM cs_substantives) +
          (SELECT COUNT(*) FROM cs_all) +
          (SELECT COUNT(*) FROM ruian) +
          (SELECT COUNT(*) FROM world_flags) as cnt
      `);
      if (countRes.length > 0 && countRes[0].values.length > 0) {
        dbState.totalRows = Number(countRes[0].values[0][0]);
      }

      dbState.status = 'ready';
      dbState.progress = 100;
      return dbInstance;
    } catch (err: any) {
      dbState.status = 'error';
      dbState.error = err?.message ?? 'Chyba inicializace databáze';
      initPromise = null;
      throw err;
    }
  })();

  return initPromise;
}

export interface LexiconWordItem {
  word: string;
  isCipher: boolean;
  isRuian: boolean;
  freq: number;
}

let cachedLexiconWords: LexiconWordItem[] | null = null;

/**
 * Loads vocabulary from SQLite words.db on demand for algorithmic solvers (e.g. Morse).
 * Fully includes:
 * 1. Puzzle & cipher keywords (puzzle_words)
 * 2. All RUIAN streets, parts of municipalities, and municipalities (both concatenated and individual word parts)
 * 3. Core Czech substantives (freq >= 10)
 * 4. General corpus words (freq >= 30)
 * Results are cached in memory after first fetch (~95,000 words, takes ~200ms once).
 */
export async function getLexiconWords(): Promise<LexiconWordItem[]> {
  if (cachedLexiconWords) return cachedLexiconWords;

  const db = await getDatabase();
  const res = db.exec(LEXICON_SQL_QUERY);
  const rows: Array<{ w: string | number; is_cipher: number; is_ruian: number; freq: number }> = [];
  if (res.length > 0 && res[0].values.length > 0) {
    for (const [w, isCipher, isRuian, freq] of res[0].values) {
      rows.push({
        w: String(w),
        is_cipher: Number(isCipher),
        is_ruian: Number(isRuian),
        freq: Number(freq) || 0
      });
    }
  }

  const multiRes = db.exec(RUIAN_MULTIWORD_SQL_QUERY);
  const multiRows: Array<{ word_nodiac: string }> = [];
  if (multiRes.length > 0 && multiRes[0].values.length > 0) {
    for (const [raw] of multiRes[0].values) {
      multiRows.push({ word_nodiac: String(raw) });
    }
  }

  cachedLexiconWords = parseLexiconRows(rows, multiRows);
  return cachedLexiconWords;
}

let cachedWorldFlags: WorldFlagRecord[] | null = null;

/**
 * Loads all world flags from SQLite words.db.
 * Cached in memory after first fetch (271 flags).
 */
export async function getWorldFlags(): Promise<WorldFlagRecord[]> {
  if (cachedWorldFlags) return cachedWorldFlags;

  const db = await getDatabase();
  const res = db.exec(`
    SELECT id, code, code3, name_cs, name_cs_nodiac, name_en, capital_cs, capital_cs_nodiac, capital_en, continent, colors, features, svg_4x3, svg_1x1
    FROM world_flags
    ORDER BY name_cs_nodiac ASC
  `);

  if (!res.length || !res[0].values.length) {
    return [];
  }

  cachedWorldFlags = res[0].values.map((row) => {
    let parsedColors: string[] = [];
    let parsedFeatures: string[] = [];
    try {
      parsedColors = JSON.parse(String(row[10] || '[]'));
    } catch {}
    try {
      parsedFeatures = JSON.parse(String(row[11] || '[]'));
    } catch {}

    return {
      id: Number(row[0]),
      code: String(row[1]),
      code3: String(row[2]),
      name_cs: String(row[3]),
      name_cs_nodiac: String(row[4]),
      name_en: String(row[5]),
      capital_cs: String(row[6]),
      capital_cs_nodiac: String(row[7]),
      capital_en: String(row[8]),
      continent: String(row[9]),
      colors: parsedColors,
      features: parsedFeatures,
      svg_4x3: String(row[12] || ''),
      svg_1x1: String(row[13] || '')
    };
  });

  return cachedWorldFlags;
}

