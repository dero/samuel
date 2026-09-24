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

import { DB_CACHE_NAME } from '../services/offlineCacheService';

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

/**
 * Resets in-memory SQLite database instance and cached query results.
 */
export function resetDatabase(): void {
  dbInstance = null;
  initPromise = null;
  cachedLexiconWords = null;
  cachedWorldFlags = null;
}

/**
 * Initializes sql.js and loads the words.db database.
 * NEVER automatically downloads words.db if a cached version already exists in CacheStorage!
 * Only loads from local CacheStorage.
 */
export async function getDatabase(options: { forceRefresh?: boolean } = {}): Promise<SqlDatabase> {
  if (options.forceRefresh) {
    resetDatabase();
  }
  if (dbInstance) return dbInstance;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      // 1. Read buffer strictly from local CacheStorage (NO network downloads!)
      const buffer = await getCachedDb();
      if (!buffer) {
        initPromise = null;
        throw new Error('Slovníková databáze není lokálně dostupná. Přejděte do Nastavení pro její stažení.');
      }

      // 2. Initialize sql.js WASM
      const SQL = await initSqlJs({
        locateFile: () => sqlWasmUrl
      });

      // 3. Mount SQLite database from offline buffer
      dbInstance = new SQL.Database(new Uint8Array(buffer));
      return dbInstance;
    } catch (err: any) {
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

