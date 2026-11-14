export type DisplayType = '7seg' | '14seg' | '16seg';

export interface SegmentDef {
  id: string;
  /** SVG polygon points string */
  points: string;
  /** Centerline for hit-testing [x1, y1, x2, y2] */
  axis: readonly [number, number, number, number];
  /** Center for segment label [x, y] */
  labelPos: readonly [number, number];
}

export interface DisplayGlyphEntry {
  char: string;
  segments: string;
  category: 'digit' | 'letter' | 'symbol';
  description?: string;
}

export interface DisplayConfig {
  id: DisplayType;
  label: string;
  shortLabel: string;
  segmentIds: readonly string[];
  segments: readonly SegmentDef[];
  hitRadius: number;
  exampleNotation: string;
  description: string;
}

export const DISPLAY_VIEWBOX = '0 0 180 260';

export const SEVEN_SEG_DIGIT_TO_LETTER: Record<string, string> = {
  '1': 'a',
  '2': 'b',
  '3': 'c',
  '4': 'd',
  '5': 'e',
  '6': 'f',
  '7': 'g'
};

export const SEVEN_SEG_LETTER_TO_DIGIT: Record<string, string> = {
  a: '1',
  b: '2',
  c: '3',
  d: '4',
  e: '5',
  f: '6',
  g: '7'
};

function fmtPts(pts: readonly (readonly [number, number])[]): string {
  return pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
}

function horizBar(id: string, x1: number, x2: number, y: number, r: number): SegmentDef {
  const pts: [number, number][] = [
    [x1, y],
    [x1 + r, y - r],
    [x2 - r, y - r],
    [x2, y],
    [x2 - r, y + r],
    [x1 + r, y + r]
  ];
  return {
    id,
    points: fmtPts(pts),
    axis: [x1 + r * 0.6, y, x2 - r * 0.6, y],
    labelPos: [(x1 + x2) / 2, y]
  };
}

function vertBar(id: string, x: number, y1: number, y2: number, r: number): SegmentDef {
  const pts: [number, number][] = [
    [x, y1],
    [x + r, y1 + r],
    [x + r, y2 - r],
    [x, y2],
    [x - r, y2 - r],
    [x - r, y1 + r]
  ];
  return {
    id,
    points: fmtPts(pts),
    axis: [x, y1 + r * 0.6, x, y2 - r * 0.6],
    labelPos: [x, (y1 + y2) / 2]
  };
}

function diagBar(
  id: string,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  r: number
): SegmentDef {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.hypot(dx, dy);
  const ux = dx / len;
  const uy = dy / len;
  const nx = -uy;
  const ny = ux;
  const bevel = r * 0.9;

  const pts: [number, number][] = [
    [x1, y1],
    [x1 + ux * bevel + nx * r, y1 + uy * bevel + ny * r],
    [x2 - ux * bevel + nx * r, y2 - uy * bevel + ny * r],
    [x2, y2],
    [x2 - ux * bevel - nx * r, y2 - uy * bevel - ny * r],
    [x1 + ux * bevel - nx * r, y1 + uy * bevel - ny * r]
  ];
  return {
    id,
    points: fmtPts(pts),
    axis: [x1 + ux * 4, y1 + uy * 4, x2 - ux * 4, y2 - uy * 4],
    labelPos: [(x1 + x2) / 2, (y1 + y2) / 2]
  };
}

// --- 7-segment geometry (1..7) ---
const S7_XL = 34;
const S7_XR = 146;
const S7_YT = 30;
const S7_YM = 130;
const S7_YB = 230;
const S7_R = 12;
const S7_GAP = 3;

export const SEVEN_SEGMENTS: readonly SegmentDef[] = [
  horizBar('1', S7_XL + S7_GAP, S7_XR - S7_GAP, S7_YT, S7_R),
  vertBar('2', S7_XR, S7_YT + S7_GAP, S7_YM - S7_GAP, S7_R),
  vertBar('3', S7_XR, S7_YM + S7_GAP, S7_YB - S7_GAP, S7_R),
  horizBar('4', S7_XL + S7_GAP, S7_XR - S7_GAP, S7_YB, S7_R),
  vertBar('5', S7_XL, S7_YM + S7_GAP, S7_YB - S7_GAP, S7_R),
  vertBar('6', S7_XL, S7_YT + S7_GAP, S7_YM - S7_GAP, S7_R),
  horizBar('7', S7_XL + S7_GAP, S7_XR - S7_GAP, S7_YM, S7_R)
];

// --- 14-segment & 16-segment shared outer frame ---
const M_XL = 28;
const M_XM = 90;
const M_XR = 152;
const M_YT = 26;
const M_YM = 130;
const M_YB = 234;
const M_R = 8.5;
const M_GAP = 3;
const D_R = 6.8;

export const FOURTEEN_SEGMENTS: readonly SegmentDef[] = [
  horizBar('a', M_XL + M_GAP, M_XR - M_GAP, M_YT, M_R),
  vertBar('b', M_XR, M_YT + M_GAP, M_YM - M_GAP, M_R),
  vertBar('c', M_XR, M_YM + M_GAP, M_YB - M_GAP, M_R),
  horizBar('d', M_XL + M_GAP, M_XR - M_GAP, M_YB, M_R),
  vertBar('e', M_XL, M_YM + M_GAP, M_YB - M_GAP, M_R),
  vertBar('f', M_XL, M_YT + M_GAP, M_YM - M_GAP, M_R),
  horizBar('g', M_XL + M_GAP, M_XM - M_GAP, M_YM, M_R),
  diagBar('h', 44, 46, 74, 112, D_R),
  vertBar('i', M_XM, M_YT + M_R + M_GAP + 2, M_YM - M_GAP, M_R),
  diagBar('j', 136, 46, 106, 112, D_R),
  horizBar('k', M_XM + M_GAP, M_XR - M_GAP, M_YM, M_R),
  diagBar('l', 106, 148, 136, 214, D_R),
  vertBar('m', M_XM, M_YM + M_GAP, M_YB - M_R - M_GAP - 2, M_R),
  diagBar('n', 74, 148, 44, 214, D_R)
];

export const SIXTEEN_SEGMENTS: readonly SegmentDef[] = [
  horizBar('a', M_XL + M_GAP, M_XM - M_GAP, M_YT, M_R),
  horizBar('b', M_XM + M_GAP, M_XR - M_GAP, M_YT, M_R),
  vertBar('c', M_XR, M_YT + M_GAP, M_YM - M_GAP, M_R),
  vertBar('d', M_XR, M_YM + M_GAP, M_YB - M_GAP, M_R),
  horizBar('e', M_XM + M_GAP, M_XR - M_GAP, M_YB, M_R),
  horizBar('f', M_XL + M_GAP, M_XM - M_GAP, M_YB, M_R),
  vertBar('g', M_XL, M_YM + M_GAP, M_YB - M_GAP, M_R),
  vertBar('h', M_XL, M_YT + M_GAP, M_YM - M_GAP, M_R),
  horizBar('i', M_XL + M_GAP, M_XM - M_GAP, M_YM, M_R),
  diagBar('j', 44, 46, 74, 112, D_R),
  vertBar('k', M_XM, M_YT + M_GAP, M_YM - M_GAP, M_R),
  diagBar('l', 136, 46, 106, 112, D_R),
  horizBar('m', M_XM + M_GAP, M_XR - M_GAP, M_YM, M_R),
  diagBar('n', 106, 148, 136, 214, D_R),
  vertBar('o', M_XM, M_YM + M_GAP, M_YB - M_GAP, M_R),
  diagBar('p', 74, 148, 44, 214, D_R)
];

export const DISPLAY_CONFIGS: Record<DisplayType, DisplayConfig> = {
  '7seg': {
    id: '7seg',
    label: '7-segment',
    shortLabel: '7-seg',
    segmentIds: ['1', '2', '3', '4', '5', '6', '7'],
    segments: SEVEN_SEGMENTS,
    hitRadius: 26,
    exampleNotation: '123567,3567,3457,2345',
    description: 'Čísla segmentů 1–7 (nebo písmena a–g): čárka dělí znaky, prázdné pole je mezera.'
  },
  '14seg': {
    id: '14seg',
    label: '14-segment',
    shortLabel: '14-seg',
    segmentIds: ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n'],
    segments: FOURTEEN_SEGMENTS,
    hitRadius: 20,
    exampleNotation: 'abcefgk,bcefgk,abcdef,bcde',
    description: 'Písmena segmentů (a–n): čárka dělí znaky, prázdné pole je mezera.'
  },
  '16seg': {
    id: '16seg',
    label: '16-segment',
    shortLabel: '16-seg',
    segmentIds: ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p'],
    segments: SIXTEEN_SEGMENTS,
    hitRadius: 20,
    exampleNotation: 'abcdghim,cdghim,abcdefgh,cdef',
    description: 'Písmena segmentů (a–p): čárka dělí znaky, prázdné pole je mezera.'
  }
};

// --- Reference Catalogs ---

export const SEVEN_SEG_LETTERS: readonly DisplayGlyphEntry[] = [
  { char: 'A', segments: '123567', category: 'letter' },
  { char: 'B', segments: '34567', category: 'letter' },
  { char: 'C', segments: '457', category: 'letter' },
  { char: 'D', segments: '23457', category: 'letter' },
  { char: 'E', segments: '14567', category: 'letter' },
  { char: 'F', segments: '1567', category: 'letter' },
  { char: 'G', segments: '13456', category: 'letter' },
  { char: 'H', segments: '3567', category: 'letter' },
  { char: 'I', segments: '56', category: 'letter' },
  { char: 'J', segments: '2345', category: 'letter' },
  { char: 'K', segments: '13567', category: 'letter' },
  { char: 'L', segments: '456', category: 'letter' },
  { char: 'M', segments: '12356', category: 'letter' },
  { char: 'N', segments: '357', category: 'letter' },
  { char: 'O', segments: '3457', category: 'letter' },
  { char: 'P', segments: '12567', category: 'letter' },
  { char: 'Q', segments: '12367', category: 'letter' },
  { char: 'R', segments: '57', category: 'letter' },
  { char: 'S', segments: '13467', category: 'letter', description: 'Shodné s 5' },
  { char: 'T', segments: '4567', category: 'letter' },
  { char: 'U', segments: '345', category: 'letter' },
  { char: 'V', segments: '23456', category: 'letter' },
  { char: 'W', segments: '234567', category: 'letter' },
  { char: 'X', segments: '23567', category: 'letter' },
  { char: 'Y', segments: '23467', category: 'letter' },
  { char: 'Z', segments: '12457', category: 'letter', description: 'Shodné s 2' }
];

export const SEVEN_SEG_DIGITS: readonly DisplayGlyphEntry[] = [
  { char: '0', segments: '123456', category: 'digit' },
  { char: '1', segments: '23', category: 'digit' },
  { char: '2', segments: '12457', category: 'digit', description: 'Shodné se Z' },
  { char: '3', segments: '12347', category: 'digit' },
  { char: '4', segments: '2367', category: 'digit' },
  { char: '5', segments: '13467', category: 'digit', description: 'Shodné se S' },
  { char: '6', segments: '134567', category: 'digit' },
  { char: '7', segments: '123', category: 'digit' },
  { char: '8', segments: '1234567', category: 'digit' },
  { char: '9', segments: '123467', category: 'digit' }
];

export const FOURTEEN_SEG_LETTERS: readonly DisplayGlyphEntry[] = [
  { char: 'A', segments: 'abcefgk', category: 'letter' },
  { char: 'B', segments: 'abcdikm', category: 'letter' },
  { char: 'C', segments: 'adef', category: 'letter' },
  { char: 'D', segments: 'abcdim', category: 'letter' },
  { char: 'E', segments: 'adefg', category: 'letter', description: 'Také adefgk' },
  { char: 'F', segments: 'aefg', category: 'letter', description: 'Také aefgk' },
  { char: 'G', segments: 'acdefk', category: 'letter' },
  { char: 'H', segments: 'bcefgk', category: 'letter' },
  { char: 'I', segments: 'adim', category: 'letter', description: 'Také im' },
  { char: 'J', segments: 'bcde', category: 'letter' },
  { char: 'K', segments: 'efgjl', category: 'letter' },
  { char: 'L', segments: 'def', category: 'letter' },
  { char: 'M', segments: 'bcefhj', category: 'letter' },
  { char: 'N', segments: 'bcefhl', category: 'letter' },
  { char: 'O', segments: 'abcdef', category: 'letter', description: 'Shodné s 0 bez škrtnutí' },
  { char: 'P', segments: 'abefgk', category: 'letter' },
  { char: 'Q', segments: 'abcdefl', category: 'letter' },
  { char: 'R', segments: 'abefgkl', category: 'letter' },
  { char: 'S', segments: 'acdhk', category: 'letter', description: 'Také acdfgk (jako 5)' },
  { char: 'T', segments: 'aim', category: 'letter' },
  { char: 'U', segments: 'bcdef', category: 'letter' },
  { char: 'V', segments: 'efjn', category: 'letter' },
  { char: 'W', segments: 'bcefln', category: 'letter' },
  { char: 'X', segments: 'hjln', category: 'letter' },
  { char: 'Y', segments: 'hjm', category: 'letter' },
  { char: 'Z', segments: 'adjn', category: 'letter' }
];

export const FOURTEEN_SEG_DIGITS: readonly DisplayGlyphEntry[] = [
  { char: '0', segments: 'abcdefjn', category: 'digit', description: 'Přeškrtnutá 0 (bez škrtu abcdef)' },
  { char: '1', segments: 'bcj', category: 'digit', description: 'Také bc nebo im' },
  { char: '2', segments: 'abdegk', category: 'digit' },
  { char: '3', segments: 'abcdgk', category: 'digit' },
  { char: '4', segments: 'bcfgk', category: 'digit' },
  { char: '5', segments: 'acdfgk', category: 'digit', description: 'Shodné s klasickým S' },
  { char: '6', segments: 'acdefgk', category: 'digit' },
  { char: '7', segments: 'abc', category: 'digit', description: 'Také ajn nebo abcf' },
  { char: '8', segments: 'abcdefgk', category: 'digit' },
  { char: '9', segments: 'abcdfgk', category: 'digit' }
];

export const FOURTEEN_SEG_SYMBOLS: readonly DisplayGlyphEntry[] = [
  { char: '+', segments: 'gikm', category: 'symbol' },
  { char: '-', segments: 'gk', category: 'symbol' },
  { char: '*', segments: 'ghjklmn', category: 'symbol' },
  { char: '/', segments: 'jn', category: 'symbol' },
  { char: '\\', segments: 'hl', category: 'symbol' }
];

export const SIXTEEN_SEG_LETTERS: readonly DisplayGlyphEntry[] = [
  { char: 'A', segments: 'abcdghim', category: 'letter' },
  { char: 'B', segments: 'abcdefkmo', category: 'letter' },
  { char: 'C', segments: 'abefgh', category: 'letter' },
  { char: 'D', segments: 'abcdefko', category: 'letter' },
  { char: 'E', segments: 'abefghi', category: 'letter', description: 'Také abefghim' },
  { char: 'F', segments: 'abghi', category: 'letter', description: 'Také abghim' },
  { char: 'G', segments: 'abdefghm', category: 'letter' },
  { char: 'H', segments: 'cdghim', category: 'letter' },
  { char: 'I', segments: 'abefko', category: 'letter', description: 'Také ko' },
  { char: 'J', segments: 'cdef', category: 'letter', description: 'Také cdefg' },
  { char: 'K', segments: 'ghiln', category: 'letter' },
  { char: 'L', segments: 'efgh', category: 'letter' },
  { char: 'M', segments: 'cdghjl', category: 'letter' },
  { char: 'N', segments: 'cdghjn', category: 'letter' },
  { char: 'O', segments: 'abcdefgh', category: 'letter', description: 'Shodné s 0 bez škrtnutí' },
  { char: 'P', segments: 'abcghim', category: 'letter' },
  { char: 'Q', segments: 'abcdefghn', category: 'letter' },
  { char: 'R', segments: 'abcghimn', category: 'letter' },
  { char: 'S', segments: 'abefhin', category: 'letter', description: 'Také abdefhim (jako 5)' },
  { char: 'T', segments: 'abko', category: 'letter' },
  { char: 'U', segments: 'cdefgh', category: 'letter' },
  { char: 'V', segments: 'ghlp', category: 'letter' },
  { char: 'W', segments: 'cdghnp', category: 'letter' },
  { char: 'X', segments: 'jlnp', category: 'letter' },
  { char: 'Y', segments: 'jlo', category: 'letter' },
  { char: 'Z', segments: 'abeflp', category: 'letter' }
];

export const SIXTEEN_SEG_DIGITS: readonly DisplayGlyphEntry[] = [
  { char: '0', segments: 'abcdefghlp', category: 'digit', description: 'Přeškrtnutá 0 (bez škrtu abcdefgh)' },
  { char: '1', segments: 'cdl', category: 'digit', description: 'Také cd nebo ko' },
  { char: '2', segments: 'abcefgim', category: 'digit' },
  { char: '3', segments: 'abcdefm', category: 'digit', description: 'Také abcdefim' },
  { char: '4', segments: 'cdhim', category: 'digit' },
  { char: '5', segments: 'abdefhim', category: 'digit', description: 'Shodné s klasickým S' },
  { char: '6', segments: 'abdefghim', category: 'digit' },
  { char: '7', segments: 'abcd', category: 'digit', description: 'Také ablp' },
  { char: '8', segments: 'abcdefghim', category: 'digit' },
  { char: '9', segments: 'abcdefhim', category: 'digit' }
];

export const SIXTEEN_SEG_SYMBOLS: readonly DisplayGlyphEntry[] = [
  { char: '+', segments: 'ikmo', category: 'symbol' },
  { char: '-', segments: 'im', category: 'symbol' },
  { char: '*', segments: 'ijklmnop', category: 'symbol' },
  { char: '/', segments: 'lp', category: 'symbol' },
  { char: '\\', segments: 'jn', category: 'symbol' }
];
