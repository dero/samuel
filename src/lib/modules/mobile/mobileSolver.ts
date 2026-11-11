import { PHONE_KEYS } from './mobileData';
import { removeDiacritics } from '../../utils/text';

/**
 * Character of one notation field, `null` when invalid. A field is a key repeated by the
 * number of presses (`44` = H), `''` is a space. One press past the key's letters is its
 * digit (`2222` = 2), as on a real phone.
 */
export function fieldToChar(field: string): string | null {
  if (field === '') return ' ';

  const key = field[0];
  const letters = PHONE_KEYS[key];
  if (!letters || [...field].some((c) => c !== key)) return null;

  if (field.length <= letters.length) return letters[field.length - 1];
  return field.length === letters.length + 1 && !letters.includes(key) ? key : null;
}

/** Field of a key's own digit (long press). */
export function digitField(key: string): string {
  const letters = PHONE_KEYS[key];
  const at = letters.indexOf(key);
  return key.repeat(at >= 0 ? at + 1 : letters.length + 1);
}

function charToField(char: string): string {
  for (const [key, letters] of Object.entries(PHONE_KEYS)) {
    const at = letters.indexOf(char);
    if (at >= 0) return key.repeat(at + 1);
  }
  return char; // no key produces it: stays visible as an invalid field
}

/** SMS fields of a word chosen in T9. */
export function wordToFields(word: string): string[] {
  return [...removeDiacritics(word).toUpperCase()].map(charToField);
}
