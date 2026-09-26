import { resolve } from 'node:path';
import fs from 'node:fs';
import {
  LEXICON_SQL_QUERY,
  RUIAN_MULTIWORD_SQL_QUERY,
  parseLexiconRows,
  type RawLexiconWord
} from '../../src/lib/db/lexiconDb';

export type { RawLexiconWord };

let cachedRawWords: RawLexiconWord[] | null = null;

/**
 * Loads vocabulary from public/words.db using node:sqlite (Node 22+)
 * with fallback to sql.js (Node 20).
 * Mirrors getMorseLexicon() in src/lib/db/dbWorker.ts using shared lexiconDb queries.
 */
export async function loadLexiconRawWords(dbPath?: string): Promise<RawLexiconWord[]> {
  if (cachedRawWords) return cachedRawWords;

  const targetPath = dbPath ?? resolve(process.cwd(), 'public/words.db');

  try {
    const { DatabaseSync } = await import('node:sqlite');
    const db = new DatabaseSync(targetPath, { open: true, readOnly: true });

    const rows = db.prepare(LEXICON_SQL_QUERY).all() as Array<{
      w: string | number;
      is_cipher: number;
      is_ruian: number;
      freq: number;
    }>;

    const multiRows = db.prepare(RUIAN_MULTIWORD_SQL_QUERY).all() as Array<{
      word_nodiac: string;
    }>;

    cachedRawWords = parseLexiconRows(rows, multiRows);
    return cachedRawWords;
  } catch {
    // Fallback for Node 20 or environments without node:sqlite
    const initSqlJs = (await import('sql.js')).default;
    const SQL = await initSqlJs();
    const fileBuffer = fs.readFileSync(targetPath);
    const db = new SQL.Database(fileBuffer);

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

    cachedRawWords = parseLexiconRows(rows, multiRows);
    return cachedRawWords;
  }
}
