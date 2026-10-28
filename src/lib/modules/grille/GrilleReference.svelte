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
    controls: [
      ['Tabulka', 'řádek pod mřížkou otevře editor textu'],
      ['Bez čárek', 'znak = buňka: `POKLADNASVERU`, mřížka se zvolí nejmenší možná'],
      ['S čárkami', 'čárka odděluje buňky: `JDE, TEN, ARO` nebo `12, 5, 28`'],
      ['Otvory', 'klepnutí do mřížky. Zbylá 3 pole čtveřice se zamknou.'],
      ['Výstup', 'barvy odlišují 4 polohy mřížky'],
      ['Šifrovat', 'v menu: text se vepíše do otvorů, výsledkem je tabulka']
    ],
    pitfalls: [
      ['Směr otáčení', 'obvykle po směru hodin → menu Otáčet proti směru'],
      ['Pořadí čtení', 'obvykle po řádcích → menu Číst v pořadí klepnutí'],
      ['Nesedí počet otvorů', 'z každé čtveřice smí být otvorem jen jedno pole']
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
