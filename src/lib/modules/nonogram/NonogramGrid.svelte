<script lang="ts">
  import { untrack } from 'svelte';
  import { nonogramState, type ClueAxis } from './nonogramState.svelte';
  import { isCluePiece } from './nonogramNotation';
  import { navigation } from '../../state/navigation.svelte';
  import { settings } from '../../state/settings.svelte';

  interface Props {
    onEnsureVisible?: (el: HTMLElement) => void;
  }

  let { onEnsureVisible }: Props = $props();

  let width = $derived(nonogramState.width);
  let height = $derived(nonogramState.height);

  let tableRef: HTMLDivElement | null = $state(null);

  interface CluePiece {
    text: string;
    invalid: boolean;
    draft: boolean;
  }

  function handleCornerClick() {
    settings.vibrate(20);
    navigation.openMenu();
  }

  function handleClueClick(type: ClueAxis, index: number) {
    settings.vibrate(20);
    nonogramState.selectClue(type, index);
  }

  // For small nonograms, large cells (up to 40px) fill the space nicely. For larger ones,
  // 22px leaves room for 2-digit numbers and PanZoomViewport scales the board to fit.
  const cellSize = $derived.by(() => {
    const rawSize = Math.floor(Math.min(280 / width, 240 / height));
    return Math.max(22, Math.min(rawSize, 40));
  });

  function isSelected(type: ClueAxis, index: number): boolean {
    return nonogramState.selected.type === type && nonogramState.selected.index === index;
  }

  /** What the clue shows: its numbers, invalid pieces marked, the number being typed underlined. */
  function cluePieces(type: ClueAxis, index: number): CluePiece[] {
    const cell = (type === 'row' ? nonogramState.parsed.rows : nonogramState.parsed.cols)[index] ?? [];
    const draft = isSelected(type, index) ? nonogramState.draft : null;
    return cell.map((piece, i) => ({
      text: piece || '∅',
      invalid: !isCluePiece(piece),
      draft: i === draft
    }));
  }

  let lastClueKey = '';
  // Auto-pan active clue into view when zoomed
  $effect(() => {
    const sel = nonogramState.selected;
    const selKey = `${sel.type}:${sel.index}`;
    if (selKey === lastClueKey) return;
    lastClueKey = selKey;

    untrack(() => {
      if (!tableRef || !onEnsureVisible) return;
      const selector = `[data-clue-type="${sel.type}"][data-clue-index="${sel.index}"]`;
      const el = tableRef.querySelector(selector) as HTMLElement | null;
      if (el) {
        onEnsureVisible(el);
      }
    });
  });
</script>

{#snippet clueList(pieces: CluePiece[])}
  {#each pieces as piece, i (i)}
    <span class="clue-val" class:is-invalid={piece.invalid} class:is-draft={piece.draft}>{piece.text}</span>
  {:else}
    <span class="clue-val is-zero">0</span>
  {/each}
{/snippet}

<div bind:this={tableRef} class="nonogram-table">
  <!-- Top-left corner: the size, opens the Menu with the steppers -->
  <button
    type="button"
    class="corner-cell"
    onclick={handleCornerClick}
    title="Rozměry v Menu"
    aria-label="Rozměry {width} × {height}. Klepnutím otevřete Menu"
  >
    <span class="dim-badge">{width}×{height}</span>
  </button>

  <div class="col-headers" style="grid-template-columns: repeat({width}, {cellSize}px);">
    {#each Array(width) as _, c}
      <button
        type="button"
        class="col-clue-btn"
        class:is-selected={isSelected('col', c)}
        style="width: {cellSize}px;"
        data-clue-type="col"
        data-clue-index={c}
        onclick={() => handleClueClick('col', c)}
        title="Sloupec {c + 1}"
      >
        <div class="col-clue-stack">
          {@render clueList(cluePieces('col', c))}
        </div>
      </button>
    {/each}
  </div>

  <div class="row-headers" style="grid-template-rows: repeat({height}, {cellSize}px);">
    {#each Array(height) as _, r}
      <button
        type="button"
        class="row-clue-btn"
        class:is-selected={isSelected('row', r)}
        style="height: {cellSize}px;"
        data-clue-type="row"
        data-clue-index={r}
        onclick={() => handleClueClick('row', r)}
        title="Řádek {r + 1}"
      >
        <div class="row-clue-line">
          {@render clueList(cluePieces('row', r))}
        </div>
      </button>
    {/each}
  </div>

  <div
    class="cells-grid"
    style="grid-template-columns: repeat({width}, {cellSize}px); grid-template-rows: repeat({height}, {cellSize}px);"
  >
    {#each Array(height) as _, r}
      {#each Array(width) as _, c}
        {@const solvedVal = nonogramState.solution?.[r]?.[c]}
        <div
          class="nonogram-cell"
          class:is-filled={solvedVal === 1}
          class:is-empty={solvedVal === 0}
          class:is-highlighted={isSelected('col', c) || isSelected('row', r)}
          style="width: {cellSize}px; height: {cellSize}px;"
        >
          {#if solvedVal === 0}
            <span class="empty-dot">·</span>
          {/if}
        </div>
      {/each}
    {/each}
  </div>
</div>

<style>
  .nonogram-table {
    display: grid;
    grid-template-columns: auto auto;
    grid-template-rows: auto auto;
    background-color: var(--color-bg-canvas);
    border: 2px solid var(--color-border-strong);
    border-radius: var(--radius-xs);
    overflow: hidden;
  }

  .corner-cell {
    grid-column: 1;
    grid-row: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 4px;
    background-color: var(--color-surface-sunken);
    border: none;
    border-right: 2px solid var(--color-border-strong);
    border-bottom: 2px solid var(--color-border-strong);
    min-width: 48px;
    min-height: 44px;
    box-sizing: border-box;
    cursor: pointer;
    touch-action: manipulation;
    transition: background-color 0.12s ease;
    user-select: none;
  }

  .corner-cell:active {
    background-color: var(--color-surface-active);
  }

  .dim-badge {
    font-size: var(--text-xs);
    font-family: var(--font-mono);
    font-weight: 700;
    color: var(--color-text-secondary);
  }

  .col-headers {
    grid-column: 2;
    grid-row: 1;
    display: grid;
    background-color: var(--color-surface-1);
    border-bottom: 2px solid var(--color-border-strong);
  }

  .col-clue-btn,
  .row-clue-btn {
    display: flex;
    background: transparent;
    border: none;
    color: var(--color-text-primary);
    cursor: pointer;
    touch-action: manipulation;
    transition: background-color 0.1s;
    box-sizing: border-box;
  }

  .col-clue-btn {
    padding: 4px 1px;
    flex-direction: column;
    justify-content: flex-end;
    align-items: center;
    border-right: 1px solid var(--color-border-subtle);
    min-height: 44px;
  }

  .row-clue-btn {
    padding: 1px 6px;
    align-items: center;
    justify-content: flex-end;
    border-bottom: 1px solid var(--color-border-subtle);
  }

  /* Fill and ring: the selection is never shown by colour alone */
  .col-clue-btn.is-selected,
  .row-clue-btn.is-selected {
    background-color: var(--color-accent-primary-subtle);
    color: var(--color-accent-primary);
    box-shadow: inset 0 0 0 2px var(--color-accent-primary);
  }

  .col-clue-stack {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1px;
  }

  .row-headers {
    grid-column: 1;
    grid-row: 2;
    display: grid;
    background-color: var(--color-surface-1);
    border-right: 2px solid var(--color-border-strong);
    min-width: 48px;
  }

  .row-clue-line {
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .clue-val {
    font-family: var(--font-mono);
    font-size: var(--text-xs);
    font-weight: 700;
    line-height: 1;
  }

  .clue-val.is-zero {
    color: var(--color-text-muted);
  }

  .clue-val.is-draft {
    text-decoration: underline;
    text-underline-offset: 2px;
  }

  .clue-val.is-invalid {
    color: var(--color-accent-warning);
    text-decoration: underline wavy;
  }

  .cells-grid {
    grid-column: 2;
    grid-row: 2;
    display: grid;
    background-color: var(--color-surface-sunken);
  }

  .nonogram-cell {
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: var(--color-surface-1);
    border-right: 1px solid var(--color-border-subtle);
    border-bottom: 1px solid var(--color-border-subtle);
    transition: background-color 0.15s ease;
    box-sizing: border-box;
  }

  .nonogram-cell.is-highlighted {
    background-color: var(--color-accent-primary-subtle);
  }

  .nonogram-cell.is-empty {
    background-color: var(--color-surface-sunken);
  }

  /* The solution's black squares, drawn light on the dark board */
  .nonogram-cell.is-filled {
    background-color: var(--color-text-primary);
  }

  .empty-dot {
    color: var(--color-text-muted);
    font-size: var(--text-sm);
    font-weight: 700;
    user-select: none;
    line-height: 1;
  }
</style>
