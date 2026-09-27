<script lang="ts">
  import LetterFrequencyTable from '../frequency/LetterFrequencyTable.svelte';
  import {
    CZECH_27_UNACCENTED_FREQUENCIES,
    ENGLISH_26_FREQUENCIES
  } from '../frequency/frequencyData';
</script>

<div class="ref-wrapper">
  <div class="ref-content" data-allow-copy>
    <section class="ref-section">
      <h4>Jednopísmenná slova</h4>
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
        <span class="word-tag">UZ</span>
        <span class="word-tag">AZ</span>
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
      <h4>Častá zdvojená písmena</h4>
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


  .ref-section h4 {
    font-size: 13px;
    font-weight: 700;
    color: var(--color-text-primary);
    margin: 0 0 6px 0;
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
</style>
