<script lang="ts">
  import RefLayout from '../../components/reference/RefLayout.svelte';
  import type { RefHelpData } from '../../components/reference/refTypes';

  const help: RefHelpData = {
    purpose: [
      'Nástroj přehledově spočítá znaky podle zvolené abecedy, podíl samohlásek a souhlásek, opakované bigramy a trigramy, zdvojená písmena i délky slov a vět.'
    ],
    howTo: [
      'Zvolte v Menu abecedu podle toho, s jakou šifrou pracujete. Všechen rozbor běží živě v přehledových buňkách nahoře, bez porovnávání s tabulkami jazyka.'
    ],
    example: {
      title: 'Příklad: přehled krátkého textu',
      steps: [
        {
          action:
            'Na záložce Podklad napište `POKLAD JE ZAKOPAN. POD VELKYM DUBEM!` nebo text vložte přes Ze schránky.',
          result: 'Lišta ukáže „29 zn. · 15/26 · 6 sl.“.'
        },
        {
          action: 'Nahoře projděte sekce přehledu.',
          result:
            'Mřížka ukáže počty všech 26 písmen (chybějící mají 0), poměr samohlásek a souhlásek, délky slov (2, 3, 5, 6 a 7 zn.) a v sekci Věty rozpad V1 (3 slova · 15 zn.) a V2 (3 slova · 14 zn.).'
        }
      ]
    },
    controls: [
      [
        'Záložka Podklad',
        'Text k rozboru. Ze schránky vloží text do prázdného editoru, starý smažte podržením Smazat.'
      ],
      [
        'Řádek variant: Četnost ▾ | Abecedně',
        'Seřadí buňky se znaky abecedy od nejčastějšího, nebo podle abecedy.'
      ],
      [
        'Menu → Abeceda',
        'Určuje tokenizaci: např. Anglická (26) sloučí diakritiku a počítá C a H zvlášť, Anglická + CH (27) bere CH jako jeden znak, Česká (42) rozlišuje diakritiku.'
      ],
      [
        'Menu → Přes hranice slov',
        'Zapnuté počítá zdvojená písmena, bigramy a trigramy i přes mezery (hodí se např. u textu rozděleného do pětipísmenných skupin).'
      ],
      ['Menu → Reset nástroje', 'Podržením smaže text a vrátí volby v Menu do výchozího stavu.']
    ],
    pitfalls: [
      [
        'Písmena s háčky nebo CH se počítají jinak, než potřebujete?',
        'Změňte abecedu v Menu → Abeceda. CH jako samostatný znak mají abecedy + CH (27) a Česká (42).'
      ],
      [
        'V textu jsou číslice nebo značky a nejsou v hlavní mřížce?',
        'Znaky mimo zvolenou abecedu se vypíšou v oddělené sekci Mimo abecedu. Pro písmena i číslice dohromady zvolte v Menu abecedu Alfanumerická (36).'
      ],
      [
        'Lišta hlásí Žádné znaky ze zvolené abecedy?',
        'Vstup obsahuje jen znaky mimo zvolenou abecedu (např. číslice při anglické abecedě). Podívejte se do sekce Mimo abecedu, nebo přepněte abecedu.'
      ]
    ]
  };
</script>

<RefLayout {help} />
