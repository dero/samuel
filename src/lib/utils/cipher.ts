import { removeDiacritics } from './text';

export interface ParsedToken {
  raw: string;
  letterIndex: number | null;
  isUpper: boolean;
  isIncompatibleLetter?: boolean;
}

/**
 * Positive modulo helper: handles negative inputs correctly in JS.
 */
export function mod(n: number, m: number): number {
  return ((n % m) + m) % m;
}

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
      const stripped = removeDiacritics(char);
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
