<script lang="ts">
  import {
    LETTER_FLAGS,
    NUMBER_FLAGS,
    FLAG_COLORS,
    type FlagItem
  } from './flagsData';
  import FlagSvg from './FlagSvg.svelte';
  import { matchesSearch } from '../../utils/search';
  import { MagnifyingGlass, X } from 'phosphor-svelte';

  let searchQuery = $state('');
  let activeTab = $state<'letters' | 'numbers'>('letters');

  const filteredLetters = $derived.by(() => {
    if (!searchQuery.trim()) return LETTER_FLAGS;
    return LETTER_FLAGS.filter((f) =>
      matchesSearch([f.code, f.name, f.meaning, ...f.colors], searchQuery)
    );
  });

  const filteredNumbers = $derived.by(() => {
    if (!searchQuery.trim()) return NUMBER_FLAGS;
    return NUMBER_FLAGS.filter((f) =>
      matchesSearch([f.code, f.name, f.meaning, ...f.colors], searchQuery)
    );
  });

  function getColorHex(colorId: string): string {
    return FLAG_COLORS.find((c) => c.id === colorId)?.hex ?? '#888';
  }

  function getColorName(colorId: string): string {
    return FLAG_COLORS.find((c) => c.id === colorId)?.name ?? colorId;
  }
</script>

<div class="ref-container">
  <!-- Pinned Top: Search and Tabs -->
  <div class="pinned-header">
    <div class="search-box">
      <span class="search-icon"><MagnifyingGlass size={16} weight="bold" /></span>
      <input
        type="search"
        bind:value={searchQuery}
        placeholder="Hledat vlajku, písmeno, NATO kód, význam..."
      />
      {#if searchQuery}
        <button
          type="button"
          class="clear-search"
          onclick={() => (searchQuery = '')}
          aria-label="Vymazat hledání"
        >
          <X size={14} weight="bold" />
        </button>
      {/if}
    </div>

    <div class="tabs-row">
      <button
        type="button"
        class="tab-btn"
        class:is-active={activeTab === 'letters'}
        onclick={() => (activeTab = 'letters')}
      >
        Písmena (A–Z)
        <span class="tab-count">{filteredLetters.length}</span>
      </button>
      <button
        type="button"
        class="tab-btn"
        class:is-active={activeTab === 'numbers'}
        onclick={() => (activeTab = 'numbers')}
      >
        Číslice (0–9)
        <span class="tab-count">{filteredNumbers.length}</span>
      </button>
    </div>
  </div>

  <!-- Scrollable entries area -->
  <div class="table-scroll">
    {#if activeTab === 'letters'}
      {#if filteredLetters.length === 0}
        <div class="empty-state">Žádná písmenná vlajka neodpovídá hledání.</div>
      {:else}
        <div class="flags-list">
          {#each filteredLetters as flag (flag.code)}
            <div class="flag-card">
              <div class="flag-preview-box">
                <FlagSvg {flag} />
              </div>

              <div class="flag-info">
                <div class="flag-title-row">
                  <span class="flag-code">{flag.code}</span>
                  <span class="flag-nato">{flag.name}</span>
                </div>

                <div class="flag-meaning">
                  {flag.meaning}
                </div>

                <div class="flag-colors-row">
                  {#each flag.colors as c}
                    <span
                      class="color-dot"
                      style:background-color={getColorHex(c)}
                      title={getColorName(c)}
                    ></span>
                  {/each}
                </div>
              </div>
            </div>
          {/each}
        </div>
      {/if}
    {:else}
      {#if filteredNumbers.length === 0}
        <div class="empty-state">Žádný číslicový praporek neodpovídá hledání.</div>
      {:else}
        <div class="flags-list">
          {#each filteredNumbers as flag (flag.code)}
            <div class="flag-card">
              <div class="flag-preview-box pennant">
                <FlagSvg {flag} />
              </div>

              <div class="flag-info">
                <div class="flag-title-row">
                  <span class="flag-code">{flag.code}</span>
                  <span class="flag-nato">{flag.name}</span>
                </div>

                <div class="flag-meaning">
                  Číslicový praporek {flag.code}
                </div>

                <div class="flag-colors-row">
                  {#each flag.colors as c}
                    <span
                      class="color-dot"
                      style:background-color={getColorHex(c)}
                      title={getColorName(c)}
                    ></span>
                  {/each}
                </div>
              </div>
            </div>
          {/each}
        </div>
      {/if}
    {/if}
  </div>
</div>

<style>
  .ref-container {
    display: flex;
    flex-direction: column;
    height: 100%;
    min-height: 0;
    gap: var(--space-sm);
  }

  .pinned-header {
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    gap: var(--space-xs);
  }

  .search-box {
    display: flex;
    align-items: center;
    background-color: var(--color-surface-2);
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-sm);
    padding: 0 var(--space-sm);
    height: 38px;
    gap: var(--space-sm);
  }

  .search-box:focus-within {
    border-color: var(--color-border-focus);
  }

  .search-icon {
    display: flex;
    align-items: center;
    color: var(--color-text-secondary);
    flex-shrink: 0;
  }

  .search-box input {
    flex: 1;
    min-width: 0;
    background: transparent;
    border: none;
    outline: none;
    color: var(--color-text-primary);
    font-size: var(--text-sm);
    font-family: var(--font-sans);
  }

  .clear-search {
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--color-text-secondary);
    padding: 4px;
    border-radius: var(--radius-xs);
    flex-shrink: 0;
  }
  .clear-search:active {
    color: var(--color-text-primary);
    background-color: var(--color-surface-active);
  }

  .tabs-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--space-xs);
    background-color: var(--color-surface-2);
    padding: 3px;
    border-radius: var(--radius-sm);
    border: 1px solid var(--color-border-subtle);
  }

  .tab-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--space-xs);
    padding: 6px var(--space-sm);
    font-size: var(--text-xs);
    font-weight: 600;
    color: var(--color-text-secondary);
    border-radius: var(--radius-xs);
    transition: background-color 0.12s, color 0.12s;
  }

  .tab-btn.is-active {
    background-color: var(--color-surface-3);
    color: var(--color-accent-primary);
    box-shadow: var(--shadow-sm);
  }

  .tab-count {
    font-size: 10px;
    padding: 1px 5px;
    background-color: var(--color-surface-1);
    border-radius: var(--radius-full);
    color: var(--color-text-muted);
  }

  .tab-btn.is-active .tab-count {
    color: var(--color-accent-primary);
  }

  .table-scroll {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    overscroll-behavior: contain;
    -webkit-overflow-scrolling: touch;
    padding-bottom: var(--space-lg);
    padding-right: 2px;
  }

  .flags-list {
    display: flex;
    flex-direction: column;
    gap: var(--space-xs);
  }

  .flag-card {
    display: flex;
    align-items: center;
    gap: var(--space-sm);
    background-color: var(--color-surface-2);
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-sm);
    padding: var(--space-xs) var(--space-sm);
  }

  .flag-preview-box {
    width: 44px;
    height: 44px;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .flag-preview-box.pennant {
    width: 56px;
    height: 32px;
  }

  .flag-info {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .flag-title-row {
    display: flex;
    align-items: baseline;
    gap: var(--space-sm);
  }

  .flag-code {
    font-size: var(--text-lg);
    font-weight: 700;
    color: var(--color-accent-primary);
    font-family: var(--font-condensed);
    min-width: 18px;
  }

  .flag-nato {
    font-size: var(--text-base);
    font-weight: 700;
    color: var(--color-text-primary);
  }

  .flag-meaning {
    font-size: var(--text-xs);
    color: var(--color-text-secondary);
    line-height: 1.35;
  }

  .flag-colors-row {
    display: flex;
    align-items: center;
    gap: 4px;
    margin-top: 2px;
  }

  .color-dot {
    width: 9px;
    height: 9px;
    border-radius: 50%;
    border: 1px solid rgba(255, 255, 255, 0.2);
  }

  .empty-state {
    text-align: center;
    padding: var(--space-2xl) var(--space-md);
    color: var(--color-text-muted);
    font-size: var(--text-sm);
  }
</style>
