<script lang="ts">
  import RefLayout from '../../components/reference/RefLayout.svelte';
  import RefList from '../../components/reference/RefList.svelte';
  import RefSection from '../../components/reference/RefSection.svelte';
  import type { RefHelpData } from '../../components/reference/refTypes';

  const help: RefHelpData = {
    controls: [
      ['Klepnutí do mřížky', 'vybere buňku'],
      ['Číslice', 'zapíše hodnotu a skočí na další pole'],
      ['`▶` nebo `0`', 'další pole bez přepisu'],
      ['`◀`', 'předchozí pole bez mazání'],
      ['Dva prsty', 'posun a zoom'],
      ['Vyřešit', 'doplní řešení']
    ],
    pitfalls: [
      ['Vyřešit nic nenajde', 'hledat překlep v zadání, stačí jedno číslo'],
      ['Ztracený pohled', 'vymazání zadání (podržet koš) vrátí i zoom']
    ]
  };
</script>

<RefLayout tabs={[{ id: 'rules', label: 'Pravidla' }]} {help}>
  {#snippet content()}
    <RefSection title="Sudoku">
      <RefList items={['Číslice `1–9` v každém řádku, sloupci a bloku 3×3 právě jednou.']} />
    </RefSection>
  {/snippet}
</RefLayout>
