<script lang="ts">
  import RefLayout from '../../components/reference/RefLayout.svelte';
  import type { RefHelpData } from '../../components/reference/refTypes';
  import DirectionsRefSection from './DirectionsRefSection.svelte';

  const help: RefHelpData = {
    purpose: [
      'Želví grafika kreslí podle povelů vpřed, vzad a otoč se o úhel. Nástroj povely ze šifry nakreslí, takže uvidíte, jaký tvar nebo písmeno vznikne.'
    ],
    howTo: [
      'Želva začíná v prázdném kroužku a míří nahoru. Otočky jsou vždy vůči ní, ne ke světovým stranám. Povely zadávejte klávesami v pořadí ze šifry, kresba se hned překreslí a vejde se celá na plochu.'
    ],
    example: {
      title: 'Příklad: písmeno T',
      steps: [
        {
          action: 'Klepněte dvakrát na Vpřed.',
          result: 'Želva nakreslí nožičku o dvou krocích nahoru. Lišta ukazuje 2 kroky · směr 0°.'
        },
        {
          action: 'V řádku variant zvolte 90° a klepněte na Vlevo 90°.',
          result: 'Šipka želvy se otočí doleva, lišta ukazuje směr 270°.'
        },
        {
          action: 'Klepněte jednou na Vpřed a dvakrát na Vzad.',
          result: 'Želva udělá krok doleva a couvne o dva doprava, vznikne příčka písmene T.'
        },
        {
          action: 'Otevřete záložku Podklad.',
          result: 'Zápis je `V2,L90,V,Z2`. Stejný text můžete napsat i rovnou.'
        }
      ]
    },
    controls: [
      [
        'Řádek variant: 1° | 5° | 15° | 45° | 90°',
        'Úhel jedné otočky. Jiný úhel složíte z několika otoček, třeba 60° jako 45° a 15°.'
      ],
      ['Vpřed a Vzad (prostřední sloupec)', 'Krok o 1 ve směru želvy, nebo couvnutí. Kroky po sobě se sečtou (`V3`).'],
      ['Vlevo a Vpravo (po stranách Vzad)', 'Otočí želvu o zvolený úhel proti směru, nebo po směru hodinových ručiček.'],
      ['Značka (vpravo nahoře)', 'Položí na místo želvy očíslovaný žlutý bod. Klávesa ukazuje číslo příští značky.'],
      [
        'Pero: Kreslí / Zvednuto (dole uprostřed)',
        'Se zvednutým perem se želva přesune bez čáry a stopa je jen čárkovaná (Menu → Zobrazit přejezdy perem).'
      ],
      ['Zpět (vpravo dole)', 'Vezme zpět poslední stisk: `V3` se změní na `V2`.'],
      ['Koš (vlevo dole)', 'Podržením smaže celou kresbu.'],
      [
        'Záložka Podklad',
        'Celý zápis jako text: `V` vpřed, `Z` zpět, `L` a `P` otočka o úhel (`P60`), `T` pero, `M` značka. Číslo za pohybem je počet kroků.'
      ],
      ['Menu → Zobrazit mřížku', 'Bodová síť. Krok pod jiným úhlem než 90° na tečce nekončí.'],
      ['Menu → Reset nástroje', 'Smaže kresbu a vrátí volby Menu, úhel otočky zůstane.']
    ],
    pitfalls: [
      [
        'Zadání používá světové strany (sever, jihovýchod)?',
        'Želva zná jen otočky vůči sobě. Pevné směry kreslí nástroj Plotr.'
      ],
      [
        'Kresba má začínat směrem doprava?',
        'Želva startuje nahoru. Zapněte Menu → Výchozí směr: Východ (90°).'
      ],
      [
        'Potřebujete otočku, kterou řádek variant nemá, třeba 60°?',
        'Složte ji z několika stisků (45° a 15°), nebo ji napište na záložce Podklad jako `P60`.'
      ],
      [
        'Lišta hlásí Neplatné části zápisu?',
        'Na záložce Podklad je kus, kterému nástroj nerozumí, třeba otočka bez úhlu (`P`). Kresba ho přeskočí a pod textem je vypsaný.'
      ]
    ]
  };
</script>

<RefLayout tabs={[{ id: 'directions', label: 'Směry' }]} {help}>
  {#snippet content()}
    <DirectionsRefSection />
  {/snippet}
</RefLayout>
