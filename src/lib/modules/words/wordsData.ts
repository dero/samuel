import type { SegmentOption } from '../../components/ui/SegmentedControl.svelte';
import { removeDiacritics } from '../../utils/text';

export type WordsMode = 'mask' | 'anagram';

export const WORDS_SEGMENT_OPTIONS: SegmentOption<WordsMode>[] = [
  { id: 'mask', label: 'Maska' },
  { id: 'anagram', label: 'Přesmyčka' }
];

export interface WordMatch {
  word: string;
  len: number;
  freq: number;
  isName?: boolean;
}

/**
 * Normalizes query string based on diacritics setting.
 */
export function normalizeQuery(query: string, ignoreDiacritics: boolean): string {
  const trimmed = query.trim();
  if (ignoreDiacritics) {
    return removeDiacritics(trimmed).toLowerCase();
  }
  return trimmed.toLowerCase();
}

/**
 * Sorts letters alphabetically for anagram index lookup.
 */
export function sortLetters(str: string): string {
  return str.split('').sort().join('');
}

/**
 * Checks if candidate word is a multiset subset of target letter counts (sub-anagram).
 */
export function isSubAnagram(
  candidateLetters: string,
  targetCounts: Record<string, number>
): boolean {
  const counts = { ...targetCounts };
  for (let i = 0; i < candidateLetters.length; i++) {
    const ch = candidateLetters[i];
    if (!counts[ch]) return false;
    counts[ch]--;
  }
  return true;
}

/**
 * Checks if candidate word is an exact anagram (same length + multiset match).
 */
export function isExactAnagram(
  candidateWord: string,
  targetCounts: Record<string, number>,
  targetLen: number
): boolean {
  if (candidateWord.length !== targetLen) return false;
  return isSubAnagram(candidateWord, targetCounts);
}

/**
 * Computes 26-bit letter presence bitmask for a-z.
 */
export function computeMaskNodiac(sNodiac: string): number {
  let mask = 0;
  for (let i = 0; i < sNodiac.length; i++) {
    const code = sNodiac.charCodeAt(i) - 97;
    if (code >= 0 && code <= 25) {
      mask |= (1 << code);
    }
  }
  return mask;
}

