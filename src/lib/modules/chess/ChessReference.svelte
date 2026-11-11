<script lang="ts">
  import RefLayout from '../../components/reference/RefLayout.svelte';
  import RefList from '../../components/reference/RefList.svelte';
  import RefSection from '../../components/reference/RefSection.svelte';
  import type { RefHelpData, RefTool } from '../../components/reference/refTypes';
  import { PIECE_SVG } from './chessPieces';
  import type { PieceChar } from './chessData';
  import { chessState, type ChessMode } from './chessState.svelte';

  const PIECES: { piece: PieceChar; name: string; codes: string; value: string }[] = [
    { piece: 'K', name: 'Král', codes: 'K / K', value: '–' },
    { piece: 'Q', name: 'Dáma', codes: 'D / Q', value: '9' },
    { piece: 'R', name: 'Věž', codes: 'V / R', value: '5' },
    { piece: 'B', name: 'Střelec', codes: 'S / B', value: '3' },
    { piece: 'N', name: 'Jezdec', codes: 'J / N', value: '3' },
    { piece: 'P', name: 'Pěšec', codes: '– / –', value: '1' }
  ];

  const tools: RefTool<ChessMode>[] = [
    {
      id: 'free',
      label: 'Volně',
      help: {
        howTo: [
          'Figury kladete ze zásobníku pod šachovnicí a přesouváte je kamkoli, pravidla se nehlídají. Tak opíšete diagram ze šifry.'
        ],
        example: {
          title: 'Příklad: mat na poslední řadě',
          steps: [
            { action: 'Podržte Koš (vlevo dole).', result: 'Šachovnice je prázdná.' },
            {
              action: 'V zásobníku klepněte na bílého krále a pak na pole g1, potom na bílou věž a na a1.',
              result: 'Figury stojí na šachovnici. Klávesa poslední figury zůstane vybraná jako razítko.'
            },
            {
              action: 'Klepněte na černého pěšce a pak na pole f7, g7 a h7.',
              result: 'Razítko položí pěšce na každé klepnuté pole. Lišta hlásí Chybí černý král.'
            },
            {
              action: 'Přetáhněte černého krále ze zásobníku na g8.',
              result: 'Lišta ukazuje Na tahu bílý, pozici jde hrát. Pokračujte příkladem v Pravidlech.'
            }
          ]
        },
        controls: [
          [
            'Klepnutí na figuru v zásobníku',
            'Udělá z ní razítko: každé klepnutí na pole ji tam položí, na stejnou figuru ji sebere. Druhé klepnutí na klávesu razítko vypne.'
          ],
          ['Tažení ze zásobníku', 'Položí jednu figuru na pole, kde ji pustíte.'],
          ['Guma (vedle bílých figur)', 'Razítko, které figury maže.'],
          ['Výchozí (vedle černých figur)', 'Postaví základní postavení.'],
          ['Klepnutí na figuru, pak na pole', 'Přesune ji kamkoli, bez pravidel. Jde to i tažením.'],
          ['Tažení figury do zásobníku', 'Odebere ji ze šachovnice (Pustit = odebrat).'],
          ['Menu → Nápověda tahů', 'Tečkami ukáže, kam vybraná figura dosáhne.']
        ],
        pitfalls: [
          [
            'Klepnutí na figuru ji sebralo nebo položilo jinou?',
            'Je zapnuté razítko, jeho klávesa v zásobníku svítí. Klepněte na ni znovu, razítko se vypne a figury půjde zase přesouvat.'
          ],
          [
            'Lišta hlásí Chybí černý král nebo Pěšec na krajní řadě?',
            'Ve Volně to nevadí, jen taková pozice nejde hrát v Pravidlech. Doplňte krále, nebo pěšce posuňte.'
          ]
        ]
      }
    },
    {
      id: 'rules',
      label: 'Pravidla',
      help: {
        howTo: [
          'Hrají se jen platné tahy a strany se střídají. Lišta hlásí, kdo je na tahu, šach, mat i průběh hledání. Řešit najde nejkratší mat strany na tahu.'
        ],
        example: {
          title: 'Příklad: najít mat',
          steps: [
            {
              action: 'S pozicí z příkladu ve Volně klepněte v řádku variant na Pravidla.',
              result: 'Místo zásobníku je řádek tahů se štítkem Start a pod ním klávesy na tahu a Řešit.'
            },
            {
              action: 'Klepněte na Řešit.',
              result: 'Lišta hlásí Nalezen mat v 1. Zelená šipka vede z a1 na a8 a v řádku tahů svítí štítek Mat 1: Va8#.'
            },
            {
              action: 'Klepněte na zelený štítek.',
              result: 'Věž přejede na a8, v řádku tahů přibude `1. Va8#` a lišta hlásí Mat, vyhrál bílý.'
            },
            {
              action: 'Klepněte na Zpět (vpravo dole), pak na věž a na pole a8.',
              result: 'Tah zahrajete i ručně. Tečky po klepnutí na věž ukazují, kam smí.'
            }
          ]
        },
        controls: [
          [
            'Klepnutí na figuru, pak na pole',
            'Zahraje tah, jde to i tažením. Táhne jen strana na tahu a jen platné tahy, kam figura smí, ukazují tečky.'
          ],
          ['Proměna pěšce', 'Nad polem se nabídne dáma, věž, střelec a jezdec. Klepnutí jinam na šachovnici tah zruší.'],
          ['Řádek tahů (nad klávesami)', 'Tahy partie od štítku Start. Klepnutí na tah skočí na jeho pozici.'],
          ['na tahu (vlevo)', 'Přepne stranu, která je na tahu.'],
          [
            'Řešit (vpravo)',
            'Hledá nejkratší mat strany na tahu, nejdéle 60 s. Během hledání se změní na Zrušit, které hledání zastaví.'
          ],
          ['Zelený štítek Mat (v řádku tahů)', 'Zahraje celou matovou variantu, Zpět ji krokuje zpátky.']
        ],
        pitfalls: [
          [
            'Pravidla nejdou zapnout?',
            'Pozice se nedá hrát a toast řekne proč, třeba Chybí černý král. Opravte ji ve Volně.'
          ],
          ['V úloze táhne černý?', 'Klepněte na klávesu na tahu, aby ukazovala Černý, a teprve pak na Řešit.'],
          [
            'Lišta hlásí kratší neověřen?',
            'Hledání narazilo na limit 60 s. Nalezený mat platí, jen nemusí být nejkratší.'
          ],
          [
            'Řešení začíná šachem, ale úloha čeká tichý tah?',
            'Od matu ve 3 tazích hledá Řešit nejdřív šachy a tichý úvodní tah stejné délky už nezkouší. Kratší mat vyloučí, pokud stihne limit.'
          ],
          [
            'Rošáda nejde?',
            'Král a věž musí stát na výchozích polích. U pozice postavené ve Volně se právo na rošádu odvodí z postavení.'
          ],
          [
            'Tah uprostřed partie smazal její konec?',
            'Nový tah ze starší pozice nahradí všechny pozdější. Partii jen procházejte řádkem tahů nebo tlačítky Zpět a Vpřed.'
          ]
        ]
      }
    }
  ];

  const help: RefHelpData = {
    purpose: [
      'Šachová úloha v šifře bývá diagram, zápis partie nebo FEN. Nástroj pozici postaví, zahraje tahy podle pravidel a najde nejkratší mat.'
    ],
    howTo: [
      'Diagram postavte ve Volně, partii nebo FEN napište na záložku Podklad. V Pravidlech pak pozici hrajete a necháte hledat mat.'
    ],
    controls: [
      ['Řádek variant: Volně | Pravidla', 'Volně staví pozici bez pravidel, Pravidla hrají platné tahy a hledají mat.'],
      ['Zpět a Vpřed (vpravo dole)', 'Krok v historii, i přes vyprázdnění šachovnice. Podržením běží rychle.'],
      [
        'Koš (vlevo dole)',
        'Podržením vyprázdní šachovnici, smaže neplatné části zápisu a přepne na Volně. Zpět vrátí pozici i zápis.'
      ],
      [
        'Záložka Podklad',
        'Pozice ve FEN, nebo tahy česky i anglicky: `1. e4 e5 2. Jf3`. Za FEN mohou následovat tahy z té pozice. Šachovnice se mění už při psaní a tahy přepnou na Pravidla. Co změníte na šachovnici, Podklad přepíše.'
      ],
      ['Menu → Otočit šachovnici', 'Černý bude dole. Na záložce Menu pak svítí tečka.'],
      ['Menu → Souřadnice', 'Písmena a–h a čísla 1–8 na okraji šachovnice.'],
      ['Menu → Reset nástroje', 'Základní postavení a výchozí volby Menu. Volně nebo Pravidla zůstane.']
    ],
    pitfalls: [
      [
        'Partie z Podkladu začíná jinde, než čekáte?',
        'Tahy se hrají ze základního postavení. Když tam zahrát nejdou, navážou na pozici na šachovnici. Chcete-li jistotu, napište před tahy FEN výchozí pozice.'
      ],
      [
        'Lišta hlásí Neplatné části zápisu?',
        'Kus textu nejde přečíst ani zahrát. Zůstane na konci zápisu na záložce Podklad, kde je pod textem napsané proč. Opravte ho tam, nebo ho smaže Koš.'
      ],
      [
        'Na záložce Podklad svítí tečka?',
        'Zápis má neplatný kus, nebo pozici nejde hrát (chybí král, pěšec na krajní řadě). Důvod je napsaný pod textem na záložce Podklad.'
      ]
    ]
  };
</script>

<RefLayout tabs={[{ id: 'pieces', label: 'Figury' }]} {help} {tools} activeTool={chessState.mode}>
  {#snippet content()}
    <RefSection title="Figury" note="zkratka česky / anglicky, hodnota v pěšcích">
      <div class="ref-table-wrap">
        <table class="ref-table">
          <thead>
            <tr>
              <th class="col-code"></th>
              <th class="col-name">Figura</th>
              <th class="col-code">Zkratka</th>
              <th class="col-val">Hodnota</th>
            </tr>
          </thead>
          <tbody>
            {#each PIECES as p (p.piece)}
              <tr>
                <td class="col-code"><span class="ref-piece">{@html PIECE_SVG[p.piece]}</span></td>
                <td class="col-name">{p.name}</td>
                <td class="col-code">{p.codes}</td>
                <td class="col-val">{p.value}</td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    </RefSection>

    <RefSection title="Notace">
      <RefList
        items={[
          ['`Jf3`', 'jezdec na f3 (pěšec bez písmene: `e4`)'],
          ['`x`', 'braní: `Sxe5`, `exd5`'],
          ['`+` / `#`', 'šach / mat'],
          ['`O-O` / `O-O-O`', 'malá / velká rošáda'],
          ['`e8=D`', 'proměna pěšce'],
          ['`e.p.`', 'braní mimochodem']
        ]}
      />
    </RefSection>

    <RefSection title="Šachovnice">
      <RefList
        items={[
          ['`a1`', 'vlevo dole z pohledu bílého, tmavé pole'],
          ['`h1`', 'vpravo dole, vždy světlé'],
          ['Dáma', 'na poli své barvy: bílá `d1`, černá `d8`']
        ]}
      />
    </RefSection>
  {/snippet}
</RefLayout>

<style>
  .ref-piece {
    display: inline-block;
    width: 28px;
    height: 28px;
    vertical-align: middle;
  }

  .ref-piece :global(svg) {
    width: 100%;
    height: 100%;
    display: block;
  }
</style>
