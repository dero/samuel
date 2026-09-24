/**
 * Web Worker for Samuel Dictionary & Anagram Engine (sql.js WASM)
 * Runs all database queries in a background thread to keep UI at 60/120 fps.
 */

import initSqlJs, { type Database as SqlDatabase } from 'sql.js';
import sqlWasmUrl from 'sql.js/dist/sql-wasm.wasm?url';
import { removeDiacritics } from '../../utils/text';
import { computeMaskNodiac, isExactAnagram, isSubAnagram, type WordMatch } from './wordsData';

const DB_CACHE_NAME = 'samuel-db';

async function getCachedDbBuffer(): Promise<ArrayBuffer | null> {
  try {
    if (typeof self === 'undefined' || !('caches' in self)) return null;
    const cache = await self.caches.open(DB_CACHE_NAME);
    const match = await cache.match('/words.db');
    if (!match) return null;
    return await match.arrayBuffer();
  } catch {
    return null;
  }
}

let dbInstance: SqlDatabase | null = null;
let initPromise: Promise<SqlDatabase> | null = null;

async function getWorkerDatabase(): Promise<SqlDatabase> {
  if (dbInstance) return dbInstance;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    const SQL = await initSqlJs({
      locateFile: () => sqlWasmUrl
    });

    let buffer = await getCachedDbBuffer();
    if (!buffer) {
      // In development mode or direct fetch fallback
      try {
        const resp = await fetch('/words.db');
        if (resp.ok) {
          buffer = await resp.arrayBuffer();
        }
      } catch {}
    }

    if (!buffer) {
      initPromise = null;
      throw new Error('DB_NOT_INSTALLED');
    }

    const db = new SQL.Database(new Uint8Array(buffer));
    // Register custom REGEXP function for regex search
    db.create_function('REGEXP', (pattern: string, text: string) => {
      try {
        return new RegExp(pattern, 'i').test(text) ? 1 : 0;
      } catch {
        return 0;
      }
    });

    dbInstance = db;
    return db;
  })();

  return initPromise;
}

self.onmessage = async (e: MessageEvent) => {
  const {
    id,
    type,
    query,
    mode,
    useRegex,
    ignoreDiacritics,
    onlySubstantives = true,
    includeProperNames = false,
    includeRuian = true,
    limit = 1000
  } = e.data;

  if (type === 'init') {
    try {
      await getWorkerDatabase();
      self.postMessage({ id, type: 'init_done' });
    } catch (err: any) {
      self.postMessage({ id, type: 'error', error: err?.message || String(err) });
    }
    return;
  }

  if (type === 'search') {
    const trimmed = (query || '').trim();
    if (!trimmed) {
      self.postMessage({ id, type: 'result', results: [], hasMore: false, error: null });
      return;
    }

    try {
      const db = await getWorkerDatabase();

      if (mode === 'mask') {
        const { results, hasMore } = executeMaskSearch(
          db,
          trimmed,
          useRegex,
          ignoreDiacritics,
          onlySubstantives,
          includeProperNames,
          includeRuian,
          limit
        );
        self.postMessage({ id, type: 'result', results, hasMore, error: null });
      } else if (mode === 'anagram') {
        const { results, hasMore } = executeAnagramSearch(
          db,
          trimmed,
          ignoreDiacritics,
          onlySubstantives,
          includeProperNames,
          includeRuian,
          limit
        );
        self.postMessage({ id, type: 'result', results, hasMore, error: null });
      }
    } catch (err: any) {
      self.postMessage({
        id,
        type: 'result',
        results: [],
        hasMore: false,
        error: err?.message || String(err)
      });
    }
  }
};

function executeMaskSearch(
  db: SqlDatabase,
  query: string,
  useRegex: boolean,
  ignoreDiacritics: boolean,
  onlySubstantives: boolean,
  includeProperNames: boolean,
  includeRuian: boolean,
  limit: number
): { results: WordMatch[]; hasMore: boolean } {
  const col = ignoreDiacritics ? 'word_nodiac' : 'word';
  const substPart = onlySubstantives ? 'is_subst = 1' : '1=1';
  const namePart = includeProperNames ? '1=1' : 'is_name = 0';
  const filterCond = `${substPart} AND ${namePart}`;

  let sql = '';
  let params: Record<string, any> = {};

  if (useRegex) {
    // Validate regular expression
    try {
      new RegExp(query, 'i');
    } catch {
      throw new Error('Neplatný regulární výraz');
    }

    sql = `
      SELECT word, freq, len, is_name FROM words
      WHERE ${col} REGEXP :pattern AND ${filterCond}
      ${includeRuian ? `UNION ALL SELECT word, 150 as freq, len, 1 as is_name FROM ruian WHERE ${col} REGEXP :pattern` : ''}
      ORDER BY freq DESC
      LIMIT :fetchLimit
    `;
    params = { ':pattern': query, ':fetchLimit': limit * 2 };
  } else {
    // Simple mask mode
    const cleanQ = ignoreDiacritics ? removeDiacritics(query).toLowerCase() : query.toLowerCase();
    const hasWildcard = cleanQ.includes('*');
    const globPattern = cleanQ.replace(/\./g, '?');

    if (!hasWildcard) {
      // Exact length mask (e.g. k..k.a -> len = 6, glob = k??k?a)
      sql = `
        SELECT word, freq, len, is_name FROM words
        WHERE len = :len AND ${col} GLOB :glob AND ${filterCond}
        ${includeRuian ? `UNION ALL SELECT word, 150 as freq, len, 1 as is_name FROM ruian WHERE len = :len AND ${col} GLOB :glob` : ''}
        ORDER BY freq DESC
        LIMIT :fetchLimit
      `;
      params = { ':len': cleanQ.length, ':glob': globPattern, ':fetchLimit': limit * 2 };
    } else {
      // Mask with asterisk wildcard
      sql = `
        SELECT word, freq, len, is_name FROM words
        WHERE ${col} GLOB :glob AND ${filterCond}
        ${includeRuian ? `UNION ALL SELECT word, 150 as freq, len, 1 as is_name FROM ruian WHERE ${col} GLOB :glob` : ''}
        ORDER BY freq DESC
        LIMIT :fetchLimit
      `;
      params = { ':glob': globPattern, ':fetchLimit': limit * 2 };
    }
  }

  const stmt = db.prepare(sql);
  stmt.bind(params);

  const seen = new Set<string>();
  const matches: WordMatch[] = [];
  let hasMore = false;
  while (stmt.step()) {
    if (matches.length >= limit) {
      hasMore = true;
      break;
    }
    const row = stmt.getAsObject() as { word: string; freq: number; len: number; is_name: number };
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
  stmt.free();
  return { results: matches, hasMore };
}

function executeAnagramSearch(
  db: SqlDatabase,
  query: string,
  ignoreDiacritics: boolean,
  onlySubstantives: boolean,
  includeProperNames: boolean,
  includeRuian: boolean,
  limit: number
): { results: WordMatch[]; hasMore: boolean } {
  // Strip non-letter characters
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

  // 1. Exact anagrams (length and letter bitmask match exactly)
  const stmtExact = db.prepare(`
    SELECT word, word_nodiac, freq, len, is_name FROM words
    WHERE len = :len AND mask_nodiac = :mask AND ${filterCond}
    ${includeRuian ? `UNION ALL SELECT word, word_nodiac, 150 as freq, len, 1 as is_name FROM ruian WHERE len = :len AND mask_nodiac = :mask` : ''}
    ORDER BY freq DESC
    LIMIT 1500
  `);
  stmtExact.bind({ ':len': targetLen, ':mask': targetMask });

  while (stmtExact.step()) {
    if (results.length >= limit) {
      hasMore = true;
      break;
    }
    const row = stmtExact.getAsObject() as { word: string; word_nodiac: string; freq: number; len: number; is_name: number };
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
  stmtExact.free();

  // 2. Sub-anagrams (shorter words with subset of letters)
  if (norm.length >= 3 && results.length < limit) {
    const stmtSub = db.prepare(`
      SELECT word, word_nodiac, freq, len, is_name FROM words
      WHERE len < :maxLen AND len >= 3 AND (mask_nodiac & ~:mask) = 0 AND ${filterCond} ${onlySubstantives ? '' : 'AND freq >= 5'}
      ${includeRuian ? `UNION ALL SELECT word, word_nodiac, 150 as freq, len, 1 as is_name FROM ruian WHERE len < :maxLen AND len >= 3 AND (mask_nodiac & ~:mask) = 0` : ''}
      ORDER BY len DESC, freq DESC
      LIMIT 5000
    `);
    stmtSub.bind({ ':maxLen': targetLen, ':mask': targetMask });

    while (stmtSub.step()) {
      if (results.length >= limit) {
        hasMore = true;
        break;
      }
      const row = stmtSub.getAsObject() as { word: string; word_nodiac: string; freq: number; len: number; is_name: number };
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
    stmtSub.free();
  }

  return { results, hasMore: hasMore || results.length >= limit };
}
