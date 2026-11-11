<script lang="ts">
  import ModuleShell from '../../components/layout/ModuleShell.svelte';
  import SegmentedControl, { type SegmentOption } from '../../components/ui/SegmentedControl.svelte';
  import SimpleKeyboard from '../../components/ui/SimpleKeyboard.svelte';
  import Chassis from '../../components/ui/Chassis.svelte';
  import Keycap from '../../components/ui/Keycap.svelte';
  import ElementsTable from './ElementsTable.svelte';
  import ElementsSearch from './ElementsSearch.svelte';
  import ElementsReference from './ElementsReference.svelte';
  import { elementsState, type ElementsFlavour } from './elementsState.svelte';
  import {
    ELEMENTS,
    isElementRadioactive,
    type TacticalFilter,
    type ChemicalElement
  } from './elementsData';

  const FLAVOUR_OPTIONS: SegmentOption<ElementsFlavour>[] = [
    { id: 'table', label: 'Tabulka' },
    { id: 'search', label: 'Hledání' }
  ];

  const FILTERS: { id: TacticalFilter; label: string }[] = [
    { id: 'none', label: 'Vše' },
    { id: 'letters', label: '1-písmenné' },
    { id: 'state', label: 'Skupenství' },
    { id: 'spdf', label: 's-p-d-f' },
    { id: 'radioactive', label: 'Radioaktivita' },
    { id: 'czech', label: 'České' }
  ];

  const count = (match: (el: ChemicalElement) => boolean) => ELEMENTS.filter(match).length;

  // What the highlighted tiles are, per filter (the data never changes)
  const TABLE_STATUS: Record<TacticalFilter, string> = {
    none: `Všech ${ELEMENTS.length} prvků`,
    letters: `Jednopísmenné značky: ${count((el) => el.symbol.length === 1)}`,
    state: `Skupenství: plyny ${count((el) => el.state === 'gas')}, kapaliny ${count((el) => el.state === 'liquid')}`,
    spdf: `Bloky: ${(['s', 'p', 'd', 'f'] as const).map((b) => `${b} ${count((el) => el.block === b)}`).join(', ')}`,
    radioactive: `Radioaktivní: ${count(isElementRadioactive)}`,
    czech: `Vlastní český název: ${count((el) => el.czechDiffersFromLatin)}`
  };

  let tableRef = $state<{ resetView: () => void } | null>(null);

  const isSearch = $derived(elementsState.activeFlavour === 'search');

  const searchStatus = $derived.by(() => {
    const found = elementsState.searchMatches.length;
    return found === 0 ? 'Nic nenalezeno' : `Nalezeno ${found}`;
  });

  // The tile tap already vibrated (ElementCard)
  function handleShowInTable(el: ChemicalElement) {
    elementsState.targetFocusZ = el.z;
    elementsState.selectElement(el.z);
    elementsState.setFlavour('table');
  }

  function handleReset() {
    elementsState.resetModule();
    tableRef?.resetView();
  }
</script>

<ModuleShell
  title="Chemie"
  hasAlphabet={false}
  onReset={handleReset}
  bar={{
    empty: isSearch && !elementsState.searchQuery,
    hint: 'Zadejte číslo, značku nebo název.',
    status: isSearch ? searchStatus : TABLE_STATUS[elementsState.tacticalFilter]
  }}
>
  {#snippet output()}
    <div class="elements-output">
      {#if isSearch}
        <ElementsSearch onShowInTable={handleShowInTable} />
      {:else}
        <ElementsTable bind:this={tableRef} />
      {/if}
    </div>
  {/snippet}

  {#snippet variants()}
    <SegmentedControl
      options={FLAVOUR_OPTIONS}
      value={elementsState.activeFlavour}
      size="sm"
      ariaLabel="Pohled"
      onChange={(flavour) => elementsState.setFlavour(flavour)}
    />
  {/snippet}

  {#snippet input()}
    {#if isSearch}
      <SimpleKeyboard
        includeNumbers={true}
        query={elementsState.searchQuery}
        placeholder="Značka, název, číslo…"
        hasInput={!!elementsState.searchQuery}
        onChar={(char) => elementsState.addSearchChar(char)}
        onBackspace={() => elementsState.backspaceSearch()}
        onClear={() => elementsState.clearSearch()}
      />
    {:else}
      <Chassis columns={3} keyHeight="42px">
        {#each FILTERS as filter (filter.id)}
          {@const isActive = elementsState.tacticalFilter === filter.id}
          <Keycap
            selected={isActive}
            title="Filtr {filter.label}"
            ariaLabel="Filtr {filter.label}{isActive ? ', vybráno' : ''}"
            onPress={() => elementsState.setFilter(filter.id)}
          >
            <span class="filter-key">{filter.label}</span>
          </Keycap>
        {/each}
      </Chassis>
    {/if}
  {/snippet}

  {#snippet reference()}
    <ElementsReference />
  {/snippet}
</ModuleShell>

<style>
  .elements-output {
    flex: 1;
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;
    min-height: 0;
    overflow: hidden;
    position: relative;
  }

  /* Filter names are words, not glyphs: capped by width so "Radioaktivita" fits a third of 320 px */
  .filter-key {
    max-width: 95%;
    overflow: hidden;
    font-size: min(var(--text-xs), 3.6vw);
    font-weight: 700;
    line-height: 1;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
</style>
