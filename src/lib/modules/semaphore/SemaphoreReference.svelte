<script lang="ts">
  import { SEMAPHORE_ENTRIES, SEMAPHORE_DIRECTIONS, type SemaphoreEntry } from './semaphoreData';
  import { matchesSearch } from '../../utils/search';
  import SearchInput from '../../components/ui/SearchInput.svelte';

  let searchQuery = $state('');

  // 8 positions on 48x48 SVG
  // center = (24, 24), radius = 17
  const SVG_POINTS = SEMAPHORE_DIRECTIONS.map((dir) => ({
    index: dir.index,
    x: +(24 + 17 * dir.dx).toFixed(2),
    y: +(24 + 17 * dir.dy).toFixed(2)
  }));

  const lettersList = SEMAPHORE_ENTRIES
    .filter((e) => e.char.length === 1 && e.char >= 'A' && e.char <= 'Z')
    .sort((a, b) => a.char.localeCompare(b.char));

  const digitsList = SEMAPHORE_ENTRIES.filter((e) => !!e.digit).sort((a, b) => {
    const da = a.digit === '0' ? '99' : a.digit!;
    const db = b.digit === '0' ? '99' : b.digit!;
    return da.localeCompare(db);
  });
  const specialList = SEMAPHORE_ENTRIES.filter((e) => e.char === '#');

  let filteredLetters = $derived.by(() => {
    if (!searchQuery.trim()) return lettersList;
    return lettersList.filter((e) =>
      matchesSearch([e.char, e.digit || '', e.name, e.key], searchQuery)
    );
  });

  let filteredDigits = $derived.by(() => {
    if (!searchQuery.trim()) return digitsList;
    return digitsList.filter((e) =>
      matchesSearch([e.char, e.digit || '', e.name, e.key], searchQuery)
    );
  });

  let filteredSpecial = $derived.by(() => {
    if (!searchQuery.trim()) return specialList;
    return specialList.filter((e) =>
      matchesSearch([e.char, e.name, e.key], searchQuery)
    );
  });

  let totalVisible = $derived(
    filteredLetters.length + filteredDigits.length + filteredSpecial.length
  );
</script>

<div class="ref-container">
  <!-- Search Bar -->
  <SearchInput
    bind:value={searchQuery}
    placeholder="Hledat znak, číslici, směr..."
  />

  <!-- Scrollable entries area -->
  <div class="table-scroll">
    {#if totalVisible === 0}
      <div class="no-results">
        Žádný znak neodpovídá zadání „{searchQuery}“
      </div>
    {/if}

    <!-- Letters Section (A–Z) -->
    {#if filteredLetters.length > 0}
      <div class="section-title">Písmena (A–Z)</div>
      <div class="ref-grid">
        {#each filteredLetters as entry (entry.key)}
          <div class="ref-card">
            <div class="card-text">
              <span class="card-char">{entry.char}</span>
              {#if entry.digit}
                <span class="card-digit">/{entry.digit}</span>
              {/if}
            </div>
            <svg class="mini-diagram" viewBox="0 0 48 48" aria-hidden="true">
              <!-- Inactive dots -->
              {#each SVG_POINTS as pt}
                {#if !entry.pair.includes(pt.index)}
                  <circle cx={pt.x} cy={pt.y} r="2" class="dot-inactive" />
                {/if}
              {/each}

              <!-- Center dot -->
              <circle cx="24" cy="24" r="3" class="dot-center" />

              <!-- Active Arms -->
              {#each entry.pair as armIdx}
                {@const pt = SVG_POINTS[armIdx]}
                <line
                  x1="24"
                  y1="24"
                  x2={pt.x}
                  y2={pt.y}
                  class="arm-active"
                />
                <circle cx={pt.x} cy={pt.y} r="4" class="dot-active" />
              {/each}
            </svg>
          </div>
        {/each}
      </div>
    {/if}

    <!-- Digits Section (1–9, 0) -->
    {#if filteredDigits.length > 0 && searchQuery.trim().length > 0}
      <div class="section-title">Číslice (1–9, 0 s prefixem #)</div>
      <div class="ref-grid">
        {#each filteredDigits as entry (entry.digit)}
          <div class="ref-card">
            <div class="card-text">
              <span class="card-char">{entry.digit}</span>
              <span class="card-digit">({entry.char})</span>
            </div>
            <svg class="mini-diagram" viewBox="0 0 48 48" aria-hidden="true">
              {#each SVG_POINTS as pt}
                {#if !entry.pair.includes(pt.index)}
                  <circle cx={pt.x} cy={pt.y} r="2" class="dot-inactive" />
                {/if}
              {/each}
              <circle cx="24" cy="24" r="3" class="dot-center" />
              {#each entry.pair as armIdx}
                {@const pt = SVG_POINTS[armIdx]}
                <line x1="24" y1="24" x2={pt.x} y2={pt.y} class="arm-active" />
                <circle cx={pt.x} cy={pt.y} r="4" class="dot-active" />
              {/each}
            </svg>
          </div>
        {/each}
      </div>
    {/if}

    <!-- Special Signals -->
    {#if filteredSpecial.length > 0}
      <div class="section-title">Speciální signály</div>
      <div class="ref-grid">
        {#each filteredSpecial as entry (entry.key)}
          <div class="ref-card ref-card-special">
            <div class="card-text">
              <span class="card-char special-char">{entry.char}</span>
              <span class="special-name">{entry.name}</span>
            </div>
            <svg class="mini-diagram" viewBox="0 0 48 48" aria-hidden="true">
              {#each SVG_POINTS as pt}
                {#if !entry.pair.includes(pt.index)}
                  <circle cx={pt.x} cy={pt.y} r="2" class="dot-inactive" />
                {/if}
              {/each}
              <circle cx="24" cy="24" r="3" class="dot-center" />
              {#each entry.pair as armIdx}
                {@const pt = SVG_POINTS[armIdx]}
                <line x1="24" y1="24" x2={pt.x} y2={pt.y} class="arm-active special-arm" />
                <circle cx={pt.x} cy={pt.y} r="4" class="dot-active special-dot" />
              {/each}
            </svg>
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
    gap: var(--space-sm);
  }



  .table-scroll {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    overscroll-behavior: contain;
    -webkit-overflow-scrolling: touch;
    display: flex;
    flex-direction: column;
    gap: var(--space-sm);
    padding-bottom: var(--space-lg);
    padding-right: 2px;
  }

  .section-title {
    font-size: var(--text-xs);
    font-weight: 700;
    color: var(--color-text-secondary);
    letter-spacing: 0.8px;
    text-transform: uppercase;
    margin-top: 4px;
    flex-shrink: 0;
  }

  .ref-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(92px, 1fr));
    gap: var(--space-sm);
  }

  @media (min-width: 480px) {
    .ref-grid {
      grid-template-columns: repeat(4, 1fr);
    }
  }

  .ref-card {
    background-color: var(--color-surface-2);
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-md);
    padding: 8px 10px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 6px;
    box-sizing: border-box;
  }

  .ref-card-special {
    grid-column: span 2;
  }

  .card-text {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
  }

  .card-char {
    font-family: var(--font-condensed);
    font-size: var(--text-xl);
    font-weight: 900;
    color: #ffffff;
    line-height: 1.1;
  }

  .card-digit {
    font-family: var(--font-mono);
    font-size: var(--text-xs);
    font-weight: 700;
    color: var(--color-text-secondary);
  }

  .special-char {
    font-size: 16px;
    color: var(--color-accent-warning);
  }

  .special-name {
    font-size: var(--text-2xs);
    color: var(--color-text-muted);
    line-height: 1.2;
    margin-top: 2px;
  }

  .mini-diagram {
    width: 38px;
    height: 38px;
    flex-shrink: 0;
  }

  .dot-inactive {
    fill: rgba(255, 255, 255, 0.15);
  }

  .dot-center {
    fill: #ffffff;
  }

  .arm-active {
    stroke: var(--color-accent-primary);
    stroke-width: 3;
    stroke-linecap: round;
  }

  .dot-active {
    fill: var(--color-accent-primary);
  }

  .special-arm {
    stroke: var(--color-accent-warning);
  }

  .special-dot {
    fill: var(--color-accent-warning);
  }

  .no-results {
    padding: var(--space-xl);
    text-align: center;
    color: var(--color-text-muted);
    font-size: var(--text-sm);
  }
</style>
