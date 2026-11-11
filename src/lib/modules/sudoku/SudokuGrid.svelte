<script lang="ts">
  import { sudokuState } from './sudokuState.svelte';
  import { settings } from '../../state/settings.svelte';

  const collisionKeys = $derived(new Set(sudokuState.collisions.map(({ r, c }) => `${r},${c}`)));

  function handleCellClick(r: number, c: number) {
    settings.vibrate(20);
    sudokuState.selectCell(r, c);
  }

  function isSameRowOrColOrBox(r: number, c: number): boolean {
    const sel = sudokuState.selected;
    if (r === sel.r || c === sel.c) return true;
    return Math.floor(r / 3) === Math.floor(sel.r / 3) && Math.floor(c / 3) === Math.floor(sel.c / 3);
  }
</script>

<div class="sudoku-grid" role="grid" aria-label="Sudoku mřížka">
  {#each Array(9) as _, r}
    <div class="sudoku-row" role="row">
      {#each Array(9) as _, c}
        {@const isSelected = sudokuState.selected.r === r && sudokuState.selected.c === c}
        {@const given = sudokuState.parsed.grid[r][c]}
        {@const invalidChar = sudokuState.parsed.invalidCells[r][c]}
        {@const solved = given === null ? (sudokuState.solution?.[r][c] ?? null) : null}
        <button
          type="button"
          role="gridcell"
          aria-selected={isSelected}
          class="cell"
          class:is-alt-box={(Math.floor(r / 3) + Math.floor(c / 3)) % 2 === 1}
          class:is-selected={isSelected}
          class:is-related={!isSelected && isSameRowOrColOrBox(r, c)}
          class:is-collision={collisionKeys.has(`${r},${c}`)}
          class:is-invalid={invalidChar !== null}
          class:is-derived={solved !== null}
          class:border-right-thick={(c + 1) % 3 === 0 && c < 8}
          class:border-bottom-thick={(r + 1) % 3 === 0 && r < 8}
          onclick={() => handleCellClick(r, c)}
        >
          <span class="cell-num">{given ?? solved ?? invalidChar ?? ''}</span>
        </button>
      {/each}
    </div>
  {/each}
</div>

<style>
  .sudoku-grid {
    display: flex;
    flex-direction: column;
    background-color: var(--color-bg-canvas);
    border: 2px solid var(--color-border-strong);
    border-radius: var(--radius-xs);
  }

  .sudoku-row {
    display: flex;
  }

  /* Fitted down on small screens; 36px lets mid-size phones keep cells of 32px and more */
  .cell {
    width: 36px;
    height: 36px;
    padding: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: var(--color-surface-1);
    border: 1px solid var(--color-border-subtle);
    color: var(--color-text-primary);
    font-family: var(--font-mono);
    font-size: var(--text-base);
    font-weight: 700;
    cursor: pointer;
    touch-action: manipulation;
    user-select: none;
    -webkit-tap-highlight-color: transparent;
    transition: background-color 0.1s ease;
    box-sizing: border-box;
  }

  .cell.is-alt-box {
    background-color: var(--color-surface-2);
  }

  /* 3x3 block dividers */
  .cell.border-right-thick {
    border-right: 2px solid var(--color-border-strong);
  }

  .cell.border-bottom-thick {
    border-bottom: 2px solid var(--color-border-strong);
  }

  .cell.is-related {
    background-color: var(--color-accent-primary-subtle);
  }

  /* Fill and ring: the selection is never shown by colour alone. An outline, so it stays
     visible over the collision ring. */
  .cell.is-selected {
    background-color: var(--color-accent-primary-subtle);
    outline: 2px solid var(--color-accent-primary);
    outline-offset: -2px;
  }

  .cell.is-derived {
    color: var(--color-accent-success);
    font-weight: 500;
  }

  .cell.is-invalid {
    color: var(--color-accent-warning);
    text-decoration: underline wavy;
  }

  .cell.is-collision {
    background-color: var(--color-accent-danger-subtle);
    color: var(--color-accent-danger);
    box-shadow: inset 0 0 0 2px var(--color-accent-danger);
  }

  .cell-num {
    pointer-events: none;
    line-height: 1;
  }
</style>
