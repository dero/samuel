import type {
  CaesarShiftResult,
  VigenereMode,
  AutokeyMode,
  AutokeyKeySource
} from './shiftsData';
import {
  scoreAllCaesarCandidates,
  getFallbackCaesarLexicon,
  type CaesarLexicon,
  type CaesarCandidateRawScore
} from './caesarScorer';

import { mod, tokenizeText, type ParsedToken } from '../../utils/cipher';
export { mod, tokenizeText, type ParsedToken };

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
 * Returns the N-1 shifted variants of `text` (shift k = index + 1).
 */
export function buildCaesarShiftTexts(
  text: string,
  alphabetLetters: string[],
  preserveSpecialChars = true
): string[] {
  if (!text || alphabetLetters.length <= 1) return [];
  const shiftedTexts: string[] = [];
  for (let k = 1; k < alphabetLetters.length; k++) {
    shiftedTexts.push(shiftCaesar(text, k, alphabetLetters, preserveSpecialChars));
  }
  return shiftedTexts;
}

/**
 * Combines shifted texts with their scores (from scoreAllCaesarCandidates,
 * possibly computed in the DB worker) into display results.
 */
export function assembleCaesarResults(
  shiftedTexts: string[],
  evaluated: Array<CaesarCandidateRawScore & { isBest: boolean }>,
  alphabetSize: number
): CaesarShiftResult[] {
  return evaluated.map((cand, idx) => {
    const k = idx + 1;
    return {
      shift: k,
      reverseShift: alphabetSize - k,
      shiftedText: shiftedTexts[idx],
      score: cand.rawPlausibility,
      percentage: cand.percentage,
      recognizedWords: cand.matchedWords.map((w) => w.word),
      formattedText: shiftedTexts[idx],
      isBest: cand.isBest
    };
  });
}

/**
 * Computes all N-1 Caesar shifts and scores each synchronously. Without a
 * custom lexicon it uses the small built-in keyword lexicon; full-dictionary
 * scoring runs in the DB worker (dbClient.caesarScore).
 */
export function getAllCaesarShifts(
  text: string,
  alphabetLetters: string[],
  preserveSpecialChars = true,
  customLexicon?: CaesarLexicon
): CaesarShiftResult[] {
  const shiftedTexts = buildCaesarShiftTexts(text, alphabetLetters, preserveSpecialChars);
  if (shiftedTexts.length === 0) return [];
  const evaluated = scoreAllCaesarCandidates(shiftedTexts, customLexicon || getFallbackCaesarLexicon());
  return assembleCaesarResults(shiftedTexts, evaluated, alphabetLetters.length);
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
