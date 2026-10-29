import { solveNonogram, type NonogramSolveResult } from './nonogramSolver';

self.onmessage = (e: MessageEvent) => {
  const data = e.data;
  if (!data || data.type !== 'solve_nonogram') return;

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
};
