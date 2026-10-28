<script lang="ts">
  import RefLayout from '../../components/reference/RefLayout.svelte';
  import type { RefHelpData, RefTab, RefTool } from '../../components/reference/refTypes';
  import { elementsState, type ElementsFlavour } from './elementsState.svelte';
  import { ELEMENTS, type ChemicalElement } from './elementsData';

  type ElementsRefTab = 'z' | 'name' | 'symbol';

  const tabs: RefTab<ElementsRefTab>[] = [
    { id: 'z', label: 'Číslo' },
    { id: 'name', label: 'Název' },
    { id: 'symbol', label: 'Značka' }
  ];

  const LISTS: Record<ElementsRefTab, ChemicalElement[]> = {
    // Already ordered 1..118
    z: ELEMENTS,
    // Czech collation: Ch after H, diacritics per ČSN
    name: [...ELEMENTS].sort((a, b) => a.nameCs.localeCompare(b.nameCs, 'cs')),
    symbol: [...ELEMENTS].sort((a, b) => a.symbol.localeCompare(b.symbol, 'en'))
  };

  const tools: RefTool<ElementsFlavour>[] = [
    {
      id: 'table',
      label: 'Tabulka',
      help: {
        controls: [
          ['Dva prsty', 'posun a zoom'],
          ['Klepnutí na prvek', 'detail'],
          ['Filtry', 'zvýrazní 1-písmenné značky, skupenství, bloky s-p-d-f, radioaktivní prvky'],
          ['Filtr České', 'prvky, jejichž český název se liší od latinského']
        ]
      }
    },
    {
      id: 'search',
      label: 'Hledat',
      help: {
        controls: [
          ['Dotaz', 'číslo `26`, značka `Fe` nebo název `zelezo` (bez diakritiky)'],
          ['Klepnutí na výsledek', 'ukáže prvek v tabulce']
        ]
      }
    }
  ];

  const help: RefHelpData = {
    controls: [['Tabulka / Hledat', 'lišta nad klávesnicí']],
    pitfalls: [
      ['Značka z latiny', '`Fe` = železo (ferrum), `Na` = sodík (natrium) → filtr České'],
      ['Velikost písmen', '`Co` = kobalt, `CO` = uhlík + kyslík'],
      ['Číslo prvku', 'v šifrách obvykle protonové číslo (Z), ne relativní atomová hmotnost']
    ]
  };
</script>

<RefLayout {tabs} {help} {tools} activeTool={elementsState.activeFlavour}>
  {#snippet content(tab)}
    <div class="ref-table-wrap">
      <table class="ref-table">
        <tbody>
          {#each LISTS[tab] as elem (elem.z)}
            <tr>
              <td class="col-num">{elem.z}</td>
              <td class="col-code symbol">{elem.symbol}</td>
              <td class="col-name">
                {elem.nameCs}
                {#if elem.czechDiffersFromLatin}
                  <span class="latin">{elem.nameLa.toLowerCase()}</span>
                {/if}
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {/snippet}
</RefLayout>

<style>
  .symbol {
    min-width: 3ch;
    font-weight: 700;
    color: var(--color-text-primary);
  }

  .latin {
    margin-left: 6px;
    font-weight: 400;
    font-size: var(--text-xs);
    color: var(--color-text-muted);
  }
</style>
