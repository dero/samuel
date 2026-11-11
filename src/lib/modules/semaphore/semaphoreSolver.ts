import {
  PAIR_TO_ENTRY,
  makePairKey,
  transformDirection,
  type SemaphoreEntry
} from './semaphoreData';

export interface SemaphoreDecodeOptions {
  mirrorX?: boolean;
  rotate180?: boolean;
}

export interface SemaphoreTypingState {
  text: string;
  /** Numerals mode: after `#`, A–I and K read as 1–9 and 0 until `J`. */
  numMode: boolean;
}

export interface DecodedSemaphoreField {
  field: string;
  /** What the field shows: character, `␣`, `#`, `⌫`, `?` for an invalid field. */
  symbol: string;
  /** `control` writes nothing: `#`, `J` leaving numerals, Omyl. */
  kind: 'char' | 'space' | 'control' | 'invalid';
  /** A later Omyl erased this field's character. */
  erased: boolean;
}

export interface DecodedSemaphoreFields {
  items: DecodedSemaphoreField[];
  text: string;
  numMode: boolean;
}

/**
 * Decodes a pair of directions into a SemaphoreEntry
 */
export function decodePair(
  a: number,
  b: number,
  options: SemaphoreDecodeOptions = {}
): SemaphoreEntry | null {
  if (a === b || a < 0 || a > 7 || b < 0 || b > 7) {
    return null;
  }

  const tA = transformDirection(a, options);
  const tB = transformDirection(b, options);
  const key = makePairKey(tA, tB);

  return PAIR_TO_ENTRY[key] || null;
}

/**
 * Returns character to insert/display for an entry
 */
export function getCharForEntry(entry: SemaphoreEntry | null, numMode: boolean = false): string {
  if (!entry) return '';
  if (numMode && entry.digit) {
    return entry.digit;
  }
  return entry.char;
}

/**
 * Applies one signal by the standard rules: `#` switches to numerals until `J`
 * (neither is written), and Omyl (CANCEL) erases the previous character.
 */
export function applySemaphoreEntry(
  state: SemaphoreTypingState,
  entry: SemaphoreEntry
): SemaphoreTypingState {
  if (entry.char === '#') return { text: state.text, numMode: true };
  if (entry.char === 'CANCEL') return { text: state.text.slice(0, -1), numMode: state.numMode };
  if (entry.char === 'J' && state.numMode) return { text: state.text, numMode: false };
  return { text: state.text + getCharForEntry(entry, state.numMode), numMode: state.numMode };
}

/**
 * Label for a signal before it is applied (pending key, dial hints).
 */
export function previewSemaphoreEntry(entry: SemaphoreEntry | null, numMode: boolean): string {
  if (!entry) return '';
  if (entry.char === 'CANCEL') return '⌫';
  return getCharForEntry(entry, numMode);
}

/** Arm number of the notation: 1 is down, then clockwise. */
export function directionToArm(direction: number): number {
  return ((direction + 4) % 8) + 1;
}

function armToDirection(arm: number): number {
  return (arm + 3) % 8;
}

/** Notation field of two direction indices, smaller arm first. */
export function dirsToField(a: number, b: number): string {
  return [directionToArm(a), directionToArm(b)].sort((x, y) => x - y).join('');
}

/** Direction indices of a field in either order; `null` unless it is two different arms 1–8. */
export function fieldToDirs(field: string): [number, number] | null {
  if (!/^[1-8]{2}$/.test(field) || field[0] === field[1]) return null;
  return [armToDirection(Number(field[0])), armToDirection(Number(field[1]))];
}

/**
 * Replays the notation fields from the start. Numerals mode and Omyl are not stored,
 * so a changed option or an edited field recomputes everything after it.
 */
export function decodeSemaphoreFields(
  fields: string[],
  options: SemaphoreDecodeOptions = {}
): DecodedSemaphoreFields {
  let state: SemaphoreTypingState = { text: '', numMode: false };
  const items: DecodedSemaphoreField[] = [];
  // Index of the item behind each character of `state.text`, for Omyl to strike out
  const written: number[] = [];

  for (const field of fields) {
    const index = items.length;

    if (field === '') {
      state = { ...state, text: state.text + ' ' };
      written.push(index);
      items.push({ field, symbol: '␣', kind: 'space', erased: false });
      continue;
    }

    const dirs = fieldToDirs(field);
    const entry = dirs && decodePair(dirs[0], dirs[1], options);
    if (!entry) {
      state = { ...state, text: state.text + '?' };
      written.push(index);
      items.push({ field, symbol: '?', kind: 'invalid', erased: false });
      continue;
    }

    const next = applySemaphoreEntry(state, entry);
    if (next.text.length < state.text.length) {
      items[written.pop()!].erased = true;
    } else if (next.text.length > state.text.length) {
      written.push(index);
    }
    items.push({
      field,
      symbol: previewSemaphoreEntry(entry, state.numMode),
      kind: next.text.length > state.text.length ? 'char' : 'control',
      erased: false
    });
    state = next;
  }

  return { items, text: state.text, numMode: state.numMode };
}
