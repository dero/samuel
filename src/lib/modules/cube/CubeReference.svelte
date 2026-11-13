<script lang="ts">
  import RefLayout from '../../components/reference/RefLayout.svelte';
  import RefList from '../../components/reference/RefList.svelte';
  import RefSection from '../../components/reference/RefSection.svelte';
  import type { RefHelpData, RefTool } from '../../components/reference/refTypes';
  import type { CubeVariant } from './cubeData';

  interface Props {
    activeTool: CubeVariant;
  }

  let { activeTool }: Props = $props();

  const tools: RefTool<CubeVariant>[] = [
    {
      id: 'grid27',
      label: '3×3×3 (27)',
      help: {
        howTo: [
          'Tři vrstvy po 3×3 buňkách (27 pozic). Při výchozí 26písmenné abecedě A–Z zůstává vnitřní střed krychle prázdný (v Podkladu jako ,,). Osy hloubky, řádku a sloupce vždy odpovídají aktuálnímu natočení krychle.'
        ],
        example: {
          title: 'Příklad: hledání v přední horní řadě',
          steps: [
            {
              action: 'Klepněte dole na 1 Přední a 1 Horní.',
              result: 'Zbytek krychle pohasne a svítí jen horní řada přední vrstvy (A, B, C).'
            },
            {
              action: 'Pokud je v zadání krychle zleva, klepněte na → pro otočení.',
              result: 'Krychle se otočí o 90° a filtry i názvy vrstev se přizpůsobí novému pohledu.'
            }
          ]
        },
        controls: [
          ['Osy (3×3 pod otáčením)', 'Vrstva (Přední/Střední/Zadní), Řádek (Horní/Střední/Dolní) a Sloupec (Levý/Střední/Pravý). Klepnutí zvýrazní rovinu nebo průnik, druhé klepnutí filtr vypne.']
        ],
        pitfalls: [
          ['V zadání jde abeceda po patrech shora dolů místo po předních řezech?', 'Zapněte Menu → Po patrech shora dolů, nebo si krychli prostě otočte tlačítkem ↓.']
        ]
      }
    },
    {
      id: 'shell26',
      label: '8+12+6 (26)',
      help: {
        howTo: [
          'Plášť krychle bez vnitřního středu: 6 středů stěn (čtverečky), 12 středů hran (menší kroužky na obvodových hranách) a 8 vrcholů (rohové uzly). Celkem 26 pozic pro abecedu A–Z.'
        ],
        example: {
          title: 'Příklad: vlastní rozmístění podle zadání',
          steps: [
            {
              action: 'Klepněte v liště na ikonu tužky (nebo dvakrát klepněte přímo na uzel v krychli).',
              result: 'Uzly krychle se roztřesou a dole se objeví celý zásobník abecedy.'
            },
            {
              action: 'Přetáhněte písmeno, nebo klepnutím vyberte uzel či písmeno a dalším klepnutím je prohoďte nebo dosadíte.',
              result: 'Krychle si pamatuje nové rozložení i při otáčení; opětovným klepnutím na tužku úpravy ukončíte.'
            }
          ]
        },
        controls: [
          ['Typ prvku (Stěny | Hrany | Vrcholy)', 'Zvýrazní jen stěny (6), hrany (12) nebo vrcholy (8).'],
          ['Směry (Přední–Pravá)', 'Klepnutím na směr (např. Horní + Pravá) rozsvítíte jen prvky na dané straně nebo hraně.']
        ],
        pitfalls: [
          ['Písmena leží v jiném pořadí?', 'V Menu → Pořadí plnění přepněte výchozí pořadí (případně podržte Obnovit výchozí rozmístění), nebo rozložení upravte přes ikonu tužky v liště.']
        ]
      }
    }
  ];

  const help: RefHelpData = {
    purpose: [
      'Prostorová pomůcka pro šifry pracující s krychlí. Slouží jako interaktivní model, který si nastavíte podle zadání, otáčíte jím podle potřeby a čtete z něj písmena nebo druhé příznaky.'
    ],
    controls: [
      ['Řádek variant: 3×3×3 (27) | 8+12+6 (26)', 'Přepíná mezi plnou krychlí 27 polí a pláštěm z 8 vrcholů, 12 hran a 6 stěn. Každá varianta si drží vlastní obsah i natočení.'],
      ['Otáčení (← ↑ ↓ → ↺ ↻) a reset', 'Otočí pohled krychle o 90° kolem všech tří os (včetně otočení čelní stěny ↺/↻); poslední klávesa vrátí výchozí natočení. Obsah políček zůstává na svém místě.'],
      ['Přepínač 3D / 2D (v liště)', 'Rychle přepíná mezi drátěným 3D modelem a třemi plochými vrstvami 3×3.'],
      ['Tužka (v liště) / dvojité klepnutí', 'Zapne či vypne editační režim (dvojité klepnutí na uzel do něj vstoupí rovnou s vybraným uzlem). V úpravách: klepnutím uzel nebo písmeno vyberete (druhým klepnutím odznačíte), dalším klepnutím prohodíte nebo dosadíte, tažením přesunete a podržením uzlu otevřete ruční úpravu znaku i 2. příznaku.'],
      ['Záložka Podklad', 'Textový zápis všech políček oddělených čárkou (včetně výchozí abecedy). Druhý příznak napište za lomítko (`A/K`), prázdné pole jako dvě čárky za sebou (`A,,B`).'],
      ['Menu → Abeceda', 'Výběr výchozí abecedy, pokud nepoužíváte vlastní rozmístění v Podkladu.'],
      ['Menu → Obnovit výchozí rozmístění', 'Podržením zahodí ruční úpravy a krychli znovu naplní zvolenou abecedou podle aktuálního pořadí plnění.']
    ]
  };
</script>

<RefLayout tabs={[{ id: 'overview', label: 'Rozměry' }]} {help} {tools} {activeTool}>
  {#snippet content()}
    <RefSection title="Dvě geometrie krychle">
      <RefList
        items={[
          ['3×3×3 (27 polí)', '3 vrstvy × 3 řádky × 3 sloupce. Výchozí abeceda A–Z (26) nechává střed prázdný; u 27+ znakové abecedy zaplní všechna pole.'],
          ['8+12+6 (26 prvků)', '6 středů stěn (čtverečky), 12 hran (kroužky na hranách), 8 vrcholů (rohy). Střed krychle je prázdný.']
        ]}
      />
    </RefSection>

    <RefSection title="Druhý příznak (volitelný)" note="Každý uzel může kromě písmene nést krátký štítek (např. K/N/P).">
      <RefList
        items={[
          ['V úpravách (Upravit)', 'Klepnutím na libovolný uzel otevřete úpravu znaku i jeho 2. příznaku.'],
          ['V záložce Podklad', 'Zápis `ZNAK/PŘÍZNAK`, např. `A/K, B/N, C/P`. Zápis `/K` ponechá písmeno z abecedy a přidá příznak `K`.']
        ]}
      />
    </RefSection>
  {/snippet}
</RefLayout>
