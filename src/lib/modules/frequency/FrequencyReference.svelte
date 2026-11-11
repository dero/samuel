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
    purpose: [
      'Frekvenční analýza spočítá, jak často se v šifře opakují jednotlivá písmena, a porovná to s češtinou. Podle indexu koincidence (IoC) nástroj odhadne, o jaký druh šifry jde.'
    ],
    howTo: [
      'Substituce i posun písmena jen přejmenují, takže četnosti zůstanou jako v češtině, jen u jiných písmen. Transpozice písmena jen přehází a nejčastější zůstanou E, A, O. U Vigenèra jsou četnosti ploché.'
    ],
    example: {
      title: 'Příklad: posunutý text',
      steps: [
        {
          action:
            'Na záložce Podklad napište `SRNODG MH CDNRSDQ SRG YHONBP GXEHP QD NRQFL OHVD`, nebo ho zkopírujte a klepněte na Ze schránky.',
          result: 'Lišta ukáže „40 zn. · 18 různých“ a vpravo odhad Přirozený text.'
        },
        {
          action: 'Podívejte se na seznam písmen nahoře.',
          result: 'Nejčastější je D (5×), pak H, N a R (4×). Tečka na pruhu značí obvyklou četnost v češtině, číslo vpravo rozdíl od ní.'
        },
        {
          action: 'Porovnejte je s nejčastějšími písmeny češtiny E, A, O (tahák, záložka Četnost).',
          result: 'D, H a R leží v abecedě o 3 dál než A, E a O, jde tedy o posun.'
        },
        {
          action: 'Text zadejte v nástroji Posuny, variantě Cézar.',
          result: 'Mezi posuny najdete POKLAD JE ZAKOPAN POD VELKYM DUBEM NA KONCI LESA.'
        }
      ]
    },
    controls: [
      [
        'Záložka Podklad',
        'Šifrový text, mezery a interpunkce nevadí. Ze schránky vloží zkopírovaný text jen do prázdného pole, starý nejdřív smažte podržením Smazat.'
      ],
      ['Řádek variant: Četnost ▾ | Abecedně', 'Seřadí písmena od nejčastějšího, nebo podle abecedy.'],
      [
        'Seznam písmen (nahoře)',
        'U každého písmena počet, podíl v procentech, tečka s obvyklou četností v češtině a rozdíl od ní.'
      ],
      [
        'Odhad (vpravo v liště)',
        'Přirozený text, Polyalfabetická, Repetitivní nebo Méně dat. Klepnutím otevřete Statistiku textu s hodnotou IoC.'
      ],
      ['Menu → Ignorovat diakritiku', 'Počítá Č jako C, Á jako A a podobně.'],
      [
        'Menu → Ignorovat interpunkci',
        'Zapnuté počítá jen písmena. Vypnuté započítá i číslice a znaky, mezery nikdy.'
      ]
    ],
    pitfalls: [
      [
        'Lišta ukazuje Méně dat?',
        'Odhad potřebuje aspoň 10 písmen a spolehlivý je až u delšího textu. Krátkou šifru zkuste rovnou v nástroji Posuny nebo Substituce.'
      ],
      [
        'Odhad je Přirozený text a nejčastější jsou E, A, O?',
        'Písmena jsou správná, jen přeházená. Jde nejspíš o transpozici.'
      ],
      [
        'Odhad je Přirozený text, ale nejčastější písmena jsou jiná?',
        'Jde o substituci nebo posun. Zkuste nástroj Posuny, variantu Cézar, a pak nástroj Substituce.'
      ],
      [
        'Odhad je Polyalfabetická?',
        'Četnosti jsou ploché: Vigenère, nebo náhodný text. Zkuste nástroj Posuny, variantu Vigenère.'
      ],
      [
        'Šifra je z číslic nebo značek?',
        'Číslice a značky se počítají, jen když vypnete Menu → Ignorovat interpunkci, a odhad pak bývá Repetitivní, protože různých znaků je málo. Šifru nejdřív převeďte na písmena, třeba v nástroji Čísla nebo Polybius.'
      ]
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
