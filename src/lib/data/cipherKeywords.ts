/**
 * Dedicated pool of core Czech cipher keywords.
 * Loaded from data/puzzle_words.json.
 */

import puzzleWords from '../../../data/puzzle_words.json';
import { removeDiacritics } from '../db/czechCollation';

export const CIPHER_KEYWORDS: ReadonlySet<string> = new Set(
  (puzzleWords as string[]).map((w: string) => removeDiacritics(w).toUpperCase())
);

// Backward compatibility alias
export const CORE_CIPHER_WORDS = CIPHER_KEYWORDS;

