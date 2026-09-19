import {
  MASK_TO_LETTER,
  MASK_TO_CZECH,
  MASK_TO_DIGIT,
  MASK_TO_PUNCTUATION,
  BRAILLE_NUMBER_PREFIX_MASK,
  dotsToMask,
  maskToUnicode,
  unicodeToMask
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

/**
 * Decodes a sequence of masks, supporting the number prefix (3,4,5,6) statefully.
 */
export function decodeBrailleSequence(
  masks: number[],
  options: BrailleDecodeOptions = {}
): string {
  if (masks.length === 0) return '';

  const czech = options.czechDiacritics ?? true;
  const directNums = options.directNumbers ?? false;

  let result = '';
  let inNumberMode = directNums;

  for (let i = 0; i < masks.length; i++) {
    const mask = masks[i];

    if (mask === 0) {
      result += ' ';
      if (!directNums) inNumberMode = false;
      continue;
    }

    if (mask === BRAILLE_NUMBER_PREFIX_MASK) {
      inNumberMode = true;
      continue;
    }

    if (inNumberMode) {
      if (mask in MASK_TO_DIGIT) {
        result += MASK_TO_DIGIT[mask];
        continue;
      } else {
        // Exited number mode if non-digit appears (unless space)
        if (!directNums) inNumberMode = false;
      }
    }

    const decoded = decodeSingleMask(mask, { czechDiacritics: czech, directNumbers: false });
    result += decoded.char;
  }

  return result;
}

/**
 * Normalizes pasted text from clipboard:
 * 1. If it contains Unicode Braille (⠁..⠿), decodes each symbol to readable text.
 * 2. If it contains numeric dot groups (e.g. "1 / 125 / 135 / 245" or "1, 125, 135"), parses dots and decodes.
 * 3. If it is already plain text, returns uppercase text.
 */
export function normalizeBrailleInput(
  raw: string,
  options: BrailleDecodeOptions = {}
): string {
  if (!raw || !raw.trim()) return '';

  const trimmed = raw.trim();

  // 1. Check for Unicode Braille
  const brailleChars = trimmed.match(/[\u2800-\u283F]/g);
  if (brailleChars && brailleChars.length >= trimmed.replace(/\s/g, '').length * 0.5) {
    const masks: number[] = [];
    for (const char of trimmed) {
      if (char === ' ' || char === '\n' || char === '\t') {
        masks.push(0);
      } else {
        const mask = unicodeToMask(char);
        masks.push(mask);
      }
    }
    return decodeBrailleSequence(masks, options);
  }

  // 2. Check for numeric dot lists like "1 125 135 245" or "1 / 1-2-5 / 1-3-5"
  const tokens = trimmed.split(/[\s/,|;]+/).filter(Boolean);
  const isAllDotTokens = tokens.length > 0 && tokens.every((tok) => /^[1-6]+(-[1-6]+)*$/.test(tok));
  if (isAllDotTokens) {
    const masks: number[] = [];
    for (const tok of tokens) {
      const cleanDigits = tok.replace(/[^1-6]/g, '');
      const dots = Array.from(new Set(cleanDigits.split('').map(Number)));
      masks.push(dotsToMask(dots));
    }
    return decodeBrailleSequence(masks, options);
  }

  // 3. Fallback: plain Latin text
  return trimmed.toUpperCase();
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
