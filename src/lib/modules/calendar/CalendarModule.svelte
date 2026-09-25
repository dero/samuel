<script lang="ts">
  import ModuleShell from '../../components/layout/ModuleShell.svelte';
  import SegmentedControl, { type SegmentOption } from '../../components/ui/SegmentedControl.svelte';
  import AlphabetGrid from '../../components/ui/AlphabetGrid.svelte';
  import SlideToAction from '../../components/ui/SlideToAction.svelte';
  import BackspaceButton from '../../components/ui/BackspaceButton.svelte';
  import EmptyHint from '../../components/ui/EmptyHint.svelte';
  import CalendarDetailCard from './CalendarDetailCard.svelte';
  import CalendarMatrix from './CalendarMatrix.svelte';
  import CalendarCalculator from './CalendarCalculator.svelte';
  import CalendarSearchList from './CalendarSearchList.svelte';
  import CalendarReference from './CalendarReference.svelte';
  import { calendarState, type CalendarFlavour } from './calendarState.svelte';

  const A36_LETTERS = [
    'A', 'B', 'C', 'D', 'E', 'F',
    'G', 'H', 'I', 'J', 'K', 'L',
    'M', 'N', 'O', 'P', 'Q', 'R',
    'S', 'T', 'U', 'V', 'W', 'X',
    'Y', 'Z', '0', '1', '2', '3',
    '4', '5', '6', '7', '8', '9'
  ];

  const flavourOptions: SegmentOption<CalendarFlavour>[] = [
    { id: 'calendar', label: 'Kalendář' },
    { id: 'search', label: 'Hledat' },
    { id: 'calc', label: 'Kalkulátor' }
  ];

  function handleFlavourChange(val: CalendarFlavour) {
    calendarState.setFlavour(val);
  }

  function handleDateSelect(y: number, m: number, d: number) {
    calendarState.selectDate(y, m, d);
  }

  function handleYearChange(y: number) {
    calendarState.setYear(y);
  }

  function handleLetter(char: string) {
    calendarState.addSearchChar(char);
  }

  function handleClearSearch() {
    calendarState.clearSearch();
  }

  function handleBackspace() {
    calendarState.backspaceSearch();
  }
</script>

<ModuleShell
  title="Kalendář"
  hasAlphabet={false}
  layoutMode="default"
  onReset={() => calendarState.resetModule()}
>
  <!-- ZONE-OUTPUT: Dynamic per Flavour -->
  {#snippet output()}
    <div class="calendar-output-wrapper">
      {#if calendarState.activeFlavour === 'calendar'}
        <div class="calendar-detail-fit">
          <CalendarDetailCard detail={calendarState.currentDayDetail} variant="compact" />
        </div>
      {:else if calendarState.activeFlavour === 'search'}
        {#if !calendarState.searchQuery}
          <div class="search-empty-container">
            <EmptyHint
              text="Zadejte datum (např. 133 = 13. 3.), začátek jména nebo den v roce (1–366)"
            />
          </div>
        {:else if calendarState.searchMatches.length === 0}
          <div class="no-matches-box">
            <span class="no-matches-query">„{calendarState.searchQuery}“</span>
            <span class="no-matches-msg">Nenalezen žádný svátek ani den</span>
          </div>
        {:else}
          <!-- Simplified search results list with toggleable accordion day card -->
          <CalendarSearchList
            matches={calendarState.searchMatches}
            expandedKey={calendarState.expandedDayKey}
            onToggle={(m, d) => calendarState.toggleExpandedDay(m, d)}
          />
        {/if}
      {:else if calendarState.activeFlavour === 'calc'}
        <div class="calendar-card-scroll">
          <CalendarCalculator view="output" />
        </div>
      {/if}
    </div>
  {/snippet}

  <!-- ZONE-INPUT: Subtoolbar + Stage + Keypad -->
  {#snippet input()}
    <div class="zone-input-flow">
      <!-- 1. Sub-Toolbar (36px fixed) -->
      <div class="subtoolbar-container">
        <SegmentedControl
          options={flavourOptions}
          value={calendarState.activeFlavour}
          onChange={handleFlavourChange}
          size="sm"
        />
      </div>

      <!-- 2. Active Stage per Flavour -->
      {#if calendarState.activeFlavour === 'calendar'}
        <CalendarMatrix
          year={calendarState.year}
          month={calendarState.month}
          day={calendarState.day}
          onSelect={handleDateSelect}
          onYearChange={handleYearChange}
        />
      {:else if calendarState.activeFlavour === 'search'}
        <!-- Alphanumeric 36 Touch Keypad -->
        <AlphabetGrid
          letters={A36_LETTERS}
          onLetter={handleLetter}
        />

        <!-- Utilitní trojblok (42px) -->
        <div class="keypad-utility-row-3col">
          <SlideToAction
            disabled={!calendarState.searchQuery}
            onAction={handleClearSearch}
            ariaLabel="Vymazat hledání tažením"
          />

          <button
            type="button"
            class="utility-btn next-action-btn"
            class:is-active={!!calendarState.searchQuery}
            disabled={!calendarState.searchQuery}
            onclick={handleClearSearch}
            title="Další hledání (vymazat dotaz)"
            aria-label="Další hledání (vymazat)"
          >
            <span class="next-label">Dál</span>
            {#if calendarState.searchQuery}
              <span class="next-query-badge">{calendarState.searchQuery}</span>
            {/if}
          </button>

          <BackspaceButton
            disabled={!calendarState.searchQuery}
            onAction={handleBackspace}
          />
        </div>
      {:else if calendarState.activeFlavour === 'calc'}
        <CalendarCalculator view="input" />
      {/if}
    </div>
  {/snippet}

  <!-- Reference Modal Content -->
  {#snippet reference()}
    <CalendarReference />
  {/snippet}
</ModuleShell>

<style>
  .calendar-output-wrapper {
    flex: 1;
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;
    min-height: var(--output-min-height, 84px);
    overflow: hidden;
    position: relative;
    box-sizing: border-box;
    padding: 0;
  }

  .calendar-detail-fit {
    flex: 1;
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    overflow: hidden;
  }

  .calendar-card-scroll {
    flex: 1;
    height: 100%;
    width: 100%;
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    overflow-y: auto;
    overscroll-behavior: contain;
  }

  .search-empty-container {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
  }

  .no-matches-box {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 6px;
    color: var(--color-text-muted, #666666);
  }

  .no-matches-query {
    font-size: var(--text-base, 16px);
    font-weight: 700;
    font-family: var(--font-mono, monospace);
    color: var(--color-text-secondary, #9e9e9e);
  }

  .no-matches-msg {
    font-size: var(--text-xs, 12px);
  }

  /* Next 1-tap clear button inside 3-col utility row */
  .next-action-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    height: 100%;
    width: 100%;
    background-color: var(--color-surface-2, #1c1c1c);
    border: none;
    border-radius: 2px;
    padding: 0 8px;
    cursor: pointer;
    user-select: none;
    -webkit-user-select: none;
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.08),
      inset 0 -1px 0 rgba(0, 0, 0, 0.4);
    transition: background-color 0.12s ease, box-shadow 0.08s ease;
    box-sizing: border-box;
    min-width: 0;
  }

  .next-action-btn:active:not(:disabled) {
    background-color: var(--color-surface-active, #333333);
    box-shadow: inset 0 1.5px 3px rgba(0, 0, 0, 0.7);
  }

  .next-action-btn:disabled {
    cursor: not-allowed;
  }

  .next-label {
    font-size: var(--text-sm, 13px);
    font-weight: 800;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: var(--color-text-secondary, #b3b3b3);
    line-height: 1;
    flex-shrink: 0;
    transition: color 0.12s ease;
  }

  .next-action-btn.is-active .next-label {
    color: var(--color-accent-primary, #00d2ff);
  }

  .next-action-btn:disabled .next-label {
    color: var(--color-text-muted, #666666);
    opacity: 0.5;
  }

  .next-query-badge {
    font-family: var(--font-mono, monospace);
    font-size: 11px;
    font-weight: 700;
    color: var(--color-text-primary, #ffffff);
    background-color: var(--color-surface-1, #121212);
    border: 1px solid var(--color-border-subtle, #2a2a2a);
    border-radius: var(--radius-xs, 4px);
    padding: 1px 5px;
    max-width: 65px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    line-height: 1.2;
    flex-shrink: 1;
  }
</style>
