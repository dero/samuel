<script lang="ts">
  import { settings } from '../../state/settings.svelte';
  import { X } from 'phosphor-svelte';

  interface Props {
    letters: string[];
    selectedLetter: string | null;
    mapping: Record<string, string>;
    allowHomophones?: boolean;
    onAssign: (cipherLetter: string, targetLetter: string) => void;
    onUnassign: (cipherLetter: string) => void;
  }

  let {
    letters,
    selectedLetter,
    mapping,
    allowHomophones = false,
    onAssign,
    onUnassign
  }: Props = $props();

  const isDormant = $derived(selectedLetter === null);

  // Targets already used by OTHER cipher letters
  const usedTargetsByOthers = $derived.by(() => {
    const set = new Set<string>();
    if (!selectedLetter) return set;
    for (const [c, p] of Object.entries(mapping)) {
      if (c !== selectedLetter && p) {
        set.add(p.toUpperCase());
      }
    }
    return set;
  });

  const currentlyMappedTarget = $derived(
    selectedLetter ? mapping[selectedLetter]?.toUpperCase() : null
  );

  /**
   * Calculates the optimal column count (7..10) to strictly prevent 1 or 2 dangling keys
   * in the last row, preferring full grids and natural row layouts.
   */
  function calculateOptimalCols(totalItems: number): number {
    const candidates = [9, 8, 7, 10];

    function evaluateCandidate(cols: number) {
      const rem = totalItems % cols;
      const remainder = rem === 0 ? cols : rem;
      const rows = Math.ceil(totalItems / cols);
      const isDangling = rem === 1 || rem === 2;
      const isPerfect = rem === 0;

      let score = 0;

      // Heavy penalty for 1 or 2 dangling keys alone in the last row
      if (isDangling) {
        score -= 1000;
      }

      // High bonus for perfect grid (last row completely full)
      if (isPerfect) {
        score += 500;
      }

      // Bonus for fuller last row
      score += (remainder / cols) * 100;

      // Prefer fewer rows
      score -= rows * 50;

      // Preference for standard column counts on mobile
      if (cols === 9) score += 30;
      if (cols === 8) score += 20;
      if (cols === 7) score += 10;

      return { cols, score };
    }

    const evaluated = candidates.map(evaluateCandidate);
    evaluated.sort((a, b) => b.score - a.score);

    return evaluated[0].cols;
  }

  const totalKeys = $derived(letters.length + 1); // letters + unassign key
  const cols = $derived(calculateOptimalCols(totalKeys));
  const fillerSpan = $derived.by(() => {
    const rem = totalKeys % cols;
    return rem === 0 ? 0 : cols - rem;
  });

  const keyHeight = '40px';

  function handleTargetClick(targetChar: string) {
    if (!selectedLetter) return;
    settings.vibrate(25);
    onAssign(selectedLetter, targetChar);
  }

  function handleUnassignKeyClick() {
    if (!selectedLetter || !currentlyMappedTarget) return;
    settings.vibrate(25);
    onUnassign(selectedLetter);
  }
</script>

<div
  class="target-keypad-chassis"
  class:is-dormant={isDormant}
  style="--grid-cols: {cols}; --key-height: {keyHeight};"
  aria-disabled={isDormant}
>
  <div class="target-keypad-grid">
    {#each letters as char (char)}
      {@const upperChar = char.toUpperCase()}
      {@const isAssignedToOther = !allowHomophones && usedTargetsByOthers.has(upperChar)}
      {@const isCurrentTarget = currentlyMappedTarget === upperChar}

      <button
        type="button"
        class="target-keycap font-mono"
        class:is-disabled={isAssignedToOther}
        class:is-current-target={isCurrentTarget}
        disabled={isDormant || isAssignedToOther}
        onclick={() => handleTargetClick(upperChar)}
        title={isAssignedToOther ? `Písmeno ${upperChar} je již přiřazeno jinému znaku` : `Přiřadit ${upperChar}`}
        aria-label="Cílové písmeno {upperChar}"
      >
        <span class="keycap-label">{char}</span>
      </button>
    {/each}

    <!-- Dedicated unassign key [ ✕ ] -->
    <button
      type="button"
      class="target-keycap unassign-keycap font-mono"
      class:is-disabled={!currentlyMappedTarget}
      disabled={isDormant || !currentlyMappedTarget}
      onclick={handleUnassignKeyClick}
      title="Zrušit přiřazení pro vybrané písmeno"
      aria-label="Zrušit přiřazení"
    >
      <X size={16} weight="bold" />
    </button>

    <!-- Optional grid filler to complete the last row as per Design System rule 97 -->
    {#if fillerSpan > 0}
      <div
        class="grid-filler"
        style="grid-column: span {fillerSpan};"
        aria-hidden="true"
      ></div>
    {/if}
  </div>
</div>

<style>
  .target-keypad-chassis {
    width: 100%;
    background-color: #000000;
    border-radius: var(--radius-sm);
    border: 1px solid var(--color-border-subtle);
    padding: 2px;
    user-select: none;
    -webkit-user-select: none;
    transition: opacity 0.15s ease;
  }

  .target-keypad-chassis.is-dormant {
    opacity: 0.35;
    pointer-events: none;
  }

  .target-keypad-grid {
    display: grid;
    grid-template-columns: repeat(var(--grid-cols, 9), 1fr);
    gap: 2px;
    width: 100%;
  }

  .target-keycap {
    display: flex;
    align-items: center;
    justify-content: center;
    height: var(--key-height, 40px);
    background-color: var(--color-surface-2);
    border: none;
    border-radius: 2px;
    color: var(--color-text-primary);
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.1),
      inset 0 -1px 0 rgba(0, 0, 0, 0.5);
    cursor: pointer;
    touch-action: manipulation;
    padding: 0;
    font-size: 14px;
    font-weight: 700;
    transition: background-color 0.1s ease, transform 0.05s ease;
  }

  .target-keycap:active:not(:disabled) {
    background-color: var(--color-surface-active);
    box-shadow: inset 0 1.5px 3px rgba(0, 0, 0, 0.7);
  }

  .target-keycap.is-current-target {
    background-color: var(--color-surface-active);
    color: var(--color-accent-primary);
    box-shadow:
      inset 0 0 0 1.5px var(--color-accent-primary),
      inset 0 1.5px 3px rgba(0, 0, 0, 0.7);
  }

  .target-keycap.is-disabled {
    opacity: 0.22;
    cursor: not-allowed;
    background-color: var(--color-surface-1);
    color: var(--color-text-muted);
    box-shadow: none;
  }

  .unassign-keycap {
    background-color: rgba(239, 68, 68, 0.12);
    color: var(--color-accent-danger);
    border: 1px dashed rgba(239, 68, 68, 0.3);
  }

  .unassign-keycap:active:not(:disabled) {
    background-color: rgba(239, 68, 68, 0.25);
  }

  .unassign-keycap.is-disabled {
    opacity: 0.2;
    border-color: transparent;
  }

  .keycap-label {
    line-height: 1;
    display: inline-block;
  }

  .grid-filler {
    background-color: var(--color-surface-2);
    opacity: 0.18;
    border-radius: 2px;
    height: var(--key-height, 40px);
    pointer-events: none;
  }
</style>
