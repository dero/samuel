<script lang="ts">
  import type { CrossTypeConfig } from './crossData';
  import { coordinatesToChar } from './crossSolver';
  import { settings } from '../../state/settings.svelte';

  interface Props {
    config: CrossTypeConfig;
    letters: string[];
    selectedAxis1: number | null;
    selectedAxis2: number | null;
    selectedAxis3: number | null;
    onAxis1Change: (val: number | null) => void;
    onAxis2Change: (val: number | null) => void;
    onAxis3Change: (val: number | null) => void;
    onCommitLetter: (char: string, a1: number, a2: number, a3: number | null) => void;
  }

  let {
    config,
    letters,
    selectedAxis1,
    selectedAxis2,
    selectedAxis3,
    onAxis1Change,
    onAxis2Change,
    onAxis3Change,
    onCommitLetter
  }: Props = $props();

  const hasAxis3 = $derived(!!config.axis3Options && config.axis3Options.length > 0);

  function tryAutoCommit(a1: number | null, a2: number | null, a3: number | null) {
    if (hasAxis3) {
      if (a1 !== null && a2 !== null && a3 !== null) {
        const char = coordinatesToChar(config.id, a1, a2, a3, letters);
        if (char) {
          settings.vibrate(28);
          onCommitLetter(char, a1, a2, a3);
          onAxis1Change(null);
          onAxis2Change(null);
          onAxis3Change(null);
        }
      }
    } else {
      if (a1 !== null && a2 !== null) {
        const char = coordinatesToChar(config.id, a1, a2, null, letters);
        if (char) {
          settings.vibrate(28);
          onCommitLetter(char, a1, a2, null);
          onAxis1Change(null);
          onAxis2Change(null);
          onAxis3Change(null);
        }
      }
    }
  }

  function handleAxis1PointerDown(e: PointerEvent, val: number) {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    e.preventDefault();
    settings.vibrate(18);
    const next = selectedAxis1 === val ? null : val;
    onAxis1Change(next);
    tryAutoCommit(next, selectedAxis2, selectedAxis3);
  }

  function handleAxis2PointerDown(e: PointerEvent, val: number) {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    e.preventDefault();
    settings.vibrate(18);
    const next = selectedAxis2 === val ? null : val;
    onAxis2Change(next);
    tryAutoCommit(selectedAxis1, next, selectedAxis3);
  }

  function handleAxis3PointerDown(e: PointerEvent, val: number) {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    e.preventDefault();
    settings.vibrate(18);
    const next = selectedAxis3 === val ? null : val;
    onAxis3Change(next);
    tryAutoCommit(selectedAxis1, selectedAxis2, next);
  }
</script>

<div class="coordinate-keypad" class:two-columns={!hasAxis3}>
  <!-- Column 1: Axis 1 (Řádek) -->
  <div class="coord-column" title={`${config.axis1Label} (${config.axis1Short})`}>
    <div class="buttons-stack">
      {#each config.axis1Options as opt}
        {@const isSelected = selectedAxis1 === opt.value}
        <button
          type="button"
          class="coord-btn"
          class:is-active={isSelected}
          title={`${config.axis1Label}: ${opt.label} (${opt.sub || ''})`}
          aria-label={`${config.axis1Label} ${opt.label}`}
          onpointerdown={(e) => handleAxis1PointerDown(e, opt.value)}
        >
          <span class="btn-main-label">{opt.label}</span>
          {#if opt.sub}
            <span class="btn-sub-label">{opt.sub}</span>
          {/if}
        </button>
      {/each}
    </div>
  </div>

  <!-- Column 2: Axis 2 (Sloupec) -->
  <div class="coord-column" title={`${config.axis2Label} (${config.axis2Short})`}>
    <div class="buttons-stack">
      {#each config.axis2Options as opt}
        {@const isSelected = selectedAxis2 === opt.value}
        <button
          type="button"
          class="coord-btn"
          class:is-active={isSelected}
          title={`${config.axis2Label}: ${opt.label} (${opt.sub || ''})`}
          aria-label={`${config.axis2Label} ${opt.label}`}
          onpointerdown={(e) => handleAxis2PointerDown(e, opt.value)}
        >
          <span class="btn-main-label">{opt.label}</span>
          {#if opt.sub}
            <span class="btn-sub-label">{opt.sub}</span>
          {/if}
        </button>
      {/each}
    </div>
  </div>

  <!-- Column 3: Axis 3 (Pozice / Tečka) -->
  {#if hasAxis3 && config.axis3Options}
    <div class="coord-column" title={`${config.axis3Label} (${config.axis3Short})`}>
      <div class="buttons-stack">
        {#each config.axis3Options as opt}
          {@const isSelected = selectedAxis3 === opt.value}
          <button
            type="button"
            class="coord-btn"
            class:is-active={isSelected}
            title={`${config.axis3Label}: ${opt.label} (${opt.sub || ''})`}
            aria-label={`${config.axis3Label} ${opt.label}`}
            onpointerdown={(e) => handleAxis3PointerDown(e, opt.value)}
          >
            <span class="btn-main-label">{opt.label}</span>
            {#if opt.sub}
              <span class="btn-sub-label">{opt.sub}</span>
            {/if}
          </button>
        {/each}
      </div>
    </div>
  {/if}
</div>

<style>
  .coordinate-keypad {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 4px;
    width: 100%;
    user-select: none;
    -webkit-user-select: none;
    touch-action: none;
    box-sizing: border-box;
  }

  .coordinate-keypad.two-columns {
    grid-template-columns: repeat(2, 1fr);
  }

  .coord-column {
    display: flex;
    flex-direction: column;
    background: transparent;
    border: none;
    padding: 0;
    touch-action: none;
  }

  .buttons-stack {
    display: grid;
    grid-template-columns: 1fr;
    grid-template-rows: repeat(3, var(--utility-row-height, 42px));
    gap: 2px;
    padding: 2px;
    background-color: var(--color-bg-canvas);
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-sm);
    overflow: hidden;
    box-sizing: border-box;
  }

  .coord-btn {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: center;
    gap: 4px;
    width: 100%;
    height: 100%;
    background: var(--color-surface-2);
    border: none;
    border-radius: 2px;
    color: var(--color-text-primary);
    cursor: pointer;
    touch-action: none;
    padding: 0 4px;
    box-sizing: border-box;
    box-shadow: 
      inset 0 1px 0 rgba(255, 255, 255, 0.10),
      inset 0 -1px 0 rgba(0, 0, 0, 0.5);
    transition: background-color 0.08s ease, box-shadow 0.08s ease;
  }

  .coord-btn:active {
    background-color: var(--color-surface-active);
    box-shadow: inset 0 1.5px 3px rgba(0, 0, 0, 0.7);
    transform: none;
  }

  .coord-btn.is-active {
    background-color: var(--color-accent-primary);
    color: var(--color-text-inverse);
    font-weight: 800;
    box-shadow: 0 0 12px var(--color-accent-primary-glow), inset 0 0 4px rgba(255, 255, 255, 0.4);
  }

  .coord-btn.is-active .btn-sub-label {
    color: rgba(0, 0, 0, 0.85);
    font-weight: 700;
  }

  .btn-main-label {
    font-size: var(--text-sm);
    font-weight: 700;
    font-family: var(--font-mono);
    line-height: 1;
  }

  .btn-sub-label {
    font-size: var(--text-2xs);
    color: var(--color-text-muted);
    line-height: 1;
    text-align: center;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
</style>
