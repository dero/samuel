<script lang="ts">
  import { CZECH_MNEMONICS, type MorseEntry } from './morseData';
  import { settings } from '../../state/settings.svelte';

  let activeTab = $state<'list' | 'tree'>('list');
  let searchQuery = $state('');

  let filteredEntries = $derived.by(() => {
    const q = searchQuery.trim().toUpperCase();
    if (!q) return CZECH_MNEMONICS;
    return CZECH_MNEMONICS.filter(
      (e) =>
        e.char.includes(q) ||
        e.code.includes(q) ||
        e.mnemonic.toUpperCase().includes(q)
    );
  });

  // Binary tree levels for visualization
  // Level 1: 1 char
  // Level 2: 2 chars (E, T)
  // Level 3: 4 chars (I, A, N, M)
  // Level 4: 8 chars (S, U, R, W, D, K, G, O)
  // Level 5: 16 chars (H, V, F, _, L, _, P, J, B, X, C, Y, Z, Q, CH, _)
  const treeLevels = [
    {
      level: 1,
      nodes: [
        { char: 'E', code: '.', dir: 'L' },
        { char: 'T', code: '-', dir: 'R' }
      ]
    },
    {
      level: 2,
      nodes: [
        { char: 'I', code: '..', dir: 'L' },
        { char: 'A', code: '.-', dir: 'R' },
        { char: 'N', code: '-.', dir: 'L' },
        { char: 'M', code: '--', dir: 'R' }
      ]
    },
    {
      level: 3,
      nodes: [
        { char: 'S', code: '...', dir: 'L' },
        { char: 'U', code: '..-', dir: 'R' },
        { char: 'R', code: '.-.', dir: 'L' },
        { char: 'W', code: '.--', dir: 'R' },
        { char: 'D', code: '-..', dir: 'L' },
        { char: 'K', code: '-.-', dir: 'R' },
        { char: 'G', code: '--.', dir: 'L' },
        { char: 'O', code: '---', dir: 'R' }
      ]
    },
    {
      level: 4,
      nodes: [
        { char: 'H', code: '....', dir: 'L' },
        { char: 'V', code: '...-', dir: 'R' },
        { char: 'F', code: '..-.', dir: 'L' },
        { char: 'Ü', code: '..--', dir: 'R' },
        { char: 'L', code: '.-..', dir: 'L' },
        { char: 'Ä', code: '.-.-', dir: 'R' },
        { char: 'P', code: '.--.', dir: 'L' },
        { char: 'J', code: '.---', dir: 'R' },
        { char: 'B', code: '-...', dir: 'L' },
        { char: 'X', code: '-..-', dir: 'R' },
        { char: 'C', code: '-.-.', dir: 'L' },
        { char: 'Y', code: '-.--', dir: 'R' },
        { char: 'Z', code: '--..', dir: 'L' },
        { char: 'Q', code: '--.-', dir: 'R' },
        { char: 'CH', code: '----', dir: 'L' },
        { char: 'Š', code: '----.', dir: 'R' }
      ]
    }
  ];

  function handleSelectEntry(entry: MorseEntry) {
    settings.vibrate(20);
  }
</script>

<div class="ref-container">
  <!-- Sub-Tabs -->
  <div class="tab-bar">
    <button
      class="tab-btn"
      class:active={activeTab === 'list'}
      onclick={() => {
        settings.vibrate(20);
        activeTab = 'list';
      }}
    >
      Pomocná slova ({CZECH_MNEMONICS.length})
    </button>
    <button
      class="tab-btn"
      class:active={activeTab === 'tree'}
      onclick={() => {
        settings.vibrate(20);
        activeTab = 'tree';
      }}
    >
      Morseův strom
    </button>
  </div>

  {#if activeTab === 'list'}
    <!-- Search filter -->
    <div class="search-box">
      <span class="search-icon">🔍</span>
      <input
        type="search"
        placeholder="Hledat písmeno, kód nebo slovo..."
        bind:value={searchQuery}
      />
      {#if searchQuery}
        <button class="clear-search" onclick={() => (searchQuery = '')}>✕</button>
      {/if}
    </div>

    <!-- Mnemonic table -->
    <div class="table-scroll">
      <div class="entries-grid">
        {#each filteredEntries as entry}
          <div class="entry-row">
            <div class="entry-char">{entry.char}</div>
            <div class="entry-code">{entry.code}</div>
            <div class="entry-mnemonic">
              <span class="word">{entry.mnemonic}</span>
              {#if entry.syllables && !entry.isDigit}
                <span class="syllables">({entry.syllables})</span>
              {/if}
            </div>
          </div>
        {/each}
      </div>
    </div>
  {:else}
    <!-- Tree View -->
    <div class="tree-scroll">
      <div class="tree-explanation">
        Vlevo = tečka (<b>•</b>), Vpravo = čárka (<b>—</b>)
      </div>

      <div class="tree-container">
        <!-- Root node -->
        <div class="tree-row root-row">
          <div class="tree-node root-node">START</div>
        </div>

        {#each treeLevels as lvl}
          <div class="tree-level-label">Délka {lvl.level}</div>
          <div class="tree-row" style="grid-template-columns: repeat({lvl.nodes.length}, 1fr)">
            {#each lvl.nodes as node}
              <div class="tree-node" class:is-dot={node.dir === 'L'} class:is-dash={node.dir === 'R'}>
                <span class="node-char">{node.char}</span>
                <span class="node-code">{node.code}</span>
              </div>
            {/each}
          </div>
        {/each}
      </div>
    </div>
  {/if}
</div>

<style>
  .ref-container {
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow: hidden;
    gap: 10px;
  }

  .tab-bar {
    display: flex;
    background-color: var(--color-surface-2);
    border-radius: var(--radius-sm);
    padding: 3px;
    gap: 4px;
    flex-shrink: 0;
  }

  .tab-btn {
    flex: 1;
    padding: 8px 12px;
    font-size: 13px;
    font-weight: 600;
    color: var(--color-text-secondary);
    border-radius: 4px;
    text-align: center;
    transition: background-color 0.15s, color 0.15s;
  }

  .tab-btn.active {
    background-color: var(--color-surface-active);
    color: var(--color-text-primary);
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.4);
  }

  .search-box {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 12px;
    background-color: var(--color-surface-2);
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-md);
    flex-shrink: 0;
  }

  .search-box input {
    flex: 1;
    background: none;
    border: none;
    outline: none;
    color: var(--color-text-primary);
    font-size: 14px;
    font-family: inherit;
  }

  .clear-search {
    font-size: 14px;
    color: var(--color-text-muted);
    padding: 2px 6px;
  }

  .table-scroll {
    flex: 1;
    overflow-y: auto;
    overscroll-behavior: contain;
  }

  .entries-grid {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .entry-row {
    display: flex;
    align-items: center;
    padding: 8px 12px;
    background-color: var(--color-surface-1);
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-sm);
    gap: 12px;
  }

  .entry-char {
    font-family: var(--font-condensed);
    font-size: 18px;
    font-weight: 700;
    color: var(--color-accent-primary);
    width: 36px;
    flex-shrink: 0;
  }

  .entry-code {
    font-family: var(--font-mono);
    font-size: 16px;
    font-weight: 700;
    letter-spacing: 2px;
    color: #ffffff;
    width: 70px;
    flex-shrink: 0;
  }

  .entry-mnemonic {
    display: flex;
    align-items: baseline;
    gap: 6px;
    flex: 1;
    min-width: 0;
  }

  .entry-mnemonic .word {
    font-size: 14px;
    font-weight: 600;
    color: var(--color-text-primary);
  }

  .entry-mnemonic .syllables {
    font-size: 12px;
    color: var(--color-text-secondary);
  }

  /* Tree View */
  .tree-scroll {
    flex: 1;
    overflow: auto;
    overscroll-behavior: contain;
    padding: 4px;
  }

  .tree-explanation {
    text-align: center;
    font-size: 13px;
    color: var(--color-text-secondary);
    padding: 6px 0 12px 0;
  }

  .tree-container {
    display: flex;
    flex-direction: column;
    gap: 10px;
    min-width: 640px;
  }

  .tree-level-label {
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 1px;
    color: var(--color-text-muted);
    margin-top: 4px;
  }

  .tree-row {
    display: grid;
    gap: 4px;
  }

  .root-row {
    display: flex;
    justify-content: center;
  }

  .tree-node {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 6px 2px;
    background-color: var(--color-surface-2);
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-sm);
    min-width: 0;
  }

  .tree-node.is-dot {
    border-left: 2px solid var(--color-accent-primary);
  }

  .tree-node.is-dash {
    border-right: 2px solid var(--color-accent-warning);
  }

  .root-node {
    padding: 6px 24px;
    font-weight: 700;
    color: var(--color-accent-primary);
  }

  .node-char {
    font-family: var(--font-condensed);
    font-size: 15px;
    font-weight: 700;
    color: var(--color-text-primary);
  }

  .node-code {
    font-family: var(--font-mono);
    font-size: 11px;
    color: var(--color-text-secondary);
    letter-spacing: 1px;
  }
</style>
