<script lang="ts">
  import { BASE_CONFIGS } from './numbersData';
  import { settings } from '../../state/settings.svelte';

  interface Props {
    base: number;
    disabled?: boolean;
    onDigit: (digit: string) => void;
  }

  let { base, disabled = false, onDigit }: Props = $props();

  const config = $derived(BASE_CONFIGS[base] ?? BASE_CONFIGS[10]);

  function handlePointerDown(digit: string, e: PointerEvent) {
    if (disabled || e.button !== 0) return;
    settings.vibrate(20);
    onDigit(digit);
  }
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
  class="numpad-container layout-base-{base}"
  class:is-disabled={disabled}
  oncontextmenu={(e) => e.preventDefault()}
>
  {#if base === 10}
    <!-- Decimal only: Standard Telephone Keypad (1-9, 0 centered) -->
    <div class="grid-dec">
      {#each ['1', '2', '3', '4', '5', '6', '7', '8', '9'] as digit}
        <button
          type="button"
          class="key-btn key-dec"
          {disabled}
          onpointerdown={(e) => handlePointerDown(digit, e)}
        >
          <span class="key-label">{digit}</span>
        </button>
      {/each}
      <button
        type="button"
        class="key-btn key-dec key-zero"
        {disabled}
        onpointerdown={(e) => handlePointerDown('0', e)}
      >
        <span class="key-label">0</span>
      </button>
    </div>
  {:else}
    <!-- All other bases: Strict sequential order 0..9, A..F (only valid digits) -->
    <div
      class="grid-sequential"
      class:cols-2={base === 2 || base === 4}
      class:cols-3={base === 3 || base === 5 || base === 6 || base === 9}
      class:cols-4={base === 7 || base === 8 || base >= 11}
    >
      {#each config.digits as digit}
        {@const isAlpha = ['A', 'B', 'C', 'D', 'E', 'F'].includes(digit)}
        <button
          type="button"
          class="key-btn"
          class:key-bin={base === 2}
          class:key-ter={base === 3}
          class:key-medium={base >= 4 && base <= 6}
          class:key-compact={base >= 7 && base <= 9}
          class:key-hex={base >= 11}
          class:key-alpha={isAlpha}
          {disabled}
          onpointerdown={(e) => handlePointerDown(digit, e)}
        >
          <span class="key-label">{digit}</span>
        </button>
      {/each}
    </div>
  {/if}
</div>

<style>
  .numpad-container {
    width: 100%;
    user-select: none;
    -webkit-user-select: none;
    touch-action: none;
  }

  .key-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: var(--color-surface-2);
    color: var(--color-text-primary);
    border: none;
    border-radius: 2px;
    cursor: pointer;
    touch-action: none;
    min-height: var(--tap-min-size);
    font-family: var(--font-mono, monospace);
    font-weight: 700;
    box-shadow: 
      inset 0 1px 0 rgba(255, 255, 255, 0.10),
      inset 0 -1px 0 rgba(0, 0, 0, 0.5);
    transition: background-color 0.08s ease, box-shadow 0.08s ease, color 0.08s ease;
    box-sizing: border-box;
  }

  .key-btn:active:not(:disabled) {
    background-color: var(--color-surface-active);
    color: var(--color-accent-primary);
    box-shadow: inset 0 1.5px 3px rgba(0, 0, 0, 0.7);
    transform: none;
  }

  .key-btn:disabled {
    opacity: 0.25;
    cursor: not-allowed;
    background-color: var(--color-surface-1);
    border-color: transparent;
  }

  .key-alpha {
    color: var(--color-accent-primary);
    background-color: rgba(0, 210, 255, 0.06);
  }

  /* Grid Layouts */

  /* Sequential grid for bases other than 10 */
  .grid-sequential {
    display: grid;
    gap: 2px;
    width: 100%;
    border-radius: var(--radius-md);
    overflow: hidden;
    background-color: var(--color-bg-canvas);
    box-sizing: border-box;
  }

  .grid-sequential.cols-2 {
    grid-template-columns: repeat(2, 1fr);
  }

  .grid-sequential.cols-3 {
    grid-template-columns: repeat(3, 1fr);
  }

  .grid-sequential.cols-4 {
    grid-template-columns: repeat(4, 1fr);
    gap: 2px;
  }

  /* Base 2: Binary */
  .key-bin {
    height: clamp(68px, 10.5vh, 88px);
    font-size: clamp(28px, 5vh, 36px);
  }

  /* Base 3: Ternary */
  .key-ter {
    height: clamp(64px, 9.5vh, 80px);
    font-size: clamp(24px, 4.5vh, 30px);
  }

  /* Medium keys (Bases 4, 5, 6) */
  .key-medium {
    height: clamp(52px, 7.5vh, 64px);
    font-size: var(--text-xl);
  }

  /* Compact keys (Bases 7, 8, 9) */
  .key-compact {
    height: clamp(48px, 6.5vh, 58px);
    font-size: var(--text-lg);
  }

  /* Hex keys (Bases 11..16) */
  .key-hex {
    height: clamp(42px, 5.5vh, 50px);
    font-size: var(--text-lg);
  }

  /* Base 10: Telephone Numpad (3 cols) */
  .grid-dec {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 2px;
    width: 100%;
    border-radius: var(--radius-md);
    overflow: hidden;
    background-color: var(--color-bg-canvas);
    box-sizing: border-box;
  }

  .key-dec {
    height: clamp(44px, 6vh, 54px);
    font-size: var(--text-xl);
  }

  .key-zero {
    grid-column: 1 / -1; /* Full-width bottom row */
  }
</style>
