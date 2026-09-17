/**
 * SQLite Database Service for Samuel (Offline PWA)
 * Manages client-side SQLite WASM via sql.js with IndexedDB caching.
 */

import initSqlJs, { type Database as SqlDatabase } from 'sql.js';
import sqlWasmUrl from 'sql.js/dist/sql-wasm.wasm?url';
import { sortCzechLetters, sortNodiacLetters, removeDiacritics } from './czechCollation';
import {
  LEXICON_SQL_QUERY,
  RUIAN_MULTIWORD_SQL_QUERY,
  parseLexiconRows,
  type RawLexiconWord
} from './lexiconDb';

export interface SubstantiveRecord {
  id: number;
  word: string;
  word_nodiac: string;
  freq: number;
  is_name: number;
  is_unique_letters: number;
  is_unique_letters_nodiac: number;
  letters: string;
  letters_nodiac: string;
  len: number;
}

export interface PuzzleWordRecord {
  id: number;
  word: string;
  word_nodiac: string;
  len: number;
}

export interface AllWordRecord {
  id: number;
  word: string;
  word_nodiac: string;
  freq: number;
  len: number;
}

export interface RuianRecord {
  id: number;
  word: string;
  word_nodiac: string;
  type: string;
  len: number;
}

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

// Backward compatibility alias
export type WordRecord = SubstantiveRecord;

export interface AppVersionInfo {
  appVersion: string;
  buildTime: number;
  dbVersion: string;
  dbHash: string;
  dbSizeBytes: number;
  dbUpdated: string;
}

export interface LocalDbMeta {
  dbHash: string;
  dbVersion: string;
  dbSizeBytes: number;
  dbUpdated: string;
  cachedAt: number;
}

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

let dbInstance: SqlDatabase | null = null;
let initPromise: Promise<SqlDatabase> | null = null;

const IDB_NAME = 'samuel_offline_storage';
const IDB_STORE = 'sqlite_blobs';
const IDB_KEY_DB = 'words_db';
const IDB_KEY_META = 'words_db_meta';

/**
 * IndexedDB helpers to cache SQLite binary blob offline.
 */
function openIdb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(IDB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(IDB_STORE)) {
        db.createObjectStore(IDB_STORE);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function getCachedDb(): Promise<ArrayBuffer | null> {
  try {
    const idb = await openIdb();
    return new Promise((resolve) => {
      const tx = idb.transaction(IDB_STORE, 'readonly');
      const store = tx.objectStore(IDB_STORE);
      const req = store.get(IDB_KEY_DB);
      req.onsuccess = () => resolve(req.result ? (req.result as ArrayBuffer) : null);
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

async function getCachedMeta(): Promise<LocalDbMeta | null> {
  try {
    const idb = await openIdb();
    return new Promise((resolve) => {
      const tx = idb.transaction(IDB_STORE, 'readonly');
      const store = tx.objectStore(IDB_STORE);
      const req = store.get(IDB_KEY_META);
      req.onsuccess = () => resolve(req.result ? (req.result as LocalDbMeta) : null);
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

async function setCachedDb(buffer: ArrayBuffer, meta: LocalDbMeta): Promise<void> {
  try {
    const idb = await openIdb();
    return new Promise((resolve) => {
      const tx = idb.transaction(IDB_STORE, 'readwrite');
      const store = tx.objectStore(IDB_STORE);
      store.put(buffer, IDB_KEY_DB);
      store.put(meta, IDB_KEY_META);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
  } catch {
    // Ignore cache failure
  }
}

/**
 * Clears local IndexedDB database cache and in-memory instances to force re-download.
 */
export async function clearDbCache(): Promise<void> {
  try {
    const idb = await openIdb();
    await new Promise<void>((resolve, reject) => {
      const tx = idb.transaction(IDB_STORE, 'readwrite');
      const store = tx.objectStore(IDB_STORE);
      const req = store.clear();
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (e) {
    console.warn('Failed to clear IDB:', e);
  }
  dbInstance = null;
  initPromise = null;
  cachedLexiconWords = null;
  cachedWorldFlags = null;
  dbState.status = 'idle';
  dbState.progress = 0;
  dbState.totalRows = 0;
  dbState.meta = null;
  dbState.updateAvailable = false;
  dbState.appUpdateAvailable = false;
  dbState.dbUpdateAvailable = false;
}

/**
 * Fetches database binary with progress tracking.
 */
async function fetchDbWithProgress(url: string): Promise<ArrayBuffer> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to load ${url}: ${response.status} ${response.statusText}`);
  }

  const contentLength = response.headers.get('content-length');
  const total = contentLength ? parseInt(contentLength, 10) : 0;

  if (!response.body || total === 0) {
    const buf = await response.arrayBuffer();
    dbState.progress = 90;
    return buf;
  }

  const reader = response.body.getReader();
  let received = 0;
  const chunks: Uint8Array[] = [];

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) {
      chunks.push(value);
      received += value.length;
      if (total > 0) {
        dbState.progress = Math.min(95, Math.round(20 + (received / total) * 75));
      }
    }
  }

  const result = new Uint8Array(received);
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }

  return result.buffer as ArrayBuffer;
}

/**
 * Checks for updates on app launch / refresh:
 * 1. Reads local DB metadata from IndexedDB.
 * 2. Fetches lightweight /version.json (~200 bytes).
 * 3. Sets dbState.updateAvailable flag if a newer version is available.
 * NEVER automatically downloads the 40MB database to avoid blocking weak connections in the field!
 */
export async function checkUpdatesOnInit(): Promise<void> {
  try {
    const localMeta = await getCachedMeta();
    if (localMeta) {
      dbState.meta = localMeta;
    }
  } catch (e) {
    console.warn('Could not read cached DB metadata:', e);
  }

  try {
    // Only fetch tiny version.json (~200 bytes) to check if an update is available
    const vRes = await fetch('/version.json?t=' + Date.now(), { cache: 'no-store' });
    if (!vRes.ok) return;
    const remoteVersion: AppVersionInfo = await vRes.json();
    dbState.remoteVersion = remoteVersion;

    const hasCachedBuffer = Boolean(await getCachedDb());
    const dbHasNewerVersion = Boolean(
      hasCachedBuffer && dbState.meta && remoteVersion && remoteVersion.dbHash !== dbState.meta.dbHash
    );
    const isDev = import.meta.env.DEV;
    const appNeedsUpdate = !isDev && Boolean(
      remoteVersion && (
        (typeof __BUILD_TIME__ !== 'undefined' && remoteVersion.buildTime > __BUILD_TIME__) ||
        (typeof __APP_VERSION__ !== 'undefined' && remoteVersion.appVersion !== __APP_VERSION__)
      )
    );

    dbState.dbUpdateAvailable = dbHasNewerVersion;
    dbState.appUpdateAvailable = appNeedsUpdate;
    dbState.updateAvailable = dbHasNewerVersion || appNeedsUpdate;
  } catch (netErr) {
    console.log('App is offline or version.json unreachable. Offline DB ready.');
  }
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
 * NEVER automatically downloads words.db if a cached version already exists in IndexedDB!
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
    dbState.progress = 5;
    dbState.error = null;

    try {
      // 1. Initialize sql.js WASM
      const SQL = await initSqlJs({
        locateFile: () => sqlWasmUrl
      });
      dbState.progress = 20;

      // 2. Read local metadata & buffer from IndexedDB
      let localMeta = options.forceRefresh ? null : await getCachedMeta();
      let buffer = options.forceRefresh ? null : await getCachedDb();
      if (localMeta) {
        dbState.meta = localMeta;
      }

      // 3. Fetch remote /version.json (~200 B) non-blockingly to keep status accurate
      let remoteVersion: AppVersionInfo | null = dbState.remoteVersion;
      if (!remoteVersion) {
        try {
          const vRes = await fetch('/version.json?t=' + Date.now(), { cache: 'no-store' });
          if (vRes.ok) {
            remoteVersion = await vRes.json();
            dbState.remoteVersion = remoteVersion;
          }
        } catch {}
      }

      const isDev = import.meta.env.DEV;
      const hasCachedBuffer = Boolean(buffer);
      const dbHasNewerVersion = Boolean(
        hasCachedBuffer && localMeta && remoteVersion && remoteVersion.dbHash !== localMeta.dbHash
      );
      const appNeedsUpdate = !isDev && Boolean(
        remoteVersion && (
          (typeof __BUILD_TIME__ !== 'undefined' && remoteVersion.buildTime > __BUILD_TIME__) ||
          (typeof __APP_VERSION__ !== 'undefined' && remoteVersion.appVersion !== __APP_VERSION__)
        )
      );

      dbState.dbUpdateAvailable = dbHasNewerVersion;
      dbState.appUpdateAvailable = appNeedsUpdate;
      dbState.updateAvailable = dbHasNewerVersion || appNeedsUpdate;

      // CRITICAL: We ONLY download words.db if:
      // A) options.forceRefresh === true (user explicitly clicked Update / Re-download)
      // B) !buffer (first launch, no database cached at all in IndexedDB)
      // We NEVER automatically re-download just because remoteVersion.dbHash !== localMeta.dbHash!
      const mustDownload = options.forceRefresh || !buffer;

      if (mustDownload) {
        if (!buffer && typeof navigator !== 'undefined' && !navigator.onLine) {
          throw new Error('Aplikace je offline a slovníková databáze ještě nebyla stažena. Připojte se k internetu a stáhněte ji v Nastavení.');
        }

        // Download fresh /words.db with progress tracking
        buffer = await fetchDbWithProgress('/words.db');

        const newMeta: LocalDbMeta = {
          dbHash: remoteVersion?.dbHash ?? 'local',
          dbVersion: remoteVersion?.dbVersion ?? new Date().toISOString(),
          dbSizeBytes: remoteVersion?.dbSizeBytes ?? buffer.byteLength,
          dbUpdated: remoteVersion?.dbUpdated ?? new Date().toISOString(),
          cachedAt: Date.now()
        };
        await setCachedDb(buffer, newMeta);
        localMeta = newMeta;
        dbState.meta = newMeta;
        dbState.dbUpdateAvailable = false;
        dbState.updateAvailable = dbState.appUpdateAvailable;

        // When user explicitly updates DB, if a newer app version is also available in production,
        // reload to prevent DB schema drift!
        if (!isDev && appNeedsUpdate && typeof window !== 'undefined') {
          console.log('Database updated and newer app version detected. Reloading to prevent DB schema drift...');
          setTimeout(() => {
            window.location.reload();
          }, 300);
        }
      }

      if (!buffer) {
        throw new Error('Nepodařilo se načíst data slovníku.');
      }

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
      console.error('Database initialization error:', err);
      throw err;
    }
  })();

  return initPromise;
}

/**
 * Finds anagrams of the given letters.
 * If nodiac is true (default), matches without diacritics using letters_nodiac.
 * If nodiac is false, strictly matches exact Czech diacritics using letters.
 */
export async function findAnagrams(
  input: string,
  options: { nodiac?: boolean; limit?: number; minFreq?: number } = {}
): Promise<SubstantiveRecord[]> {
  const { nodiac = true, limit = 50, minFreq = 0 } = options;
  const db = await getDatabase();

  const key = nodiac ? sortNodiacLetters(input) : sortCzechLetters(input);
  if (!key) return [];

  const column = nodiac ? 'letters_nodiac' : 'letters';
  const stmt = db.prepare(
    `SELECT * FROM cs_substantives WHERE ${column} = :key AND freq >= :minFreq ORDER BY freq DESC LIMIT :limit`
  );

  stmt.bind({ ':key': key, ':minFreq': minFreq, ':limit': limit });

  const results: SubstantiveRecord[] = [];
  while (stmt.step()) {
    results.push(stmt.getAsObject() as unknown as SubstantiveRecord);
  }
  stmt.free();

  return results;
}

/**
 * Looks up a word in the dictionary (case-insensitive, diacritics-optional).
 * Checks puzzle_words, cs_substantives, and cs_all.
 */
export async function lookupWord(word: string): Promise<SubstantiveRecord | AllWordRecord | PuzzleWordRecord | null> {
  if (!word) return null;
  const db = await getDatabase();
  const clean = word.trim().toLowerCase();
  const nodiac = removeDiacritics(clean);

  // 1. Check puzzle_words
  let stmt = db.prepare(
    `SELECT * FROM puzzle_words WHERE word_nodiac = :nodiac OR LOWER(word) = :clean LIMIT 1`
  );
  stmt.bind({ ':nodiac': nodiac, ':clean': clean });
  if (stmt.step()) {
    const res = stmt.getAsObject() as unknown as PuzzleWordRecord;
    stmt.free();
    return res;
  }
  stmt.free();

  // 2. Check cs_substantives
  stmt = db.prepare(
    `SELECT * FROM cs_substantives WHERE word_nodiac = :nodiac OR LOWER(word) = :clean ORDER BY freq DESC LIMIT 1`
  );
  stmt.bind({ ':nodiac': nodiac, ':clean': clean });
  if (stmt.step()) {
    const res = stmt.getAsObject() as unknown as SubstantiveRecord;
    stmt.free();
    return res;
  }
  stmt.free();

  // 3. Check cs_all
  stmt = db.prepare(
    `SELECT * FROM cs_all WHERE word_nodiac = :nodiac OR LOWER(word) = :clean ORDER BY freq DESC LIMIT 1`
  );
  stmt.bind({ ':nodiac': nodiac, ':clean': clean });
  if (stmt.step()) {
    const res = stmt.getAsObject() as unknown as AllWordRecord;
    stmt.free();
    return res;
  }
  stmt.free();

  return null;
}

/**
 * Fast check whether a word exists in the dictionary.
 */
export async function isWord(word: string): Promise<boolean> {
  const record = await lookupWord(word);
  return record !== null;
}

/**
 * Searches words by SQL pattern (e.g. 'h_slo', 'kot_').
 * '?' or '_' represent any single character, '*' or '%' represent any sequence.
 */
export async function searchPattern(
  pattern: string,
  options: {
    limit?: number;
    nodiac?: boolean;
    table?: 'cs_substantives' | 'cs_all' | 'ruian' | 'puzzle_words';
  } = {}
): Promise<any[]> {
  const { limit = 50, nodiac = true, table = 'cs_substantives' } = options;
  const db = await getDatabase();

  const sqlPattern = pattern.toLowerCase().replace(/\?/g, '_').replace(/\*/g, '%');
  const column = nodiac ? 'word_nodiac' : 'word';
  const orderCol = table === 'ruian' || table === 'puzzle_words' ? 'len ASC' : 'freq DESC';

  const stmt = db.prepare(
    `SELECT * FROM ${table} WHERE ${column} LIKE :pat ORDER BY ${orderCol} LIMIT :limit`
  );
  stmt.bind({ ':pat': sqlPattern, ':limit': limit });

  const results: any[] = [];
  while (stmt.step()) {
    results.push(stmt.getAsObject());
  }
  stmt.free();
  return results;
}

/**
 * Executes a raw SQL query and returns rows as typed objects.
 */
export async function rawQuery<T = Record<string, any>>(sql: string, params?: Record<string, any>): Promise<T[]> {
  const db = await getDatabase();
  const stmt = db.prepare(sql);
  if (params) stmt.bind(params);

  const results: T[] = [];
  while (stmt.step()) {
    results.push(stmt.getAsObject() as T);
  }
  stmt.free();
  return results;
}

/**
 * Imports a JSON array of words directly into the SQLite database in memory and persists to IndexedDB.
 */
export async function importFromJson(jsonData: any[]): Promise<number> {
  const SQL = await initSqlJs({ locateFile: () => sqlWasmUrl });
  const newDb = new SQL.Database();

  newDb.run(`
    CREATE TABLE cs_substantives (
      id INTEGER PRIMARY KEY,
      word TEXT NOT NULL,
      word_nodiac TEXT NOT NULL,
      freq INTEGER NOT NULL,
      is_name INTEGER NOT NULL,
      is_unique_letters INTEGER NOT NULL,
      is_unique_letters_nodiac INTEGER NOT NULL,
      letters TEXT NOT NULL,
      letters_nodiac TEXT NOT NULL,
      len INTEGER NOT NULL
    );
    CREATE INDEX idx_subst_word_nodiac ON cs_substantives(word_nodiac COLLATE NOCASE);
    CREATE INDEX idx_subst_letters_nodiac ON cs_substantives(letters_nodiac);
    CREATE INDEX idx_subst_letters ON cs_substantives(letters);
    CREATE INDEX idx_subst_len_freq ON cs_substantives(len, freq DESC);
  `);

  newDb.run('BEGIN TRANSACTION;');
  const stmt = newDb.prepare(`
    INSERT INTO cs_substantives (word, word_nodiac, freq, is_name, is_unique_letters, is_unique_letters_nodiac, letters, letters_nodiac, len)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const item of jsonData) {
    stmt.run([
      item.word,
      item.word_nodiac,
      item.freq,
      item.is_name,
      item.is_unique_letters,
      item.is_unique_letters_nodiac,
      item.letters,
      item.letters_nodiac,
      item.len
    ]);
  }
  stmt.free();
  newDb.run('COMMIT;');

  const exportedBuffer = newDb.export().buffer as ArrayBuffer;
  const customMeta: LocalDbMeta = {
    dbHash: 'custom-' + Date.now(),
    dbVersion: 'custom',
    dbSizeBytes: exportedBuffer.byteLength,
    dbUpdated: new Date().toISOString(),
    cachedAt: Date.now()
  };
  await setCachedDb(exportedBuffer, customMeta);
  dbState.meta = customMeta;
  dbInstance = newDb;
  dbState.status = 'ready';
  dbState.totalRows = jsonData.length;

  return jsonData.length;
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

