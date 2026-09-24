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
        <h3 class="ref-heading">Vyhledávání podle masky (Křížovka)</h3>
        <p class="ref-text">
          Slouží k doplnění neznámých písmen, pokud znáte délku slova nebo část jeho pozic.
        </p>

        <div class="examples-table">
          <div class="example-row">
            <span class="example-code font-mono">.</span>
            <span class="example-desc">Právě jedno libovolné písmeno</span>
          </div>
          <div class="example-row">
            <span class="example-code font-mono">*</span>
            <span class="example-desc">Libovolný počet písmen (nula nebo více)</span>
          </div>
          <div class="example-row">
            <span class="example-code font-mono">K..KA</span>
            <span class="example-desc">5písmenné slovo: začíná K, končí KA (např. <em>KOČKA</em>, <em>KAPKA</em>, <em>KLIKA</em>, <em>KULKA</em>)</span>
          </div>
          <div class="example-row">
            <span class="example-code font-mono">K...KA</span>
            <span class="example-desc">6písmenné slovo: začíná K, končí KA (např. <em>KOSTKA</em>, <em>KLAPKA</em>, <em>KNÍŽKA</em>)</span>
          </div>
          <div class="example-row">
            <span class="example-code font-mono">P..ÍZE</span>
            <span class="example-desc">6písmenné slovo se známým začátkem a koncem (např. <em>PENÍZE</em>)</span>
          </div>
          <div class="example-row">
            <span class="example-code font-mono">POD*</span>
            <span class="example-desc">Slova začínající předponou POD- (např. <em>PODZEMÍ</em>, <em>PODCHOD</em>, <em>PODPIS</em>)</span>
          </div>
          <div class="example-row">
            <span class="example-code font-mono">P*KA</span>
            <span class="example-desc">Slova začínající P a končící KA (např. <em>POHÁDKA</em>, <em>POLÉVKA</em>, <em>PASTILKA</em>)</span>
          </div>
          <div class="example-row">
            <span class="example-code font-mono">*LES</span>
            <span class="example-desc">Slova končící na -LES (např. <em>PRALES</em>, <em>BEZLES</em>)</span>
          </div>
        </div>

        <div class="tip-box">
          <strong>Tip pro terén:</strong> Ve výchozím nastavení modul ignoruje diakritiku. Dotaz <code>k..ka</code> najde tvary s háčky i bez nich (např. <em>KOČKA</em>). V menu lze zapnout <strong>Pouze podstatná jména</strong>, <strong>Zahrnout vlastní jména</strong> (např. Karel, Praha) i <strong>Zahrnout místopis</strong> (RÚIAN).
        </div>
      </section>
    {:else if activeTab === 'anagram'}
      <section class="ref-section">
        <h3 class="ref-heading">Anagramy (Přesmyčky)</h3>
        <p class="ref-text">
          Hledá platná česká slova složená ze zadané sady písmen bez ohledu na jejich pořadí. Využívá optimalizovaný 26bitový index s okamžitou odezvou.
        </p>

        <div class="examples-table">
          <div class="example-row">
            <span class="example-code font-mono">K O T E L</span>
            <span class="example-desc">Přesné anagramy: <em>KOTEL</em>, <em>LOKET</em></span>
          </div>
          <div class="example-row">
            <span class="example-code font-mono">P E N I Z E</span>
            <span class="example-desc">Přesný anagram: <em>PENÍZE</em></span>
          </div>
          <div class="example-row">
            <span class="example-code font-mono">K O T E L N A</span>
            <span class="example-desc">
              Přesné anagramy: <em>KOTELNA</em>, <em>KONATEL</em><br />
              Kratší podslova: <em>KLENOT</em> (6), <em>ETANOL</em> (6), <em>LOKET</em> (5), <em>KOTEL</em> (5), <em>LENKA</em> (5)...
            </span>
          </div>
        </div>

        <p class="ref-note">
          Výsledky jsou řazeny primárně sestupně podle délky slova a sekundárně podle frekvence výskytu v českém jazyce. Šifrová klíčová slova jsou upřednostněna.
        </p>
      </section>
    {:else if activeTab === 'regex'}
      <section class="ref-section">
        <h3 class="ref-heading">Regulární výrazy (Regex syntax)</h3>
        <p class="ref-text">
          Po zapnutí volby <em>„Používat regex syntaxi“</em> v menu modulu můžete zadávat standardní regulární výrazy JavaScriptu:
        </p>

        <div class="examples-table">
          <div class="example-row">
            <span class="example-code font-mono">^[k-m].*a$</span>
            <span class="example-desc">Slova začínající písmenem K, L nebo M a končící na A (např. <em>KOČKA</em>, <em>LOUKA</em>, <em>MAPA</em>)</span>
          </div>
          <div class="example-row">
            <span class="example-code font-mono">(ik|ek)$</span>
            <span class="example-desc">Slova končící na koncovku -ík nebo -ek (např. <em>LESÍK</em>, <em>DOMEK</em>, <em>ZÁMEK</em>)</span>
          </div>
          <div class="example-row">
            <span class="example-code font-mono">[aeiouyáéíóúůýě]{3}</span>
            <span class="example-desc">Slova obsahující 3 samohlásky za sebou (např. <em>SOUOSTROVÍ</em> [ouo], <em>SPOLUAUTOR</em> [uau], <em>RADIOAKTIVITA</em> [ioa])</span>
          </div>
          <div class="example-row">
            <span class="example-code font-mono">^[^aeiouyáéíóúůýě]+$</span>
            <span class="example-desc">Čistě souhlásková slova bez samohlásek (např. <em>SMRK</em>, <em>PRST</em>, <em>TVRZ</em>, <em>VLK</em>, <em>CHRT</em>)</span>
          </div>
          <div class="example-row">
            <span class="example-code font-mono">^.a.a.a$</span>
            <span class="example-desc">6písmenná slova se střídavým A na sudých pozicích (např. <em>BALADA</em>, <em>KANADA</em>)</span>
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
