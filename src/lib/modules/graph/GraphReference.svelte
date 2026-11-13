<script lang="ts">
  import RefLayout from '../../components/reference/RefLayout.svelte';
  import RefList from '../../components/reference/RefList.svelte';
  import RefSection from '../../components/reference/RefSection.svelte';
  import type { RefHelpData } from '../../components/reference/refTypes';

  const help: RefHelpData = {
    purpose: [
      'Vizualizace vztahů a vazeb ze šifry (písmena, slova, orientované i neorientované spoje). Z textového Podkladu automaticky složí přehledný graf bez zbytečného křížení a umožní v něm hledat cesty.'
    ],
    controls: [
      ['Záložka Podklad', 'Každý řádek zadává jednu vazbu (`A-B`, `A->B`), řetězec (`A->B->C`) nebo samostatný uzel (`A`). Popisek hrany napište do závorky (`A-(3)->B`) nebo za dvojtečku (`A->B: 3`).'],
      ['Klepnutí na uzel (1. a 2.)', 'První klepnutí zvýrazní uzel a jeho sousedy. Druhé klepnutí na jiný uzel najde a zvýrazní nejkratší cestu mezi nimi. Klepnutím na vybraný uzel nebo do prázdného pozadí výběr zrušíte.'],
      ['Tažení uzlu a Srovnat (v liště)', 'Jednotlivé uzly můžete prstem ručně posunout (připíchnou se žlutou tečkou). Klepnutí na Srovnat v liště ruční posuny uvolní, přepočítá rozložení a vycentruje pohled.'],
      ['Řádek variant: Auto | Vrstvy | Kruh', 'Přepíná strategii automatického rozložení: rovinné/odmotané (`Auto`), hierarchické shora dolů pro šipky (`Vrstvy`) a kruhové (`Kruh`).'],
      ['Spodní ovládání (Oddálit | Celý graf / Zrušit výběr | Přiblížit)', 'Rychlé přiblížení jednou rukou (kromě pinch-to-zoom a dvojklepnutí na plátno). Prostřední tlačítko při aktivním výběru zruší zvýraznění, jinak vycentruje celý graf.'],
      ['Menu → Respektovat směr šipek', 'Při hledání cesty mezi dvěma uzly nejdřív hledá po směru šipek. Pokud orientovaná cesta neexistuje, ukáže neorientovanou spojnici přerušovanou čarou.'],
      ['Menu → Popisky hran', 'Zapíná nebo skrývá štítky s popisky hran (při velkém oddálení se štítky schovávají automaticky).']
    ],
    pitfalls: [
      ['Paralelní nebo smíšené hrany mezi stejnými uzly', 'Zápis `A-B` i `A->B` drží obě spojnice jako samostatné prohnuté oblouky.'],
      ['Dlouhé názvy uzlů', 'Uzly se automaticky rozšíří na pilulky podle délky slova a rozložení drží mezery, aby se popisky nepřekrývaly.']
    ]
  };
</script>

<RefLayout tabs={[{ id: 'syntax', label: 'Zápis' }]} {help}>
  {#snippet content()}
    <RefSection title="Zápis vazeb v Podkladu" note="Jeden řádek = jedna spojnice, řetězec nebo samostatný uzel.">
      <RefList
        items={[
          ['A - B', 'Neorientovaná hrana mezi uzly `A` a `B`.'],
          ['A -> B  nebo  B <- A', 'Orientovaná hrana se šipkou z `A` do `B`.'],
          ['A -(popisek)- B  /  A -(popisek)-> B', 'Hrana s popiskem (např. vzdálenost, písmeno, krok).'],
          ['A - B : popisek  /  A -> B : popisek', 'Rychlejší zápis popisku na konci řádku bez závorek.'],
          ['A -> B -> C -> A', 'Řetězec více vazeb na jednom řádku.'],
          ['A', 'Izolovaný uzel bez napojených hran.']
        ]}
      />
    </RefSection>
  {/snippet}
</RefLayout>
