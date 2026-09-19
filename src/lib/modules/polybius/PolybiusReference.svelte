<div class="reference-content">
  <section class="ref-section">
    <h3 class="ref-heading">Polybiův čtverec (souřadnicová matice)</h3>
    <p class="ref-text">
      Znak je kódován dvojicí čísel či písmen odpovídající souřadnicím <strong>(Řádek, Sloupec)</strong> v matici.
    </p>

    <div class="notation-box">
      <div class="notation-item"><strong>Varianta 5×5 (25 polí):</strong> Běžně pro anglickou abecedu (26 znaků). Jedno písmeno bývá vynecháno nebo sloučeno (obvykle <code>Q</code>, případně <code>I/J</code>).</div>
      <div class="notation-item"><strong>Varianta 6×6 (36 polí):</strong> Obsahuje kompletní abecedu A–Z plus číslice 0–9.</div>
      <div class="notation-item"><strong>Příklad zápisu:</strong> <code>12</code> = Řádek 1, Sloupec 2 (<code>B</code>); <code>CE</code> = Řádek C, Sloupec E.</div>
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
</style>
