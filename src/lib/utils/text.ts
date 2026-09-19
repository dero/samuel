/**
 * Dependency-free text normalization utilities for Samuel cipher toolset.
 */

/**
 * Removes diacritical marks (accents, carons, rings, etc.) from a string.
 * Decomposes characters to Unicode NFD and removes combining marks (U+0300 - U+036F).
 */
export function removeDiacritics(text: string): string {
  if (!text) return '';
  return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

/**
 * Alias for removeDiacritics for compatibility across solvers and modules.
 */
export const stripDiacritics = removeDiacritics;
