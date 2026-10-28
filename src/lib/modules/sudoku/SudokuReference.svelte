<script lang="ts">
  import RefLayout from '../../components/reference/RefLayout.svelte';
  import RefList from '../../components/reference/RefList.svelte';
  import RefSection from '../../components/reference/RefSection.svelte';
  import type { RefHelpData, RefTool } from '../../components/reference/refTypes';
  import { sudokuState, type PuzzleFlavour } from './sudokuState.svelte';

  const tools: RefTool<PuzzleFlavour>[] = [
    {
      id: 'sudoku',
      label: 'Sudoku',
      help: {
        controls: [
          ['Klepnutí do mřížky', 'vybere buňku'],
          ['Číslice', 'zapíše hodnotu a skočí na další pole'],
          ['`▶` nebo `0`', 'další pole bez přepisu'],
          ['`◀`', 'předchozí pole bez mazání']
        ]
      }
    },
    {
      id: 'nonogram',
      label: 'Nonogram',
      help: {
        controls: [
          ['Rozměry', 'v menu, 2–30'],
          ['Klepnutí do záhlaví', 'vybere sloupec nebo řádek'],
          ['Číslice', 'píše číslo, víc číslic = víceciferné'],
          ['`▶`', 'potvrdí číslo, další `▶` přejde na další záhlaví'],
          ['Pořadí záhlaví', 'sloupce zleva, pak řádky shora']
        ],
        pitfalls: [
          ['Víc čísel v záhlaví', 'oddělit `▶`: `3` `▶` `1`'],
          ['Dvouciferné číslo', 'číslice hned po sobě: `1` `0` = 10'],
          ['Prázdný řádek', '`0` jako první číslice'],
          ['Další záhlaví', '`▶` 2×, když je číslo rozepsané']
        ]
      }
    }
  ];

  const help: RefHelpData = {
    controls: [
      ['Sudoku / Nonogram', 'lišta nad klávesnicí'],
      ['Dva prsty', 'posun a zoom'],
      ['Vyřešit', 'doplní řešení']
    ],
    pitfalls: [
      ['Vyřešit nic nenajde', 'hledat překlep v zadání, stačí jedno číslo'],
      ['Ztracený pohled', 'vymazání zadání (podržet koš) vrátí i zoom']
    ]
  };
</script>

<RefLayout tabs={[{ id: 'rules', label: 'Pravidla' }]} {help} {tools} activeTool={sudokuState.flavour}>
  {#snippet content()}
    <RefSection title="Sudoku">
      <RefList items={['Číslice `1–9` v každém řádku, sloupci a bloku 3×3 právě jednou.']} />
    </RefSection>

    <RefSection title="Nonogram (malovaná křížovka)">
      <RefList
        items={[
          ['Čísla v záhlaví', 'délky souvislých bloků vybarvených polí, v pořadí'],
          ['Mezi bloky', 'aspoň jedno prázdné pole'],
          ['Prázdný řádek', 'záhlaví `0` nebo prázdné']
        ]}
      />
    </RefSection>
  {/snippet}
</RefLayout>
