<div class="reference-content" data-allow-copy>
  <h3>Pravidla a ovládání</h3>

  <div class="ref-section">
    <h4>Sudoku</h4>
    <p>
      Cílem je doplnit číslice <strong>1 až 9</strong> do mřížky 9×9 tak, aby se v každém řádku,
      sloupci i 3×3 bloku každá číslice vyskytovala právě jednou.
    </p>
    <ul>
      <li><strong>Zadávání:</strong> Ťuknutím do mřížky vyberte buňku. Zmáčknutí číslice vepíše hodnotu a automaticky skočí na další pole.</li>
      <li><strong>Přeskok pole:</strong> Klávesou <code>▶</code> nebo číslicí <code>0</code> přeskočíte na další pole bez přepisu. Klávesou <code>◀</code> se vrátíte zpět bez smazání.</li>
      <li><strong>Číslice 0:</strong> Slouží pro rychlý přeskok na další buňku (stejná funkce jako šipka <code>▶</code>).</li>
    </ul>
  </div>

  <div class="ref-section">
    <h4>Nonogram (Malovaná křížovka)</h4>
    <p>
      Čísla v záhlaví sloupců a řádků udávají délky souvislých bloků vybarvených (černých) polí.
      Mezi dvěma bloky musí být vždy alespoň jedno prázdné pole.
    </p>
    <ul>
      <li><strong>Zadávání čísel:</strong> Ťuknutím vyberte záhlaví sloupce nebo řádku.</li>
      <li><strong>Více čísel v řádku/sloupci:</strong> Zadejte číslo, stiskněte <code>▶</code> pro potvrzení a zadejte další číslo (např. <code>3 ▶ 1</code>).</li>
      <li><strong>Dvouciferná čísla:</strong> Stiskněte číslice hned po sobě (např. <code>1</code> a pak <code>0</code> = <code>10</code>).</li>
      <li><strong>Skok na další clue:</strong> Dvojitým stisknutím šipky <code>▶</code> (první potvrdí rozepsané číslo, druhé skočí na další řádek či sloupec). Pokud není rozepsané žádné číslo, stačí jediný stisk.</li>
      <li><strong>Prázdný řádek/sloupec:</strong> Zadejte <code>0</code> nebo stiskněte <code>▶</code>.</li>
    </ul>
  </div>

  <div class="ref-section">
    <h4>Gesta a navigace</h4>
    <ul>
      <li><strong>1 prst:</strong> Klepnutím do tabulky vyberete aktivní buňku či legendu.</li>
      <li><strong>2 prsty:</strong> Tažením posouváte plátno, sevřením/roztažením zoomujete (Pinch-to-zoom).</li>
      <li><strong>Reset pohledu:</strong> Vymazáním zadání (podržením koše) nebo vyčištěním modulu v menu [ ☰ ] se vycentruje a resetuje i měřítko plátna.</li>
    </ul>
  </div>
</div>

<style>
  .reference-content {
    display: flex;
    flex-direction: column;
    gap: 16px;
    padding: 8px 4px;
    color: var(--color-text-secondary);
    font-size: 13px;
    line-height: 1.5;
  }

  h3 {
    margin: 0;
    font-size: 16px;
    font-weight: 700;
    color: var(--color-text-primary);
  }

  h4 {
    margin: 0 0 4px 0;
    font-size: 14px;
    font-weight: 700;
    color: var(--color-accent-primary);
  }

  .ref-section {
    background-color: var(--color-surface-1);
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-sm);
    padding: 12px;
  }

  p {
    margin: 0 0 8px 0;
  }

  ul {
    margin: 0;
    padding-left: 20px;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  li {
    color: var(--color-text-secondary);
  }

  strong {
    color: var(--color-text-primary);
  }

  code {
    background-color: var(--color-surface-3);
    padding: 1px 4px;
    border-radius: 3px;
    font-family: var(--font-mono, monospace);
    color: var(--color-accent-primary);
    font-size: 12px;
  }
</style>
