<script lang="ts">
  import { settings } from '../../state/settings.svelte';
  import { isCanonicalRomanPrefix } from './numbersSolver';
  import RomanEasterEgg from './RomanEasterEgg.svelte';

  interface Props {
    buffer?: string;
    canonicalOnly?: boolean;
    disabled?: boolean;
    showEasterEgg?: boolean;
    onDigit: (digit: string) => void;
  }

  let {
    buffer = '',
    canonicalOnly = false,
    disabled = false,
    showEasterEgg = true,
    onDigit
  }: Props = $props();

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
  <!-- Single unified 4x2 grid: [Easter egg / Blank, I, V, X] / [L, C, D, M] -->
  <div class="grid-row grid-4x2">
    <!-- Slot 1: Easter egg slot (Colosseum / SPQR) or empty filler -->
    {#if showEasterEgg}
      <RomanEasterEgg />
    {:else}
      <div class="grid-filler" aria-hidden="true"></div>
    {/if}

    <!-- Slot 2, 3, 4: I, V, X -->
    {#each ROMAN_KEYS.slice(0, 3) as item}
      {@const keyDisabled = disabled || !isKeyAllowed(item.char)}
      <button
        type="button"
        class="key-btn"
        disabled={keyDisabled}
        onpointerdown={(e) => handlePointerDown(item.char, e)}
      >
        <span class="key-label">{item.char}</span>
        <span class="key-subval">{item.val}</span>
      </button>
    {/each}

    <!-- Row 2: L, C, D, M -->
    {#each ROMAN_KEYS.slice(3) as item}
      {@const keyDisabled = disabled || !isKeyAllowed(item.char)}
      <button
        type="button"
        class="key-btn"
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
    width: 100%;
    user-select: none;
    -webkit-user-select: none;
    touch-action: none;
  }

  .grid-row {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 2px;
    padding: 2px;
    width: 100%;
    border-radius: var(--radius-sm);
    overflow: hidden;
    background-color: var(--color-bg-canvas);
    border: 1px solid var(--color-border-subtle);
    box-sizing: border-box;
  }

  .key-btn {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: clamp(48px, 7.2vh, 60px);
    background-color: var(--color-surface-2);
    color: var(--color-text-primary);
    border: none;
    border-radius: 2px;
    cursor: pointer;
    touch-action: none;
    min-height: var(--tap-min-size);
    font-family: var(--font-mono, monospace);
    box-shadow: 
      inset 0 1px 0 rgba(255, 255, 255, 0.10),
      inset 0 -1px 0 rgba(0, 0, 0, 0.5);
    transition: background-color 0.08s ease, box-shadow 0.08s ease, color 0.08s ease;
    box-sizing: border-box;
    padding: var(--space-2xs) 0;
  }

  .grid-filler {
    height: clamp(48px, 7.2vh, 60px);
    min-height: var(--tap-min-size);
    visibility: hidden;
    pointer-events: none;
  }

  .key-label {
    font-size: clamp(20px, 3.2vh, 25px);
    font-weight: 800;
    line-height: 1;
    color: var(--color-accent-primary);
  }

  .key-subval {
    font-size: var(--text-2xs);
    font-weight: 600;
    color: var(--color-text-muted);
    line-height: 1;
    margin-top: 3px;
  }

  .key-btn:active:not(:disabled) {
    background-color: var(--color-surface-active);
    box-shadow: inset 0 1.5px 3px rgba(0, 0, 0, 0.7);
    transform: none;
  }

  .key-btn:disabled {
    opacity: 0.25;
    cursor: not-allowed;
    background-color: var(--color-surface-1);
    border-color: transparent;
  }
</style>
