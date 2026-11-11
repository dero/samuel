<script lang="ts">
  import type { SearchMatch, DayDetail } from './calendarData';
  import CalendarDetailCard from './CalendarDetailCard.svelte';
  import { settings } from '../../state/settings.svelte';
  import { CaretRight, CaretDown } from 'phosphor-svelte';
  import { slide } from 'svelte/transition';

  interface Props {
    matches: SearchMatch[];
    expandedKey: string | null;
    onToggle: (month: number, day: number) => void;
  }

  let { matches, expandedKey, onToggle }: Props = $props();

  function getDisplayName(detail: DayDetail): string {
    if (detail.namesCz.length > 0) {
      return detail.namesCz.join(', ');
    }
    return detail.movableHoliday ?? detail.holidayCz ?? '—';
  }

  function handleRowClick(m: number, d: number, e: MouseEvent) {
    settings.vibrate(20);
    const itemKey = `${m}-${d}`;
    const willExpand = expandedKey !== itemKey;
    onToggle(m, d);

    if (willExpand) {
      const groupEl = (e.currentTarget as HTMLElement).closest('.search-item-group');
      if (groupEl) {
        setTimeout(() => {
          groupEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }, 60);
      }
    }
  }
</script>

<div class="search-list-container" data-allow-contextmenu>
  {#each matches as match (match.dayDetail.month + '-' + match.dayDetail.day)}
    {@const itemKey = `${match.dayDetail.month}-${match.dayDetail.day}`}
    {@const isExpanded = expandedKey === itemKey}
    {@const displayName = getDisplayName(match.dayDetail)}

    <div class="search-item-group" class:is-expanded={isExpanded}>
      <button
        type="button"
        class="search-item-row"
        class:is-active={isExpanded}
        onclick={(e) => handleRowClick(match.dayDetail.month, match.dayDetail.day, e)}
      >
        <div class="row-content">
          <span class="row-date">{match.dayDetail.day}. {match.dayDetail.month}.</span>
          <span class="row-name">{displayName}</span>
        </div>

        <div class="row-meta">
          {#if match.matchReason.includes('den v roce')}
            <span class="row-tag">{match.dayDetail.dayOfYear}. d.</span>
          {/if}
          <span class="chevron-icon">
            {#if isExpanded}
              <CaretDown size={14} />
            {:else}
              <CaretRight size={14} />
            {/if}
          </span>
        </div>
      </button>

      {#if isExpanded}
        <div class="expanded-detail-box" transition:slide={{ duration: 160 }}>
          <CalendarDetailCard detail={match.dayDetail} variant="expanded" />
        </div>
      {/if}
    </div>
  {/each}
</div>

<style>
  .search-list-container {
    display: flex;
    flex-direction: column;
    gap: 6px;
    width: 100%;
    height: 100%;
    box-sizing: border-box;
    overflow-y: auto;
    overscroll-behavior: contain;
    padding-right: 2px;
  }

  .search-item-group {
    display: flex;
    flex-direction: column;
    background-color: var(--color-surface-1);
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-sm);
    overflow: hidden;
    transition: border-color 0.12s ease;
    flex-shrink: 0;
  }

  /* Open item: accent border plus the caret turning down and the row fill */
  .search-item-group.is-expanded {
    border-color: var(--color-accent-primary);
  }

  .search-item-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    width: 100%;
    height: 38px;
    padding: 0 10px;
    background: transparent;
    border: none;
    cursor: pointer;
    text-align: left;
    transition: background-color 0.1s ease;
    user-select: none;
    -webkit-user-select: none;
    box-sizing: border-box;
  }

  .search-item-row:active {
    background-color: var(--color-surface-active);
  }

  .search-item-row.is-active {
    background-color: var(--color-surface-2);
  }

  .row-content {
    display: flex;
    align-items: baseline;
    gap: 10px;
    min-width: 0;
    flex: 1;
    overflow: hidden;
  }

  /* Mono, so 7ch holds the longest date "28. 12." exactly */
  .row-date {
    flex: none;
    width: 7ch;
    font-size: var(--text-sm);
    font-weight: 800;
    font-family: var(--font-mono);
    font-variant-numeric: tabular-nums;
    color: var(--color-text-secondary);
    white-space: nowrap;
    text-align: right;
  }

  .row-name {
    font-size: var(--text-sm);
    font-weight: 700;
    color: var(--color-text-primary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    min-width: 0;
    flex: 1;
  }

  .row-meta {
    display: flex;
    align-items: center;
    gap: 6px;
    flex-shrink: 0;
  }

  .row-tag {
    font-size: var(--text-xs);
    font-family: var(--font-mono);
    color: var(--color-text-muted);
    background-color: var(--color-surface-2);
    padding: 1px 5px;
    border-radius: var(--radius-xs);
  }

  .chevron-icon {
    display: flex;
    align-items: center;
    color: var(--color-text-secondary);
  }

  .expanded-detail-box {
    padding: 6px 8px 8px 8px;
    background-color: var(--color-bg-canvas);
    border-top: 1px solid var(--color-border-subtle);
    height: auto;
    min-height: 0;
    box-sizing: border-box;
  }
</style>
