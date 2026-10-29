import { Chess, type Move } from 'chess.js';
import ChessWorker from './chess.worker.ts?worker';
import type { ChessWorkerRequest, ChessWorkerResponse } from './chess.worker';
import type { MateMove, MateResult } from './chessSolver';
import {
  START_FEN,
  EMPTY_FEN,
  type Board,
  type PieceChar,
  buildFen,
  inferCastling,
  normalizeFen,
  parseFen,
  pieceColor,
  positionProblem,
  pseudoTargets,
  squareIndex,
  squareName,
  toCzechSan,
  tokenizeMoves
} from './chessData';
import { settings } from '../../state/settings.svelte';
import { toast } from '../../state/toast.svelte';

export type ChessMode = 'free' | 'rules';
export type TrayTool = PieceChar | 'erase';

/** One step of the undo history. `san` marks a legal move played in the rules mode. */
export interface ChessSnapshot {
  fen: string;
  san?: string;
  from?: number;
  to?: number;
}

export interface DragState {
  piece: PieceChar;
  source: number | 'tray';
  x: number;
  y: number;
  /** Vertical offset of the lifted piece above the finger (0 for a mouse). */
  lift: number;
  size: number;
  target: number | null;
  overRemove: boolean;
}

export interface SolverState {
  status: 'running' | 'done';
  fen: string;
  depth: number;
  progressDepth: number;
  done: number;
  total: number;
  result: MateResult | null;
}

export interface StripItem {
  index: number;
  label: string;
}

const STORAGE_KEY = 'samuel_module_chess_v1';
const MAX_HISTORY = 300;
const STORED_HISTORY = 200;
const DRAG_THRESHOLD = 6;

class ChessModuleState {
  history = $state<ChessSnapshot[]>([{ fen: START_FEN }]);
  cursor = $state(0);
  mode = $state<ChessMode>('free');
  flipped = $state(false);
  showCoords = $state(true);
  showHints = $state(true);
  mateDepth = $state(2);

  // --- Ephemeral interaction state ---
  armed = $state<TrayTool | null>(null);
  selected = $state<number | null>(null);
  pendingPromotion = $state<{ from: number; to: number } | null>(null);
  flashSquare = $state<number | null>(null);
  drag = $state<DragState | null>(null);
  solver = $state<SolverState | null>(null);

  /** DOM anchors for hit-testing while dragging (not reactive). */
  boardEl: HTMLElement | null = null;
  removeZoneEl: HTMLElement | null = null;

  private worker: Worker | null = null;
  private solveId = 0;
  private flashTimer: ReturnType<typeof setTimeout> | null = null;

  current = $derived(this.history[this.cursor] ?? { fen: START_FEN });
  parts = $derived(parseFen(this.current.fen));
  board = $derived(this.parts.board);
  turn = $derived(this.parts.turn);
  canUndo = $derived(this.cursor > 0);
  canRedo = $derived(this.cursor < this.history.length - 1);

  /** chess.js game of the current position; only in the rules mode (position is valid there). */
  game = $derived.by(() => {
    if (this.mode !== 'rules') return null;
    try {
      return new Chess(this.current.fen);
    } catch {
      return null;
    }
  });

  checkSquare = $derived.by(() => {
    if (!this.game?.inCheck()) return null;
    return this.board.indexOf(this.turn === 'w' ? 'K' : 'k');
  });

  gameOver = $derived.by((): 'mate' | 'stalemate' | null => {
    if (!this.game) return null;
    if (this.game.isCheckmate()) return 'mate';
    if (this.game.isStalemate()) return 'stalemate';
    return null;
  });

  /** Square whose move targets are shown: the dragged or the selected piece. */
  private focusSquare = $derived(
    this.drag && typeof this.drag.source === 'number' ? this.drag.source : this.selected
  );

  targets = $derived.by((): number[] => {
    const from = this.focusSquare;
    if (from === null || !this.board[from]) return [];
    if (this.mode === 'rules') {
      if (!this.game) return [];
      return this.game
        .moves({ square: squareName(from) as never, verbose: true })
        .map((m) => squareIndex(m.to));
    }
    return this.showHints ? pseudoTargets(this.board, from) : [];
  });

  /** Moves around the cursor: from the last non-move snapshot up to the end of that run. */
  strip = $derived.by((): { base: number; items: StripItem[] } => {
    let base = this.cursor;
    while (base > 0 && this.history[base].san) base--;
    let end = base;
    while (end + 1 < this.history.length && this.history[end + 1].san) end++;

    const items: StripItem[] = [];
    for (let j = base + 1; j <= end; j++) {
      const prev = parseFen(this.history[j - 1].fen);
      const san = toCzechSan(this.history[j].san!);
      const label =
        prev.turn === 'w'
          ? `${prev.fullmove}. ${san}`
          : j === base + 1
            ? `${prev.fullmove}… ${san}`
            : san;
      items.push({ index: j, label });
    }
    return { base, items };
  });

  /** Solver output belongs to the position it was computed for. */
  solverHere = $derived(this.solver && this.solver.fen === this.current.fen ? this.solver : null);

  constructor() {
    this.loadFromStorage();
  }

  // ─── Persistence ─────────────────────────────────────────

  private loadFromStorage() {
    if (typeof localStorage === 'undefined') return;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const data = JSON.parse(raw);
      if (Array.isArray(data.history) && data.history.length) {
        this.history = data.history.filter((s: ChessSnapshot) => typeof s?.fen === 'string');
        this.cursor = Math.min(Math.max(0, Number(data.cursor) || 0), this.history.length - 1);
      }
      if (data.mode === 'rules' && !positionProblem(this.current.fen)) this.mode = 'rules';
      if (typeof data.flipped === 'boolean') this.flipped = data.flipped;
      if (typeof data.showCoords === 'boolean') this.showCoords = data.showCoords;
      if (typeof data.showHints === 'boolean') this.showHints = data.showHints;
      if ([1, 2, 3].includes(data.mateDepth)) this.mateDepth = data.mateDepth;
    } catch (e) {
      console.warn('Failed to load chess state from storage:', e);
    }
  }

  saveToStorage() {
    if (typeof localStorage === 'undefined') return;
    try {
      const drop = Math.max(0, this.history.length - STORED_HISTORY);
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          history: this.history.slice(drop),
          cursor: Math.max(0, this.cursor - drop),
          mode: this.mode,
          flipped: this.flipped,
          showCoords: this.showCoords,
          showHints: this.showHints,
          mateDepth: this.mateDepth
        })
      );
    } catch {}
  }

  // ─── History ─────────────────────────────────────────────

  private push(...snaps: ChessSnapshot[]) {
    let history = this.history.slice(0, this.cursor + 1);
    for (const snap of snaps) {
      if (snap.fen === history[history.length - 1]?.fen && !snap.san) continue;
      history.push(snap);
    }
    if (history.length > MAX_HISTORY) history = history.slice(-MAX_HISTORY);
    this.history = history;
    this.cursor = history.length - 1;
    this.selected = null;
    this.pendingPromotion = null;
    this.saveToStorage();
  }

  private pushBoard(board: Board, from?: number, to?: number) {
    const fen = buildFen({
      ...this.parts,
      board,
      castling: inferCastling(board),
      ep: '-',
      halfmove: 0
    });
    this.push({ fen, from, to });
  }

  jumpTo(index: number) {
    if (index < 0 || index >= this.history.length || index === this.cursor) return;
    this.cursor = index;
    this.selected = null;
    this.pendingPromotion = null;
    if (this.mode === 'rules' && positionProblem(this.current.fen)) {
      this.mode = 'free';
      toast.show('Pozice neplatí, režim Volně', 'info');
    }
    this.saveToStorage();
  }

  undo() {
    this.jumpTo(this.cursor - 1);
  }

  redo() {
    this.jumpTo(this.cursor + 1);
  }

  // ─── Modes & whole-board actions ─────────────────────────

  setMode(mode: ChessMode): boolean {
    if (mode === this.mode) return true;
    if (mode === 'rules') {
      const problem = positionProblem(this.current.fen);
      if (problem) {
        toast.show(problem, 'warning');
        return false;
      }
    }
    this.mode = mode;
    this.armed = null;
    this.selected = null;
    this.pendingPromotion = null;
    this.saveToStorage();
    return true;
  }

  toggleTurn() {
    const fen = buildFen({ ...this.parts, turn: this.turn === 'w' ? 'b' : 'w', ep: '-' });
    const problem = positionProblem(fen);
    if (problem) {
      toast.show(problem, 'warning');
      return;
    }
    this.push({ fen });
  }

  loadPosition(fen: string) {
    this.push({ fen });
    if (this.mode === 'rules' && positionProblem(fen)) this.mode = 'free';
    this.saveToStorage();
  }

  clearBoard() {
    this.armed = null;
    this.loadPosition(EMPTY_FEN);
  }

  resetModule() {
    this.cancelSolve();
    this.solver = null;
    this.history = [{ fen: START_FEN }];
    this.cursor = 0;
    this.mode = 'free';
    this.armed = null;
    this.selected = null;
    this.pendingPromotion = null;
    this.saveToStorage();
  }

  /** Pasted text: a FEN (also placement only) or a game in Czech / English notation. */
  importText(text: string) {
    if (!text.trim()) return;
    const fen = normalizeFen(text);
    if (fen) {
      this.loadPosition(fen);
      toast.show('Pozice načtena', 'success');
      return;
    }

    const tokens = tokenizeMoves(text);
    if (!tokens.length) {
      toast.show('Zápis nerozpoznán', 'warning');
      return;
    }

    // Games usually start from the initial position; moves continuing the board are accepted too.
    const bases = [START_FEN];
    if (!positionProblem(this.current.fen)) bases.push(this.current.fen);
    let best: { base: string; snaps: ChessSnapshot[] } = { base: START_FEN, snaps: [] };
    for (const base of bases) {
      const snaps = playMoves(base, tokens);
      if (snaps.length > best.snaps.length) best = { base, snaps };
    }

    if (!best.snaps.length) {
      toast.show('Tahy nejdou zahrát', 'warning');
      return;
    }
    this.mode = 'rules';
    this.armed = null;
    this.push({ fen: best.base }, ...best.snaps);
    if (best.snaps.length < tokens.length) {
      toast.show(`Stop u tahu ${tokens[best.snaps.length]}`.slice(0, 30), 'warning');
    } else {
      toast.show(`Načteno ${best.snaps.length} tahů`, 'success');
    }
  }

  // ─── Editing primitives ──────────────────────────────────

  private place(square: number, piece: PieceChar) {
    const board = [...this.board];
    board[square] = piece;
    this.pushBoard(board, undefined, square);
  }

  private remove(square: number) {
    const board = [...this.board];
    board[square] = null;
    this.pushBoard(board, square, undefined);
  }

  private moveFree(from: number, to: number) {
    const board = [...this.board];
    board[to] = board[from];
    board[from] = null;
    this.pushBoard(board, from, to);
  }

  private legalMoves(from: number, to: number): Move[] {
    if (!this.game) return [];
    return this.game
      .moves({ square: squareName(from) as never, verbose: true })
      .filter((m) => m.to === squareName(to));
  }

  private tryRulesMove(from: number, to: number): boolean {
    const moves = this.legalMoves(from, to);
    if (!moves.length) {
      this.flash(to);
      return false;
    }
    if (moves.some((m) => m.promotion)) {
      this.pendingPromotion = { from, to };
      this.selected = null;
      return true;
    }
    this.commitRulesMove(from, to);
    return true;
  }

  commitRulesMove(from: number, to: number, promotion?: string) {
    const game = new Chess(this.current.fen);
    try {
      const move = game.move({ from: squareName(from), to: squareName(to), promotion });
      this.push({ fen: game.fen(), san: move.san, from, to });
    } catch {
      this.flash(to);
    }
  }

  cancelPromotion() {
    this.pendingPromotion = null;
  }

  private flash(square: number) {
    this.flashSquare = square;
    if (this.flashTimer) clearTimeout(this.flashTimer);
    this.flashTimer = setTimeout(() => (this.flashSquare = null), 380);
  }

  // ─── Taps ────────────────────────────────────────────────

  tapTray(tool: TrayTool) {
    this.armed = this.armed === tool ? null : tool;
    this.selected = null;
  }

  tapSquare(square: number) {
    if (this.pendingPromotion) {
      this.pendingPromotion = null;
      return;
    }
    const piece = this.board[square];
    const sel = this.selected;

    if (this.mode === 'free') {
      if (this.armed) {
        if (this.armed === 'erase' || piece === this.armed) {
          if (piece) this.remove(square);
        } else {
          this.place(square, this.armed);
        }
        return;
      }
      if (sel === null) {
        this.selected = piece ? square : null;
      } else if (sel === square) {
        this.selected = null;
      } else if (piece && this.board[sel] && pieceColor(piece) === pieceColor(this.board[sel]!)) {
        this.selected = square;
      } else if (this.board[sel]) {
        this.moveFree(sel, square);
      } else {
        this.selected = null;
      }
      return;
    }

    // Rules mode
    const own = !!piece && pieceColor(piece) === this.turn;
    if (sel === null || sel === square) {
      this.selected = sel === square || !own ? null : square;
    } else if (this.targets.includes(square)) {
      this.tryRulesMove(sel, square);
    } else if (own) {
      this.selected = square;
    } else {
      this.flash(square);
      this.selected = null;
    }
  }

  // ─── Pointer gestures (tap vs. drag) ─────────────────────

  squareAt(clientX: number, clientY: number): number | null {
    const rect = this.boardEl?.getBoundingClientRect();
    if (!rect || rect.width === 0) return null;
    const col = Math.floor(((clientX - rect.left) / rect.width) * 8);
    const row = Math.floor(((clientY - rect.top) / rect.height) * 8);
    if (col < 0 || col > 7 || row < 0 || row > 7) return null;
    return this.flipped ? (7 - row) * 8 + (7 - col) : row * 8 + col;
  }

  private overRemoveZone(clientX: number, clientY: number): boolean {
    const rect = this.removeZoneEl?.getBoundingClientRect();
    if (!rect) return false;
    return (
      clientX >= rect.left && clientX <= rect.right && clientY >= rect.top && clientY <= rect.bottom
    );
  }

  /**
   * Starts a press on a square or a tray key. Moving past a small threshold turns it
   * into a drag of the piece; releasing without movement counts as a tap.
   */
  press(e: PointerEvent, source: number | 'tray', tool?: TrayTool) {
    if (e.button > 0) return;
    e.preventDefault();

    const piece: PieceChar | null =
      source === 'tray' ? (tool && tool !== 'erase' ? tool : null) : this.board[source];
    const draggable =
      !!piece &&
      (source === 'tray' || this.mode === 'free' || pieceColor(piece) === this.turn);

    const startX = e.clientX;
    const startY = e.clientY;
    const squarePx = (this.boardEl?.getBoundingClientRect().width ?? 320) / 8;
    const touch = e.pointerType !== 'mouse';
    const fullLift = touch ? squarePx * 0.9 : 0;
    let dragging = false;
    let maxDist = 0;

    const update = (ev: PointerEvent) => {
      if (!this.drag) return;
      // The piece rises out from under the finger gradually (and never sinks back),
      // so a jittery tap cannot drop it one rank higher.
      maxDist = Math.max(maxDist, Math.hypot(ev.clientX - startX, ev.clientY - startY));
      const lift = fullLift * Math.min(1, Math.max(0, (maxDist - DRAG_THRESHOLD) / (squarePx * 0.75)));
      const target = this.squareAt(ev.clientX, ev.clientY - lift);
      this.drag = {
        ...this.drag,
        x: ev.clientX,
        y: ev.clientY,
        lift,
        target,
        overRemove: target === null && this.mode === 'free' && this.overRemoveZone(ev.clientX, ev.clientY)
      };
    };

    const onMove = (ev: PointerEvent) => {
      if (ev.pointerId !== e.pointerId) return;
      if (!dragging) {
        if (!draggable || Math.hypot(ev.clientX - startX, ev.clientY - startY) < DRAG_THRESHOLD) return;
        dragging = true;
        settings.vibrate(30);
        this.pendingPromotion = null;
        this.drag = {
          piece: piece!,
          source,
          x: ev.clientX,
          y: ev.clientY,
          lift: 0,
          size: squarePx * (touch ? 1.35 : 1),
          target: null,
          overRemove: false
        };
      }
      update(ev);
    };

    const finish = (ev: PointerEvent, cancelled: boolean) => {
      if (ev.pointerId !== e.pointerId) return;
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onCancel);

      if (!dragging) {
        if (cancelled) return;
        settings.vibrate(30);
        if (source === 'tray') this.tapTray(tool!);
        else this.tapSquare(source);
        return;
      }
      update(ev);
      const drag = this.drag!;
      this.drag = null;
      if (!cancelled) this.drop(drag);
    };
    const onUp = (ev: PointerEvent) => finish(ev, false);
    const onCancel = (ev: PointerEvent) => finish(ev, true);

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onCancel);
  }

  private drop({ piece, source, target, overRemove }: DragState) {
    if (this.mode === 'free') {
      if (target !== null) {
        if (source === 'tray') {
          if (this.board[target] !== piece) this.place(target, piece);
        } else if (target === source) {
          this.selected = source;
        } else {
          this.moveFree(source, target);
        }
        settings.vibrate(30);
      } else if (overRemove && source !== 'tray') {
        this.remove(source);
        settings.vibrate(30);
      }
      return;
    }

    if (source === 'tray' || target === null) return;
    if (target === source) {
      this.selected = source;
      return;
    }
    if (this.tryRulesMove(source, target)) settings.vibrate(30);
  }

  // ─── Solver ──────────────────────────────────────────────

  solve() {
    if (this.solver?.status === 'running') {
      this.cancelSolve();
      return;
    }
    if (!this.game || this.gameOver) return;

    const fen = this.current.fen;
    const depth = this.mateDepth;
    const id = ++this.solveId;
    this.worker?.terminate();
    this.worker = new ChessWorker();
    this.solver = { status: 'running', fen, depth, progressDepth: 1, done: 0, total: 0, result: null };

    this.worker.onmessage = (e: MessageEvent<ChessWorkerResponse>) => {
      const msg = e.data;
      if (msg.id !== id || !this.solver) return;
      if (msg.type === 'progress') {
        this.solver = { ...this.solver, progressDepth: msg.depth, done: msg.done, total: msg.total };
      } else {
        this.solver = { ...this.solver, status: 'done', result: msg.result };
        this.worker?.terminate();
        this.worker = null;
      }
    };
    this.worker.onerror = () => {
      this.cancelSolve();
      toast.show('Řešič selhal', 'danger');
    };
    this.worker.postMessage({ id, fen, depth } satisfies ChessWorkerRequest);
  }

  cancelSolve() {
    this.solveId++;
    this.worker?.terminate();
    this.worker = null;
    if (this.solver?.status === 'running') this.solver = null;
  }

  /** Plays the whole mating line; Zpět then steps back through it move by move. */
  playSolution(line: MateMove[]) {
    const snaps = playMoves(this.current.fen, line);
    if (snaps.length) this.push(...snaps);
  }
}

function playMoves(baseFen: string, moves: (string | MateMove)[]): ChessSnapshot[] {
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

export const chessState = new ChessModuleState();
