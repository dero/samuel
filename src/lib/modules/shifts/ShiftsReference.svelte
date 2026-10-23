<script lang="ts">
  import { settings } from '../../state/settings.svelte';

  interface Props {
    letters: string[];
  }

  let { letters }: Props = $props();

  let activeTab = $state<'caesar' | 'vigenere' | 'autokey'>('caesar');
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
      Vigenère
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
        <h3>Caesarova šifra</h3>
        <p>Každé písmeno posunuto o stejné <code>k</code> v abecedě délky <code>N</code>.</p>

        <div class="formula-box font-mono">
          <div>Šifrování: C = (P + k) mod N</div>
          <div>Dešifrování: P = (C - k) mod N</div>
        </div>

        <h4>ROT13</h4>
        <p>Posun o 13 v 26 písmenech. Šifrování i dešifrování je totéž.</p>
      </section>
    {:else if activeTab === 'vigenere'}
      <section class="ref-section">
        <h3>Vigenèrova šifra</h3>
        <p>Posun se mění podle písmen opakujícího se hesla.</p>

        <div class="formula-box font-mono">
          <div>Šifrování: C_i = (P_i + K_i) mod N</div>
          <div>Dešifrování: P_i = (C_i - K_i) mod N</div>
        </div>

        <h4>Gronsfeld</h4>
        <p>Klíčem jsou číslice, např. <code>314159</code>. Zadávají se přímo do pole klíče.</p>

        <h4>Tabula recta</h4>
        <div class="table-scroll">
          <table class="tabula-recta font-mono">
            <thead>
              <tr>
                <th class="corner-th"></th>
                {#each letters as l}
                  <th>{l}</th>
                {/each}
              </tr>
            </thead>
            <tbody>
              {#each letters as rowL, rowIdx}
                <tr>
                  <th class="row-th">{rowL}</th>
                  {#each letters as colL, colIdx}
                    {@const shiftedIdx = (rowIdx + colIdx) % letters.length}
                    <td>{letters[shiftedIdx]}</td>
                  {/each}
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      </section>
    {:else if activeTab === 'autokey'}
      <section class="ref-section">
        <h3>Autokey</h3>
        <p>Heslo se neopakuje – po úvodním klíči (primeru) pokračuje textem zprávy.</p>

        <h4>Otevřený text jako klíč</h4>
        <div class="formula-box font-mono">
          <div>Zpráva:  J D E T E N A R O Z C E S T I</div>
          <div>Primer:  K O D</div>
          <div>Klíč:    K O D J D E T E N A R O Z C E</div>
        </div>

        <h4>Šifrový text jako klíč</h4>
        <p>Po primeru pokračuje klíč už zašifrovanými znaky.</p>
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

  .ref-section p code {
    font-family: var(--font-mono);
    color: var(--color-accent-primary);
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
