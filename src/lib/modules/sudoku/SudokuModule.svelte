<script lang="ts">
  import ModuleShell from '../../components/layout/ModuleShell.svelte';
  import HoldToAction from '../../components/ui/HoldToAction.svelte';
  import BackspaceButton from '../../components/ui/BackspaceButton.svelte';
  import PanZoomViewport from '../../components/ui/PanZoomViewport.svelte';
  import DigitKeypad from '../../components/ui/DigitKeypad.svelte';
  import SudokuGrid from './SudokuGrid.svelte';
  import SudokuReference from './SudokuReference.svelte';
  import ConfirmDialog from '../../components/ui/ConfirmDialog.svelte';
  import { sudokuState } from './sudokuState.svelte';
  import { Lightning } from 'phosphor-svelte';

  let panZoomRef = $state<{ resetView: (vibrate?: boolean) => void } | null>(null);

  function handleDigit(digit: number) {
    // 0 skips to the next cell without overwriting
    if (digit === 0) {
      sudokuState.advanceSudoku(1);
      return;
    }
    sudokuState.enterSudokuDigit(digit);
  }

  function handleReset() {
    panZoomRef?.resetView(true);
    sudokuState.clearSudoku();
  }
</script>

<ModuleShell
  title="Sudoku"
  hasAlphabet={false}
  onReset={handleReset}
>
  {#snippet output()}
    <PanZoomViewport bind:this={panZoomRef}>
      <SudokuGrid />
    </PanZoomViewport>
  {/snippet}

  {#snippet input()}
    <div class="zone-input-flow">
      <!-- 1. Keypad Stage (84px): 7 columns keypad -->
      <DigitKeypad
        onDigit={handleDigit}
        onPrev={() => sudokuState.advanceSudoku(-1)}
        onNext={() => sudokuState.advanceSudoku(1)}
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
          onclick={() => sudokuState.solveSudoku()}
          disabled={sudokuState.isSolvingSudoku}
          aria-label="Vyřešit"
          title="Vyřešit"
        >
          <Lightning size={18} weight="fill" />
          <span class="solve-label">{sudokuState.isSolvingSudoku ? 'Počítám...' : 'Vyřešit'}</span>
        </button>

        <BackspaceButton
          onAction={() => sudokuState.backspaceSudoku()}
          title="Smazat nebo krok zpět"
        />
      </div>
    </div>
  {/snippet}

  {#snippet menuOptions()}
    <div class="menu-group">
      <div class="menu-group-title">Informace</div>
      <div class="menu-info-text">
        Standardní mřížka 9×9 s automatickou kontrolou duplicitních čísel v řádcích, sloupcích a 3×3 blocích.
      </div>
    </div>
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







</style>
