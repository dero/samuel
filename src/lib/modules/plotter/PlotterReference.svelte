<script lang="ts">
  import RefLayout from '../../components/reference/RefLayout.svelte';
  import type { RefHelpData } from '../../components/reference/refTypes';
  import DirectionsRefSection from '../turtle/DirectionsRefSection.svelte';

  const help: RefHelpData = {
    purpose: [
      'Plotr kreslí podle světových stran: sever, jihovýchod a tak dál. Nástroj povely ze šifry nakreslí, takže uvidíte, jaký tvar nebo písmeno vznikne.'
    ],
    howTo: [
      'Kreslení začíná v prázdném kroužku. Každý stisk směru posune šipku o jedno pole, šikmý krok o jedno pole v obou osách. Natočení se nepočítá, `S` je vždy nahoru.'
    ],
    example: {
      title: 'Příklad: písmeno N',
      steps: [
        { action: 'Klepněte dvakrát na `S`.', result: 'Nahoru vede čára o dvou krocích, lišta ukazuje 2 kroky.' },
        { action: 'Klepněte dvakrát na `JV`.', result: 'Šikmá čára vede dolů doprava zpátky na spodní řadu.' },
        { action: 'Klepněte dvakrát na `S`.', result: 'Písmeno N je hotové, lišta ukazuje 6 kroků.' },
        {
          action: 'Klepněte na pero Kreslí (dole uprostřed), pak jednou na `V` a na klávesu Značka 1.',
          result: 'Pero ukazuje Zvednuto, přesun doprava je jen čárkovaný a na jeho konci je žlutá značka 1. Na záložce Podklad je `S2,JV2,S2,T,V,M`.'
        }
      ]
    },
    controls: [
      [
        'Osm směrů: `SZ` `S` `SV`, `Z` `V`, `JZ` `J` `JV`',
        'Krok o jedno pole daným směrem. Kroky stejným směrem po sobě se sečtou (`S3`).'
      ],
      ['Značka (uprostřed mezi směry)', 'Položí na místo šipky očíslovaný žlutý bod. Klávesa ukazuje číslo příští značky.'],
      [
        'Pero: Kreslí / Zvednuto (dole uprostřed)',
        'Se zvednutým perem se šipka přesune bez čáry a stopa je jen čárkovaná (Menu → Zobrazit přejezdy perem).'
      ],
      ['Zpět (vpravo dole)', 'Vezme zpět poslední stisk: `S3` se změní na `S2`.'],
      ['Koš (vlevo dole)', 'Podržením smaže celou kresbu.'],
      [
        'Záložka Podklad',
        'Celý zápis jako text: světové strany, `T` pero, `M` značka. Číslo za směrem je počet kroků: `S3,V,JV,T,Z,M`.'
      ],
      ['Menu → Zobrazit mřížku', 'Bodová síť souřadnic na pozadí, zapnutá od začátku.'],
      ['Menu → Reset nástroje', 'Smaže kresbu a vrátí volby Menu.']
    ],
    pitfalls: [
      [
        'Zadání říká vpřed, vlevo, otoč se o 45°?',
        'Otočky vůči kreslíři kreslí nástroj Želva. Plotr zná jen pevné světové strany.'
      ],
      [
        'Zadání píše anglicky N, E, S, W?',
        'Přepište je česky: N je `S`, E je `V`, S je `J`, W je `Z`. Anglické S (south) je jih.'
      ],
      [
        'Přepisujete zápis ze Želvy?',
        '`V` a `Z` tu znamenají východ a západ, ne vpřed a zpět. Želví zápis patří do nástroje Želva.'
      ],
      [
        'Šikmá čára je delší než rovná?',
        'Tak to má být: krok `SV` posune o 1 doprava i nahoru, takže čára měří √2. Končí přesně na tečce mřížky.'
      ]
    ]
  };
</script>

<RefLayout tabs={[{ id: 'directions', label: 'Směry' }]} {help}>
  {#snippet content()}
    <DirectionsRefSection />
  {/snippet}
</RefLayout>
