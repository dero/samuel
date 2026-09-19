import { ROMAN_VALUES, type FlowMode } from './numbersData';

export interface DecodeOptions {
  base?: number;
  isRoman?: boolean;
  strictRoman?: boolean;
  zeroBased: boolean;
  asciiMode: boolean;
  alphabetLetters: string[];
}

export interface DecodeResult {
  rawBuffer: string;
  numericValue: number | null;
  character: string | null;
  status: 'empty' | 'valid' | 'out_of_range' | 'invalid_digit';
  errorText?: string;
}

const CANONICAL_ROMAN_REGEX = /^M{0,3}(CM|CD|D?C{0,3})(XC|XL|L?X{0,3})(IX|IV|V?I{0,3})$/;

const ROMAN_SYMBOLS: [number, string][] = [
  [1000, 'M'],
  [900, 'CM'],
  [500, 'D'],
  [400, 'CD'],
  [100, 'C'],
  [90, 'XC'],
  [50, 'L'],
  [40, 'XL'],
  [10, 'X'],
  [9, 'IX'],
  [5, 'V'],
  [4, 'IV'],
  [1, 'I']
];

/**
 * Checks if a string is a valid prefix of a canonical Roman numeral (1–3999).
 * Used to dynamically enable/disable keypad keys during canonical entry.
 */
export function isCanonicalRomanPrefix(str: string): boolean {
  const trimmed = str.trim().toUpperCase();
  if (trimmed === '') return true;
  return CANONICAL_ROMAN_REGEX.test(trimmed);
}

/**
 * Parses a Roman numeral string into a numeric value.
 * Supports both canonical Roman numerals and loose/additive/shortcut notations (unless strictCanonical is true).
 */
export function parseRoman(
  buffer: string,
  strictCanonical = false
): { val: number | null; error?: string } {
  const trimmed = buffer.trim().toUpperCase();
  if (!trimmed) {
    return { val: null };
  }

  // Validate characters
  if (/[^IVXLCDM]/i.test(trimmed)) {
    return { val: null, error: 'Neplatný římský znak' };
  }

  // If strict canonical validation is requested
  if (strictCanonical) {
    if (!CANONICAL_ROMAN_REGEX.test(trimmed)) {
      return { val: null, error: 'Nekanonický zápis' };
    }
  }

  // Tolerant Roman numeral evaluation (additive + subtractive)
  let total = 0;
  for (let i = 0; i < trimmed.length; i++) {
    const cur = ROMAN_VALUES[trimmed[i]] ?? 0;
    const next = i + 1 < trimmed.length ? (ROMAN_VALUES[trimmed[i + 1]] ?? 0) : 0;
    if (next > cur) {
      total -= cur;
    } else {
      total += cur;
    }
  }

  if (total <= 0) {
    return { val: null, error: 'Neplatná hodnota' };
  }

  return { val: total };
}

/**
 * Formats a positive integer into standard canonical Roman numerals (1–3999).
 */
export function formatRoman(num: number): string | null {
  if (num < 1 || num > 3999 || !Number.isInteger(num)) {
    return null;
  }

  let result = '';
  let remaining = num;
  for (const [val, symbol] of ROMAN_SYMBOLS) {
    while (remaining >= val) {
      result += symbol;
      remaining -= val;
    }
  }
  return result;
}

/**
 * Decodes the current input buffer into a numeric value and resulting character.
 */
export function decodeBuffer(buffer: string, options: DecodeOptions): DecodeResult {
  const trimmed = buffer.trim();
  if (!trimmed) {
    return {
      rawBuffer: '',
      numericValue: null,
      character: null,
      status: 'empty'
    };
  }

  let val: number;

  if (options.isRoman) {
    const parsed = parseRoman(trimmed, options.strictRoman);
    if (parsed.val === null) {
      return {
        rawBuffer: trimmed,
        numericValue: null,
        character: null,
        status: 'invalid_digit',
        errorText: parsed.error || 'Neplatný římský zápis'
      };
    }
    val = parsed.val;
  } else {
    const base = options.base ?? 10;
    const parsedVal = parseInt(trimmed, base);
    if (isNaN(parsedVal)) {
      return {
        rawBuffer: trimmed,
        numericValue: null,
        character: null,
        status: 'invalid_digit',
        errorText: 'Neplatná číslice'
      };
    }
    val = parsedVal;
  }

  if (options.asciiMode) {
    if (val < 0 || val > 255) {
      return {
        rawBuffer: trimmed,
        numericValue: val,
        character: null,
        status: 'out_of_range',
        errorText: 'Mimo ASCII (0–255)'
      };
    }

    // Handle non-printable or control characters
    let char = String.fromCharCode(val);
    if (val < 32 || (val >= 127 && val < 160)) {
      if (val === 10) char = '\n';
      else if (val === 9) char = '\t';
      else if (val === 13) char = '';
      else char = `\\x${val.toString(16).padStart(2, '0').toUpperCase()}`;
    }

    return {
      rawBuffer: trimmed,
      numericValue: val,
      character: char,
      status: 'valid'
    };
  }

  // Alphabet mode
  const letters = options.alphabetLetters;
  const targetIndex = options.zeroBased ? val : val - 1;

  if (targetIndex >= 0 && targetIndex < letters.length) {
    return {
      rawBuffer: trimmed,
      numericValue: val,
      character: letters[targetIndex],
      status: 'valid'
    };
  } else {
    const min = options.zeroBased ? 0 : 1;
    const max = options.zeroBased ? letters.length - 1 : letters.length;
    return {
      rawBuffer: trimmed,
      numericValue: val,
      character: null,
      status: 'out_of_range',
      errorText: `Mimo rozsah (${min}–${max})`
    };
  }
}

/**
 * Format a number to a string in a specific base, optionally padded.
 */
export function formatInBase(num: number, base: number, padLength = 0): string {
  const str = num.toString(base).toUpperCase();
  return padLength > 0 ? str.padStart(padLength, '0') : str;
}

/**
 * Calculate the exact number of digits in the given base required to represent
 * any character index in the alphabet or ASCII byte.
 */
export function calculateRequiredLength(
  base: number,
  maxLetterCount: number,
  zeroBased: boolean,
  asciiMode: boolean
): number {
  const maxVal = asciiMode ? 255 : (zeroBased ? Math.max(1, maxLetterCount - 1) : maxLetterCount);
  return Math.max(1, maxVal.toString(base).length);
}

/**
 * Converts a letter from the alphabet or ASCII char to a string formatted in targetBase.
 */
export function convertCharToNumber(
  char: string,
  targetBase: number,
  alphabetLetters: string[],
  zeroBased: boolean,
  asciiMode: boolean
): string | null {
  let val: number;
  if (asciiMode) {
    val = char.charCodeAt(0);
  } else {
    const idx = alphabetLetters.indexOf(char);
    if (idx === -1) return null;
    val = zeroBased ? idx : idx + 1;
  }

  const raw = val.toString(targetBase).toUpperCase();
  // Pad binary if desirable for fixed-length block representation
  if (targetBase === 2) {
    const pad = calculateRequiredLength(2, alphabetLetters.length, zeroBased, asciiMode);
    return raw.padStart(pad, '0');
  }
  if (targetBase === 16 && (asciiMode || alphabetLetters.length > 15)) {
    const pad = calculateRequiredLength(16, alphabetLetters.length, zeroBased, asciiMode);
    return raw.padStart(pad, '0');
  }
  return raw;
}

/**
 * Converts a character to Roman numeral representation.
 */
export function convertCharToRoman(
  char: string,
  alphabetLetters: string[],
  zeroBased: boolean,
  asciiMode: boolean
): string | null {
  let val: number;
  if (asciiMode) {
    val = char.charCodeAt(0);
  } else {
    const idx = alphabetLetters.indexOf(char);
    if (idx === -1) return null;
    val = zeroBased ? idx : idx + 1;
  }
  return formatRoman(val);
}

/**
 * Converts a numeric value in fromBase to targetBase string.
 */
export function convertNumberToNumber(
  buffer: string,
  fromBase: number,
  toBase: number
): { val: number | null; result: string | null; error?: string } {
  const trimmed = buffer.trim();
  if (!trimmed) return { val: null, result: null };
  const val = parseInt(trimmed, fromBase);
  if (isNaN(val)) return { val: null, result: null, error: 'Neplatná číslice' };
  return { val, result: val.toString(toBase).toUpperCase() };
}

/**
 * Converts a numeric value in fromBase to Roman numerals.
 */
export function convertNumberToRoman(
  buffer: string,
  fromBase: number
): { val: number | null; result: string | null; error?: string } {
  const trimmed = buffer.trim();
  if (!trimmed) return { val: null, result: null };
  const val = parseInt(trimmed, fromBase);
  if (isNaN(val)) return { val: null, result: null, error: 'Neplatná číslice' };
  const roman = formatRoman(val);
  if (!roman) return { val, result: null, error: 'Mimo rozsah (1–3999)' };
  return { val, result: roman };
}

/**
 * Converts a Roman numeral string to targetBase.
 */
export function convertRomanToNumber(
  buffer: string,
  toBase: number,
  strictRoman = false
): { val: number | null; result: string | null; error?: string } {
  const parsed = parseRoman(buffer, strictRoman);
  if (parsed.val === null) return { val: null, result: null, error: parsed.error };
  return { val: parsed.val, result: parsed.val.toString(toBase).toUpperCase() };
}

/**
 * Converts / normalizes a Roman numeral string to canonical Roman numerals.
 */
export function convertRomanToRoman(
  buffer: string,
  strictRoman = false
): { val: number | null; result: string | null; error?: string } {
  const parsed = parseRoman(buffer, strictRoman);
  if (parsed.val === null) return { val: null, result: null, error: parsed.error };
  const roman = formatRoman(parsed.val);
  if (!roman) return { val: parsed.val, result: null, error: 'Mimo rozsah (1–3999)' };
  return { val: parsed.val, result: roman };
}


