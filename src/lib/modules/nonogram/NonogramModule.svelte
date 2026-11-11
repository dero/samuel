<script lang="ts">
  import ModuleShell from '../../components/layout/ModuleShell.svelte';
  import type { ModuleBarConfig } from '../../components/layout/ModuleBar.svelte';
  import PanZoomViewport from '../../components/ui/PanZoomViewport.svelte';
  import DigitKeypad from '../../components/ui/DigitKeypad.svelte';
  import KeypadBottomRow from '../../components/ui/KeypadBottomRow.svelte';
  import Keycap from '../../components/ui/Keycap.svelte';
  import MenuGroup from '../../components/ui/MenuGroup.svelte';
  import NonogramGrid from './NonogramGrid.svelte';
  import NonogramReference from './NonogramReference.svelte';
  import { nonogramState, type ClueAxis } from './nonogramState.svelte';
  import { NONOGRAM_MAX_SIZE, NONOGRAM_MIN_SIZE } from './nonogramNotation';
  import { settings } from '../../state/settings.svelte';
  import { Lightning, Minus, Plus } from 'phosphor-svelte';

  let panZoomRef = $state<{ resetView: (vibrate?: boolean) => void; ensureVisible: (el: HTMLElement) => void } | null>(null);

  function handleEnsureVisible(el: HTMLElement) {
    panZoomRef?.ensureVisible(el);
  }

  // Auto-fit viewport whenever puzzle dimensions change
  $effect(() => {
    void nonogramState.width;
    void nonogramState.height;

    const timer = setTimeout(() => {
      panZoomRef?.resetView(false);
    }, 40);

    return () => clearTimeout(timer);
  });

  const invalidCount = $derived(nonogramState.invalidPieces.length);

  const warning = $derived.by<string | null>(() => {
    if (invalidCount > 0) return `Neplatné části zápisu: ${invalidCount}`;
    if (nonogramState.problems.length > 0) return nonogramState.problems[0].replace(/\.$/, '');
    return nonogramState.overflow;
  });

  const status = $derived.by(() => {
    if (nonogramState.isSolving) return 'Počítám…';
    switch (nonogramState.outcome) {
      case 'solved':
        return 'Vyřešeno';
      case 'unsolvable':
        return 'Žádné řešení, zkontrolujte zadání';
      case 'timeout':
        return 'Výpočet trval příliš dlouho';
      case 'invalid_input':
        return 'Zadání nejde vyřešit';
      default:
        return `Součty: řádky ${nonogramState.rowSum}, sloupce ${nonogramState.colSum}`;
    }
  });

  const bar = $derived<ModuleBarConfig>({
    empty: nonogramState.isEmpty,
    hint: 'Klepněte na záhlaví a zadejte čísla.',
    status,
    warning
  });

  const attention = $derived.by<string | null>(() => {
    const parts: string[] = [];
    if (invalidCount > 0) {
      const pieces = [...new Set(nonogramState.invalidPieces)].map((p) => `„${p}“`).join(', ');
      parts.push(`Neplatné části ${pieces}: v políčku je 0, nebo čísla od 1 oddělená čárkou.`);
    }
    parts.push(...nonogramState.problems);
    if (nonogramState.overflow) parts.push(`${nonogramState.overflow}.`);
    return parts.length > 0 ? parts.join(' ') : null;
  });

  const canSolve = $derived(!warning && !nonogramState.isEmpty && !nonogramState.isSolving);
  const hasClues = $derived(!!nonogramState.notation.trim());

  // Clearing starts a new puzzle, so the view fits the board again
  function handleClear() {
    panZoomRef?.resetView(false);
    nonogramState.clear();
  }

  function handleReset() {
    panZoomRef?.resetView(false);
    nonogramState.reset();
  }

  function handleResize(axis: ClueAxis, size: number) {
    settings.vibrate(20);
    nonogramState.resize(axis, size);
  }
</script>

{#snippet stepper(label: string, axis: ClueAxis, value: number)}
  <div class="stepper-row">
    <span class="stepper-label">{label}</span>
    <div class="stepper-controls">
      <button
        type="button"
        class="step-btn"
        aria-label="{label}: méně"
        disabled={value <= NONOGRAM_MIN_SIZE}
        onclick={() => handleResize(axis, value - 1)}
      >
        <Minus size={18} weight="bold" />
      </button>
      <span class="step-val">{value}</span>
      <button
        type="button"
        class="step-btn"
        aria-label="{label}: více"
        disabled={value >= NONOGRAM_MAX_SIZE}
        onclick={() => handleResize(axis, value + 1)}
      >
        <Plus size={18} weight="bold" />
      </button>
    </div>
  </div>
{/snippet}

<ModuleShell
  onReset={handleReset}
  podklad={{
    kind: 'text',
    required: false,
    empty: !hasClues,
    title: 'Legenda',
    description:
      'Čárka dělí čísla v políčku, lomítko políčka, dvě lomítka řádky od sloupců. Prázdné políčko je 0.',
    example: '3,1/2/5//1,1/4/1',
    placeholder: 'Např. 3,1/2/5//1,1/4/1',
    autocapitalize: 'none',
    attention,
    value: nonogramState.notation,
    onSave: (val) => nonogramState.setNotation(val)
  }}
  {bar}
>
  {#snippet output()}
    <PanZoomViewport bind:this={panZoomRef}>
      <NonogramGrid onEnsureVisible={handleEnsureVisible} />
    </PanZoomViewport>
  {/snippet}

  {#snippet input()}
    <div class="nonogram-input">
      <DigitKeypad
        onDigit={(digit) => nonogramState.enterDigit(digit)}
        onPrev={() => nonogramState.advance(-1)}
        onNext={() => nonogramState.advance(1)}
        prevLabel="Potvrdit číslo, jinak předchozí záhlaví"
        nextLabel="Potvrdit číslo, jinak další záhlaví"
      />

      <KeypadBottomRow
        clearDisabled={!hasClues && nonogramState.spareRows.length + nonogramState.spareCols.length === 0}
        backspaceDisabled={nonogramState.isEmpty}
        clearLabel="Vymazat celou legendu podržením"
        backspaceTitle="Smazat číslici, na prázdném záhlaví krok zpět"
        onClear={handleClear}
        onBackspace={() => nonogramState.backspace()}
      >
        {#snippet middle()}
          <Keycap
            ariaLabel="Vyřešit"
            title="Vyřešit"
            disabled={!canSolve}
            onPress={() => nonogramState.solve()}
          >
            <span class="solve-key">
              <Lightning size={18} weight="fill" />
              <span>{nonogramState.isSolving ? 'Počítám…' : 'Vyřešit'}</span>
            </span>
          </Keycap>
        {/snippet}
      </KeypadBottomRow>
    </div>
  {/snippet}

  {#snippet menuOptions()}
    <MenuGroup title="Rozměry">
      {@render stepper('Šířka (sloupce)', 'col', nonogramState.width)}
      {@render stepper('Výška (řádky)', 'row', nonogramState.height)}
    </MenuGroup>
  {/snippet}

  {#snippet reference()}
    <NonogramReference />
  {/snippet}
</ModuleShell>

<style>
  .nonogram-input {
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

  .stepper-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-md);
    min-height: var(--tap-min-size);
  }

  .stepper-label {
    font-size: var(--text-sm);
    font-weight: 600;
    color: var(--color-text-primary);
  }

  .stepper-controls {
    display: flex;
    align-items: center;
    gap: var(--space-xs);
  }

  .step-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 44px;
    height: 40px;
    min-height: var(--control-min-height);
    background-color: var(--color-surface-2);
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-sm);
    color: var(--color-text-primary);
    cursor: pointer;
    touch-action: manipulation;
    transition: background-color 0.12s ease;
  }

  .step-btn:active:not(:disabled) {
    background-color: var(--color-surface-active);
  }

  .step-btn:disabled {
    cursor: not-allowed;
  }

  .step-btn:disabled :global(svg) {
    opacity: 0.48;
  }

  .step-val {
    min-width: 32px;
    font-family: var(--font-mono);
    font-size: var(--text-base);
    font-weight: 700;
    text-align: center;
    color: var(--color-text-primary);
  }
</style>
