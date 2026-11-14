import {
  DISPLAY_CONFIGS,
  SEVEN_SEG_DIGIT_TO_LETTER,
  SEVEN_SEG_LETTER_TO_DIGIT,
  type DisplayType
} from './displaysData';

export interface DisplayDecodeOptions {
  preferNumbers?: boolean;
  letterIndexing?: boolean;
}

export interface DecodedCharInfo {
  char: string;
  altHint?: string;
  isValid: boolean;
}

export interface DecodedDisplayField {
  field: string;
  normalizedField: string;
  char: string;
  altHint?: string;
  kind: 'char' | 'space' | 'invalid';
}

interface DisplayLookup {
  letters: Record<string, string>;
  digits: Record<string, string>;
  symbols: Record<string, string>;
}

/** Sort segment IDs in display order (1..7 or a..p). */
export function sortSegments(segments: Iterable<string>): string[] {
  return [...segments].sort();
}

export function segmentsToField(segments: Iterable<string>): string {
  return sortSegments(segments).join('');
}

function normKey(key: string): string {
  return [...key].sort().join('');
}

function normalizeMap(entries: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, val] of Object.entries(entries)) {
    out[normKey(key)] = val;
  }
  return out;
}

/** Converts 7-segment IDs between numeric (`1–7`) and letter (`a–g`) indexing. */
export function formatSevenSegIds(
  ids: readonly string[],
  letterIndexing: boolean
): string[] {
  return sortSegments(
    ids.map((id) =>
      letterIndexing
        ? (SEVEN_SEG_DIGIT_TO_LETTER[id] ?? id)
        : (SEVEN_SEG_LETTER_TO_DIGIT[id] ?? id)
    )
  );
}

/** Converts a single 7-segment notation field between `1–7` and `a–g`; invalid fields stay untouched. */
export function convertSevenSegField(field: string, letterIndexing: boolean): string {
  const parsed = parseDisplayField('7seg', field);
  if (parsed === null || parsed.length === 0) return field;
  return formatSevenSegIds(parsed, letterIndexing).join('');
}

const DISPLAY_LOOKUPS: Record<DisplayType, DisplayLookup> = {
  '7seg': {
    letters: normalizeMap({
      '123567': 'A',
      '34567': 'B',
      '457': 'C',
      '23457': 'D',
      '14567': 'E',
      '1567': 'F',
      '13456': 'G',
      '3567': 'H',
      '56': 'I',
      '2345': 'J',
      '13567': 'K',
      '456': 'L',
      '12356': 'M',
      '357': 'N',
      '3457': 'O',
      '12567': 'P',
      '12367': 'Q',
      '57': 'R',
      '13467': 'S',
      '4567': 'T',
      '345': 'U',
      '23456': 'V',
      '234567': 'W',
      '23567': 'X',
      '23467': 'Y',
      '12457': 'Z'
    }),
    digits: normalizeMap({
      '123456': '0',
      '23': '1',
      '12457': '2',
      '12347': '3',
      '2367': '4',
      '13467': '5',
      '134567': '6',
      '123': '7',
      '1234567': '8',
      '123467': '9'
    }),
    symbols: normalizeMap({
      '7': '-',
      '4': '_',
      '47': '='
    })
  },
  '14seg': {
    letters: normalizeMap({
      abcefgk: 'A',
      abcdikm: 'B',
      abcdgikm: 'B',
      adef: 'C',
      abcdim: 'D',
      adefg: 'E',
      adefgk: 'E',
      aefg: 'F',
      aefgk: 'F',
      acdefk: 'G',
      acdefgk: 'G',
      bcefgk: 'H',
      adim: 'I',
      im: 'I',
      bcde: 'J',
      bcd: 'J',
      efgjl: 'K',
      def: 'L',
      bcefhj: 'M',
      bcefhl: 'N',
      abcdef: 'O',
      abefgk: 'P',
      abcdefl: 'Q',
      abefgkl: 'R',
      acdhk: 'S',
      acdfgk: 'S',
      aim: 'T',
      bcdef: 'U',
      efjn: 'V',
      bcefln: 'W',
      hjln: 'X',
      hjm: 'Y',
      adjn: 'Z'
    }),
    digits: normalizeMap({
      abcdef: '0',
      abcdefjn: '0',
      bc: '1',
      bcj: '1',
      im: '1',
      abdegk: '2',
      abcdgk: '3',
      abcdk: '3',
      bcfgk: '4',
      acdfgk: '5',
      acdefgk: '6',
      cdefgk: '6',
      abc: '7',
      abcf: '7',
      ajn: '7',
      abcdefgk: '8',
      abcdfgk: '9',
      abcfgk: '9'
    }),
    symbols: normalizeMap({
      gikm: '+',
      gk: '-',
      ghjklmn: '*',
      ghijklmn: '*',
      jn: '/',
      hl: '\\',
      d: '_',
      dgk: '='
    })
  },
  '16seg': {
    letters: normalizeMap({
      abcdghim: 'A',
      abcdefkmo: 'B',
      abcdefikmo: 'B',
      abefgh: 'C',
      abcdefko: 'D',
      abefghi: 'E',
      abefghim: 'E',
      abghi: 'F',
      abghim: 'F',
      abdefghm: 'G',
      abdefghim: 'G',
      cdghim: 'H',
      abefko: 'I',
      ko: 'I',
      cdef: 'J',
      cdefg: 'J',
      ghiln: 'K',
      efgh: 'L',
      cdghjl: 'M',
      cdghjn: 'N',
      abcdefgh: 'O',
      abcghim: 'P',
      abcdefghn: 'Q',
      abcghimn: 'R',
      abefhin: 'S',
      abdefhim: 'S',
      abko: 'T',
      cdefgh: 'U',
      ghlp: 'V',
      cdghnp: 'W',
      jlnp: 'X',
      jlo: 'Y',
      abeflp: 'Z'
    }),
    digits: normalizeMap({
      abcdefgh: '0',
      abcdefghlp: '0',
      cd: '1',
      cdl: '1',
      ko: '1',
      abcefgim: '2',
      abcdefm: '3',
      abcdefim: '3',
      cdhim: '4',
      abdefhim: '5',
      abdefghim: '6',
      defghim: '6',
      abcd: '7',
      abcdh: '7',
      ablp: '7',
      abcdefghim: '8',
      abcdefhim: '9',
      abcdhim: '9'
    }),
    symbols: normalizeMap({
      ikmo: '+',
      im: '-',
      ijklmnop: '*',
      lp: '/',
      jn: '\\',
      ef: '_',
      efim: '='
    })
  }
};

/**
 * Parses a notation field into canonical segment IDs (`1–7` for 7-seg, `a–n` for 14-seg, `a–p` for 16-seg).
 * For 7-seg, accepts both `1–7` and `a–g` in Podklad. Returns `null` on unknown, mixed, or duplicate IDs.
 */
export function parseDisplayField(displayType: DisplayType, field: string): string[] | null {
  if (field === '') return [];
  const trimmed = field.trim().toLowerCase();
  if (trimmed === '') return [];

  const chars = [...trimmed];
  if (displayType === '7seg') {
    const isDigits = chars.every((ch) => ch >= '1' && ch <= '7');
    const isLetters = chars.every((ch) => ch >= 'a' && ch <= 'g');
    if (!isDigits && !isLetters) return null;

    const canonical = isLetters ? chars.map((ch) => SEVEN_SEG_LETTER_TO_DIGIT[ch]) : chars;
    if (new Set(canonical).size !== canonical.length) return null;
    return sortSegments(canonical);
  }

  const allowed = new Set(DISPLAY_CONFIGS[displayType].segmentIds);
  const seen = new Set<string>();
  for (const ch of chars) {
    if (!allowed.has(ch) || seen.has(ch)) return null;
    seen.add(ch);
  }
  return sortSegments(seen);
}

/** Decodes a canonical segment key; letters always win by default unless `preferNumbers` is true. */
export function decodeKey(
  displayType: DisplayType,
  key: string,
  preferNumbers = false
): DecodedCharInfo {
  if (!key) return { char: '␣', isValid: true };

  const lookup = DISPLAY_LOOKUPS[displayType];
  const letter = lookup.letters[key];
  const digit = lookup.digits[key];
  const symbol = lookup.symbols[key];

  if (preferNumbers) {
    if (digit !== undefined) {
      return {
        char: digit,
        altHint: letter !== undefined && letter !== digit ? `také ${letter}` : undefined,
        isValid: true
      };
    }
    if (letter !== undefined) return { char: letter, isValid: true };
  } else {
    if (letter !== undefined) {
      return {
        char: letter,
        altHint: digit !== undefined && digit !== letter ? `také ${digit}` : undefined,
        isValid: true
      };
    }
    if (digit !== undefined) return { char: digit, isValid: true };
  }

  if (symbol !== undefined) return { char: symbol, isValid: true };

  return { char: '?', isValid: false };
}

export function decodeDisplayField(
  displayType: DisplayType,
  field: string,
  options: DisplayDecodeOptions = {}
): DecodedDisplayField {
  if (field === '') {
    return { field, normalizedField: '', char: ' ', kind: 'space' };
  }

  const parsed = parseDisplayField(displayType, field);
  if (parsed === null) {
    return { field, normalizedField: field, char: '?', kind: 'invalid' };
  }

  const key = segmentsToField(parsed);
  const decoded = decodeKey(displayType, key, options.preferNumbers ?? false);
  const normalizedField =
    displayType === '7seg' && options.letterIndexing
      ? formatSevenSegIds(parsed, true).join('')
      : key;

  return {
    field,
    normalizedField,
    char: decoded.char,
    altHint: decoded.altHint,
    kind: decoded.isValid ? 'char' : 'invalid'
  };
}

export function decodeDisplayFields(
  displayType: DisplayType,
  fields: readonly string[],
  options: DisplayDecodeOptions = {}
): DecodedDisplayField[] {
  return fields.map((field) => decodeDisplayField(displayType, field, options));
}

export function displayFieldsToText(decoded: readonly DecodedDisplayField[]): string {
  return decoded.map((item) => item.char).join('');
}
