export interface BrailleEntry {
  char: string;
  mask: number; // 0 to 63
  dots: number[]; // 1-indexed dots [1..6]
  unicode: string; // Unicode Braille Patterns U+2800..U+283F
  category: 'letter' | 'diacritic' | 'digit' | 'prefix' | 'punctuation';
  description?: string;
}

export function dotsToMask(dots: number[]): number {
  return dots.reduce((acc, d) => (d >= 1 && d <= 6 ? acc | (1 << (d - 1)) : acc), 0);
}

export function maskToDots(mask: number): number[] {
  const dots: number[] = [];
  for (let i = 1; i <= 6; i++) {
    if ((mask & (1 << (i - 1))) !== 0) {
      dots.push(i);
    }
  }
  return dots;
}

export function maskToUnicode(mask: number): string {
  return String.fromCharCode(0x2800 + (mask & 0x3f));
}

export function unicodeToMask(char: string): number {
  if (!char) return 0;
  const code = char.charCodeAt(0);
  if (code >= 0x2800 && code <= 0x283f) {
    return code - 0x2800;
  }
  return 0;
}

function entry(
  char: string,
  dots: number[],
  category: BrailleEntry['category'],
  description?: string
): BrailleEntry {
  const mask = dotsToMask(dots);
  return {
    char,
    mask,
    dots,
    unicode: maskToUnicode(mask),
    category,
    description
  };
}

// 1. Basic Latin Alphabet A-Z
export const BRAILLE_LETTERS: BrailleEntry[] = [
  entry('A', [1], 'letter', 'A (1)'),
  entry('B', [1, 2], 'letter', 'B (2)'),
  entry('C', [1, 4], 'letter', 'C (3)'),
  entry('D', [1, 4, 5], 'letter', 'D (4)'),
  entry('E', [1, 5], 'letter', 'E (5)'),
  entry('F', [1, 2, 4], 'letter', 'F (6)'),
  entry('G', [1, 2, 4, 5], 'letter', 'G (7)'),
  entry('H', [1, 2, 5], 'letter', 'H (8)'),
  entry('I', [2, 4], 'letter', 'I (9)'),
  entry('J', [2, 4, 5], 'letter', 'J (0)'),
  entry('K', [1, 3], 'letter'),
  entry('L', [1, 2, 3], 'letter'),
  entry('M', [1, 3, 4], 'letter'),
  entry('N', [1, 3, 4, 5], 'letter'),
  entry('O', [1, 3, 5], 'letter'),
  entry('P', [1, 2, 3, 4], 'letter'),
  entry('Q', [1, 2, 3, 4, 5], 'letter'),
  entry('R', [1, 2, 3, 5], 'letter'),
  entry('S', [2, 3, 4], 'letter'),
  entry('T', [2, 3, 4, 5], 'letter'),
  entry('U', [1, 3, 6], 'letter'),
  entry('V', [1, 2, 3, 6], 'letter'),
  entry('W', [1, 2, 3, 5, 6], 'letter', 'České W (mezinárodně 2,4,5,6)'),
  entry('X', [1, 3, 4, 6], 'letter'),
  entry('Y', [1, 3, 4, 5, 6], 'letter'),
  entry('Z', [1, 3, 5, 6], 'letter')
];

// 2. Czech Accented Letters (Diacritics)
export const BRAILLE_CZECH_DIACRITICS: BrailleEntry[] = [
  entry('Á', [1, 6], 'diacritic'),
  entry('Č', [1, 4, 6], 'diacritic'),
  entry('Ď', [1, 4, 5, 6], 'diacritic'),
  entry('É', [3, 4, 5], 'diacritic'),
  entry('Ě', [1, 2, 6], 'diacritic'),
  entry('Í', [3, 4], 'diacritic'),
  entry('Ň', [1, 2, 4, 6], 'diacritic'),
  entry('Ó', [2, 4, 6], 'diacritic'),
  entry('Ř', [2, 4, 5, 6], 'diacritic', 'České Ř (v mezinárodním W)'),
  entry('Š', [1, 5, 6], 'diacritic'),
  entry('Ť', [1, 2, 5, 6], 'diacritic'),
  entry('Ú', [3, 4, 6], 'diacritic'),
  entry('Ů', [2, 3, 4, 5, 6], 'diacritic'),
  entry('Ý', [1, 2, 3, 4, 6], 'diacritic'),
  entry('Ž', [2, 3, 4, 6], 'diacritic')
];

// 3. Digits 1-9, 0 (coincide with A-J dots)
export const BRAILLE_DIGITS: BrailleEntry[] = [
  entry('1', [1], 'digit', 'Číslice 1 (jako A)'),
  entry('2', [1, 2], 'digit', 'Číslice 2 (jako B)'),
  entry('3', [1, 4], 'digit', 'Číslice 3 (jako C)'),
  entry('4', [1, 4, 5], 'digit', 'Číslice 4 (jako D)'),
  entry('5', [1, 5], 'digit', 'Číslice 5 (jako E)'),
  entry('6', [1, 2, 4], 'digit', 'Číslice 6 (jako F)'),
  entry('7', [1, 2, 4, 5], 'digit', 'Číslice 7 (jako G)'),
  entry('8', [1, 2, 5], 'digit', 'Číslice 8 (jako H)'),
  entry('9', [2, 4], 'digit', 'Číslice 9 (jako I)'),
  entry('0', [2, 4, 5], 'digit', 'Číslice 0 (jako J)')
];

// 4. Prefixes
export const BRAILLE_PREFIXES: BrailleEntry[] = [
  entry('⠼', [3, 4, 5, 6], 'prefix', 'Prefix čísla (následují číslice)'),
  entry('⠠', [6], 'prefix', 'Prefix velkého písmene'),
  entry('⠐', [5], 'prefix', 'Prefix malého písmene'),
  entry('⠰', [5, 6], 'prefix', 'Prefix skupiny velkých písmen')
];

export const BRAILLE_NUMBER_PREFIX_MASK = dotsToMask([3, 4, 5, 6]); // 60

// 5. Punctuation & Common Symbols
export const BRAILLE_PUNCTUATION: BrailleEntry[] = [
  entry('.', [3], 'punctuation', 'Tečka'),
  entry(',', [2], 'punctuation', 'Čárka'),
  entry('!', [2, 3, 5], 'punctuation', 'Vykřičník'),
  entry('?', [2, 6], 'punctuation', 'Otazník'),
  entry(':', [2, 5], 'punctuation', 'Dvojtečka'),
  entry(';', [2, 3], 'punctuation', 'Středník'),
  entry('(', [2, 3, 6], 'punctuation', 'Závorka otevírací'),
  entry(')', [3, 5, 6], 'punctuation', 'Závorka uzavírací'),
  entry('-', [3, 6], 'punctuation', 'Pomlčka / Spojovník'),
  entry('+', [2, 5, 6], 'punctuation', 'Plus'),
  entry('=', [2, 3, 5, 6], 'punctuation', 'Rovná se'),
  entry('/', [1, 2, 4, 5, 6], 'punctuation', 'Lomítko'),
  entry("'", [4], 'punctuation', 'Apostrof'),
  entry('*', [3, 5], 'punctuation', 'Hvězdička'),
  entry('|', [4, 5, 6], 'punctuation', 'Svislá čára')
];

// Full Reference Catalog for fast search & reference modal
export const ALL_BRAILLE_ENTRIES: BrailleEntry[] = [
  ...BRAILLE_LETTERS,
  ...BRAILLE_CZECH_DIACRITICS,
  ...BRAILLE_DIGITS,
  ...BRAILLE_PREFIXES,
  ...BRAILLE_PUNCTUATION
];

// Fast lookup dictionaries by mask (0..63)
export const MASK_TO_LETTER: Record<number, string> = {};
export const MASK_TO_CZECH: Record<number, string> = {};
export const MASK_TO_DIGIT: Record<number, string> = {};
export const MASK_TO_PUNCTUATION: Record<number, string> = {};

for (const e of BRAILLE_LETTERS) {
  MASK_TO_LETTER[e.mask] = e.char;
}

for (const e of BRAILLE_CZECH_DIACRITICS) {
  MASK_TO_CZECH[e.mask] = e.char;
}

for (const e of BRAILLE_DIGITS) {
  MASK_TO_DIGIT[e.mask] = e.char;
}

for (const e of BRAILLE_PUNCTUATION) {
  if (!MASK_TO_PUNCTUATION[e.mask]) {
    MASK_TO_PUNCTUATION[e.mask] = e.char;
  }
}
