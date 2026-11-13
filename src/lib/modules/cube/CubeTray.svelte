<script lang="ts">
  interface Props {
    letters: string[];
    placedChars: Set<string>;
    selectedChar?: string | null;
    isDropTarget: boolean;
    onChipPointerDown: (e: PointerEvent, char: string) => void;
  }

  let {
    letters,
    placedChars,
    selectedChar = null,
    isDropTarget,
    onChipPointerDown
  }: Props = $props();

  let trayEl = $state<HTMLDivElement | null>(null);

  const fillerCount = $derived((9 - (letters.length % 9)) % 9);

  export function containsClientPoint(clientX: number, clientY: number): boolean {
    if (!trayEl) return false;
    const rect = trayEl.getBoundingClientRect();
    return (
      clientX >= rect.left &&
      clientX <= rect.right &&
      clientY >= rect.top &&
      clientY <= rect.bottom
    );
  }
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
  bind:this={trayEl}
  class="cube-tray"
  class:is-drop-target={isDropTarget}
  oncontextmenu={(e) => e.preventDefault()}
>
  <div class="tray-grid">
    {#each letters as char (char)}
      {@const placed = placedChars.has(char)}
      {@const selected = selectedChar === char}
      <button
        type="button"
        class="tray-chip"
        class:is-placed={placed && !selected}
        class:is-selected={selected}
        aria-pressed={selected}
        aria-label="Vybrat nebo přetáhnout {char}"
        onpointerdown={(e) => onChipPointerDown(e, char)}
      >
        <span class="chip-label" class:is-small={char.length > 1}>{char}</span>
      </button>
    {/each}
    {#each { length: fillerCount } as _, idx (idx)}
      <div class="grid-filler" aria-hidden="true"></div>
    {/each}
  </div>
</div>

<style>
  .cube-tray {
    width: 100%;
    padding: 3px;
    background-color: var(--color-bg-canvas);
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-sm);
    box-sizing: border-box;
    touch-action: none;
    user-select: none;
    -webkit-user-select: none;
    transition: border-color 0.12s ease, background-color 0.12s ease;
  }

  .cube-tray.is-drop-target {
    border-color: var(--color-accent-danger);
    background-color: var(--color-accent-danger-subtle);
  }

  .tray-grid {
    display: grid;
    grid-template-columns: repeat(9, minmax(0, 1fr));
    gap: 2px;
  }

  .grid-filler {
    min-height: var(--control-min-height);
    border-radius: var(--radius-xs);
    background-color: var(--color-surface-sunken);
    border: 1px solid var(--color-border-sunken);
    opacity: 0.4;
  }

  .tray-chip {
    min-height: var(--control-min-height);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0 2px;
    background-color: var(--color-key-surface);
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-xs);
    box-shadow: var(--shadow-key);
    color: var(--color-text-primary);
    font-family: var(--font-mono);
    font-weight: 700;
    cursor: grab;
    touch-action: none;
    box-sizing: border-box;
  }

  .tray-chip.is-placed {
    background-color: var(--color-surface-1);
    color: var(--color-text-muted);
    box-shadow: none;
    border-color: var(--color-border-sunken);
  }

  .tray-chip.is-selected {
    background-color: var(--color-accent-primary-subtle);
    color: var(--color-accent-primary);
    border-color: var(--color-accent-primary);
    box-shadow: 0 0 0 1px var(--color-accent-primary);
  }

  .tray-chip:active {
    background-color: var(--color-key-active);
    box-shadow: var(--shadow-key-pressed);
  }

  .chip-label {
    font-size: var(--key-s);
    line-height: 1;
  }

  .chip-label.is-small {
    font-size: var(--text-xs);
  }
</style>
