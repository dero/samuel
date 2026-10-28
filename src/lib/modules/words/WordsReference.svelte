<script lang="ts">
  import RefLayout from '../../components/reference/RefLayout.svelte';
  import RefList from '../../components/reference/RefList.svelte';
  import RefSection from '../../components/reference/RefSection.svelte';
  import type { RefHelpData, RefTab, RefTool } from '../../components/reference/refTypes';
  import type { WordsMode } from './wordsData';

  type WordsRefTab = 'mask' | 'anagram' | 'regex';

  const tabs: RefTab<WordsRefTab>[] = [
    { id: 'mask', label: 'Maska' },
    { id: 'anagram', label: 'Přesmyčky' },
    { id: 'regex', label: 'Regex' }
  ];

  interface Props {
    /** Search mode currently active in the module (opens its help). */
    activeTool: WordsMode;
  }

  let { activeTool }: Props = $props();

  const tools: RefTool<WordsMode>[] = [
    {
      id: 'mask',
      label: 'Maska',
      help: {
        controls: [
          ['`.` a `*`', 'jedno písmeno, libovolně písmen'],
          ['Regulární výrazy', 'v menu, místo `.` a `*` platí syntaxe JavaScriptu']
        ],
        pitfalls: [['Víc slov', 'maska maže mezery, hledat po slovech']]
      }
    },
    {
      id: 'anagram',
      label: 'Přesmyčka',
      help: {
        controls: [
          ['Písmena', 'v libovolném pořadí, najde i kratší slova'],
          ['Řazení', 'delší slova, pak častější']
        ],
        pitfalls: [['Regulární výrazy', 'v přesmyčkách neplatí']]
      }
    }
  ];

  const help: RefHelpData = {
    controls: [
      ['Maska / Přesmyčka', 'lišta nad zadáním'],
      ['Dotaz', 'řádek dole otevře editor'],
      ['Klepnutí na výsledek', 'zkopíruje slovo'],
      ['Co hledat', 'v menu: podstatná jména, vlastní jména, místopis']
    ],
    pitfalls: [
      ['Bez slovníku', 'nic nenajde → stáhnout slovník v Nastavení'],
      ['Tvary slov', 'výchozí jsou jen podstatná jména v základním tvaru → menu Pouze podstatná jména'],
      ['Jména', 'Karel, Novák se nenajdou → menu Zahrnout vlastní jména'],
      ['Diakritika', 'ignoruje se: `k..ka` najde KOČKA. Vypnout v menu.']
    ]
  };
</script>

<RefLayout {tabs} {help} {tools} {activeTool}>
  {#snippet content(tab)}
    {#if tab === 'mask'}
      <RefSection title="Zástupné znaky">
        <RefList
          items={[
            ['`.`', 'právě jedno písmeno'],
            ['`*`', 'libovolný počet písmen, i žádné']
          ]}
        />
      </RefSection>

      <RefSection title="Příklady">
        <RefList
          items={[
            ['`K..KA`', 'KOČKA, KAPKA, KLIKA'],
            ['`P..ÍZE`', 'PENÍZE'],
            ['`POD*`', 'PODZEMÍ, PODCHOD, PODPIS'],
            ['`P*KA`', 'POHÁDKA, POLÉVKA'],
            ['`*LES`', 'PRALES']
          ]}
        />
      </RefSection>
    {:else if tab === 'anagram'}
      <RefSection title="Přesmyčky" note="Slova ze zadaných písmen v libovolném pořadí.">
        <RefList
          items={[
            ['`KOTEL`', 'KOTEL, LOKET'],
            ['`KOTELNA`', 'KOTELNA, KONATEL, kratší: KLENOT, ETANOL, LENKA…']
          ]}
        />
      </RefSection>

      <RefSection title="Řazení">
        <RefList items={['Nejdřív delší slova, pak častější. Šifrovací hesla mají přednost.']} />
      </RefSection>
    {:else}
      <RefSection title="Regulární výrazy" note="Jen pro masku, po zapnutí v menu. Syntaxe JavaScriptu.">
        <RefList
          items={[
            ['`^[k-m].*a$`', 'začíná K–M, končí A: KOČKA, MAPA'],
            ['`(ik|ek)$`', 'končí -ík/-ek: LESÍK, DOMEK'],
            ['`[aeiouyáéíóúůýě]{3}`', '3 samohlásky za sebou: SOUOSTROVÍ'],
            ['`^[^aeiouyáéíóúůýě]+$`', 'bez samohlásek: SMRK, PRST, VLK'],
            ['`^.a.a.a$`', 'BALADA, KANADA']
          ]}
        />
      </RefSection>
    {/if}
  {/snippet}
</RefLayout>
