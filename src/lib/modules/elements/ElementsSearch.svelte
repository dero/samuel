<script lang="ts">
  import ElementCard from './ElementCard.svelte';
  import EmptyHint from '../../components/ui/EmptyHint.svelte';
  import { elementsState } from './elementsState.svelte';
  import type { ChemicalElement } from './elementsData';
  import { settings } from '../../state/settings.svelte';

  interface Props {
    onShowInTable?: (element: ChemicalElement) => void;
  }

  let { onShowInTable }: Props = $props();

  function handleCardClick(el: ChemicalElement) {
    settings.vibrate(20);
    elementsState.selectElement(el.z);
    if (onShowInTable) {
      onShowInTable(el);
    }
  }
</script>

<div class="elements-search-container" data-allow-contextmenu>
  {#if !elementsState.searchQuery}
    <div class="empty-wrap">
      <EmptyHint
        text="Zadej protonové číslo (26), značku (Fe) nebo název (železo)"
      />
    </div>
  {:else if elementsState.searchMatches.length === 0}
    <div class="no-matches-box">
      <span class="no-matches-query">„{elementsState.searchQuery}“</span>
      <span class="no-matches-msg">Žádný prvek nenalezen</span>
    </div>
  {:else}
    <!-- Results Header -->
    <div class="results-header">
      <span class="results-count">
        Nalezeno <strong class="text-accent">{elementsState.searchMatches.length}</strong> {elementsState.searchMatches.length === 1 ? 'prvek' : elementsState.searchMatches.length < 5 ? 'prvky' : 'prvků'}
      </span>
      <span class="results-hint text-muted">Klepnutím zobrazit v tabulce</span>
    </div>

    <!-- 2-Column Responsive Card Grid (Identical to max LOD cells) -->
    <div class="results-grid">
      {#each elementsState.searchMatches as element (element.z)}
        <div class="grid-card-wrap">
          <ElementCard
            {element}
            filter="none"
            lod={2}
            isSelected={elementsState.selectedElementZ === element.z}
            onClick={handleCardClick}
          />
        </div>
      {/each}
    </div>
  {/if}
</div>

<style>
  .elements-search-container {
    flex: 1;
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    overflow-y: auto;
    box-sizing: border-box;
    padding: var(--space-xs, 4px) 0;
  }

  .empty-wrap {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px 16px;
  }

  .no-matches-box {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 32px 16px;
    text-align: center;
  }

  .no-matches-query {
    font-family: var(--font-mono, monospace);
    font-size: 16px;
    font-weight: 700;
    color: var(--color-accent-primary, #00d2ff);
  }

  .no-matches-msg {
    font-size: 14px;
    color: var(--color-text-secondary);
  }

  .results-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 4px 6px 8px 6px;
    font-size: 12px;
    border-bottom: 1px solid var(--color-border-subtle);
    margin-bottom: 8px;
  }

  .results-count {
    color: var(--color-text-primary);
  }

  .text-accent {
    color: var(--color-accent-primary, #00d2ff);
  }

  .results-hint {
    font-size: 11px;
  }

  /* 2-Column Card Grid */
  .results-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: var(--space-sm, 8px);
    width: 100%;
    box-sizing: border-box;
    padding-bottom: 12px;
  }

  @media (min-width: 480px) {
    .results-grid {
      grid-template-columns: repeat(auto-fill, minmax(145px, 1fr));
    }
  }

  .grid-card-wrap {
    width: 100%;
  }
</style>
