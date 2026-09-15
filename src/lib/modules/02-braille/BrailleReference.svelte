<script lang="ts">
  import {
    ALL_BRAILLE_ENTRIES,
    BRAILLE_LETTERS,
    BRAILLE_CZECH_DIACRITICS,
    BRAILLE_DIGITS,
    BRAILLE_PREFIXES,
    BRAILLE_PUNCTUATION,
    type BrailleEntry
  } from './brailleData';
  import { matchesSearch } from '../../utils/search';
  import { MagnifyingGlass, X } from 'phosphor-svelte';

  let searchQuery = $state('');

  // Search filter
  let filteredEntries = $derived.by(() => {
    if (!searchQuery.trim()) return null;
    const q = searchQuery.trim().toLowerCase();
    return ALL_BRAILLE_ENTRIES.filter((e) => {
      const dotStr = e.dots.join('');
      const dotCommaStr = e.dots.join(', ');
      return (
        matchesSearch([e.char, dotStr, dotCommaStr, e.unicode, e.description || ''], q)
      );
    });
  });

  const sections = [
    { title: 'Základní abeceda (A–Z)', items: BRAILLE_LETTERS },
    { title: 'Česká diakritika (Á–Ž)', items: BRAILLE_CZECH_DIACRITICS },
    { title: 'Číslice (1–9, 0)', items: BRAILLE_DIGITS },
    { title: 'Prefixy a symboly', items: [...BRAILLE_PREFIXES, ...BRAILLE_PUNCTUATION] }
  ];
</script>

<div class="ref-container">
  <!-- Search filter -->
  <div class="search-box">
    <span class="search-icon"><MagnifyingGlass size={16} weight="bold" /></span>
    <input
      type="search"
      placeholder="Hledat znak, čísla bodů (např. 135)..."
      bind:value={searchQuery}
    />
    {#if searchQuery}
      <button
        class="clear-search"
        aria-label="Vymazat hledání"
        onclick={() => (searchQuery = '')}
      >
        <X size={14} weight="bold" />
      </button>
    {/if}
  </div>

  <!-- Symbols list -->
  <div class="table-scroll">
    {#if filteredEntries}
      <div class="entries-grid">
        {#each filteredEntries as entry}
          <div class="symbol-card">
            <span class="symbol-char">{entry.char}</span>
            <div class="dot-matrix" aria-hidden="true">
              <div class="dot" class:is-on={entry.dots.includes(1)}></div>
              <div class="dot" class:is-on={entry.dots.includes(4)}></div>
              <div class="dot" class:is-on={entry.dots.includes(2)}></div>
              <div class="dot" class:is-on={entry.dots.includes(5)}></div>
              <div class="dot" class:is-on={entry.dots.includes(3)}></div>
              <div class="dot" class:is-on={entry.dots.includes(6)}></div>
            </div>
          </div>
        {:else}
          <div class="empty-state">
            Nenalezen žádný znak odpovídající „{searchQuery}“.
          </div>
        {/each}
      </div>
    {:else}
      <div class="sections-container">
        {#each sections as sec}
          <div class="section-group">
            <div class="section-title">{sec.title}</div>
            <div class="entries-grid">
              {#each sec.items as entry}
                <div class="symbol-card" title="{entry.char} – body: {entry.dots.join(', ')}">
                  <span class="symbol-char">{entry.char}</span>
                  <div class="dot-matrix" aria-hidden="true">
                    <div class="dot" class:is-on={entry.dots.includes(1)}></div>
                    <div class="dot" class:is-on={entry.dots.includes(4)}></div>
                    <div class="dot" class:is-on={entry.dots.includes(2)}></div>
                    <div class="dot" class:is-on={entry.dots.includes(5)}></div>
                    <div class="dot" class:is-on={entry.dots.includes(3)}></div>
                    <div class="dot" class:is-on={entry.dots.includes(6)}></div>
                  </div>
                </div>
              {/each}
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </div>
</div>

<style>
  .ref-container {
    display: flex;
    flex-direction: column;
    height: 100%;
    min-height: 0;
    overflow: hidden;
    gap: 10px;
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

  .search-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--color-text-secondary);
    flex-shrink: 0;
  }

  .clear-search {
    color: var(--color-text-muted);
    padding: 2px 6px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .table-scroll {
    flex: 1;
    overflow-y: auto;
    overscroll-behavior: contain;
    padding-right: 2px;
  }

  .sections-container {
    display: flex;
    flex-direction: column;
    gap: 14px;
    padding-bottom: 16px;
  }

  .section-group {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .section-title {
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.6px;
    color: var(--color-text-secondary);
    padding-left: 2px;
  }

  /* 3 to 4 items on width */
  .entries-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(76px, 1fr));
    gap: 6px;
  }

  .symbol-card {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 6px 8px;
    background-color: var(--color-surface-1);
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-sm);
    gap: 8px;
    user-select: none;
  }

  .symbol-char {
    font-family: var(--font-condensed);
    font-size: 20px;
    font-weight: 800;
    color: #ffffff;
    line-height: 1;
    flex: 1;
    text-align: center;
  }

  .dot-matrix {
    display: grid;
    grid-template-columns: repeat(2, 7px);
    grid-template-rows: repeat(3, 7px);
    gap: 3px;
    padding: 3px;
    background-color: var(--color-surface-2);
    border-radius: 3px;
    border: 1px solid rgba(255, 255, 255, 0.05);
    flex-shrink: 0;
  }

  .dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background-color: rgba(255, 255, 255, 0.12);
  }

  .dot.is-on {
    background-color: var(--color-accent-primary);
    box-shadow: 0 0 4px var(--color-accent-primary);
  }

  .empty-state {
    text-align: center;
    color: var(--color-text-muted);
    padding: 24px 16px;
    font-size: 14px;
    grid-column: 1 / -1;
  }
</style>
