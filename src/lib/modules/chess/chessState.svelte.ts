import { Chess, type Move } from 'chess.js';
import ChessWorker from './chess.worker.ts?worker';
import type { ChessWorkerRequest, ChessWorkerResponse } from './chess.worker';
import type { MateMove, SolvePhase, SolveReport } from './chessSolver';
import {
  START_FEN,
  EMPTY_FEN,
  type Board,
  type Color,
  type PieceChar,
  buildFen,
  inferCastling,
  parseFen,
  pieceColor,
  positionProblem,
  pseudoTargets,
  squareIndex,
  squareName,
  toCzechSan
} from './chessData';
import {
  chessNotationAt,
  parseChessNotation,
  playMoves,
  runBase,
  sameOrphans,
  type ChessNotation,
  type ChessSnapshot
} from './chessNotation';
import { settings } from '../../state/settings.svelte';
import { toast } from '../../state/toast.svelte';
import { localSettingsService } from '../../services/localSettingsService';

export type ChessMode = 'free' | 'rules';
export type TrayTool = PieceChar | 'erase';

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
  phase: SolvePhase;
  /** Mate length being searched right now. */
  depth: number;
  done: number;
  total: number;
  /** Interim (checks-only) report while running, the final one when done. */
  report: SolveReport | null;
}

export interface StripItem {
  index: number;
  label: string;
}

/** One stretch of podklad editing: every keystroke is read again against the same start. */
interface EditSession {
  history: ChessSnapshot[];
  cursor: number;
  /** The board a typed game may continue. */
  altBase: string;
}

const modSettings = localSettingsService.forModule('chess');
const LEGACY_STORAGE_KEY = 'samuel_module_chess_v1';
const MAX_HISTORY = 300;
const STORED_HISTORY = 200;
const DRAG_THRESHOLD = 6;

const sideName = (color: Color) => (color === 'w' ? 'bílý' : 'černý');

class ChessModuleState {
  history = $state<ChessSnapshot[]>([{ fen: START_FEN }]);
  cursor = $state(0);
  mode = $state<ChessMode>('free');
  flipped = $state(false);
  showCoords = $state(true);
  showHints = $state(true);

  /** Podklad text exactly as typed, while the board still shows its result. */
  rawText = $state<string | null>(null);
  private rawAltBase: string | null = null;
  private rawParse = $state.raw<ChessNotation | null>(null);
  private session: EditSession | null = null;

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
  isEmpty = $derived(!this.board.some(Boolean));
  canUndo = $derived(this.cursor > 0);
  canRedo = $derived(this.cursor < this.history.length - 1);

  /** The podklad text: as typed, or written from the board once the board changed it. */
  notation = $derived(this.rawText ?? chessNotationAt(this.history, this.cursor));
  /** Pieces of the text the board cannot show. */
  orphans = $derived(this.current.orphans ?? []);

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
    const base = runBase(this.history, this.cursor);
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

  /** What keeps the board from showing the whole text (bar warning). */
  notationWarning = $derived.by(() => {
    if (this.orphans.length) return `Neplatné části zápisu: ${this.orphans.length}`;
    return this.rawParse?.structural ?? null;
  });

  /** Why the podklad needs a look: its text first, then a position that cannot be played. */
  attention = $derived.by(() => {
    if (this.rawParse?.problem) return this.rawParse.problem;
    if (this.orphans.length) return `Nejde přečíst: ${this.orphans.join(' ')}`;
    if (this.rawParse?.structural) return this.rawParse.structural;
    // An empty board is a deliberate start; a half-built one that cannot be played needs a look
    return this.isEmpty ? null : positionProblem(this.current.fen);
  });

  /** Bar status: the side to move, check or the end of the game, or the mate search. */
  status = $derived.by(() => {
    if (this.mode === 'free') {
      return (this.isEmpty ? null : positionProblem(this.current.fen)) ?? `Na tahu ${sideName(this.turn)}`;
    }
    if (this.gameOver === 'mate') return `Mat, vyhrál ${sideName(this.turn === 'w' ? 'b' : 'w')}`;
    if (this.gameOver === 'stalemate') return 'Pat, remíza';
    return (
      solverStatus(this.solverHere) ??
      `Na tahu ${sideName(this.turn)}${this.checkSquare !== null ? ', šach' : ''}`
    );
  });

  constructor() {
    this.loadFromStorage();
  }

  // ─── Persistence ─────────────────────────────────────────

  private loadFromStorage() {
    migrateLegacyStorage();
    const history = modSettings.getJSON<ChessSnapshot[]>('history', []);
    if (Array.isArray(history)) {
      const valid = history.filter((s) => typeof s?.fen === 'string');
      if (valid.length) {
        this.history = valid;
        this.cursor = Math.min(Math.max(0, modSettings.getNumber('cursor', 0)), valid.length - 1);
      }
    }
    if (modSettings.getString('mode', 'free') === 'rules' && !positionProblem(this.current.fen)) {
      this.mode = 'rules';
    }
    this.flipped = modSettings.getBoolean('flipped', false);
    this.showCoords = modSettings.getBoolean('show_coords', true);
    this.showHints = modSettings.getBoolean('show_hints', true);

    // The typed text survives a reload as long as the board still shows its result
    const rawText = modSettings.get<string | null>('raw_text', null);
    if (typeof rawText === 'string' && this.cursor === this.history.length - 1) {
      const altBase = modSettings.get<string | null>('raw_alt_base', null);
      const parsed = parseChessNotation(rawText, altBase);
      if (parsed.snaps[parsed.snaps.length - 1].fen === this.current.fen) {
        this.rawText = rawText;
        this.rawAltBase = altBase;
        this.rawParse = parsed;
      }
    }
  }

  saveToStorage() {
    const drop = Math.max(0, this.history.length - STORED_HISTORY);
    modSettings.update({
      history: this.history.slice(drop),
      cursor: Math.max(0, this.cursor - drop),
      mode: this.mode,
      flipped: this.flipped,
      show_coords: this.showCoords,
      show_hints: this.showHints,
      raw_text: this.rawText,
      raw_alt_base: this.rawAltBase
    });
  }

  // ─── History ─────────────────────────────────────────────

  /** A change made on the board: the podklad text is written from the board from now on. */
  private push(...snaps: ChessSnapshot[]) {
    // Pieces of the text the board cannot show stay with every later position
    const inherited = this.current.orphans;
    let history = this.history.slice(0, this.cursor + 1);
    for (const snap of snaps) {
      const next: ChessSnapshot = { ...snap, orphans: snap.orphans ?? inherited };
      if (!next.orphans?.length) delete next.orphans;
      const last = history[history.length - 1];
      if (next.fen === last?.fen && !next.san && sameOrphans(next.orphans, last.orphans)) continue;
      history.push(next);
    }
    if (history.length > MAX_HISTORY) history = history.slice(-MAX_HISTORY);
    this.history = history;
    this.cursor = history.length - 1;
    this.selected = null;
    this.pendingPromotion = null;
    this.endEditSession();
    this.saveToStorage();
  }

  private endEditSession() {
    this.session = null;
    this.rawText = null;
    this.rawAltBase = null;
    this.rawParse = null;
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
    this.endEditSession();
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

  /** Empties the board and drops the unreadable text with it; Zpět brings both back. */
  clearBoard() {
    this.armed = null;
    this.push({ fen: EMPTY_FEN, orphans: [] });
    this.mode = 'free';
    this.saveToStorage();
  }

  /** Data and Menu options back to defaults; the chosen mode is a variant and stays. */
  resetModule() {
    this.cancelSolve();
    this.solver = null;
    this.endEditSession();
    this.history = [{ fen: START_FEN }];
    this.cursor = 0;
    this.armed = null;
    this.selected = null;
    this.pendingPromotion = null;
    this.flipped = false;
    this.showCoords = true;
    this.showHints = true;
    this.saveToStorage();
  }

  /**
   * Podklad edit, called on every keystroke: the board shows the text at once. All edits
   * of one stretch replace each other, so typing does not pile up undo steps.
   */
  importNotation(text: string) {
    if (!this.session) {
      this.session = {
        history: this.history,
        cursor: this.cursor,
        altBase: this.rawText !== null && this.rawAltBase ? this.rawAltBase : this.current.fen
      };
    }
    const { history: origin, cursor: anchor, altBase } = this.session;
    const parsed = parseChessNotation(text, altBase);
    const [first, ...moves] = parsed.snaps;

    let history: ChessSnapshot[];
    const base = runBase(origin, anchor);
    if (moves.length && first.fen === origin[base].fen) {
      // The text rewrites the game on the board: like a move played in the past, it replaces it
      history = [...origin.slice(0, base), ...parsed.snaps];
    } else {
      history = origin.slice(0, anchor + 1);
      const last = history[history.length - 1];
      const unchanged = first.fen === last.fen && (moves.length > 0 || sameOrphans(first.orphans, last.orphans));
      history.push(...(unchanged ? moves : parsed.snaps));
    }
    if (history.length > MAX_HISTORY) history = history.slice(-MAX_HISTORY);

    this.history = history;
    this.cursor = history.length - 1;
    this.selected = null;
    this.pendingPromotion = null;
    this.rawText = text;
    this.rawAltBase = altBase;
    this.rawParse = parsed;
    if (moves.length && this.mode !== 'rules') {
      this.mode = 'rules';
      this.armed = null;
    }
    if (this.mode === 'rules' && positionProblem(this.current.fen)) this.mode = 'free';
    this.saveToStorage();
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
   * into a drag of the piece; releasing without movement counts as a tap. A tray key
   * is a Keycap that already vibrated on the press.
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
        if (source !== 'tray') settings.vibrate(30);
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
        if (source === 'tray') {
          this.tapTray(tool!);
        } else {
          settings.vibrate(30);
          this.tapSquare(source);
        }
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
    const id = ++this.solveId;
    this.worker?.terminate();
    this.worker = new ChessWorker();
    this.solver = { status: 'running', fen, phase: 'full', depth: 1, done: 0, total: 0, report: null };

    this.worker.onmessage = (e: MessageEvent<ChessWorkerResponse>) => {
      const msg = e.data;
      if (msg.id !== id || !this.solver) return;
      if (msg.type === 'progress') {
        const { phase, depth, done, total } = msg;
        this.solver = { ...this.solver, phase, depth, done, total };
      } else if (msg.type === 'interim') {
        this.solver = { ...this.solver, report: msg.report };
      } else {
        this.solver = { ...this.solver, status: 'done', report: msg.report };
        this.worker?.terminate();
        this.worker = null;
      }
    };
    this.worker.onerror = () => {
      this.cancelSolve();
      toast.show('Řešič selhal', 'danger');
    };
    this.worker.postMessage({ id, fen } satisfies ChessWorkerRequest);
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

/** What the mate search is doing, or what it found or ruled out (bar status, ≤ 38 chars). */
function solverStatus(solver: SolverState | null): string | null {
  if (!solver) return null;
  const report = solver.report;
  if (solver.status === 'running') {
    if (report?.result) return `Ověřuji kratší: mat v ${solver.depth}…`;
    if (solver.phase === 'checks') return `Zkouším šachy: mat v ${solver.depth}…`;
    return `Hledám mat v ${solver.depth}… ${solver.done}/${solver.total}`;
  }
  if (!report) return null;
  const limit = report.timedOut ? ' · limit 60 s' : '';
  if (!report.result) return (report.ruledOut ? `Mat do ${report.ruledOut} není` : 'Mat nenalezen') + limit;
  const { depth, solutions } = report.result;
  if (!report.shortest) return `Mat v ${depth}, kratší neověřen${limit}`;
  return `Nalezen mat v ${depth}${solutions.length > 1 ? ` · ${solutions.length} řešení` : ''}`;
}

/** One-time move of the old own localStorage key into the module settings. */
function migrateLegacyStorage() {
  if (typeof localStorage === 'undefined' || modSettings.has('history')) return;
  try {
    const raw = localStorage.getItem(LEGACY_STORAGE_KEY);
    if (!raw) return;
    const data = JSON.parse(raw);
    modSettings.update({
      history: data.history,
      cursor: data.cursor,
      mode: data.mode,
      flipped: data.flipped,
      show_coords: data.showCoords,
      show_hints: data.showHints
    });
    localStorage.removeItem(LEGACY_STORAGE_KEY);
  } catch (e) {
    console.warn('Failed to move chess state from the old storage key:', e);
  }
}

export const chessState = new ChessModuleState();
