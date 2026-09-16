import type { CrossType } from './crossData';

export interface CrossCellItem {
  char: string;
  index: number;
  axis1: number;
  axis2: number;
  axis3?: number;
  label: string;
}

export const STANDARD_PHONE_KEYS: Record<string, string[]> = {
  '0': [' ', '0'],
  '1': ['.', ',', '?', '!'],
  '2': ['A', 'B', 'C'],
  '3': ['D', 'E', 'F'],
  '4': ['G', 'H', 'I'],
  '5': ['J', 'K', 'L'],
  '6': ['M', 'N', 'O'],
  '7': ['P', 'Q', 'R', 'S'],
  '8': ['T', 'U', 'V'],
  '9': ['W', 'X', 'Y', 'Z'],
  '*': ['*', '+'],
  '#': ['#']
};

/**
 * Returns standard ITU E.161 characters mapped to a phone keypad key (1..9, 0, *, #).
 */
export function getPhoneKeyLetters(key: string | number): string[] {
  return STANDARD_PHONE_KEYS[String(key)] ?? [];
}

/**
 * Calculates the letter index (0-based) in the alphabet array from coordinates.
 */
export function coordinatesToIndex(
  type: CrossType,
  a1: number,
  a2: number,
  a3: number = 1,
  size: number = 5
): number | null {
  if (type === 'large-polish') {
    // a1: Row (1..3), a2: Col (1..3), a3: Pos/Dot (1..3)
    if (a1 < 1 || a1 > 3 || a2 < 1 || a2 > 3 || a3 < 1 || a3 > 3) return null;
    const cellIdx = (a1 - 1) * 3 + (a2 - 1); // 0..8
    return cellIdx * 3 + (a3 - 1); // 0..26
  }

  if (type === 'small-polish') {
    // a1: Table (1..3), a2: Row (1..3), a3: Col (1..3)
    if (a1 < 1 || a1 > 3 || a2 < 1 || a2 > 3 || a3 < 1 || a3 > 3) return null;
    const tableOffset = (a1 - 1) * 9;
    const cellIdx = (a2 - 1) * 3 + (a3 - 1);
    return tableOffset + cellIdx;
  }

  if (type === 'polybius') {
    // a1: Row (1..size), a2: Col (1..size)
    if (a1 < 1 || a1 > size || a2 < 1 || a2 > size) return null;
    return (a1 - 1) * size + (a2 - 1);
  }

  return null;
}

/**
 * Maps coordinates to a character given active letters list.
 */
export function coordinatesToChar(
  type: CrossType,
  a1: number,
  a2: number,
  a3: number | null,
  letters: string[],
  polybiusSize: number = 5
): string | null {
  if (type === 'mobile-keypad') {
    // a1: Key (2..9, 0), a2: Position (1..5)
    const keyLetters = getPhoneKeyLetters(a1);
    const posIdx = a2 - 1;
    if (posIdx >= 0 && posIdx < keyLetters.length) {
      return keyLetters[posIdx];
    }
    return null;
  }

  const validA3 = a3 ?? 1;
  const idx = coordinatesToIndex(type, a1, a2, validA3, polybiusSize);
  if (idx === null) return null;

  // Ad-hoc cipher rule: in 26-letter alphabet, 27th position in large polish cross is Space (' ')
  if (type === 'large-polish' && letters.length === 26 && idx === 26) {
    return ' ';
  }

  if (idx < 0 || idx >= letters.length) return null;
  return letters[idx] ?? null;
}

/**
 * Returns formatted coordinate preview label.
 */
export function formatCoordinatesPreview(
  type: CrossType,
  a1: number | null,
  a2: number | null,
  a3: number | null,
  letters: string[],
  polybiusSize: number = 5
): { text: string; char: string | null } {
  const parts: string[] = [];

  if (type === 'large-polish') {
    if (a1 !== null) parts.push(`Ř: ${a1}`);
    if (a2 !== null) parts.push(`S: ${a2}`);
    if (a3 !== null) parts.push(`P: ${a3}`);
  } else if (type === 'small-polish') {
    if (a1 !== null) parts.push(`Tab: ${a1 === 1 ? 'I' : a1 === 2 ? 'II' : 'III'}`);
    if (a2 !== null) parts.push(`Ř: ${a2}`);
    if (a3 !== null) parts.push(`S: ${a3}`);
  } else if (type === 'mobile-keypad') {
    if (a1 !== null) parts.push(a1 === 0 ? 'Klávesa: 0 (Mezera)' : `Klávesa: ${a1}`);
    if (a2 !== null) parts.push(`Stisk: ${a2}`);
  } else if (type === 'polybius') {
    if (a1 !== null) parts.push(`Ř: ${a1}`);
    if (a2 !== null) parts.push(`S: ${a2}`);
  }

  const rawChar =
    type === 'mobile-keypad'
      ? a1 !== null && a2 !== null
        ? coordinatesToChar(type, a1, a2, null, letters)
        : null
      : type === 'polybius'
        ? a1 !== null && a2 !== null
          ? coordinatesToChar(type, a1, a2, null, letters, polybiusSize)
          : null
        : a1 !== null && a2 !== null && a3 !== null
          ? coordinatesToChar(type, a1, a2, a3, letters)
          : null;

  const char = rawChar === ' ' ? '␣' : rawChar;
  const text = parts.length > 0 ? parts.join('  •  ') : '';
  return { text, char };
}
