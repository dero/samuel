<script lang="ts">
  import { chessState } from './chessState.svelte';
  import { PIECE_SVG } from './chessPieces';
  import { isLightSquare, pieceColor, squareIndex, squareName, type PieceChar } from './chessData';
  import { settings } from '../../state/settings.svelte';

  let wrapperEl = $state<HTMLDivElement | null>(null);
  let boardEl = $state<HTMLDivElement | null>(null);
  let size = $state(0);

  $effect(() => {
    if (!wrapperEl) return;
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      size = Math.max(0, Math.floor(Math.min(width, height) / 8) * 8);
    });
    ro.observe(wrapperEl);
    return () => ro.disconnect();
  });

  $effect(() => {
    chessState.boardEl = boardEl;
    return () => {
      if (chessState.boardEl === boardEl) chessState.boardEl = null;
    };
  });

  /** Visual order: rows from the top of the screen, respecting the flip. */
  let order = $derived(
    Array.from({ length: 64 }, (_, v) => (chessState.flipped ? 63 - v : v))
  );

  let targetSet = $derived(new Set(chessState.targets));
  let last = $derived(chessState.current);
  let drag = $derived(chessState.drag);

  /** Visual column/row (0 = left/top) of a square index. */
  function visual(index: number) {
    const v = chessState.flipped ? 63 - index : index;
    return { col: v % 8, row: Math.floor(v / 8) };
  }

  let arrows = $derived.by(() => {
    const result = chessState.solverHere?.report?.result;
    if (!result?.solutions.length) return [];
    return result.solutions.slice(0, 4).map((s) => {
      const a = visual(squareIndex(s.from));
      const b = visual(squareIndex(s.to));
      return { x1: a.col + 0.5, y1: a.row + 0.5, x2: b.col + 0.5, y2: b.row + 0.5, key: s.from + s.to };
    });
  });

  let promotion = $derived.by(() => {
    const p = chessState.pendingPromotion;
    if (!p) return null;
    const piece = chessState.board[p.from];
    if (!piece) return null;
    const white = pieceColor(piece) === 'w';
    const pos = visual(p.to);
    const choices = (white ? ['Q', 'R', 'B', 'N'] : ['q', 'r', 'b', 'n']) as PieceChar[];
    // Stack the choices from the board edge the pawn reached towards the centre.
    const fromTop = pos.row === 0;
    return { col: pos.col, fromTop, choices, from: p.from, to: p.to };
  });

  function choosePromotion(e: PointerEvent, piece: PieceChar) {
    e.preventDefault();
    e.stopPropagation();
    settings.vibrate(30);
    const p = chessState.pendingPromotion;
    if (!p) return;
    chessState.pendingPromotion = null;
    chessState.commitRulesMove(p.from, p.to, piece.toLowerCase());
  }

  function squareLabel(index: number): string {
    const piece = chessState.board[index];
    return piece ? `${squareName(index)}, figura ${piece}` : squareName(index);
  }
</script>

<div class="board-wrapper" bind:this={wrapperEl}>
  <div
    class="board"
    class:rules={chessState.mode === 'rules'}
    bind:this={boardEl}
    style:width="{size}px"
    style:height="{size}px"
    style:--sq="{size / 8}px"
    role="grid"
    aria-label="Šachovnice"
  >
    {#each order as index (index)}
      {@const piece = chessState.board[index]}
      {@const pos = visual(index)}
      {@const isSource = drag !== null && drag.source === index}
      <div
        class="square"
        class:light={isLightSquare(index)}
        class:dark={!isLightSquare(index)}
        class:last={index === last.from || index === last.to}
        class:selected={index === chessState.selected}
        class:check={index === chessState.checkSquare}
        class:flash={index === chessState.flashSquare}
        class:drop-target={drag !== null && drag.target === index}
        role="gridcell"
        tabindex="-1"
        aria-label={squareLabel(index)}
        onpointerdown={(e) => chessState.press(e, index)}
      >
        {#if chessState.showCoords && pos.col === 0}
          <span class="coord rank">{squareName(index)[1]}</span>
        {/if}
        {#if chessState.showCoords && pos.row === 7}
          <span class="coord file">{squareName(index)[0]}</span>
        {/if}

        {#if piece}
          <div class="piece" class:ghost={isSource}>{@html PIECE_SVG[piece]}</div>
        {/if}

        {#if targetSet.has(index)}
          <span class="target" class:capture={!!piece} class:hint={chessState.mode === 'free'}></span>
        {/if}
      </div>
    {/each}

    {#if arrows.length}
      <svg class="arrows" viewBox="0 0 8 8" aria-hidden="true">
        <defs>
          <marker id="chess-arrow-head" viewBox="0 0 4 4" refX="2" refY="2" markerWidth="2.6" markerHeight="2.6" orient="auto">
            <path d="M0,0 L4,2 L0,4 z" fill="var(--color-accent-success)" />
          </marker>
        </defs>
        {#each arrows as a (a.key)}
          {@const len = Math.hypot(a.x2 - a.x1, a.y2 - a.y1)}
          {@const k = (len - 0.32) / len}
          <line
            x1={a.x1}
            y1={a.y1}
            x2={a.x1 + (a.x2 - a.x1) * k}
            y2={a.y1 + (a.y2 - a.y1) * k}
            stroke="var(--color-accent-success)"
            stroke-width="0.16"
            stroke-linecap="round"
            marker-end="url(#chess-arrow-head)"
          />
        {/each}
      </svg>
    {/if}

    {#if promotion}
      <div
        class="promotion-backdrop"
        role="presentation"
        onpointerdown={(e) => {
          e.preventDefault();
          chessState.cancelPromotion();
        }}
      ></div>
      <div
        class="promotion"
        class:from-top={promotion.fromTop}
        style:left="calc(var(--sq) * {promotion.col})"
        role="menu"
        aria-label="Proměna pěšce"
      >
        {#each promotion.choices as choice (choice)}
          <button
            type="button"
            class="promotion-choice"
            class:outlined={pieceColor(choice) === 'b'}
            role="menuitem"
            aria-label={choice}
            onpointerdown={(e) => choosePromotion(e, choice)}
          >
            {@html PIECE_SVG[choice]}
          </button>
        {/each}
      </div>
    {/if}
  </div>
</div>

{#if drag}
  <div
    class="drag-piece"
    style:width="{drag.size}px"
    style:height="{drag.size}px"
    style:left="{drag.x - drag.size / 2}px"
    style:top="{drag.y - drag.lift - drag.size / 2}px"
  >
    {@html PIECE_SVG[drag.piece]}
    {#if drag.target !== null || drag.overRemove}
      <span class="drag-label" class:remove={drag.overRemove}>
        {drag.overRemove ? 'odebrat' : squareName(drag.target!)}
      </span>
    {/if}
  </div>
{/if}

<style>
  .board-wrapper {
    flex: 1;
    min-height: 0;
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;

    /* Board content colours: squares and the last-move highlight */
    --chess-light: #cfd5dc;
    --chess-dark: #8595a6;
    --chess-last: rgba(255, 214, 10, 0.42);
  }

  .board {
    position: relative;
    display: grid;
    grid-template-columns: repeat(8, 1fr);
    grid-template-rows: repeat(8, 1fr);
    border-radius: 2px;
    overflow: hidden;
    touch-action: none;
    user-select: none;
    -webkit-user-select: none;
    -webkit-touch-callout: none;
    box-shadow: 0 0 0 1px var(--color-border-subtle);
  }

  .square {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    -webkit-tap-highlight-color: transparent;
    outline: none;
  }

  .square.light {
    background-color: var(--chess-light);
  }

  .square.dark {
    background-color: var(--chess-dark);
  }

  .square.last::before,
  .square.check::before,
  .square.flash::before {
    content: '';
    position: absolute;
    inset: 0;
    pointer-events: none;
  }

  .square.last::before {
    background-color: var(--chess-last);
  }

  .square.check::before {
    background: radial-gradient(
      circle,
      var(--color-accent-danger) 0%,
      color-mix(in srgb, var(--color-accent-danger) 50%, transparent) 45%,
      transparent 75%
    );
  }

  .square.flash::before {
    background-color: color-mix(in srgb, var(--color-accent-danger) 55%, transparent);
    animation: flash-out 0.38s ease-out forwards;
  }

  @keyframes flash-out {
    to {
      opacity: 0;
    }
  }

  .square.selected {
    box-shadow: inset 0 0 0 3px var(--color-accent-primary);
  }

  .square.drop-target {
    box-shadow: inset 0 0 0 3px var(--color-text-primary);
  }

  .piece {
    position: relative;
    width: 92%;
    height: 92%;
    pointer-events: none;
  }

  .piece.ghost {
    opacity: 0.3;
  }

  .piece :global(svg),
  .drag-piece :global(svg),
  .promotion-choice :global(svg) {
    width: 100%;
    height: 100%;
    display: block;
  }

  .coord {
    position: absolute;
    font-family: var(--font-sans);
    /* Part of the square geometry: capped by the square size */
    font-size: min(var(--text-xs), calc(var(--sq) * 0.32));
    font-weight: 700;
    line-height: 1;
    pointer-events: none;
  }

  .light .coord {
    color: var(--chess-dark);
  }

  .dark .coord {
    color: var(--chess-light);
  }

  .coord.rank {
    top: 2px;
    left: 2px;
  }

  .coord.file {
    bottom: 2px;
    right: 3px;
  }

  .target {
    position: absolute;
    width: 30%;
    height: 30%;
    border-radius: var(--radius-full);
    background-color: rgba(0, 0, 0, 0.32);
    pointer-events: none;
  }

  .target.capture {
    width: 92%;
    height: 92%;
    background: transparent;
    box-shadow: inset 0 0 0 calc(var(--sq) * 0.08) rgba(0, 0, 0, 0.32);
  }

  .target.hint {
    background-color: rgba(0, 0, 0, 0.18);
  }

  .target.hint.capture {
    background: transparent;
    box-shadow: inset 0 0 0 calc(var(--sq) * 0.06) rgba(0, 0, 0, 0.2);
  }

  .arrows {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    opacity: 0.85;
    pointer-events: none;
  }

  .promotion-backdrop {
    position: absolute;
    inset: 0;
    background-color: rgba(0, 0, 0, 0.45);
  }

  .promotion {
    position: absolute;
    bottom: 0;
    width: var(--sq);
    display: flex;
    flex-direction: column-reverse;
    background-color: var(--color-surface-3);
    box-shadow: 0 0 0 2px var(--color-accent-primary), var(--shadow-lg);
  }

  .promotion.from-top {
    top: 0;
    bottom: auto;
    flex-direction: column;
  }

  .promotion-choice {
    width: var(--sq);
    height: var(--sq);
    padding: 4%;
    border: none;
    background: transparent;
    cursor: pointer;
    touch-action: none;
  }

  /* Black pieces on the dark picker: thin light outline traced from the piece shape. */
  .promotion-choice.outlined :global(svg) {
    filter: drop-shadow(0 0 0.6px rgba(255, 255, 255, 0.85)) drop-shadow(0 0 0.6px rgba(255, 255, 255, 0.85));
  }

  .promotion-choice:active {
    background-color: var(--color-surface-active);
  }

  .drag-piece {
    position: fixed;
    z-index: 1000;
    pointer-events: none;
    filter: drop-shadow(0 6px 10px rgba(0, 0, 0, 0.55));
  }

  .drag-label {
    position: absolute;
    left: 50%;
    bottom: 100%;
    transform: translate(-50%, -2px);
    padding: 2px 6px;
    border-radius: var(--radius-xs);
    background-color: var(--color-surface-3);
    color: var(--color-text-primary);
    font-family: var(--font-mono);
    font-size: var(--text-xs);
    font-weight: 700;
    white-space: nowrap;
    box-shadow: var(--shadow-sm);
  }

  .drag-label.remove {
    background-color: var(--color-accent-danger);
  }
</style>
