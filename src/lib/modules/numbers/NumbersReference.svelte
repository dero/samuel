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
    controls: [
      ['`Z:` a `DO:`', 'lišta nad klávesnicí: vstup a výstup. Klepnutí zvolí znak, římská čísla nebo soustavu.'],
      ['Šipky mezi nimi', 'prohodí vstup a výstup'],
      ['Prostřední tlačítko', 'potvrdí číslo, bez čísla vloží mezeru'],
      ['Číslo ➔ znak', 'v menu: znak se vloží sám po celém bloku, např. 5 bitů'],
      ['Indexovat od nuly', 'v menu: A = 0'],
      ['Režim ASCII', 'v menu: 65 = A'],
      ['Abeceda', 'v menu, obvykle anglická (26)'],
      ['Binárka, Trojkovka', 'odkazy v launcheru: otevřou Čísla s převodem 2 / 3 ➔ znak']
    ],
    pitfalls: [
      ['A = 0, nebo A = 1?', 'nedává-li text smysl → menu Indexovat od nuly (platí i pro Binárku a Trojkovku)'],
      ['Čísla nad 26', 'nejspíš ASCII: `65` = A, `97` = a → menu Režim ASCII'],
      ['Abeceda s CH', 'od I dál je vše o 1 vyšší'],
      ['Bity', 'písmeno = 5 bitů (`00001` = A), ASCII = 7–8 bitů'],
      ['`IIII`, `IC`, `IIX`', 'nekanonický zápis → vstup Římská volná']
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
