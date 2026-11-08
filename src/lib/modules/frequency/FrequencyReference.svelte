<script lang="ts">
  import RefLayout from '../../components/reference/RefLayout.svelte';
  import RefSection from '../../components/reference/RefSection.svelte';
  import type { RefHelpData, RefTab } from '../../components/reference/refTypes';
  import LanguageStats from './LanguageStats.svelte';
  import { IOC_EXPECTED } from './frequencyData';

  type FrequencyRefTab = 'freq' | 'words' | 'ioc';

  const tabs: RefTab<FrequencyRefTab>[] = [
    { id: 'freq', label: 'Četnost' },
    { id: 'words', label: 'Slova' },
    { id: 'ioc', label: 'IoC' }
  ];

  const IOC_ROWS = [
    { text: 'Angličtina', value: IOC_EXPECTED.en.toFixed(3) },
    { text: 'Čeština bez diakritiky', value: IOC_EXPECTED.csUnaccented.toFixed(3) },
    { text: 'Čeština s diakritikou', value: IOC_EXPECTED.csDiacritics42.toFixed(3) },
    { text: 'Substituce, posun, transpozice', value: 'jako jazyk' },
    { text: 'Vigenère a jiné polyalfabetické', value: '0,038–0,045' },
    { text: 'Náhodný text, 26 znaků', value: IOC_EXPECTED.uniform26.toFixed(3) }
  ];

  const help: RefHelpData = {
    controls: [
      ['Šifrový text', 'ikona podkladu v hlavičce otevře editor, `Vložit` = schránka'],
      ['Četnost ▾ / Abecedně', 'řazení histogramu'],
      ['Stavový řádek', 'odhad typu šifry podle IoC, klepnutí = vysvětlení'],
      ['Ignorovat diakritiku', 'v menu: Č → C, Á → A…'],
      ['Ignorovat interpunkci', 'v menu: počítají se jen písmena']
    ],
    pitfalls: [
      ['Krátký text', 'pod 20 znaků je IoC i četnost nespolehlivá'],
      ['IoC jako jazyk, četnosti sedí', 'transpozice: písmena jsou jen přeházená'],
      ['IoC jako jazyk, četnosti jiné', 'substituce nebo posun → moduly Substituce, Posuny'],
      ['Ploché četnosti', 'Vigenère nebo šum → modul Posuny']
    ]
  };
</script>

<RefLayout {tabs} {help}>
  {#snippet content(tab)}
    {#if tab === 'ioc'}
      <RefSection
        title="Index koincidence (IoC)"
        note="Pravděpodobnost, že dva náhodné znaky textu jsou stejné."
      >
        <div class="ref-table-wrap">
          <table class="ref-table">
            <tbody>
              {#each IOC_ROWS as row (row.text)}
                <tr>
                  <td>{row.text}</td>
                  <td class="col-val">{row.value}</td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      </RefSection>
    {:else}
      <LanguageStats view={tab} />
    {/if}
  {/snippet}
</RefLayout>
