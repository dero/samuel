import { removeDiacritics } from '../../utils/text';

export interface SubstitutionToken {
  /** The text to render */
  display: string;
  /** True if this token was successfully mapped to a new letter */
  isMapped: boolean;
  /** True if this is an alphabet letter from ciphertext that has NOT yet been mapped */
  isUnmappedLetter: boolean;
  /** True if this is whitespace, punctuation, or special symbol */
  isSpecial: boolean;
  /** The canonical uppercase cipher letter key (e.g. 'A', 'CH'), or null if special */
  cipherKey: string | null;
}

export interface SubstitutionResult {
  tokens: SubstitutionToken[];
  plainText: string;
}

/**
 * Tokenize and solve monoalphabetic substitution for a given text, mapping, and alphabet.
 *
 * Rules:
 * - Multi-character letters (e.g. 'CH') are matched with priority if present in alphabet.
 * - If alphabet lacks diacritics, diacritical letters fall back to their stripped base letter.
 * - Mapped letters render as UPPERCASE (e.g. 'S').
 * - Unmapped alphabet letters render as lowercase (e.g. 'a') so solved vs unsolved parts are distinct.
 * - Non-alphabet symbols (spaces, punctuation, numbers) are preserved as-is.
 */
export function solveSubstitution(
  text: string,
  mapping: Record<string, string>,
  alphabetLetters: string[]
): SubstitutionResult {
  if (!text) {
    return { tokens: [], plainText: '' };
  }

  const alphabetHasDiacritics = alphabetLetters.some((l) =>
    /[áčďéěíňóřšťúůýž]/i.test(l)
  );

  // Sort letters descending by length (so 'CH' matches before 'C')
  const sortedLetters = [...alphabetLetters]
    .map((letter) => ({ letter, upper: letter.toUpperCase(), len: letter.length }))
    .sort((a, b) => b.len - a.len);

  const tokens: SubstitutionToken[] = [];
  let i = 0;

  while (i < text.length) {
    let matched = false;

    // 1. Direct match against alphabet (e.g. 'CH' or 'A')
    for (const { upper, len } of sortedLetters) {
      if (i + len <= text.length) {
        const sub = text.slice(i, i + len);
        if (sub.toUpperCase() === upper) {
          const mappedTarget = mapping[upper];
          if (mappedTarget) {
            tokens.push({
              display: mappedTarget.toUpperCase(),
              isMapped: true,
              isUnmappedLetter: false,
              isSpecial: false,
              cipherKey: upper
            });
          } else {
            tokens.push({
              display: sub.toLowerCase(),
              isMapped: false,
              isUnmappedLetter: true,
              isSpecial: false,
              cipherKey: upper
            });
          }
          i += len;
          matched = true;
          break;
        }
      }
    }

    if (matched) continue;

    // 2. Diacritic fallback (if alphabet doesn't contain diacritics)
    if (!alphabetHasDiacritics) {
      const char = text[i];
      const stripped = removeDiacritics(char);
      if (stripped !== char) {
        for (const { upper } of sortedLetters) {
          if (stripped.toUpperCase() === upper) {
            const mappedTarget = mapping[upper];
            if (mappedTarget) {
              tokens.push({
                display: mappedTarget.toUpperCase(),
                isMapped: true,
                isUnmappedLetter: false,
                isSpecial: false,
                cipherKey: upper
              });
            } else {
              tokens.push({
                display: char.toLowerCase(),
                isMapped: false,
                isUnmappedLetter: true,
                isSpecial: false,
                cipherKey: upper
              });
            }
            i++;
            matched = true;
            break;
          }
        }
      }
    }

    if (matched) continue;

    // 3. Non-alphabet character (whitespace, punctuation, numbers, unknown symbols)
    const char = text[i];
    tokens.push({
      display: char,
      isMapped: false,
      isUnmappedLetter: false,
      isSpecial: true,
      cipherKey: null
    });
    i++;
  }

  const plainText = tokens.map((t) => t.display).join('');
  return { tokens, plainText };
}

/**
 * Returns a Set of canonical uppercase alphabet letters that actually appear in the text.
 */
export function getAlphabetLettersInText(
  text: string,
  alphabetLetters: string[]
): Set<string> {
  const result = new Set<string>();
  if (!text) return result;

  const alphabetHasDiacritics = alphabetLetters.some((l) =>
    /[áčďéěíňóřšťúůýž]/i.test(l)
  );

  const sortedLetters = [...alphabetLetters]
    .map((letter) => ({ letter, upper: letter.toUpperCase(), len: letter.length }))
    .sort((a, b) => b.len - a.len);

  let i = 0;
  while (i < text.length) {
    let matched = false;

    for (const { upper, len } of sortedLetters) {
      if (i + len <= text.length) {
        const sub = text.slice(i, i + len);
        if (sub.toUpperCase() === upper) {
          result.add(upper);
          i += len;
          matched = true;
          break;
        }
      }
    }

    if (matched) continue;

    if (!alphabetHasDiacritics) {
      const char = text[i];
      const stripped = removeDiacritics(char);
      if (stripped !== char) {
        for (const { upper } of sortedLetters) {
          if (stripped.toUpperCase() === upper) {
            result.add(upper);
            i++;
            matched = true;
            break;
          }
        }
      }
    }

    i++;
  }

  return result;
}
