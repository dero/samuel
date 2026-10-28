<script lang="ts">
  import RefLayout from '../../components/reference/RefLayout.svelte';
  import RefSection from '../../components/reference/RefSection.svelte';
  import type { RefHelpData, RefTab, RefTool } from '../../components/reference/refTypes';
  import { calendarState, type CalendarFlavour } from './calendarState.svelte';
  import { ZODIAC_SIGNS } from './calendarData';

  type CalendarRefTab = 'zodiac' | 'moon' | 'holidays';

  const tabs: RefTab<CalendarRefTab>[] = [
    { id: 'zodiac', label: 'Zvěrokruh' },
    { id: 'moon', label: 'Měsíc' },
    { id: 'holidays', label: 'Svátky' }
  ];

  const MOON_PHASES = [
    { icon: '🌑', name: 'Nov', light: '0 %', shape: 'není vidět' },
    { icon: '🌒', name: 'Dorůstající srpek', light: '1–49 %', shape: 'tvar D – dorůstá' },
    { icon: '🌓', name: 'První čtvrť', light: '50 %', shape: 'pravá půlka' },
    { icon: '🌔', name: 'Dorůstající měsíc', light: '51–99 %', shape: 'vypouklé D' },
    { icon: '🌕', name: 'Úplněk', light: '100 %', shape: 'celý kotouč' },
    { icon: '🌖', name: 'Couvající měsíc', light: '99–51 %', shape: 'vypouklé C' },
    { icon: '🌗', name: 'Poslední čtvrť', light: '50 %', shape: 'levá půlka' },
    { icon: '🌘', name: 'Ubývající srpek', light: '49–1 %', shape: 'tvar C – couvá' }
  ];

  const HOLIDAYS = [
    { date: '1. 1.', name: 'Den obnovy samostatného českého státu', note: 'Nový rok' },
    { date: '–', name: 'Velký pátek', note: 'pohyblivý' },
    { date: '–', name: 'Velikonoční pondělí', note: 'pohyblivý' },
    { date: '1. 5.', name: 'Svátek práce', note: '' },
    { date: '8. 5.', name: 'Den vítězství', note: 'konec války v Evropě' },
    { date: '5. 7.', name: 'Den slovanských věrozvěstů', note: 'Cyril a Metoděj' },
    { date: '6. 7.', name: 'Den upálení mistra Jana Husa', note: '1415' },
    { date: '28. 9.', name: 'Den české státnosti', note: 'sv. Václav, 935' },
    { date: '28. 10.', name: 'Den vzniku samostatného ČSR', note: '1918' },
    { date: '17. 11.', name: 'Den boje za svobodu a demokracii', note: '1939, 1989' },
    { date: '24. 12.', name: 'Štědrý den', note: '' },
    { date: '25. 12.', name: '1. svátek vánoční', note: 'Boží hod' },
    { date: '26. 12.', name: '2. svátek vánoční', note: 'sv. Štěpán' }
  ];

  const tools: RefTool<CalendarFlavour>[] = [
    {
      id: 'calendar',
      label: 'Kalendář',
      help: {
        controls: [['Klepnutí na den', 'ukáže jmeniny, svátek a pořadí dne v roce']]
      }
    },
    {
      id: 'search',
      label: 'Hledat',
      help: {
        controls: [
          ['Datum', '`133` = 13. 3., `2412` = 24. 12.'],
          ['Jméno', '`JAR` = Jaroslav, Jaromír…'],
          ['Pořadí dne', '`123` = 123. den v roce']
        ],
        pitfalls: [
          ['Nejednoznačné číslo', '`311` = 31. 1. i 3. 11., navíc 311. den. Projít všechny výsledky.'],
          ['Jméno', 'hledá se od začátku slova']
        ]
      }
    },
    {
      id: 'calc',
      label: 'Kalkulátor',
      help: {
        controls: [
          ['Posun data', 'datum ± počet dní'],
          ['Interval', 'počet dní mezi OD a DO']
        ],
        pitfalls: [['Interval', 'nepočítá oba krajní dny: 1. 1. → 3. 1. = 2 dny. Včetně obou +1.']]
      }
    }
  ];

  const help: RefHelpData = {
    controls: [['Kalendář / Hledat / Kalkulátor', 'lišta nad klávesnicí']],
    pitfalls: [
      ['Přestupný rok', 'dělitelný 4, ne 100, ale 400 ano. Od 1. 3. je pořadí dne o 1 vyšší.'],
      ['Dny v týdnu', 'ISO `Po=1 … Ne=7`, US `Ne=1 … So=7`, programátorsky `Ne=0 … So=6`']
    ]
  };
</script>

<RefLayout {tabs} {help} {tools} activeTool={calendarState.activeFlavour}>
  {#snippet content(tab)}
    {#if tab === 'zodiac'}
      <RefSection title="Zvěrokruh">
        <div class="ref-table-wrap">
          <table class="ref-table">
            <tbody>
              {#each ZODIAC_SIGNS as sign (sign.id)}
                <tr>
                  <td class="col-num symbol" rowspan="2">{sign.symbol}</td>
                  <td class="col-name">{sign.name}</td>
                  <td class="col-val">{sign.range}</td>
                </tr>
                <tr class="desc-row">
                  <td colspan="2">{sign.latin} · {sign.element.toLowerCase()}</td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      </RefSection>
    {:else if tab === 'moon'}
      <RefSection title="Fáze Měsíce" note="Od novu k novu 29,53 dne. Na severní polokouli.">
        <div class="ref-table-wrap">
          <table class="ref-table">
            <tbody>
              {#each MOON_PHASES as phase (phase.icon)}
                <tr>
                  <td class="col-num symbol" rowspan="2">{phase.icon}</td>
                  <td class="col-name">{phase.name}</td>
                  <td class="col-val">{phase.light}</td>
                </tr>
                <tr class="desc-row">
                  <td colspan="2">{phase.shape}</td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      </RefSection>
    {:else}
      <RefSection title="Státní svátky ČR" note="Data Velikonoc pro daný rok ukáže Kalendář.">
        <div class="ref-table-wrap">
          <table class="ref-table">
            <tbody>
              {#each HOLIDAYS as h (h.name)}
                <tr>
                  <td class="col-val">{h.date}</td>
                  <td>
                    {h.name}
                    {#if h.note}<span class="note">{h.note}</span>{/if}
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      </RefSection>
    {/if}
  {/snippet}
</RefLayout>

<style>
  .symbol {
    font-size: var(--text-lg);
  }

  .note {
    display: block;
    font-size: var(--text-xs);
    color: var(--color-text-muted);
  }
</style>
