<script lang="ts">
  import SegmentedControl, { type SegmentOption } from '../../components/ui/SegmentedControl.svelte';
  import { ELEMENTS, type ChemicalElement } from './elementsData';
  import { settings } from '../../state/settings.svelte';

  type ElementsRefTab = 'z' | 'name' | 'symbol';

  let activeTab = $state<ElementsRefTab>('z');

  const tabs: SegmentOption<ElementsRefTab>[] = [
    { id: 'z', label: 'Číslo (Z)' },
    { id: 'name', label: 'Abeceda' },
    { id: 'symbol', label: 'Značka' }
  ];

  // 1. Podle atomových čísel (already 1..118)
  const BY_ATOMIC_NUMBER: ChemicalElement[] = ELEMENTS;

  // 2. Podle abecedy (česky: Ch po H, diakritika dle ČSN)
  const BY_CZECH_NAME: ChemicalElement[] = [...ELEMENTS].sort((a, b) =>
    a.nameCs.localeCompare(b.nameCs, 'cs')
  );

  // 3. Podle značky (abecedně dle symbolu)
  const BY_SYMBOL: ChemicalElement[] = [...ELEMENTS].sort((a, b) =>
    a.symbol.localeCompare(b.symbol, 'en')
  );

  const currentList = $derived(
    activeTab === 'z'
      ? BY_ATOMIC_NUMBER
      : activeTab === 'name'
        ? BY_CZECH_NAME
        : BY_SYMBOL
  );

  function handleTabChange(tab: ElementsRefTab) {
    if (activeTab === tab) return;
    settings.vibrate(20);
    activeTab = tab;
  }
</script>

<div class="ref-container" data-allow-copy>
  <!-- Pinned Segmented Tabs -->
  <div class="ref-header-controls">
    <SegmentedControl
      options={tabs}
      value={activeTab}
      size="sm"
      ariaLabel="Řazení referenčního přehledu prvků"
      onChange={handleTabChange}
    />
  </div>

  <!-- 3-Column Elements Table (Number | Symbol | Czech Name) -->
  <div class="table-card">
    <table class="data-table">
      <tbody>
        {#each currentList as elem (elem.z)}
          <tr>
            <td class="col-z font-mono">{elem.z}</td>
            <td class="col-symbol font-mono font-bold text-accent">{elem.symbol}</td>
            <td class="col-name">{elem.nameCs}</td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
</div>

<style>
  .ref-container {
    display: flex;
    flex-direction: column;
    width: 100%;
    box-sizing: border-box;
    gap: var(--space-sm, 8px);
  }

  .ref-header-controls {
    position: sticky;
    top: calc(-1 * var(--space-md, 12px));
    z-index: 10;
    background-color: var(--color-surface-1, #121212);
    padding-bottom: var(--space-xs, 4px);
    margin-top: calc(-1 * var(--space-xs, 4px));
    border-bottom: 1px solid var(--color-border-subtle);
  }

  .table-card {
    background-color: var(--color-surface-1);
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-md, 8px);
    overflow: hidden;
  }

  .data-table {
    width: 100%;
    border-collapse: collapse;
    font-size: var(--text-sm, 14px);
    text-align: left;
  }

  .data-table td {
    padding: 8px var(--space-md, 12px);
    border-bottom: 1px solid var(--color-border-subtle);
    box-sizing: border-box;
  }

  .data-table tbody tr:last-child td {
    border-bottom: none;
  }

  .data-table tbody tr:hover td {
    background-color: rgba(255, 255, 255, 0.03);
  }

  .col-z {
    width: 54px;
    text-align: right;
    padding-right: 12px;
    color: var(--color-text-muted);
  }

  .col-symbol {
    width: 68px;
    text-align: center;
    font-size: 15px;
  }

  .col-name {
    color: var(--color-text-primary);
    font-weight: 500;
    padding-left: 8px;
  }

  .font-mono {
    font-family: var(--font-mono, monospace);
  }

  .font-bold {
    font-weight: 700;
  }

  .text-accent {
    color: var(--color-accent-primary, #00d2ff);
  }
</style>
