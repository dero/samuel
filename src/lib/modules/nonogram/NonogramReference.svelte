<script lang="ts">
  import RefLayout from '../../components/reference/RefLayout.svelte';
  import RefList from '../../components/reference/RefList.svelte';
  import RefSection from '../../components/reference/RefSection.svelte';
  import type { RefHelpData } from '../../components/reference/refTypes';

  const help: RefHelpData = {
    purpose: [
      'Nonogram (malovaná křížovka) skrývá obrázek: čísla u řádků a sloupců udávají délky souvislých bloků vybarvených polí. Nástroj obrázek z čísel dopočítá.'
    ],
    howTo: [
      'Opište čísla všech záhlaví: nejdřív sloupce zleva, pak řádky shora, v každém čísla v pořadí ze zadání. Rozepsané číslo je podtržené, `▶` ho potvrdí a další `▶` přejde na další záhlaví. Nakonec klepněte na Vyřešit.'
    ],
    example: {
      title: 'Příklad: srdce 5 × 5',
      steps: [
        {
          action: 'Podržte Koš (vlevo dole) a v Menu → Rozměry nastavte šířku i výšku na 5.',
          result: 'Prázdná mřížka má 5 × 5 polí, v jejím levém horním rohu je `5×5`.'
        },
        {
          action: 'Na záložce Interakce klepněte na záhlaví prvního sloupce (nad mřížkou vlevo), pak na `2` a dvakrát na `▶`.',
          result: 'První `▶` číslo 2 potvrdí, druhé přesune výběr na druhý sloupec.'
        },
        {
          action: 'Stejně zadejte zbylé sloupce: `4`, `4`, `4` a `2`, za každým dvakrát `▶`.',
          result: 'Všechny sloupce mají čísla a výběr přešel na první řádek.'
        },
        {
          action:
            'Do řádků zadejte `1` `▶` `1` `▶` `▶`, pak `5`, `5`, `3` a `1`, za každým kromě posledního dvakrát `▶`.',
          result: 'První řádek ukazuje 1 a 1. Lišta hlásí Součty: řádky 16, sloupce 16, takže součty sedí.'
        },
        {
          action: 'Klepněte na Vyřešit (dole uprostřed).',
          result: 'Mřížka ukáže srdce a lišta hlásí Vyřešeno. Na záložce Podklad je totéž jako `1,1/5/5/3/1//2/4/4/4/2`.'
        }
      ]
    },
    controls: [
      ['Klepnutí na záhlaví', 'Vybere sloupec (čísla nad mřížkou) nebo řádek (čísla vlevo). Orámuje se a jeho pole se podbarví.'],
      [
        'Číslice `1`–`9` a `0`',
        'Píšou číslo do vybraného záhlaví, číslice hned po sobě tvoří víceciferné číslo (`1` `2` je 12). `0` jako první číslice záhlaví vyprázdní a přejde na další.'
      ],
      ['`▶` a `◀` (po stranách číslic)', 'Potvrdí rozepsané číslo. Když žádné není, přejdou na další nebo předchozí záhlaví.'],
      ['Vyřešit (dole uprostřed)', 'Dopočítá obrázek. Dokud lišta hlásí chybu v zadání, nejde stisknout.'],
      ['Zpět (vpravo dole)', 'Smaže poslední číslici. Na prázdném záhlaví se vrátí na předchozí.'],
      ['Koš (vlevo dole)', 'Podržením smaže všechna čísla, rozměry zůstanou.'],
      ['Dva prsty na mřížce', 'Posun a přiblížení. Dvojí klepnutí přiblíží místo, další dvojí klepnutí vrátí celou mřížku.'],
      [
        'Záložka Podklad',
        'Celá legenda jako text: `,` mezi čísly, `/` mezi záhlavími, `//` mezi řádky (ty jsou první) a sloupci. Prázdné záhlaví je `0`. Rozměry se podle textu nastaví samy.'
      ],
      [
        'Menu → Rozměry',
        'Šířka a výška 2–30. Čísla odříznutá zmenšením se při zvětšení vrátí. Do Menu vede i klepnutí na roh mřížky s rozměry.'
      ],
      ['Menu → Reset nástroje', 'Smaže čísla a vrátí rozměry 10 × 10.']
    ],
    pitfalls: [
      [
        'Dvě čísla se slila do jednoho, třeba 31 místo 3 a 1?',
        'Mezi čísly patří `▶`, bez něj se číslice skládají. Zpět smaže poslední číslici, pak klepněte na `▶` a pokračujte.'
      ],
      [
        'Nové číslo se připsalo za stará?',
        'Číslice záhlaví nepřepisují, ale přidávají. Stará čísla nejdřív smažte klepáním na Zpět.'
      ],
      [
        'Součty v liště nesouhlasí?',
        'Řádky i sloupce počítají tatáž vybarvená pole, takže součty musí být stejné. Hledejte překlep, nejlépe na záložce Podklad.'
      ],
      [
        'Lišta hlásí třeba Řádek 3: čísla se nevejdou?',
        'Čísla i s mezerami mezi bloky jsou delší než řádek. Zvětšete mřížku v Menu → Rozměry, nebo opravte překlep.'
      ],
      [
        'Lišta hlásí Žádné řešení, zkontrolujte zadání?',
        'Stačí jedno špatné číslo, i když součty sedí. Porovnejte záhlaví se zadáním.'
      ],
      ['Mřížka utekla z obrazovky?', 'Dvakrát klepněte na mřížku, vrátí se celá.']
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
