/**
 * Web Worker for T9 Predictive Engine
 * Runs SQLite queries in background thread to guarantee 0ms UI latency.
 */

import initSqlJs, { type Database as SqlDatabase } from 'sql.js';
import sqlWasmUrl from 'sql.js/dist/sql-wasm.wasm?url';

const DB_CACHE_NAME = 'samuel-db';

import {
  T9_DIGIT_TO_LETTERS,
  T9_PUNCTUATION,
  DIGIT_TO_GLOB,
  getFallbackT9Word
} from './t9Data';
export { T9_DIGIT_TO_LETTERS, T9_PUNCTUATION };


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
      initPromise = null;
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

      // 1. Exact matches (puzzle words with freq >= 100000 appear first, followed by corpus words)
      const exactLimit = Math.min(limit, 7);
      try {
        const stmtExact = db.prepare(
          `SELECT word FROM words WHERE len = :len AND word_nodiac GLOB :glob ORDER BY freq DESC LIMIT :limit`
        );
        stmtExact.bind({ ':len': digits.length, ':glob': globExact, ':limit': exactLimit });
        while (stmtExact.step()) {
          const row = stmtExact.getAsObject() as { word: string };
          const upper = row.word.toUpperCase();
          if (!seen.has(upper)) {
            seen.add(upper);
            candidates.push(upper);
          }
        }
        stmtExact.free();
      } catch {
        // Ignore
      }

      // 2. Prefix completions (longer words matching the digit prefix)
      if (candidates.length < limit) {
        const globPrefix = globExact + '*';
        const maxLen = Math.min(digits.length + 4, 18);
        for (let l = digits.length + 1; l <= maxLen && candidates.length < limit; l++) {
          try {
            const stmtPrefix = db.prepare(
              `SELECT word FROM words WHERE len = :len AND word_nodiac GLOB :globPrefix ORDER BY freq DESC LIMIT 2`
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
