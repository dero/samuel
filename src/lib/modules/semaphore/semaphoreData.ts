export interface SemaphoreDirection {
  index: number;
  label: string;
  shortLabel: string;
  arrow: string;
  angleDeg: number; // 0 = North / 12:00, clockwise
  dx: number; // unit circle offset (-1 to 1)
  dy: number; // unit circle offset (-1 to 1, negative is Up)
}

export const SEMAPHORE_DIRECTIONS: SemaphoreDirection[] = [
  { index: 0, label: 'Nahoru', shortLabel: 'N', arrow: '↑', angleDeg: 0, dx: 0, dy: -1 },
  { index: 1, label: 'Vpravo nahoru', shortLabel: 'SV', arrow: '↗', angleDeg: 45, dx: Math.SQRT1_2, dy: -Math.SQRT1_2 },
  { index: 2, label: 'Vpravo', shortLabel: 'V', arrow: '→', angleDeg: 90, dx: 1, dy: 0 },
  { index: 3, label: 'Vpravo dolů', shortLabel: 'JV', arrow: '↘', angleDeg: 135, dx: Math.SQRT1_2, dy: Math.SQRT1_2 },
  { index: 4, label: 'Dolů', shortLabel: 'J', arrow: '↓', angleDeg: 180, dx: 0, dy: 1 },
  { index: 5, label: 'Vlevo dolů', shortLabel: 'JZ', arrow: '↙', angleDeg: 225, dx: -Math.SQRT1_2, dy: Math.SQRT1_2 },
  { index: 6, label: 'Vlevo', shortLabel: 'Z', arrow: '←', angleDeg: 270, dx: -1, dy: 0 },
  { index: 7, label: 'Vlevo nahoru', shortLabel: 'SZ', arrow: '↖', angleDeg: 315, dx: -Math.SQRT1_2, dy: -Math.SQRT1_2 },
];

export interface SemaphoreEntry {
  char: string;
  pair: [number, number]; // sorted [min, max], 0..7
  key: string;            // e.g. "4_5"
  digit?: string;         // e.g. "1" for 'A'
  name: string;           // Czech description
  series: number;         // 1..7 for mnemonic ordering
}

// Canonical semaphore table (Viewer's perspective / pohled na obrázek)
// 8 directions (0:N, 1:NE, 2:E, 3:SE, 4:S, 5:SW, 6:W, 7:NW)
export const SEMAPHORE_ENTRIES: SemaphoreEntry[] = [
  // 1. série (pevné rameno: Dolů / Jih = 4)
  { char: 'A', pair: [4, 5], key: '4_5', digit: '1', name: 'Písmeno A (číslice 1)', series: 1 },
  { char: 'B', pair: [4, 6], key: '4_6', digit: '2', name: 'Písmeno B (číslice 2)', series: 1 },
  { char: 'C', pair: [4, 7], key: '4_7', digit: '3', name: 'Písmeno C (číslice 3)', series: 1 },
  { char: 'D', pair: [0, 4], key: '0_4', digit: '4', name: 'Písmeno D (číslice 4)', series: 1 },
  { char: 'E', pair: [1, 4], key: '1_4', digit: '5', name: 'Písmeno E (číslice 5)', series: 1 },
  { char: 'F', pair: [2, 4], key: '2_4', digit: '6', name: 'Písmeno F (číslice 6)', series: 1 },
  { char: 'G', pair: [3, 4], key: '3_4', digit: '7', name: 'Písmeno G (číslice 7)', series: 1 },

  // 2. série (pevné rameno: Vlevo dolů / JZ = 5)
  { char: 'H', pair: [5, 6], key: '5_6', digit: '8', name: 'Písmeno H (číslice 8)', series: 2 },
  { char: 'I', pair: [5, 7], key: '5_7', digit: '9', name: 'Písmeno I (číslice 9)', series: 2 },
  { char: 'K', pair: [0, 5], key: '0_5', digit: '0', name: 'Písmeno K (číslice 0)', series: 2 },
  { char: 'L', pair: [1, 5], key: '1_5', name: 'Písmeno L', series: 2 },
  { char: 'M', pair: [2, 5], key: '2_5', name: 'Písmeno M', series: 2 },
  { char: 'N', pair: [3, 5], key: '3_5', name: 'Písmeno N', series: 2 },

  // 3. série (pevné rameno: Vlevo / Západ = 6)
  { char: 'O', pair: [6, 7], key: '6_7', name: 'Písmeno O', series: 3 },
  { char: 'P', pair: [0, 6], key: '0_6', name: 'Písmeno P', series: 3 },
  { char: 'Q', pair: [1, 6], key: '1_6', name: 'Písmeno Q', series: 3 },
  { char: 'R', pair: [2, 6], key: '2_6', name: 'Písmeno R', series: 3 },
  { char: 'S', pair: [3, 6], key: '3_6', name: 'Písmeno S', series: 3 },

  // 4. série (pevné rameno: Vlevo nahoru / SZ = 7)
  { char: 'T', pair: [0, 7], key: '0_7', name: 'Písmeno T', series: 4 },
  { char: 'U', pair: [1, 7], key: '1_7', name: 'Písmeno U', series: 4 },
  { char: 'Y', pair: [2, 7], key: '2_7', name: 'Písmeno Y', series: 4 },
  { char: 'CANCEL', pair: [3, 7], key: '3_7', name: 'Omyl', series: 4 },

  // Zbývající kombinace z {0, 1, 2, 3}
  { char: '#', pair: [0, 1], key: '0_1', name: 'Přepnutí na číslice', series: 5 },
  { char: 'J', pair: [0, 2], key: '0_2', name: 'Písmeno J, přepnutí na písmena', series: 5 },
  { char: 'V', pair: [0, 3], key: '0_3', name: 'Písmeno V', series: 5 },
  { char: 'W', pair: [1, 2], key: '1_2', name: 'Písmeno W', series: 6 },
  { char: 'X', pair: [1, 3], key: '1_3', name: 'Písmeno X', series: 6 },
  { char: 'Z', pair: [2, 3], key: '2_3', name: 'Písmeno Z', series: 7 },
];

export const PAIR_TO_ENTRY: Record<string, SemaphoreEntry> = {};
export const CHAR_TO_ENTRY: Record<string, SemaphoreEntry> = {};

for (const entry of SEMAPHORE_ENTRIES) {
  PAIR_TO_ENTRY[entry.key] = entry;
  CHAR_TO_ENTRY[entry.char] = entry;
  if (entry.digit) {
    CHAR_TO_ENTRY[entry.digit] = entry;
  }
}

/**
 * Creates canonical pair key from any two direction indices (0..7)
 */
export function makePairKey(a: number, b: number): string {
  const min = Math.min(a, b);
  const max = Math.max(a, b);
  return `${min}_${max}`;
}

/**
 * Transforms direction based on active transformation options:
 * - mirrorX: Horizontal mirror (Pohled vysílajícího): (8 - dir) % 8
 * - rotate180: Upside-down: (dir + 4) % 8
 */
export function transformDirection(
  dir: number,
  options: { mirrorX?: boolean; rotate180?: boolean } = {}
): number {
  let d = dir;
  if (options.mirrorX) {
    d = (8 - d) % 8;
  }
  if (options.rotate180) {
    d = (d + 4) % 8;
  }
  return d;
}
