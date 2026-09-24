<script lang="ts">
</script>

<div class="ref-wrapper">
  <div class="ref-content" data-allow-copy>
    <section class="ref-section">
      <h3>Frekvenční analýza</h3>
      <p>
        Základní metoda pro odhalení povahy šifry z rozložení četností znaků
        a statistických vlastností přirozeného jazyka.
      </p>
    </section>

    <section class="ref-section">
      <h4>Index koincidence (IoC)</h4>
      <p>
        Pravděpodobnost, že dva náhodně vybrané znaky v textu jsou shodné.
        Rychlé vodítko pro určení typu šifrovacího systému:
      </p>
      <div class="ioc-table-wrapper">
        <table class="ioc-table font-mono">
          <thead>
            <tr>
              <th>Typ textu / Jazyk</th>
              <th>Typický IoC</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Čeština bez diakritiky</td>
              <td class="highlight-mono">~ 0.058 – 0.062 (≈ 0.060)</td>
            </tr>
            <tr>
              <td>Čeština s diakritikou (42 znaků)</td>
              <td class="highlight-mono">~ 0.046 – 0.050 (≈ 0.048)</td>
            </tr>
            <tr>
              <td>Monoalfabetická substituce</td>
              <td class="highlight-mono">Shodný s jazykem (~0.060 / ~0.048)</td>
            </tr>
            <tr>
              <td>Transpozice (přesmyčka, mřížka)</td>
              <td class="highlight-mono">Shodný s jazykem (~0.060 / ~0.048)</td>
            </tr>
            <tr>
              <td>Polyalfabetická (Vigenère, delší heslo)</td>
              <td class="highlight-poly">~ 0.038 – 0.045</td>
            </tr>
            <tr>
              <td>Uniformní náhodný šum (26 znaků)</td>
              <td class="highlight-poly">1 / 26 ≈ 0.0385</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <section class="ref-section">
      <h4>Samohlásky vs. Souhlásky</h4>
      <p>
        V běžném českém textu tvoří samohlásky přibližně <strong>42 %</strong> a souhlásky <strong>58 %</strong>.
        Téměř v každém slově se střídají samohlásky se souhláskami.
      </p>
      <div class="vowels-box font-mono">
        <span class="vowel-pill">E (9.5 %)</span>
        <span class="vowel-pill">A (9.3 %)</span>
        <span class="vowel-pill">O (8.9 %)</span>
        <span class="vowel-pill">I (7.9 %)</span>
        <span class="vowel-pill">U (4.1 %)</span>
        <span class="vowel-pill">Y (2.6 %)</span>
      </div>
    </section>

    <section class="ref-section">
      <h4>Četnost písmen v češtině (ČNK)</h4>
      <div class="freq-table-wrapper">
        <table class="freq-table font-mono">
          <thead>
            <tr>
              <th>Znak</th><th>Četnost</th><th>Znak</th><th>Četnost</th>
            </tr>
          </thead>
          <tbody>
            <tr><td>E</td><td>9.5 %</td><td>P</td><td>2.8 %</td></tr>
            <tr><td>A</td><td>9.3 %</td><td>C</td><td>2.7 %</td></tr>
            <tr><td>O</td><td>8.9 %</td><td>D</td><td>2.7 %</td></tr>
            <tr><td>I</td><td>7.9 %</td><td>Y</td><td>2.6 %</td></tr>
            <tr><td>N</td><td>6.9 %</td><td>Z</td><td>2.1 %</td></tr>
            <tr><td>R</td><td>5.8 %</td><td>H</td><td>1.6 %</td></tr>
            <tr><td>T</td><td>5.0 %</td><td>B</td><td>1.6 %</td></tr>
            <tr><td>S</td><td>5.0 %</td><td>J</td><td>1.3 %</td></tr>
            <tr><td>L</td><td>4.7 %</td><td>CH</td><td>1.2 %</td></tr>
            <tr><td>V</td><td>4.5 %</td><td>G</td><td>1.0 %</td></tr>
            <tr><td>U</td><td>4.1 %</td><td>F</td><td>0.7 %</td></tr>
            <tr><td>K</td><td>3.9 %</td><td>W</td><td>0.3 %</td></tr>
            <tr><td>M</td><td>3.8 %</td><td>X, Q</td><td>0.2 %</td></tr>
          </tbody>
        </table>
      </div>
    </section>

    <section class="ref-section">
      <h4>Jednopísmenná slova v češtině</h4>
      <p>Pokud jsou v textu zachovány mezery, samostatně stojící písmena jsou téměř vždy:</p>
      <div class="pill-list font-mono">
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
    font-size: 12px;
    line-height: 1.4;
    color: var(--color-text-secondary);
    margin: 0 0 8px 0;
  }

  .ioc-table-wrapper,
  .freq-table-wrapper {
    overflow-x: auto;
    border-radius: var(--radius-sm);
    border: 1px solid var(--color-border-subtle);
    background-color: var(--color-surface-1);
  }

  .ioc-table,
  .freq-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 11px;
    text-align: left;
  }

  .ioc-table th,
  .freq-table th {
    background-color: var(--color-surface-2);
    color: var(--color-text-secondary);
    padding: 5px 8px;
    font-size: 10px;
    font-weight: 600;
  }

  .ioc-table td,
  .freq-table td {
    padding: 4px 8px;
    border-top: 1px solid var(--color-border-subtle);
  }

  .highlight-mono {
    color: #10b981;
    font-weight: 700;
  }

  .highlight-poly {
    color: #60a5fa;
    font-weight: 700;
  }

  .vowels-box {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  .vowel-pill {
    font-size: 11px;
    padding: 3px 8px;
    background-color: var(--color-surface-2);
    border: 1px solid var(--color-border-subtle);
    border-radius: 4px;
    color: var(--color-accent-primary);
    font-weight: 600;
  }

  .pill-list {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  .pill {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    background-color: var(--color-surface-2);
    border: 1px solid var(--color-border-subtle);
    border-radius: 4px;
    font-weight: 700;
    color: var(--color-accent-primary);
  }

  .words-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(44px, 1fr));
    gap: 6px;
  }

  .word-tag {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 4px;
    background-color: var(--color-surface-2);
    border: 1px solid var(--color-border-subtle);
    border-radius: 4px;
    font-size: 12px;
    font-weight: 600;
    color: var(--color-text-primary);
  }
</style>
