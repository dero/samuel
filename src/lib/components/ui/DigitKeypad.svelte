<script lang="ts">
  import { CaretLeft, CaretRight } from 'phosphor-svelte';

  /**
   * Two-row digit keypad (1–9, 0) flanked by tall prev/next buttons.
   * Shared by grid puzzles (Sudoku, Nonogram); meaning of 0 is up to the caller.
   */
  interface Props {
    onDigit: (digit: number) => void;
    onPrev: () => void;
    onNext: () => void;
  }

  let { onDigit, onPrev, onNext }: Props = $props();
</script>

<div class="keypad-chassis">
  <!-- Left Skip / Step Back Button (2 rows tall) -->
  <button
    type="button"
    class="keycap keycap-nav keycap-left"
    onpointerdown={(e) => {
      e.preventDefault();
      onPrev();
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
        onDigit(digit);
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
      onNext();
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
        onDigit(digit);
      }}
      aria-label="Číslice {digit}"
    >
      <span class="num-text">{digit}</span>
    </button>
  {/each}

  <!-- Digit 0 -->
  <button
    type="button"
    class="keycap keycap-num"
    onpointerdown={(e) => {
      e.preventDefault();
      onDigit(0);
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
    font-size: calc(20px * var(--font-scale));
    font-weight: 700;
    line-height: 1;
  }
</style>
