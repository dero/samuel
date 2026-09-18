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
  <!-- Column 1: Axis 1 -->
  <div class="coord-column" class:is-dense-column={config.axis1Options.length > 4}>
    <div class="col-header">
      <span class="col-title">{config.axis1Label}</span>
      <span class="col-badge">{config.axis1Short}</span>
    </div>
    <div class="buttons-stack" class:grid-stack={config.axis1Options.length > 4}>
      {#each config.axis1Options as opt}
        {@const isSelected = selectedAxis1 === opt.value}
        <button
          type="button"
          class="coord-btn"
          class:is-active={isSelected}
          class:is-compact-btn={config.axis1Options.length > 4}
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

  <!-- Column 2: Axis 2 -->
  <div class="coord-column">
    <div class="col-header">
      <span class="col-title">{config.axis2Label}</span>
      <span class="col-badge">{config.axis2Short}</span>
    </div>
    <div class="buttons-stack">
      {#each config.axis2Options as opt}
        {@const isSelected = selectedAxis2 === opt.value}
        <button
          type="button"
          class="coord-btn"
          class:is-active={isSelected}
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

  <!-- Column 3: Axis 3 (if present) -->
  {#if hasAxis3 && config.axis3Options}
    <div class="coord-column">
      <div class="col-header">
        <span class="col-title">{config.axis3Label}</span>
        <span class="col-badge">{config.axis3Short}</span>
      </div>
      <div class="buttons-stack">
        {#each config.axis3Options as opt}
          {@const isSelected = selectedAxis3 === opt.value}
          <button
            type="button"
            class="coord-btn"
            class:is-active={isSelected}
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
    gap: var(--space-xs);
    width: 100%;
    user-select: none;
    -webkit-user-select: none;
    touch-action: none;
  }

  .coordinate-keypad.two-columns {
    grid-template-columns: 1.25fr 1fr;
  }

  .coord-column {
    display: flex;
    flex-direction: column;
    gap: 4px;
    background: transparent;
    border: none;
    padding: 0;
    touch-action: none;
  }

  .col-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 2px 4px 2px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  }

  .col-title {
    font-size: var(--text-xs);
    font-weight: 700;
    color: var(--color-text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.5px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .col-badge {
    font-size: var(--text-2xs);
    font-family: var(--font-mono);
    font-weight: 700;
    color: var(--color-accent-primary);
    background: var(--color-accent-primary-subtle);
    padding: 1px 4px;
    border-radius: var(--radius-xs);
  }

  .buttons-stack {
    display: flex;
    flex-direction: column;
    gap: 2px;
    padding: 2px;
    background-color: var(--color-bg-canvas);
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-sm);
    overflow: hidden;
    box-sizing: border-box;
    flex: 1;
    justify-content: space-between;
  }

  .buttons-stack.grid-stack {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 2px;
  }

  .coord-btn {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    width: 100%;
    min-height: var(--tap-min-size);
    background: var(--color-surface-2);
    border: none;
    border-radius: 2px;
    color: var(--color-text-primary);
    cursor: pointer;
    touch-action: none;
    padding: 4px 2px;
    box-shadow: 
      inset 0 1px 0 rgba(255, 255, 255, 0.10),
      inset 0 -1px 0 rgba(0, 0, 0, 0.5);
    transition: background-color 0.08s ease, box-shadow 0.08s ease;
  }

  .coord-btn.is-compact-btn {
    min-height: 38px;
    padding: 2px;
  }

  .coord-btn:active {
    background-color: var(--color-surface-active);
    box-shadow: inset 0 1.5px 3px rgba(0, 0, 0, 0.7);
    transform: none;
  }

  .coord-btn.is-active {
    background-color: var(--color-accent-primary);
    border-color: var(--color-accent-primary);
    color: var(--color-text-inverse);
    font-weight: 800;
    box-shadow: 0 0 12px var(--color-accent-primary-glow), inset 0 0 4px rgba(255, 255, 255, 0.4);
  }

  .coord-btn.is-active .btn-sub-label {
    color: rgba(0, 0, 0, 0.75);
    font-weight: 600;
  }

  .btn-main-label {
    font-size: var(--text-base);
    font-weight: 700;
    font-family: var(--font-mono);
    line-height: 1.1;
  }

  .btn-sub-label {
    font-size: var(--text-2xs);
    color: var(--color-text-muted);
    line-height: 1.1;
    text-align: center;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 100%;
  }
</style>
