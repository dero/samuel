<script lang="ts">
  import { settings } from '../../state/settings.svelte';
  import { Backspace, Trash } from 'phosphor-svelte';

  interface Props {
    hasInput?: boolean;
    includeNumbers?: boolean;
    onChar: (char: string) => void;
    onBackspace: () => void;
    onClear: () => void;
    class?: string;
  }

  let {
    hasInput = false,
    includeNumbers = false,
    onChar,
    onBackspace,
    onClear,
    class: customClass = ''
  }: Props = $props();

  const ROW_NUM = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'];
  const ROW_1 = ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'];
  const ROW_2 = ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'];
  const ROW_3 = ['Z', 'X', 'C', 'V', 'B', 'N', 'M'];

  function handleKey(char: string, e: PointerEvent) {
    if (e.button !== 0) return;
    e.preventDefault();
    settings.vibrate(20);
    onChar(char);
  }

  function handleBackspace(e: PointerEvent) {
    if (e.button !== 0 || !hasInput) return;
    e.preventDefault();
    settings.vibrate(20);
    onBackspace();
  }

  function handleClear(e: PointerEvent) {
    if (e.button !== 0 || !hasInput) return;
    e.preventDefault();
    settings.vibrate(25);
    onClear();
  }
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
  class="simple-keyboard-chassis {customClass}"
  oncontextmenu={(e) => e.preventDefault()}
>
  <!-- Optional Row 0: 1 - 0 (Numbers) -->
  {#if includeNumbers}
    <div class="keyboard-row">
      {#each ROW_NUM as num}
        <button
          type="button"
          class="keycap num-key"
          onpointerdown={(e) => handleKey(num, e)}
          aria-label="Klávesa {num}"
        >
          <span class="key-label font-mono">{num}</span>
        </button>
      {/each}
    </div>
  {/if}

  <!-- Row 1: Q - P (10 keys) -->
  <div class="keyboard-row">
    {#each ROW_1 as char}
      <button
        type="button"
        class="keycap"
        onpointerdown={(e) => handleKey(char, e)}
        aria-label="Klávesa {char}"
      >
        <span class="key-label font-mono">{char}</span>
      </button>
    {/each}
  </div>

  <!-- Row 2: A - L (9 keys with 0.5fr spacers on sides) -->
  <div class="keyboard-row row-2">
    <div class="row-spacer" aria-hidden="true"></div>
    {#each ROW_2 as char}
      <button
        type="button"
        class="keycap"
        onpointerdown={(e) => handleKey(char, e)}
        aria-label="Klávesa {char}"
      >
        <span class="key-label font-mono">{char}</span>
      </button>
    {/each}
    <div class="row-spacer" aria-hidden="true"></div>
  </div>

  <!-- Row 3: Clear + Z - M + Backspace -->
  <div class="keyboard-row row-3">
    <button
      type="button"
      class="keycap action-key clear-key"
      disabled={!hasInput}
      onpointerdown={handleClear}
      aria-label="Vymazat hledání"
      title="Vymazat hledání"
    >
      <Trash size={16} weight="bold" />
    </button>

    {#each ROW_3 as char}
      <button
        type="button"
        class="keycap"
        onpointerdown={(e) => handleKey(char, e)}
        aria-label="Klávesa {char}"
      >
        <span class="key-label font-mono">{char}</span>
      </button>
    {/each}

    <button
      type="button"
      class="keycap action-key backspace-key"
      disabled={!hasInput}
      onpointerdown={handleBackspace}
      aria-label="Smazat poslední znak"
      title="Smazat poslední znak"
    >
      <Backspace size={17} weight="bold" />
    </button>
  </div>
</div>

<style>
  .simple-keyboard-chassis {
    width: 100%;
    background-color: #000000;
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-sm);
    padding: 2px;
    display: flex;
    flex-direction: column;
    gap: 2px;
    box-sizing: border-box;
    user-select: none;
    -webkit-user-select: none;
    touch-action: none;
    margin: 0;
  }

  .keyboard-row {
    display: flex;
    gap: 2px;
    width: 100%;
    height: 38px;
  }

  .row-spacer {
    flex: 0.5;
    pointer-events: none;
  }

  .keycap {
    flex: 1;
    min-width: 0;
    height: 100%;
    background-color: var(--color-surface-2);
    border: none;
    border-radius: 2px;
    color: var(--color-text-primary);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    cursor: pointer;
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.1), inset 0 -1px 0 rgba(0, 0, 0, 0.5);
    transition: background-color 0.08s;
  }

  .keycap:active {
    background-color: var(--color-surface-active);
    box-shadow: inset 0 1.5px 3px rgba(0, 0, 0, 0.7);
  }

  .keycap:disabled {
    cursor: not-allowed;
    box-shadow: none;
  }

  .keycap:disabled > * {
    opacity: 0.35;
  }

  .key-label {
    font-size: 15px;
    font-weight: 700;
    line-height: 1;
  }

  .action-key {
    flex: 1.4;
    color: var(--color-text-secondary);
  }

  .clear-key:not(:disabled):active {
    color: var(--color-danger, #ef4444);
  }

  .backspace-key:not(:disabled):active {
    color: var(--color-accent-primary);
  }
</style>
