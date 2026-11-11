<script lang="ts">
  import ModuleShell from '../../components/layout/ModuleShell.svelte';
  import type { ModuleBarConfig } from '../../components/layout/ModuleBar.svelte';
  import PanZoomViewport from '../../components/ui/PanZoomViewport.svelte';
  import DigitKeypad from '../../components/ui/DigitKeypad.svelte';
  import KeypadBottomRow from '../../components/ui/KeypadBottomRow.svelte';
  import Keycap from '../../components/ui/Keycap.svelte';
  import SudokuGrid from './SudokuGrid.svelte';
  import SudokuReference from './SudokuReference.svelte';
  import { sudokuState } from './sudokuState.svelte';
  import { Lightning } from 'phosphor-svelte';

  let panZoomRef = $state<{ resetView: (vibrate?: boolean) => void } | null>(null);

  const parsed = $derived(sudokuState.parsed);
  const invalidCount = $derived(parsed.invalidPieces.length);
  const hasBoardContent = $derived(
    parsed.givens > 0 || parsed.invalidCells.some((row) => row.some((ch) => ch !== null))
  );

  const warning = $derived.by<string | null>(() => {
    if (invalidCount > 0) return `Neplatné části zápisu: ${invalidCount}`;
    if (parsed.problems.length > 0) return parsed.problems[0].replace(/\.$/, '');
    const n = sudokuState.collisions.length;
    if (n > 0) return `Kolize v zadání: ${n} ${n >= 2 && n <= 4 ? 'pole' : 'polí'}`;
    return null;
  });

  const status = $derived.by(() => {
    switch (sudokuState.result?.status) {
      case 'solved':
        return 'Vyřešeno';
      case 'multiple':
        return 'Více řešení, ukazuji jedno';
      case 'unsolvable':
        return 'Žádné řešení, zkontrolujte zadání';
      default:
        return `Zadáno ${parsed.givens} z 81`;
    }
  });

  const bar = $derived<ModuleBarConfig>({
    empty: parsed.givens === 0,
    hint: 'Klepněte na pole a zadejte číslo.',
    status,
    warning
  });

  const attention = $derived.by<string | null>(() => {
    const parts: string[] = [];
    if (invalidCount > 0) {
      const chars = [...new Set(parsed.invalidPieces)].map((ch) => `„${ch}“`).join(', ');
      parts.push(`Neplatné znaky ${chars}: pole je číslice 1–9, tečka nebo 0.`);
    }
    parts.push(...parsed.problems);
    return parts.length > 0 ? parts.join(' ') : null;
  });

  const canSolve = $derived(!warning && parsed.givens > 0);

  // Clearing starts a new puzzle, so the view fits the board again
  function handleClear() {
    panZoomRef?.resetView(false);
    sudokuState.clear();
  }
</script>

<ModuleShell
  onReset={handleClear}
  podklad={{
    kind: 'grid',
    required: false,
    empty: !sudokuState.notation.trim(),
    title: 'Zadání',
    description: 'Devět řádků po devíti polích, čárka dělí řádky, prázdné pole je tečka nebo 0.',
    example: '53..7....,6..195...',
    placeholder: 'Např. 53..7....,6..195...,…',
    autocapitalize: 'none',
    attention,
    value: sudokuState.notation,
    onSave: (val) => sudokuState.setNotation(val)
  }}
  {bar}
>
  {#snippet output()}
    <PanZoomViewport bind:this={panZoomRef}>
      <SudokuGrid />
    </PanZoomViewport>
  {/snippet}

  {#snippet input()}
    <div class="sudoku-input">
      <DigitKeypad
        onDigit={(digit) => sudokuState.enterDigit(digit)}
        onPrev={() => sudokuState.advance(-1)}
        onNext={() => sudokuState.advance(1)}
      />

      <KeypadBottomRow
        clearDisabled={!sudokuState.notation}
        backspaceDisabled={!hasBoardContent}
        clearLabel="Vymazat celé zadání podržením"
        backspaceTitle="Smazat pole, na prázdném krok zpět"
        onClear={handleClear}
        onBackspace={() => sudokuState.backspace()}
      >
        {#snippet middle()}
          <Keycap
            ariaLabel="Vyřešit"
            title="Vyřešit"
            disabled={!canSolve}
            onPress={() => sudokuState.solve()}
          >
            <span class="solve-key">
              <Lightning size={18} weight="fill" />
              <span>Vyřešit</span>
            </span>
          </Keycap>
        {/snippet}
      </KeypadBottomRow>
    </div>
  {/snippet}

  {#snippet reference()}
    <SudokuReference />
  {/snippet}
</ModuleShell>

<style>
  .sudoku-input {
    display: flex;
    flex-direction: column;
    gap: var(--zone-input-gap);
    width: 100%;
  }

  .solve-key {
    display: flex;
    align-items: center;
    gap: var(--space-xs);
    font-size: var(--text-sm);
    font-weight: 700;
    line-height: 1;
  }

  .solve-key :global(svg) {
    color: var(--color-accent-primary);
  }
</style>
