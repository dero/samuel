import { Chess } from 'chess.js';
import {
  EMPTY_FEN,
  START_FEN,
  type Board,
  type PieceChar,
  buildFen,
  inferCastling,
  parseFen,
  positionProblem,
  squareIndex,
  toCzechSan
} from './chessData';

/**
 * Podklad notation of the chess board (DESIGN_SYSTEM §7): a FEN, or a game in Czech or
 * English SAN, or a FEN followed by moves played from it. Pieces of the text the board
 * cannot show (unknown characters, moves that cannot be played) are "orphans": they stay
 * in the text, at the end when the board rewrites it.
 */

/** One step of the undo history. `san` marks a legal move played in the rules mode. */
export interface ChessSnapshot {
  fen: string;
  san?: string;
  from?: number;
  to?: number;
  /** Pieces of the podklad text with no place on the board, kept at the end of the text. */
  orphans?: string[];
}

export interface ChessNotation {
  /** The position the text sets up, then one snapshot per move played from it. */
  snaps: ChessSnapshot[];
  /** Raw pieces the board cannot show, in text order. */
  orphans: string[];
  /** What is wrong with the first orphan, for the podklad attention. */
  problem: string | null;
  /** Wrong number of ranks or squares: a warning, nothing is dropped. */
  structural: string | null;
}

/** Plays SAN moves (or solver moves) from a position until the first one that fails. */
export function playMoves(
  baseFen: string,
  moves: (string | { from: string; to: string; promotion?: string })[]
): ChessSnapshot[] {
  const game = new Chess(baseFen);
  const snaps: ChessSnapshot[] = [];
  for (const token of moves) {
    try {
      const move = game.move(token);
      snaps.push({
        fen: game.fen(),
        san: move.san,
        from: squareIndex(move.from),
        to: squareIndex(move.to)
      });
    } catch {
      break;
    }
  }
  return snaps;
}

// ─── Move tokens ───────────────────────────────────────────

const FROM_CZECH: Record<string, string> = { D: 'Q', V: 'R', S: 'B', J: 'N' };
const RESULT = /^(1-0|0-1|1\/2-1\/2|½-½|\*)$/;

interface MoveToken {
  raw: string;
  san: string;
}

/**
 * Move tokens of a game. PGN headers, comments, variations, move numbers, results and
 * annotations are skipped; Czech and English piece letters only overlap in `K`, so both
 * are read without a switch.
 */
function moveTokens(text: string): MoveToken[] {
  const tokens: MoveToken[] = [];
  // Only closed groups are skipped; an unclosed `{` stays a token, so the rest is not swallowed
  for (const [raw] of text.matchAll(/\[[^\]]*\]|\{[^}]*\}|\([^)]*\)|\S+/g)) {
    if (/^[[{(]/.test(raw) && /[\]})]$/.test(raw)) continue;
    const san = raw
      .replace(/^0-0-0/, 'O-O-O')
      .replace(/^0-0/, 'O-O')
      .replace(/^\d+(?:\.+|…)/, '')
      .replace(/^(?:\.+|…)/, '')
      .replace(/[!?]+$/, '');
    if (!san || /^\d+$/.test(san) || /^\$\d+$/.test(san) || RESULT.test(san)) continue;
    tokens.push({ raw, san: san.replace(/[DVSJ]/g, (ch) => FROM_CZECH[ch]) });
  }
  return tokens;
}

function playTokens(baseFen: string, tokens: MoveToken[]) {
  const snaps = positionProblem(baseFen) ? [] : playMoves(baseFen, tokens.map((t) => t.san));
  return { snaps, rest: tokens.slice(snaps.length).map((t) => t.raw) };
}

const moveProblem = (raw: string) => `Tah „${raw}“ nejde zahrát`;

// ─── FEN ───────────────────────────────────────────────────

const PIECE = /^[KQRBNPkqrbnp]$/;
const FIELDS = [/^[wb]$/, /^(-|[KQkq]{1,4})$/, /^(-|[a-h][36])$/, /^\d+$/, /^\d+$/];

/**
 * Reads a placement leniently: every readable piece is placed, unknown characters and
 * squares past the eighth become orphans, missing squares stay empty.
 */
function readPlacement(placement: string) {
  const board: Board = [];
  const orphans: string[] = [];
  let problem: string | null = null;
  let structural: string | null = null;
  const ranks = placement.split('/');

  ranks.forEach((rank, r) => {
    if (r >= 8) {
      if (rank) orphans.push(rank);
      return;
    }
    const cells: (PieceChar | null)[] = [];
    let width = 0;
    let bad = '';
    const flush = () => {
      if (!bad) return;
      orphans.push(bad);
      problem ??= `Neznámý znak „${bad}“ v řadě ${8 - r}`;
      bad = '';
    };
    for (const ch of rank) {
      if (PIECE.test(ch)) {
        flush();
        width++;
        if (cells.length < 8) cells.push(ch as PieceChar);
        else orphans.push(ch);
      } else if (/[1-8]/.test(ch)) {
        flush();
        width += Number(ch);
        while (cells.length < Math.min(width, 8)) cells.push(null);
      } else {
        bad += ch;
      }
    }
    flush();
    while (cells.length < 8) cells.push(null);
    board.push(...cells);
    if (width !== 8) structural ??= `Řada ${8 - r} má ${width} polí místo 8`;
  });

  while (board.length < 64) board.push(null);
  if (ranks.length !== 8) structural = `FEN má ${ranks.length} řad místo 8`;
  return { board, orphans, problem: problem ?? (orphans.length ? structural : null), structural };
}

function parseFenText(text: string): ChessNotation {
  const words = text.trim().split(/\s+/);
  const placed = readPlacement(words[0]);

  // Optional fields in FEN order; the first word that is not one starts the moves
  const fields: (string | undefined)[] = [];
  let k = 1;
  FIELDS.forEach((pattern, f) => {
    if (k < words.length && pattern.test(words[k])) fields[f] = words[k++];
  });
  const base = buildFen({
    board: placed.board,
    turn: fields[0] === 'b' ? 'b' : 'w',
    castling: fields[1] ?? inferCastling(placed.board),
    ep: fields[2] ?? '-',
    halfmove: Number(fields[3] ?? 0),
    fullmove: Math.max(1, Number(fields[4] ?? 1))
  });

  const { snaps, rest } = playTokens(base, moveTokens(words.slice(k).join(' ')));
  const orphans = [...placed.orphans, ...rest];
  return {
    snaps: withOrphans([{ fen: base }, ...snaps], orphans),
    orphans,
    problem: placed.problem ?? (rest.length ? moveProblem(rest[0]) : null),
    structural: placed.structural
  };
}

function withOrphans(snaps: ChessSnapshot[], orphans: string[]): ChessSnapshot[] {
  return orphans.length ? snaps.map((s) => ({ ...s, orphans })) : snaps;
}

/**
 * Reads the podklad text. A game is played from the initial position, or from `altBase`
 * (the board it continues) when more of its moves can be played there, or when none
 * can be played anywhere yet (a move still being typed keeps the board where it was).
 */
export function parseChessNotation(text: string, altBase?: string | null): ChessNotation {
  const first = text.trim().split(/\s+/)[0] ?? '';
  if (!first) return { snaps: [{ fen: EMPTY_FEN }], orphans: [], problem: null, structural: null };
  if (first.includes('/') && !RESULT.test(first)) return parseFenText(text);

  const tokens = moveTokens(text);
  let best = { base: START_FEN, ...playTokens(START_FEN, tokens) };
  if (altBase && altBase !== START_FEN) {
    const alt = playTokens(altBase, tokens);
    if (alt.snaps.length > best.snaps.length || !best.snaps.length) best = { base: altBase, ...alt };
  }
  return {
    snaps: withOrphans([{ fen: best.base }, ...best.snaps], best.rest),
    orphans: best.rest,
    problem: best.rest.length ? moveProblem(best.rest[0]) : null,
    structural: null
  };
}

// ─── Writing ───────────────────────────────────────────────

/** Numbered Czech SAN from a position: `1. e4 e5 2. Jf3`, or `5… Jf6 6. Dxf7#`. */
export function formatMoves(baseFen: string, sans: string[]): string {
  const { turn, fullmove } = parseFen(baseFen);
  let n = fullmove;
  let white = turn === 'w';
  return sans
    .map((san, i) => {
      const cz = toCzechSan(san);
      const word = white ? `${n}. ${cz}` : i === 0 ? `${n}… ${cz}` : cz;
      if (!white) n++;
      white = !white;
      return word;
    })
    .join(' ');
}

/**
 * Text of a board state: the moves of the game when it was reached by moves (with the
 * starting FEN unless it is the initial position), otherwise its FEN; the empty board
 * is an empty text. Orphans follow at the end.
 */
export function serializeChessNotation(baseFen: string, sans: string[], orphans: string[] = []): string {
  const parts: string[] = [];
  if (sans.length) {
    if (baseFen !== START_FEN) parts.push(baseFen);
    parts.push(formatMoves(baseFen, sans));
  } else if (baseFen !== EMPTY_FEN || orphans.length) {
    parts.push(baseFen);
  }
  return [...parts, ...orphans].join(' ');
}

/** First history index of the run of moves that leads to `cursor`. */
export function runBase(history: ChessSnapshot[], cursor: number): number {
  let base = cursor;
  while (base > 0 && history[base].san) base--;
  return base;
}

export function chessNotationAt(history: ChessSnapshot[], cursor: number): string {
  const base = runBase(history, cursor);
  const sans = history.slice(base + 1, cursor + 1).map((s) => s.san!);
  return serializeChessNotation(history[base].fen, sans, history[cursor].orphans);
}

export function sameOrphans(a: string[] = [], b: string[] = []): boolean {
  return a.length === b.length && a.every((x, i) => x === b[i]);
}
