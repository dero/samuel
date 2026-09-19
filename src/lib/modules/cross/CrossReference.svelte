<div class="reference-content">
  <!-- Section 1: Velký polský kříž -->
  <section class="ref-section">
    <h3 class="ref-heading">1. Velký polský kříž (3×3×3)</h3>
    <p class="ref-text">
      Jedna mřížka 3×3 obsahuje v každém chlívku až 3 znaky. Tvar znaku odpovídá ohraničení daného chlívku a počet teček určuje pozici písmene v chlívku:
    </p>
    <div class="notation-box">
      <div class="notation-item"><strong>1. pozice:</strong> 1 tečka <code>•</code> (např. <code>A</code>, <code>D</code>, <code>G</code>)</div>
      <div class="notation-item"><strong>2. pozice:</strong> 2 tečky <code>••</code> (např. <code>B</code>, <code>E</code>, <code>H</code>)</div>
      <div class="notation-item"><strong>3. pozice:</strong> 3 tečky <code>•••</code> (např. <code>C</code>, <code>F</code>, <code>CH/I</code>)</div>
      <div class="notation-item note-item"><strong>U 26 znaků (bez CH):</strong> 27. pozice (chlívek 3,3 •••) slouží jako Mezera (<code>␣</code>).</div>
    </div>
    <div class="shape-preview-grid">
      <div class="shape-item"><span class="shape-icon">┘</span> <span>Pole (1,1)</span></div>
      <div class="shape-item"><span class="shape-icon">┴</span> <span>Pole (1,2)</span></div>
      <div class="shape-item"><span class="shape-icon">└</span> <span>Pole (1,3)</span></div>
      <div class="shape-item"><span class="shape-icon">┤</span> <span>Pole (2,1)</span></div>
      <div class="shape-item"><span class="shape-icon">┼</span> <span>Střed (2,2)</span></div>
      <div class="shape-item"><span class="shape-icon">├</span> <span>Pole (2,3)</span></div>
      <div class="shape-item"><span class="shape-icon">┐</span> <span>Pole (3,1)</span></div>
      <div class="shape-item"><span class="shape-icon">┬</span> <span>Pole (3,2)</span></div>
      <div class="shape-item"><span class="shape-icon">┌</span> <span>Pole (3,3)</span></div>
    </div>
  </section>

  <!-- Section 2: Pigpen (aka Malý polský kříž) -->
  <section class="ref-section">
    <h3 class="ref-heading">2. Pigpen (aka Malý polský kříž)</h3>
    <p class="ref-text">
      Kombinace čtvercových mřížek 3×3 a šikmých křížů 2×2 (X). Každý tvar se vyskytuje ve variantě bez tečky a s tečkou (celkem 26 znaků A–Z):
    </p>
    <div class="notation-box">
      <div class="notation-item"><strong>1. Mřížka 3×3 bez tečky:</strong> Znaky <code>A–I</code> (chlívek ohraničený linkami mřížky)</div>
      <div class="notation-item"><strong>2. Mřížka 3×3 s tečkou (•):</strong> Znaky <code>J–R</code> (stejný chlívek s tečkou uvnitř)</div>
      <div class="notation-item"><strong>3. Šikmý kříž X bez tečky:</strong> Znaky <code>S–V</code> (nahoře <code>S</code>, vlevo <code>T</code>, vpravo <code>U</code>, dole <code>V</code>)</div>
      <div class="notation-item"><strong>4. Šikmý kříž X s tečkou (•):</strong> Znaky <code>W–Z</code> (nahoře <code>W</code>, vlevo <code>X</code>, vpravo <code>Y</code>, dole <code>Z</code>)</div>
      <div class="notation-item note-item"><strong>Poznámka k CH:</strong> Šifra má přesně 26 pozic pro písmena A–Z. Spřežka <code>CH</code> se zapisuje jako <code>C</code> + <code>H</code>.</div>
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
    color: var(--color-accent-primary);
    margin: 0;
  }

  .ref-text {
    font-size: var(--text-sm);
    color: var(--color-text-secondary);
    line-height: 1.5;
    margin: 0;
  }

  .notation-box {
    display: flex;
    flex-direction: column;
    gap: var(--space-xs);
    background-color: var(--color-surface-1);
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-sm);
    padding: var(--space-sm) var(--space-md);
    font-size: var(--text-xs);
  }

  .notation-item code {
    background-color: var(--color-surface-2);
    padding: 1px 4px;
    border-radius: var(--radius-xs);
    color: var(--color-accent-primary);
    font-family: var(--font-mono);
  }

  .note-item {
    color: var(--color-accent-warning);
    margin-top: 2px;
  }

  .shape-preview-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 4px;
    background-color: var(--color-surface-1);
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-sm);
    padding: var(--space-sm);
  }

  .shape-item {
    display: flex;
    align-items: center;
    gap: var(--space-xs);
    font-size: var(--text-2xs);
    color: var(--color-text-secondary);
  }

  .shape-icon {
    font-size: var(--text-base);
    font-family: var(--font-mono);
    color: var(--color-text-primary);
    font-weight: 700;
  }
</style>
