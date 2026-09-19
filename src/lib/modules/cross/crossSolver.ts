import type { CrossType } from './crossData';

export interface CrossCellItem {
  char: string;
  index: number;
  axis1: number;
  axis2: number;
  axis3?: number;
  label: string;
}

/**
 * Calculates the letter index (0-based) in the alphabet array from coordinates.
 */
export function coordinatesToIndex(
  type: CrossType,
  a1: number,
  a2: number,
  a3: number = 1
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
  letters: string[]
): string | null {
  const validA3 = a3 ?? 1;
  const idx = coordinatesToIndex(type, a1, a2, validA3);
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
  letters: string[]
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
  }

  const rawChar = a1 !== null && a2 !== null && a3 !== null
    ? coordinatesToChar(type, a1, a2, a3, letters)
    : null;

  return {
    text: parts.join(' • '),
    char: rawChar
  };
}
