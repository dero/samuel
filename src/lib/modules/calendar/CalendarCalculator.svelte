<script lang="ts">
  import { calendarState } from './calendarState.svelte';
  import { copyToClipboard } from '../../utils/clipboard';
  import { settings } from '../../state/settings.svelte';
  import { Copy, ArrowsLeftRight } from 'phosphor-svelte';

  interface Props {
    view: 'output' | 'input';
  }

  let { view }: Props = $props();

  function copyText(val: string | number, label: string) {
    settings.vibrate(25);
    copyToClipboard(String(val), `${label} zkopírováno`);
  }
</script>

{#if view === 'output'}
  <div class="calc-output-card">
    {#if calendarState.calcMode === 'offset'}
      <!-- Offset output -->
      <div class="calc-result-header">
        <span class="calc-mode-tag">
          Posun o {calendarState.offsetDays >= 0 ? `+${calendarState.offsetDays}` : calendarState.offsetDays} dní
        </span>
        <button
          type="button"
          class="copy-pill"
          onclick={() =>
            copyText(
              `${calendarState.offsetTargetDetail.day}. ${calendarState.offsetTargetDetail.month}. ${calendarState.offsetTargetDetail.year}`,
              'Výsledné datum'
            )}
        >
          <Copy size={14} />
          <span>Kopírovat datum</span>
        </button>
      </div>

      <div class="calc-main-date">
        <h2 class="target-date-title">
          {calendarState.offsetTargetDetail.day}. {calendarState.offsetTargetDetail.monthNameGenitive} {calendarState.offsetTargetDetail.year}
        </h2>
        <span class="target-dow">
          {calendarState.offsetTargetDetail.dayOfWeekName} • {calendarState.offsetTargetDetail.dayOfYear}. den v roce
        </span>
      </div>

      <div class="calc-detail-pills">
        <button
          type="button"
          class="detail-pill"
          onclick={() =>
            copyText(
              calendarState.offsetTargetDetail.namesCz.join(', ') || 'Bez svátku',
              'Svátek'
            )}
        >
          <span class="pill-badge">Svátek</span>
          <span class="pill-value">
            {calendarState.offsetTargetDetail.namesCz.join(', ') || calendarState.offsetTargetDetail.holidayCz || '—'}
          </span>
        </button>

        <div class="detail-pill non-interactive">
          <span class="pill-badge">Výchozí datum</span>
          <span class="pill-value">
            {calendarState.day}. {calendarState.month}. {calendarState.year}
          </span>
        </div>
      </div>
    {:else}
      <!-- Diff output -->
      <div class="calc-result-header">
        <span class="calc-mode-tag">Rozdíl mezi dvěma daty</span>
        <button
          type="button"
          class="copy-pill"
          onclick={() => copyText(calendarState.diffResult.days, 'Počet dní')}
        >
          <Copy size={14} />
          <span>Kopírovat dny</span>
        </button>
      </div>

      <div class="calc-main-diff">
        <div class="big-days-display">
          <span class="big-number">
            {calendarState.diffResult.days > 0 ? `+${calendarState.diffResult.days}` : calendarState.diffResult.days}
          </span>
          <span class="big-unit">dní</span>
        </div>
        <span class="diff-sub">
          {calendarState.diffResult.weeks} {calendarState.diffResult.weeks === 1 ? 'týden' : calendarState.diffResult.weeks >= 2 && calendarState.diffResult.weeks <= 4 ? 'týdny' : 'týdnů'}
          {#if calendarState.diffResult.remainingDays > 0}
            a {calendarState.diffResult.remainingDays} {calendarState.diffResult.remainingDays === 1 ? 'den' : 'dny'}
          {/if}
        </span>
      </div>

      <div class="diff-slots-row">
        <!-- Date from slot -->
        <button
          type="button"
          class="diff-slot-btn"
          class:is-active-slot={calendarState.activeDiffSlot === 'from'}
          onclick={() => {
            settings.vibrate(20);
            calendarState.activeDiffSlot = 'from';
          }}
        >
          <span class="slot-label">Od data</span>
          <span class="slot-val">
            {calendarState.diffFrom.day}. {calendarState.diffFrom.month}. {calendarState.diffFrom.year}
          </span>
        </button>

        <!-- Swap button -->
        <button
          type="button"
          class="swap-btn"
          title="Prohodit data"
          onclick={() => calendarState.swapDiff()}
        >
          <ArrowsLeftRight size={16} />
        </button>

        <!-- Date to slot -->
        <button
          type="button"
          class="diff-slot-btn"
          class:is-active-slot={calendarState.activeDiffSlot === 'to'}
          onclick={() => {
            settings.vibrate(20);
            calendarState.activeDiffSlot = 'to';
          }}
        >
          <span class="slot-label">Do data</span>
          <span class="slot-val">
            {calendarState.diffTo.day}. {calendarState.diffTo.month}. {calendarState.diffTo.year}
          </span>
        </button>
      </div>
    {/if}
  </div>
{:else}
  <!-- ZONE-INPUT controls -->
  <div class="calc-input-stage">
    <!-- Sub-selector for Mode -->
    <div class="calc-mode-selector">
      <button
        type="button"
        class="mode-btn"
        class:is-active={calendarState.calcMode === 'offset'}
        onclick={() => calendarState.setCalcMode('offset')}
      >
        <span>Posun data (± N dní)</span>
      </button>
      <button
        type="button"
        class="mode-btn"
        class:is-active={calendarState.calcMode === 'diff'}
        onclick={() => calendarState.setCalcMode('diff')}
      >
        <span>Rozdíl dvou dat (A − B)</span>
      </button>
    </div>

    {#if calendarState.calcMode === 'offset'}
      <!-- Stepper buttons for Offset mode -->
      <div class="stepper-grid">
        <button type="button" class="step-btn neg" onpointerdown={() => calendarState.adjustOffset(-30)}>-30 d.</button>
        <button type="button" class="step-btn neg" onpointerdown={() => calendarState.adjustOffset(-7)}>-7 d.</button>
        <button type="button" class="step-btn neg" onpointerdown={() => calendarState.adjustOffset(-1)}>-1 d.</button>
        <button type="button" class="step-btn pos" onpointerdown={() => calendarState.adjustOffset(1)}>+1 d.</button>
        <button type="button" class="step-btn pos" onpointerdown={() => calendarState.adjustOffset(7)}>+7 d.</button>
        <button type="button" class="step-btn pos" onpointerdown={() => calendarState.adjustOffset(30)}>+30 d.</button>
      </div>

      <div class="stepper-grid secondary">
        <button type="button" class="step-btn neg" onpointerdown={() => calendarState.adjustOffset(-365)}>-1 rok</button>
        <button type="button" class="step-btn neg" onpointerdown={() => calendarState.adjustOffset(-100)}>-100 d.</button>
        <button type="button" class="step-btn reset" onpointerdown={() => calendarState.resetOffset()}>Reset (0)</button>
        <button type="button" class="step-btn pos" onpointerdown={() => calendarState.adjustOffset(100)}>+100 d.</button>
        <button type="button" class="step-btn pos" onpointerdown={() => calendarState.adjustOffset(365)}>+1 rok</button>
      </div>
    {:else}
      <!-- Stepper buttons for active diff date slot -->
      <div class="stepper-grid">
        <button type="button" class="step-btn neg" onpointerdown={() => calendarState.adjustDiffActive(-30)}>-30 d.</button>
        <button type="button" class="step-btn neg" onpointerdown={() => calendarState.adjustDiffActive(-7)}>-7 d.</button>
        <button type="button" class="step-btn neg" onpointerdown={() => calendarState.adjustDiffActive(-1)}>-1 d.</button>
        <button type="button" class="step-btn pos" onpointerdown={() => calendarState.adjustDiffActive(1)}>+1 d.</button>
        <button type="button" class="step-btn pos" onpointerdown={() => calendarState.adjustDiffActive(7)}>+7 d.</button>
        <button type="button" class="step-btn pos" onpointerdown={() => calendarState.adjustDiffActive(30)}>+30 d.</button>
      </div>

      <div class="stepper-grid secondary">
        <button type="button" class="step-btn neg" onpointerdown={() => calendarState.adjustDiffActive(-365)}>-1 rok</button>
        <button type="button" class="step-btn reset" onpointerdown={() => calendarState.resetDiffToToday()}>Na dnešek</button>
        <button type="button" class="step-btn pos" onpointerdown={() => calendarState.adjustDiffActive(365)}>+1 rok</button>
      </div>
    {/if}
  </div>
{/if}

<style>
  /* ZONE-OUTPUT style */
  .calc-output-card {
    display: flex;
    flex-direction: column;
    gap: 8px;
    background-color: var(--color-bg-canvas, #000000);
    width: 100%;
  }

  .calc-result-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .calc-mode-tag {
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--color-accent-primary, #00d2ff);
  }

  .copy-pill {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    background-color: var(--color-surface-2, #1c1c1c);
    border: 1px solid var(--color-border-subtle, #2a2a2a);
    border-radius: var(--radius-xs, 4px);
    color: var(--color-text-secondary, #9e9e9e);
    padding: 3px 8px;
    font-size: 11px;
    cursor: pointer;
  }

  .copy-pill:active {
    background-color: var(--color-surface-active, #333333);
    color: var(--color-accent-primary, #00d2ff);
  }

  .calc-main-date {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .target-date-title {
    font-size: var(--text-xl, 22px);
    font-weight: 800;
    color: var(--color-text-primary, #ffffff);
    margin: 0;
    line-height: 1.2;
  }

  .target-dow {
    font-size: var(--text-xs, 12px);
    color: var(--color-text-secondary, #9e9e9e);
  }

  .calc-detail-pills {
    display: flex;
    flex-direction: column;
    gap: 6px;
    width: 100%;
  }

  .detail-pill {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    background-color: var(--color-surface-1, #121212);
    border: 1px solid var(--color-border-subtle, #2a2a2a);
    border-radius: var(--radius-xs, 4px);
    padding: 6px 10px;
    cursor: pointer;
    text-align: left;
  }

  .detail-pill.non-interactive {
    cursor: default;
  }

  .detail-pill:active:not(.non-interactive) {
    background-color: var(--color-surface-active, #333333);
    border-color: var(--color-accent-primary, #00d2ff);
  }

  .pill-badge {
    font-size: 10px;
    color: var(--color-text-muted, #666666);
    text-transform: uppercase;
    font-weight: 700;
  }

  .pill-value {
    font-size: var(--text-sm, 13px);
    font-weight: 700;
    color: var(--color-text-primary, #ffffff);
  }


  /* Diff big number */
  .calc-main-diff {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 8px 0;
  }

  .big-days-display {
    display: flex;
    align-items: baseline;
    gap: 6px;
  }

  .big-number {
    font-size: 38px;
    font-weight: 900;
    font-family: var(--font-mono, monospace);
    color: var(--color-accent-primary, #00d2ff);
    line-height: 1;
  }

  .big-unit {
    font-size: var(--text-base, 16px);
    font-weight: 700;
    color: var(--color-text-secondary, #9e9e9e);
  }

  .diff-sub {
    font-size: var(--text-xs, 12px);
    color: var(--color-text-muted, #666666);
    margin-top: 4px;
  }

  .diff-slots-row {
    display: flex;
    align-items: center;
    gap: 6px;
    width: 100%;
  }

  .diff-slot-btn {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    background-color: var(--color-surface-1, #121212);
    border: 1px solid var(--color-border-subtle, #2a2a2a);
    border-radius: var(--radius-xs, 4px);
    padding: 6px 4px;
    cursor: pointer;
  }

  .diff-slot-btn.is-active-slot {
    border-color: var(--color-accent-primary, #00d2ff);
    background-color: var(--color-surface-2, #1c1c1c);
    box-shadow: inset 0 0 0 1px var(--color-accent-primary, #00d2ff);
  }

  .slot-label {
    font-size: 10px;
    color: var(--color-text-muted, #666666);
    text-transform: uppercase;
  }

  .slot-val {
    font-size: 13px;
    font-weight: 700;
    font-family: var(--font-mono, monospace);
    color: var(--color-text-primary, #ffffff);
  }

  .swap-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    background-color: var(--color-surface-2, #1c1c1c);
    border: 1px solid var(--color-border-subtle, #2a2a2a);
    border-radius: var(--radius-xs, 4px);
    color: var(--color-text-secondary, #9e9e9e);
    cursor: pointer;
  }

  .swap-btn:active {
    background-color: var(--color-surface-active, #333333);
    color: var(--color-accent-primary, #00d2ff);
  }

  /* ZONE-INPUT stage */
  .calc-input-stage {
    display: flex;
    flex-direction: column;
    gap: 6px;
    width: 100%;
    user-select: none;
    -webkit-user-select: none;
    touch-action: none;
  }

  .calc-mode-selector {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 4px;
    background-color: var(--color-surface-1, #121212);
    border: 1px solid var(--color-border-subtle, #2a2a2a);
    border-radius: var(--radius-sm, 6px);
    padding: 2px;
  }

  .mode-btn {
    height: 30px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: transparent;
    border: none;
    border-radius: var(--radius-xs, 4px);
    color: var(--color-text-secondary, #9e9e9e);
    font-size: 11px;
    font-weight: 600;
    cursor: pointer;
  }

  .mode-btn.is-active {
    background-color: var(--color-surface-3, #262626);
    color: var(--color-text-primary, #ffffff);
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.4);
  }

  .stepper-grid {
    display: grid;
    grid-template-columns: repeat(6, 1fr);
    gap: 3px;
    width: 100%;
  }

  .stepper-grid.secondary {
    grid-template-columns: repeat(5, 1fr);
  }

  .step-btn {
    height: 38px;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: var(--color-surface-2, #1c1c1c);
    border: 1px solid var(--color-border-subtle, #2a2a2a);
    border-radius: 3px;
    color: var(--color-text-primary, #ffffff);
    font-family: var(--font-mono, monospace);
    font-size: 12px;
    font-weight: 700;
    cursor: pointer;
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.08),
      inset 0 -1px 0 rgba(0, 0, 0, 0.4);
  }

  .step-btn:active {
    background-color: var(--color-surface-active, #333333);
    color: var(--color-accent-primary, #00d2ff);
  }

  .step-btn.reset {
    color: var(--color-text-muted, #666666);
    font-size: 11px;
  }
</style>
