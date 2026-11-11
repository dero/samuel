<script lang="ts">
  import type { FactArticle } from './factsService';

  /** Body of one article; the detail view of ModuleShell draws the title, ✕ and the scrolling. */
  interface Props {
    article: FactArticle;
  }

  let { article }: Props = $props();
</script>

<article class="article" data-allow-copy>
  <p class="article-category">{article.category}</p>

  <div class="markdown-body">
    {@html article.html}
  </div>
</article>

<style>
  .article {
    color: var(--color-text-primary);
  }

  .article-category {
    margin: 0 0 var(--space-sm);
    font-size: var(--text-xs);
    font-weight: 700;
    letter-spacing: 0.3px;
    text-transform: uppercase;
    color: var(--color-text-muted);
  }

  /* Markdown body typography */
  .markdown-body {
    font-size: var(--text-sm);
    line-height: 1.6;
    color: var(--color-text-primary);
  }

  .markdown-body :global(h2) {
    font-size: var(--text-base);
    font-weight: 700;
    margin: var(--space-md) 0 var(--space-xs);
    color: var(--color-text-primary);
    border-bottom: 1px solid var(--color-border-subtle);
    padding-bottom: 4px;
  }

  .markdown-body :global(h3) {
    font-size: var(--text-sm);
    font-weight: 700;
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
    font-size: var(--text-xs);
    background-color: var(--color-surface-2);
    border: 1px solid var(--color-border-subtle);
    padding: 1px 5px;
    border-radius: var(--radius-xs);
    color: var(--color-text-primary);
  }

  /* Table styles */
  .markdown-body :global(table) {
    width: 100%;
    border-collapse: collapse;
    margin: var(--space-sm) 0 var(--space-md);
    font-size: var(--text-sm);
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
    font-size: var(--text-xs);
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
    font-size: var(--text-sm);
    font-weight: 700;
    color: var(--color-text-secondary);
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
    font-size: var(--text-xs);
    color: var(--color-text-primary);
    padding: 6px 6px;
  }

  .markdown-body :global(td.col-val small) {
    display: block;
    font-size: var(--text-xs);
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
    font-size: var(--text-xs);
  }

  .markdown-body :global(td.col-code code) {
    font-size: var(--text-xs);
    padding: 0;
    background: none;
    border: none;
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
    font-size: var(--text-xs);
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

  /* Inline colour swatches (the colour itself is content) and plate badges */
  .markdown-body :global(.color-dot) {
    display: inline-block;
    width: 9px;
    height: 9px;
    border-radius: 50%;
    margin-right: 6px;
    vertical-align: middle;
    border: 1px solid var(--color-border-medium);
    flex-shrink: 0;
  }

  .markdown-body :global(.badge-spz) {
    display: inline-block;
    font-family: var(--font-mono);
    font-weight: 700;
    font-size: var(--text-xs);
    padding: 1px 5px;
    background-color: var(--color-surface-2);
    border: 1px solid var(--color-border-medium);
    border-radius: var(--radius-xs);
    color: var(--color-text-primary);
    white-space: nowrap;
  }
</style>
