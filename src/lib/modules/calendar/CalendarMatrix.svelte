<script lang="ts">
  import {
    MONTH_SHORT,
    DAY_SHORT,
    getDaysInMonth,
    getDayOfWeek,
    isLeapYear
  } from './calendarData';
  import { settings } from '../../state/settings.svelte';
  import { CaretLeft, CaretRight, CalendarDot } from 'phosphor-svelte';

  interface Props {
    year: number;
    month: number; // 1-12
    day: number; // 1-31
    onSelect: (year: number, month: number, day: number) => void;
    onYearChange: (year: number) => void;
  }

  let { year, month, day, onSelect, onYearChange }: Props = $props();

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  const currentDay = now.getDate();

  const daysInCurrentMonth = $derived(getDaysInMonth(year, month));
  const firstDayDow = $derived(getDayOfWeek(year, month, 1)); // 1 = Monday ... 7 = Sunday
  const leadingBlankDays = $derived(firstDayDow - 1);
  const isLeap = $derived(isLeapYear(year));
  const trailingBlanks = $derived(42 - leadingBlankDays - daysInCurrentMonth);

  function handleMonthClick(m: number, e: PointerEvent) {
    if (e.button !== 0) return;
    e.preventDefault();
    settings.vibrate(20);
    const maxDays = getDaysInMonth(year, m);
    const nextDay = Math.min(day, maxDays);
    onSelect(year, m, nextDay);
  }

  function handleDayClick(d: number, e: PointerEvent) {
    if (e.button !== 0) return;
    e.preventDefault();
    settings.vibrate(20);
    onSelect(year, month, d);
  }

  function handlePrevYear(e: PointerEvent) {
    if (e.button !== 0) return;
    e.preventDefault();
    settings.vibrate(20);
    const prevY = year - 1;
    const maxDays = getDaysInMonth(prevY, month);
    onSelect(prevY, month, Math.min(day, maxDays));
  }

  function handleNextYear(e: PointerEvent) {
    if (e.button !== 0) return;
    e.preventDefault();
    settings.vibrate(20);
    const nextY = year + 1;
    const maxDays = getDaysInMonth(nextY, month);
    onSelect(nextY, month, Math.min(day, maxDays));
  }

  function handleToday(e: PointerEvent) {
    if (e.button !== 0) return;
    e.preventDefault();
    settings.vibrate(30);
    onSelect(currentYear, currentMonth, currentDay);
  }
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="calendar-matrix-container" oncontextmenu={(e) => e.preventDefault()}>
  <!-- 1. Month bar: 12 months in 2 rows of 6 -->
  <div class="months-chassis">
    {#each MONTH_SHORT as mName, idx}
      {@const mNum = idx + 1}
      {@const isSelected = mNum === month}
      {@const isThisMonth = year === currentYear && mNum === currentMonth}
      <button
        type="button"
        class="month-btn"
        class:is-active={isSelected}
        class:is-current={isThisMonth}
        onpointerdown={(e) => handleMonthClick(mNum, e)}
      >
        <span class="month-label">{mName}</span>
      </button>
    {/each}
  </div>

  <!-- 2. Days grid: Days of week header + 7 columns -->
  <div class="days-chassis">
    <!-- Dow headers -->
    <div class="dow-header-row">
      {#each DAY_SHORT as dow, idx}
        <span class="dow-label" class:is-weekend={idx >= 5}>{dow}</span>
      {/each}
    </div>

    <!-- Days matrix: exactly 42 cells (6 rows × 7 cols) -->
    <div class="days-grid">
      <!-- Leading blanks -->
      {#each Array.from({ length: leadingBlankDays }) as _}
        <div class="grid-filler" aria-hidden="true"></div>
      {/each}

      <!-- Day cells -->
      {#each Array.from({ length: daysInCurrentMonth }, (_, i) => i + 1) as d}
        {@const isSelected = d === day}
        {@const isToday = year === currentYear && month === currentMonth && d === currentDay}
        {@const dowOfThisDay = (leadingBlankDays + d - 1) % 7}
        {@const isWeekend = dowOfThisDay >= 5}
        <button
          type="button"
          class="day-btn"
          class:is-active={isSelected}
          class:is-today={isToday}
          class:is-weekend={isWeekend}
          onpointerdown={(e) => handleDayClick(d, e)}
        >
          <span class="day-number">{d}</span>
          {#if isToday}
            <span class="today-dot" aria-hidden="true"></span>
          {/if}
        </button>
      {/each}

      <!-- Trailing blanks to complete 42 cells (exactly 6 rows) -->
      {#each Array.from({ length: trailingBlanks }) as _}
        <div class="grid-filler" aria-hidden="true"></div>
      {/each}
    </div>
  </div>

  <!-- 3. Bottom row: Year control + Today button -->
  <div class="bottom-utility-row">
    <div class="year-selector">
      <button
        type="button"
        class="nav-year-btn"
        title="Předchozí rok"
        onpointerdown={handlePrevYear}
      >
        <CaretLeft size={16} />
      </button>
      <div class="year-display">
        <span class="year-val">{year}</span>
        <span class="year-tag" class:tag-leap={isLeap}>
          ({isLeap ? 366 : 365})
        </span>
      </div>
      <button
        type="button"
        class="nav-year-btn"
        title="Následující rok"
        onpointerdown={handleNextYear}
      >
        <CaretRight size={16} />
      </button>
    </div>

    <button
      type="button"
      class="today-btn"
      class:is-today-active={year === currentYear && month === currentMonth && day === currentDay}
      onpointerdown={handleToday}
    >
      <CalendarDot size={14} />
      <span>Dnes</span>
    </button>
  </div>
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

  /* 1. Months chassis: 2 rows of 6 */
  .months-chassis {
    display: grid;
    grid-template-columns: repeat(6, 1fr);
    gap: 2px;
    padding: 2px;
    background-color: var(--color-bg-canvas, #000000);
    border: 1px solid var(--color-border-subtle, #2a2a2a);
    border-radius: var(--radius-sm, 6px);
    width: 100%;
    box-sizing: border-box;
  }

  .month-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    height: clamp(30px, 4.5vh, 40px);
    background-color: var(--color-surface-2, #1c1c1c);
    color: var(--color-text-secondary, #9e9e9e);
    border: none;
    border-radius: 2px;
    cursor: pointer;
    touch-action: none;
    padding: 0;
    font-size: clamp(11px, 1.7vh, 13px);
    font-weight: 700;
    letter-spacing: 0.04em;
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.08),
      inset 0 -1px 0 rgba(0, 0, 0, 0.4);
    transition: background-color 0.08s ease, color 0.08s ease;
  }

  .month-btn:active {
    background-color: var(--color-surface-active, #333333);
    color: var(--color-accent-primary, #00d2ff);
  }

  .month-btn.is-active {
    background-color: var(--color-surface-3, #262626);
    color: var(--color-accent-primary, #00d2ff);
    box-shadow: inset 0 0 0 1px var(--color-accent-primary, #00d2ff);
  }

  .month-btn.is-current:not(.is-active) {
    color: var(--color-text-primary, #ffffff);
  }

  /* 2. Days chassis */
  .days-chassis {
    display: flex;
    flex-direction: column;
    gap: 2px;
    padding: 2px;
    background-color: var(--color-bg-canvas, #000000);
    border: 1px solid var(--color-border-subtle, #2a2a2a);
    border-radius: var(--radius-sm, 6px);
    width: 100%;
    box-sizing: border-box;
  }

  .dow-header-row {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    text-align: center;
    padding: 2px 0;
  }

  .dow-label {
    font-size: clamp(10px, 1.5vh, 12px);
    font-weight: 700;
    color: var(--color-text-muted, #666666);
    text-transform: uppercase;
  }

  .dow-label.is-weekend {
    color: #eab308;
    opacity: 0.85;
  }

  .days-grid {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    grid-template-rows: repeat(6, clamp(30px, 5.2vh, 44px));
    gap: 2px;
    width: 100%;
  }

  .day-btn {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    min-height: 30px;
    max-height: 44px;
    background-color: var(--color-surface-2, #1c1c1c);
    color: var(--color-text-primary, #ffffff);
    border: none;
    border-radius: 2px;
    cursor: pointer;
    touch-action: none;
    padding: 0;
    font-family: var(--font-mono, monospace);
    font-size: clamp(13px, 2.2vh, 16px);
    font-weight: 700;
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.08),
      inset 0 -1px 0 rgba(0, 0, 0, 0.4);
    transition: background-color 0.08s ease, color 0.08s ease;
  }

  .day-btn:active {
    background-color: var(--color-surface-active, #333333);
    color: var(--color-accent-primary, #00d2ff);
  }

  .day-btn.is-active {
    background-color: var(--color-surface-3, #262626);
    color: var(--color-accent-primary, #00d2ff);
    box-shadow: inset 0 0 0 1.5px var(--color-accent-primary, #00d2ff);
  }

  .day-btn.is-weekend:not(.is-active) {
    color: #e5e7eb;
    background-color: #171717;
  }

  .today-dot {
    position: absolute;
    bottom: 2px;
    width: 4px;
    height: 4px;
    border-radius: var(--radius-full, 9999px);
    background-color: var(--color-accent-primary, #00d2ff);
  }

  .grid-filler {
    height: 100%;
    min-height: 30px;
    max-height: 44px;
    background-color: var(--color-surface-2, #1c1c1c);
    opacity: 0.18;
    border-radius: 2px;
    pointer-events: none;
    user-select: none;
  }

  /* 3. Bottom utility row */
  .bottom-utility-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 6px;
    height: clamp(34px, 4.6vh, 42px);
    width: 100%;
    box-sizing: border-box;
  }

  .year-selector {
    display: flex;
    align-items: center;
    gap: 4px;
    background-color: var(--color-surface-1, #121212);
    border: 1px solid var(--color-border-subtle, #2a2a2a);
    border-radius: var(--radius-sm, 6px);
    padding: 2px 4px;
    flex: 1;
    height: 100%;
    box-sizing: border-box;
  }

  .nav-year-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: clamp(28px, 4vh, 36px);
    height: 100%;
    background-color: var(--color-surface-2, #1c1c1c);
    border: none;
    border-radius: var(--radius-xs, 4px);
    color: var(--color-text-secondary, #9e9e9e);
    cursor: pointer;
  }

  .nav-year-btn:active {
    background-color: var(--color-surface-active, #333333);
    color: var(--color-accent-primary, #00d2ff);
  }

  .year-display {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    flex: 1;
    font-family: var(--font-mono, monospace);
  }

  .year-val {
    font-size: clamp(13px, 2vh, 16px);
    font-weight: 700;
    color: var(--color-text-primary, #ffffff);
  }

  .year-tag {
    font-size: clamp(11px, 1.8vh, 13px);
    color: var(--color-text-muted, #828282);
  }

  .year-tag.tag-leap {
    color: #38bdf8;
    font-weight: 700;
  }

  .today-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 5px;
    height: 100%;
    padding: 0 clamp(10px, 2vh, 16px);
    background-color: var(--color-surface-1, #121212);
    border: 1px solid var(--color-border-subtle, #2a2a2a);
    border-radius: var(--radius-sm, 6px);
    color: var(--color-text-secondary, #9e9e9e);
    font-size: clamp(12px, 1.8vh, 14px);
    font-weight: 600;
    cursor: pointer;
    user-select: none;
    -webkit-user-select: none;
  }

  .today-btn:active {
    background-color: var(--color-surface-active, #333333);
    color: var(--color-accent-primary, #00d2ff);
  }

  .today-btn.is-today-active {
    border-color: rgba(0, 210, 255, 0.4);
    color: var(--color-accent-primary, #00d2ff);
  }
</style>
