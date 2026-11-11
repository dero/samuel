import {
  MASK_TO_LETTER,
  MASK_TO_CZECH,
  MASK_TO_DIGIT,
  MASK_TO_PUNCTUATION,
  BRAILLE_NUMBER_PREFIX_MASK,
  dotsToMask,
  maskToUnicode
} from './brailleData';
import { removeDiacritics } from '../../utils/text';

export interface BrailleDecodeOptions {
  czechDiacritics?: boolean;
  directNumbers?: boolean;
}

export interface DecodedCharInfo {
  char: string;
  altHint?: string;
  isPrefix?: boolean;
  isValid: boolean;
}

export interface DecodedBrailleField {
  field: string;
  /** Decoded character; a space, `⠼` for the number prefix, `?` for an invalid field. */
  char: string;
  kind: 'char' | 'space' | 'prefix' | 'invalid';
}

/**
 * Decodes a single 6-dot bitmask (0..63) to a character.
 */
export function decodeSingleMask(
  mask: number,
  options: BrailleDecodeOptions = {}
): DecodedCharInfo {
  const czech = options.czechDiacritics ?? true;
  const directNums = options.directNumbers ?? false;

  if (mask === 0) {
    return { char: '␣', isValid: true };
  }

  // Number prefix (3,4,5,6)
  if (mask === BRAILLE_NUMBER_PREFIX_MASK) {
    return { char: '⠼', isPrefix: true, isValid: true, altHint: 'Prefix čísla' };
  }

  // Direct numbers mode
  if (directNums) {
    if (mask in MASK_TO_DIGIT) {
      const letter = MASK_TO_LETTER[mask] ?? '';
      return {
        char: MASK_TO_DIGIT[mask],
        altHint: letter ? `Písmeno ${letter}` : undefined,
        isValid: true
      };
    }
  }

  // 1. Check special collision for [2, 4, 5, 6] (mask 58: Czech Ř vs International W)
  if (mask === 58) {
    if (czech) {
      return { char: 'Ř', altHint: 'V mezinárodním: W', isValid: true };
    } else {
      return { char: 'W', altHint: 'V českém: Ř', isValid: true };
    }
  }

  // 2. Check Czech W: [1, 2, 3, 5, 6] (mask 55)
  if (mask === 55) {
    if (czech) {
      return { char: 'W', altHint: 'České W', isValid: true };
    }
  }

  // 3. Czech diacritics
  if (czech && mask in MASK_TO_CZECH) {
    return { char: MASK_TO_CZECH[mask], isValid: true };
  }

  // 4. Basic letters
  if (mask in MASK_TO_LETTER) {
    return { char: MASK_TO_LETTER[mask], isValid: true };
  }

  // 5. Punctuation
  if (mask in MASK_TO_PUNCTUATION) {
    return { char: MASK_TO_PUNCTUATION[mask], isValid: true };
  }

  return { char: '?', isValid: false };
}

/** Notation field of a cell: its dot numbers in ascending order. */
export function dotsToField(dots: number[]): string {
  return [...dots].sort((a, b) => a - b).join('');
}

/** Mask of a notation field: `''` is the empty cell, `null` anything but distinct dots 1–6. */
export function fieldToMask(field: string): number | null {
  if (field === '') return 0;
  if (!/^[1-6]+$/.test(field)) return null;
  const dots = [...field].map(Number);
  if (new Set(dots).size !== dots.length) return null;
  return dotsToMask(dots);
}

/**
 * Decodes notation fields in order. The number prefix (3456) reads A–J as digits
 * until the next space or a field that is not a digit.
 */
export function decodeBrailleFields(
  fields: string[],
  options: BrailleDecodeOptions = {}
): DecodedBrailleField[] {
  const czech = options.czechDiacritics ?? true;
  const directNums = options.directNumbers ?? false;
  let inNumberMode = directNums;

  return fields.map((field): DecodedBrailleField => {
    const mask = fieldToMask(field);
    if (mask === null) return { field, char: '?', kind: 'invalid' };

    if (mask === 0) {
      if (!directNums) inNumberMode = false;
      return { field, char: ' ', kind: 'space' };
    }

    if (mask === BRAILLE_NUMBER_PREFIX_MASK) {
      inNumberMode = true;
      return { field, char: '⠼', kind: 'prefix' };
    }

    if (inNumberMode) {
      if (mask in MASK_TO_DIGIT) return { field, char: MASK_TO_DIGIT[mask], kind: 'char' };
      if (!directNums) inNumberMode = false;
    }

    const decoded = decodeSingleMask(mask, { czechDiacritics: czech });
    return { field, char: decoded.char, kind: decoded.isValid ? 'char' : 'invalid' };
  });
}

/** Readable text of decoded fields; the number prefix is not a character of its own. */
export function brailleFieldsToText(decoded: DecodedBrailleField[]): string {
  return decoded
    .filter((item) => item.kind !== 'prefix')
    .map((item) => item.char)
    .join('');
}

/**
 * Encodes text to Unicode Braille pattern string.
 */
export function textToBrailleUnicode(
  text: string,
  options: BrailleDecodeOptions = {}
): string {
  if (!text) return '';

  const czech = options.czechDiacritics ?? true;
  const upper = text.toUpperCase();

  let result = '';
  let inDigits = false;

  for (let i = 0; i < upper.length; i++) {
    const ch = upper[i];

    if (ch === ' ') {
      result += ' ';
      inDigits = false;
      continue;
    }

    // Digits
    if (/[0-9]/.test(ch)) {
      if (!inDigits) {
        result += maskToUnicode(BRAILLE_NUMBER_PREFIX_MASK);
        inDigits = true;
      }
      const digitEntry = Object.entries(MASK_TO_DIGIT).find(([, v]) => v === ch);
      if (digitEntry) {
        result += maskToUnicode(Number(digitEntry[0]));
      }
      continue;
    }

    inDigits = false;

    // Special Czech letters
    if (czech) {
      if (ch === 'Ř') {
        result += maskToUnicode(58);
        continue;
      }
      if (ch === 'W') {
        result += maskToUnicode(55);
        continue;
      }
      const czEntry = Object.entries(MASK_TO_CZECH).find(([, v]) => v === ch);
      if (czEntry) {
        result += maskToUnicode(Number(czEntry[0]));
        continue;
      }
    } else {
      if (ch === 'W') {
        result += maskToUnicode(58);
        continue;
      }
    }

    // Basic letters (diacritics fallback)
    const baseCh = removeDiacritics(ch);
    const letterEntry = Object.entries(MASK_TO_LETTER).find(([, v]) => v === baseCh);
    if (letterEntry) {
      result += maskToUnicode(Number(letterEntry[0]));
      continue;
    }

    // Punctuation
    const punctEntry = Object.entries(MASK_TO_PUNCTUATION).find(([, v]) => v === ch);
    if (punctEntry) {
      result += maskToUnicode(Number(punctEntry[0]));
      continue;
    }

    result += '?';
  }

  return result;
}
