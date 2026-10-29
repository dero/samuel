<script lang="ts">
  import ModuleShell from '../../components/layout/ModuleShell.svelte';
  import HoldToAction from '../../components/ui/HoldToAction.svelte';
  import BackspaceButton from '../../components/ui/BackspaceButton.svelte';
  import PanZoomViewport from '../../components/ui/PanZoomViewport.svelte';
  import DigitKeypad from '../../components/ui/DigitKeypad.svelte';
  import NonogramGrid from './NonogramGrid.svelte';
  import NonogramReference from './NonogramReference.svelte';
  import { nonogramState } from './nonogramState.svelte';
  import { Lightning } from 'phosphor-svelte';
  import { settings } from '../../state/settings.svelte';

  let panZoomRef = $state<{ resetView: (vibrate?: boolean) => void; ensureVisible: (el: HTMLElement) => void } | null>(null);

  function handleEnsureVisible(el: HTMLElement) {
    panZoomRef?.ensureVisible(el);
  }

  function handleReset() {
    panZoomRef?.resetView(true);
    nonogramState.clear();
  }

  // Auto-fit viewport whenever puzzle dimensions change
  $effect(() => {
    const _w = nonogramState.width;
    const _h = nonogramState.height;

    const timer = setTimeout(() => {
      panZoomRef?.resetView(false);
    }, 40);

    return () => clearTimeout(timer);
  });
</script>

<ModuleShell
  title="Nonogram"
  hasAlphabet={false}
  onReset={handleReset}
>
  {#snippet output()}
    <PanZoomViewport bind:this={panZoomRef}>
      <NonogramGrid onEnsureVisible={handleEnsureVisible} />
    </PanZoomViewport>
  {/snippet}

  {#snippet input()}
    <div class="zone-input-flow">
      <!-- 1. Keypad Stage (84px): 7 columns keypad -->
      <DigitKeypad
        onDigit={(digit) => nonogramState.enterDigit(digit)}
        onPrev={() => nonogramState.advance(-1)}
        onNext={() => nonogramState.advance(1)}
      />

      <!-- 2. Utility Row (42px): Clear (Hold) | Solve (Dominant) | Backspace -->
      <div class="keypad-utility-row-3col">
        <HoldToAction
          onAction={handleReset}
          ariaLabel="Vymazat zadání podržením"
        />

        <button
          type="button"
          class="utility-btn solve-btn"
          onclick={() => nonogramState.solve()}
          disabled={nonogramState.isSolving}
          aria-label="Vyřešit"
          title="Vyřešit"
        >
          <Lightning size={18} weight="fill" />
          <span class="solve-label">{nonogramState.isSolving ? 'Počítám...' : 'Vyřešit'}</span>
        </button>

        <BackspaceButton
          onAction={() => nonogramState.backspace()}
          title="Smazat nebo krok zpět"
        />
      </div>
    </div>
  {/snippet}

  {#snippet menuOptions()}
    <div class="menu-group">
      <div class="menu-group-title">Rozměry</div>

      <div class="stepper-row">
        <span class="stepper-label">Šířka (sloupce):</span>
        <div class="stepper-controls">
          <button
            type="button"
            class="step-btn"
            onclick={() => {
              settings.vibrate(20);
              nonogramState.setDimensions(nonogramState.width - 1, nonogramState.height);
            }}
            disabled={nonogramState.width <= 2}
          >
            −
          </button>
          <span class="step-val">{nonogramState.width}</span>
          <button
            type="button"
            class="step-btn"
            onclick={() => {
              settings.vibrate(20);
              nonogramState.setDimensions(nonogramState.width + 1, nonogramState.height);
            }}
            disabled={nonogramState.width >= 30}
          >
            +
          </button>
        </div>
      </div>

      <div class="stepper-row">
        <span class="stepper-label">Výška (řádky):</span>
        <div class="stepper-controls">
          <button
            type="button"
            class="step-btn"
            onclick={() => {
              settings.vibrate(20);
              nonogramState.setDimensions(nonogramState.width, nonogramState.height - 1);
            }}
            disabled={nonogramState.height <= 2}
          >
            −
          </button>
          <span class="step-val">{nonogramState.height}</span>
          <button
            type="button"
            class="step-btn"
            onclick={() => {
              settings.vibrate(20);
              nonogramState.setDimensions(nonogramState.width, nonogramState.height + 1);
            }}
            disabled={nonogramState.height >= 30}
          >
            +
          </button>
        </div>
      </div>
    </div>
  {/snippet}

  {#snippet reference()}
    <NonogramReference />
  {/snippet}
</ModuleShell>

<style>
  .solve-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    background-color: var(--color-surface-2);
    color: var(--color-accent-success);
    font-size: calc(14px * var(--font-scale));
    font-weight: 700;
    cursor: pointer;
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.1),
      inset 0 -1px 0 rgba(0, 0, 0, 0.5);
    transition: all 0.12s ease;
    border-radius: 2px !important;
  }

  .solve-btn:hover:not(:disabled) {
    background-color: var(--color-surface-3);
    color: #34d399;
  }

  .solve-btn:active:not(:disabled) {
    background-color: var(--color-surface-active);
    box-shadow: inset 0 1.5px 3px rgba(0, 0, 0, 0.7);
  }

  .solve-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .solve-label {
    line-height: 1;
  }

  .menu-group {
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 12px;
    background-color: var(--color-surface-1);
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-sm);
  }

  .menu-group-title {
    font-size: calc(13px * var(--font-scale));
    font-weight: 700;
    color: var(--color-text-primary);
  }


  .stepper-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .stepper-label {
    font-size: calc(13px * var(--font-scale));
    color: var(--color-text-secondary);
  }

  .stepper-controls {
    display: flex;
    align-items: center;
    gap: 8px;
    background-color: var(--color-surface-2);
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-sm);
    padding: 2px 4px;
  }

  .step-btn {
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: var(--color-surface-3);
    border: none;
    border-radius: 4px;
    color: var(--color-text-primary);
    font-size: calc(18px * var(--font-scale));
    font-weight: 700;
    cursor: pointer;
    touch-action: manipulation;
  }

  .step-btn:active:not(:disabled) {
    background-color: var(--color-surface-active);
  }

  .step-btn:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }

  .step-val {
    font-family: var(--font-mono, monospace);
    font-size: calc(15px * var(--font-scale));
    font-weight: 700;
    min-width: 28px;
    text-align: center;
    color: var(--color-text-primary);
  }
</style>
