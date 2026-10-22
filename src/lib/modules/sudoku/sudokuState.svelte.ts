import { puzzleService } from './puzzleService';
import { validateSudokuBoard, solveSudoku } from './sudokuSolver';
import { settings } from '../../state/settings.svelte';
import { toast } from '../../state/toast.svelte';

export type PuzzleFlavour = 'sudoku' | 'nonogram';

const STORAGE_KEY = 'samuel_module_sudoku_v1';

class SudokuModuleState {
  flavour = $state<PuzzleFlavour>('sudoku');

  // --- Sudoku State ---
  sudokuGrid = $state<(number | null)[][]>(
    Array.from({ length: 9 }, () => new Array(9).fill(null))
  );
  sudokuSolution = $state<(number | null)[][] | null>(null);
  sudokuIsSolved = $state(false);
  sudokuSelected = $state<{ r: number; c: number }>({ r: 0, c: 0 });
  sudokuCollisions = $state<{ r: number; c: number }[]>([]);
  isSolvingSudoku = $state(false);
  showMultipleModal = $state(false);
  pendingMultipleSolution = $state<(number | null)[][] | null>(null);

  // --- Nonogram State ---
  nonogramWidth = $state(10);
  nonogramHeight = $state(10);
  // Persist up to 30 clues so shrinking does not destroy data
  nonogramRowClues = $state<number[][]>(Array.from({ length: 30 }, () => []));
  nonogramColClues = $state<number[][]>(Array.from({ length: 30 }, () => []));
  nonogramSelected = $state<{ type: 'col' | 'row'; index: number }>({
    type: 'col',
    index: 0
  });
  nonogramDraft = $state<string>(''); // Currently typed digits for the active clue
  nonogramSolution = $state<(0 | 1)[][] | null>(null);
  nonogramIsSolved = $state(false);
  isSolvingNonogram = $state(false);

  constructor() {
    this.loadFromStorage();
  }

  // --- Persistence ---
  private loadFromStorage() {
    if (typeof localStorage === 'undefined') return;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const data = JSON.parse(raw);

      if (data.flavour) this.flavour = data.flavour;
      if (Array.isArray(data.sudokuGrid)) this.sudokuGrid = data.sudokuGrid;
      if (typeof data.nonogramWidth === 'number') this.nonogramWidth = data.nonogramWidth;
      if (typeof data.nonogramHeight === 'number') this.nonogramHeight = data.nonogramHeight;
      if (Array.isArray(data.nonogramRowClues)) this.nonogramRowClues = data.nonogramRowClues;
      if (Array.isArray(data.nonogramColClues)) this.nonogramColClues = data.nonogramColClues;

      this.validateSudoku();
    } catch (e) {
      console.warn('Failed to load Sudoku state from storage:', e);
    }
  }

  saveToStorage() {
    if (typeof localStorage === 'undefined') return;
    try {
      const data = {
        flavour: this.flavour,
        sudokuGrid: this.sudokuGrid,
        nonogramWidth: this.nonogramWidth,
        nonogramHeight: this.nonogramHeight,
        nonogramRowClues: this.nonogramRowClues,
        nonogramColClues: this.nonogramColClues
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {}
  }

  // ==========================================
  // SUDOKU ACTIONS
  // ==========================================

  selectSudokuCell(r: number, c: number) {
    settings.vibrate(20);
    this.sudokuSelected = { r, c };
  }

  validateSudoku() {
    const res = validateSudokuBoard(this.sudokuGrid);
    this.sudokuCollisions = res.collisions;
    return res.isValid;
  }

  enterSudokuDigit(digit: number) {
    if (digit === 0) {
      // 0 in Sudoku is disabled
      return;
    }

    settings.vibrate(30);
    const { r, c } = this.sudokuSelected;

    // Reset solution state if user modifies grid
    if (this.sudokuIsSolved) {
      this.sudokuIsSolved = false;
      this.sudokuSolution = null;
    }

    this.sudokuGrid[r][c] = digit;
    const isValid = this.validateSudoku();
    if (!isValid) {
      settings.vibrate(40); // Double haptic warning
    }

    // Auto-advance to next cell
    this.advanceSudoku(1);
    this.saveToStorage();
  }

  advanceSudoku(step: 1 | -1) {
    settings.vibrate(15);
    let { r, c } = this.sudokuSelected;
    let idx = r * 9 + c + step;

    if (idx < 0) idx = 80;
    if (idx > 80) idx = 0;

    this.sudokuSelected = {
      r: Math.floor(idx / 9),
      c: idx % 9
    };
  }

  backspaceSudoku() {
    settings.vibrate(25);
    const { r, c } = this.sudokuSelected;

    if (this.sudokuIsSolved) {
      this.sudokuIsSolved = false;
      this.sudokuSolution = null;
    }

    if (this.sudokuGrid[r][c] !== null) {
      this.sudokuGrid[r][c] = null;
      this.validateSudoku();
    } else {
      // If cell was already empty, step backward
      this.advanceSudoku(-1);
      const prev = this.sudokuSelected;
      this.sudokuGrid[prev.r][prev.c] = null;
      this.validateSudoku();
    }

    this.saveToStorage();
  }

  solveSudoku() {
    settings.vibrate(40);
    this.isSolvingSudoku = true;

    const res = solveSudoku(this.sudokuGrid);
    this.isSolvingSudoku = false;

    if (res.status === 'solved') {
      this.sudokuSolution = res.solution ?? null;
      this.sudokuIsSolved = true;
      this.sudokuCollisions = [];
      toast.show('✓ Sudoku vyřešeno!', { type: 'success' });
      settings.vibrate(50);
    } else if (res.status === 'multiple') {
      this.pendingMultipleSolution = res.solution ?? null;
      this.showMultipleModal = true;
      settings.vibrate(40);
    } else if (res.status === 'invalid_input') {
      this.sudokuCollisions = res.collisions ?? [];
      toast.show('Kolize v zadání', { type: 'danger' });
      settings.vibrate([40, 40, 40]);
    } else {
      toast.show('Žádné platné řešení', { type: 'warning' });
      settings.vibrate(50);
    }
  }

  confirmMultipleSolutions() {
    if (this.pendingMultipleSolution) {
      this.sudokuSolution = this.pendingMultipleSolution;
      this.sudokuIsSolved = true;
      this.sudokuCollisions = [];
      toast.show('Zobrazeno 1. řešení', { type: 'info' });
    }
    this.pendingMultipleSolution = null;
    this.showMultipleModal = false;
  }

  cancelMultipleSolutions() {
    this.pendingMultipleSolution = null;
    this.showMultipleModal = false;
    toast.show('Řešení zrušeno', { type: 'info' });
  }

  clearSudoku() {
    settings.vibrate(50);
    this.sudokuGrid = Array.from({ length: 9 }, () => new Array(9).fill(null));
    this.sudokuSolution = null;
    this.sudokuIsSolved = false;
    this.sudokuCollisions = [];
    this.sudokuSelected = { r: 0, c: 0 };
    toast.show('Sudoku vymazáno', { type: 'info' });
    this.saveToStorage();
  }

  // ==========================================
  // NONOGRAM ACTIONS
  // ==========================================

  selectNonogramClue(type: 'col' | 'row', index: number) {
    settings.vibrate(20);
    this.commitNonogramDraft();
    this.nonogramSelected = { type, index };
  }

  commitNonogramDraft() {
    if (!this.nonogramDraft) return;
    const num = parseInt(this.nonogramDraft, 10);
    this.nonogramDraft = '';

    if (isNaN(num)) return;

    const { type, index } = this.nonogramSelected;
    const clues = type === 'col' ? this.nonogramColClues[index] : this.nonogramRowClues[index];
    clues.push(num);
    this.saveToStorage();
  }

  enterNonogramDigit(digit: number) {
    settings.vibrate(25);

    if (this.nonogramIsSolved) {
      this.nonogramIsSolved = false;
      this.nonogramSolution = null;
    }

    if (digit === 0 && this.nonogramDraft === '') {
      // 0 pressed on empty draft: mark row/col with 0 (empty line) and advance
      const { type, index } = this.nonogramSelected;
      const clues = type === 'col' ? this.nonogramColClues[index] : this.nonogramRowClues[index];
      clues.length = 0;
      clues.push(0);
      this.advanceNonogram(1);
      this.saveToStorage();
      return;
    }

    this.nonogramDraft += digit.toString();
  }

  advanceNonogram(step: 1 | -1) {
    settings.vibrate(20);
    if (this.nonogramDraft) {
      // If there is an uncommitted number, commit it first!
      this.commitNonogramDraft();
      return;
    }

    // Step to next/previous clue
    let { type, index } = this.nonogramSelected;

    if (step === 1) {
      if (type === 'col') {
        if (index + 1 < this.nonogramWidth) {
          this.nonogramSelected = { type: 'col', index: index + 1 };
        } else {
          // Switch to first row
          this.nonogramSelected = { type: 'row', index: 0 };
        }
      } else {
        if (index + 1 < this.nonogramHeight) {
          this.nonogramSelected = { type: 'row', index: index + 1 };
        } else {
          // Wrap to first col
          this.nonogramSelected = { type: 'col', index: 0 };
        }
      }
    } else {
      if (type === 'row') {
        if (index - 1 >= 0) {
          this.nonogramSelected = { type: 'row', index: index - 1 };
        } else {
          // Switch to last col
          this.nonogramSelected = { type: 'col', index: this.nonogramWidth - 1 };
        }
      } else {
        if (index - 1 >= 0) {
          this.nonogramSelected = { type: 'col', index: index - 1 };
        } else {
          // Wrap to last row
          this.nonogramSelected = { type: 'row', index: this.nonogramHeight - 1 };
        }
      }
    }
  }

  backspaceNonogram() {
    settings.vibrate(25);

    if (this.nonogramIsSolved) {
      this.nonogramIsSolved = false;
      this.nonogramSolution = null;
    }

    if (this.nonogramDraft.length > 0) {
      this.nonogramDraft = this.nonogramDraft.slice(0, -1);
      return;
    }

    const { type, index } = this.nonogramSelected;
    const clues = type === 'col' ? this.nonogramColClues[index] : this.nonogramRowClues[index];

    if (clues.length > 0) {
      // Pop last clue back into draft so user can edit it
      const last = clues.pop()!;
      this.nonogramDraft = last.toString();
      this.saveToStorage();
    } else {
      // Move to previous clue
      this.advanceNonogram(-1);
    }
  }

  setNonogramDimensions(w: number, h: number) {
    const clampedW = Math.max(2, Math.min(30, w));
    const clampedH = Math.max(2, Math.min(30, h));
    this.nonogramWidth = clampedW;
    this.nonogramHeight = clampedH;

    if (this.nonogramSelected.type === 'col' && this.nonogramSelected.index >= clampedW) {
      this.nonogramSelected = { type: 'col', index: clampedW - 1 };
    }
    if (this.nonogramSelected.type === 'row' && this.nonogramSelected.index >= clampedH) {
      this.nonogramSelected = { type: 'row', index: clampedH - 1 };
    }

    this.nonogramIsSolved = false;
    this.nonogramSolution = null;
    this.saveToStorage();
  }

  async solveNonogram() {
    this.commitNonogramDraft();
    settings.vibrate(40);
    this.isSolvingNonogram = true;

    const activeRows = this.nonogramRowClues.slice(0, this.nonogramHeight);
    const activeCols = this.nonogramColClues.slice(0, this.nonogramWidth);

    const res = await puzzleService.solveNonogramAsync(
      this.nonogramWidth,
      this.nonogramHeight,
      activeRows,
      activeCols
    );

    this.isSolvingNonogram = false;

    if (res.status === 'solved') {
      this.nonogramSolution = res.grid ?? null;
      this.nonogramIsSolved = true;
      toast.show('✓ Nonogram vyřešen!', { type: 'success' });
      settings.vibrate(50);
    } else if (res.status === 'invalid_input') {
      toast.show('Chyba v zadání legendy', { type: 'danger' });
      settings.vibrate(50);
    } else if (res.status === 'timeout') {
      toast.show('Vypršel čas výpočtu', { type: 'warning' });
      settings.vibrate(50);
    } else {
      toast.show('Žádné platné řešení', { type: 'warning' });
      settings.vibrate(50);
    }
  }

  clearNonogram() {
    settings.vibrate(50);
    for (let r = 0; r < this.nonogramHeight; r++) {
      this.nonogramRowClues[r] = [];
    }
    for (let c = 0; c < this.nonogramWidth; c++) {
      this.nonogramColClues[c] = [];
    }
    this.nonogramDraft = '';
    this.nonogramSolution = null;
    this.nonogramIsSolved = false;
    this.nonogramSelected = { type: 'col', index: 0 };
    toast.show('Nonogram vymazán', { type: 'info' });
    this.saveToStorage();
  }
}

export const sudokuState = new SudokuModuleState();
