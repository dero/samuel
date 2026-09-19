/**
 * Web Worker for Morse Unspaced Solver (Bruteforce & DAG Beam Search)
 * Runs heavy lexicon loading and graph decoding in background thread.
 */

import initSqlJs, { type Database as SqlDatabase } from 'sql.js';
import sqlWasmUrl from 'sql.js/dist/sql-wasm.wasm?url';
import {
  LEXICON_SQL_QUERY,
  RUIAN_MULTIWORD_SQL_QUERY,
  parseLexiconRows,
  type RawLexiconWord
} from '../../db/lexiconDb';
import {
  buildLexiconItems,
  solveMorseWithoutSpaces,
  type LexiconItem,
  type MorseSolverWeights
} from './morseSolver';

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
let cachedLexicon: LexiconItem[] | null = null;
let initPromise: Promise<LexiconItem[]> | null = null;

async function getWorkerLexicon(): Promise<LexiconItem[]> {
  if (cachedLexicon) return cachedLexicon;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    const SQL = await initSqlJs({
      locateFile: () => sqlWasmUrl
    });

    let buffer = await getCachedDbBuffer();
    if (!buffer) {
      const res = await fetch('/words.db');
      if (!res.ok) throw new Error('Failed to fetch words.db');
      buffer = await res.arrayBuffer();
    }

    const db = new SQL.Database(new Uint8Array(buffer));
    dbInstance = db;

    // 1. Run main lexicon query
    const rows: Array<{ w: string | number; is_cipher: number; is_ruian: number; freq: number }> = [];
    const stmt = db.prepare(LEXICON_SQL_QUERY);
    while (stmt.step()) {
      rows.push(stmt.getAsObject() as any);
    }
    stmt.free();

    // 2. Run multi-word RUIAN query
    const multiRows: Array<{ word_nodiac: string }> = [];
    try {
      const stmtRuian = db.prepare(RUIAN_MULTIWORD_SQL_QUERY);
      while (stmtRuian.step()) {
        multiRows.push(stmtRuian.getAsObject() as any);
      }
      stmtRuian.free();
    } catch {
      // Ignore if ruian not available
    }

    const rawWords: RawLexiconWord[] = parseLexiconRows(rows, multiRows);
    const items = buildLexiconItems(rawWords);
    cachedLexicon = items;
    return items;
  })();

  return initPromise;
}

self.onmessage = async (e: MessageEvent) => {
  const { id, type, code, maxResults = 50, weights } = e.data;

  if (type === 'init') {
    try {
      await getWorkerLexicon();
      self.postMessage({ id, type: 'init_done' });
    } catch (err: any) {
      self.postMessage({ id, type: 'error', error: err?.message || String(err) });
    }
    return;
  }

  if (type === 'solve') {
    try {
      const lexicon = await getWorkerLexicon();
      const result = await solveMorseWithoutSpaces(code, maxResults, weights as Partial<MorseSolverWeights>, lexicon);
      self.postMessage({
        id,
        type: 'result',
        candidates: result.candidates,
        totalFound: result.totalFound
      });
    } catch (err: any) {
      console.error('Morse worker solve error:', err);
      self.postMessage({
        id,
        type: 'error',
        error: err?.message || String(err),
        candidates: [],
        totalFound: 0
      });
    }
  }
};
