<script lang="ts">
  import { CaretLeft, CaretRight } from 'phosphor-svelte';
  import { sudokuState } from './sudokuState.svelte';

  interface Props {
    flavour: 'sudoku' | 'nonogram';
  }

  let { flavour }: Props = $props();

  function handleDigit(num: number) {
    if (flavour === 'sudoku') {
      if (num === 0) {
        sudokuState.advanceSudoku(1);
        return;
      }
      sudokuState.enterSudokuDigit(num);
    } else {
      sudokuState.enterNonogramDigit(num);
    }
  }

  function handleLeft() {
    if (flavour === 'sudoku') {
      sudokuState.advanceSudoku(-1);
    } else {
      sudokuState.advanceNonogram(-1);
    }
  }

  function handleRight() {
    if (flavour === 'sudoku') {
      sudokuState.advanceSudoku(1);
    } else {
      sudokuState.advanceNonogram(1);
    }
  }
</script>

<div class="keypad-chassis">
  <!-- Left Skip / Step Back Button (2 rows tall) -->
  <button
    type="button"
    class="keycap keycap-nav keycap-left"
    onpointerdown={(e) => {
      e.preventDefault();
      handleLeft();
    }}
    aria-label="Krok zpět"
    title="Krok zpět"
  >
    <CaretLeft size={22} weight="bold" />
  </button>

  <!-- Row 1 Numbers 1-5 -->
  {#each [1, 2, 3, 4, 5] as digit}
    <button
      type="button"
      class="keycap keycap-num"
      onpointerdown={(e) => {
        e.preventDefault();
        handleDigit(digit);
      }}
      aria-label="Číslice {digit}"
    >
      <span class="num-text">{digit}</span>
    </button>
  {/each}

  <!-- Right Skip / Step Forward Button (2 rows tall) -->
  <button
    type="button"
    class="keycap keycap-nav keycap-right"
    onpointerdown={(e) => {
      e.preventDefault();
      handleRight();
    }}
    aria-label="Krok vpřed / Další"
    title="Krok vpřed / Další"
  >
    <CaretRight size={22} weight="bold" />
  </button>

  <!-- Row 2 Numbers 6-9 and 0 -->
  {#each [6, 7, 8, 9] as digit}
    <button
      type="button"
      class="keycap keycap-num"
      onpointerdown={(e) => {
        e.preventDefault();
        handleDigit(digit);
      }}
      aria-label="Číslice {digit}"
    >
      <span class="num-text">{digit}</span>
    </button>
  {/each}

  <!-- Digit 0: Advances to next cell in Sudoku, enters digit in Nonogram -->
  <button
    type="button"
    class="keycap keycap-num"
    onpointerdown={(e) => {
      e.preventDefault();
      handleDigit(0);
    }}
    aria-label="Číslice 0"
  >
    <span class="num-text">0</span>
  </button>
</div>

<style>
  .keypad-chassis {
    display: grid;
    grid-template-columns: minmax(36px, 1.1fr) repeat(5, minmax(32px, 1fr)) minmax(36px, 1.1fr);
    grid-template-rows: repeat(2, 40px);
    gap: 2px;
    padding: 2px;
    background-color: #000000;
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-sm);
    box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.8);
    touch-action: none;
    user-select: none;
  }

  .keycap {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: var(--color-surface-2);
    border: none;
    border-radius: 2px;
    color: var(--color-text-primary);
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.1),
      inset 0 -1px 0 rgba(0, 0, 0, 0.5);
    cursor: pointer;
    touch-action: none;
    -webkit-tap-highlight-color: transparent;
    transition: background-color 0.08s ease, transform 0.05s ease;
  }

  .keycap:active {
    background-color: var(--color-surface-active);
    box-shadow: inset 0 1.5px 3px rgba(0, 0, 0, 0.7);
    transform: translateY(0.5px);
  }

  .keycap-nav {
    grid-row: span 2;
    background-color: var(--color-surface-3);
    color: var(--color-accent-primary);
  }

  .keycap-left {
    grid-column: 1;
  }

  .keycap-right {
    grid-column: 7;
    grid-row: 1 / span 2;
  }

  .keycap-num {
    height: 40px;
  }

  .num-text {
    font-family: var(--font-mono, monospace);
    font-size: 20px;
    font-weight: 700;
    line-height: 1;
  }
</style>
