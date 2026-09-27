<div class="reference-content">
  <section class="ref-section">
    <h3 class="ref-heading">Otočná mřížka</h3>
    <p class="ref-text">
      Fleissnerova mřížka, transpozice. Maska s otvory nad tabulkou <code>N × N</code> se otáčí po 90° (4 polohy) a v otvorech se postupně odkrývá text.
    </p>
  </section>

  <section class="ref-section">
    <h3 class="ref-heading">Počet otvorů</h3>
    <p class="ref-text">
      Pole tvoří čtveřice, které se otáčením kryjí:
    </p>
    <div class="code-box">
      <code>(r, c) → (c, N-1-r) → (N-1-r, N-1-c) → (N-1-c, r)</code>
    </div>
    <p class="ref-text">
      Z každé čtveřice smí být otvorem právě <strong>jedno</strong> pole. Aplikace zbylá tři po klepnutí zamkne.
    </p>
    <div class="table-wrapper">
      <table class="ref-table">
        <thead>
          <tr>
            <th>Rozměr</th>
            <th>Polí</th>
            <th>Otvorů</th>
            <th>Pozn.</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>4 × 4</strong></td>
            <td>16</td>
            <td><strong>4</strong></td>
            <td></td>
          </tr>
          <tr>
            <td><strong>5 × 5</strong></td>
            <td>25</td>
            <td><strong>6</strong></td>
            <td>střed nelze vyříznout</td>
          </tr>
          <tr>
            <td><strong>6 × 6</strong></td>
            <td>36</td>
            <td><strong>9</strong></td>
            <td>nejčastější</td>
          </tr>
          <tr>
            <td><strong>8 × 8</strong></td>
            <td>64</td>
            <td><strong>16</strong></td>
            <td></td>
          </tr>
          <tr>
            <td><strong>10 × 10</strong></td>
            <td>100</td>
            <td><strong>25</strong></td>
            <td></td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>

  <section class="ref-section">
    <h3 class="ref-heading">Vstup</h3>
    <div class="notation-box">
      <div class="notation-item">
        <strong>Bez čárek:</strong> znak = buňka, např. <code>POKLADNASVERU</code>. Mřížka se zvolí nejmenší možná.
      </div>
      <div class="notation-item">
        <strong>S čárkami:</strong> čárka odděluje buňky, např. <code>JDE, TEN, ARO</code> nebo <code>12, 5, 28</code>.
      </div>
    </div>
  </section>

  <section class="ref-section">
    <h3 class="ref-heading">Záludnosti</h3>
    <div class="notation-box">
      <div class="notation-item">
        <strong>Směr otáčení:</strong> obvykle po směru hodinových ručiček. Opačný směr lze zapnout v menu.
      </div>
      <div class="notation-item">
        <strong>Pořadí čtení:</strong> obvykle po řádcích. Číst v pořadí klepání lze zapnout v menu.
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
