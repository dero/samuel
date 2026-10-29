<script lang="ts">
  import RefLayout from '../../components/reference/RefLayout.svelte';
  import RefList from '../../components/reference/RefList.svelte';
  import RefSection from '../../components/reference/RefSection.svelte';
  import type { RefHelpData } from '../../components/reference/refTypes';

  const help: RefHelpData = {
    controls: [
      ['Rozměry', 'v menu, 2–30'],
      ['Klepnutí do záhlaví', 'vybere sloupec nebo řádek'],
      ['Číslice', 'píše číslo, víc číslic = víceciferné'],
      ['`▶`', 'potvrdí číslo, další `▶` přejde na další záhlaví'],
      ['Pořadí záhlaví', 'sloupce zleva, pak řádky shora'],
      ['Dva prsty', 'posun a zoom'],
      ['Vyřešit', 'doplní řešení']
    ],
    pitfalls: [
      ['Víc čísel v záhlaví', 'oddělit `▶`: `3` `▶` `1`'],
      ['Dvouciferné číslo', 'číslice hned po sobě: `1` `0` = 10'],
      ['Prázdný řádek', '`0` jako první číslice'],
      ['Další záhlaví', '`▶` 2×, když je číslo rozepsané'],
      ['Vyřešit nic nenajde', 'hledat překlep v zadání, stačí jedno číslo'],
      ['Ztracený pohled', 'vymazání zadání (podržet koš) vrátí i zoom']
    ]
  };
</script>

<RefLayout tabs={[{ id: 'rules', label: 'Pravidla' }]} {help}>
  {#snippet content()}
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
