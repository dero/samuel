import {
  PAIR_TO_ENTRY,
  CHAR_TO_ENTRY,
  makePairKey,
  transformDirection,
  type SemaphoreEntry
} from './semaphoreData';
import { removeDiacritics } from '../../utils/text';

export interface SemaphoreDecodeOptions {
  mirrorX?: boolean;
  rotate180?: boolean;
}

export interface SemaphoreTypingState {
  text: string;
  /** Numerals mode: after `#`, A–I and K read as 1–9 and 0 until `J`. */
  numMode: boolean;
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
export function getCharForEntry(entry: SemaphoreEntry | null, numMode: boolean = false): string {
  if (!entry) return '';
  if (numMode && entry.digit) {
    return entry.digit;
  }
  return entry.char;
}

/**
 * Applies one signal by the standard rules: `#` switches to numerals until `J`
 * (neither is written), and Omyl (CANCEL) erases the previous character.
 */
export function applySemaphoreEntry(
  state: SemaphoreTypingState,
  entry: SemaphoreEntry
): SemaphoreTypingState {
  if (entry.char === '#') return { text: state.text, numMode: true };
  if (entry.char === 'CANCEL') return { text: state.text.slice(0, -1), numMode: state.numMode };
  if (entry.char === 'J' && state.numMode) return { text: state.text, numMode: false };
  return { text: state.text + getCharForEntry(entry, state.numMode), numMode: state.numMode };
}

/**
 * Label for a signal before it is applied (pending key, dial hints).
 */
export function previewSemaphoreEntry(entry: SemaphoreEntry | null, numMode: boolean): string {
  if (!entry) return '';
  if (entry.char === 'CANCEL') return '⌫';
  return getCharForEntry(entry, numMode);
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
        result += getCharForEntry(entry);
      } else {
        result += '?';
      }
    }
    return result;
  }

  // Otherwise, treat as Latin text
  const clean = removeDiacritics(trimmed).toUpperCase();

  return clean;
}
