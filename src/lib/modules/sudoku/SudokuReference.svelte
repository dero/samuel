<script lang="ts">
  import RefLayout from '../../components/reference/RefLayout.svelte';
  import RefList from '../../components/reference/RefList.svelte';
  import RefSection from '../../components/reference/RefSection.svelte';
  import type { RefHelpData } from '../../components/reference/refTypes';

  const help: RefHelpData = {
    purpose: [
      'Sudoku je mřížka 9 × 9, ve které má každý řádek, sloupec i blok 3 × 3 číslice 1–9 právě jednou. Nástroj vyřeší zadání, které do něj opíšete, a ohlídá překlepy.'
    ],
    howTo: [
      'Vyberte pole a klepněte na číslici. Výběr pak sám skočí na další pole, takže zadání opíšete řádek po řádku a prázdná pole přeskočíte `0`. Vyřešit doplní zbytek zeleně.'
    ],
    example: {
      title: 'Příklad: klasické sudoku',
      steps: [
        {
          action: 'Klepněte na levé horní pole a pak na `5` a `3`.',
          result: 'Číslice se zapíšou a výběr po každé skočí o pole doprava.'
        },
        {
          action: 'Klepněte dvakrát na `0`, pak na `7` a čtyřikrát na `0`.',
          result: 'Prázdná pole se přeskočí. První řádek je hotový a výběr čeká na začátku druhého.'
        },
        {
          action:
            'Stejně opište zbylé řádky, tečka znamená `0`: `6..195...`, `.98....6.`, `8...6...3`, `4..8.3..1`, `7...2...6`, `.6....28.`, `...419..5`, `....8..79`.',
          result: 'Lišta ukazuje Zadáno 30 z 81.'
        },
        {
          action: 'Klepněte na Vyřešit (dole uprostřed).',
          result: 'Prázdná pole se doplní zelenými číslicemi a lišta hlásí Vyřešeno. První řádek je `534678912`.'
        }
      ]
    },
    controls: [
      ['Klepnutí na pole', 'Vybere pole. Jeho řádek, sloupec a blok se podbarví.'],
      ['Číslice `1`–`9`', 'Zapíše číslo do vybraného pole a posune výběr na další.'],
      ['`0` a `▶`', 'Přeskočí na další pole a nic nepřepíše.'],
      ['`◀` (vlevo od číslic)', 'Vrátí výběr o pole zpět, nic nesmaže.'],
      ['Vyřešit (dole uprostřed)', 'Doplní řešení. Dokud lišta hlásí chybu v zadání, nejde stisknout.'],
      ['Zpět (vpravo dole)', 'Smaže vybrané pole. Na prázdném poli skočí o pole zpět a smaže to.'],
      ['Koš (vlevo dole)', 'Podržením smaže celé zadání a vrátí mřížku do středu.'],
      ['Dva prsty na mřížce', 'Posun a přiblížení. Dvojí klepnutí přiblíží místo, další dvojí klepnutí vrátí celou mřížku.'],
      [
        'Záložka Podklad',
        'Zadání jako text po řádcích: `53..7....,6..195...`. Čárka dělí řádky, prázdné pole je tečka nebo `0`. Platí i 81 znaků v kuse nebo řádky pod sebou, třeba ze schránky.'
      ]
    ],
    pitfalls: [
      [
        'Lišta hlásí Kolize v zadání?',
        'Stejná číslice je dvakrát v řádku, sloupci nebo bloku a obě pole svítí červeně. Opravte překlep, do té doby Vyřešit nejde.'
      ],
      [
        'Lišta hlásí Žádné řešení, zkontrolujte zadání?',
        'Zadání si odporuje, i když se nic neopakuje. Porovnejte mřížku se šifrou řádek po řádku, stačí jedna špatná číslice.'
      ],
      [
        'Lišta hlásí Více řešení, ukazuji jedno?',
        'V zadání chybí aspoň jedna číslice. Doplňte ji a klepněte na Vyřešit znovu.'
      ],
      [
        'Lišta hlásí třeba Řádek 2 má 8 polí místo 9?',
        'Na záložce Podklad chybí nebo přebývá znak. Každé prázdné pole musí mít svou tečku nebo `0`.'
      ],
      ['Mřížka utekla z obrazovky?', 'Dvakrát klepněte na mřížku, vrátí se celá.']
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
