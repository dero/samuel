import {
  PAIR_TO_ENTRY,
  CHAR_TO_ENTRY,
  makePairKey,
  transformDirection,
  type SemaphoreEntry
} from './semaphoreData';

export interface SemaphoreDecodeOptions {
  mirrorX?: boolean;
  rotate180?: boolean;
  directNumbers?: boolean;
}

/**
 * Decodes a pair of directions into a SemaphoreEntry
 */
export function decodePair(
  a: number,
  b: number,
  options: SemaphoreDecodeOptions = {}
): SemaphoreEntry | null {
  if (a === b || a < 0 || a > 7 || b < 0 || b > 7) {
    return null;
  }

  const tA = transformDirection(a, options);
  const tB = transformDirection(b, options);
  const key = makePairKey(tA, tB);

  return PAIR_TO_ENTRY[key] || null;
}

/**
 * Returns character to insert/display for an entry
 */
export function getCharForEntry(
  entry: SemaphoreEntry | null,
  options: SemaphoreDecodeOptions = {}
): string {
  if (!entry) return '';
  if (options.directNumbers && entry.digit) {
    return entry.digit;
  }
  return entry.char;
}

/**
 * Parses pasted text or sequence of numbers (e.g. "45 46 67" or "AHOJ")
 */
export function normalizeSemaphoreInput(
  rawText: string,
  options: SemaphoreDecodeOptions = {}
): string {
  const trimmed = rawText.trim();
  if (!trimmed) return '';

  // Check if input looks like direction pairs (e.g. "45 56", "4-5 5-6", "0,4 1,4")
  const pairMatch = trimmed.match(/^([0-7][\s,\-_/]*[0-7][\s|;/\n]+)+[0-7][\s,\-_/]*[0-7]$/);
  const numberStreamMatch = trimmed.match(/^[0-7]{2,}(\s+[0-7]{2,})*$/);

  if (pairMatch || numberStreamMatch) {
    // Parse digits in pairs
    const digits = trimmed.replace(/[^0-7]/g, '');
    let result = '';
    for (let i = 0; i + 1 < digits.length; i += 2) {
      const d1 = parseInt(digits[i], 10);
      const d2 = parseInt(digits[i + 1], 10);
      const entry = decodePair(d1, d2, options);
      if (entry) {
        result += getCharForEntry(entry, options);
      } else {
        result += '?';
      }
    }
    return result;
  }

  // Otherwise, treat as Latin text
  const clean = trimmed
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase();

  return clean;
}
