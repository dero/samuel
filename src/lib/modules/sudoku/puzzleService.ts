import type { SudokuSolveResult } from './sudokuSolver';
import type { NonogramSolveResult } from './nonogramSolver';
import { solveSudoku } from './sudokuSolver';
import { solveNonogram } from './nonogramSolver';

class PuzzleService {
  private worker: Worker | null = null;
  private pendingRequests = new Map<string, (result: any) => void>();
  private reqIdCounter = 0;

  constructor() {
    this.initWorker();
  }

  private initWorker() {
    if (typeof window === 'undefined') return;
    try {
      // Dynamic worker import
      this.worker = new Worker(new URL('./puzzle.worker.ts', import.meta.url), {
        type: 'module'
      });

      this.worker.onmessage = (e: MessageEvent) => {
        const { id, result } = e.data || {};
        if (id && this.pendingRequests.has(id)) {
          const resolve = this.pendingRequests.get(id)!;
          this.pendingRequests.delete(id);
          resolve(result);
        }
      };

      this.worker.onerror = (err) => {
        console.error('Puzzle worker error:', err);
      };
    } catch (e) {
      console.warn('Web Workers unavailable or blocked, using sync fallback:', e);
      this.worker = null;
    }
  }

  async solveSudokuAsync(grid: (number | null)[][]): Promise<SudokuSolveResult> {
    if (!this.worker) {
      return solveSudoku(grid);
    }

    const id = `sudoku_${++this.reqIdCounter}_${Date.now()}`;
    return new Promise((resolve) => {
      this.pendingRequests.set(id, resolve);
      this.worker!.postMessage({
        type: 'solve_sudoku',
        id,
        grid
      });
    });
  }

  async solveNonogramAsync(
    width: number,
    height: number,
    rowClues: number[][],
    colClues: number[][]
  ): Promise<NonogramSolveResult> {
    if (!this.worker) {
      return solveNonogram(width, height, rowClues, colClues);
    }

    const id = `nonogram_${++this.reqIdCounter}_${Date.now()}`;
    return new Promise((resolve) => {
      // 3 second timeout fallback to synchronous execution
      const timer = setTimeout(() => {
        if (this.pendingRequests.has(id)) {
          this.pendingRequests.delete(id);
          resolve(solveNonogram(width, height, rowClues, colClues));
        }
      }, 3000);

      this.pendingRequests.set(id, (res) => {
        clearTimeout(timer);
        resolve(res);
      });

      try {
        this.worker!.postMessage({
          type: 'solve_nonogram',
          id,
          width,
          height,
          rowClues,
          colClues
        });
      } catch (err) {
        clearTimeout(timer);
        this.pendingRequests.delete(id);
        resolve(solveNonogram(width, height, rowClues, colClues));
      }
    });
  }
}

export const puzzleService = new PuzzleService();
