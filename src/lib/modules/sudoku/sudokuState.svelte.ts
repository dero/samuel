import { validateSudokuBoard, solveSudoku, type SudokuSolveResult } from './sudokuSolver';
import {
  gridToSudokuNotation,
  parseSudokuNotation,
  setSudokuCell,
  SUDOKU_SIZE,
  type SudokuGrid
} from './sudokuNotation';
import { localSettingsService } from '../../services/localSettingsService';

// Before the podklad, the board was kept as a value grid next to the Nonogram fields
const LEGACY_STORAGE_KEY = 'samuel_module_sudoku_v1';

/** Converts the legacy board once; the Nonogram fields stay for the Nonogram module. */
function takeLegacyNotation(): string {
  if (typeof localStorage === 'undefined') return '';
  try {
    const raw = localStorage.getItem(LEGACY_STORAGE_KEY);
    if (!raw) return '';
    const data = JSON.parse(raw);
    const grid = data?.sudokuGrid;
    const isBoard =
      Array.isArray(grid) &&
      grid.length === SUDOKU_SIZE &&
      grid.every(
        (row: unknown) =>
          Array.isArray(row) &&
          row.length === SUDOKU_SIZE &&
          row.every((v) => v === null || (Number.isInteger(v) && v >= 1 && v <= 9))
      );
    const notation = isBoard ? gridToSudokuNotation(grid as SudokuGrid) : '';

    delete data.sudokuGrid;
    delete data.flavour;
    if (Object.keys(data).length > 0) localStorage.setItem(LEGACY_STORAGE_KEY, JSON.stringify(data));
    else localStorage.removeItem(LEGACY_STORAGE_KEY);
    return notation;
  } catch {
    return '';
  }
}

class SudokuModuleState {
  private modSettings = localSettingsService.forModule('sudoku');

  /** The podklad: the board is derived from it and the keypad edits it. */
  notation = $state<string>('');
  selected = $state<{ r: number; c: number }>({ r: 0, c: 0 });
  /** Outcome of the last Vyřešit; any edit of the notation drops it. */
  result = $state.raw<SudokuSolveResult | null>(null);

  parsed = $derived(parseSudokuNotation(this.notation));
  collisions = $derived(validateSudokuBoard(this.parsed.grid).collisions);
  solution = $derived(this.result?.solution ?? null);

  constructor() {
    if (this.modSettings.has('notation')) {
      this.notation = this.modSettings.getString('notation', '');
    } else {
      this.notation = takeLegacyNotation();
      this.modSettings.setString('notation', this.notation);
    }
  }

  setNotation(text: string) {
    if (text === this.notation) return;
    this.notation = text;
    this.result = null;
    this.modSettings.setString('notation', text);
  }

  private writeCell(r: number, c: number, value: string) {
    const current = this.parsed.rows[r]?.[c];
    if (current === value || (value === '.' && current === undefined)) return;
    this.setNotation(setSudokuCell(this.notation, r, c, value));
  }

  /** The board cell holds something to delete: a digit or an invalid character. */
  hasCellContent(r: number, c: number): boolean {
    return this.parsed.grid[r][c] !== null || this.parsed.invalidCells[r][c] !== null;
  }

  selectCell(r: number, c: number) {
    this.selected = { r, c };
  }

  advance(step: 1 | -1) {
    const total = SUDOKU_SIZE * SUDOKU_SIZE;
    const idx = (this.selected.r * SUDOKU_SIZE + this.selected.c + step + total) % total;
    this.selected = { r: Math.floor(idx / SUDOKU_SIZE), c: idx % SUDOKU_SIZE };
  }

  enterDigit(digit: number) {
    // 0 skips to the next cell without overwriting
    if (digit !== 0) {
      const { r, c } = this.selected;
      this.writeCell(r, c, String(digit));
    }
    this.advance(1);
  }

  /** Clears the selected cell; on an empty cell steps back and clears that one. */
  backspace() {
    const { r, c } = this.selected;
    if (!this.hasCellContent(r, c)) {
      // No wrap from the first cell to the last: that would start deleting from the end
      if (r === 0 && c === 0) return;
      this.advance(-1);
    }
    this.writeCell(this.selected.r, this.selected.c, '.');
  }

  solve() {
    this.result = solveSudoku(this.parsed.grid);
  }

  clear() {
    this.setNotation('');
    this.result = null;
    this.selected = { r: 0, c: 0 };
  }
}

export const sudokuState = new SudokuModuleState();
