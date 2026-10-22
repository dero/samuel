import { solveSudoku, type SudokuSolveResult } from './sudokuSolver';
import { solveNonogram, type NonogramSolveResult } from './nonogramSolver';

self.onmessage = (e: MessageEvent) => {
  const data = e.data;
  if (!data || !data.type) return;

  if (data.type === 'solve_sudoku') {
    const result: SudokuSolveResult = solveSudoku(data.grid);
    self.postMessage({
      type: 'sudoku_result',
      id: data.id,
      result
    });
  } else if (data.type === 'solve_nonogram') {
    const result: NonogramSolveResult = solveNonogram(
      data.width,
      data.height,
      data.rowClues,
      data.colClues
    );
    self.postMessage({
      type: 'nonogram_result',
      id: data.id,
      result
    });
  }
};
