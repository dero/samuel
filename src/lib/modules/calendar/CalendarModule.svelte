<script lang="ts">
  import ModuleShell from '../../components/layout/ModuleShell.svelte';
  import SegmentedControl, { type SegmentOption } from '../../components/ui/SegmentedControl.svelte';
  import SimpleKeyboard from '../../components/ui/SimpleKeyboard.svelte';
  import EmptyHint from '../../components/ui/EmptyHint.svelte';
  import CalendarDetailCard from './CalendarDetailCard.svelte';
  import CalendarMatrix from './CalendarMatrix.svelte';
  import CalendarCalculator from './CalendarCalculator.svelte';
  import CalendarSearchList from './CalendarSearchList.svelte';
  import CalendarReference from './CalendarReference.svelte';
  import { calendarState, type CalendarFlavour } from './calendarState.svelte';

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
        <SimpleKeyboard
          includeNumbers={true}
          hasInput={!!calendarState.searchQuery}
          onChar={handleLetter}
          onBackspace={handleBackspace}
          onClear={handleClearSearch}
        />
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
</style>
