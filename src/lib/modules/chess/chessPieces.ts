// Piece artwork by Colin M.L. Burnett (User:Cburnett, Wikimedia Commons, "Chess_*t45.svg"),
// used under the BSD license offered alongside GFDL and GPL.
import wK from './pieces/wK.svg?raw';
import wQ from './pieces/wQ.svg?raw';
import wR from './pieces/wR.svg?raw';
import wB from './pieces/wB.svg?raw';
import wN from './pieces/wN.svg?raw';
import wP from './pieces/wP.svg?raw';
import bK from './pieces/bK.svg?raw';
import bQ from './pieces/bQ.svg?raw';
import bR from './pieces/bR.svg?raw';
import bB from './pieces/bB.svg?raw';
import bN from './pieces/bN.svg?raw';
import bP from './pieces/bP.svg?raw';
import type { PieceChar } from './chessData';

export const PIECE_SVG: Record<PieceChar, string> = {
  K: wK, Q: wQ, R: wR, B: wB, N: wN, P: wP,
  k: bK, q: bQ, r: bR, b: bB, n: bN, p: bP
};
