<script lang="ts">
  import { copyToClipboard } from '../../utils/clipboard';
  import { settings } from '../../state/settings.svelte';
  import { toast } from '../../state/toast.svelte';
  import type { CaesarShiftResult } from './shiftsData';
  import { Sparkle } from 'phosphor-svelte';

  interface Props {
    shifts: CaesarShiftResult[];
    rawText: string;
    showBestHighlight?: boolean;
  }

  let { shifts, rawText, showBestHighlight = true }: Props = $props();

  const bestCandidate = $derived(
    shifts.find((s) => s.isBest) ?? (shifts.length > 0 ? shifts[0] : null)
  );

  async function handleCopy(shiftItem: CaesarShiftResult) {
    settings.vibrate(35);
    const textToCopy = shiftItem.formattedText || shiftItem.shiftedText;
    await copyToClipboard(textToCopy);
    toast.show(`✓ Posun +${shiftItem.shift} zkopírován`, { type: 'success' });
  }

  /**
   * Computes a smooth color from red (0%) through yellow (50%) to green (100%).
   * Uses HSL hue: 0 deg (red) to 140 deg (emerald green).
   */
  function getIndicatorHsl(percentage: number): string {
    const clamped = Math.max(0, Math.min(100, percentage));
    const hue = Math.round((clamped / 100) * 140);
    return `hsl(${hue}, 85%, 45%)`;
  }
</script>

<div class="caesar-container">
  <!-- Contextual tooltip: seated at bottom, dissolves into nothingness on first activity -->
  <div
    class="caesar-empty-state"
    class:is-hidden={!!rawText.trim()}
    aria-hidden={!!rawText.trim()}
  >
    <p class="empty-desc">Samuel paralelně vyhodnotí všechny posuny abecedy a zvýrazní češtinu.</p>
  </div>

  {#if rawText.trim()}
    <!-- Top Match Hero Card (if enabled and valid) -->
    {#if showBestHighlight && bestCandidate}
      <!-- svelte-ignore a11y_click_events_have_key_events -->
      <!-- svelte-ignore a11y_no_static_element_interactions -->
      <div
        class="best-hero-card"
        class:is-highlight={bestCandidate.percentage >= 40}
        onclick={() => handleCopy(bestCandidate)}
        title="Klepnutím zkopírovat nejlepší posun"
      >
        <div class="hero-top-row">
          <div class="hero-badge-group">
            <span class="hero-star"><Sparkle size={15} weight="fill" /></span>
            <span class="hero-label">Nejlepší shoda:</span>
            <span class="hero-shift font-mono">+{bestCandidate.shift}</span>
            <span class="hero-rev font-mono">-{bestCandidate.reverseShift}</span>
          </div>
          <!-- Rounded square color indicator -->
          <div
            class="score-indicator-box"
            style="background-color: {getIndicatorHsl(bestCandidate.percentage)}; box-shadow: 0 0 6px {getIndicatorHsl(bestCandidate.percentage)};"
            title="Míra češtiny: {bestCandidate.percentage}%"
            aria-hidden="true"
          ></div>
        </div>

        <div class="hero-text font-mono">
          {bestCandidate.formattedText || bestCandidate.shiftedText}
        </div>
      </div>
    {/if}

    <!-- Scrollable list of all shifts with color indicator -->
    <div class="caesar-scroll-list" role="list" aria-label="Seznam všech Caesarových posunů">
      {#each shifts as item (item.shift)}
        <!-- svelte-ignore a11y_click_events_have_key_events -->
        <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
        <div
          class="shift-row"
          class:is-best={item.isBest && showBestHighlight}
          role="listitem"
          onclick={() => handleCopy(item)}
          title="Klepnutím zkopírovat posun +{item.shift}"
        >
          <!-- Left: Shift number badges (+k and -rev with high contrast) -->
          <div class="shift-badge-col">
            <span class="shift-num font-mono">+{item.shift}</span>
            <span class="shift-rev font-mono">-{item.reverseShift}</span>
          </div>

          <!-- Center: Shifted text -->
          <div class="shift-text-col font-mono">
            {item.shiftedText}
          </div>

          <!-- Right: Rounded square color indicator (Green 100% -> Yellow 50% -> Red 0%) -->
          <div class="shift-score-col">
            <div
              class="score-indicator-box"
              style="background-color: {getIndicatorHsl(item.percentage)};"
              title="Míra češtiny: {item.percentage}%"
              aria-hidden="true"
            ></div>
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>

<style>
  .caesar-container {
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;
    flex: 1;
    min-height: 0;
    position: relative;
    overflow: hidden;
    gap: var(--space-xs);
    justify-content: flex-end;
  }

  .caesar-empty-state {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    margin: 0 auto;
    display: flex;
    align-items: center;
    justify-content: center;
    text-align: center;
    max-width: 320px;
    padding: 0 var(--space-sm);
    color: var(--color-text-muted);
    user-select: none;
    -webkit-user-select: none;
    pointer-events: none;
    box-sizing: border-box;
    opacity: 1;
    filter: blur(0px);
    transform: scale(1) translateZ(0);
    will-change: opacity, filter, transform;
    transition:
      opacity 0.7s ease-in-out,
      filter 0.7s ease-in-out,
      transform 0.7s ease-in-out;
  }

  .caesar-empty-state.is-hidden {
    opacity: 0.2;
    filter: blur(14px);
    transform: scale(0.96) translateZ(0);
    pointer-events: none;
  }

  .empty-desc {
    font-family: var(--font-sans);
    font-size: 12px;
    line-height: 1.4;
    color: var(--color-text-muted);
    margin: 0;
    text-align: center;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    max-width: 100%;
  }

  /* Top Match Hero Card */
  .best-hero-card {
    background-color: var(--color-surface-2);
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-sm);
    padding: 8px var(--space-sm);
    display: flex;
    flex-direction: column;
    gap: 6px;
    cursor: pointer;
    flex-shrink: 0;
    transition: background-color 0.1s ease, border-color 0.1s ease;
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.08);
  }

  .best-hero-card.is-highlight {
    border-color: rgba(16, 185, 129, 0.45);
    background: linear-gradient(180deg, rgba(16, 185, 129, 0.12) 0%, var(--color-surface-2) 100%);
  }

  .best-hero-card:active {
    background-color: var(--color-surface-active);
    transform: translateY(1px);
  }

  .hero-top-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .hero-badge-group {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: var(--text-xs);
    font-weight: 700;
  }

  .hero-star {
    color: var(--color-accent-warning);
    flex-shrink: 0;
  }

  .hero-label {
    color: var(--color-text-secondary);
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .hero-shift {
    background-color: var(--color-surface-3);
    color: var(--color-accent-primary);
    padding: 1px 6px;
    border-radius: var(--radius-xs);
    font-size: var(--text-xs);
    font-weight: 700;
  }

  .hero-rev {
    background-color: var(--color-surface-3);
    color: var(--color-text-primary);
    padding: 1px 6px;
    border-radius: var(--radius-xs);
    font-size: 11px;
    font-weight: 700;
  }

  .hero-text {
    font-size: clamp(17px, 2.5vh, 21px);
    font-weight: 700;
    color: var(--color-text-primary);
    line-height: 1.3;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  /* Scrollable List */
  .caesar-scroll-list {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    overscroll-behavior: contain;
    display: flex;
    flex-direction: column;
    gap: 2px;
    padding-right: 2px;
  }

  .shift-row {
    display: flex;
    align-items: center;
    gap: var(--space-xs);
    padding: 6px var(--space-xs);
    background-color: var(--color-surface-1);
    border-radius: 2px;
    border: 1px solid transparent;
    cursor: pointer;
    user-select: text;
    transition: background-color 0.08s ease, border-color 0.08s ease;
    box-sizing: border-box;
    min-height: 40px;
  }

  .shift-row:hover {
    background-color: var(--color-surface-2);
  }

  .shift-row:active {
    background-color: var(--color-surface-active);
  }

  .shift-row.is-best {
    background-color: rgba(16, 185, 129, 0.08);
    border-color: rgba(16, 185, 129, 0.35);
  }

  .shift-badge-col {
    display: flex;
    align-items: baseline;
    gap: 4px;
    min-width: 60px;
    flex-shrink: 0;
    background-color: var(--color-surface-2);
    border-radius: var(--radius-xs);
    padding: 3px 6px;
    box-sizing: border-box;
  }

  .shift-num {
    font-size: var(--text-xs);
    font-weight: 700;
    color: var(--color-accent-primary);
    line-height: 1;
  }

  .shift-rev {
    font-size: 11px;
    font-weight: 700;
    color: var(--color-text-secondary);
    line-height: 1;
  }

  .shift-text-col {
    flex: 1;
    min-width: 0;
    font-size: var(--text-base);
    font-weight: 600;
    color: var(--color-text-primary);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    line-height: 1.2;
  }

  .shift-score-col {
    flex-shrink: 0;
    margin-left: auto;
    display: flex;
    align-items: center;
    justify-content: center;
    padding-right: 4px;
  }

  .score-indicator-box {
    width: 12px;
    height: 12px;
    border-radius: 3px;
    flex-shrink: 0;
    transition: background-color 0.2s ease, box-shadow 0.2s ease;
  }
</style>
