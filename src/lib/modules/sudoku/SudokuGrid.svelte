<script lang="ts">
  import { sudokuState } from './sudokuState.svelte';

  function handleCellClick(r: number, c: number) {
    sudokuState.selectSudokuCell(r, c);
  }

  function isCollision(r: number, c: number): boolean {
    return sudokuState.sudokuCollisions.some((col) => col.r === r && col.c === c);
  }

  function isSameRowOrColOrBox(r: number, c: number): boolean {
    const sel = sudokuState.sudokuSelected;
    if (r === sel.r || c === sel.c) return true;
    const br1 = Math.floor(r / 3);
    const bc1 = Math.floor(c / 3);
    const br2 = Math.floor(sel.r / 3);
    const bc2 = Math.floor(sel.c / 3);
    return br1 === br2 && bc1 === bc2;
  }
</script>

<div class="sudoku-board-wrapper">
  <div class="sudoku-grid" role="grid" aria-label="Sudoku mřížka">
    {#each Array(9) as _, r}
      <div class="sudoku-row" role="row">
        {#each Array(9) as _, c}
          {@const isSelected = sudokuState.sudokuSelected.r === r && sudokuState.sudokuSelected.c === c}
          {@const isRelated = isSameRowOrColOrBox(r, c)}
          {@const collision = isCollision(r, c)}
          {@const givenVal = sudokuState.sudokuGrid[r][c]}
          {@const solvedVal = sudokuState.sudokuSolution?.[r][c]}
          {@const displayVal = givenVal !== null ? givenVal : (sudokuState.sudokuIsSolved ? solvedVal : '')}
          {@const isDerived = givenVal === null && sudokuState.sudokuIsSolved && solvedVal !== undefined}
          {@const isAltBox = (Math.floor(r / 3) + Math.floor(c / 3)) % 2 === 1}

          <button
            type="button"
            role="gridcell"
            aria-selected={isSelected}
            class="cell"
            class:is-alt-box={isAltBox}
            class:is-selected={isSelected}
            class:is-related={isRelated && !isSelected}
            class:is-collision={collision}
            class:is-derived={isDerived}
            class:border-right-thick={(c + 1) % 3 === 0 && c < 8}
            class:border-bottom-thick={(r + 1) % 3 === 0 && r < 8}
            onclick={() => handleCellClick(r, c)}
          >
            <span class="cell-num">{displayVal ?? ''}</span>
          </button>
        {/each}
      </div>
    {/each}
  </div>
</div>

<style>
  .sudoku-board-wrapper {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 8px;
  }

  .sudoku-grid {
    display: flex;
    flex-direction: column;
    background-color: #000000;
    border: 2.5px solid rgba(255, 255, 255, 0.7);
    border-radius: var(--radius-xs);
    box-shadow: 0 4px 24px rgba(0, 0, 0, 0.85);
  }

  .sudoku-row {
    display: flex;
  }

  .cell {
    width: 31px;
    height: 31px;
    padding: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: #121212;
    border: 1px solid rgba(255, 255, 255, 0.09);
    color: var(--color-text-primary);
    font-family: var(--font-mono, monospace);
    font-size: 17px;
    font-weight: 700;
    cursor: pointer;
    touch-action: manipulation;
    user-select: none;
    -webkit-tap-highlight-color: transparent;
    transition: background-color 0.1s ease;
    box-sizing: border-box;
  }

  .cell.is-alt-box {
    background-color: #1a1a1a;
  }

  @media (hover: hover) {
    .cell:hover {
      filter: brightness(1.2);
    }
  }

  /* Clear prominent 3x3 block dividers */
  .cell.border-right-thick {
    border-right: 2.5px solid rgba(255, 255, 255, 0.65) !important;
  }

  .cell.border-bottom-thick {
    border-bottom: 2.5px solid rgba(255, 255, 255, 0.65) !important;
  }

  .cell.is-related {
    background-color: rgba(0, 210, 255, 0.05) !important;
  }

  .cell.is-selected {
    background-color: rgba(0, 210, 255, 0.22) !important;
    outline: 2px solid var(--color-accent-primary);
    outline-offset: -2px;
    z-index: 2;
  }

  .cell.is-collision {
    background-color: rgba(239, 68, 68, 0.28) !important;
    color: var(--color-accent-danger) !important;
    outline: 2px solid var(--color-accent-danger);
    outline-offset: -2px;
  }

  .cell.is-derived {
    color: var(--color-accent-primary);
    font-weight: 600;
  }

  .cell-num {
    pointer-events: none;
    line-height: 1;
  }
</style>
