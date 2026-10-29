<script lang="ts">
  import ModuleShell from '../../components/layout/ModuleShell.svelte';
  import SegmentedControl from '../../components/ui/SegmentedControl.svelte';
  import HoldToAction from '../../components/ui/HoldToAction.svelte';
  import BackspaceButton from '../../components/ui/BackspaceButton.svelte';
  import PanZoomViewport from '../../components/ui/PanZoomViewport.svelte';
  import SudokuGrid from './SudokuGrid.svelte';
  import NonogramGrid from './NonogramGrid.svelte';
  import SudokuKeypad from './SudokuKeypad.svelte';
  import SudokuReference from './SudokuReference.svelte';
  import ConfirmDialog from '../../components/ui/ConfirmDialog.svelte';
  import { sudokuState, type PuzzleFlavour } from './sudokuState.svelte';
  import { Lightning } from 'phosphor-svelte';
  import { settings } from '../../state/settings.svelte';

  const flavourOptions = [
    { id: 'sudoku', label: 'Sudoku' },
    { id: 'nonogram', label: 'Nonogram' }
  ];

  let isSolving = $derived(
    sudokuState.flavour === 'sudoku' ? sudokuState.isSolvingSudoku : sudokuState.isSolvingNonogram
  );

  function handleFlavourChange(id: string) {
    settings.vibrate(20);
    sudokuState.flavour = id as PuzzleFlavour;
    sudokuState.saveToStorage();
  }

  function handleSolve() {
    if (sudokuState.flavour === 'sudoku') {
      sudokuState.solveSudoku();
    } else {
      sudokuState.solveNonogram();
    }
  }

  function handleBackspace() {
    if (sudokuState.flavour === 'sudoku') {
      sudokuState.backspaceSudoku();
    } else {
      sudokuState.backspaceNonogram();
    }
  }

  let panZoomRef = $state<{ resetView: (vibrate?: boolean) => void; ensureVisible: (el: HTMLElement) => void } | null>(null);

  function handleEnsureVisible(el: HTMLElement) {
    panZoomRef?.ensureVisible(el);
  }

  function handleReset() {
    panZoomRef?.resetView(true);
    if (sudokuState.flavour === 'sudoku') {
      sudokuState.clearSudoku();
    } else {
      sudokuState.clearNonogram();
    }
  }

  // Auto-fit viewport whenever puzzle flavour or dimensions change
  $effect(() => {
    const _flavour = sudokuState.flavour;
    const _w = sudokuState.nonogramWidth;
    const _h = sudokuState.nonogramHeight;

    const timer = setTimeout(() => {
      panZoomRef?.resetView(false);
    }, 40);

    return () => clearTimeout(timer);
  });
</script>

<ModuleShell
  title="Sudoku atd."
  hasAlphabet={false}
  onReset={handleReset}
>
  {#snippet output()}
    <PanZoomViewport bind:this={panZoomRef}>
      {#if sudokuState.flavour === 'sudoku'}
        <SudokuGrid />
      {:else}
        <NonogramGrid onEnsureVisible={handleEnsureVisible} />
      {/if}
    </PanZoomViewport>
  {/snippet}

  {#snippet input()}
    <div class="zone-input-flow">
      <!-- 1. Sub-Toolbar (36px): Flavour switch -->
      <div class="subtoolbar-container">
        <SegmentedControl
          size="sm"
          options={flavourOptions}
          value={sudokuState.flavour}
          onChange={handleFlavourChange}
        />
      </div>

      <!-- 2. Keypad Stage (84px): 7 columns keypad -->
      <SudokuKeypad flavour={sudokuState.flavour} />

      <!-- 3. Utility Row (42px): Clear (Hold) | Solve (Dominant) | Backspace -->
      <div class="keypad-utility-row-3col">
        <HoldToAction
          onAction={handleReset}
          ariaLabel="Vymazat zadání podržením"
        />

        <button
          type="button"
          class="utility-btn solve-btn"
          onclick={handleSolve}
          disabled={isSolving}
          aria-label="Vyřešit"
          title="Vyřešit"
        >
          <Lightning size={18} weight="fill" />
          <span class="solve-label">{isSolving ? 'Počítám...' : 'Vyřešit'}</span>
        </button>

        <BackspaceButton
          onAction={handleBackspace}
          title="Smazat nebo krok zpět"
        />
      </div>
    </div>
  {/snippet}

  {#snippet menuOptions()}
    {#if sudokuState.flavour === 'nonogram'}
      <div class="menu-group">
        <div class="menu-group-title">Rozměry Nonogramu</div>

        <div class="stepper-row">
          <span class="stepper-label">Šířka (sloupce):</span>
          <div class="stepper-controls">
            <button
              type="button"
              class="step-btn"
              onclick={() => {
                settings.vibrate(20);
                sudokuState.setNonogramDimensions(sudokuState.nonogramWidth - 1, sudokuState.nonogramHeight);
              }}
              disabled={sudokuState.nonogramWidth <= 2}
            >
              −
            </button>
            <span class="step-val">{sudokuState.nonogramWidth}</span>
            <button
              type="button"
              class="step-btn"
              onclick={() => {
                settings.vibrate(20);
                sudokuState.setNonogramDimensions(sudokuState.nonogramWidth + 1, sudokuState.nonogramHeight);
              }}
              disabled={sudokuState.nonogramWidth >= 30}
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
                sudokuState.setNonogramDimensions(sudokuState.nonogramWidth, sudokuState.nonogramHeight - 1);
              }}
              disabled={sudokuState.nonogramHeight <= 2}
            >
              −
            </button>
            <span class="step-val">{sudokuState.nonogramHeight}</span>
            <button
              type="button"
              class="step-btn"
              onclick={() => {
                settings.vibrate(20);
                sudokuState.setNonogramDimensions(sudokuState.nonogramWidth, sudokuState.nonogramHeight + 1);
              }}
              disabled={sudokuState.nonogramHeight >= 30}
            >
              +
            </button>
          </div>
        </div>
      </div>
    {:else}
      <div class="menu-group">
        <div class="menu-group-title">Informace</div>
        <div class="menu-info-text">
          Standardní mřížka 9×9 s automatickou kontrolou duplicitních čísel v řádcích, sloupcích a 3×3 blocích.
        </div>
      </div>
    {/if}
  {/snippet}

  {#snippet reference()}
    <SudokuReference />
  {/snippet}
</ModuleShell>

<ConfirmDialog
  open={sudokuState.showMultipleModal}
  title="Nalezeno více řešení"
  message="Zadání Sudoku není jednoznačné a má více možných platných řešení. Přejete si zobrazit první nalezené řešení?"
  confirmText="Přijmout"
  cancelText="Zrušit"
  confirmVariant="primary"
  onConfirm={() => sudokuState.confirmMultipleSolutions()}
  onCancel={() => sudokuState.cancelMultipleSolutions()}
/>

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

  .menu-info-text {
    font-size: calc(13px * var(--font-scale));
    color: var(--color-text-secondary);
    line-height: 1.4;
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
