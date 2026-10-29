import { Chess, validateFen } from 'chess.js';

/** FEN piece char: uppercase = white, lowercase = black. */
export type PieceChar = 'K' | 'Q' | 'R' | 'B' | 'N' | 'P' | 'k' | 'q' | 'r' | 'b' | 'n' | 'p';
export type Color = 'w' | 'b';

/** 64 squares in FEN order: index 0 = a8, 7 = h8, 56 = a1, 63 = h1. */
export type Board = (PieceChar | null)[];

export const START_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
export const EMPTY_FEN = '8/8/8/8/8/8/8/8 w - - 0 1';

export const WHITE_PIECES: PieceChar[] = ['K', 'Q', 'R', 'B', 'N', 'P'];
export const BLACK_PIECES: PieceChar[] = ['k', 'q', 'r', 'b', 'n', 'p'];

export const PIECE_NAMES: Record<string, string> = {
  k: 'král',
  q: 'dáma',
  r: 'věž',
  b: 'střelec',
  n: 'jezdec',
  p: 'pěšec'
};

const FILES = 'abcdefgh';

export function squareName(index: number): string {
  return FILES[index % 8] + (8 - Math.floor(index / 8));
}

export function squareIndex(name: string): number {
  return (8 - Number(name[1])) * 8 + FILES.indexOf(name[0]);
}

export function pieceColor(piece: PieceChar): Color {
  return piece === piece.toUpperCase() ? 'w' : 'b';
}

export function isLightSquare(index: number): boolean {
  return ((index % 8) + Math.floor(index / 8)) % 2 === 0;
}

export function pieceLabel(piece: PieceChar): string {
  return `${pieceColor(piece) === 'w' ? 'Bílý' : 'Černý'} ${PIECE_NAMES[piece.toLowerCase()]}`;
}

// ─── FEN ───────────────────────────────────────────────────

export interface FenParts {
  board: Board;
  turn: Color;
  castling: string;
  ep: string;
  halfmove: number;
  fullmove: number;
}

export function parseFen(fen: string): FenParts {
  const [placement = '8/8/8/8/8/8/8/8', turn = 'w', castling = '-', ep = '-', half = '0', full = '1'] =
    fen.trim().split(/\s+/);
  const board: Board = [];
  for (const ch of placement.replace(/\//g, '')) {
    if (/\d/.test(ch)) {
      for (let i = 0; i < Number(ch); i++) board.push(null);
    } else {
      board.push(ch as PieceChar);
    }
  }
  while (board.length < 64) board.push(null);
  board.length = 64;
  return {
    board,
    turn: turn === 'b' ? 'b' : 'w',
    castling,
    ep,
    halfmove: Number(half) || 0,
    fullmove: Math.max(1, Number(full) || 1)
  };
}

export function boardToPlacement(board: Board): string {
  const ranks: string[] = [];
  for (let r = 0; r < 8; r++) {
    let rank = '';
    let empty = 0;
    for (let f = 0; f < 8; f++) {
      const p = board[r * 8 + f];
      if (p) {
        if (empty) rank += empty;
        rank += p;
        empty = 0;
      } else {
        empty++;
      }
    }
    if (empty) rank += empty;
    ranks.push(rank);
  }
  return ranks.join('/');
}

export function buildFen(parts: FenParts): string {
  return [
    boardToPlacement(parts.board),
    parts.turn,
    parts.castling || '-',
    parts.ep || '-',
    parts.halfmove,
    parts.fullmove
  ].join(' ');
}

/** Castling rights inferred from kings and rooks standing on their home squares. */
export function inferCastling(board: Board): string {
  const at = (sq: string) => board[squareIndex(sq)];
  let rights = '';
  if (at('e1') === 'K') {
    if (at('h1') === 'R') rights += 'K';
    if (at('a1') === 'R') rights += 'Q';
  }
  if (at('e8') === 'k') {
    if (at('h8') === 'r') rights += 'k';
    if (at('a8') === 'r') rights += 'q';
  }
  return rights || '-';
}

/** Placement-only FEN (as copied from many diagrams) is completed with sensible defaults. */
export function normalizeFen(input: string): string | null {
  const fields = input.trim().split(/\s+/);
  const placement = fields[0] ?? '';
  const ranks = placement.split('/');
  if (ranks.length !== 8) return null;
  for (const rank of ranks) {
    if (!/^[KQRBNPkqrbnp1-8]+$/.test(rank)) return null;
    let width = 0;
    for (const ch of rank) width += /\d/.test(ch) ? Number(ch) : 1;
    if (width !== 8) return null;
  }
  const board = parseFen(placement).board;
  const turn: Color = fields[1] === 'b' ? 'b' : 'w';
  const castling = fields[2] && /^(-|[KQkq]{1,4})$/.test(fields[2]) ? fields[2] : inferCastling(board);
  const ep = fields[3] && /^(-|[a-h][36])$/.test(fields[3]) ? fields[3] : '-';
  return buildFen({
    board,
    turn,
    castling,
    ep,
    halfmove: Number(fields[4]) || 0,
    fullmove: Math.max(1, Number(fields[5]) || 1)
  });
}

// ─── Validation for the rules mode ─────────────────────────

/** Returns a short Czech reason (fits a toast) why the position cannot be played, or null. */
export function positionProblem(fen: string): string | null {
  const { board, turn } = parseFen(fen);
  const count = (p: PieceChar) => board.filter((x) => x === p).length;
  if (count('K') === 0) return 'Chybí bílý král';
  if (count('k') === 0) return 'Chybí černý král';
  if (count('K') > 1) return 'Víc bílých králů';
  if (count('k') > 1) return 'Víc černých králů';
  for (let f = 0; f < 8; f++) {
    if ([board[f], board[56 + f]].some((p) => p === 'P' || p === 'p')) {
      return 'Pěšec na krajní řadě';
    }
  }
  if (!validateFen(fen).ok) return 'Neplatná pozice';

  const game = new Chess(fen);
  const idle: Color = turn === 'w' ? 'b' : 'w';
  const idleKing = squareName(board.indexOf(idle === 'w' ? 'K' : 'k'));
  if (game.isAttacked(idleKing as never, turn)) {
    return `${idle === 'w' ? 'Bílý' : 'Černý'} je v šachu mimo tah`;
  }
  return null;
}

// ─── Free-mode move hints (pseudo-legal, ignores checks and turn) ──

const KNIGHT_STEPS = [
  [1, 2], [2, 1], [2, -1], [1, -2], [-1, -2], [-2, -1], [-2, 1], [-1, 2]
];
const KING_STEPS = [
  [1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1], [0, -1], [1, -1]
];
const ROOK_DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const BISHOP_DIRS = [[1, 1], [1, -1], [-1, 1], [-1, -1]];

/** Squares the piece on `from` could reach by its movement pattern. */
export function pseudoTargets(board: Board, from: number): number[] {
  const piece = board[from];
  if (!piece) return [];
  const color = pieceColor(piece);
  const file = from % 8;
  const rank = 7 - Math.floor(from / 8); // 0 = rank 1
  const result: number[] = [];
  const idx = (f: number, r: number) => (7 - r) * 8 + f;
  const inside = (f: number, r: number) => f >= 0 && f < 8 && r >= 0 && r < 8;
  const friendly = (i: number) => {
    const p = board[i];
    return !!p && pieceColor(p) === color;
  };

  const steps = (list: number[][]) => {
    for (const [df, dr] of list) {
      const f = file + df;
      const r = rank + dr;
      if (inside(f, r) && !friendly(idx(f, r))) result.push(idx(f, r));
    }
  };
  const slides = (dirs: number[][]) => {
    for (const [df, dr] of dirs) {
      let f = file + df;
      let r = rank + dr;
      while (inside(f, r)) {
        const i = idx(f, r);
        if (friendly(i)) break;
        result.push(i);
        if (board[i]) break;
        f += df;
        r += dr;
      }
    }
  };

  switch (piece.toLowerCase()) {
    case 'n':
      steps(KNIGHT_STEPS);
      break;
    case 'k':
      steps(KING_STEPS);
      break;
    case 'r':
      slides(ROOK_DIRS);
      break;
    case 'b':
      slides(BISHOP_DIRS);
      break;
    case 'q':
      slides(ROOK_DIRS);
      slides(BISHOP_DIRS);
      break;
    case 'p': {
      const dir = color === 'w' ? 1 : -1;
      const home = color === 'w' ? 1 : 6;
      if (inside(file, rank + dir) && !board[idx(file, rank + dir)]) {
        result.push(idx(file, rank + dir));
        if (rank === home && !board[idx(file, rank + 2 * dir)]) {
          result.push(idx(file, rank + 2 * dir));
        }
      }
      for (const df of [-1, 1]) {
        const f = file + df;
        const r = rank + dir;
        if (inside(f, r) && board[idx(f, r)] && !friendly(idx(f, r))) result.push(idx(f, r));
      }
      break;
    }
  }
  return result;
}

// ─── Notation ──────────────────────────────────────────────

const TO_CZECH: Record<string, string> = { Q: 'D', R: 'V', B: 'S', N: 'J' };
const FROM_CZECH: Record<string, string> = { D: 'Q', V: 'R', S: 'B', J: 'N' };

/** chess.js SAN → Czech SAN (`Nf3` → `Jf3`, `e8=Q` → `e8=D`). */
export function toCzechSan(san: string): string {
  return san.replace(/[QRBN]/g, (ch) => TO_CZECH[ch]);
}

/**
 * Splits a pasted game into SAN tokens chess.js understands. Czech and English
 * piece letters only overlap in `K`, so both are accepted without a switch.
 */
export function tokenizeMoves(text: string): string[] {
  const cleaned = text
    .replace(/\[[^\]]*\]/g, ' ') // PGN headers
    .replace(/\{[^}]*\}/g, ' ') // comments
    .replace(/\([^)]*\)/g, ' ') // variations
    .replace(/\$\d+/g, ' ') // NAGs
    .replace(/0-0-0/g, 'O-O-O')
    .replace(/0-0/g, 'O-O');
  return cleaned
    .split(/\s+/)
    .map((t) => t.replace(/^\d+\.+/, '').replace(/[!?]+$/, ''))
    .filter((t) => t && !/^(1-0|0-1|1\/2-1\/2|\*|\d+\.*)$/.test(t))
    .map((t) => t.replace(/[DVSJ]/g, (ch) => FROM_CZECH[ch]));
}
