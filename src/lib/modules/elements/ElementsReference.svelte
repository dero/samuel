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
        howTo: [
          'Oddálená tabulka ukazuje jen značky, s přiblížením přibudou protonová čísla a nakonec celé karty prvků. Filtry dole zvýrazní skupinu prvků a lišta řekne, kolik jich je.'
        ],
        example: {
          title: 'Příklad: prvky s jednopísmennou značkou',
          steps: [
            {
              action: 'V řádku variant zvolte Tabulka a klepněte na filtr 1-písmenné.',
              result: 'Svítí 14 prvků od H po U, ostatní jsou ztlumené. Lišta ukazuje „Jednopísmenné značky: 14“.'
            },
            {
              action: 'Dvakrát klepněte vpravo nahoře, kde leží N, O a F.',
              result: 'Tabulka se kolem místa klepnutí přiblíží.'
            },
            {
              action: 'Klepněte na O.',
              result: 'Kyslík se orámuje a tabulka najede na jeho kartu: číslo 8, hmotnost 15.999, Kyslík, Oxygenium, perioda 2, skupina 16 a skupenství plyn.'
            },
            {
              action: 'Klepněte na filtr Vše.',
              result: 'Prvky mají zase barvy podle druhu a lišta ukazuje „Všech 118 prvků“.'
            }
          ]
        },
        controls: [
          ['Dva prsty (v tabulce)', 'Roztažením tabulku přiblíží, stažením oddálí, tažením posunou.'],
          ['Dvojité klepnutí', 'Přiblíží místo klepnutí. V přiblížené tabulce ji vrátí na celou.'],
          ['Klepnutí na prvek', 'Orámuje prvek a najede na jeho celou kartu.'],
          ['Filtr Vše', 'Barvy podle druhu prvku: alkalické kovy, přechodné kovy, halogeny, vzácné plyny…'],
          ['Filtr 1-písmenné', 'Zvýrazní 14 prvků s jednopísmennou značkou, ostatní ztlumí.'],
          ['Filtr Skupenství', 'Barevně odliší plyny a kapaliny (brom, rtuť) od pevných prvků.'],
          ['Filtr s-p-d-f', 'Obarví prvky podle bloku s, p, d a f.'],
          ['Filtr Radioaktivita', 'Zvýrazní 37 radioaktivních prvků a přidá k číslu ☢, ostatní ztlumí.'],
          ['Filtr České', 'Zvýrazní 19 prvků, jejichž český název se liší od latinského.']
        ],
        pitfalls: [
          ['Tabulka se jedním prstem neposouvá?', 'Posouvá a přibližuje se dvěma prsty. Jedním prstem vybíráte prvky.']
        ]
      }
    },
    {
      id: 'search',
      label: 'Hledání',
      help: {
        howTo: [
          'Hledá se podle čísla, značky a českého i latinského názvu, bez diakritiky. Přesná shoda značky nebo čísla je vždy první, za ní prvky, jejichž značka, název nebo číslo dotazem začíná nebo ho obsahuje.'
        ],
        example: {
          title: 'Příklad: čísla 14 a 57',
          steps: [
            {
              action: 'V řádku variant zvolte Hledání. Je-li v řádku dotazu starý text, podržte Koš (vlevo dole).',
              result: 'Lišta radí „Zadejte číslo, značku nebo název.“'
            },
            {
              action: 'Klepněte na `1` a pak na `4`.',
              result: 'Po `1` je výsledků mnoho, po `4` zbude jediná karta: 14 Si, Křemík, Silicium. Lišta ukazuje „Nalezeno 1“.'
            },
            {
              action: 'Podržte Koš a klepněte na `5` a `7`.',
              result: 'Karta ukáže 57 La, Lanthan. Značky Si a La dávají SILA.'
            },
            {
              action: 'Klepněte na kartu lanthanu.',
              result: 'Nástroj přepne na Tabulku a najede na lanthan v řadě lanthanoidů.'
            }
          ]
        },
        controls: [
          ['Klávesnice s čísly', 'Píše dotaz do řádku nad klávesami.'],
          ['Zpět (vpravo dole)', 'Smaže poslední znak.'],
          ['Koš (vlevo dole)', 'Podržením smaže celý dotaz.'],
          ['Klepnutí na kartu', 'Přepne na Tabulku a najede na prvek.']
        ],
        pitfalls: [
          ['Šifra má CO a vyšel kobalt?', 'Hledání nerozlišuje velká a malá písmena. Jsou-li to dvě značky, hledejte C a O zvlášť.'],
          ['Po zadání čísla je výsledků víc?', 'Ukážou se i prvky, jejichž číslo dotazem začíná. Dopište celé číslo, přesná shoda je vždy první.']
        ]
      }
    }
  ];

  const help: RefHelpData = {
    purpose: [
      'Periodická tabulka 118 prvků s českými i latinskými názvy. Nástroj najde prvek podle čísla, značky nebo názvu a v tabulce zvýrazní skupiny prvků, které se v šifrách hodí.'
    ],
    howTo: [
      'Každý prvek má protonové číslo 1–118 a značku z jednoho nebo dvou písmen. Šifry z nich skládají slova: čísla 14 a 57 dávají značky Si a La, tedy SILA.'
    ],
    controls: [['Řádek variant: Tabulka | Hledání', 'Přepíná celou tabulku a hledání jednoho prvku.']],
    pitfalls: [
      [
        'Značka nesedí k českému názvu?',
        'Značky pocházejí z latiny: Fe je ferrum (železo), Na natrium (sodík). Hledání zná i latinské názvy a filtr České v Tabulce ukáže všech 19 takových prvků.'
      ],
      ['Šifra dává čísla prvků?', 'Obvykle jde o protonové číslo, na kartě vlevo nahoře. Číslo vpravo nahoře je relativní atomová hmotnost.']
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
