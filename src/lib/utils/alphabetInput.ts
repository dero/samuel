export const MIN_ALPHABET_SIZE = 2;

export interface AlphabetParseResult {
  letters: string[];
  error: string | null;
}

/**
 * Parses a comma-separated alphabet definition ("A, B, CH, 1").
 * Newlines are accepted as separators too (pasted lists). Entries are trimmed
 * and upper-cased; an entry may be multi-character (e.g. 'CH').
 */
export function parseAlphabetInput(text: string): AlphabetParseResult {
  const letters = text
    .split(/[,\n]/)
    .map((part) => part.trim().toUpperCase())
    .filter((part) => part.length > 0);

  if (letters.length < MIN_ALPHABET_SIZE) {
    return { letters, error: `Zadejte alespoň ${MIN_ALPHABET_SIZE} znaky oddělené čárkou.` };
  }

  const spaced = letters.find((l) => /\s/.test(l));
  if (spaced) {
    return { letters, error: `Znak „${spaced}“ obsahuje mezeru – oddělte znaky čárkou.` };
  }

  const seen = new Set<string>();
  for (const l of letters) {
    if (seen.has(l)) {
      return { letters, error: `Znak „${l}“ je v abecedě víckrát.` };
    }
    seen.add(l);
  }

  return { letters, error: null };
}

export function formatAlphabetInput(letters: string[]): string {
  return letters.join(', ');
}
