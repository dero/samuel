<script lang="ts">
  import SegmentedControl, { type SegmentOption } from '../../components/ui/SegmentedControl.svelte';

  type WordsRefTab = 'mask' | 'anagram' | 'regex';

  let activeTab = $state<WordsRefTab>('mask');

  const tabs: SegmentOption<WordsRefTab>[] = [
    { id: 'mask', label: 'Maska' },
    { id: 'anagram', label: 'Přesmyčky' },
    { id: 'regex', label: 'Regex' }
  ];
</script>

<div class="reference-container">
  <!-- Canonical Sub-Toolbar with SegmentedControl -->
  <div class="subtoolbar-container">
    <SegmentedControl
      options={tabs}
      value={activeTab}
      size="sm"
      onChange={(val) => {
        activeTab = val;
      }}
      ariaLabel="Režim nápovědy slovníku"
    />
  </div>

  <div class="reference-scroll-content" data-allow-copy>
    {#if activeTab === 'mask'}
      <section class="ref-section">
        <div class="examples-table">
          <div class="example-row">
            <span class="example-code font-mono">.</span>
            <span class="example-desc">jedno písmeno</span>
          </div>
          <div class="example-row">
            <span class="example-code font-mono">*</span>
            <span class="example-desc">libovolný počet písmen</span>
          </div>
          <div class="example-row">
            <span class="example-code font-mono">K..KA</span>
            <span class="example-desc"><em>KOČKA</em>, <em>KAPKA</em>, <em>KLIKA</em></span>
          </div>
          <div class="example-row">
            <span class="example-code font-mono">P..ÍZE</span>
            <span class="example-desc"><em>PENÍZE</em></span>
          </div>
          <div class="example-row">
            <span class="example-code font-mono">POD*</span>
            <span class="example-desc"><em>PODZEMÍ</em>, <em>PODCHOD</em>, <em>PODPIS</em></span>
          </div>
          <div class="example-row">
            <span class="example-code font-mono">P*KA</span>
            <span class="example-desc"><em>POHÁDKA</em>, <em>POLÉVKA</em></span>
          </div>
          <div class="example-row">
            <span class="example-code font-mono">*LES</span>
            <span class="example-desc"><em>PRALES</em></span>
          </div>
        </div>

        <div class="tip-box">
          Diakritika se ignoruje: <code>k..ka</code> najde i <em>KOČKA</em>. Vlastní jména a místopis lze zapnout v menu.
        </div>
      </section>
    {:else if activeTab === 'anagram'}
      <section class="ref-section">
        <p class="ref-text">Slova ze zadaných písmen v libovolném pořadí.</p>

        <div class="examples-table">
          <div class="example-row">
            <span class="example-code font-mono">K O T E L</span>
            <span class="example-desc"><em>KOTEL</em>, <em>LOKET</em></span>
          </div>
          <div class="example-row">
            <span class="example-code font-mono">K O T E L N A</span>
            <span class="example-desc">
              <em>KOTELNA</em>, <em>KONATEL</em><br />
              kratší: <em>KLENOT</em>, <em>ETANOL</em>, <em>LENKA</em>…
            </span>
          </div>
        </div>

        <p class="ref-note">Řazeno podle délky, pak podle četnosti. Šifrovací hesla mají přednost.</p>
      </section>
    {:else if activeTab === 'regex'}
      <section class="ref-section">
        <p class="ref-text">Po zapnutí regexu v menu platí syntaxe JavaScriptu.</p>

        <div class="examples-table">
          <div class="example-row">
            <span class="example-code font-mono">^[k-m].*a$</span>
            <span class="example-desc">začíná K–M, končí A: <em>KOČKA</em>, <em>MAPA</em></span>
          </div>
          <div class="example-row">
            <span class="example-code font-mono">(ik|ek)$</span>
            <span class="example-desc">končí -ík/-ek: <em>LESÍK</em>, <em>DOMEK</em></span>
          </div>
          <div class="example-row">
            <span class="example-code font-mono">[aeiouyáéíóúůýě]{3}</span>
            <span class="example-desc">3 samohlásky za sebou: <em>SOUOSTROVÍ</em></span>
          </div>
          <div class="example-row">
            <span class="example-code font-mono">^[^aeiouyáéíóúůýě]+$</span>
            <span class="example-desc">bez samohlásek: <em>SMRK</em>, <em>PRST</em>, <em>VLK</em></span>
          </div>
          <div class="example-row">
            <span class="example-code font-mono">^.a.a.a$</span>
            <span class="example-desc"><em>BALADA</em>, <em>KANADA</em></span>
          </div>
        </div>
      </section>
    {/if}
  </div>
</div>

<style>
  .reference-container {
    display: flex;
    flex-direction: column;
    height: 100%;
    width: 100%;
    box-sizing: border-box;
    color: var(--color-text-primary);
    overflow: hidden;
  }

  .subtoolbar-container {
    height: 36px;
    display: flex;
    align-items: center;
    margin-bottom: var(--space-md);
    flex-shrink: 0;
    overflow: hidden;
  }

  .reference-scroll-content {
    flex: 1;
    overflow-y: auto;
    overscroll-behavior: contain;
    padding-bottom: var(--space-lg);
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    gap: var(--space-md);
  }

  .ref-section {
    display: flex;
    flex-direction: column;
    gap: var(--space-xs);
  }


  .ref-text {
    font-size: var(--text-sm);
    color: var(--color-text-secondary);
    line-height: 1.5;
    margin: 0;
  }

  .examples-table {
    display: flex;
    flex-direction: column;
    gap: 6px;
    background-color: var(--color-surface-1);
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-sm);
    padding: var(--space-sm) var(--space-md);
    margin: var(--space-xs) 0;
  }

  .example-row {
    display: flex;
    flex-direction: column;
    gap: 2px;
    padding-bottom: 6px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  }

  .example-row:last-child {
    border-bottom: none;
    padding-bottom: 0;
  }

  .example-code {
    color: var(--color-accent-primary);
    font-size: var(--text-sm);
    font-weight: 700;
  }

  .example-desc {
    color: var(--color-text-secondary);
    font-size: var(--text-xs);
    line-height: 1.4;
  }

  .tip-box {
    background-color: rgba(0, 210, 255, 0.06);
    border-left: 3px solid var(--color-accent-primary);
    padding: var(--space-xs) var(--space-sm);
    font-size: var(--text-xs);
    color: var(--color-text-secondary);
    border-radius: 0 var(--radius-xs) var(--radius-xs) 0;
    margin-top: var(--space-xs);
    line-height: 1.4;
  }

  .ref-note {
    font-size: var(--text-xs);
    color: var(--color-text-muted);
    font-style: italic;
    margin: var(--space-xs) 0 0 0;
    line-height: 1.4;
  }
</style>
