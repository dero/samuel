<script lang="ts">
  import ElementCard from './ElementCard.svelte';
  import { elementsState } from './elementsState.svelte';
  import type { ChemicalElement } from './elementsData';

  interface Props {
    onShowInTable: (element: ChemicalElement) => void;
  }

  let { onShowInTable }: Props = $props();
</script>

<!-- The query line sits above the keyboard, the count in the bar; an empty query leaves the output empty -->
<div class="elements-search-container" data-allow-contextmenu>
  {#if elementsState.searchQuery && elementsState.searchMatches.length === 0}
    <p class="no-matches">Zkuste protonové číslo (26), značku (Fe) nebo název (železo).</p>
  {:else}
    <div class="results-grid">
      {#each elementsState.searchMatches as element (element.z)}
        <div class="grid-card-wrap">
          <ElementCard
            {element}
            filter="none"
            lod={2}
            isSelected={elementsState.selectedElementZ === element.z}
            onClick={onShowInTable}
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
    overscroll-behavior: contain;
    box-sizing: border-box;
  }

  .no-matches {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0;
    padding: var(--space-md);
    text-align: center;
    font-size: var(--text-sm);
    line-height: 1.4;
    color: var(--color-text-secondary);
  }

  /* 2-column card grid, tiles identical to the zoomed-in table */
  .results-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: var(--space-sm);
    width: 100%;
    box-sizing: border-box;
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
