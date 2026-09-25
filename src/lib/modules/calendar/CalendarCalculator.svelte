<script lang="ts">
  import { calendarState, type CalcMode } from './calendarState.svelte';
  import SegmentedControl, { type SegmentOption } from '../../components/ui/SegmentedControl.svelte';
  import CalendarDetailCard from './CalendarDetailCard.svelte';
  import NumberStepper from './NumberStepper.svelte';

  interface Props {
    view: 'output' | 'input';
  }

  let { view }: Props = $props();

  const calcModeOptions: SegmentOption<CalcMode>[] = [
    { id: 'offset', label: 'Posun data' },
    { id: 'diff', label: 'Interval' }
  ];

  let offsetTimer: ReturnType<typeof setTimeout> | null = null;
  let offsetInterval: ReturnType<typeof setInterval> | null = null;

  function clearOffsetTimers() {
    if (offsetTimer) {
      clearTimeout(offsetTimer);
      offsetTimer = null;
    }
    if (offsetInterval) {
      clearInterval(offsetInterval);
      offsetInterval = null;
    }
  }

  function handleOffsetBtnDown(e: PointerEvent, delta: number) {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    e.preventDefault();
    clearOffsetTimers();
    calendarState.adjustOffset(delta);

    offsetTimer = setTimeout(() => {
      offsetInterval = setInterval(() => {
        calendarState.adjustOffset(delta);
      }, 80);
    }, 320);
  }

  const absOffset = $derived(Math.abs(calendarState.offsetDays));
  const offsetUnitLabel = $derived(
    absOffset === 1 ? 'den' : absOffset >= 2 && absOffset <= 4 ? 'dny' : 'dní'
  );

  const absDiff = $derived(Math.abs(calendarState.diffResult.days));
  const diffUnitLabel = $derived(
    absDiff === 1 ? 'den' : absDiff >= 2 && absDiff <= 4 ? 'dny' : 'dní'
  );

  const intervalDisplay = $derived.by(() => {
    const d = calendarState.diffResult.days;
    if (d > 0) return `+${d}`;
    if (d < 0) return `−${Math.abs(d)}`;
    return '0';
  });
</script>

{#if view === 'output'}
  <div class="calc-output-container">
    {#if calendarState.calcMode === 'offset'}
      <!-- Equation: Base Date -> Offset -> [=] -> [Detail Card] -->
      <div class="equation-flow offset-flow">
        <div class="eq-date-line">
          <span class="eq-dow">{calendarState.currentDayDetail.dayOfWeekName}</span>
          <span class="eq-date">
            {calendarState.currentDayDetail.day}. {calendarState.currentDayDetail.monthNameGenitive} {calendarState.currentDayDetail.year}
          </span>
        </div>

        <div class="eq-math-line">
          <span class="eq-offset-highlight">
            {calendarState.offsetDays >= 0 ? `+ ${calendarState.offsetDays}` : `− ${absOffset}`}
          </span>
          <span class="eq-math-label">{offsetUnitLabel}</span>
        </div>

        <div class="eq-equals-large">=</div>

        <div class="eq-card-wrap">
          <CalendarDetailCard detail={calendarState.offsetTargetDetail} variant="compact" />
        </div>
      </div>
    {:else}
      <!-- Interval: Start Date (input) -> Large Days Result (output) -> End Date (input) -->
      <div class="equation-flow interval-flow">
        <!-- 1. Výchozí den (vstup) -->
        <div class="eq-date-line">
          <span class="eq-dow">{calendarState.diffFromDetail.dayOfWeekName}</span>
          <span class="eq-date">
            {calendarState.diffFromDetail.day}. {calendarState.diffFromDetail.monthNameGenitive} {calendarState.diffFromDetail.year}
          </span>
        </div>

        <!-- 2. Počet dnů (výstup - velký, výrazný) -->
        <div class="interval-hero-line">
          <span class="interval-hero-val">{intervalDisplay}</span>
          <span class="interval-hero-unit">{diffUnitLabel}</span>
        </div>

        <!-- 3. Finální den (vstup - shodné formátování s výchozím dnem) -->
        <div class="eq-date-line">
          <span class="eq-dow">{calendarState.diffToDetail.dayOfWeekName}</span>
          <span class="eq-date">
            {calendarState.diffToDetail.day}. {calendarState.diffToDetail.monthNameGenitive} {calendarState.diffToDetail.year}
          </span>
        </div>
      </div>
    {/if}
  </div>
{:else}
  <div class="calc-input-stage">
    <!-- Sub-selector for Mode -->
    <div class="calc-subtoolbar">
      <SegmentedControl
        options={calcModeOptions}
        value={calendarState.calcMode}
        onChange={(m) => calendarState.setCalcMode(m)}
        size="sm"
      />
    </div>

    {#if calendarState.calcMode === 'offset'}
      <!-- Single row of 7 buttons: [-30] [-7] [-1] [ Reset ] [+1] [+7] [+30] -->
      <div class="offset-stepper-row">
        <button
          type="button"
          class="offset-btn neg"
          onpointerdown={(e) => handleOffsetBtnDown(e, -30)}
          onpointerup={clearOffsetTimers}
          onpointerleave={clearOffsetTimers}
          onpointercancel={clearOffsetTimers}
          oncontextmenu={(e) => e.preventDefault()}
        >
          -30
        </button>
        <button
          type="button"
          class="offset-btn neg"
          onpointerdown={(e) => handleOffsetBtnDown(e, -7)}
          onpointerup={clearOffsetTimers}
          onpointerleave={clearOffsetTimers}
          onpointercancel={clearOffsetTimers}
          oncontextmenu={(e) => e.preventDefault()}
        >
          -7
        </button>
        <button
          type="button"
          class="offset-btn neg"
          onpointerdown={(e) => handleOffsetBtnDown(e, -1)}
          onpointerup={clearOffsetTimers}
          onpointerleave={clearOffsetTimers}
          onpointercancel={clearOffsetTimers}
          oncontextmenu={(e) => e.preventDefault()}
        >
          -1
        </button>
        <button
          type="button"
          class="offset-btn reset"
          class:is-dimmed={calendarState.offsetDays === 0}
          onclick={() => calendarState.resetOffset()}
          oncontextmenu={(e) => e.preventDefault()}
          title="Resetovat posun na 0"
        >
          Reset
        </button>
        <button
          type="button"
          class="offset-btn pos"
          onpointerdown={(e) => handleOffsetBtnDown(e, 1)}
          onpointerup={clearOffsetTimers}
          onpointerleave={clearOffsetTimers}
          onpointercancel={clearOffsetTimers}
          oncontextmenu={(e) => e.preventDefault()}
        >
          +1
        </button>
        <button
          type="button"
          class="offset-btn pos"
          onpointerdown={(e) => handleOffsetBtnDown(e, 7)}
          onpointerup={clearOffsetTimers}
          onpointerleave={clearOffsetTimers}
          onpointercancel={clearOffsetTimers}
          oncontextmenu={(e) => e.preventDefault()}
        >
          +7
        </button>
        <button
          type="button"
          class="offset-btn pos"
          onpointerdown={(e) => handleOffsetBtnDown(e, 30)}
          onpointerup={clearOffsetTimers}
          onpointerleave={clearOffsetTimers}
          onpointercancel={clearOffsetTimers}
          oncontextmenu={(e) => e.preventDefault()}
        >
          +30
        </button>
      </div>
    {:else}
      <!-- Diff Steppers: 2 rows (OD and DO) -->
      <div class="diff-steppers-container">
        <!-- Row 1: OD -->
        <div class="diff-stepper-row">
          <span class="row-prefix-label">OD</span>
          <div class="steppers-grid">
            <NumberStepper
              label="Den"
              value="{calendarState.diffFrom.day}."
              onIncrement={() => calendarState.adjustDatePart('from', 'day', 1)}
              onDecrement={() => calendarState.adjustDatePart('from', 'day', -1)}
            />
            <NumberStepper
              label="Měsíc"
              value="{calendarState.diffFrom.month}."
              onIncrement={() => calendarState.adjustDatePart('from', 'month', 1)}
              onDecrement={() => calendarState.adjustDatePart('from', 'month', -1)}
            />
            <NumberStepper
              label="Rok"
              value={calendarState.diffFrom.year}
              onIncrement={() => calendarState.adjustDatePart('from', 'year', 1)}
              onDecrement={() => calendarState.adjustDatePart('from', 'year', -1)}
            />
          </div>
        </div>

        <!-- Row 2: DO -->
        <div class="diff-stepper-row">
          <span class="row-prefix-label">DO</span>
          <div class="steppers-grid">
            <NumberStepper
              label="Den"
              value="{calendarState.diffTo.day}."
              onIncrement={() => calendarState.adjustDatePart('to', 'day', 1)}
              onDecrement={() => calendarState.adjustDatePart('to', 'day', -1)}
            />
            <NumberStepper
              label="Měsíc"
              value="{calendarState.diffTo.month}."
              onIncrement={() => calendarState.adjustDatePart('to', 'month', 1)}
              onDecrement={() => calendarState.adjustDatePart('to', 'month', -1)}
            />
            <NumberStepper
              label="Rok"
              value={calendarState.diffTo.year}
              onIncrement={() => calendarState.adjustDatePart('to', 'year', 1)}
              onDecrement={() => calendarState.adjustDatePart('to', 'year', -1)}
            />
          </div>
        </div>
      </div>
    {/if}
  </div>
{/if}

<style>
  /* ZONE-OUTPUT styling */
  .calc-output-container {
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    align-items: center;
    width: 100%;
    box-sizing: border-box;
    padding-bottom: 4px;
  }

  .equation-flow {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    width: 100%;
    box-sizing: border-box;
  }

  .offset-flow {
    gap: 3px;
  }

  .interval-flow {
    gap: 6px;
    padding-bottom: 4px;
  }

  /* Date line: gray, centered (both inputs in interval & base in offset) */
  .eq-date-line {
    display: flex;
    align-items: baseline;
    justify-content: center;
    gap: 6px;
    font-size: 14.5px;
    color: var(--color-text-secondary, #b3b3b3);
    line-height: 1.25;
  }

  .eq-dow {
    font-weight: 700;
    text-transform: uppercase;
    font-size: 12px;
    letter-spacing: 0.03em;
    color: var(--color-text-secondary, #b3b3b3);
  }

  .eq-date {
    font-weight: 600;
    color: var(--color-text-secondary, #b3b3b3);
  }

  /* Math line: centered, only number is blue */
  .eq-math-line {
    display: flex;
    align-items: baseline;
    justify-content: center;
    gap: 6px;
    line-height: 1.25;
  }

  .eq-offset-highlight {
    font-family: var(--font-mono, monospace);
    font-size: 19px;
    font-weight: 900;
    color: var(--color-accent-primary, #00d2ff);
  }

  .eq-math-label {
    font-size: 15px;
    font-weight: 600;
    color: var(--color-text-secondary, #b3b3b3);
  }

  /* Big gray equals sign */
  .eq-equals-large {
    font-size: 26px;
    font-weight: 700;
    line-height: 1;
    color: var(--color-text-muted, #666666);
    margin: 2px 0 0 0;
    user-select: none;
    -webkit-user-select: none;
  }

  /* Card wrapper with much larger gap from '=' */
  .eq-card-wrap {
    width: 100%;
    margin-top: var(--space-2xl, 24px);
  }

  /* Hero line in Interval: large prominent output */
  .interval-hero-line {
    display: flex;
    align-items: baseline;
    justify-content: center;
    gap: 8px;
    margin: 4px 0;
  }

  .interval-hero-val {
    font-family: var(--font-mono, monospace);
    font-size: 34px;
    font-weight: 900;
    color: var(--color-accent-primary, #00d2ff);
    line-height: 1;
    letter-spacing: -0.02em;
  }

  .interval-hero-unit {
    font-family: var(--font-sans);
    font-size: 20px;
    font-weight: 700;
    color: var(--color-accent-primary, #00d2ff);
    line-height: 1;
  }

  /* ZONE-INPUT styling */
  .calc-input-stage {
    display: flex;
    flex-direction: column;
    gap: var(--space-sm, 8px);
    width: 100%;
    box-sizing: border-box;
  }

  .calc-subtoolbar {
    width: 100%;
    height: 36px;
    box-sizing: border-box;
  }

  /* Single 7-col offset row */
  .offset-stepper-row {
    display: grid;
    grid-template-columns: repeat(3, 1fr) 1.2fr repeat(3, 1fr);
    gap: 2px;
    width: 100%;
    height: 42px;
    background-color: var(--color-bg-canvas, #000000);
    border: 1px solid var(--color-border-subtle, #2a2a2a);
    border-radius: var(--radius-sm, 6px);
    padding: 2px;
    box-sizing: border-box;
    user-select: none;
    -webkit-user-select: none;
  }

  .offset-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    background-color: var(--color-surface-2, #1c1c1c);
    border: none;
    border-radius: 2px;
    font-family: var(--font-mono, monospace);
    font-size: 13px;
    font-weight: 800;
    color: var(--color-text-primary, #ffffff);
    cursor: pointer;
    touch-action: none;
    -webkit-touch-callout: none;
    -webkit-user-select: none;
    user-select: none;
    padding: 0;
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.08),
      inset 0 -1px 0 rgba(0, 0, 0, 0.4);
    transition: background-color 0.08s ease, color 0.08s ease;
  }

  .offset-btn:active {
    background-color: var(--color-surface-active, #333333);
  }

  .offset-btn.pos:active {
    color: var(--color-accent-primary, #00d2ff);
  }

  .offset-btn.neg:active {
    color: #f87171;
  }

  .offset-btn.reset {
    font-family: var(--font-sans);
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: var(--color-text-secondary, #b3b3b3);
  }

  .offset-btn.reset.is-dimmed {
    opacity: 0.45;
  }

  /* Diff steppers 2 rows */
  .diff-steppers-container {
    display: flex;
    flex-direction: column;
    gap: 6px;
    width: 100%;
    box-sizing: border-box;
  }

  .diff-stepper-row {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    box-sizing: border-box;
  }

  .row-prefix-label {
    width: 22px;
    font-size: 11px;
    font-weight: 800;
    color: var(--color-accent-primary, #00d2ff);
    text-align: center;
    flex-shrink: 0;
    user-select: none;
  }

  .steppers-grid {
    display: flex;
    align-items: center;
    gap: 4px;
    flex: 1;
    min-width: 0;
  }
</style>
