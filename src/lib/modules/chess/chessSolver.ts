import { Chess, type Move } from 'chess.js';

export interface MateMove {
  from: string;
  to: string;
  promotion?: string;
  san: string;
}

/** Key move plus the whole mating line (defence = longest resistance). */
export interface MateSolution extends MateMove {
  line: MateMove[];
}

export interface MateResult {
  /** Mate length in moves of the side to move. */
  depth: number;
  solutions: MateSolution[];
}

export interface SolveReport {
  /** Best mate known so far; null when none was found. */
  result: MateResult | null;
  /** No shorter mate exists than the result. */
  shortest: boolean;
  /** The full search proved there is no mate up to this many moves. */
  ruledOut: number;
  timedOut: boolean;
}

export type SolvePhase = 'checks' | 'full';
export type SolveProgress = (phase: SolvePhase, depth: number, done: number, total: number) => void;

export interface SolveOptions {
  timeLimitMs?: number;
  checksLimitMs?: number;
  onProgress?: SolveProgress;
  /** Called once a mate is found by the quick checks-only pass, before it is verified. */
  onInterim?: (report: SolveReport) => void;
}

const QUICK_FULL_DEPTH = 2;
const CHECKS_MAX_DEPTH = 12;
const FULL_MAX_DEPTH = 30;

/*
 * Inner nodes run on chess.js internals: the public move list builds SAN for every
 * move (a make/undo plus a mate test each), which made mate in 3 roughly 10× slower.
 * The internals are stable within the pinned chess.js version (see package.json).
 */
interface RawMove {
  captured?: string;
  piece: string;
}

interface ChessInternals {
  _moves(): RawMove[];
  _makeMove(move: RawMove): void;
  _undoMove(): void;
  isCheck(): boolean;
}

// Search mode shared by the recursion (the solver runs alone in its worker).
let checksOnly = false;
let deadline = Infinity;
let nodes = 0;

class SearchTimeout extends Error {}

function tick() {
  if ((++nodes & 1023) === 0 && performance.now() > deadline) throw new SearchTimeout();
}

/** Side to move forces mate within `n` of its moves (only checking moves when `checksOnly`). */
function attackerMates(g: ChessInternals, n: number): boolean {
  tick();
  const moves = g._moves();
  const checks: RawMove[] = [];
  const quiet: RawMove[] = [];

  // First pass: find an immediate mate and sort the rest into checks / quiet moves.
  for (const m of moves) {
    g._makeMove(m);
    const check = g.isCheck();
    const mate = check && g._moves().length === 0;
    g._undoMove();
    if (mate) return true;
    if (n > 1) (check ? checks : quiet).push(m);
  }
  if (n === 1) return false;

  quiet.sort((a, b) => (b.captured ? 1 : 0) - (a.captured ? 1 : 0));
  for (const list of checksOnly ? [checks] : [checks, quiet]) {
    for (const m of list) {
      g._makeMove(m);
      const ok = defenderLoses(g, n - 1);
      g._undoMove();
      if (ok) return true;
    }
  }
  return false;
}

/** Every reply of the side to move still allows mate within `n` attacker moves. */
function defenderLoses(g: ChessInternals, n: number): boolean {
  tick();
  const replies = g._moves();
  if (replies.length === 0) return g.isCheck(); // stalemate is no win

  // Likely refutations first: king moves and captures.
  const score = (m: RawMove) => (m.piece === 'k' ? 2 : 0) + (m.captured ? 1 : 0);
  replies.sort((a, b) => score(b) - score(a));

  for (const r of replies) {
    g._makeMove(r);
    const ok = attackerMates(g, n);
    g._undoMove();
    if (!ok) return false;
  }
  return true;
}

function toMateMove(m: Move): MateMove {
  return { from: m.from, to: m.to, promotion: m.promotion, san: m.san };
}

/** Shortest forced mate (attacker to move) within `maxN` moves, or null. */
function shortestMate(g: ChessInternals, maxN: number): number | null {
  for (let n = 1; n <= maxN; n++) if (attackerMates(g, n)) return n;
  return null;
}

/**
 * Plays out one representative line after a key move that mates within `depth`:
 * the defender picks the reply that delays mate longest, the attacker then mates
 * as fast as possible. Other defences lose too, just no later.
 */
function mateLine(game: Chess, key: Move, depth: number): MateMove[] {
  const g = game as unknown as ChessInternals;
  const line: MateMove[] = [toMateMove(key)];
  game.move(key);
  let plies = 1;
  let left = depth - 1;

  while (left > 0 && !game.isCheckmate()) {
    let reply: Move | null = null;
    let longest = 0;
    for (const r of game.moves({ verbose: true })) {
      game.move(r);
      const d = shortestMate(g, left) ?? left;
      game.undo();
      if (d > longest) {
        longest = d;
        reply = r;
      }
    }
    if (!reply) break;
    game.move(reply);
    line.push(toMateMove(reply));
    plies++;

    const mating = game.moves({ verbose: true }).find((m) => {
      if (longest === 1) return m.san.endsWith('#');
      if (checksOnly && !m.san.endsWith('+')) return false;
      game.move(m);
      const ok = defenderLoses(g, longest - 1);
      game.undo();
      return ok;
    });
    if (!mating) break;
    game.move(mating);
    line.push(toMateMove(mating));
    plies++;
    left = longest - 1;
  }

  for (let i = 0; i < plies; i++) game.undo();
  return line;
}

/** Key moves forcing mate within exactly `depth` (shorter mates were ruled out before). */
function keyMoves(game: Chess, roots: Move[], depth: number, phase: SolvePhase, onProgress?: SolveProgress) {
  const g = game as unknown as ChessInternals;
  const keys: Move[] = [];
  roots.forEach((m, i) => {
    onProgress?.(phase, depth, i, roots.length);
    let ok = m.san.endsWith('#');
    if (!ok && depth > 1) {
      game.move(m);
      try {
        ok = defenderLoses(g, depth - 1);
      } finally {
        game.undo();
      }
    }
    if (ok) keys.push(m);
  });
  return keys;
}

function buildResult(game: Chess, keys: Move[], depth: number): MateResult {
  // Lines are cheap next to the search; finish them even past the deadline.
  const saved = deadline;
  deadline = Infinity;
  const solutions = keys.map((m) => ({ ...toMateMove(m), line: mateLine(game, m, depth) }));
  deadline = saved;
  return { depth, solutions };
}

/** Full search for mates of `from…to` moves; stops at the first length that mates. */
function fullSearch(fen: string, from: number, to: number, onProgress?: SolveProgress) {
  checksOnly = false;
  // Fresh game per pass: a timeout leaves the internal move stack mid-search.
  const game = new Chess(fen);
  const roots = game.moves({ verbose: true });
  for (let depth = from; depth <= to && roots.length; depth++) {
    const keys = keyMoves(game, roots, depth, 'full', onProgress);
    if (keys.length) return { found: buildResult(game, keys, depth), ruledOut: depth - 1 };
  }
  return { found: null, ruledOut: to };
}

/**
 * Shortest mate first, in three passes:
 * 1. full search up to mate in 2 – cheap even in a busy middlegame;
 * 2. checks only – most puzzle mates are forcing, this goes deep in a fraction of a second;
 * 3. full search by increasing length until a shorter mate than the checks-only one
 *    is ruled out (quiet key moves of the same length are not looked for).
 * Stops at the time limit and keeps whatever it has.
 */
export function solveMate(fen: string, options: SolveOptions = {}): SolveReport {
  const { timeLimitMs = 60_000, checksLimitMs = 5_000, onProgress, onInterim } = options;
  const start = performance.now();
  nodes = 0;
  let ruledOut = 0;

  // Full-search progress at length n means all shorter lengths are already ruled out.
  const trackFull: SolveProgress = (phase, depth, done, total) => {
    ruledOut = depth - 1;
    onProgress?.(phase, depth, done, total);
  };

  const timedOut = (result: MateResult | null): SolveReport => ({
    result,
    shortest: !!result && ruledOut >= result.depth - 1,
    ruledOut,
    timedOut: true
  });

  // 1. Short mates, quiet keys included
  deadline = start + timeLimitMs;
  try {
    const quick = fullSearch(fen, 1, QUICK_FULL_DEPTH, trackFull);
    ruledOut = quick.ruledOut;
    if (quick.found) return { result: quick.found, shortest: true, ruledOut, timedOut: false };
  } catch (e) {
    if (!(e instanceof SearchTimeout)) throw e;
    return timedOut(null);
  }

  // 2. Checks only
  let best: MateResult | null = null;
  checksOnly = true;
  deadline = start + Math.min(checksLimitMs, timeLimitMs);
  const checksGame = new Chess(fen);
  const checkRoots = checksGame
    .moves({ verbose: true })
    .filter((m) => m.san.endsWith('+') || m.san.endsWith('#'));
  try {
    for (let depth = ruledOut + 1; depth <= CHECKS_MAX_DEPTH && checkRoots.length; depth++) {
      const keys = keyMoves(checksGame, checkRoots, depth, 'checks', onProgress);
      if (keys.length) {
        best = buildResult(checksGame, keys, depth);
        break;
      }
    }
  } catch (e) {
    if (!(e instanceof SearchTimeout)) throw e;
  }

  if (best && ruledOut >= best.depth - 1) {
    return { result: best, shortest: true, ruledOut, timedOut: false };
  }
  if (best) onInterim?.({ result: best, shortest: false, ruledOut, timedOut: false });

  // 3. Full search below the checks-only mate (or as deep as time allows)
  deadline = start + timeLimitMs;
  try {
    const full = fullSearch(fen, ruledOut + 1, best ? best.depth - 1 : FULL_MAX_DEPTH, trackFull);
    ruledOut = full.ruledOut;
    const result = full.found ?? best;
    return { result, shortest: !!result, ruledOut, timedOut: false };
  } catch (e) {
    if (!(e instanceof SearchTimeout)) throw e;
    return timedOut(best);
  }
}
