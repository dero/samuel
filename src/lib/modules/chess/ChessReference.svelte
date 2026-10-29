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
        controls: [
          ['Tažení ze zásobníku', 'položí figuru na pole'],
          ['Ťuk na figuru v zásobníku', 'razítko: každé ťuknutí na pole ji položí'],
          ['Razítko na stejnou figuru', 'sebere ji'],
          ['Guma', 'razítko, které maže'],
          ['Tažení figury', 'kamkoli, bez pravidel; přes zásobník = odebrat'],
          ['Ťuk na figuru, pak na pole', 'přesun bez tažení'],
          ['Výchozí', 'základní postavení'],
          ['Tečky', 'kam figura dosáhne → menu Nápověda tahů']
        ]
      }
    },
    {
      id: 'rules',
      label: 'Pravidla',
      help: {
        controls: [
          ['Tahy', 'jen legální, strany se střídají'],
          ['Proměna', 'výběr figury nad polem'],
          ['Lišta tahů', 'ťuk = skok na pozici'],
          ['na tahu', 'přepne stranu'],
          ['Řešit', 'hledá nejkratší mat, dokud ho nenajde (max. 60 s)'],
          ['Pořadí', 'všechny maty do 2 → jen šachy do 12 → ověření kratšího'],
          ['Zrušit', 'zastaví hledání, nalezené zůstane'],
          ['Zelená varianta', 'ťuk = zahraje celou až do matu, `Zpět` krokuje']
        ],
        pitfalls: [
          ['Pravidla nejdou zapnout', 'toast řekne proč, např. chybí král'],
          ['Obrana ve variantě', 'nejdelší odpor; jiné obrany vedou k matu stejně nebo dřív'],
          ['Mat přes šachy (od 3 tahů)', 'tichý klíčový tah stejné délky se už nehledá'],
          ['Kratší mat neověřen', 'limit vypršel; řešení platí, jen nemusí být nejkratší'],
          ['Rošáda nejde', 'král a věž musí stát na výchozích polích'],
          ['Tah v minulosti', 'nový tah smaže pozdější tahy']
        ]
      }
    }
  ];

  const help: RefHelpData = {
    controls: [
      ['Volně / Pravidla', 'lišta nad zásobníkem'],
      ['Zpět / Vpřed', 'každý krok vč. vymazání; podržet = rychle'],
      ['Koš (podržet)', 'prázdná šachovnice'],
      ['Vložit pozici nebo partii', 'FEN nebo tahy, česky i anglicky → menu'],
      ['Otočit šachovnici', 'černý dole → menu']
    ],
    pitfalls: [
      ['Partie od diagramu', 'tahy navazují na šachovnici, pokud je ze základní pozice nejde zahrát']
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
