<script lang="ts">
  import LetterFrequencyTable from './LetterFrequencyTable.svelte';
  import {
    CZECH_27_UNACCENTED_FREQUENCIES,
    ENGLISH_26_FREQUENCIES,
    IOC_EXPECTED
  } from './frequencyData';

  const VOWELS = ['E', 'A', 'O', 'I', 'U', 'Y'];
  const vowels = VOWELS.map((v) => [v, CZECH_27_UNACCENTED_FREQUENCIES[v]] as const).sort(
    (a, b) => b[1] - a[1]
  );
  const vowelShare = Math.round(vowels.reduce((sum, [, pct]) => sum + pct, 0));
</script>

<div class="ref-wrapper">
  <div class="ref-content" data-allow-copy>
    <section class="ref-section">
      <h4>Index koincidence (IoC)</h4>
      <p>Pravděpodobnost, že dva náhodné znaky textu jsou shodné. Prozradí typ šifry.</p>
      <div class="ioc-table-wrapper">
        <table class="ioc-table font-mono">
          <thead>
            <tr>
              <th>Text</th>
              <th>IoC</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Čeština bez diakritiky</td>
              <td class="highlight-mono">{IOC_EXPECTED.csUnaccented.toFixed(3)}</td>
            </tr>
            <tr>
              <td>Čeština s diakritikou</td>
              <td class="highlight-mono">{IOC_EXPECTED.csDiacritics42.toFixed(3)}</td>
            </tr>
            <tr>
              <td>Angličtina</td>
              <td class="highlight-mono">{IOC_EXPECTED.en.toFixed(3)}</td>
            </tr>
            <tr>
              <td>Substituce, transpozice</td>
              <td class="highlight-mono">jako jazyk</td>
            </tr>
            <tr>
              <td>Polyalfabetická (Vigenère)</td>
              <td class="highlight-poly">0.038–0.045</td>
            </tr>
            <tr>
              <td>Náhodný text (26 znaků)</td>
              <td class="highlight-poly">{IOC_EXPECTED.uniform26}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <section class="ref-section">
      <h4>Samohlásky</h4>
      <p>Tvoří cca <strong>{vowelShare} %</strong> textu a střídají se se souhláskami.</p>
      <div class="vowels-box font-mono">
        {#each vowels as [v, pct] (v)}
          <span class="vowel-pill">{v} {pct.toFixed(1)} %</span>
        {/each}
      </div>
    </section>

    <section class="ref-section">
      <h4>Četnost písmen – čeština</h4>
      <LetterFrequencyTable frequencies={CZECH_27_UNACCENTED_FREQUENCIES} />
    </section>

    <section class="ref-section">
      <h4>Četnost písmen – angličtina</h4>
      <LetterFrequencyTable frequencies={ENGLISH_26_FREQUENCIES} />
    </section>

    <section class="ref-section">
      <h4>Jednopísmenná slova</h4>
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
      <h4>Častá dvoupísmenná slova</h4>
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

  .ioc-table-wrapper {
    overflow-x: auto;
    border-radius: var(--radius-sm);
    border: 1px solid var(--color-border-subtle);
    background-color: var(--color-surface-1);
  }

  .ioc-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 11px;
    text-align: left;
  }

  .ioc-table th {
    background-color: var(--color-surface-2);
    color: var(--color-text-secondary);
    padding: 5px 8px;
    font-size: 10px;
    font-weight: 600;
  }

  .ioc-table td {
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
