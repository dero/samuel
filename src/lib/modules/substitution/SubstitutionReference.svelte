<script lang="ts">
</script>

<div class="ref-wrapper">
  <div class="ref-content" data-allow-copy>
    <section class="ref-section">
      <h3>Jednoduchá (monoalfabetická) substituce</h3>
      <p>
        Šifra, kde je každé písmeno abecedy jednoznačně nahrazeno jiným symbolem či písmenem.
        Zachovává se frekvenční profil jazyka a délky slov.
      </p>
    </section>

    <section class="ref-section">
      <h4>Jednopísmenná slova v češtině</h4>
      <p>Pokud jsou v šifře oddělena slova, samostatně stojící písmena jsou téměř jistě:</p>
      <div class="letters-pill-list font-mono">
        <span class="pill">A</span>
        <span class="pill">I</span>
        <span class="pill">O</span>
        <span class="pill">U</span>
        <span class="pill">K</span>
        <span class="pill">S</span>
        <span class="pill">V</span>
        <span class="pill">Z</span>
      </div>
    </section>

    <section class="ref-section">
      <h4>Nejčastější dvoupísmenná slova</h4>
      <div class="words-grid font-mono">
        <span class="word-tag">DO</span>
        <span class="word-tag">NA</span>
        <span class="word-tag">VE</span>
        <span class="word-tag">SE</span>
        <span class="word-tag">KE</span>
        <span class="word-tag">OD</span>
        <span class="word-tag">PO</span>
        <span class="word-tag">ZA</span>
        <span class="word-tag">ZE</span>
        <span class="word-tag">TO</span>
        <span class="word-tag">JE</span>
        <span class="word-tag">NE</span>
        <span class="word-tag">UZ</span>
        <span class="word-tag">AZ</span>
      </div>
    </section>

    <section class="ref-section">
      <h4>Četnosti písmen v češtině</h4>
      <div class="freq-table-wrapper">
        <table class="freq-table font-mono">
          <thead>
            <tr>
              <th>Znak</th>
              <th>Četnost</th>
              <th>Znak</th>
              <th>Četnost</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>E</td><td>10.5 %</td>
              <td>I</td><td>7.3 %</td>
            </tr>
            <tr>
              <td>A</td><td>8.4 %</td>
              <td>N</td><td>6.5 %</td>
            </tr>
            <tr>
              <td>O</td><td>8.1 %</td>
              <td>T</td><td>5.7 %</td>
            </tr>
            <tr>
              <td>R</td><td>4.8 %</td>
              <td>S</td><td>4.5 %</td>
            </tr>
            <tr>
              <td>U</td><td>3.9 %</td>
              <td>L</td><td>3.8 %</td>
            </tr>
            <tr>
              <td>K</td><td>3.7 %</td>
              <td>D</td><td>3.6 %</td>
            </tr>
            <tr>
              <td>M</td><td>3.2 %</td>
              <td>P</td><td>3.1 %</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <section class="ref-section">
      <h4>Zdvojená písmena v češtině</h4>
      <p>
        Dvě stejná písmena za sebou (např. <code>XX</code>) bývají nejčastěji:
      </p>
      <div class="letters-pill-list font-mono">
        <span class="pill">NN</span>
        <span class="pill">DD</span>
        <span class="pill">JJ</span>
        <span class="pill">ZZ</span>
        <span class="pill">SS</span>
      </div>
    </section>
  </div>
</div>

<style>
  .ref-wrapper {
    display: flex;
    flex-direction: column;
    height: 100%;
    color: var(--color-text-primary);
  }

  .ref-content {
    flex: 1;
    overflow-y: auto;
    padding: 12px 14px 24px;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .ref-section h3 {
    font-size: 15px;
    font-weight: 700;
    color: var(--color-accent-primary);
    margin: 0 0 6px 0;
  }

  .ref-section h4 {
    font-size: 13px;
    font-weight: 700;
    color: var(--color-text-primary);
    margin: 0 0 6px 0;
  }

  .ref-section p {
    font-size: 13px;
    line-height: 1.45;
    color: var(--color-text-secondary);
    margin: 0;
  }

  .letters-pill-list {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-top: 8px;
  }

  .pill {
    padding: 3px 8px;
    background-color: var(--color-surface-2);
    border-radius: var(--radius-xs);
    font-size: 13px;
    font-weight: 700;
    color: var(--color-text-primary);
    border: 1px solid var(--color-border-subtle);
  }

  .words-grid {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 4px;
    margin-top: 8px;
  }

  .word-tag {
    background-color: var(--color-surface-2);
    border-radius: 3px;
    padding: 4px 0;
    font-size: 12px;
    font-weight: 700;
    text-align: center;
    color: var(--color-accent-primary);
    border: 1px solid var(--color-border-subtle);
  }

  .freq-table-wrapper {
    margin-top: 8px;
    background-color: var(--color-surface-1);
    border-radius: var(--radius-sm);
    border: 1px solid var(--color-border-subtle);
    overflow: hidden;
  }

  .freq-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 12px;
  }

  .freq-table th {
    background-color: var(--color-surface-2);
    color: var(--color-text-secondary);
    padding: 4px 8px;
    text-align: left;
    font-size: 11px;
    font-weight: 600;
  }

  .freq-table td {
    padding: 3px 8px;
    border-top: 1px solid var(--color-border-subtle);
    color: var(--color-text-primary);
  }

  .freq-table td:nth-child(2),
  .freq-table td:nth-child(4) {
    color: var(--color-text-secondary);
  }
</style>
