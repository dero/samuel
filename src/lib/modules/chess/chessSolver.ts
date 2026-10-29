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
  /** Shortest mate found (in moves of the side to move), null when none up to maxDepth. */
  depth: number | null;
  solutions: MateSolution[];
}

export type MateProgress = (depth: number, done: number, total: number) => void;

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

/** Side to move forces mate within `n` of its moves. */
function attackerMates(g: ChessInternals, n: number): boolean {
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
  for (const list of [checks, quiet]) {
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

/** Finds all key moves of the shortest forced mate (1…maxDepth) for the side to move. */
export function findMates(fen: string, maxDepth: number, onProgress?: MateProgress): MateResult {
  const game = new Chess(fen);
  const g = game as unknown as ChessInternals;
  const roots = game.moves({ verbose: true });

  for (let depth = 1; depth <= maxDepth; depth++) {
    const keys: Move[] = [];
    roots.forEach((m, i) => {
      onProgress?.(depth, i, roots.length);
      let ok = m.san.endsWith('#');
      if (!ok && depth > 1) {
        game.move(m);
        ok = defenderLoses(g, depth - 1);
        game.undo();
      }
      if (ok) keys.push(m);
    });
    if (keys.length) {
      const solutions = keys.map((m) => ({ ...toMateMove(m), line: mateLine(game, m, depth) }));
      return { depth, solutions };
    }
  }
  return { depth: null, solutions: [] };
}
