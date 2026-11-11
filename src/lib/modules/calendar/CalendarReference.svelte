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
        example: {
          title: 'Příklad: Štědrý den 2026',
          steps: [
            {
              action: 'V řádku variant zvolte Kalendář a šipkami u roku nastavte 2026.',
              result: 'Lišta ukazuje „Běžný rok, 365 dní“.'
            },
            {
              action: 'Klepněte na Pro a pak na 24.',
              result: 'Karta nahoře ukáže čtvrtek 24. 12. 2026, Kozoroha a úplněk. Svátek mají Adam, Eva a hvězdička ★ značí státní svátek. Den je 358., Týden 52.'
            },
            {
              action: 'Klepněte na políčko Den.',
              result: 'Číslo 358 se zkopíruje do schránky.'
            },
            {
              action: 'Klepněte na Dnes v liště.',
              result: 'Výběr se vrátí na dnešní den.'
            }
          ]
        },
        controls: [
          ['Šipky u roku (vlevo nahoře)', 'Přepnou na předchozí nebo následující rok, měsíc a den zůstanou.'],
          ['Měsíce Led až Pro', 'Přepnou měsíc. Vybraný den zůstane, v kratším měsíci se posune na poslední.'],
          ['Dny', 'Klepnutím vyberete den. Podtržení značí dnešek a tento měsíc.'],
          ['Dnes (v liště)', 'Vrátí výběr na dnešní den.']
        ]
      }
    },
    {
      id: 'search',
      label: 'Hledat',
      help: {
        howTo: [
          'Číslo bez teček se čte jako datum: dvě číslice jsou den a měsíc (`12` = 1. 2.), tři se zkusí rozdělit oběma způsoby, čtyři jsou den a měsíc po dvou (`2412` = 24. 12.). Jedna až tři číslice jsou zároveň pořadí dne v roce. Písmena hledají začátek jména nebo státního svátku, bez diakritiky.'
        ],
        example: {
          title: 'Příklad: číslo 311 a jméno JAR',
          steps: [
            {
              action: 'V řádku variant zvolte Hledat. Je-li v řádku dotazu starý text, podržte Koš (vlevo dole).',
              result: 'Lišta radí „Datum 133 = 13. 3., jméno, pořadí dne.“'
            },
            {
              action: 'Klepněte na `3`, `1` a `1`.',
              result: 'Výstup ukáže 31. 1. a 3. 11. jako data a 7. 11. se štítkem `311. d.` jako 311. den roku 2026. Lišta ukazuje „Nalezeno 3“.'
            },
            {
              action: 'Klepněte na řádek 3. 11.',
              result: 'Rozbalí se karta dne: úterý 3. 11. 2026, svátek Hubert, Den 307., Týden 45. Stejný den se vybere i v Kalendáři.'
            },
            {
              action: 'Podržte Koš a napište `JAR`.',
              result: 'Seznam ukáže dny se jmény na Jar: Jarmil, Jarmila, Jaromír, Jaroslav a Jaroslava.'
            }
          ]
        },
        controls: [
          ['Klávesnice s čísly', 'Píše dotaz do řádku nad klávesami.'],
          ['Zpět (vpravo dole)', 'Smaže poslední znak.'],
          ['Koš (vlevo dole)', 'Podržením smaže celý dotaz.'],
          ['Klepnutí na řádek', 'Rozbalí kartu dne a vybere ho v Kalendáři. Další klepnutí kartu zavře.']
        ],
        pitfalls: [
          ['Číslo dává víc dnů?', '`311` je 31. 1., 3. 11. i 311. den roku. Projděte všechny výsledky; pořadí dne má štítek, třeba `311. d.`'],
          ['Jméno se nenašlo?', 'Hledá se jen od začátku jména: `JAR` najde Jaroslava, `SLAV` ne. Výsledků je nejvýš 30, dopište další písmena.'],
          [
            'Hledáte Velký pátek nebo Velikonoční pondělí?',
            'Pohyblivé svátky hledání nezná. Projděte v Kalendáři březen a duben: státní svátek poznáte podle hvězdičky ★ v políčku Svátek.'
          ]
        ]
      }
    },
    {
      id: 'calc',
      label: 'Kalkulátor',
      help: {
        howTo: [
          'Posun data přičte ke dni vybranému v Kalendáři zadaný počet dní, nebo ho odečte. Interval spočítá, kolik dní uplyne od OD do DO; je-li DO dřív, výsledek je záporný.'
        ],
        example: {
          title: 'Příklad: 100 dní od Štědrého dne 2026',
          steps: [
            {
              action: 'V Kalendáři vyberte 24. 12. 2026, v řádku variant zvolte Kalkulátor a pod ním Posun data.',
              result: 'Nahoře ve výstupu je čtvrtek 24. prosince 2026. Je-li posun jiný než + 0 dní, vynulujte ho podržením Koše uprostřed kláves.'
            },
            {
              action: 'Klepněte třikrát na `+30`, jednou na `+7` a třikrát na `+1`.',
              result: 'Výstup ukazuje + 100 dní a pod rovnítkem kartu cílového dne: sobota 3. 4. 2027, svátek Richard.'
            },
            {
              action: 'Přepněte na Interval a tlačítky `−` a `+` nastavte OD na 24. 12. 2026 a DO na 3. 4. 2027.',
              result: 'Velké číslo ukazuje +100 dní, stejně jako posun.'
            }
          ]
        },
        controls: [
          ['Posun data | Interval (pod řádkem variant)', 'Přepíná výpočet: den o daný počet dní dál nebo zpět, nebo počet dní mezi dvěma daty.'],
          ['`−30` `−7` `−1` a `+1` `+7` `+30`', 'Posunou cílový den od dne vybraného v Kalendáři. Podržená klávesa krok opakuje.'],
          ['Koš (uprostřed kláves)', 'Podržením vynuluje posun.'],
          ['`−` a `+` u OD a DO', 'Nastaví den, měsíc a rok začátku a konce intervalu. Podržená klávesa krok opakuje.']
        ],
        pitfalls: [
          ['Mají se počítat oba krajní dny?', 'Interval je rozdíl dat: od 1. 1. do 3. 1. jsou 2 dny. Počítáte-li oba krajní dny, přičtěte 1.'],
          ['Den přeskočil z 31. na 1., ale měsíc zůstal?', 'Den, měsíc i rok se nastavují každý zvlášť a dokola. Po přetočení dne upravte i měsíc.'],
          ['Posun začíná od jiného dne?', 'Posun data počítá ode dne vybraného v Kalendáři. Vyberte ho tam, nebo klepněte na řádek v Hledat.']
        ]
      }
    }
  ];

  const help: RefHelpData = {
    purpose: [
      'Kalendář s českými jmeninami, státními svátky, znamením zvěrokruhu a fází Měsíce. Nástroj najde den podle data, jména nebo pořadí v roce a spočítá posun o daný počet dní i počet dní mezi dvěma daty.'
    ],
    howTo: [
      'Šifry s daty stojí nejčastěji na jmeninách, pořadí dne v roce nebo dni v týdnu. Karta nahoře ukazuje pro vybraný den všechno najednou: den v týdnu a datum, znamení, fázi Měsíce, svátek, pořadí dne (Den) a číslo týdne podle ISO (Týden).'
    ],
    controls: [
      ['Řádek variant: Kalendář | Hledat | Kalkulátor', 'Přepíná výběr dne, hledání a výpočty. Den vybraný v Kalendáři platí i pro Hledat a Posun data.'],
      ['Karta dne (nahoře)', 'Klepnutím na datum, znamení, fázi Měsíce, Svátek, Den nebo Týden údaj zkopírujete.']
    ],
    pitfalls: [
      [
        'Pořadí dne nesedí o jeden?',
        'Pořadí dne i Hledat počítají s rokem vybraným v Kalendáři. V přestupném roce je od 1. 3. o 1 vyšší; lišta Kalendáře ukáže, zda je rok přestupný.'
      ],
      ['Šifra čísluje dny v týdnu?', 'Obvykle `Po=1 … Ne=7` jako v tomto kalendáři. V USA bývá `Ne=1 … So=7`, v programech `Ne=0 … So=6`.']
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
    font-size: var(--text-xl);
  }

  .note {
    display: block;
    font-size: var(--text-xs);
    color: var(--color-text-muted);
  }
</style>
