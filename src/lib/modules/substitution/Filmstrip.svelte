<script lang="ts">
  import HoldToAction from '../../components/ui/HoldToAction.svelte';
  import { settings } from '../../state/settings.svelte';

  interface Props {
    letters: string[];
    mapping: Record<string, string>;
    selectedLetter: string | null;
    lettersInText: Set<string>;
    allowUnusedLetters?: boolean;
    onSelectLetter: (letter: string | null) => void;
    onResetAll: () => void;
  }

  let {
    letters,
    mapping,
    selectedLetter,
    lettersInText,
    allowUnusedLetters = false,
    onSelectLetter,
    onResetAll
  }: Props = $props();

  const hasAnyMapping = $derived(Object.keys(mapping).length > 0);

  let stripScrollContainer = $state<HTMLDivElement | null>(null);

  // When selectedLetter changes, auto-scroll that card into view
  $effect(() => {
    if (selectedLetter && stripScrollContainer) {
      const activeEl = stripScrollContainer.querySelector(`[data-letter="${selectedLetter}"]`);
      if (activeEl) {
        activeEl.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      }
    }
  });

  function handleCellClick(letter: string) {
    settings.vibrate(20);
    if (selectedLetter === letter) {
      onSelectLetter(null);
    } else {
      onSelectLetter(letter);
    }
  }
</script>

<div class="filmstrip-container">
  <!-- Pinned Reset Button at the start (outside scroll area) -->
  <div class="filmstrip-reset-slot">
    <HoldToAction
      onAction={onResetAll}
      disabled={!hasAnyMapping}
      variant="icon-only"
      label="Zrušit přiřazení"
      ariaLabel="Podržte pro zrušení všech přiřazení"
      tapWarning="Podržte pro zrušení přiřazení"
      class="filmstrip-reset-btn"
    />
  </div>

  <div class="filmstrip-scroll-area" bind:this={stripScrollContainer}>
    <!-- Letter cards -->
    <div class="filmstrip-cards-track">
      {#each letters as letter (letter)}
        {@const isMapped = !!mapping[letter]}
        {@const targetChar = mapping[letter] || letter.toLowerCase()}
        {@const isSelected = selectedLetter === letter}
        {@const isPresent = lettersInText.size === 0 || lettersInText.has(letter)}
        {@const canSelect = allowUnusedLetters || isPresent || isMapped}

        <div class="filmstrip-cell-wrapper">
          <button
            type="button"
            class="filmstrip-card"
            class:is-selected={isSelected}
            class:not-in-text={!isPresent}
            disabled={!canSelect}
            data-letter={letter}
            onclick={() => handleCellClick(letter)}
            aria-label="Znak {letter}, přiřazeno: {isMapped ? mapping[letter] : 'nic'}"
            aria-pressed={isSelected}
          >
            <span class="card-body">
              <!-- Top: cipher character -->
              <span class="card-cipher-char font-mono">{letter}</span>
              <span class="card-divider"></span>
              <!-- Bottom: assigned letter in capitals, the cipher letter in lowercase while unassigned -->
              <span class="card-target-char font-mono" class:target-unmapped={!isMapped}>
                {targetChar}
              </span>
            </span>
          </button>
        </div>
      {/each}
    </div>
  </div>
</div>

<style>
  .filmstrip-container {
    width: 100%;
    height: 56px;
    flex-shrink: 0;
    background-color: var(--color-bg-canvas);
    border-radius: var(--radius-sm);
    border: 1px solid var(--color-border-subtle);
    overflow: hidden;
    display: flex;
    align-items: stretch;
    position: relative;
    user-select: none;
    -webkit-user-select: none;
  }

  .filmstrip-reset-slot {
    background-color: var(--color-bg-canvas);
    padding: 2px 4px 2px 2px;
    border-right: 1px solid var(--color-border-subtle);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    z-index: 2;
  }

  /* Reaches into HoldToAction only for its size: the reset matches the cards' height */
  .filmstrip-reset-slot :global(.filmstrip-reset-btn) {
    width: 40px;
    height: 48px;
    flex-shrink: 0;
  }

  .filmstrip-scroll-area {
    display: flex;
    align-items: center;
    flex: 1;
    min-width: 0;
    height: 100%;
    overflow-x: auto;
    overflow-y: hidden;
    overscroll-behavior-x: contain;
    scroll-behavior: smooth;
    -webkit-overflow-scrolling: touch;
    padding: 2px 4px 2px 3px;
    gap: 3px;
    scrollbar-width: thin;
    scrollbar-color: var(--color-border-subtle) transparent;
  }

  .filmstrip-scroll-area::-webkit-scrollbar {
    height: 3px;
  }

  .filmstrip-scroll-area::-webkit-scrollbar-thumb {
    background-color: var(--color-border-subtle);
    border-radius: var(--radius-full);
  }

  .filmstrip-cards-track {
    display: flex;
    align-items: center;
    gap: 3px;
    height: 100%;
  }

  .filmstrip-cell-wrapper {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  /* Flat selection cards: choosing a cipher letter is not the main input */
  .filmstrip-card {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 48px;
    flex-shrink: 0;
    background-color: var(--color-surface-2);
    border: 1px solid transparent;
    border-radius: var(--radius-xs);
    padding: 2px 0;
    position: relative;
    cursor: pointer;
    touch-action: manipulation;
    transition: border-color 0.12s ease, background-color 0.12s ease;
  }

  .filmstrip-card:active:not(:disabled) {
    background-color: var(--color-surface-active);
  }

  .filmstrip-card:disabled {
    cursor: not-allowed;
  }

  .filmstrip-card.is-selected {
    border-color: var(--color-accent-primary);
    background-color: var(--color-accent-primary-subtle);
    box-shadow: inset 0 0 0 1px var(--color-accent-primary);
  }

  /* Disabled and absent letters keep their surface; only the content dims */
  .card-body {
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .not-in-text .card-body {
    opacity: 0.4;
  }

  .filmstrip-card:disabled .card-body {
    opacity: 0.25;
  }

  .filmstrip-card.is-selected .card-body {
    opacity: 1;
  }

  .card-cipher-char {
    font-size: var(--text-sm);
    font-weight: 700;
    line-height: 1.1;
    color: var(--color-text-primary);
  }

  .card-divider {
    width: 14px;
    height: 1px;
    background-color: var(--color-border-subtle);
    margin: 2px 0;
  }

  .card-target-char {
    font-size: var(--text-sm);
    font-weight: 700;
    line-height: 1.1;
    color: var(--color-text-primary);
  }

  .card-target-char.target-unmapped {
    font-weight: 500;
    color: var(--color-text-muted);
  }
</style>
