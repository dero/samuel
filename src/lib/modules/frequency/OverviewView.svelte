<script lang="ts">
  import ScrollArea from '../../components/ui/ScrollArea.svelte';
  import { CZECH_27_UNACCENTED_FREQUENCIES, CZECH_VOWELS } from './frequencyData';
  import type { FrequencyOverviewResult } from './frequencySolver';

  interface Props {
    analysis: FrequencyOverviewResult;
    sortBy: 'freq' | 'alpha';
    alphabetSize: number;
  }

  let { analysis, sortBy, alphabetSize }: Props = $props();

  const MAX_NGRAMS = 15;
  const CZECH_VOWEL_SHARE = Math.round(
    CZECH_VOWELS.reduce((sum, v) => sum + (CZECH_27_UNACCENTED_FREQUENCIES[v] ?? 0), 0)
  );
  const CZECH_CONSONANT_SHARE = 100 - CZECH_VOWEL_SHARE;

  const sortedChars = $derived.by(() => {
    const list = [...analysis.charCounts];
    if (sortBy === 'freq') {
      list.sort((a, b) =>
        b.count !== a.count ? b.count - a.count : a.alphabetIndex - b.alphabetIndex
      );
    } else {
      list.sort((a, b) => a.alphabetIndex - b.alphabetIndex);
    }
    return list;
  });

  const shownBigrams = $derived(analysis.bigrams.slice(0, MAX_NGRAMS));
  const shownTrigrams = $derived(analysis.trigrams.slice(0, MAX_NGRAMS));

  const totalDoubles = $derived(
    analysis.doubles.reduce((sum, item) => sum + item.count, 0)
  );

  const uniformWordLen = $derived.by(() => {
    if (analysis.wordLengths.length === 1 && analysis.totalWords > 1) {
      return analysis.wordLengths[0].length;
    }
    return null;
  });

  function formatWordsCount(n: number): string {
    if (n === 1) return '1 slovo';
    if (n >= 2 && n <= 4) return `${n} slova`;
    return `${n} slov`;
  }

  function formatSentencesCount(n: number): string {
    if (n === 1) return '1 věta';
    if (n >= 2 && n <= 4) return `${n} věty`;
    return `${n} vět`;
  }
</script>

<div class="overview-frame" data-allow-copy>
  <ScrollArea class="overview-scroll" outset="var(--space-xs)">
    <div class="overview-sections">
      <!-- 1. Znaky abecedy -->
      <section class="overview-section">
        <header class="section-header">
          <h3 class="section-title">Znaky abecedy</h3>
          <span class="section-meta font-mono">
            {analysis.uniqueAlphabetChars}/{alphabetSize} · {analysis.totalAlphabetChars} celkem
          </span>
        </header>

        <div class="char-grid">
          {#each sortedChars as item (item.char)}
            <div class="stat-cell" class:is-zero={item.count === 0}>
              <span class="cell-key font-mono">{item.char}</span>
              <span class="cell-val font-mono">{item.count}</span>
            </div>
          {/each}
        </div>
      </section>

      <!-- 2. Mimo abecedu -->
      {#if analysis.outsideChars.length > 0}
        <section class="overview-section">
          <header class="section-header">
            <h3 class="section-title">Mimo abecedu</h3>
            <span class="section-meta font-mono">{analysis.totalOutsideChars} celkem</span>
          </header>

          <div class="char-grid">
            {#each analysis.outsideChars as item (item.char)}
              <div class="stat-cell">
                <span class="cell-key font-mono">{item.char}</span>
                <span class="cell-val font-mono">{item.count}</span>
              </div>
            {/each}
          </div>
        </section>
      {/if}

      <!-- 3. Samohlásky vs. souhlásky -->
      {#if analysis.vowelConsonant.letterTotal > 0}
        {@const vc = analysis.vowelConsonant}
        <section class="overview-section">
          <header class="section-header">
            <h3 class="section-title">Samohlásky a souhlásky</h3>
            <span class="section-meta">
              Čeština ~{CZECH_VOWEL_SHARE} : {CZECH_CONSONANT_SHARE} %
            </span>
          </header>

          <div class="split-cards">
            <div class="split-card">
              <span class="split-label">Samohlásky</span>
              <span class="split-values font-mono">
                <strong class="split-count">{vc.vowels}</strong>
                <span class="split-pct">{vc.vowelPct} %</span>
              </span>
            </div>
            <div class="split-card">
              <span class="split-label">Souhlásky</span>
              <span class="split-values font-mono">
                <strong class="split-count">{vc.consonants}</strong>
                <span class="split-pct">{vc.consonantPct} %</span>
              </span>
            </div>
          </div>

          <div class="split-bar" aria-hidden="true">
            <div class="split-bar-vowels" style:width="{vc.vowelPct}%"></div>
          </div>
        </section>
      {/if}

      <!-- 4. Délky slov -->
      {#if analysis.wordLengths.length > 0}
        <section class="overview-section">
          <header class="section-header">
            <h3 class="section-title">Délky slov</h3>
            <span class="section-meta font-mono">
              {#if uniformWordLen !== null}
                všechna {uniformWordLen} zn. ({analysis.totalWords}×)
              {:else}
                {formatWordsCount(analysis.totalWords)}
              {/if}
            </span>
          </header>

          <div class="wide-cell-grid">
            {#each analysis.wordLengths as item (item.length)}
              <div class="stat-cell stat-cell-wide">
                <span class="cell-key font-mono">{item.length} zn.</span>
                <span class="cell-val font-mono">{item.count}×</span>
              </div>
            {/each}
          </div>
        </section>
      {/if}

      <!-- 5. Bigramy (nejčastější opakované) -->
      {#if shownBigrams.length > 0}
        <section class="overview-section">
          <header class="section-header">
            <h3 class="section-title">Nejčastější bigramy</h3>
            {#if analysis.bigrams.length > MAX_NGRAMS}
              <span class="section-meta font-mono">top {MAX_NGRAMS} z {analysis.bigrams.length}</span>
            {:else}
              <span class="section-meta">opakované (≥ 2×)</span>
            {/if}
          </header>

          <div class="wide-cell-grid">
            {#each shownBigrams as item (item.text)}
              <div class="stat-cell stat-cell-wide">
                <span class="cell-key font-mono">{item.text}</span>
                <span class="cell-val font-mono">{item.count}×</span>
              </div>
            {/each}
          </div>
        </section>
      {/if}

      <!-- 6. Trigramy (nejčastější opakované) -->
      {#if shownTrigrams.length > 0}
        <section class="overview-section">
          <header class="section-header">
            <h3 class="section-title">Nejčastější trigramy</h3>
            {#if analysis.trigrams.length > MAX_NGRAMS}
              <span class="section-meta font-mono">top {MAX_NGRAMS} z {analysis.trigrams.length}</span>
            {:else}
              <span class="section-meta">opakované (≥ 2×)</span>
            {/if}
          </header>

          <div class="wide-cell-grid">
            {#each shownTrigrams as item (item.text)}
              <div class="stat-cell stat-cell-wide">
                <span class="cell-key font-mono">{item.text}</span>
                <span class="cell-val font-mono">{item.count}×</span>
              </div>
            {/each}
          </div>
        </section>
      {/if}

      <!-- 7. Zdvojená písmena -->
      {#if analysis.doubles.length > 0}
        <section class="overview-section">
          <header class="section-header">
            <h3 class="section-title">Zdvojená písmena</h3>
            <span class="section-meta font-mono">{totalDoubles}× celkem</span>
          </header>

          <div class="wide-cell-grid">
            {#each analysis.doubles as item (item.text)}
              <div class="stat-cell stat-cell-wide">
                <span class="cell-key font-mono">{item.text}</span>
                <span class="cell-val font-mono">{item.count}×</span>
              </div>
            {/each}
          </div>
        </section>
      {/if}

      <!-- 8. Věty (pouze pokud je vstup více vět) -->
      {#if analysis.sentences.length > 1}
        <section class="overview-section">
          <header class="section-header">
            <h3 class="section-title">Věty</h3>
            <span class="section-meta font-mono">{formatSentencesCount(analysis.sentences.length)}</span>
          </header>

          <div class="sentence-grid">
            {#each analysis.sentences as s (s.index)}
              <div class="sentence-card">
                <span class="sentence-index font-mono">V{s.index}</span>
                <span class="sentence-metrics font-mono">
                  {formatWordsCount(s.wordCount)} · {s.charCount} zn.
                </span>
              </div>
            {/each}
          </div>
        </section>
      {/if}
    </div>
  </ScrollArea>
</div>

<style>
  .overview-frame {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
    background-color: var(--color-bg-canvas);
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-sm);
    padding: var(--space-sm);
    overflow: hidden;
    box-sizing: border-box;
  }

  .overview-frame :global(.overview-scroll) {
    flex: 1;
    min-height: 0;
  }

  .overview-sections {
    display: flex;
    flex-direction: column;
    gap: var(--space-md);
    padding-bottom: var(--space-xs);
  }

  .overview-section {
    display: flex;
    flex-direction: column;
    gap: var(--space-xs);
  }

  .section-header {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: var(--space-sm);
  }

  .section-title {
    margin: 0;
    font-size: var(--text-xs);
    font-weight: 700;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    color: var(--color-text-secondary);
  }

  .section-meta {
    font-size: var(--text-xs);
    color: var(--color-text-muted);
    white-space: nowrap;
  }

  .char-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(42px, 1fr));
    gap: var(--space-xs);
  }

  .wide-cell-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(60px, 1fr));
    gap: var(--space-xs);
  }

  .stat-cell {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: var(--space-2xs);
    min-height: 44px;
    padding: var(--space-xs) var(--space-2xs);
    background-color: var(--color-surface-1);
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-xs);
    box-sizing: border-box;
  }

  .stat-cell-wide {
    min-height: 42px;
    padding: var(--space-xs);
  }

  .stat-cell.is-zero .cell-key,
  .stat-cell.is-zero .cell-val {
    opacity: 0.35;
    color: var(--color-text-muted);
  }

  .cell-key {
    font-size: var(--text-sm);
    font-weight: 700;
    line-height: 1.1;
    color: var(--color-text-primary);
  }

  .cell-val {
    font-size: var(--text-xs);
    font-weight: 700;
    line-height: 1.1;
    color: var(--color-accent-primary);
    font-variant-numeric: tabular-nums;
  }

  .split-cards {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--space-xs);
  }

  .split-card {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: var(--space-xs);
    padding: var(--space-sm);
    background-color: var(--color-surface-1);
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-xs);
  }

  .split-label {
    font-size: var(--text-xs);
    color: var(--color-text-secondary);
  }

  .split-values {
    display: inline-flex;
    align-items: baseline;
    gap: var(--space-xs);
  }

  .split-count {
    font-size: var(--text-base);
    font-weight: 700;
    color: var(--color-text-primary);
  }

  .split-pct {
    font-size: var(--text-xs);
    color: var(--color-accent-primary);
  }

  .split-bar {
    height: 4px;
    width: 100%;
    background-color: var(--color-surface-3);
    border-radius: var(--radius-full);
    overflow: hidden;
  }

  .split-bar-vowels {
    height: 100%;
    background-color: var(--color-accent-primary);
    transition: width 0.15s ease-out;
  }

  .sentence-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(136px, 1fr));
    gap: var(--space-xs);
  }

  .sentence-card {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-xs);
    padding: var(--space-xs) var(--space-sm);
    background-color: var(--color-surface-1);
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-xs);
  }

  .sentence-index {
    font-size: var(--text-xs);
    font-weight: 700;
    color: var(--color-accent-primary);
  }

  .sentence-metrics {
    font-size: var(--text-xs);
    color: var(--color-text-primary);
    font-variant-numeric: tabular-nums;
  }
</style>
