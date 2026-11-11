<script lang="ts">
  import RefLayout from '../../components/reference/RefLayout.svelte';
  import RefList from '../../components/reference/RefList.svelte';
  import RefSection from '../../components/reference/RefSection.svelte';
  import type { RefHelpData, RefTab } from '../../components/reference/refTypes';

  interface Props {
    letters: string[];
  }

  let { letters }: Props = $props();

  type NumbersRefTab = 'alphabet' | 'roman' | 'ascii';

  const tabs: RefTab<NumbersRefTab>[] = [
    { id: 'alphabet', label: 'Abeceda' },
    { id: 'roman', label: 'Římská' },
    { id: 'ascii', label: 'ASCII' }
  ];

  const letterRows = $derived(
    letters.map((char, index) => {
      const num = index + 1;
      return {
        char,
        num,
        bin: num.toString(2).padStart(5, '0'),
        oct: num.toString(8).padStart(2, '0'),
        hex: num.toString(16).toUpperCase().padStart(2, '0')
      };
    })
  );

  // Printable ASCII 32–126
  const asciiRows = Array.from({ length: 95 }, (_, i) => {
    const code = 32 + i;
    return {
      code,
      char: code === 32 ? '␣' : String.fromCharCode(code),
      hex: code.toString(16).toUpperCase(),
      bin: code.toString(2).padStart(8, '0')
    };
  });

  const ROMAN_SYMBOLS = [
    ['I', 1], ['V', 5], ['X', 10], ['L', 50], ['C', 100], ['D', 500], ['M', 1000]
  ] as const;

  const ROMAN_SUBTRACTIONS = [
    ['IV', 4], ['IX', 9], ['XL', 40], ['XC', 90], ['CD', 400], ['CM', 900]
  ] as const;

  const help: RefHelpData = {
    purpose: [
      'Převádí čísla mezi soustavami a na písmena: pořadí v abecedě (A = 1), kódy ASCII, binárku i římská čísla. Pod každým výsledkem ukáže, z čeho vznikl.'
    ],
    howTo: [
      'Šifra nejčastěji zapisuje pořadí písmene v abecedě v nějaké soustavě. V řádku variant zvolte, z čeho převádíte (Z:) a na co (DO:). Při převodu čísla na znak se celý blok, třeba 5 bitů, vloží sám.'
    ],
    example: {
      title: 'Příklad: AHOJ v binárce',
      steps: [
        {
          action: 'Klepněte na Z: a zvolte Binární (BIN). DO: nechte na ZNAK.',
          result: 'Klávesnice má jen `0` a `1`. Stejně nástroj otevře dlaždice Binárka v launcheru.'
        },
        {
          action: 'Klepněte na `0`, `0`, `0`, `0` a `1`.',
          result: 'Lišta počítá Blok 1/5 až 4/5 a po pátém bitu se samo vloží A.'
        },
        {
          action: 'Stejně zadejte `01000`, `01111` a `01010`.',
          result: 'Přibude H, O a J, pod každým písmenem zůstane jeho blok.'
        },
        {
          action: 'Klepněte na šipky mezi Z: a DO:.',
          result: 'Převod se obrátí: nahoře jsou bloky, pod nimi písmena a klávesnice nabídne abecedu.'
        }
      ]
    },
    controls: [
      [
        'Z: a DO: (v řádku variant)',
        'Z čeho a na co převádíte: Písmeno, Římská kanonická, Římská volná (jen vstup) nebo soustava 2 až 16. Dokud je něco zadané, jiný druh vstupu nejde zvolit.'
      ],
      ['Šipky mezi Z: a DO:', 'Prohodí vstup a výstup i se zadanými čísly.'],
      [
        'Mezera (dole uprostřed)',
        'Potvrdí rozepsané číslo, na tlačítku je vidět jeho výsledek. Bez čísla vloží mezeru.'
      ],
      [
        'Zpět (vpravo dole)',
        'Smaže poslední číslici. Hotové číslo znovu otevře bez poslední číslice, takže překlep nestojí celý blok.'
      ],
      ['Koš (vlevo dole)', 'Podržením smaže celý vstup.'],
      [
        'Záložka Podklad',
        'Celý vstup jako text: čísla ve zvolené soustavě oddělená čárkou, prázdné pole je mezera (`00001,01000`).'
      ],
      [
        'Menu → Číslo ➔ znak',
        'Vloží znak sám, jakmile je blok celý: pro 26 písmen 5 bitů nebo 2 desítkové číslice. Vypnuté čeká na potvrzení.'
      ],
      ['Menu → Indexovat od nuly', 'A = 0 místo A = 1.'],
      ['Menu → Režim ASCII', 'Čísla jsou kódy ASCII: `65` = A, `97` = a.']
    ],
    pitfalls: [
      [
        'Jednomístné číslo se samo nevloží?',
        'V desítkové soustavě má blok dvě číslice. Napište `08`, nebo číslo potvrďte tlačítkem dole uprostřed.'
      ],
      [
        'Všechna písmena vycházejí o jedno vedle?',
        'Šifra počítá A = 0. Zapněte Menu → Indexovat od nuly, platí i pro Binárku a Trojkovku.'
      ],
      [
        'Čísla jsou větší než 26 nebo bloky mají 8 bitů?',
        'Nejspíš jde o ASCII. Zapněte Menu → Režim ASCII; desítkový blok má pak 3 číslice, kratší kód potvrďte tlačítkem dole uprostřed.'
      ],
      [
        'Písmena od I dál vycházejí o jedno vedle?',
        'Šifra počítá CH jako písmeno. Zvolte Menu → Abeceda → Anglická + CH (27).'
      ],
      [
        'Římské číslo jako `IIII` nebo `IC` nejde zadat?',
        'Kanonický vstup takové tvary nepustí. Zvolte v Z: Římská volná.'
      ]
    ]
  };
</script>

{#snippet tiles(items: readonly (readonly [string, number])[])}
  <div class="tile-grid">
    {#each items as [sym, val] (sym)}
      <div class="tile">
        <span class="tile-sym">{sym}</span>
        <span class="tile-val">{val}</span>
      </div>
    {/each}
  </div>
{/snippet}

<RefLayout {tabs} {help}>
  {#snippet content(tab)}
    {#if tab === 'alphabet'}
      <RefSection title="Pořadí v abecedě" note="Podle abecedy v menu. Od nuly: odečíst 1.">
        <div class="ref-table-wrap">
          <table class="ref-table">
            <thead>
              <tr>
                <th class="col-num">#</th>
                <th>Znak</th>
                <th class="col-val">BIN</th>
                <th class="col-val">OCT</th>
                <th class="col-val">HEX</th>
              </tr>
            </thead>
            <tbody>
              {#each letterRows as row (row.num)}
                <tr>
                  <td class="col-num">{row.num}</td>
                  <td class="col-name">{row.char}</td>
                  <td class="col-val">{row.bin}</td>
                  <td class="col-val is-muted">{row.oct}</td>
                  <td class="col-val">{row.hex}</td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      </RefSection>
    {:else if tab === 'roman'}
      <RefSection title="Symboly">
        {@render tiles(ROMAN_SYMBOLS)}
      </RefSection>

      <RefSection title="Odčítání">
        {@render tiles(ROMAN_SUBTRACTIONS)}
      </RefSection>

      <RefSection title="Příklady" note="Po řádech, zleva od největšího.">
        <RefList
          items={[
            ['1984', '`M` `CM` `LXXX` `IV` = MCMLXXXIV'],
            ['49', '`XL` `IX` = XLIX, ne IL'],
            ['99', '`XC` `IX` = XCIX, ne IC']
          ]}
        />
      </RefSection>

      <RefSection title="Kanonický zápis">
        <RefList
          items={[
            '`I` `X` `C` `M` nejvýš 3× za sebou',
            '`V` `L` `D` se neopakují',
            'Odčítá se jeden symbol: `I` před `V X`, `X` před `L C`, `C` před `D M`'
          ]}
        />
      </RefSection>

      <RefSection title="Volný zápis">
        <RefList
          items={[
            ['Sčítání', '`IIII` = 4, `VIIII` = 9, `XXXX` = 40'],
            ['Zkratky', '`IC` = 99, `IL` = 49, `XM` = 990'],
            ['Víc odčítání', '`IIV` = 3, `IIX` = 8']
          ]}
        />
      </RefSection>
    {:else}
      <RefSection title="ASCII" note="Velká písmena `65–90`, malá `97–122`, číslice `48–57`.">
        <div class="ref-table-wrap">
          <table class="ref-table">
            <thead>
              <tr>
                <th>Znak</th>
                <th class="col-val">DEC</th>
                <th class="col-val">HEX</th>
                <th class="col-val">BIN</th>
              </tr>
            </thead>
            <tbody>
              {#each asciiRows as row (row.code)}
                <tr>
                  <td class="col-name">{row.char}</td>
                  <td class="col-val">{row.code}</td>
                  <td class="col-val">{row.hex}</td>
                  <td class="col-val is-muted">{row.bin}</td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      </RefSection>
    {/if}
  {/snippet}
</RefLayout>

<style>
  .tile-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(56px, 1fr));
    gap: 4px;
  }

  .tile {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 6px 4px;
    background-color: var(--color-surface-2);
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-xs);
  }

  .tile-sym {
    font-family: var(--font-mono);
    font-size: var(--text-base);
    font-weight: 800;
    color: var(--color-accent-primary);
  }

  .tile-val {
    font-family: var(--font-mono);
    font-size: var(--text-xs);
    color: var(--color-text-secondary);
  }
</style>
