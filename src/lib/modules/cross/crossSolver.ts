import type { CrossType } from './crossData';

/** Letters in each small-cross table: two 3×3 grids and two X crosses. */
const SMALL_TABLE_SIZES = [9, 9, 4, 4];

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
    // a1: Table (1..4), a2: Position inside the table
    const size = SMALL_TABLE_SIZES[a1 - 1];
    if (!size || a2 < 1 || a2 > size) return null;
    return SMALL_TABLE_SIZES.slice(0, a1 - 1).reduce((sum, n) => sum + n, 0) + a2 - 1;
  }

  return null;
}

/** Notation field of a small-cross letter: table digit + position inside the table. */
export function smallIndexToField(index: number): string {
  let position = index;
  for (let table = 0; table < SMALL_TABLE_SIZES.length; table++) {
    if (position < SMALL_TABLE_SIZES[table]) return `${table + 1}${position + 1}`;
    position -= SMALL_TABLE_SIZES[table];
  }
  return '';
}

/**
 * Character of one notation field for the active letters: `''` is a space, `null` an invalid
 * field. Large cross: row, column, position (`132`). Small cross: table, position (`26`).
 */
export function fieldToChar(type: CrossType, field: string, letters: string[]): string | null {
  if (field === '') return ' ';

  const pattern = type === 'large-polish' ? /^[1-3]{3}$/ : /^[1-4][1-9]$/;
  if (!pattern.test(field)) return null;

  const [a1, a2, a3] = [...field].map(Number);
  const idx = coordinatesToIndex(type, a1, a2, a3);
  if (idx === null) return null;

  // Ad-hoc cipher rule: in 26-letter alphabet, 27th position in large polish cross is Space (' ')
  if (type === 'large-polish' && letters.length === 26 && idx === 26) return ' ';

  return letters[idx] ?? null;
}
