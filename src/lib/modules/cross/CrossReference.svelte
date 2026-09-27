<div class="reference-content">
  <section class="ref-section">
    <h3 class="ref-heading">Velký polský kříž (3×3×3)</h3>
    <p class="ref-text">
      Tvar = ohraničení chlívku, počet teček (1–3) = pozice písmene v chlívku. Např. <code>•</code> A, <code>••</code> B, <code>•••</code> C.
    </p>
    <div class="shape-preview-grid">
      <div class="shape-item"><span class="shape-icon">┘</span> <span>1,1</span></div>
      <div class="shape-item"><span class="shape-icon">┴</span> <span>1,2</span></div>
      <div class="shape-item"><span class="shape-icon">└</span> <span>1,3</span></div>
      <div class="shape-item"><span class="shape-icon">┤</span> <span>2,1</span></div>
      <div class="shape-item"><span class="shape-icon">┼</span> <span>2,2</span></div>
      <div class="shape-item"><span class="shape-icon">├</span> <span>2,3</span></div>
      <div class="shape-item"><span class="shape-icon">┐</span> <span>3,1</span></div>
      <div class="shape-item"><span class="shape-icon">┬</span> <span>3,2</span></div>
      <div class="shape-item"><span class="shape-icon">┌</span> <span>3,3</span></div>
    </div>
    <div class="notation-box">
      <div class="notation-item note-item">Abeceda bez CH: poslední pozice (3,3 •••) je mezera <code>␣</code>.</div>
    </div>
  </section>

  <section class="ref-section">
    <h3 class="ref-heading">Pigpen (malý polský kříž)</h3>
    <div class="notation-box">
      <div class="notation-item"><strong>Mřížka 3×3:</strong> <code>A–I</code>, s tečkou <code>J–R</code></div>
      <div class="notation-item"><strong>Kříž X:</strong> <code>S</code> nahoře, <code>T</code> vlevo, <code>U</code> vpravo, <code>V</code> dole</div>
      <div class="notation-item"><strong>Kříž X s tečkou:</strong> <code>W</code> nahoře, <code>X</code> vlevo, <code>Y</code> vpravo, <code>Z</code> dole</div>
      <div class="notation-item note-item">Jen 26 znaků – CH se píše jako C + H.</div>
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

  .ref-text code,
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
