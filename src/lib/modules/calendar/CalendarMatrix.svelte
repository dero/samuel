<script lang="ts">
  import {
    MONTH_NAMES,
    MONTH_SHORT,
    DAY_SHORT,
    getDaysInMonth,
    getDayOfWeek
  } from './calendarData';
  import Chassis from '../../components/ui/Chassis.svelte';
  import Keycap from '../../components/ui/Keycap.svelte';
  import { calendarState } from './calendarState.svelte';
  import { CaretLeft, CaretRight } from 'phosphor-svelte';

  interface Props {
    year: number;
    month: number; // 1-12
    day: number; // 1-31
    onSelect: (year: number, month: number, day: number) => void;
  }

  let { year, month, day, onSelect }: Props = $props();

  const currentYear = $derived(calendarState.today.year);
  const currentMonth = $derived(calendarState.today.month);
  const currentDay = $derived(calendarState.today.day);

  const daysInCurrentMonth = $derived(getDaysInMonth(year, month));
  const firstDayDow = $derived(getDayOfWeek(year, month, 1)); // 1 = Monday ... 7 = Sunday
  const leadingBlankDays = $derived(firstDayDow - 1);
  const trailingBlanks = $derived(42 - leadingBlankDays - daysInCurrentMonth);

  // Keeps the day when it exists in the target month, otherwise its last day
  function selectMonth(y: number, m: number) {
    onSelect(y, m, Math.min(day, getDaysInMonth(y, m)));
  }
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="calendar-matrix-container" oncontextmenu={(e) => e.preventDefault()}>
  <!-- 1. Year stepper + 12 months in 2 rows of 6 -->
  <Chassis>
    <div class="months-row">
      <div class="year-selector">
        <Keycap
          ariaLabel="Předchozí rok"
          title="Předchozí rok"
          onPress={() => selectMonth(year - 1, month)}
        >
          <CaretLeft size={16} weight="bold" />
        </Keycap>
        <span class="year-val">{year}</span>
        <Keycap
          ariaLabel="Následující rok"
          title="Následující rok"
          onPress={() => selectMonth(year + 1, month)}
        >
          <CaretRight size={16} weight="bold" />
        </Keycap>
      </div>

      <div class="months-grid">
        {#each MONTH_SHORT as mName, idx (mName)}
          {@const mNum = idx + 1}
          {@const isThisMonth = year === currentYear && mNum === currentMonth}
          <Keycap
            selected={mNum === month}
            ariaLabel="{MONTH_NAMES[idx]} {year}{isThisMonth ? ', tento měsíc' : ''}"
            onPress={() => selectMonth(year, mNum)}
          >
            <span class="month-label" class:is-current={isThisMonth}>{mName}</span>
          </Keycap>
        {/each}
      </div>
    </div>
  </Chassis>

  <!-- 2. Days of week header + 6 × 7 days -->
  <Chassis>
    <div class="dow-header-row">
      {#each DAY_SHORT as dow, idx (dow)}
        <span class="dow-label" class:is-weekend={idx >= 5}>{dow}</span>
      {/each}
    </div>

    <!-- Always 42 cells, so the grid never changes height between months -->
    <div class="days-grid">
      {#each Array.from({ length: leadingBlankDays }) as _}
        <div class="grid-filler" aria-hidden="true"></div>
      {/each}

      {#each Array.from({ length: daysInCurrentMonth }, (_, i) => i + 1) as d (d)}
        {@const isSelected = d === day}
        {@const isToday = year === currentYear && month === currentMonth && d === currentDay}
        {@const isWeekend = (leadingBlankDays + d - 1) % 7 >= 5}
        <Keycap
          selected={isSelected}
          ariaLabel="{d}. {month}. {year}{isToday ? ', dnes' : ''}"
          onPress={() => onSelect(year, month, d)}
        >
          <span
            class="day-label"
            class:is-today={isToday}
            class:is-weekend={isWeekend && !isSelected}>{d}</span
          >
        </Keycap>
      {/each}

      {#each Array.from({ length: trailingBlanks }) as _}
        <div class="grid-filler" aria-hidden="true"></div>
      {/each}
    </div>
  </Chassis>
</div>

<style>
  .calendar-matrix-container {
    display: flex;
    flex-direction: column;
    gap: clamp(4px, 1.2vh, 8px);
    width: 100%;
    user-select: none;
    -webkit-user-select: none;
    touch-action: none;
    box-sizing: border-box;
  }

  /* 1. Year stepper + months */
  .months-row {
    display: flex;
    gap: 2px;
    min-width: 0;
  }

  .year-selector {
    flex: none;
    display: grid;
    grid-template-columns: 28px auto 28px;
    align-items: center;
    gap: 2px;
  }

  .year-val {
    padding: 0 var(--space-xs);
    font-family: var(--font-mono);
    font-size: var(--text-sm);
    font-weight: 700;
    text-align: center;
    color: var(--color-text-primary);
  }

  .months-grid {
    flex: 1;
    min-width: 0;
    display: grid;
    grid-template-columns: repeat(6, 1fr);
    grid-template-rows: repeat(2, clamp(32px, 4.5vh, 40px));
    gap: 2px;
  }

  /* Short labels in a dense row: capped by width (DESIGN_SYSTEM §9) */
  .month-label {
    font-family: var(--font-sans);
    font-size: min(var(--text-xs), 3.6vw);
    font-weight: 700;
    letter-spacing: 0.04em;
    line-height: 1;
  }

  /* 2. Days */
  .dow-header-row {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    text-align: center;
    padding: 2px 0;
  }

  .dow-label {
    font-size: var(--text-xs);
    font-weight: 700;
    line-height: 1;
    color: var(--color-text-muted);
    text-transform: uppercase;
  }

  /* Weekend columns: one neutral tone from the header down */
  .dow-label.is-weekend,
  .day-label.is-weekend {
    color: var(--color-text-secondary);
  }

  .days-grid {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    grid-template-rows: repeat(6, clamp(32px, 5.2vh, 44px));
    gap: 2px;
    width: 100%;
  }

  .day-label {
    font-family: var(--font-mono);
    font-size: min(var(--key-s), 60cqh);
    font-weight: 800;
    line-height: 1;
  }

  /* Today and this month: an underline, the shape signal next to the selection's fill and ring */
  .day-label.is-today,
  .month-label.is-current {
    text-decoration-line: underline;
    text-decoration-thickness: 2px;
    text-underline-offset: 3px;
  }

  .grid-filler {
    background-color: var(--color-surface-2);
    opacity: 0.35;
    border-radius: 2px;
    pointer-events: none;
  }
</style>
