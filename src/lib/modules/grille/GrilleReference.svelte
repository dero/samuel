<div class="reference-content">
  <!-- Section 1: Princip Cardanovy / Fleissnerovy mřížky -->
  <section class="ref-section">
    <h3 class="ref-heading">1. Princip rotační mřížky</h3>
    <p class="ref-text">
      Rotační (Fleissnerova nebo Cardanova) mřížka je transpoziční šifra. Základem je čtvercová tabulka o rozměru <code>N × N</code> a krycí maska s vyříznutými otvory.
    </p>
    <p class="ref-text">
      Postupným otáčením masky o 90° (obvykle 4 kroky po směru hodinových ručiček: 0°, 90°, 180°, 270°) se v otvorech postupně odkrývají písmena tajenky.
    </p>
  </section>

  <!-- Section 2: Matematický princip orbit -->
  <section class="ref-section">
    <h3 class="ref-heading">2. Matematické orbity a počet otvorů</h3>
    <p class="ref-text">
      Každé pole mřížky patří do právě jedné 4členné skupiny pozic (orbity), které se při otočení o 90° cyklicky překrývají:
    </p>
    <div class="code-box">
      <code>(r, c) → (c, N-1-r) → (N-1-r, N-1-c) → (N-1-c, r)</code>
    </div>
    <p class="ref-text">
      Aby byla mřížka platná a žádné pole se neodkrylo dvakrát, smí z každé 4členné orbity patřit do masky právě <strong>1 otvor</strong>. V aplikaci se při zvolení otvoru zbývající 3 pozice automaticky uzamknou.
    </p>
    <div class="table-wrapper">
      <table class="ref-table">
        <thead>
          <tr>
            <th>Rozměr</th>
            <th>Celkem polí</th>
            <th>Počet otvorů</th>
            <th>Poznámka</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>4 × 4</strong></td>
            <td>16</td>
            <td><strong>4</strong></td>
            <td>Rychlé menší šifry</td>
          </tr>
          <tr>
            <td><strong>5 × 5</strong></td>
            <td>25</td>
            <td><strong>6</strong></td>
            <td>1 pevný střed (nelze vyříznout)</td>
          </tr>
          <tr>
            <td><strong>6 × 6</strong></td>
            <td>36</td>
            <td><strong>9</strong></td>
            <td>Nejčastější formát na šifrovačkách</td>
          </tr>
          <tr>
            <td><strong>8 × 8</strong></td>
            <td>64</td>
            <td><strong>16</strong></td>
            <td>Delší tajenky</td>
          </tr>
          <tr>
            <td><strong>10 × 10</strong></td>
            <td>100</td>
            <td><strong>25</strong></td>
            <td>Velké mřížky</td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>

  <!-- Section 3: Formát vstupu a čárky -->
  <section class="ref-section">
    <h3 class="ref-heading">3. Formát vstupních dat</h3>
    <div class="notation-box">
      <div class="notation-item">
        <strong>Bez čárek:</strong> Každý neprázdný znak tvoří 1 buňku (např. <code>POKLADNASVERU</code>). Velikost mřížky se automaticky přizpůsobí nejmenšímu čtverci.
      </div>
      <div class="notation-item">
        <strong>S čárkami:</strong> Čárka odděluje jednotlivé tokeny do buněk (např. <code>JDE, TEN, ARO, ZCE, STI</code> nebo čísla <code>12, 5, 28, 4</code>).
      </div>
    </div>
  </section>

  <!-- Section 4: Časté terénní chytáky -->
  <section class="ref-section">
    <h3 class="ref-heading">4. Časté terénní záludnosti</h3>
    <div class="notation-box">
      <div class="notation-item">
        <strong>Směr otáčení (CW vs. CCW):</strong> Většina šifer se otáčí po směru hodinových ručiček (CW). Pro opačný směr zapněte v Menu <em>Otáčení proti směru</em>.
      </div>
      <div class="notation-item">
        <strong>Pořadí čtení:</strong> Standardně se v každé rotaci čtou otvory po řádcích (shora dolů, zleva doprava). Pokud zadání šifry vyžaduje číst v pořadí klepání, aktivujte <em>Pořadí klepání = pořadí čtení</em>.
      </div>
    </div>
  </section>
</div>

<style>
  .reference-content {
    display: flex;
    flex-direction: column;
    gap: var(--space-xl);
    padding: var(--space-md);
    color: var(--color-text-primary);
  }

  .ref-section {
    display: flex;
    flex-direction: column;
    gap: var(--space-sm);
  }

  .ref-heading {
    font-size: var(--text-base);
    font-weight: 700;
    color: var(--color-accent-primary, #00d2ff);
    margin: 0;
    border-bottom: 1px solid var(--color-border-subtle);
    padding-bottom: var(--space-xs);
  }

  .ref-text {
    font-size: var(--text-sm);
    color: var(--color-text-secondary);
    line-height: 1.5;
    margin: 0;
  }

  .ref-text code,
  .notation-item code {
    background-color: var(--color-surface-2);
    padding: 2px 6px;
    border-radius: var(--radius-xs);
    font-family: var(--font-mono);
    font-size: 0.9em;
    color: var(--color-text-primary);
    border: 1px solid var(--color-border-subtle);
  }

  .code-box {
    background-color: var(--color-surface-2);
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-sm);
    padding: var(--space-sm) var(--space-md);
    font-family: var(--font-mono);
    font-size: var(--text-xs);
    color: var(--color-accent-primary, #00d2ff);
    overflow-x: auto;
  }

  .table-wrapper {
    overflow-x: auto;
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-sm);
  }

  .ref-table {
    width: 100%;
    border-collapse: collapse;
    font-size: var(--text-xs);
    text-align: left;
  }

  .ref-table th,
  .ref-table td {
    padding: 6px 10px;
    border-bottom: 1px solid var(--color-border-subtle);
  }

  .ref-table th {
    background-color: var(--color-surface-2);
    color: var(--color-text-secondary);
    font-weight: 700;
  }

  .ref-table tr:last-child td {
    border-bottom: none;
  }

  .notation-box {
    display: flex;
    flex-direction: column;
    gap: var(--space-xs);
  }

  .notation-item {
    font-size: var(--text-xs);
    color: var(--color-text-secondary);
    line-height: 1.45;
    background-color: var(--color-surface-1);
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-sm);
    padding: var(--space-sm);
  }

  .notation-item strong {
    color: var(--color-text-primary);
  }
</style>
