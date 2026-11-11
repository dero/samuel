/**
 * Podklad notation shared by the transcription modules (DESIGN_SYSTEM §7).
 * A comma separates characters and an empty field is a space, e.g. `1,125,,12`.
 */

/**
 * Splits a notation into fields; `''` is a space. Whitespace around a field is ignored
 * because some phone keyboards add it after a comma. A trailing comma only opens the
 * next character, so `1,` is one field and `1,,` is a field and a space.
 */
export function parseNotation(text: string): string[] {
  if (!text.trim()) return [];
  const fields = text.split(',').map((field) => field.trim());
  if (fields[fields.length - 1] === '') fields.pop();
  return fields;
}

/** Inverse of `parseNotation`: a final space needs one more comma to survive the round trip. */
export function serializeNotation(fields: string[]): string {
  const joined = fields.join(',');
  return fields[fields.length - 1] === '' ? `${joined},` : joined;
}
