import { BASE_CONFIGS, ROMAN_VALUES, type FlowMode } from './numbersData';
import { parseNotation, serializeNotation } from '../../utils/notation';
import type { InterlinearToken } from '../../components/ui/InterlinearText.svelte';

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
 * Strict positional parse: unlike `parseInt`, a digit outside the base invalidates the
 * whole field, so a typo in the Podklad text gets marked instead of being cut off.
 */
export function parseInBase(text: string, base: number): number | null {
  const digits = BASE_CONFIGS[base]?.digits;
  const upper = text.trim().toUpperCase();
  if (!digits || !upper || [...upper].some((digit) => !digits.includes(digit))) return null;
  return parseInt(upper, base);
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
    const parsedVal = parseInBase(trimmed, options.base ?? 10);
    if (parsedVal === null) {
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

export interface TokenOptions {
  zeroBased: boolean;
  asciiMode: boolean;
  letters: string[];
}

function invalidToken(
  tok: string,
  errorText: string,
  isPending: boolean,
  secondarySub?: number
): InterlinearToken {
  return { primary: '?', secondary: tok, secondarySub, isError: true, errorText, isPending };
}

/** One entered field as an interlinear cell: the converted value over the source text. */
export function decodeToken(
  tok: string,
  source: FlowMode,
  target: FlowMode,
  options: TokenOptions,
  isPending = false
): InterlinearToken {
  if (tok === ' ') {
    return { primary: ' ', secondary: '', isSpace: true, isPending };
  }

  const { zeroBased, asciiMode, letters } = options;
  const toBase = typeof target === 'number' ? target : null;
  const toRoman = target === 'roman' || target === 'roman_loose';

  if (source === 'char') {
    // Keys only give exact letters, the Podklad text may hold anything
    const char = asciiMode || letters.includes(tok) ? tok : tok.toUpperCase();
    const isValid = asciiMode ? [...tok].length === 1 : letters.includes(char);
    if (!isValid) return invalidToken(tok, 'Znak není v abecedě', isPending);

    if (toBase !== null) {
      const numStr = convertCharToNumber(char, toBase, letters, zeroBased, asciiMode);
      if (numStr === null) return invalidToken(tok, 'Znak není v abecedě', isPending);
      return { primary: numStr, primarySub: toBase, secondary: tok, isPending };
    }
    if (toRoman) {
      const roman = convertCharToRoman(char, letters, zeroBased, asciiMode);
      if (roman === null) return invalidToken(tok, 'Mimo rozsah římských čísel (1–3999)', isPending);
      return { primary: roman, secondary: tok, isPending };
    }
    return { primary: char, secondary: '', isPending };
  }

  const sourceBase = typeof source === 'number' ? source : undefined;
  const isStrictRoman = source === 'roman';

  let val: number;
  if (sourceBase !== undefined) {
    const parsed = parseInBase(tok, sourceBase);
    if (parsed === null) {
      return invalidToken(tok, `Číslice „${tok}“ neplatí v soustavě ${sourceBase}`, isPending, sourceBase);
    }
    val = parsed;
  } else {
    const parsed = parseRoman(tok, isStrictRoman);
    if (parsed.val === null) {
      return invalidToken(tok, parsed.error || 'Neplatný římský zápis', isPending);
    }
    val = parsed.val;
  }

  if (toBase !== null) {
    return {
      primary: val.toString(toBase).toUpperCase(),
      primarySub: toBase,
      secondary: tok,
      secondarySub: sourceBase,
      isPending
    };
  }

  if (toRoman) {
    const roman = formatRoman(val);
    if (roman) return { primary: roman, secondary: tok, secondarySub: sourceBase, isPending };
    if (sourceBase === undefined) return { primary: tok, secondary: tok, isPending };
    return invalidToken(tok, 'Mimo rozsah římských čísel (1–3999)', isPending, sourceBase);
  }

  const res = decodeBuffer(tok, {
    base: sourceBase,
    isRoman: sourceBase === undefined,
    strictRoman: isStrictRoman,
    zeroBased,
    asciiMode,
    alphabetLetters: letters
  });
  if (res.status === 'valid' && res.character) {
    return { primary: res.character, secondary: tok, secondarySub: sourceBase, isPending };
  }
  return invalidToken(tok, res.errorText || 'Mimo rozsah abecedy', isPending, sourceBase);
}

/**
 * Podklad text of the keypad state. Spaces are `' '` in `raw_tokens` and empty fields in
 * the notation; the unfinished buffer is written as the last field.
 */
export function tokensToNotation(tokens: string[], buffer: string): string {
  const fields = tokens.map((token) => (token === ' ' ? '' : token));
  return serializeNotation(buffer ? [...fields, buffer] : fields);
}

/**
 * Inverse of `tokensToNotation`. Every field of an edited text counts as closed, except
 * that under auto-enter (`blockLength` > 0) a last field shorter than a block goes back to
 * the buffer, so the block being typed is not closed early. A trailing comma closes it.
 */
export function notationToTokens(text: string, blockLength = 0): { tokens: string[]; buffer: string } {
  const tokens = parseNotation(text).map((field) => (field === '' ? ' ' : field));
  const last = tokens.at(-1);
  const isLastOpen =
    !!last && last !== ' ' && last.length < blockLength && !/,\s*$/.test(text);
  return isLastOpen ? { tokens: tokens.slice(0, -1), buffer: last } : { tokens, buffer: '' };
}

/**
 * Fields rewritten in the target system when source and target swap; invalid fields stay
 * verbatim. Null when a field converts to a comma (ASCII 44), which cannot be a field.
 */
export function swapTokens(
  tokens: string[],
  source: FlowMode,
  target: FlowMode,
  options: TokenOptions
): string[] | null {
  const swapped: string[] = [];
  for (const tok of tokens) {
    const decoded = tok === ' ' ? null : decodeToken(tok, source, target, options);
    if (!decoded || decoded.isError) {
      swapped.push(tok);
    } else if (decoded.primary.includes(',')) {
      return null;
    } else {
      swapped.push(decoded.primary);
    }
  }
  return swapped;
}
