<div class="reference-content">
  <section class="ref-section">
    <h3 class="ref-heading">Klávesnice telefonu</h3>

    <div class="phone-grid-preview">
      <div class="phone-key-card"><span class="key-num">1</span><span class="key-chars">. , ? !</span></div>
      <div class="phone-key-card"><span class="key-num">2</span><span class="key-chars">A B C</span></div>
      <div class="phone-key-card"><span class="key-num">3</span><span class="key-chars">D E F</span></div>
      <div class="phone-key-card"><span class="key-num">4</span><span class="key-chars">G H I</span></div>
      <div class="phone-key-card"><span class="key-num">5</span><span class="key-chars">J K L</span></div>
      <div class="phone-key-card"><span class="key-num">6</span><span class="key-chars">M N O</span></div>
      <div class="phone-key-card"><span class="key-num">7</span><span class="key-chars">P Q R S</span></div>
      <div class="phone-key-card"><span class="key-num">8</span><span class="key-chars">T U V</span></div>
      <div class="phone-key-card"><span class="key-num">9</span><span class="key-chars">W X Y Z</span></div>
      <div class="phone-key-card"><span class="key-num">*</span><span class="key-chars">* +</span></div>
      <div class="phone-key-card"><span class="key-num">0</span><span class="key-chars">␣ 0</span></div>
      <div class="phone-key-card"><span class="key-num">#</span><span class="key-chars">#</span></div>
    </div>

    <div class="notation-box">
      <div class="notation-item"><strong>Počet stisků:</strong> <code>22</code> = <code>B</code>, <code>7777</code> = <code>S</code>, <code>0</code> = <code>␣</code>, <code>**</code> = <code>+</code></div>
      <div class="notation-item"><strong>Klávesa a pořadí:</strong> <code>(7, 4)</code> = <code>S</code></div>
      <div class="notation-item"><strong>T9:</strong> jeden stisk na písmeno, slovo dohledá slovník. <code>*</code> přepíná kandidáty.</div>
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


  .phone-grid-preview {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 4px;
    background-color: var(--color-surface-1);
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-sm);
    padding: var(--space-sm);
  }

  .phone-key-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    background-color: var(--color-surface-2);
    border-radius: var(--radius-xs);
    padding: var(--space-xs);
  }

  .key-num {
    font-size: var(--text-base);
    font-weight: 800;
    font-family: var(--font-mono);
    color: var(--color-text-primary);
  }

  .key-chars {
    font-size: var(--text-2xs);
    font-family: var(--font-mono);
    color: var(--color-text-secondary);
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
