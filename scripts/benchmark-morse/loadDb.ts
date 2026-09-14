import { DatabaseSync } from 'node:sqlite';
import { resolve } from 'node:path';
import {
  LEXICON_SQL_QUERY,
  RUIAN_MULTIWORD_SQL_QUERY,
  parseLexiconRows,
  type RawLexiconWord
} from '../../src/lib/db/lexiconDb';

export type { RawLexiconWord };

let cachedRawWords: RawLexiconWord[] | null = null;

/**
 * Loads vocabulary from public/words.db using node:sqlite.
 * Mirrors getLexiconWords() in src/lib/db/database.svelte.ts using shared lexiconDb queries.
 */
export function loadLexiconRawWords(dbPath?: string): RawLexiconWord[] {
  if (cachedRawWords) return cachedRawWords;

  const targetPath = dbPath ?? resolve(process.cwd(), 'public/words.db');
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
}
