/**
 * Czech collation utilities for Samuel cipher toolset.
 * Strictly respects Czech alphabetical order:
 * a, á, b, c, č, d, ď, e, é, ě, f, g, h, ch, i, í, j, k, l, m, n, ň, o, ó, p, q, r, ř, s, š, t, ť, u, ú, ů, v, w, x, y, ý, z, ž
 */

const czechCollator = new Intl.Collator('cs', { sensitivity: 'variant' });

/**
 * Sorts letters of a Czech string into standard Czech alphabetical order.
 * Used for anagram lookups with diacritics preserved (e.g. "člověk" -> "čěklov", "vláda" -> "aádlv").
 */
export function sortCzechLetters(word: string): string {
  if (!word) return '';
  return word
    .toLowerCase()
    .replace(/\s+/g, '')
    .split('')
    .sort(czechCollator.compare)
    .join('');
}

/**
 * Sorts letters of a string into standard ASCII alphabetical order.
 * Used for anagram lookups without diacritics (e.g. "clovek" -> "ceklov").
 */
export function sortNodiacLetters(word: string): string {
  if (!word) return '';
  return word
    .toLowerCase()
    .replace(/[^a-z]/g, '')
    .split('')
    .sort()
    .join('');
}

/**
 * Removes Czech diacritics from a string.
 */
export function removeDiacritics(text: string): string {
  if (!text) return '';
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ď/g, 'd')
    .replace(/ť/g, 't')
    .replace(/ň/g, 'n');
}
