<script lang="ts">
  import ModuleShell from '../../components/layout/ModuleShell.svelte';
  import SegmentedControl, { type SegmentOption } from '../../components/ui/SegmentedControl.svelte';
  import SimpleKeyboard from '../../components/ui/SimpleKeyboard.svelte';
  import ElementsTable from './ElementsTable.svelte';
  import ElementsSearch from './ElementsSearch.svelte';
  import ElementsReference from './ElementsReference.svelte';
  import { elementsState, type ElementsFlavour } from './elementsState.svelte';
  import type { TacticalFilter, ChemicalElement } from './elementsData';
  import { settings } from '../../state/settings.svelte';

  const flavourOptions: SegmentOption<ElementsFlavour>[] = [
    { id: 'table', label: 'Tabulka' },
    { id: 'search', label: 'Hledat' }
  ];

  const filterOptions: { id: TacticalFilter; label: string }[] = [
    { id: 'none', label: 'Vše' },
    { id: 'letters', label: '1-písmenné' },
    { id: 'state', label: 'Skupenství' },
    { id: 'spdf', label: 's-p-d-f' },
    { id: 'radioactive', label: 'Radioaktivita' },
    { id: 'czech', label: 'České' }
  ];

  let tableRef = $state<{ resetView: () => void } | null>(null);

  function handleFlavourChange(val: ElementsFlavour) {
    elementsState.setFlavour(val);
  }

  function handleFilterChange(val: TacticalFilter) {
    elementsState.setFilter(val);
  }

  function handleKeyChar(char: string) {
    elementsState.addSearchChar(char);
  }

  function handleBackspace() {
    elementsState.backspaceSearch();
  }

  function handleClear() {
    elementsState.clearSearch();
  }

  function handleShowInTable(el: ChemicalElement) {
    settings.vibrate(20);
    elementsState.targetFocusZ = el.z;
    elementsState.selectElement(el.z);
    elementsState.setFlavour('table');
  }
</script>

<ModuleShell
  title="PSP"
  hasAlphabet={false}
  onReset={() => elementsState.resetModule()}
>
  <!-- ZONE-OUTPUT -->
  {#snippet output()}
    <div class="elements-output-wrapper">
      {#if elementsState.activeFlavour === 'table'}
        <ElementsTable bind:this={tableRef} />
      {:else}
        <ElementsSearch onShowInTable={handleShowInTable} />
      {/if}
    </div>
  {/snippet}

  <!-- ZONE-INPUT: Sub-Toolbar + Keypad or Tactical Filters -->
  {#snippet input()}
    <div class="zone-input-flow">
      <!-- 1. Sub-Toolbar (36px): Flavour switch -->
      <div class="subtoolbar-container">
        <SegmentedControl
          options={flavourOptions}
          value={elementsState.activeFlavour}
          onChange={handleFlavourChange}
          size="sm"
        />
      </div>

      <!-- 2. Active Stage per Flavour -->
      {#if elementsState.activeFlavour === 'table'}
        <!-- 2-Row Tactical Filters Stage -->
        <div class="filters-grid" role="group" aria-label="Taktické filtry">
          {#each filterOptions as f}
            <button
              type="button"
              class="filter-pill-btn"
              class:is-active={elementsState.tacticalFilter === f.id}
              onclick={() => handleFilterChange(f.id)}
            >
              <span class="filter-pill-label">{f.label}</span>
            </button>
          {/each}
        </div>
      {:else}
        <!-- Search Keyboard with Numbers and Letters -->
        <SimpleKeyboard
          includeNumbers={true}
          hasInput={!!elementsState.searchQuery}
          onChar={handleKeyChar}
          onBackspace={handleBackspace}
          onClear={handleClear}
        />
      {/if}
    </div>
  {/snippet}

  <!-- Reference Modal Content -->
  {#snippet reference()}
    <ElementsReference />
  {/snippet}
</ModuleShell>

<style>
  .elements-output-wrapper {
    flex: 1;
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;
    min-height: var(--output-min-height, 84px);
    overflow: hidden;
    position: relative;
    box-sizing: border-box;
    padding: 0;
  }

  .zone-input-flow {
    display: flex;
    flex-direction: column;
    gap: var(--zone-input-gap, 8px);
    width: 100%;
    box-sizing: border-box;
  }

  .subtoolbar-container {
    height: 36px;
    display: flex;
    align-items: center;
    overflow: hidden;
    flex-shrink: 0;
  }

  /* 2-Row Tactical Filters Grid */
  .filters-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    grid-template-rows: repeat(2, 34px);
    gap: 4px;
    width: 100%;
    padding: 2px;
    background-color: var(--color-surface-1);
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-sm, 6px);
    box-sizing: border-box;
  }

  .filter-pill-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    background-color: var(--color-surface-2);
    border: none;
    border-radius: 4px;
    color: var(--color-text-secondary);
    font-size: 11.5px;
    font-weight: 600;
    cursor: pointer;
    touch-action: manipulation;
    transition: all 0.12s ease;
    white-space: nowrap;
    padding: 0 4px;
  }

  .filter-pill-btn:active {
    transform: scale(0.97);
  }

  .filter-pill-btn.is-active {
    background-color: var(--color-surface-active);
    color: var(--color-accent-primary, #00d2ff);
    font-weight: 700;
    box-shadow: inset 0 0 0 1px var(--color-border-focus, #00d2ff);
  }

  .filter-pill-label {
    line-height: 1;
  }
</style>
