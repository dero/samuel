<script lang="ts">
  import RefLayout from '../../components/reference/RefLayout.svelte';
  import RefSection from '../../components/reference/RefSection.svelte';
  import SegmentDisplayIcon from './SegmentDisplayIcon.svelte';
  import type { RefHelpData, RefTab, RefTool } from '../../components/reference/refTypes';
  import {
    DISPLAY_CONFIGS,
    FOURTEEN_SEG_DIGITS,
    FOURTEEN_SEG_LETTERS,
    FOURTEEN_SEG_SYMBOLS,
    SEVEN_SEG_DIGITS,
    SEVEN_SEG_LETTERS,
    SIXTEEN_SEG_DIGITS,
    SIXTEEN_SEG_LETTERS,
    SIXTEEN_SEG_SYMBOLS,
    type DisplayGlyphEntry,
    type DisplayType
  } from './displaysData';

  interface Props {
    activeTool: DisplayType;
  }

  let { activeTool }: Props = $props();

  const tabs: RefTab<DisplayType>[] = [
    { id: '7seg', label: '7-segment' },
    { id: '14seg', label: '14-segment' },
    { id: '16seg', label: '16-segment' }
  ];

  const tabSections: Record<
    DisplayType,
    { title: string; note?: string; items: readonly DisplayGlyphEntry[] }[]
  > = {
    '7seg': [
      {
        title: 'Písmena',
        note: 'Obvod `1` (horní) po směru ručiček `2` `3` `4` `5` `6`, střed `7`. Shodné tvary (`2/Z`, `5/S`) se výchozím nastavením čtou jako písmena.',
        items: SEVEN_SEG_LETTERS
      },
      {
        title: 'Číslice',
        note: 'Chcete-li číst `2` a `5` přednostně jako číslice, zapněte Menu → Preference čísel.',
        items: SEVEN_SEG_DIGITS
      }
    ],
    '14seg': [
      {
        title: 'Písmena',
        note: 'Obvod `a–f`, střední hvězda `g–n` od 9 hodin po směru ručiček.',
        items: FOURTEEN_SEG_LETTERS
      },
      { title: 'Číslice', items: FOURTEEN_SEG_DIGITS },
      { title: 'Symboly', items: FOURTEEN_SEG_SYMBOLS }
    ],
    '16seg': [
      {
        title: 'Písmena',
        note: 'Obvod `a–h` od 12 hodin vlevo po směru ručiček, střední hvězda `i–p` od 9 hodin.',
        items: SIXTEEN_SEG_LETTERS
      },
      { title: 'Číslice', items: SIXTEEN_SEG_DIGITS },
      { title: 'Symboly', items: SIXTEEN_SEG_SYMBOLS }
    ]
  };

  const help: RefHelpData = {
    purpose: [
      'Segmentové displeje skládají písmena a číslice rozsvěcením čárek v pevné mřížce. Nástroj převede rozsvícené segmenty na text a pod každým znakem ukáže jejich kód.'
    ],
    howTo: [
      'Zapněte segmenty jednoho znaku klepnutím nebo jedním tahem prstu a vložte ho prostřední klávesou dole. U shodných tvarů má písmeno vždy přednost, pokud nezapnete Menu → Preference čísel.'
    ],
    controls: [
      ['Segmenty na displeji', 'Klepnutím segment zapnete nebo vypnete. Tahem prstu rozsvítíte více segmentů najednou.'],
      ['Řádek variant: 7-segment | 14-segment | 16-segment', 'Přepne typ displeje. Každý typ si drží vlastní zápis.'],
      ['Mezera (uprostřed dole)', 'Bez vybraných segmentů vloží mezeru. S rozsvícenými segmenty ukazuje znak a klepnutím ho vloží.'],
      ['Zpět (vpravo dole)', 'Zruší rozpracovaný znak (ukazuje ✕), jinak smaže poslední znak.'],
      ['Koš (vlevo dole)', 'Podržením smaže celý zápis zvoleného displeje.'],
      ['Menu → Okamžité vkládání', 'Znak se vloží hned po zvednutí prstu, jakmile dává platný znak.'],
      ['Menu → Preference čísel', 'U shodných tvarů (`Z/2`, `S/5`, `O/0`) upřednostní číslice před písmeny.']
    ],
    pitfalls: [
      ['Místo `2` nebo `5` vychází `Z` nebo `S`?', 'Písmeno má výchozím nastavením přednost. Zapněte Menu → Preference čísel.'],
      ['Kód v Podkladu hlásí neplatné znaky?', 'Zkontrolujte, že používáte kódy patřící zvolenému displeji bez opakování v jednom znaku.']
    ]
  };

  const tools: RefTool<DisplayType>[] = [
    {
      id: '7seg',
      label: '7-segment',
      help: {
        howTo: [
          'Sedm čárek označených `1–7`: horní `1`, pravé `2`, `3`, dolní `4`, levé `5`, `6`, střední `7`.'
        ],
        example: {
          title: 'Příklad: AHOJ',
          steps: [
            {
              action: 'Táhněte prstem přes `1`, `2`, `3`, `5`, `6`, `7` a klepněte na prostřední klávesu.',
              result: 'Vloží se `A` a pod ním kód `123567`.'
            },
            {
              action: 'Zadejte `H` (`3567`), `O` (`3457`) a `J` (`2345`).',
              result: 'Výstup ukazuje `AHOJ`. Na záložce Podklad je totéž jako `123567,3567,3457,2345` (případně `abcefg,cefg,cdeg,bcde`).'
            }
          ]
        },
        controls: [
          ['Záložka Podklad', 'Zápis čísly `1–7` (`' + DISPLAY_CONFIGS['7seg'].exampleNotation + '`) nebo písmeny `a–g`. Přijímá obojí.'],
          ['Menu → Indexování písmeny', 'Nestandardní přepínač zobrazující na 7-segmentu písmena `a–g` místo čísel `1–7`.']
        ],
        pitfalls: [
          ['Zadáváte šifru popsanou písmeny `a–g`?', 'Do záložky Podklad můžete psát přímo `a–g` i `1–7`. Pokud chcete vidět `a–g` i na displeji, zapněte Menu → Indexování písmeny.']
        ]
      }
    },
    {
      id: '14seg',
      label: '14-segment',
      help: {
        howTo: [
          'Alfanumerický displej s neděleným horním (`a`) a dolním (`d`) okrajem a osmicípou hvězdou uprostřed (`g–n`).'
        ],
        controls: [
          ['Záložka Podklad', 'Zápis písmeny `a–n`: `' + DISPLAY_CONFIGS['14seg'].exampleNotation + '`.']
        ]
      }
    },
    {
      id: '16seg',
      label: '16-segment',
      help: {
        howTo: [
          'Alfanumerický displej s půleným horním (`a`, `b`) i dolním (`e`, `f`) okrajem a vnitřní hvězdou (`i–p`).'
        ],
        controls: [
          ['Záložka Podklad', 'Zápis písmeny `a–p`: `' + DISPLAY_CONFIGS['16seg'].exampleNotation + '`.']
        ]
      }
    }
  ];
</script>

<RefLayout {tabs} {help} {tools} {activeTool}>
  {#snippet content(tab)}
    {#each tabSections[tab] as sec (sec.title)}
      <RefSection title={sec.title} note={sec.note}>
        <div class="entries-grid">
          {#each sec.items as entry (`${tab}-${entry.char}-${entry.segments}`)}
            <div
              class="symbol-card"
              title="{entry.char} – segmenty: {entry.segments}{entry.description ? ` (${entry.description})` : ''}"
            >
              <span class="symbol-char">{entry.char}</span>
              <SegmentDisplayIcon type={tab} segments={entry.segments} />
            </div>
          {/each}
        </div>
      </RefSection>
    {/each}
  {/snippet}
</RefLayout>

<style>
  .entries-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(76px, 1fr));
    gap: 6px;
  }

  .symbol-card {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 6px 8px;
    background-color: var(--color-surface-1);
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-sm);
    gap: 8px;
    user-select: none;
  }

  .symbol-char {
    font-family: var(--font-condensed);
    font-size: var(--text-xl);
    font-weight: 800;
    color: var(--color-text-primary);
    line-height: 1;
    flex: 1;
    text-align: center;
  }
</style>
