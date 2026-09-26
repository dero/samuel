/**
 * Pure TypeScript SQL definitions and parser for Samuel lexicon vocabulary.
 * Shared between the browser client (shared DB worker, dbWorker.ts) and the
 * Node.js benchmark (node:sqlite / sql.js fallback).
 */

export interface RawLexiconWord {
  word: string;
  isCipher: boolean;
  isRuian: boolean;
  freq: number;
}

export const LEXICON_SQL_QUERY = `
  SELECT w, MAX(is_cipher) as is_cipher, MAX(is_ruian) as is_ruian, MAX(freq) as freq
  FROM (
    SELECT UPPER(word_nodiac) AS w, is_puzzle AS is_cipher, 0 AS is_ruian, freq
    FROM words
    WHERE (len >= 2 OR is_puzzle = 1) AND (is_subst = 1 OR freq >= 30 OR is_puzzle = 1)
    UNION ALL
    SELECT UPPER(REPLACE(REPLACE(word_nodiac, ' ', ''), '-', '')) AS w, 0 AS is_cipher, 1 AS is_ruian, 100 AS freq
    FROM ruian
    WHERE type IN ('ulice', 'cast_obce', 'obec') AND len >= 2
  )
  WHERE (length(w) >= 2 OR is_cipher = 1) AND w NOT GLOB '*[^A-Z]*'
  GROUP BY w
`;

export const RUIAN_MULTIWORD_SQL_QUERY = `
  SELECT word_nodiac FROM ruian
  WHERE type IN ('ulice', 'cast_obce', 'obec') AND (word_nodiac LIKE '% %' OR word_nodiac LIKE '%-%')
`;

/**
 * Parses raw SQLite result rows into normalized RawLexiconWord items.
 */
export function parseLexiconRows(
  rows: Array<{ w: string | number; is_cipher: number; is_ruian: number; freq: number }>,
  multiRows: Array<{ word_nodiac: string }>
): RawLexiconWord[] {
  const items: RawLexiconWord[] = [];
  const seen = new Set<string>();

  for (const r of rows) {
    const wordStr = String(r.w);
    seen.add(wordStr);
    items.push({
      word: wordStr,
      isCipher: Number(r.is_cipher) === 1,
      isRuian: Number(r.is_ruian) === 1,
      freq: Number(r.freq) || 0
    });
  }

  for (const r of multiRows) {
    const parts = String(r.word_nodiac).replace(/-/g, ' ').split(/\s+/);
    for (const p of parts) {
      const clean = p.toUpperCase().replace(/[^A-Z]/g, '');
      if (clean.length >= 3 && !seen.has(clean)) {
        seen.add(clean);
        items.push({
          word: clean,
          isCipher: false,
          isRuian: true,
          freq: 100
        });
      }
    }
  }

  return items;
}
