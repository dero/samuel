<script lang="ts">
  import { ZODIAC_SIGNS } from './calendarData';
</script>

<div class="reference-content">
  <section class="ref-section">
    <h3 class="ref-heading">Zvěrokruh</h3>
    <div class="table-wrapper">
      <table class="ref-table">
        <thead>
          <tr>
            <th>Znak</th>
            <th>Česky</th>
            <th>Latinsky</th>
            <th>Data</th>
            <th>Živel</th>
          </tr>
        </thead>
        <tbody>
          {#each ZODIAC_SIGNS as sign}
            <tr>
              <td class="symbol-col"><strong>{sign.symbol}</strong></td>
              <td><strong>{sign.name}</strong></td>
              <td class="latin-col"><code>{sign.latin}</code></td>
              <td>{sign.range}</td>
              <td>
                <span class="element-badge element-{sign.element.toLowerCase()}">{sign.element}</span>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  </section>

  <section class="ref-section">
    <h3 class="ref-heading">Fáze Měsíce</h3>
    <p class="ref-text">Od novu k novu <strong>29,53 dne</strong>.</p>
    <div class="table-wrapper">
      <table class="ref-table">
        <thead>
          <tr>
            <th>Fáze</th>
            <th>Název</th>
            <th>Osvětlení</th>
            <th>Tvar</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td class="symbol-col">🌑</td>
            <td><strong>Nov</strong></td>
            <td>0 %</td>
            <td>není vidět</td>
          </tr>
          <tr>
            <td class="symbol-col">🌒</td>
            <td><strong>Dorůstající srpek</strong></td>
            <td>1–49 %</td>
            <td><strong>D</strong> – dorůstá</td>
          </tr>
          <tr>
            <td class="symbol-col">🌓</td>
            <td><strong>První čtvrť</strong></td>
            <td>50 %</td>
            <td>pravá půlka</td>
          </tr>
          <tr>
            <td class="symbol-col">🌔</td>
            <td><strong>Dorůstající měsíc</strong></td>
            <td>51–99 %</td>
            <td>vypouklé D</td>
          </tr>
          <tr>
            <td class="symbol-col">🌕</td>
            <td><strong>Úplněk</strong></td>
            <td>100 %</td>
            <td>celý kotouč</td>
          </tr>
          <tr>
            <td class="symbol-col">🌖</td>
            <td><strong>Couvající měsíc</strong></td>
            <td>99–51 %</td>
            <td>vypouklé C</td>
          </tr>
          <tr>
            <td class="symbol-col">🌗</td>
            <td><strong>Poslední čtvrť</strong></td>
            <td>50 %</td>
            <td>levá půlka</td>
          </tr>
          <tr>
            <td class="symbol-col">🌘</td>
            <td><strong>Ubývající srpek</strong></td>
            <td>49–1 %</td>
            <td><strong>C</strong> – couvá</td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>

  <section class="ref-section">
    <h3 class="ref-heading">Státní svátky ČR</h3>
    <div class="table-wrapper">
      <table class="ref-table">
        <thead>
          <tr>
            <th>Datum</th>
            <th>Svátek</th>
            <th>Pozn.</th>
          </tr>
        </thead>
        <tbody>
          <tr><td><strong>1. 1.</strong></td><td>Den obnovy samostatného českého státu</td><td>Nový rok</td></tr>
          <tr><td><strong>pohyblivý</strong></td><td>Velký pátek</td><td></td></tr>
          <tr><td><strong>pohyblivý</strong></td><td>Velikonoční pondělí</td><td></td></tr>
          <tr><td><strong>1. 5.</strong></td><td>Svátek práce</td><td></td></tr>
          <tr><td><strong>8. 5.</strong></td><td>Den vítězství</td><td>konec války v Evropě</td></tr>
          <tr><td><strong>5. 7.</strong></td><td>Den slovanských věrozvěstů</td><td>Cyril a Metoděj</td></tr>
          <tr><td><strong>6. 7.</strong></td><td>Den upálení mistra Jana Husa</td><td>1415</td></tr>
          <tr><td><strong>28. 9.</strong></td><td>Den české státnosti</td><td>sv. Václav, 935</td></tr>
          <tr><td><strong>28. 10.</strong></td><td>Den vzniku samostatného ČSR</td><td>1918</td></tr>
          <tr><td><strong>17. 11.</strong></td><td>Den boje za svobodu a demokracii</td><td>1939, 1989</td></tr>
          <tr><td><strong>24. 12.</strong></td><td>Štědrý den</td><td></td></tr>
          <tr><td><strong>25. 12.</strong></td><td>1. svátek vánoční</td><td>Boží hod</td></tr>
          <tr><td><strong>26. 12.</strong></td><td>2. svátek vánoční</td><td>sv. Štěpán</td></tr>
        </tbody>
      </table>
    </div>
  </section>

  <section class="ref-section">
    <h3 class="ref-heading">Záludnosti</h3>
    <div class="notation-box">
      <div class="notation-item">
        <strong>Přestupný rok:</strong> dělitelný 4, ne 100, ale 400 ano. Od 1. 3. je pořadí dne o <strong>1</strong> vyšší.
      </div>
      <div class="notation-item">
        <strong>Dny v týdnu:</strong> ISO <code>Po=1 … Ne=7</code>, US <code>Ne=1 … So=7</code>, programátorsky <code>Ne=0 … So=6</code>.
      </div>
      <div class="notation-item">
        <strong>Dvě jména v jednom dni:</strong> např. 24. 12. Adam a Eva, 30. 1. Robin a Erna.
      </div>
    </div>
  </section>
</div>

<style>
  .reference-content {
    display: flex;
    flex-direction: column;
    gap: var(--space-md, 16px);
    color: var(--color-text-primary, #ffffff);
    font-size: var(--text-sm, 14px);
    line-height: 1.5;
  }

  .ref-section {
    display: flex;
    flex-direction: column;
    gap: var(--space-xs, 6px);
  }

  .ref-heading {
    font-size: var(--text-base, 16px);
    font-weight: 700;
    color: var(--color-accent-primary, #00d2ff);
    margin: 0;
  }

  .ref-text {
    margin: 0;
    color: var(--color-text-secondary, #9e9e9e);
  }

  .table-wrapper {
    overflow-x: auto;
    border-radius: var(--radius-sm, 6px);
    border: 1px solid var(--color-border-subtle, #2a2a2a);
    background-color: var(--color-surface-1, #121212);
  }

  .ref-table {
    width: 100%;
    border-collapse: collapse;
    font-size: var(--text-xs, 12px);
    text-align: left;
  }

  .ref-table th,
  .ref-table td {
    padding: 6px 10px;
    border-bottom: 1px solid var(--color-border-subtle, #2a2a2a);
  }

  .ref-table th {
    background-color: var(--color-surface-2, #1c1c1c);
    color: var(--color-text-secondary, #9e9e9e);
    font-weight: 600;
  }

  .ref-table tr:last-child td {
    border-bottom: none;
  }

  .symbol-col {
    font-size: 16px;
    text-align: center;
    width: 36px;
  }

  .latin-col code {
    font-family: var(--font-mono, monospace);
    font-size: 11px;
    background: var(--color-surface-2, #1c1c1c);
    padding: 2px 4px;
    border-radius: 3px;
  }

  .element-badge {
    display: inline-block;
    padding: 1px 6px;
    border-radius: var(--radius-xs, 4px);
    font-size: 10px;
    font-weight: 600;
    text-transform: uppercase;
  }

  .element-oheň {
    background: rgba(239, 68, 68, 0.2);
    color: #ef4444;
  }

  .element-země {
    background: rgba(234, 179, 8, 0.2);
    color: #eab308;
  }

  .element-vzduch {
    background: rgba(56, 189, 248, 0.2);
    color: #38bdf8;
  }

  .element-voda {
    background: rgba(59, 130, 246, 0.2);
    color: #3b82f6;
  }

  .notation-box {
    display: flex;
    flex-direction: column;
    gap: 8px;
    background-color: var(--color-surface-1, #121212);
    border: 1px solid var(--color-border-subtle, #2a2a2a);
    border-radius: var(--radius-sm, 6px);
    padding: 10px;
  }

  .notation-item {
    font-size: var(--text-xs, 12px);
    color: var(--color-text-secondary, #9e9e9e);
  }

  .notation-item strong {
    color: var(--color-text-primary, #ffffff);
  }

  .notation-item code {
    font-family: var(--font-mono, monospace);
    color: var(--color-accent-primary, #00d2ff);
  }
</style>
