<script lang="ts">
  import { untrack } from 'svelte';
  import { sudokuState } from './sudokuState.svelte';
  import { navigation } from '../../state/navigation.svelte';
  import { settings } from '../../state/settings.svelte';

  interface Props {
    onEnsureVisible?: (el: HTMLElement) => void;
  }

  let { onEnsureVisible }: Props = $props();

  let width = $derived(sudokuState.nonogramWidth);
  let height = $derived(sudokuState.nonogramHeight);

  let tableRef: HTMLDivElement | null = $state(null);

  function handleCornerClick() {
    settings.vibrate(20);
    navigation.openMenu();
  }

  // Dynamically compute cell size:
  // For small nonograms, large cells (up to 40px) fill the space nicely.
  // For larger nonograms, base size of 22px provides room for 2-digit numbers (e.g. 15, 20),
  // while PanZoomViewport scales the entire grid down seamlessly on reset so it always fits 100%.
  const cellSize = $derived.by(() => {
    const rawSize = Math.floor(Math.min(280 / width, 240 / height));
    return Math.max(22, Math.min(rawSize, 40));
  });

  function handleColClueClick(c: number) {
    sudokuState.selectNonogramClue('col', c);
  }

  function handleRowClueClick(r: number) {
    sudokuState.selectNonogramClue('row', r);
  }

  function getColCluesDisplay(c: number): string[] {
    const list = [...(sudokuState.nonogramColClues[c] || [])];
    if (
      sudokuState.nonogramSelected.type === 'col' &&
      sudokuState.nonogramSelected.index === c &&
      sudokuState.nonogramDraft
    ) {
      list.push(parseInt(sudokuState.nonogramDraft, 10));
    }
    return list.length > 0 ? list.map(String) : ['·'];
  }

  function getRowCluesDisplay(r: number): string[] {
    const list = [...(sudokuState.nonogramRowClues[r] || [])];
    if (
      sudokuState.nonogramSelected.type === 'row' &&
      sudokuState.nonogramSelected.index === r &&
      sudokuState.nonogramDraft
    ) {
      list.push(parseInt(sudokuState.nonogramDraft, 10));
    }
    return list.length > 0 ? list.map(String) : ['·'];
  }

  let lastClueKey = '';
  // Auto-pan active clue into view when zoomed
  $effect(() => {
    const sel = sudokuState.nonogramSelected;
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

<div class="nonogram-board-wrapper">
  <div bind:this={tableRef} class="nonogram-table">
    <!-- Top-Left Corner: Dimensions info (interactive: opens dimensions menu) -->
    <button
      type="button"
      class="corner-cell"
      onclick={handleCornerClick}
      title="Nastavit rozměry nonogramu (otevře menu)"
      aria-label="Rozměry {width} × {height}. Klepnutím otevřete nastavení rozměrů"
    >
      <span class="dim-badge">{width}×{height}</span>
    </button>

    <!-- Top-Right: Column Clues Headers -->
    <div
      class="col-headers"
      style="grid-template-columns: repeat({width}, {cellSize}px);"
    >
      {#each Array(width) as _, c}
        {@const isSelected = sudokuState.nonogramSelected.type === 'col' && sudokuState.nonogramSelected.index === c}
        {@const clues = getColCluesDisplay(c)}
        <button
          type="button"
          class="col-clue-btn"
          class:is-selected={isSelected}
          style="width: {cellSize}px;"
          data-clue-type="col"
          data-clue-index={c}
          onclick={() => handleColClueClick(c)}
          title="Sloupec {c + 1}"
        >
          <div class="col-clue-stack">
            {#each clues as cl}
              <span class="clue-val">{cl}</span>
            {/each}
          </div>
        </button>
      {/each}
    </div>

    <!-- Bottom-Left: Row Clues Headers -->
    <div
      class="row-headers"
      style="grid-template-rows: repeat({height}, {cellSize}px);"
    >
      {#each Array(height) as _, r}
        {@const isSelected = sudokuState.nonogramSelected.type === 'row' && sudokuState.nonogramSelected.index === r}
        {@const clues = getRowCluesDisplay(r)}
        <button
          type="button"
          class="row-clue-btn"
          class:is-selected={isSelected}
          style="height: {cellSize}px;"
          data-clue-type="row"
          data-clue-index={r}
          onclick={() => handleRowClueClick(r)}
          title="Řádek {r + 1}"
        >
          <div class="row-clue-line">
            {#each clues as cl}
              <span class="clue-val">{cl}</span>
            {/each}
          </div>
        </button>
      {/each}
    </div>

    <!-- Bottom-Right: Main Cell Grid -->
    <div
      class="cells-grid"
      style="grid-template-columns: repeat({width}, {cellSize}px); grid-template-rows: repeat({height}, {cellSize}px);"
    >
      {#each Array(height) as _, r}
        {#each Array(width) as _, c}
          {@const isColActive = sudokuState.nonogramSelected.type === 'col' && sudokuState.nonogramSelected.index === c}
          {@const isRowActive = sudokuState.nonogramSelected.type === 'row' && sudokuState.nonogramSelected.index === r}
          {@const solvedVal = sudokuState.nonogramSolution?.[r]?.[c]}
          {@const isFilled = solvedVal === 1}
          {@const isEmpty = solvedVal === 0}

          <div
            class="nonogram-cell"
            class:is-filled={isFilled}
            class:is-empty={isEmpty}
            class:is-highlighted={isColActive || isRowActive}
            style="width: {cellSize}px; height: {cellSize}px;"
          >
            {#if isEmpty}
              <span class="empty-dot">·</span>
            {/if}
          </div>
        {/each}
      {/each}
    </div>
  </div>
</div>

<style>
  .nonogram-board-wrapper {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 8px;
  }

  .nonogram-table {
    display: grid;
    grid-template-columns: auto auto;
    grid-template-rows: auto auto;
    background-color: #000000;
    border: 2.5px solid rgba(255, 255, 255, 0.7);
    border-radius: var(--radius-xs);
    box-shadow: 0 4px 24px rgba(0, 0, 0, 0.85);
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
    border-right: 2px solid rgba(255, 255, 255, 0.65);
    border-bottom: 2px solid rgba(255, 255, 255, 0.65);
    min-width: 48px;
    min-height: 44px;
    box-sizing: border-box;
    cursor: pointer;
    touch-action: manipulation;
    transition: background-color 0.12s ease;
    user-select: none;
  }

  .corner-cell:hover {
    background-color: var(--color-surface-2);
  }

  .corner-cell:active {
    background-color: var(--color-surface-active);
  }

  .corner-cell:hover .dim-badge,
  .corner-cell:active .dim-badge {
    color: var(--color-accent-primary);
  }

  .dim-badge {
    font-size: calc(11px * var(--font-scale));
    font-family: var(--font-mono, monospace);
    font-weight: 700;
    color: var(--color-text-secondary);
    transition: color 0.12s ease;
  }

  .col-headers {
    grid-column: 2;
    grid-row: 1;
    display: grid;
    background-color: var(--color-surface-1);
    border-bottom: 2px solid rgba(255, 255, 255, 0.65);
  }

  .col-clue-btn {
    padding: 4px 1px;
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    align-items: center;
    background: transparent;
    border: none;
    border-right: 1px solid rgba(255, 255, 255, 0.12);
    color: var(--color-text-secondary);
    cursor: pointer;
    touch-action: manipulation;
    transition: background-color 0.1s;
    min-height: 44px;
    box-sizing: border-box;
  }

  .col-clue-btn.is-selected {
    background-color: rgba(0, 210, 255, 0.22) !important;
    color: var(--color-accent-primary) !important;
    outline: 2px solid var(--color-accent-primary);
    outline-offset: -2px;
    z-index: 2;
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
    border-right: 2px solid rgba(255, 255, 255, 0.65);
    min-width: 48px;
  }

  .row-clue-btn {
    padding: 1px 6px;
    display: flex;
    align-items: center;
    justify-content: flex-end;
    background: transparent;
    border: none;
    border-bottom: 1px solid rgba(255, 255, 255, 0.12);
    color: var(--color-text-secondary);
    cursor: pointer;
    touch-action: manipulation;
    transition: background-color 0.1s;
    box-sizing: border-box;
  }

  .row-clue-btn.is-selected {
    background-color: rgba(0, 210, 255, 0.22) !important;
    color: var(--color-accent-primary) !important;
    outline: 2px solid var(--color-accent-primary);
    outline-offset: -2px;
    z-index: 2;
  }

  .row-clue-line {
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .clue-val {
    font-family: var(--font-mono, monospace);
    font-size: calc(11px * var(--font-scale));
    font-weight: 700;
    line-height: 1;
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
    border-right: 1px solid rgba(255, 255, 255, 0.12);
    border-bottom: 1px solid rgba(255, 255, 255, 0.12);
    transition: background-color 0.15s ease;
    box-sizing: border-box;
  }

  .nonogram-cell.is-highlighted {
    background-color: rgba(0, 210, 255, 0.05);
  }

  .nonogram-cell.is-filled {
    background-color: #ffffff !important;
  }

  .nonogram-cell.is-empty {
    background-color: var(--color-surface-sunken);
  }

  .empty-dot {
    color: var(--color-text-muted);
    font-size: calc(14px * var(--font-scale));
    font-weight: 700;
    user-select: none;
    line-height: 1;
  }
</style>
