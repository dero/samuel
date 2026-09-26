<script lang="ts">
  import type { FactArticle } from './factsService';
  import { settings } from '../../state/settings.svelte';
  import { ArrowLeft, BookOpen } from 'phosphor-svelte';

  interface Props {
    article: FactArticle;
    onBack: () => void;
  }

  let { article, onBack }: Props = $props();
  let scrollContainer = $state<HTMLElement | null>(null);

  $effect(() => {
    if (article && scrollContainer) {
      scrollContainer.scrollTop = 0;
    }
  });

  function handleBack() {
    settings.vibrate(20);
    onBack();
  }
</script>

<div class="article-viewer" data-allow-copy>
  <!-- Top navigation bar -->
  <header class="article-header-bar">
    <button
      type="button"
      class="back-btn"
      onclick={handleBack}
      aria-label="Zpět na vyhledávání faktů"
    >
      <ArrowLeft size={18} weight="bold" />
      <span class="back-text">Zpět k hledání</span>
    </button>
    <div class="article-category-badge">
      <BookOpen size={13} weight="bold" />
      <span>{article.category}</span>
    </div>
  </header>

  <!-- Scrollable article content (max height) -->
  <main class="article-scroll-container" bind:this={scrollContainer}>
    <div class="article-content-wrapper">
      <h1 class="article-title">{article.title}</h1>

      <div class="markdown-body">
        {@html article.html}
      </div>
    </div>
  </main>
</div>

<style>
  .article-viewer {
    display: flex;
    flex-direction: column;
    height: 100%;
    width: 100%;
    overflow: hidden;
    background-color: var(--color-bg-canvas);
    color: var(--color-text-primary);
  }

  .article-header-bar {
    flex-shrink: 0;
    height: 44px;
    padding: 0 var(--space-sm);
    display: flex;
    align-items: center;
    justify-content: space-between;
    background-color: var(--color-bg-surface);
    border-bottom: 1px solid var(--color-border-subtle);
    gap: var(--space-sm);
  }

  .back-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background: transparent;
    border: none;
    color: var(--color-accent-primary);
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    padding: 6px 4px;
    border-radius: var(--radius-xs);
    transition: opacity 0.12s;
  }

  .back-btn:active {
    opacity: 0.7;
  }

  .article-category-badge {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: 11px;
    font-weight: 600;
    color: var(--color-text-secondary);
    background-color: var(--color-surface-2);
    padding: 3px 8px;
    border-radius: var(--radius-full, 9999px);
    border: 1px solid var(--color-border-subtle);
  }

  .article-scroll-container {
    flex: 1;
    overflow-y: auto;
    overscroll-behavior: contain;
    padding: var(--space-md);
    -webkit-overflow-scrolling: touch;
  }

  .article-content-wrapper {
    max-width: 680px;
    margin: 0 auto;
    padding-bottom: var(--space-xl);
  }

  .article-title {
    font-size: 20px;
    font-weight: 700;
    line-height: 1.25;
    color: var(--color-text-primary);
    margin: 0 0 var(--space-md) 0;
  }

  /* Markdown body typography */
  .markdown-body {
    font-size: 14px;
    line-height: 1.6;
    color: var(--color-text-primary);
  }

  .markdown-body :global(h2) {
    font-size: 17px;
    font-weight: 700;
    margin: var(--space-md) 0 var(--space-xs);
    color: var(--color-text-primary);
    border-bottom: 1px solid var(--color-border-subtle);
    padding-bottom: 4px;
  }

  .markdown-body :global(h3) {
    font-size: 15px;
    font-weight: 600;
    margin: var(--space-md) 0 var(--space-xs);
    color: var(--color-text-primary);
  }

  .markdown-body :global(p) {
    margin: 0 0 var(--space-sm) 0;
  }

  .markdown-body :global(ul),
  .markdown-body :global(ol) {
    margin: 0 0 var(--space-sm) 0;
    padding-left: 20px;
  }

  .markdown-body :global(li) {
    margin-bottom: 4px;
  }

  .markdown-body :global(strong) {
    color: var(--color-text-primary);
    font-weight: 700;
  }

  .markdown-body :global(code) {
    font-family: var(--font-mono);
    font-size: 12.5px;
    background-color: var(--color-surface-2);
    border: 1px solid var(--color-border-subtle);
    padding: 1px 5px;
    border-radius: 3px;
    color: var(--color-accent-primary);
  }

  /* Table styles */
  .markdown-body :global(table) {
    width: 100%;
    border-collapse: collapse;
    margin: var(--space-sm) 0 var(--space-md);
    font-size: 12.5px;
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-sm);
    overflow: hidden;
  }

  .markdown-body :global(th),
  .markdown-body :global(td) {
    padding: 6px 8px;
    text-align: left;
    border-bottom: 1px solid var(--color-border-subtle);
    border-right: 1px solid var(--color-border-subtle);
    vertical-align: middle;
  }

  .markdown-body :global(th:last-child),
  .markdown-body :global(td:last-child) {
    border-right: none;
  }

  .markdown-body :global(th) {
    background-color: var(--color-surface-2);
    color: var(--color-text-secondary);
    font-weight: 700;
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    border-bottom: 1px solid var(--color-border-medium);
  }

  /* Specific column modifier classes */
  .markdown-body :global(th.col-num),
  .markdown-body :global(td.col-num) {
    text-align: center;
    width: 1%;
    white-space: nowrap;
    padding-left: 8px;
    padding-right: 8px;
  }

  .markdown-body :global(td.col-num) {
    font-family: var(--font-mono);
    font-size: 13.5px;
    font-weight: 700;
    color: var(--color-accent-primary);
    background-color: rgba(255, 255, 255, 0.015);
    vertical-align: middle;
  }

  .markdown-body :global(th.col-val),
  .markdown-body :global(td.col-val) {
    text-align: center;
    width: 1%;
    white-space: nowrap;
    font-family: var(--font-mono);
    font-variant-numeric: tabular-nums;
  }

  .markdown-body :global(td.col-val) {
    font-size: 12px;
    color: var(--color-text-primary);
    padding: 6px 6px;
  }

  .markdown-body :global(td.col-val small) {
    display: block;
    font-size: 10px;
    color: var(--color-text-muted);
    line-height: 1.25;
    margin-top: 1px;
  }

  .markdown-body :global(th.col-name),
  .markdown-body :global(td.col-name) {
    font-weight: 600;
    color: var(--color-text-primary);
  }

  .markdown-body :global(th.col-code),
  .markdown-body :global(td.col-code) {
    width: 1%;
    white-space: nowrap;
    font-family: var(--font-mono);
    font-size: 11.5px;
  }

  .markdown-body :global(td.col-code code) {
    font-size: 11.5px;
    padding: 0;
    background: none;
    border: none;
    color: var(--color-accent-primary);
  }

  /* Standard zebra striping for tables without desc-row */
  .markdown-body :global(table:not(:has(tr.desc-row)) tbody tr:nth-child(even) td) {
    background-color: rgba(255, 255, 255, 0.025);
  }

  /* Grouped zebra striping for tables with 2-row records (every 2nd record pair) */
  .markdown-body :global(table:has(tr.desc-row) tbody tr:nth-child(4n-1) td),
  .markdown-body :global(table:has(tr.desc-row) tbody tr:nth-child(4n) td) {
    background-color: rgba(255, 255, 255, 0.035);
  }

  /* Seamless connection between header row and desc-row within the same record */
  .markdown-body :global(tr:has(+ tr.desc-row) td:not([rowspan])) {
    border-bottom: none;
    padding-bottom: 2px;
  }

  /* Description row attached under data cells */
  .markdown-body :global(tr.desc-row td) {
    color: var(--color-text-secondary);
    font-size: 11.5px;
    line-height: 1.45;
    padding-top: 2px;
    padding-bottom: 8px;
    border-top: none;
    border-bottom: 1px solid var(--color-border-medium);
  }

  /* Distinct bottom record divider on rowspan anchor cell */
  .markdown-body :global(td[rowspan]) {
    border-bottom: 1px solid var(--color-border-medium);
  }

  /* Clean end of table */
  .markdown-body :global(tbody tr:last-child td),
  .markdown-body :global(tbody tr:nth-last-child(2) td[rowspan]) {
    border-bottom: none;
  }

  /* Inline color swatches and badges */
  .markdown-body :global(.color-dot) {
    display: inline-block;
    width: 9px;
    height: 9px;
    border-radius: 50%;
    margin-right: 6px;
    vertical-align: middle;
    border: 1px solid rgba(255, 255, 255, 0.2);
    flex-shrink: 0;
  }

  .markdown-body :global(.badge-spz) {
    display: inline-block;
    font-family: var(--font-mono);
    font-weight: 700;
    font-size: 11.5px;
    padding: 1px 5px;
    background-color: var(--color-surface-2);
    border: 1px solid var(--color-border-subtle);
    border-radius: 3px;
    color: var(--color-accent-primary);
    white-space: nowrap;
  }
</style>
