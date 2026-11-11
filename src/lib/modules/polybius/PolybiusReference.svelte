<script lang="ts">
  import RefLayout from '../../components/reference/RefLayout.svelte';
  import RefList from '../../components/reference/RefList.svelte';
  import RefSection from '../../components/reference/RefSection.svelte';
  import type { RefHelpData } from '../../components/reference/refTypes';

  const help: RefHelpData = {
    purpose: [
      'Polybiův čtverec zapisuje každé písmeno dvěma souřadnicemi: řádkem a sloupcem v tabulce 5×5 nebo 6×6. Nástroj souřadnice převede na text a pod každým písmenem ukáže jeho dvojici.'
    ],
    howTo: [
      'Čtverec se plní po řádcích zleva doprava, takže `11` je A, `12` B a `21` F. Do 5×5 se 26 písmen nevejde, proto v něm chybí `Q`; některé šifry místo toho sloučí I a J.'
    ],
    example: {
      title: 'Příklad: AHOJ (5×5)',
      steps: [
        {
          action: 'Klepněte na `1` v levém sloupci.',
          result: 'Řádek 1 se zvýrazní a ve výstupu svítí rozepsané pole `1·`.'
        },
        { action: 'Klepněte na `1` v horním řádku.', result: 'Vloží se A, pod ním je `11`.' },
        {
          action: 'Klepněte na `3` nahoře a pak na `2` vlevo.',
          result: 'Pořadí nerozhoduje: vloží se H z řádku 2 a sloupce 3, pod ním `23`.'
        },
        {
          action: 'Klepněte přímo na písmena O a J ve čtverci.',
          result: 'Výstup ukazuje AHOJ. Na záložce Podklad je totéž jako `11,23,35,25`.'
        }
      ]
    },
    controls: [
      ['Řádek variant: 5×5 (25) | 6×6 (36)', 'Velikost čtverce. Ve 6×6 jsou písmena `A–Z` a číslice `0–9`.'],
      [
        'Popisky vlevo a nahoře',
        'Vlevo jsou řádky, nahoře sloupce. Klepněte na řádek i sloupec v libovolném pořadí a písmeno se vloží samo; druhé klepnutí na stejný popisek výběr zruší.'
      ],
      ['Písmeno ve čtverci', 'Klepnutím ho vložíte přímo.'],
      ['Mezera (dole uprostřed)', 'Vloží mezeru mezi slova.'],
      ['Zpět (vpravo dole)', 'Smaže poslední znak. Když je zvolený jen řádek nebo sloupec, výběr zruší.'],
      ['Koš (vlevo dole)', 'Podržením smaže celý text.'],
      [
        'Záložka Podklad',
        'Celý zápis jako text: řádek a sloupec, čárka dělí znaky, prázdné pole je mezera (`11,23,,35`). Hodí se pro delší šifru nebo opravu uprostřed.'
      ],
      [
        'Menu → Souřadnice písmeny',
        'Popisky `A–E` (u 6×6 `A–F`) místo číslic. Už zadaný zápis se přepíše na písmena.'
      ],
      [
        'Menu → Abeceda a Vynechaná písmena',
        'Abeceda určuje písmena ve čtverci, každá velikost má svou. Když se do čtverce nevejde, ve Vynechaných písmenech klepnutím vyškrtnete ta, která v něm nejsou.'
      ]
    ],
    pitfalls: [
      [
        'Souřadnice jdou zadat, ale text nedává smysl?',
        'Šifra možná uvádí nejdřív sloupec. Zadávejte první číslici nahoře a druhou vlevo.'
      ],
      [
        'V šifře jsou I a J na jednom poli?',
        'V Menu → Vynechaná písmena vraťte `Q` a vyškrtněte `J`. Pole I pak platí i pro J.'
      ],
      [
        'Jde o ťukací kód?',
        'Ten nemá `K`, místo něj píše `C`. V Menu → Vynechaná písmena vraťte `Q` a vyškrtněte `K`.'
      ],
      [
        'Souřadnice jsou písmena ADFGX nebo ADFGVX?',
        'Zapněte Menu → Souřadnice písmeny a přepište `A D F G X` na `A B C D E` (u 6×6 `A D F G V X` na `A B C D E F`).'
      ]
    ]
  };
</script>

<RefLayout tabs={[{ id: 'notation', label: 'Zápisy' }]} {help}>
  {#snippet content()}
    <RefSection title="Zápis souřadnic" note="Vždy řádek, pak sloupec.">
      <RefList
        items={[
          ['Číslice', '`12` = řádek 1, sloupec 2 = B'],
          ['Písmena', '`AB` = řádek A, sloupec B = B'],
          ['Ťukání', '`•• •••` = 2, 3 = H (ťukací kód)'],
          ['Počet znaků', '`|| |||`, `oo ooo` apod. = 2, 3']
        ]}
      />
    </RefSection>

    <RefSection title="Velikosti">
      <RefList
        items={[
          ['5×5', '25 polí, 26 písmen → jedno chybí: obvykle `Q`, jinak sloučené `I/J`'],
          ['6×6', '`A–Z` a číslice `0–9`'],
          ['S CH (27 znaků)', 'v 5×5 chybí dvě písmena → v menu Vynechaná písmena']
        ]}
      />
    </RefSection>
  {/snippet}
</RefLayout>
