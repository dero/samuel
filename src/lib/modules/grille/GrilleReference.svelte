<script lang="ts">
  import RefLayout from '../../components/reference/RefLayout.svelte';
  import RefSection from '../../components/reference/RefSection.svelte';
  import type { RefHelpData } from '../../components/reference/refTypes';

  const SIZES = [
    { size: '4 × 4', cells: 16, holes: 4, note: '' },
    { size: '5 × 5', cells: 25, holes: 6, note: 'střed nelze vyříznout' },
    { size: '6 × 6', cells: 36, holes: 9, note: 'nejčastější' },
    { size: '8 × 8', cells: 64, holes: 16, note: '' },
    { size: '10 × 10', cells: 100, holes: 25, note: '' }
  ];

  const help: RefHelpData = {
    purpose: [
      'Otočná (Fleissnerova) mřížka je čtverec s otvory: položí se na tabulku písmen a čte se, co je vidět v otvorech, ve čtyřech polohách po 90°. Nástroj tabulku ukáže, vy označíte otvory a výstup přečte všechny čtyři polohy.'
    ],
    howTo: [
      'Každé pole má tři další, na která se otáčením dostane; otvorem smí být jen jedno z této čtveřice. Mřížka 4 × 4 má proto 4 otvory, 6 × 6 jich má 9. V každé poloze se otvory čtou po řádcích, zleva doprava a shora dolů.'
    ],
    example: {
      title: 'Příklad: mřížka 4 × 4',
      steps: [
        {
          action: 'Na záložce Podklad napište `POKAKLDJYNVEIJES` a přejděte na záložku Interakce.',
          result:
            'Znaky vyplní mřížku 4 × 4 po řádcích: `POKA`, `KLDJ`, `YNVE`, `IJES`. Lišta radí: Klepnutím do mřížky označte otvory.'
        },
        {
          action: 'Klepněte na levé horní pole s `P`.',
          result:
            'Pole dostane kroužek `◎` a zbylé tři rohy se zamknou tečkou. Výstup ukazuje `PASI`, každé písmeno v barvě jedné polohy, a lišta Otvory 1 z 4.'
        },
        {
          action: 'Klepněte na `O` a `K` v horním řádku a na `L` ve druhém řádku.',
          result: 'Lišta hlásí Otvory 4 z 4 a výstup čte `POKLADJEVJESKYNI`: poklad je v jeskyni.'
        }
      ]
    },
    controls: [
      [
        'Mřížka',
        'Klepnutím pole označíte jako otvor `◎`, dalším klepnutím otvor zrušíte. Zbylá tři pole jeho čtveřice se zamknou tečkou.'
      ],
      [
        'Barvy (ve výstupu a v mřížce)',
        'Odlišují polohy mřížky: růžová je první, pak zelená, žlutá a fialová. Tečka zamčeného pole má barvu polohy, ve které se pole odkryje.'
      ],
      ['Vymazat otvory (pod mřížkou)', 'Podržením zruší všechny otvory.'],
      [
        'Záložka Podklad',
        'Tabulka po řádcích. Bez čárek je každý znak jedna buňka a mezery se nepočítají; čárky oddělují víceznakové buňky (`JDE, TEN, ARO` nebo `12, 5, 28`). Velikost mřížky se řídí počtem buněk.'
      ],
      [
        'Menu → Číst v pořadí klepnutí',
        'Otvory se nečtou po řádcích, ale v pořadí, v jakém jste je označili. Každý otvor ukáže své číslo.'
      ],
      ['Menu → Otáčet proti směru ↺', 'Mřížka se otáčí proti směru hodinových ručiček.'],
      ['Menu → Šifrovat', 'Obrácený postup: text z Podkladu se vepíše do otvorů a výstup je hotová tabulka po řádcích.'],
      ['Menu → Reset nástroje', 'Podržením smaže tabulku i otvory a vrátí volby v Menu.']
    ],
    pitfalls: [
      [
        'Pole nejde označit?',
        'Je zamčené tečkou, jeho čtveřice už otvor má. Chcete-li otvor jinde ve čtveřici, nejdřív ten stávající klepnutím zrušte. Střed liché mřížky `✦` otvorem být nemůže.'
      ],
      [
        'Barevné úseky dávají smysl, ale jsou v jiném pořadí?',
        'Mřížka se v zadání otáčela opačně: zapněte Menu → Otáčet proti směru ↺. Nebo začínala v jiné poloze, pak čtěte úseky od jiné barvy.'
      ],
      [
        'Na záložce Podklad svítí tečka?',
        'Počet buněk nevyplní čtverec, editor napíše třeba `15 buněk, mřížka 4×4 má 16`. Najděte chybějící nebo přebývající znak, jinak se další znaky v mřížce posunou.'
      ],
      [
        'Výstup nedává smysl ani po otočení?',
        'Zadání může určovat pořadí otvorů. Zapněte Menu → Číst v pořadí klepnutí a otvory označte v tomto pořadí.'
      ]
    ]
  };
</script>

<RefLayout tabs={[{ id: 'sizes', label: 'Otvory' }]} {help}>
  {#snippet content()}
    <RefSection
      title="Otočná mřížka"
      note="Fleissnerova mřížka, transpozice. Maska `N × N` se otáčí po 90° (4 polohy)."
    />

    <RefSection title="Počet otvorů" note="Otvorů = polí / 4 (zaokrouhleno dolů).">
      <div class="ref-table-wrap">
        <table class="ref-table">
          <thead>
            <tr>
              <th class="col-val">Rozměr</th>
              <th class="col-val">Polí</th>
              <th class="col-val">Otvorů</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {#each SIZES as row (row.size)}
              <tr>
                <td class="col-val">{row.size}</td>
                <td class="col-val">{row.cells}</td>
                <td class="col-val holes">{row.holes}</td>
                <td class="is-muted">{row.note}</td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    </RefSection>

    <RefSection title="Čtveřice polí" note="Pole, která se otáčením kryjí:">
      <code class="formula">(r, c) → (c, N−1−r) → (N−1−r, N−1−c) → (N−1−c, r)</code>
    </RefSection>
  {/snippet}
</RefLayout>

<style>
  .holes {
    font-weight: 700;
    color: var(--color-accent-primary);
  }

  .formula {
    display: block;
    padding: var(--space-sm);
    font-size: var(--text-xs);
    line-height: 1.6;
    white-space: normal;
  }
</style>
