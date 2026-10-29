import { validateSudokuBoard, solveSudoku } from './sudokuSolver';
import { settings } from '../../state/settings.svelte';
import { toast } from '../../state/toast.svelte';

const STORAGE_KEY = 'samuel_module_sudoku_v1';

class SudokuModuleState {
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

      if (Array.isArray(data.sudokuGrid)) this.sudokuGrid = data.sudokuGrid;

      this.validateSudoku();
    } catch (e) {
      console.warn('Failed to load Sudoku state from storage:', e);
    }
  }

  saveToStorage() {
    if (typeof localStorage === 'undefined') return;
    try {
      // Keep legacy nonogram* fields until the Nonogram module migrates them
      const prev = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      const data = { ...prev, sudokuGrid: this.sudokuGrid };
      delete data.flavour;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {}
  }

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
}

export const sudokuState = new SudokuModuleState();
