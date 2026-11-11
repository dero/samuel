<script lang="ts">
  import RefLayout from '../../components/reference/RefLayout.svelte';
  import type { RefHelpData, RefTab } from '../../components/reference/refTypes';
  import LanguageStats from '../frequency/LanguageStats.svelte';

  type SubstitutionRefTab = 'words' | 'freq';

  const tabs: RefTab<SubstitutionRefTab>[] = [
    { id: 'words', label: 'Slova' },
    { id: 'freq', label: 'Četnost' }
  ];

  const help: RefHelpData = {
    purpose: [
      'Jednoduchá záměna nahrazuje každé písmeno vždy stejným jiným písmenem nebo značkou. Nástroj s ní pomáhá ručně: znakům šifry přiřazujete písmena a výstup hned ukazuje, co z textu vzniká.'
    ],
    howTo: [
      'Začněte krátkými slovy a nejčastějšími znaky, každé přiřazení pak napoví další. Ve výstupu jsou vyřešená písmena velká a nevyřešené znaky malé.'
    ],
    example: {
      title: 'Příklad: QJX N WTFWN',
      steps: [
        {
          action: 'Na záložce Podklad napište `QJX N WTFWN`.',
          result: 'Po zavření klávesnice ukazuje výstup šifru malými písmeny, nic ještě není přiřazené. Lišta radí: Vyberte znak v pásu, pak písmeno.'
        },
        {
          action: 'Jednopísmenné slovo bývá A. Na záložce Interakce klepněte v pásu na `N` a pak na klávesu `A`.',
          result: 'Výstup ukazuje `qjx A wtfwA`, lišta Přiřazeno 1 z 7 a pod klávesou `A` je drobné `N`.'
        },
        {
          action: 'Stejně přiřaďte znaku `W` písmeno `K`, znaku `T` písmeno `O` a znaku `F` písmeno `C`.',
          result: 'Výstup ukazuje `qjx A KOCKA`.'
        },
        {
          action: 'Přiřaďte znaku `Q` písmeno `P`, znaku `J` písmeno `E` a znaku `X` písmeno `S`.',
          result: 'Výstup ukazuje PES A KOCKA a lišta Přiřazeno 7 z 7.'
        }
      ]
    },
    controls: [
      [
        'Pás znaků (nad klávesnicí)',
        'Znaky šifry: nahoře znak, dole přiřazené písmeno. Klepnutím znak vyberete, dalším klepnutím výběr zrušíte. Pás se posouvá do stran.'
      ],
      ['Klávesnice', 'Přiřadí vybranému znaku písmeno. Drobný údaj pod písmenem říká, který znak šifry ho už má.'],
      ['`✕` (poslední klávesa)', 'Zruší přiřazení vybraného znaku.'],
      ['Koš (na začátku pásu)', 'Podržením zruší všechna přiřazení. Šifra zůstane.'],
      [
        'Záložka Podklad',
        'Šifrový text. Ze schránky ho vloží do prázdného editoru, Smazat ho podržením vymaže. Po úpravě zůstanou přiřazení znaků, které v textu pořád jsou.'
      ],
      ['Menu → Abeceda', 'Obvykle anglická (26), nebo s CH jako samostatným písmenem (27).'],
      ['Menu → Povolit nepoužitá písmena', 'Přiřazovat jde i znaky, které v šifře nejsou. Hodí se k doplnění celého klíče.'],
      ['Menu → Povolit homofony', 'Jedno písmeno smí mít víc znaků šifry.'],
      ['Menu → Reset nástroje', 'Podržením smaže šifru i přiřazení a vrátí volby v Menu.']
    ],
    pitfalls: [
      [
        'Klávesa s písmenem nejde stisknout?',
        'Nejdřív vyberte znak v pásu. Když vybraný je, písmeno už má jiný znak (drobný údaj pod ním): zrušte to přiřazení klávesou `✕`, nebo zapněte Menu → Povolit homofony.'
      ],
      [
        'Nevíte, kde začít?',
        'Jednopísmenná slova bývají `A`, `V`, `S`, `Z`, `I`, `O`, `K`, `U`, nejčastější písmena jsou `E`, `A`, `O`, `I`, `N`. Víc najdete v záložkách Slova a Četnost.'
      ],
      [
        'Lišta hlásí Text neobsahuje písmena abecedy?',
        'Šifra je ze značek nebo číslic. Číslice zvládne Menu → Abeceda → Alfanumerická (36), značky v Podkladu nahraďte písmeny, každou jiným.'
      ]
    ]
  };
</script>

<RefLayout {tabs} {help}>
  {#snippet content(tab)}
    <LanguageStats view={tab} />
  {/snippet}
</RefLayout>
