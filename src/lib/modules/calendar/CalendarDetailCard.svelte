<script lang="ts">
  import type { DayDetail } from './calendarData';
  import { copyToClipboard } from '../../utils/clipboard';
  import { settings } from '../../state/settings.svelte';
  import { Copy } from 'phosphor-svelte';

  interface Props {
    detail: DayDetail;
    variant?: 'compact' | 'expanded';
  }

  let { detail, variant = 'compact' }: Props = $props();

  const mainHolidayText = $derived(
    detail.movableHoliday ?? detail.holidayCz
  );

  const mainNameText = $derived(
    detail.namesCz.length > 0 ? detail.namesCz.join(', ') : mainHolidayText ?? '—'
  );

  function copyValue(val: string | number, label: string) {
    settings.vibrate(25);
    copyToClipboard(String(val), `${label} zkopírováno`);
  }
</script>

<div
  class="calendar-detail-root"
  class:is-compact-mode={variant === 'compact'}
  class:is-expanded-mode={variant === 'expanded'}
  data-allow-contextmenu
>
  <div class="card-container">
    <!-- Row 1: Slim Header & Metadata Strip -->
    <div class="header-strip">
      <button
        type="button"
        class="date-btn"
        title="Kopírovat datum"
        onclick={() => copyValue(`${detail.day}. ${detail.month}. ${detail.year}`, 'Datum')}
      >
        <Copy size={11} />
        <span class="dow-label">{detail.dayOfWeekName}</span>
        <span class="date-label">{detail.day}. {detail.month}. {detail.year}</span>
      </button>

      <div class="badges-group">
        <button
          type="button"
          class="astro-badge"
          title="Znamení zvěrokruhu (kopírovat)"
          onclick={() => copyValue(detail.zodiac.name, 'Znamení')}
        >
          <span class="badge-icon">{detail.zodiac.symbol}</span>
          <span class="badge-text">{detail.zodiac.name}</span>
        </button>

        <button
          type="button"
          class="astro-badge"
          title="Fáze Měsíce (kopírovat)"
          onclick={() => copyValue(detail.moonPhase.phaseName, 'Fáze Měsíce')}
        >
          <span class="badge-icon">{detail.moonPhase.icon}</span>
          <span class="badge-text">{detail.moonPhase.phaseName}</span>
        </button>
      </div>
    </div>

    <!-- Row 2: 3 Action Cards: Svátek, Den, Týden -->
    <div class="split-cards">
      <!-- 1: Svátek -->
      <button
        type="button"
        class="action-card svatek-card"
        onclick={() => copyValue(mainNameText, 'Svátek')}
      >
        <div class="card-label">
          <span>Svátek</span>
          {#if mainHolidayText && detail.namesCz.length > 0}
            <span class="holiday-star" title="Státní svátek">★</span>
          {/if}
        </div>
        <div class="card-val svatek-name" title={mainNameText}>
          {mainNameText}
        </div>
      </button>

      <!-- 2: Den (pořadí dne v roce) -->
      <button
        type="button"
        class="action-card num-card"
        onclick={() => copyValue(detail.dayOfYear, 'Den v roce')}
      >
        <div class="card-label">
          <span>Den</span>
        </div>
        <div class="card-val mono-val">
          {detail.dayOfYear}.
        </div>
      </button>

      <!-- 3: Týden (číslo týdne v roce) -->
      <button
        type="button"
        class="action-card num-card"
        onclick={() => copyValue(detail.weekNumber, 'Týden v roce')}
      >
        <div class="card-label">
          <span>Týden</span>
        </div>
        <div class="card-val mono-val">
          {detail.weekNumber}.
        </div>
      </button>
    </div>
  </div>
</div>

<style>
  .calendar-detail-root {
    width: 100%;
    box-sizing: border-box;
    background-color: var(--color-bg-canvas, #000000);
  }

  /* Compact Mode: Main Tool Output Zone (Strictly <= 64px, zero scroll) */
  .calendar-detail-root.is-compact-mode {
    height: auto;
    max-height: 64px;
    overflow: hidden;
  }

  .calendar-detail-root.is-compact-mode .card-container {
    height: auto;
    max-height: 64px;
    gap: 4px;
  }

  .calendar-detail-root.is-compact-mode .split-cards {
    height: 40px;
    grid-template-columns: minmax(0, 1fr) 48px 48px;
  }

  /* Expanded Mode: Search Accordion (Clean integration into list item) */
  .calendar-detail-root.is-expanded-mode {
    height: auto;
    background-color: transparent;
  }

  .calendar-detail-root.is-expanded-mode .card-container {
    height: auto;
    gap: 5px;
  }

  .calendar-detail-root.is-expanded-mode .split-cards {
    height: 42px;
    grid-template-columns: minmax(0, 1fr) 44px 44px;
  }

  /* Container */
  .card-container {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    width: 100%;
    box-sizing: border-box;
  }

  /* Row 1: Slim Header (20px) */
  .header-strip {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 4px;
    height: 20px;
    flex-shrink: 0;
    min-width: 0;
  }

  .date-btn {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    background: transparent;
    border: none;
    padding: 0;
    cursor: pointer;
    min-width: 0;
    flex-shrink: 1;
    color: var(--color-text-secondary, #b3b3b3);
    transition: color 0.1s ease;
    overflow: hidden;
  }

  .date-btn:active {
    color: var(--color-accent-primary, #00d2ff);
  }

  .dow-label {
    font-size: calc(11px * var(--font-scale));
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: var(--color-accent-primary, #00d2ff);
    white-space: nowrap;
    flex-shrink: 0;
  }

  .date-label {
    font-size: calc(13px * var(--font-scale));
    font-weight: 700;
    color: var(--color-text-primary, #ffffff);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .badges-group {
    display: flex;
    align-items: center;
    gap: 4px;
    flex-shrink: 0;
  }

  .astro-badge {
    display: inline-flex;
    align-items: center;
    gap: 3px;
    background-color: var(--color-surface-2, #1c1c1c);
    border: 1px solid var(--color-border-subtle, #2a2a2a);
    border-radius: var(--radius-xs, 4px);
    padding: 2px 5px;
    font-size: calc(10px * var(--font-scale));
    font-weight: 700;
    color: var(--color-text-secondary, #b3b3b3);
    white-space: nowrap;
    line-height: 1;
    cursor: pointer;
    box-sizing: border-box;
    transition: background-color 0.1s ease, border-color 0.1s ease;
  }

  .astro-badge:active {
    background-color: var(--color-surface-active, #333333);
    border-color: var(--color-accent-primary, #00d2ff);
  }

  .badge-icon {
    font-size: calc(11px * var(--font-scale));
    line-height: 1;
    flex-shrink: 0;
  }

  .badge-text {
    line-height: 1;
    white-space: nowrap;
  }

  /* Row 2: Split Action Cards */
  .split-cards {
    display: grid;
    gap: 4px;
    width: 100%;
    box-sizing: border-box;
    flex-shrink: 0;
  }

  .action-card {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: flex-start;
    padding: 3px 6px;
    background-color: var(--color-surface-1, #121212);
    border: 1px solid var(--color-border-subtle, #2a2a2a);
    border-radius: var(--radius-sm, 6px);
    cursor: pointer;
    min-width: 0;
    box-sizing: border-box;
    text-align: left;
    transition: background-color 0.1s ease, border-color 0.1s ease;
  }

  .action-card:active {
    background-color: var(--color-surface-active, #333333);
    border-color: var(--color-accent-primary, #00d2ff);
  }

  .action-card.num-card {
    padding: 3px 2px;
    align-items: center;
    text-align: center;
  }

  .card-label {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: calc(9px * var(--font-scale));
    text-transform: uppercase;
    font-weight: 700;
    letter-spacing: 0.05em;
    color: var(--color-text-muted, #828282);
    line-height: 1;
  }

  .action-card.num-card .card-label {
    justify-content: center;
    /* Fixed: the day/week cards are 44–48px wide columns. */
    font-size: 8.5px;
    letter-spacing: 0.02em;
  }

  .holiday-star {
    color: #facc15;
    font-size: calc(10px * var(--font-scale));
  }

  .card-val {
    width: 100%;
    margin-top: 2px;
    line-height: 1.15;
  }

  .svatek-name {
    font-size: calc(15px * var(--font-scale));
    font-weight: 800;
    color: var(--color-accent-primary, #00d2ff);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .mono-val {
    font-size: 15px;
    font-weight: 900;
    font-family: var(--font-mono, monospace);
    color: var(--color-text-primary, #ffffff);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
</style>
