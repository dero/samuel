import { findMates } from './chessSolver';

export interface ChessWorkerRequest {
  id: number;
  fen: string;
  depth: number;
}

export type ChessWorkerResponse =
  | { id: number; type: 'progress'; depth: number; done: number; total: number }
  | { id: number; type: 'result'; result: ReturnType<typeof findMates> };

self.onmessage = (e: MessageEvent<ChessWorkerRequest>) => {
  const { id, fen, depth } = e.data;
  let lastPost = 0;
  const result = findMates(fen, depth, (d, done, total) => {
    const now = performance.now();
    if (now - lastPost < 80) return;
    lastPost = now;
    self.postMessage({ id, type: 'progress', depth: d, done, total } satisfies ChessWorkerResponse);
  });
  self.postMessage({ id, type: 'result', result } satisfies ChessWorkerResponse);
};
