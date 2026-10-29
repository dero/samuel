import { nonogramService } from './nonogramService';
import { settings } from '../../state/settings.svelte';
import { toast } from '../../state/toast.svelte';

const STORAGE_KEY = 'samuel_module_nonogram_v1';
// Nonogram used to be a flavour of the Sudoku module; its data is migrated once from there
const LEGACY_STORAGE_KEY = 'samuel_module_sudoku_v1';

class NonogramModuleState {
  width = $state(10);
  height = $state(10);
  // Persist up to 30 clues so shrinking does not destroy data
  rowClues = $state<number[][]>(Array.from({ length: 30 }, () => []));
  colClues = $state<number[][]>(Array.from({ length: 30 }, () => []));
  selected = $state<{ type: 'col' | 'row'; index: number }>({
    type: 'col',
    index: 0
  });
  draft = $state<string>(''); // Currently typed digits for the active clue
  solution = $state<(0 | 1)[][] | null>(null);
  isSolved = $state(false);
  isSolving = $state(false);

  constructor() {
    this.loadFromStorage();
  }

  // --- Persistence ---
  private loadFromStorage() {
    if (typeof localStorage === 'undefined') return;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const data = JSON.parse(raw);
        if (typeof data.width === 'number') this.width = data.width;
        if (typeof data.height === 'number') this.height = data.height;
        if (Array.isArray(data.rowClues)) this.rowClues = data.rowClues;
        if (Array.isArray(data.colClues)) this.colClues = data.colClues;
        return;
      }

      const legacyRaw = localStorage.getItem(LEGACY_STORAGE_KEY);
      if (!legacyRaw) return;
      const legacy = JSON.parse(legacyRaw);
      if (typeof legacy.nonogramWidth === 'number') this.width = legacy.nonogramWidth;
      if (typeof legacy.nonogramHeight === 'number') this.height = legacy.nonogramHeight;
      if (Array.isArray(legacy.nonogramRowClues)) this.rowClues = legacy.nonogramRowClues;
      if (Array.isArray(legacy.nonogramColClues)) this.colClues = legacy.nonogramColClues;
      this.saveToStorage();
    } catch (e) {
      console.warn('Failed to load Nonogram state from storage:', e);
    }
  }

  saveToStorage() {
    if (typeof localStorage === 'undefined') return;
    try {
      const data = {
        width: this.width,
        height: this.height,
        rowClues: this.rowClues,
        colClues: this.colClues
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {}
  }

  // --- Actions ---

  selectClue(type: 'col' | 'row', index: number) {
    settings.vibrate(20);
    this.commitDraft();
    this.selected = { type, index };
  }

  commitDraft() {
    if (!this.draft) return;
    const num = parseInt(this.draft, 10);
    this.draft = '';

    if (isNaN(num)) return;

    const { type, index } = this.selected;
    const clues = type === 'col' ? this.colClues[index] : this.rowClues[index];
    clues.push(num);
    this.saveToStorage();
  }

  enterDigit(digit: number) {
    settings.vibrate(25);

    if (this.isSolved) {
      this.isSolved = false;
      this.solution = null;
    }

    if (digit === 0 && this.draft === '') {
      // 0 pressed on empty draft: mark row/col with 0 (empty line) and advance
      const { type, index } = this.selected;
      const clues = type === 'col' ? this.colClues[index] : this.rowClues[index];
      clues.length = 0;
      clues.push(0);
      this.advance(1);
      this.saveToStorage();
      return;
    }

    this.draft += digit.toString();
  }

  advance(step: 1 | -1) {
    settings.vibrate(20);
    if (this.draft) {
      // If there is an uncommitted number, commit it first!
      this.commitDraft();
      return;
    }

    // Step to next/previous clue
    let { type, index } = this.selected;

    if (step === 1) {
      if (type === 'col') {
        if (index + 1 < this.width) {
          this.selected = { type: 'col', index: index + 1 };
        } else {
          // Switch to first row
          this.selected = { type: 'row', index: 0 };
        }
      } else {
        if (index + 1 < this.height) {
          this.selected = { type: 'row', index: index + 1 };
        } else {
          // Wrap to first col
          this.selected = { type: 'col', index: 0 };
        }
      }
    } else {
      if (type === 'row') {
        if (index - 1 >= 0) {
          this.selected = { type: 'row', index: index - 1 };
        } else {
          // Switch to last col
          this.selected = { type: 'col', index: this.width - 1 };
        }
      } else {
        if (index - 1 >= 0) {
          this.selected = { type: 'col', index: index - 1 };
        } else {
          // Wrap to last row
          this.selected = { type: 'row', index: this.height - 1 };
        }
      }
    }
  }

  backspace() {
    settings.vibrate(25);

    if (this.isSolved) {
      this.isSolved = false;
      this.solution = null;
    }

    if (this.draft.length > 0) {
      this.draft = this.draft.slice(0, -1);
      return;
    }

    const { type, index } = this.selected;
    const clues = type === 'col' ? this.colClues[index] : this.rowClues[index];

    if (clues.length > 0) {
      // Pop last clue back into draft so user can edit it
      const last = clues.pop()!;
      this.draft = last.toString();
      this.saveToStorage();
    } else {
      // Move to previous clue
      this.advance(-1);
    }
  }

  setDimensions(w: number, h: number) {
    const clampedW = Math.max(2, Math.min(30, w));
    const clampedH = Math.max(2, Math.min(30, h));
    this.width = clampedW;
    this.height = clampedH;

    if (this.selected.type === 'col' && this.selected.index >= clampedW) {
      this.selected = { type: 'col', index: clampedW - 1 };
    }
    if (this.selected.type === 'row' && this.selected.index >= clampedH) {
      this.selected = { type: 'row', index: clampedH - 1 };
    }

    this.isSolved = false;
    this.solution = null;
    this.saveToStorage();
  }

  async solve() {
    this.commitDraft();
    settings.vibrate(40);
    this.isSolving = true;

    const activeRows = this.rowClues.slice(0, this.height);
    const activeCols = this.colClues.slice(0, this.width);

    const res = await nonogramService.solveAsync(this.width, this.height, activeRows, activeCols);

    this.isSolving = false;

    if (res.status === 'solved') {
      this.solution = res.grid ?? null;
      this.isSolved = true;
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

  clear() {
    settings.vibrate(50);
    for (let r = 0; r < this.height; r++) {
      this.rowClues[r] = [];
    }
    for (let c = 0; c < this.width; c++) {
      this.colClues[c] = [];
    }
    this.draft = '';
    this.solution = null;
    this.isSolved = false;
    this.selected = { type: 'col', index: 0 };
    toast.show('Nonogram vymazán', { type: 'info' });
    this.saveToStorage();
  }
}

export const nonogramState = new NonogramModuleState();
