/**
 * Search and text normalization utilities for Samuel cipher toolset.
 * Defaults to case-insensitive and diacritics-insensitive matching.
 */

export interface SearchOptions {
  /** If true, preserves case sensitivity. Default: false */
  caseSensitive?: boolean;
  /** If true, preserves diacritics. Default: false */
  diacritics?: boolean;
  /** If true, matches the exact query phrase instead of requiring all tokens. Default: false */
  exactPhrase?: boolean;
}

/**
 * Removes diacritics (accents/carons) from text.
 */
export function removeDiacritics(text: string): string {
  if (!text) return '';
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

/**
 * Normalizes text for search operations (by default lowercase without diacritics).
 */
export function normalizeForSearch(
  text: string,
  options?: Pick<SearchOptions, 'caseSensitive' | 'diacritics'>
): string {
  if (!text) return '';
  let result = text;
  if (!options?.diacritics) {
    result = removeDiacritics(result);
  }
  if (!options?.caseSensitive) {
    result = result.toLowerCase();
  }
  return result.trim();
}

/**
 * Checks if a target string or list of field strings matches the search query.
 * By default: case-insensitive, diacritics-insensitive, multi-token matching.
 */
export function matchesSearch(
  target: string | (string | null | undefined)[] | null | undefined,
  query: string,
  options?: SearchOptions
): boolean {
  if (!query || !query.trim()) return true;
  if (!target) return false;

  const normQuery = normalizeForSearch(query, options);
  if (!normQuery) return true;

  const rawTargets = Array.isArray(target) ? target : [target];
  const combinedNormTarget = rawTargets
    .filter((t): t is string => Boolean(t))
    .map((t) => normalizeForSearch(t, options))
    .join(' ');

  if (options?.exactPhrase) {
    return combinedNormTarget.includes(normQuery);
  }

  const queryTokens = normQuery.split(/\s+/).filter(Boolean);
  return queryTokens.every((token) => combinedNormTarget.includes(token));
}
