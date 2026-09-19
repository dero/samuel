import type {
  CaesarShiftResult,
  VigenereMode,
  AutokeyMode,
  AutokeyKeySource
} from './shiftsData';
import {
  scoreAllCaesarCandidates,
  getFallbackCaesarLexicon,
  type CaesarLexicon
} from './caesarScorer';

let activeCaesarLexicon: CaesarLexicon | null = null;

export function setCaesarLexicon(lexicon: CaesarLexicon) {
  activeCaesarLexicon = lexicon;
}

export function getActiveCaesarLexicon(): CaesarLexicon {
  return activeCaesarLexicon || getFallbackCaesarLexicon();
}

/**
 * Positive modulo helper: handles negative inputs correctly in JS.
 */
export function mod(n: number, m: number): number {
  return ((n % m) + m) % m;
}

export interface ParsedToken {
  raw: string;
  letterIndex: number | null;
  isUpper: boolean;
  isIncompatibleLetter?: boolean;
}

import { stripDiacritics } from '../../utils/text';
export { stripDiacritics };

/**
 * Tokenize input text against a given alphabet:
 * - Supports multi-character letters like 'CH' (matched before 'C' and 'H' if in alphabet).
 * - Maps characters with diacritics to their base letter if the alphabet lacks diacritics.
 * - Fundamentally incompatible letters (letters not present in alphabet, e.g. Q when alphabet lacks Q) are marked as incompatible and render as '?'.
 * - Non-letter characters (whitespace, punctuation) are preserved as-is.
 */
export function tokenizeText(text: string, alphabetLetters: string[]): ParsedToken[] {
  if (!text) return [];

  const alphabetHasDiacritics = alphabetLetters.some((l) =>
    /[áčďéěíňóřšťúůýž]/i.test(l)
  );

  // Create lookup sorted by length descending
  const sortedLetters = [...alphabetLetters]
    .map((letter, index) => ({ letter, index }))
    .sort((a, b) => b.letter.length - a.letter.length);

  const tokens: ParsedToken[] = [];
  let i = 0;

  while (i < text.length) {
    let matched = false;

    // 1. Direct match with alphabet letters (e.g. 'CH' or exact letter)
    for (const { letter, index } of sortedLetters) {
      const len = letter.length;
      if (i + len <= text.length) {
        const sub = text.slice(i, i + len);
        if (sub.toUpperCase() === letter.toUpperCase()) {
          const isUpper = sub === sub.toUpperCase();
          tokens.push({ raw: sub, letterIndex: index, isUpper });
          i += len;
          matched = true;
          break;
        }
      }
    }

    if (matched) continue;

    // 2. Diacritic fallback: if alphabet does not have diacritics, try stripped base letter
    if (!alphabetHasDiacritics) {
      const char = text[i];
      const stripped = stripDiacritics(char);
      if (stripped !== char) {
        for (const { letter, index } of sortedLetters) {
          if (stripped.toUpperCase() === letter.toUpperCase()) {
            const isUpper = char === char.toUpperCase();
            tokens.push({ raw: char, letterIndex: index, isUpper });
            i++;
            matched = true;
            break;
          }
        }
      }
    }

    if (matched) continue;

    // 3. Incompatible letter vs non-letter
    const char = text[i];
    const isLetter = /\p{L}/u.test(char);

    if (isLetter) {
      tokens.push({ raw: char, letterIndex: null, isUpper: false, isIncompatibleLetter: true });
    } else {
      tokens.push({ raw: char, letterIndex: null, isUpper: false, isIncompatibleLetter: false });
    }
    i++;
  }

  return tokens;
}

/**
 * Shifts a single text by a constant k according to the given alphabet.
 */
export function shiftCaesar(
  text: string,
  k: number,
  alphabetLetters: string[],
  preserveSpecialChars = true
): string {
  if (!text || alphabetLetters.length === 0) return '';
  const N = alphabetLetters.length;
  const tokens = tokenizeText(text, alphabetLetters);

  let result = '';
  for (const token of tokens) {
    if (token.letterIndex !== null) {
      const newIndex = mod(token.letterIndex + k, N);
      const rep = alphabetLetters[newIndex];
      result += token.isUpper ? rep.toUpperCase() : rep.toLowerCase();
    } else if (token.isIncompatibleLetter) {
      result += '?';
    } else if (preserveSpecialChars) {
      result += token.raw;
    }
  }

  return result;
}

/**
 * Computes all N-1 Caesar shifts and scores each with the dedicated Caesar lexicon and Markov scorer.
 */
export function getAllCaesarShifts(
  text: string,
  alphabetLetters: string[],
  preserveSpecialChars = true,
  customLexicon?: CaesarLexicon
): CaesarShiftResult[] {
  if (!text || alphabetLetters.length <= 1) return [];
  const N = alphabetLetters.length;
  const shiftedTexts: string[] = [];
  const shiftValues: number[] = [];

  for (let k = 1; k < N; k++) {
    shiftedTexts.push(shiftCaesar(text, k, alphabetLetters, preserveSpecialChars));
    shiftValues.push(k);
  }

  const lexicon = customLexicon || getActiveCaesarLexicon();
  const evaluated = scoreAllCaesarCandidates(shiftedTexts, lexicon);

  const results: CaesarShiftResult[] = evaluated.map((cand, idx) => {
    const k = shiftValues[idx];
    return {
      shift: k,
      reverseShift: N - k,
      shiftedText: shiftedTexts[idx],
      score: cand.rawPlausibility,
      percentage: cand.percentage,
      recognizedWords: cand.matchedWords.map((w) => w.word),
      formattedText: shiftedTexts[idx],
      isBest: cand.isBest
    };
  });

  return results;
}

export interface KeyToken {
  raw: string;
  shiftVal: number;
}

/**
 * Parses a key string for Vigenère/Gronsfeld:
 * Supports alphabetical letters (index in alphabet) or numerical digits (direct shift value).
 */
export function parseKey(keyText: string, alphabetLetters: string[]): KeyToken[] {
  if (!keyText) return [];
  const keyTokens: KeyToken[] = [];
  const sortedLetters = [...alphabetLetters]
    .map((letter, index) => ({ letter, index }))
    .sort((a, b) => b.letter.length - a.letter.length);

  let i = 0;
  while (i < keyText.length) {
    // Check for digit (Gronsfeld shift)
    if (/\d/.test(keyText[i])) {
      let numStr = '';
      while (i < keyText.length && /\d/.test(keyText[i])) {
        numStr += keyText[i];
        i++;
      }
      const val = parseInt(numStr, 10);
      keyTokens.push({ raw: numStr, shiftVal: val });
      continue;
    }

    // Check for alphabet token
    let matched = false;
    for (const { letter, index } of sortedLetters) {
      const len = letter.length;
      if (i + len <= keyText.length) {
        const sub = keyText.slice(i, i + len);
        if (sub.toUpperCase() === letter.toUpperCase()) {
          keyTokens.push({ raw: sub.toUpperCase(), shiftVal: index });
          i += len;
          matched = true;
          break;
        }
      }
    }

    if (!matched) {
      i++; // Skip non-alphanumeric separators in key
    }
  }

  return keyTokens;
}

export interface VigenereResult {
  text: string;
  keyStream: string;
}

/**
 * Vigenère / Gronsfeld encryption and decryption.
 * Non-alphabetic characters (like spaces) are preserved and do NOT advance the key stream.
 */
export function solveVigenere(
  text: string,
  keyText: string,
  mode: VigenereMode,
  alphabetLetters: string[],
  preserveSpecialChars = true
): VigenereResult {
  if (!text) return { text: '', keyStream: '' };
  const N = alphabetLetters.length;
  if (N === 0) return { text, keyStream: '' };

  const keyTokens = parseKey(keyText, alphabetLetters);
  if (keyTokens.length === 0) {
    return { text, keyStream: '' };
  }

  const textTokens = tokenizeText(text, alphabetLetters);
  let result = '';
  let keyStream = '';
  let keyIdx = 0;

  for (const token of textTokens) {
    if (token.letterIndex !== null) {
      const currentKey = keyTokens[keyIdx % keyTokens.length];
      const shift = currentKey.shiftVal;
      const newIndex =
        mode === 'decrypt'
          ? mod(token.letterIndex - shift, N)
          : mod(token.letterIndex + shift, N);

      const rep = alphabetLetters[newIndex];
      result += token.isUpper ? rep.toUpperCase() : rep.toLowerCase();
      keyStream += currentKey.raw;
      keyIdx++;
    } else if (token.isIncompatibleLetter) {
      result += '?';
      keyStream += '?';
      keyIdx++;
    } else if (preserveSpecialChars) {
      result += token.raw;
      keyStream += ' ';
    }
  }

  return { text: result, keyStream };
}

export interface AutokeyResult {
  text: string;
  keyStream: string;
}

/**
 * Autokey encryption and decryption.
 * Supports:
 * - keySource = 'plaintext' (Vigenère Autokey)
 * - keySource = 'ciphertext' (Ciphertext Autokey)
 */
export function solveAutokey(
  text: string,
  primerText: string,
  mode: AutokeyMode,
  keySource: AutokeyKeySource,
  alphabetLetters: string[],
  preserveSpecialChars = true
): AutokeyResult {
  if (!text) return { text: '', keyStream: '' };
  const N = alphabetLetters.length;
  if (N === 0) return { text, keyStream: '' };

  const primerTokens = parseKey(primerText, alphabetLetters);
  if (primerTokens.length === 0) {
    return { text, keyStream: '' };
  }

  const textTokens = tokenizeText(text, alphabetLetters);
  let result = '';
  let keyStream = '';

  // Keystream queue of shift values and labels
  const shiftQueue: { val: number; label: string }[] = primerTokens.map((k) => ({
    val: k.shiftVal,
    label: k.raw
  }));

  let textLetterIdx = 0;

  for (const token of textTokens) {
    if (token.letterIndex !== null) {
      if (textLetterIdx >= shiftQueue.length) {
        // Queue exhausted before expected (should not happen with dynamic append, but safe fallback)
        shiftQueue.push({ val: 0, label: '?' });
      }

      const currentKey = shiftQueue[textLetterIdx];
      const shift = currentKey.val;

      const newIndex =
        mode === 'decrypt'
          ? mod(token.letterIndex - shift, N)
          : mod(token.letterIndex + shift, N);

      const rep = alphabetLetters[newIndex];
      result += token.isUpper ? rep.toUpperCase() : rep.toLowerCase();
      keyStream += currentKey.label;

      // Determine what gets appended to keystream
      if (mode === 'encrypt') {
        if (keySource === 'plaintext') {
          shiftQueue.push({ val: token.letterIndex, label: token.raw.toUpperCase() });
        } else {
          shiftQueue.push({ val: newIndex, label: rep.toUpperCase() });
        }
      } else {
        // Decrypt
        if (keySource === 'plaintext') {
          shiftQueue.push({ val: newIndex, label: rep.toUpperCase() });
        } else {
          shiftQueue.push({ val: token.letterIndex, label: token.raw.toUpperCase() });
        }
      }

      textLetterIdx++;
    } else if (token.isIncompatibleLetter) {
      result += '?';
      keyStream += '?';
      shiftQueue.push({ val: 0, label: '?' });
      textLetterIdx++;
    } else if (preserveSpecialChars) {
      result += token.raw;
      keyStream += ' ';
    }
  }

  return { text: result, keyStream };
}
