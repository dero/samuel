<script lang="ts">
  import RefLayout from '../../components/reference/RefLayout.svelte';
  import type { RefHelpData, RefTab } from '../../components/reference/refTypes';
  import LanguageStats from '../frequency/LanguageStats.svelte';

  type SubstitutionRefTab = 'words' | 'freq';

  const tabs: RefTab<SubstitutionRefTab>[] = [
    { id: 'words', label: 'Slova' },
    { id: 'freq', label: 'Četnost' }
  ];

  const help: RefHelpData = {
    controls: [
      ['Text', 'řádek dole otevře editor'],
      ['Pás nad klávesnicí', 'šifrové znaky, klepnutím vybrat'],
      ['Klávesnice', 'přiřadí vybranému znaku písmeno, `✕` přiřazení zruší'],
      ['Reset na začátku pásu', 'zruší všechna přiřazení'],
      ['Abeceda', 'v menu, obvykle anglická (26) nebo s CH (27)']
    ],
    pitfalls: [
      ['Písmeno je šedé', 'už ho má jiný znak → menu Povolit homofony'],
      ['Znak v pásu nejde vybrat', 'není v šifře → menu Povolit nepoužitá písmena'],
      ['Kde začít', 'jednopísmenná slova (`A`, `V`, `S`, `Z`), pak dvoupísmenná'],
      ['Mezery chybí', 'nejdřív nejčastější znaky: E, A, O, I, N']
    ]
  };
</script>

<RefLayout {tabs} {help}>
  {#snippet content(tab)}
    <LanguageStats view={tab} />
  {/snippet}
</RefLayout>
