import { nonogramService } from './nonogramService';
import type { NonogramSolveResult } from './nonogramSolver';
import {
  NONOGRAM_MAX_SIZE,
  NONOGRAM_MIN_SIZE,
  backspaceClue,
  clueNumbers,
  clueOverflows,
  cluesToNotation,
  fillNonogramShape,
  invalidCluePieces,
  parseNonogramNotation,
  resizeClues,
  serializeNonogramNotation,
  typeClueDigit,
  type ClueCell
} from './nonogramNotation';
import { localSettingsService } from '../../services/localSettingsService';

export type ClueAxis = 'col' | 'row';

const DEFAULT_SIZE = 10;
// Before the podklad the clues were kept as arrays, first next to the Sudoku board
const OLD_STORAGE_KEY = 'samuel_module_nonogram_v1';
const LEGACY_STORAGE_KEY = 'samuel_module_sudoku_v1';

interface OldClues {
  width: number;
  height: number;
  rowClues: number[][];
  colClues: number[][];
}

/** Reads the clue arrays once and removes them; Sudoku fields in the legacy key stay. */
function takeOldClues(): OldClues | null {
  if (typeof localStorage === 'undefined') return null;
  let found: OldClues | null = null;
  try {
    const raw = localStorage.getItem(OLD_STORAGE_KEY);
    if (raw) {
      const data = JSON.parse(raw);
      found = { width: data.width, height: data.height, rowClues: data.rowClues, colClues: data.colClues };
    }
    localStorage.removeItem(OLD_STORAGE_KEY);

    const legacyRaw = localStorage.getItem(LEGACY_STORAGE_KEY);
    if (legacyRaw) {
      const legacy = JSON.parse(legacyRaw);
      found ??= {
        width: legacy.nonogramWidth,
        height: legacy.nonogramHeight,
        rowClues: legacy.nonogramRowClues,
        colClues: legacy.nonogramColClues
      };
      for (const key of ['nonogramWidth', 'nonogramHeight', 'nonogramRowClues', 'nonogramColClues']) {
        delete legacy[key];
      }
      if (Object.keys(legacy).length > 0) localStorage.setItem(LEGACY_STORAGE_KEY, JSON.stringify(legacy));
      else localStorage.removeItem(LEGACY_STORAGE_KEY);
    }
  } catch {
    return found;
  }
  return found;
}

function clampSize(size: unknown, min = 1): number {
  const n = Math.round(Number(size));
  if (!Number.isFinite(n)) return DEFAULT_SIZE;
  return Math.max(min, Math.min(NONOGRAM_MAX_SIZE, n));
}

class NonogramModuleState {
  private modSettings = localSettingsService.forModule('nonogram');

  /** The podklad: the clues on the board are derived from it and the keypad edits it. */
  notation = $state('');
  // The size follows the notation; it is kept for an empty notation or a missing axis
  width = $state(DEFAULT_SIZE);
  height = $state(DEFAULT_SIZE);
  // Clues cut off by a smaller size, restored first when the size grows again
  spareRows = $state.raw<string[]>([]);
  spareCols = $state.raw<string[]>([]);

  selected = $state<{ type: ClueAxis; index: number }>({ type: 'col', index: 0 });
  /** Index of the number still being typed in the selected clue; the next key commits it. */
  draft = $state<number | null>(null);

  solution = $state.raw<(0 | 1)[][] | null>(null);
  outcome = $state<NonogramSolveResult['status'] | null>(null);
  isSolving = $state(false);
  private revision = 0;

  parsed = $derived(parseNonogramNotation(this.notation));
  invalidPieces = $derived(invalidCluePieces(this.parsed));
  isEmpty = $derived(
    this.parsed.extra.length === 0 &&
      [...this.parsed.rows, ...this.parsed.cols].every((cell) => cell.length === 0)
  );

  /** Structural problems of the notation, one sentence each. */
  problems = $derived.by(() => {
    if (!this.notation.trim()) return [];
    const { rows, cols, extra } = this.parsed;
    const list: string[] = [];
    if (rows.length === 0) list.push('Chybí řádky před //.');
    if (cols.length === 0) list.push('Chybí sloupce za //.');
    if (rows.length > NONOGRAM_MAX_SIZE) list.push(`Řádků je ${rows.length}, nejvýš 30.`);
    if (cols.length > NONOGRAM_MAX_SIZE) list.push(`Sloupců je ${cols.length}, nejvýš 30.`);
    if (extra.length > 0) list.push('Zápis má víc než dvě části oddělené //.');
    return list;
  });

  /** First line whose numbers do not fit the board. */
  overflow = $derived.by(() => {
    for (let r = 0; r < this.height; r++) {
      if (clueOverflows(this.parsed.rows[r], this.width)) return `Řádek ${r + 1}: čísla se nevejdou`;
    }
    for (let c = 0; c < this.width; c++) {
      if (clueOverflows(this.parsed.cols[c], this.height)) return `Sloupec ${c + 1}: čísla se nevejdou`;
    }
    return null;
  });

  rowSum = $derived(this.sumClues(this.parsed.rows, this.height));
  colSum = $derived(this.sumClues(this.parsed.cols, this.width));

  constructor() {
    if (this.modSettings.has('notation')) {
      this.notation = this.modSettings.getString('notation', '');
      this.width = clampSize(this.modSettings.getNumber('width', DEFAULT_SIZE));
      this.height = clampSize(this.modSettings.getNumber('height', DEFAULT_SIZE));
      this.spareRows = this.modSettings.getJSON<string[]>('spare_rows', []);
      this.spareCols = this.modSettings.getJSON<string[]>('spare_cols', []);
      return;
    }

    const old = takeOldClues();
    if (old) {
      this.width = clampSize(old.width, NONOGRAM_MIN_SIZE);
      this.height = clampSize(old.height, NONOGRAM_MIN_SIZE);
      const converted = cluesToNotation(
        this.width,
        this.height,
        Array.isArray(old.rowClues) ? old.rowClues : [],
        Array.isArray(old.colClues) ? old.colClues : []
      );
      this.notation = converted.notation;
      this.spareRows = converted.spareRows;
      this.spareCols = converted.spareCols;
    }
    this.save();
  }

  private sumClues(cells: ClueCell[], length: number): number {
    let sum = 0;
    for (let i = 0; i < length; i++) for (const n of clueNumbers(cells[i])) sum += n;
    return sum;
  }

  private save() {
    this.modSettings.update({
      notation: this.notation,
      width: this.width,
      height: this.height,
      spare_rows: this.spareRows,
      spare_cols: this.spareCols
    });
  }

  /** Any change of the clues or the size drops a shown solution. */
  private dataChanged() {
    this.revision++;
    this.solution = null;
    this.outcome = null;
    this.save();
  }

  private clampSelection() {
    const max = (this.selected.type === 'col' ? this.width : this.height) - 1;
    if (this.selected.index > max) this.selected = { type: this.selected.type, index: max };
  }

  /** Text from the Podklad editor, stored as typed; the size follows it. */
  setNotation(text: string) {
    if (text === this.notation) return;
    this.notation = text;
    // The editor text is the whole puzzle: lines cut off from an earlier one must not come back
    this.spareRows = [];
    this.spareCols = [];
    const { rows, cols } = this.parsed;
    if (rows.length > 0) this.height = clampSize(rows.length);
    if (cols.length > 0) this.width = clampSize(cols.length);
    this.draft = null;
    this.clampSelection();
    this.dataChanged();
  }

  private currentCell(): ClueCell {
    const { type, index } = this.selected;
    return (type === 'row' ? this.parsed.rows[index] : this.parsed.cols[index]) ?? [];
  }

  /** Writes the selected clue; the notation gets every line of the board. */
  private writeCurrentCell(cell: ClueCell) {
    const shaped = fillNonogramShape(this.parsed, this.width, this.height);
    const { type, index } = this.selected;
    (type === 'row' ? shaped.rows : shaped.cols)[index] = cell;
    this.notation = serializeNonogramNotation(shaped);
    this.dataChanged();
  }

  selectClue(type: ClueAxis, index: number) {
    this.draft = null;
    this.selected = { type, index };
  }

  private moveSelection(step: 1 | -1) {
    // Columns from the left, then rows from the top
    const order: { type: ClueAxis; index: number }[] = [
      ...Array.from({ length: this.width }, (_, index) => ({ type: 'col' as const, index })),
      ...Array.from({ length: this.height }, (_, index) => ({ type: 'row' as const, index }))
    ];
    const current = order.findIndex(
      (item) => item.type === this.selected.type && item.index === this.selected.index
    );
    this.selected = order[(Math.max(0, current) + step + order.length) % order.length];
  }

  /** Commits the number being typed, otherwise moves to the next or previous clue. */
  advance(step: 1 | -1) {
    if (this.draft !== null) {
      this.draft = null;
      return;
    }
    this.moveSelection(step);
  }

  enterDigit(digit: number) {
    const edit = typeClueDigit(this.currentCell(), this.draft, digit);
    this.writeCurrentCell(edit.cell);
    this.draft = edit.draft;
    if (edit.advance) this.moveSelection(1);
  }

  backspace() {
    const edit = backspaceClue(this.currentCell(), this.draft);
    if (edit.moveBack) {
      this.draft = null;
      this.moveSelection(-1);
      return;
    }
    this.writeCurrentCell(edit.cell);
    this.draft = edit.draft;
  }

  /** Menu stepper: lines beyond a smaller size are kept and come back when it grows. */
  resize(axis: ClueAxis, size: number) {
    const target = clampSize(size, NONOGRAM_MIN_SIZE);
    const isRow = axis === 'row';
    const lines = isRow ? this.parsed.rows : this.parsed.cols;
    let spare = isRow ? this.spareRows : this.spareCols;

    // A missing axis has no lines to move yet; only the size changes
    if (lines.length > 0) {
      const resized = resizeClues(lines, spare, target);
      const next = { ...this.parsed };
      if (isRow) next.rows = resized.cells;
      else next.cols = resized.cells;
      spare = resized.spare;
      this.notation = serializeNonogramNotation(next);
    }

    if (isRow) {
      this.height = target;
      this.spareRows = spare;
    } else {
      this.width = target;
      this.spareCols = spare;
    }
    this.draft = null;
    this.clampSelection();
    this.dataChanged();
  }

  async solve() {
    this.draft = null;
    const revision = this.revision;
    const rows = Array.from({ length: this.height }, (_, r) => clueNumbers(this.parsed.rows[r]));
    const cols = Array.from({ length: this.width }, (_, c) => clueNumbers(this.parsed.cols[c]));

    this.isSolving = true;
    const res = await nonogramService.solveAsync(this.width, this.height, rows, cols);
    this.isSolving = false;
    // The clues changed while the worker was solving: the result belongs to the old ones
    if (revision !== this.revision) return;

    this.outcome = res.status;
    this.solution = res.status === 'solved' ? (res.grid ?? null) : null;
  }

  /** Bottom-row clear: the clues go, the size stays. */
  clear() {
    this.notation = '';
    this.spareRows = [];
    this.spareCols = [];
    this.draft = null;
    this.selected = { type: 'col', index: 0 };
    this.dataChanged();
  }

  /** Reset modulu: the clues and the size back to defaults. */
  reset() {
    this.width = DEFAULT_SIZE;
    this.height = DEFAULT_SIZE;
    this.clear();
  }
}

export const nonogramState = new NonogramModuleState();
