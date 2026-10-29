import { solveMate, type SolvePhase, type SolveReport } from './chessSolver';

export interface ChessWorkerRequest {
  id: number;
  fen: string;
}

export type ChessWorkerResponse =
  | { id: number; type: 'progress'; phase: SolvePhase; depth: number; done: number; total: number }
  | { id: number; type: 'interim'; report: SolveReport }
  | { id: number; type: 'result'; report: SolveReport };

self.onmessage = (e: MessageEvent<ChessWorkerRequest>) => {
  const { id, fen } = e.data;
  let lastPost = 0;
  const report = solveMate(fen, {
    onProgress: (phase, depth, done, total) => {
      const now = performance.now();
      if (now - lastPost < 80) return;
      lastPost = now;
      self.postMessage({ id, type: 'progress', phase, depth, done, total } satisfies ChessWorkerResponse);
    },
    onInterim: (interim) => {
      self.postMessage({ id, type: 'interim', report: interim } satisfies ChessWorkerResponse);
    }
  });
  self.postMessage({ id, type: 'result', report } satisfies ChessWorkerResponse);
};
