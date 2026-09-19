/**
 * Web Worker for T9 Predictive Engine
 * Runs SQLite queries in background thread to guarantee 0ms UI latency.
 */

import initSqlJs, { type Database as SqlDatabase } from 'sql.js';
import sqlWasmUrl from 'sql.js/dist/sql-wasm.wasm?url';

const DB_CACHE_NAME = 'samuel-db';

export const T9_DIGIT_TO_LETTERS: Record<string, string[]> = {
  '2': ['A', 'B', 'C'],
  '3': ['D', 'E', 'F'],
  '4': ['G', 'H', 'I'],
  '5': ['J', 'K', 'L'],
  '6': ['M', 'N', 'O'],
  '7': ['P', 'Q', 'R'],
  '8': ['T', 'U', 'V'],
  '9': ['W', 'X', 'Y', 'Z']
};

export const T9_PUNCTUATION = ['.', ',', '?', '!', '-', ':', '1'];

const DIGIT_TO_GLOB: Record<string, string> = {
  '2': '[abc]',
  '3': '[def]',
  '4': '[ghi]',
  '5': '[jkl]',
  '6': '[mno]',
  '7': '[pqrs]',
  '8': '[tuv]',
  '9': '[wxyz]'
};

function getFallbackT9Word(digits: string): string {
  let res = '';
  for (const d of digits) {
    if (T9_DIGIT_TO_LETTERS[d]) {
      res += T9_DIGIT_TO_LETTERS[d][0];
    } else {
      res += d;
    }
  }
  return res;
}

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

    const buffer = await getCachedDbBuffer();
    if (!buffer) {
      throw new Error('Slovníková databáze není stažena.');
    }

    const db = new SQL.Database(new Uint8Array(buffer));
    dbInstance = db;
    return db;
  })();

  return initPromise;
}

self.onmessage = async (e: MessageEvent) => {
  const { id, type, digits, limit = 12 } = e.data;

  if (type === 'init') {
    try {
      await getWorkerDatabase();
      self.postMessage({ id, type: 'init_done' });
    } catch (err: any) {
      self.postMessage({ id, type: 'error', error: err?.message || String(err) });
    }
    return;
  }

  if (type === 'query') {
    if (!digits) {
      self.postMessage({ id, type: 'result', digits, candidates: [] });
      return;
    }

    if (!/^[2-9]+$/.test(digits)) {
      if (digits === '1') {
        self.postMessage({ id, type: 'result', digits, candidates: T9_PUNCTUATION });
      } else {
        self.postMessage({ id, type: 'result', digits, candidates: [digits] });
      }
      return;
    }

    const globExact = digits
      .split('')
      .map((d: string) => DIGIT_TO_GLOB[d] || '')
      .join('');

    try {
      const db = await getWorkerDatabase();
      const seen = new Set<string>();
      const candidates: string[] = [];

      // 1. Puzzle words
      try {
        const stmtPuzzle = db.prepare(
          `SELECT word FROM puzzle_words WHERE len = :len AND word_nodiac GLOB :glob LIMIT 5`
        );
        stmtPuzzle.bind({ ':len': digits.length, ':glob': globExact });
        while (stmtPuzzle.step()) {
          const row = stmtPuzzle.getAsObject() as { word: string };
          const upper = row.word.toUpperCase();
          if (!seen.has(upper)) {
            seen.add(upper);
            candidates.push(upper);
          }
        }
        stmtPuzzle.free();
      } catch {
        // Ignore
      }

      // 2. Main dictionary exact matches (cap at 7 to guarantee room for prefix completions)
      const exactLimit = Math.min(limit, 7);
      try {
        const stmtAll = db.prepare(
          `SELECT word FROM cs_all WHERE len = :len AND word_nodiac GLOB :glob ORDER BY freq DESC LIMIT :limit`
        );
        stmtAll.bind({ ':len': digits.length, ':glob': globExact, ':limit': exactLimit });
        while (stmtAll.step()) {
          const row = stmtAll.getAsObject() as { word: string };
          const upper = row.word.toUpperCase();
          if (!seen.has(upper)) {
            seen.add(upper);
            candidates.push(upper);
          }
        }
        stmtAll.free();
      } catch {
        // Ignore
      }

      // 3. Prefix completions (longer words matching the digit prefix)
      if (candidates.length < limit) {
        const globPrefix = globExact + '*';

        // 3a. Cipher keywords prefix
        try {
          const stmtPuzzlePre = db.prepare(
            `SELECT word FROM puzzle_words WHERE len > :len AND word_nodiac GLOB :globPrefix LIMIT 2`
          );
          stmtPuzzlePre.bind({ ':len': digits.length, ':globPrefix': globPrefix });
          while (stmtPuzzlePre.step()) {
            const row = stmtPuzzlePre.getAsObject() as { word: string };
            const upper = row.word.toUpperCase();
            if (!seen.has(upper)) {
              seen.add(upper);
              candidates.push(upper);
            }
          }
          stmtPuzzlePre.free();
        } catch {
          // Ignore
        }

        // 3b. Main dictionary prefix by specific lengths (uses idx_all_len_freq for sub-millisecond lookups)
        const maxLen = Math.min(digits.length + 4, 18);
        for (let l = digits.length + 1; l <= maxLen && candidates.length < limit; l++) {
          try {
            const stmtPrefix = db.prepare(
              `SELECT word FROM cs_all WHERE len = :len AND word_nodiac GLOB :globPrefix ORDER BY freq DESC LIMIT 2`
            );
            stmtPrefix.bind({ ':len': l, ':globPrefix': globPrefix });
            while (stmtPrefix.step()) {
              const row = stmtPrefix.getAsObject() as { word: string };
              const upper = row.word.toUpperCase();
              if (!seen.has(upper)) {
                seen.add(upper);
                candidates.push(upper);
              }
              if (candidates.length >= limit) break;
            }
            stmtPrefix.free();
          } catch {
            // Ignore
          }
        }
      }

      if (candidates.length === 0) {
        candidates.push(getFallbackT9Word(digits));
      }

      self.postMessage({ id, type: 'result', digits, candidates: candidates.slice(0, limit) });
    } catch (err: any) {
      console.warn('T9 Worker lookup error:', err);
      self.postMessage({ id, type: 'result', digits, candidates: [getFallbackT9Word(digits)] });
    }
  }
};
