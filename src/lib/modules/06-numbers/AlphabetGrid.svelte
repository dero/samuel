<script lang="ts">
  import { settings } from '../../state/settings.svelte';

  interface Props {
    letters: string[];
    disabled?: boolean;
    onLetter: (letter: string) => void;
  }

  let { letters, disabled = false, onLetter }: Props = $props();

  // Dynamic columns: guarantee max 7 rows
  const cols = $derived(Math.max(6, Math.ceil(letters.length / 7)));
  const rows = $derived(Math.ceil(letters.length / cols));

  function handlePointerDown(char: string, e: PointerEvent) {
    if (disabled || e.button !== 0) return;
    settings.vibrate(20);
    onLetter(char);
  }
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
  class="alphabet-grid-container"
  class:is-disabled={disabled}
  oncontextmenu={(e) => e.preventDefault()}
>
  <div
    class="alphabet-grid"
    class:dense-rows={rows >= 7}
    class:medium-rows={rows === 6}
    style="--cols: {cols};"
  >
    {#each letters as letter}
      <button
        type="button"
        class="letter-key"
        {disabled}
        onpointerdown={(e) => handlePointerDown(letter, e)}
      >
        <span class="letter-label">{letter}</span>
      </button>
    {/each}
  </div>
</div>

<style>
  .alphabet-grid-container {
    width: 100%;
    user-select: none;
    -webkit-user-select: none;
    touch-action: none;
  }

  .alphabet-grid {
    display: grid;
    grid-template-columns: repeat(var(--cols, 6), 1fr);
    gap: 2px;
    width: 100%;
    box-sizing: border-box;
    border-radius: var(--radius-md);
    overflow: hidden;
    background-color: var(--color-bg-canvas);
  }

  .letter-key {
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: var(--color-surface-2);
    color: var(--color-text-primary);
    border: none;
    border-radius: 2px;
    cursor: pointer;
    touch-action: none;
    height: clamp(38px, 5.0vh, 44px);
    min-height: 32px;
    font-family: var(--font-mono, monospace);
    font-size: var(--text-base);
    font-weight: 700;
    box-shadow: 
      inset 0 1px 0 rgba(255, 255, 255, 0.10),
      inset 0 -1px 0 rgba(0, 0, 0, 0.5);
    transition: background-color 0.08s ease, box-shadow 0.08s ease, color 0.08s ease;
    box-sizing: border-box;
    padding: 0;
  }

  /* Medium rows (6 rows, e.g. alphanumeric 36) */
  .alphabet-grid.medium-rows .letter-key {
    height: clamp(34px, 4.4vh, 39px);
    font-size: var(--text-sm);
  }

  /* Dense rows (7 rows, e.g. Czech 42) */
  .alphabet-grid.dense-rows .letter-key {
    height: clamp(30px, 3.8vh, 35px);
    font-size: 13px;
  }

  .letter-key:active:not(:disabled) {
    background-color: var(--color-surface-active);
    color: var(--color-accent-primary);
    box-shadow: inset 0 1.5px 3px rgba(0, 0, 0, 0.7);
    transform: none;
  }

  .letter-key:disabled {
    opacity: 0.25;
    cursor: not-allowed;
    background-color: var(--color-surface-1);
  }

  .letter-label {
    line-height: 1;
  }
</style>
