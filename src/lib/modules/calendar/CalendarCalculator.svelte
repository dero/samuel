<script lang="ts">
  import { calendarState, type CalcMode } from './calendarState.svelte';
  import SegmentedControl, { type SegmentOption } from '../../components/ui/SegmentedControl.svelte';
  import Chassis from '../../components/ui/Chassis.svelte';
  import HoldToAction from '../../components/ui/HoldToAction.svelte';
  import CalendarDetailCard from './CalendarDetailCard.svelte';
  import NumberStepper from './NumberStepper.svelte';
  import RepeatKey from './RepeatKey.svelte';

  interface Props {
    view: 'output' | 'input';
  }

  let { view }: Props = $props();

  const KEY_HEIGHT = '36px';

  const calcModeOptions: SegmentOption<CalcMode>[] = [
    { id: 'offset', label: 'Posun data' },
    { id: 'diff', label: 'Interval' }
  ];

  const OFFSET_STEPS_BACK = [-30, -7, -1];
  const OFFSET_STEPS_FORWARD = [1, 7, 30];

  const DIFF_ROWS = [
    { id: 'from', label: 'OD' },
    { id: 'to', label: 'DO' }
  ] as const;

  function dayUnit(n: number): string {
    const abs = Math.abs(n);
    if (abs === 1) return 'den';
    return abs >= 2 && abs <= 4 ? 'dny' : 'dní';
  }

  function formatStep(delta: number): string {
    return delta < 0 ? `−${Math.abs(delta)}` : `+${delta}`;
  }

  const absOffset = $derived(Math.abs(calendarState.offsetDays));

  const intervalDisplay = $derived.by(() => {
    const d = calendarState.diffResult.days;
    if (d > 0) return `+${d}`;
    if (d < 0) return `−${Math.abs(d)}`;
    return '0';
  });
</script>

{#snippet offsetKey(delta: number)}
  <RepeatKey
    label={formatStep(delta)}
    ariaLabel="Posun {formatStep(delta)} {dayUnit(delta)}"
    onStep={() => calendarState.adjustOffset(delta)}
  />
{/snippet}

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
          <span class="eq-math-label">{dayUnit(calendarState.offsetDays)}</span>
        </div>

        <div class="eq-equals-large">=</div>

        <div class="eq-card-wrap">
          <CalendarDetailCard detail={calendarState.offsetTargetDetail} variant="compact" />
        </div>
      </div>
    {:else}
      <!-- Interval: Start Date (input) -> Large Days Result (output) -> End Date (input) -->
      <div class="equation-flow interval-flow">
        <div class="eq-date-line">
          <span class="eq-dow">{calendarState.diffFromDetail.dayOfWeekName}</span>
          <span class="eq-date">
            {calendarState.diffFromDetail.day}. {calendarState.diffFromDetail.monthNameGenitive} {calendarState.diffFromDetail.year}
          </span>
        </div>

        <div class="interval-hero-line">
          <span class="interval-hero-val">{intervalDisplay}</span>
          <span class="interval-hero-unit">{dayUnit(calendarState.diffResult.days)}</span>
        </div>

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
    <!-- Changes how the dates are entered, so it may sit here as a flat 36 px row -->
    <SegmentedControl
      options={calcModeOptions}
      value={calendarState.calcMode}
      onChange={(m) => calendarState.setCalcMode(m)}
      ariaLabel="Režim kalkulátoru"
      size="sm"
    />

    {#if calendarState.calcMode === 'offset'}
      <!-- [−30] [−7] [−1] [vynulovat] [+1] [+7] [+30] -->
      <Chassis columns={7} keyHeight={KEY_HEIGHT}>
        {#each OFFSET_STEPS_BACK as delta (delta)}
          {@render offsetKey(delta)}
        {/each}
        <div class="offset-reset">
          <HoldToAction
            disabled={calendarState.offsetDays === 0}
            onAction={() => calendarState.resetOffset()}
            ariaLabel="Vynulovat posun podržením"
            tapWarning="Podržte pro vynulování"
          />
        </div>
        {#each OFFSET_STEPS_FORWARD as delta (delta)}
          {@render offsetKey(delta)}
        {/each}
      </Chassis>
    {:else}
      <!-- Header row, then OD and DO: [−] den [+] [−] měsíc [+] [−] rok [+] -->
      <Chassis keyHeight={KEY_HEIGHT}>
        <div class="diff-grid">
          <span aria-hidden="true"></span>
          <span class="diff-head">Den</span>
          <span class="diff-head">Měsíc</span>
          <span class="diff-head">Rok</span>

          {#each DIFF_ROWS as row (row.id)}
            {@const date = row.id === 'from' ? calendarState.diffFrom : calendarState.diffTo}
            <span class="diff-row-label">{row.label}</span>
            <NumberStepper
              label="den ({row.label})"
              value="{date.day}."
              onIncrement={() => calendarState.adjustDatePart(row.id, 'day', 1)}
              onDecrement={() => calendarState.adjustDatePart(row.id, 'day', -1)}
            />
            <NumberStepper
              label="měsíc ({row.label})"
              value="{date.month}."
              onIncrement={() => calendarState.adjustDatePart(row.id, 'month', 1)}
              onDecrement={() => calendarState.adjustDatePart(row.id, 'month', -1)}
            />
            <NumberStepper
              label="rok ({row.label})"
              value={date.year}
              onIncrement={() => calendarState.adjustDatePart(row.id, 'year', 1)}
              onDecrement={() => calendarState.adjustDatePart(row.id, 'year', -1)}
            />
          {/each}
        </div>
      </Chassis>
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
    padding-bottom: var(--space-xs);
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
    padding-bottom: var(--space-xs);
  }

  .eq-date-line {
    display: flex;
    align-items: baseline;
    justify-content: center;
    gap: 6px;
    font-size: var(--text-base);
    color: var(--color-text-secondary);
    line-height: 1.25;
  }

  .eq-dow {
    font-weight: 700;
    text-transform: uppercase;
    font-size: var(--text-xs);
    letter-spacing: 0.03em;
  }

  .eq-date {
    font-weight: 600;
  }

  .eq-math-line {
    display: flex;
    align-items: baseline;
    justify-content: center;
    gap: 6px;
    line-height: 1.25;
  }

  .eq-offset-highlight {
    font-family: var(--font-mono);
    font-size: var(--text-xl);
    font-weight: 900;
    color: var(--color-text-primary);
  }

  .eq-math-label {
    font-size: var(--text-base);
    font-weight: 600;
    color: var(--color-text-secondary);
  }

  .eq-equals-large {
    font-size: var(--text-xl);
    font-weight: 700;
    line-height: 1;
    color: var(--color-text-muted);
    margin: 2px 0 0 0;
    user-select: none;
    -webkit-user-select: none;
  }

  .eq-card-wrap {
    width: 100%;
    margin-top: var(--space-2xl);
  }

  .interval-hero-line {
    display: flex;
    align-items: baseline;
    justify-content: center;
    gap: var(--space-sm);
    margin: var(--space-xs) 0;
    color: var(--color-text-primary);
  }

  .interval-hero-val {
    font-family: var(--font-mono);
    font-size: var(--key-l);
    font-weight: 900;
    line-height: 1;
    letter-spacing: -0.02em;
  }

  .interval-hero-unit {
    font-family: var(--font-sans);
    font-size: var(--text-xl);
    font-weight: 700;
    line-height: 1;
  }

  /* ZONE-INPUT styling */
  .calc-input-stage {
    display: flex;
    flex-direction: column;
    gap: var(--zone-input-gap);
    width: 100%;
    box-sizing: border-box;
  }

  /* The hold button takes the place and shape of a key; HoldToAction keeps its own look */
  .offset-reset {
    display: flex;
    min-width: 0;
  }

  .offset-reset > :global(.hold-btn) {
    flex: 1;
    width: auto;
    height: auto;
    min-height: 0;
    padding: 0;
    border: none;
    border-radius: 2px;
  }

  /* `ch` follows the value font, so the value columns fit "31." and "2026" exactly */
  .diff-grid {
    display: grid;
    grid-template-columns: auto repeat(2, 1fr 3ch 1fr) 1fr 4ch 1fr;
    gap: 2px;
    font-family: var(--font-mono);
    font-size: var(--text-sm);
    user-select: none;
    -webkit-user-select: none;
  }

  .diff-head {
    grid-column: span 3;
    padding: 2px 0;
    font-family: var(--font-sans);
    font-size: var(--text-xs);
    font-weight: 700;
    line-height: 1;
    text-align: center;
    text-transform: uppercase;
    color: var(--color-text-muted);
  }

  .diff-row-label {
    display: flex;
    align-items: center;
    padding: 0 var(--space-xs);
    font-family: var(--font-sans);
    font-size: var(--text-xs);
    font-weight: 800;
    color: var(--color-text-secondary);
  }
</style>
