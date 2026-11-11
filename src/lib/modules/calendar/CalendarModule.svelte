<script lang="ts">
  import ModuleShell from '../../components/layout/ModuleShell.svelte';
  import SegmentedControl, { type SegmentOption } from '../../components/ui/SegmentedControl.svelte';
  import SimpleKeyboard from '../../components/ui/SimpleKeyboard.svelte';
  import type { ModuleBarConfig } from '../../components/layout/ModuleBar.svelte';
  import { CalendarDot } from 'phosphor-svelte';
  import CalendarDetailCard from './CalendarDetailCard.svelte';
  import CalendarMatrix from './CalendarMatrix.svelte';
  import CalendarCalculator from './CalendarCalculator.svelte';
  import CalendarSearchList from './CalendarSearchList.svelte';
  import CalendarReference from './CalendarReference.svelte';
  import { calendarState, type CalendarFlavour } from './calendarState.svelte';
  import { isLeapYear } from './calendarData';

  const todayYear = $derived(calendarState.today.year);
  const todayMonth = $derived(calendarState.today.month);
  const todayDay = $derived(calendarState.today.day);

  $effect(() => {
    const refresh = () => calendarState.refreshToday();
    document.addEventListener('visibilitychange', refresh);
    return () => document.removeEventListener('visibilitychange', refresh);
  });

  const isOnToday = $derived(
    calendarState.year === todayYear &&
      calendarState.month === todayMonth &&
      calendarState.day === todayDay
  );

  const bar = $derived.by<ModuleBarConfig>(() => {
    if (calendarState.activeFlavour === 'calendar') {
      return {
        status: isLeapYear(calendarState.year) ? 'Přestupný rok, 366 dní' : 'Běžný rok, 365 dní',
        action: {
          label: 'Dnes',
          icon: CalendarDot,
          disabled: isOnToday,
          onClick: () => {
            calendarState.refreshToday();
            calendarState.setToday();
          }
        }
      };
    }
    if (calendarState.activeFlavour === 'search') {
      return {
        hint: 'Datum 133 = 13. 3., jméno, pořadí dne.',
        empty: !calendarState.searchQuery,
        status: `Nalezeno ${calendarState.searchMatches.length}`
      };
    }
    return {};
  });

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
  {bar}
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
        {#if calendarState.searchQuery && calendarState.searchMatches.length === 0}
          <div class="no-matches-box">
            <span class="no-matches-query">„{calendarState.searchQuery}“</span>
            <span class="no-matches-msg">Nic nenalezeno</span>
          </div>
        {:else if calendarState.searchQuery}
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

  {#snippet variants()}
    <SegmentedControl
      options={flavourOptions}
      value={calendarState.activeFlavour}
      onChange={handleFlavourChange}
      size="sm"
    />
  {/snippet}

  <!-- ZONE-INPUT: Active stage per flavour -->
  {#snippet input()}
    {#if calendarState.activeFlavour === 'calendar'}
      <CalendarMatrix
        year={calendarState.year}
        month={calendarState.month}
        day={calendarState.day}
        onSelect={handleDateSelect}
      />
    {:else if calendarState.activeFlavour === 'search'}
      <SimpleKeyboard
        query={calendarState.searchQuery}
        placeholder="Datum, jméno, pořadí dne…"
        includeNumbers={true}
        hasInput={!!calendarState.searchQuery}
        onChar={handleLetter}
        onBackspace={handleBackspace}
        onClear={handleClearSearch}
      />
    {:else if calendarState.activeFlavour === 'calc'}
      <CalendarCalculator view="input" />
    {/if}
  {/snippet}

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
    min-height: 0;
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

  .no-matches-box {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 6px;
    color: var(--color-text-muted);
  }

  .no-matches-query {
    font-size: var(--text-base);
    font-weight: 700;
    font-family: var(--font-mono);
    color: var(--color-text-secondary);
  }

  .no-matches-msg {
    font-size: var(--text-xs);
  }
</style>
