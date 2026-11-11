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
        howTo: [
          'Maska popisuje slovo písmeno po písmenu. Tečka `.` zastoupí právě jedno písmeno, hvězdička `*` libovolný počet písmen, i žádné. Bez hvězdičky mají výsledky přesně tolik písmen jako maska.'
        ],
        example: {
          title: 'Příklad: K..KA',
          steps: [
            {
              action: 'V řádku variant zvolte Maska a klepněte na řádek dotazu dole.',
              result: 'Otevře se editor Maska s klávesnicí telefonu a tlačítky `.` (1 znak) a `*` (libovolně).'
            },
            {
              action: 'Napište `K`, dvakrát klepněte na `.`, dopište `KA` a klepněte na Hotovo.',
              result: 'Výstup ukáže pětipísmenná slova od nejčastějších: KOČKA, KAPKA, KULKA, KUPKA, KLIKA… Lišta ukazuje počet výsledků.'
            },
            {
              action: 'Klepněte na KAPKA.',
              result: 'Slovo se zkopíruje do schránky.'
            },
            {
              action: 'Klepněte na řádek dotazu a změňte masku na `K*KA`.',
              result: 'Přibudou slova libovolné délky, například KŘIŽOVATKA, KRITIKA nebo KAMARÁDKA.'
            }
          ]
        },
        controls: [
          ['`.` a `*` (v editoru)', 'Vloží zástupný znak na místo kurzoru: `.` jedno písmeno, `*` libovolně písmen.'],
          ['Menu → Regulární výrazy', 'Dotaz se čte jako regulární výraz JavaScriptu, například `^[k-m].*a$`. Další příklady jsou na záložce Regex.']
        ],
        pitfalls: [
          ['Hledáte víc slov najednou?', 'Maska mezery vypouští. Hledejte každé slovo zvlášť.'],
          [
            'Regulární výraz najde slova, která do masky nepatří?',
            'Regulární výraz hledá kdekoli ve slově a `*` v něm znamená opakování. Celé slovo ohraničte `^` a `$` a místo „cokoli“ pište `.*`, například `^k.*ka$`.'
          ],
          ['Lišta hlásí Neplatný regulární výraz?', 'Ve výrazu je chyba, třeba neuzavřená závorka. Opravte ho, nebo vypněte Menu → Regulární výrazy.']
        ]
      }
    },
    {
      id: 'anagram',
      label: 'Přesmyčka',
      help: {
        howTo: [
          'Písmena se smějí přeházet v libovolném pořadí a každé použít nejvýš tolikrát, kolikrát je zadané. Nahoře jsou slova ze všech písmen, pod nimi kratší slova (aspoň tři písmena) z části písmen, delší a častější dřív.'
        ],
        example: {
          title: 'Příklad: KOTEL',
          steps: [
            {
              action: 'V řádku variant zvolte Přesmyčka. Je-li v řádku dotazu starý text, podržte Koš vedle něj.',
              result: 'Lišta radí „Zadejte písmena k přesmyčce.“'
            },
            {
              action: 'Klepněte na řádek dotazu, napište `KOTEL` a klepněte na Hotovo.',
              result: 'Nahoře jsou slova ze všech pěti písmen: LOKET a KOTEL.'
            },
            {
              action: 'Posuňte výsledky dolů.',
              result: 'Následují kratší slova jako TĚLO, LÉTO a KOTĚ, nakonec trojpísmenná LET, LÉK, TOK. Diakritika se nepočítá, proto i TĚLO.'
            }
          ]
        },
        controls: [
          ['Písmena (v editoru Přesmyčka)', 'Na pořadí nezáleží. Mezery a jiné znaky než písmena se vynechají.']
        ],
        pitfalls: [
          ['Hledáte přesmyčku na víc slov?', 'Nástroj skládá vždy jen jedno slovo. Najděte nejdřív to nejdelší a zbylá písmena zadejte znovu.'],
          ['Regulární výrazy v Přesmyčce nic nemění?', 'Platí jen v Masce. Přesmyčka bere jen písmena.']
        ]
      }
    }
  ];

  const help: RefHelpData = {
    purpose: [
      'Offline slovník češtiny s místopisem a jmény. Nástroj najde slova podle masky s neznámými písmeny, nebo všechna slova, která jdou složit ze zadaných písmen.'
    ],
    howTo: [
      'Dotaz se píše do editoru a hledá se po jeho zavření. Častější slova a šifrovací hesla jsou ve výsledcích výš.'
    ],
    controls: [
      ['Řádek variant: Maska | Přesmyčka', 'Přepíná způsob hledání. Dotaz zůstane, v Masce se z něj vypustí mezery.'],
      ['Řádek dotazu (dole)', 'Klepnutím, stejně jako tužkou vpravo, otevřete editor s klávesnicí telefonu. Hotovo ho zavře a spustí hledání.'],
      ['Koš (v řádku dotazu)', 'Podržením smaže dotaz. Je vidět, jen když je co mazat.'],
      ['Klepnutí na slovo', 'Zkopíruje slovo do schránky. Štítek vlastní značí jméno nebo místo, číslo vpravo je délka.'],
      ['Menu → Pouze podstatná jména', 'Zapnuto (výchozí): jen podstatná jména v základním tvaru. Vypnuto: i slovesa, přídavná jména a tvary slov.'],
      ['Menu → Zahrnout vlastní jména', 'Přidá jména a příjmení, například Karel nebo Novák. Výchozí je vypnuto.'],
      ['Menu → Zahrnout místopis', 'Přidá obce, části obcí a ulice z RÚIAN. Výchozí je zapnuto.'],
      ['Menu → Ignorovat diakritiku', 'Zapnuto (výchozí): `KOCKA` najde i KOČKA. Vypnuto: písmena s diakritikou musí sedět přesně.']
    ],
    pitfalls: [
      ['Výstup hlásí Slovník není stažen?', 'Klepněte na Stáhnout slovník přímo ve výstupu. Stahuje se jednou, pak hledání funguje i bez signálu.'],
      ['Slovo v jiném tvaru (KOČKY) se nenašlo?', 'Vypněte Menu → Pouze podstatná jména. Slovník pak obsahuje i tvary, slovesa a přídavná jména.'],
      ['Nenašlo se jméno nebo příjmení?', 'Zapněte Menu → Zahrnout vlastní jména.'],
      ['Lišta ukazuje 1000+ výsledků?', 'Zobrazí se jen prvních 1000 slov. Zpřesněte dotaz.']
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
            ['`KOTELNA`', 'KOTELNA, KONATEL, kratší: KLENOT, ETANOL, LOKET…']
          ]}
        />
      </RefSection>

      <RefSection title="Řazení">
        <RefList items={['Nejdřív delší slova, pak častější. Šifrovací hesla mají přednost.']} />
      </RefSection>
    {:else}
      <RefSection title="Regulární výrazy" note="Jen pro Masku, po zapnutí Menu → Regulární výrazy. Syntaxe JavaScriptu.">
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
