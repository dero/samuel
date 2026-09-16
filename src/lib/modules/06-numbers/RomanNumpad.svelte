<script lang="ts">
  import { settings } from '../../state/settings.svelte';
  import { isCanonicalRomanPrefix } from './numbersSolver';

  interface Props {
    buffer?: string;
    canonicalOnly?: boolean;
    disabled?: boolean;
    onDigit: (digit: string) => void;
  }

  let { buffer = '', canonicalOnly = false, disabled = false, onDigit }: Props = $props();

  const ROMAN_KEYS = [
    { char: 'I', val: 1 },
    { char: 'V', val: 5 },
    { char: 'X', val: 10 },
    { char: 'L', val: 50 },
    { char: 'C', val: 100 },
    { char: 'D', val: 500 },
    { char: 'M', val: 1000 }
  ];

  function isKeyAllowed(char: string): boolean {
    if (!canonicalOnly) return true;
    return isCanonicalRomanPrefix(buffer + char);
  }

  function handlePointerDown(char: string, e: PointerEvent) {
    if (disabled || !isKeyAllowed(char) || e.button !== 0) return;
    settings.vibrate(20);
    onDigit(char);
  }
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
  class="roman-numpad-container"
  class:is-disabled={disabled}
  oncontextmenu={(e) => e.preventDefault()}
>
  <!-- Row 1: Most frequent units & alphabet keys: I, V, X -->
  <div class="grid-row row-3cols">
    {#each ROMAN_KEYS.slice(0, 3) as item}
      {@const keyDisabled = disabled || !isKeyAllowed(item.char)}
      <button
        type="button"
        class="key-btn key-top-row"
        disabled={keyDisabled}
        onpointerdown={(e) => handlePointerDown(item.char, e)}
      >
        <span class="key-label">{item.char}</span>
        <span class="key-subval">{item.val}</span>
      </button>
    {/each}
  </div>

  <!-- Row 2: Remaining denominations: L, C, D, M -->
  <div class="grid-row row-4cols">
    {#each ROMAN_KEYS.slice(3) as item}
      {@const keyDisabled = disabled || !isKeyAllowed(item.char)}
      <button
        type="button"
        class="key-btn key-bottom-row"
        disabled={keyDisabled}
        onpointerdown={(e) => handlePointerDown(item.char, e)}
      >
        <span class="key-label">{item.char}</span>
        <span class="key-subval">{item.val}</span>
      </button>
    {/each}
  </div>
</div>

<style>
  .roman-numpad-container {
    display: flex;
    flex-direction: column;
    gap: 6px;
    width: 100%;
    user-select: none;
    -webkit-user-select: none;
    touch-action: none;
  }

  .grid-row {
    display: grid;
    gap: 6px;
    width: 100%;
  }

  .row-4cols {
    grid-template-columns: repeat(4, 1fr);
  }

  .row-3cols {
    grid-template-columns: repeat(3, 1fr);
  }

  .key-btn {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background-color: var(--color-surface-2);
    color: var(--color-text-primary);
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-md);
    cursor: pointer;
    touch-action: none;
    min-height: var(--tap-min-size);
    font-family: var(--font-mono, monospace);
    transition: background-color 0.1s ease, transform 0.08s ease, border-color 0.1s ease;
    box-sizing: border-box;
    padding: var(--space-2xs) 0;
  }

  .key-top-row {
    height: clamp(54px, 8.2vh, 66px);
  }

  .key-top-row .key-label {
    font-size: clamp(24px, 3.8vh, 28px);
  }

  .key-bottom-row {
    height: clamp(46px, 6.8vh, 54px);
  }

  .key-bottom-row .key-label {
    font-size: clamp(17px, 2.8vh, 21px);
  }

  .key-label {
    font-weight: 800;
    line-height: 1;
    color: var(--color-accent-primary);
  }

  .key-subval {
    font-size: 10px;
    font-weight: 600;
    color: var(--color-text-muted);
    line-height: 1;
    margin-top: 3px;
  }

  .key-btn:active:not(:disabled) {
    background-color: var(--color-surface-active);
    border-color: var(--color-accent-primary);
    transform: scale(0.96);
  }

  .key-btn:disabled {
    opacity: 0.25;
    cursor: not-allowed;
    background-color: var(--color-surface-1);
    border-color: transparent;
  }
</style>
