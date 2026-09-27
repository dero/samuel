<div class="reference-content">
  <section class="ref-section">
    <h3 class="ref-heading">Polybiův čtverec</h3>
    <p class="ref-text">
      Znak = souřadnice <strong>řádek, sloupec</strong>. Např. <code>12</code> = B, u písmenných os <code>CE</code> = řádek C, sloupec E.
    </p>

    <div class="notation-box">
      <div class="notation-item"><strong>5×5:</strong> 25 polí, jedno písmeno chybí (obvykle <code>Q</code>) nebo se slučuje <code>I/J</code>.</div>
      <div class="notation-item"><strong>6×6:</strong> A–Z a číslice 0–9.</div>
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
</style>
