<script lang="ts">
  import { alphabet } from '../../state/alphabet.svelte';
  import { settings } from '../../state/settings.svelte';

  let currentLetters = $derived(alphabet.currentLetters);
  let activeTab = $state<'caesar' | 'vigenere' | 'autokey'>('caesar');

  // Generate 26x26 Tabula Recta sample for Vigenère
  const tabulaLetters = $derived(currentLetters.slice(0, 26));
</script>

<div class="ref-wrapper">
  <!-- Reference Tabs -->
  <div class="ref-tabs">
    <button
      type="button"
      class="ref-tab-btn"
      class:is-active={activeTab === 'caesar'}
      onclick={() => {
        settings.vibrate(15);
        activeTab = 'caesar';
      }}
    >
      Cézar
    </button>
    <button
      type="button"
      class="ref-tab-btn"
      class:is-active={activeTab === 'vigenere'}
      onclick={() => {
        settings.vibrate(15);
        activeTab = 'vigenere';
      }}
    >
      Vigenère & Tabula
    </button>
    <button
      type="button"
      class="ref-tab-btn"
      class:is-active={activeTab === 'autokey'}
      onclick={() => {
        settings.vibrate(15);
        activeTab = 'autokey';
      }}
    >
      Autokey
    </button>
  </div>

  <div class="ref-content" data-allow-copy>
    {#if activeTab === 'caesar'}
      <section class="ref-section">
        <h3>Caesarova šifra (Posun o konstantu)</h3>
        <p>
          Každé písmeno zprávy je posunuto o fixní počet pozic $k$ v abecedě o délce $N$.
        </p>

        <div class="formula-box font-mono">
          <div>Šifrování: C = (P + k) mod N</div>
          <div>Dešifrování: P = (C - k) mod N</div>
        </div>

        <h4>ROT13</h4>
        <p>
          Posun o 13 pozic ve standardní 26místné abecedě ($N = 26$). Je sám sobě inverzí (šifrování i dešifrování je stejná operace: $13 + 13 = 26 \equiv 0$).
        </p>

        <h4>Typická četnost písmen v češtině (ČNK)</h4>
        <div class="freq-table-wrapper">
          <table class="freq-table font-mono">
            <thead>
              <tr>
                <th>Písmeno</th>
                <th>E</th>
                <th>A</th>
                <th>O</th>
                <th>T</th>
                <th>N</th>
                <th>I</th>
                <th>S</th>
                <th>R</th>
                <th>V</th>
                <th>L</th>
                <th>D</th>
                <th>K</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Podíl</td>
                <td>10.7%</td>
                <td>8.6%</td>
                <td>8.3%</td>
                <td>5.8%</td>
                <td>5.7%</td>
                <td>5.6%</td>
                <td>5.3%</td>
                <td>4.9%</td>
                <td>4.6%</td>
                <td>3.8%</td>
                <td>3.6%</td>
                <td>3.4%</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    {:else if activeTab === 'vigenere'}
      <section class="ref-section">
        <h3>Vigenèrova šifra (Polyalfabetická substituce)</h3>
        <p>
          Posun se v každém kroku mění podle písmene z opakujícího se klíče (hesla).
        </p>

        <div class="formula-box font-mono">
          <div>Šifrování: C_i = (P_i + K_i) mod N</div>
          <div>Dešifrování: P_i = (C_i - K_i) mod N</div>
        </div>

        <h4>Gronsfeldova šifra</h4>
        <p>
          Varianta Vigenèra, kde klíčem není slovo, ale sekvence číslic (např. <code>3 1 4 1 5 9</code>). Každé písmeno se posune o dané číslo. V Samuelovi stačí číslo zadat přímo do pole klíče.
        </p>

        <h4>Tabula Recta (Šifrovací čtverec)</h4>
        <div class="table-scroll">
          <table class="tabula-recta font-mono">
            <thead>
              <tr>
                <th class="corner-th"></th>
                {#each tabulaLetters as l}
                  <th>{l}</th>
                {/each}
              </tr>
            </thead>
            <tbody>
              {#each tabulaLetters as rowL, rowIdx}
                <tr>
                  <th class="row-th">{rowL}</th>
                  {#each tabulaLetters as colL, colIdx}
                    {@const shiftedIdx = (rowIdx + colIdx) % tabulaLetters.length}
                    <td>{tabulaLetters[shiftedIdx]}</td>
                  {/each}
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      </section>
    {:else if activeTab === 'autokey'}
      <section class="ref-section">
        <h3>Autokey šifra (Samoposuv)</h3>
        <p>
          Vynalezena Blaise de Vigenèrem v roce 1586. Řeší slabinu klasického Vigenèra (periodicitu hesla).
        </p>

        <h4>1. Otevřený text jako klíč (Plaintext Autokey)</h4>
        <p>
          Klíč začíná krátkým slovem (tzv. <em>primer</em>). Jakmile primer dojde, jako další klíč slouží samotný <strong>otevřený text zprávy</strong>:
        </p>
        <div class="formula-box font-mono">
          <div>Zpráva:  J D E T E N A R O Z C E S T I</div>
          <div>Primer:  K O D</div>
          <div>Klíč:    K O D J D E T E N A R O Z C E</div>
        </div>

        <h4>2. Šifrový text jako klíč (Ciphertext Autokey)</h4>
        <p>
          Po vyčerpání primeru se jako klíč použije proud <strong>již zašifrovaných znaků</strong>. Tato varianta je odolnější proti luštění frekvenční analýzou, protože proud klíče neobsahuje českou syntaxi.
        </p>
      </section>
    {/if}
  </div>
</div>

<style>
  .ref-wrapper {
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow: hidden;
  }

  .ref-tabs {
    display: flex;
    background-color: var(--color-surface-1);
    border-bottom: 1px solid var(--color-border-subtle);
    padding: var(--space-2xs) var(--space-sm);
    gap: 4px;
    flex-shrink: 0;
  }

  .ref-tab-btn {
    flex: 1;
    background: transparent;
    border: none;
    padding: 6px 8px;
    color: var(--color-text-secondary);
    font-size: var(--text-xs);
    font-weight: 600;
    cursor: pointer;
    border-radius: var(--radius-xs);
    transition: background-color 0.1s ease, color 0.1s ease;
  }

  .ref-tab-btn.is-active {
    background-color: var(--color-surface-3);
    color: var(--color-accent-primary);
  }

  .ref-content {
    flex: 1;
    overflow-y: auto;
    overscroll-behavior: contain;
    padding: var(--space-md);
    color: var(--color-text-secondary);
    font-size: var(--text-sm);
    line-height: 1.5;
  }

  .ref-section h3 {
    color: var(--color-text-primary);
    font-size: var(--text-base);
    margin: 0 0 var(--space-xs) 0;
  }

  .ref-section h4 {
    color: var(--color-text-primary);
    font-size: var(--text-sm);
    margin: var(--space-md) 0 var(--space-2xs) 0;
  }

  .ref-section p {
    margin: 0 0 var(--space-sm) 0;
  }

  .formula-box {
    background-color: var(--color-surface-2);
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-sm);
    padding: var(--space-sm);
    color: var(--color-accent-primary);
    font-size: var(--text-xs);
    line-height: 1.6;
    margin: var(--space-xs) 0 var(--space-sm) 0;
  }

  .freq-table-wrapper {
    overflow-x: auto;
    margin-top: var(--space-xs);
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-sm);
  }

  .freq-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 11px;
    text-align: center;
    background-color: var(--color-surface-2);
  }

  .freq-table th,
  .freq-table td {
    padding: 6px 4px;
    border: 1px solid var(--color-border-subtle);
  }

  .freq-table th {
    background-color: var(--color-surface-3);
    color: var(--color-text-primary);
  }

  .table-scroll {
    overflow-x: auto;
    overflow-y: auto;
    max-height: 280px;
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-sm);
    margin-top: var(--space-xs);
  }

  .tabula-recta {
    border-collapse: collapse;
    font-size: 10px;
    background-color: var(--color-surface-2);
    width: 100%;
    text-align: center;
  }

  .tabula-recta th,
  .tabula-recta td {
    padding: 3px 5px;
    border: 1px solid var(--color-border-subtle);
    min-width: 16px;
  }

  .tabula-recta th {
    background-color: var(--color-surface-3);
    color: var(--color-accent-primary);
    font-weight: 700;
  }

  .corner-th {
    background-color: var(--color-surface-1) !important;
  }

  .row-th {
    position: sticky;
    left: 0;
    z-index: 1;
  }
</style>
