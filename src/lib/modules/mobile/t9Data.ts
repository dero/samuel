/**
 * Shared T9 data mappings and helpers.
 */

export const T9_DIGIT_TO_LETTERS: Record<string, string[]> = {
  '2': ['A', 'B', 'C'],
  '3': ['D', 'E', 'F'],
  '4': ['G', 'H', 'I'],
  '5': ['J', 'K', 'L'],
  '6': ['M', 'N', 'O'],
  '7': ['P', 'Q', 'R', 'S'],
  '8': ['T', 'U', 'V'],
  '9': ['W', 'X', 'Y', 'Z']
};

export const T9_PUNCTUATION = ['.', ',', '?', '!', '-', ':', '1'];

export const DIGIT_TO_GLOB: Record<string, string> = {
  '2': '[abc]',
  '3': '[def]',
  '4': '[ghi]',
  '5': '[jkl]',
  '6': '[mno]',
  '7': '[pqrs]',
  '8': '[tuv]',
  '9': '[wxyz]'
};

/**
 * Returns fallback letters for a digit string when no dictionary matches.
 */
export function getFallbackT9Word(digits: string): string {
  let res = '';
  for (const d of digits) {
    if (T9_DIGIT_TO_LETTERS[d]) {
      res += T9_DIGIT_TO_LETTERS[d][0];
    } else {
      res += d;
    }
  }
  return res;
}
