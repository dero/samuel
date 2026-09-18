/**
 * T9 Predictive Engine for Czech Mobile Keypad
 * Uses SQLite (words.db) with GLOB queries on-the-fly without bloated DB indices.
 */

import { getDatabase } from '../../db/database.svelte';

export const T9_DIGIT_TO_LETTERS: Record<string, string[]> = {
  '2': ['A', 'B', 'C'],
  '3': ['D', 'E', 'F'],
  '4': ['G', 'H', 'I'],
  '5': ['J', 'K', 'L'],
  '6': ['M', 'N', 'O'],
  '7': ['P', 'Q', 'R', 'S'],
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

/**
 * Returns fallback letters for a digit string when no dictionary matches.
 */
export function getFallbackT9Word(digits: string): string {
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

/**
 * Resolves T9 digit sequence into ranked candidate words on-the-fly.
 */
export async function getT9Candidates(digits: string, limit: number = 12): Promise<string[]> {
  if (!digits) return [];

  // Check if all characters are valid T9 word digits (2-9)
  const isWordDigits = /^[2-9]+$/.test(digits);
  if (!isWordDigits) {
    if (digits === '1') {
      return T9_PUNCTUATION;
    }
    return [digits];
  }

  const globExact = digits
    .split('')
    .map((d) => DIGIT_TO_GLOB[d] || '')
    .join('');

  if (!globExact) return [];

  try {
    const db = await getDatabase();
    const seen = new Set<string>();
    const candidates: string[] = [];

    // 1. Prioritize cipher keywords from puzzle_words
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
      // Ignore if table not available
    }

    // 2. Query main dictionary exact matches (cap at 7 to guarantee room for prefix completions)
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
      // Ignore if table not available
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

    // 4. If still empty, add default permutation fallback
    if (candidates.length === 0) {
      candidates.push(getFallbackT9Word(digits));
    }

    return candidates.slice(0, limit);
  } catch (err) {
    console.warn('T9 DB lookup error:', err);
    return [getFallbackT9Word(digits)];
  }
}
