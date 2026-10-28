<script lang="ts" generics="T extends string = string">
  import SegmentedControl from '../ui/SegmentedControl.svelte';
  import RefHelp from './RefHelp.svelte';
  import type { RefHelpData, RefTab, RefTool } from './refTypes';

  /**
   * Unified module reference: data tabs first, "Návod" always last.
   * The first data tab opens by default; with no data tabs only the help is shown
   * and the tab bar is hidden.
   *
   * Multi-tool modules pass `tools`: "Návod" then lists module-wide `help` as
   * "Společné" followed by one block per tool in toolbar order; `activeTool`
   * (the module's current flavour) gets an "aktivní" badge.
   */
  interface Props {
    tabs?: RefTab<T>[];
    help?: RefHelpData;
    tools?: RefTool[];
    activeTool?: string;
    content?: import('svelte').Snippet<[T]>;
  }

  let { tabs = [], help = {}, tools = [], activeTool, content }: Props = $props();

  const HELP_TAB = 'navod';
  type TabId = T | typeof HELP_TAB;

  const initialTab = (): TabId => tabs[0]?.id ?? HELP_TAB;
  let activeTab = $state<TabId>(initialTab());

  let options = $derived([...tabs, { id: HELP_TAB as TabId, label: 'Návod' }]);
  let bodyEl = $state<HTMLDivElement>();

  let hasCommonHelp = $derived(!!(help.controls?.length || help.pitfalls?.length));

  function selectTab(id: TabId) {
    activeTab = id;
    bodyEl?.scrollTo({ top: 0 });
  }
</script>

<div class="ref-layout">
  {#if tabs.length > 0}
    <div class="ref-tabs">
      <SegmentedControl
        {options}
        value={activeTab}
        size="sm"
        ariaLabel="Části reference"
        onChange={selectTab}
      />
    </div>
  {/if}

  <div class="ref-body" bind:this={bodyEl} data-allow-copy>
    {#if activeTab === HELP_TAB}
      {#if tools.length > 0}
        {#if hasCommonHelp}
          <div class="ref-tool-block">
            <h2 class="ref-tool-title">Společné</h2>
            <RefHelp {help} />
          </div>
        {/if}
        {#each tools as tool (tool.id)}
          <div class="ref-tool-block">
            <h2 class="ref-tool-title">
              {tool.label}
              {#if tool.id === activeTool}
                <span class="ref-tool-badge">aktivní</span>
              {/if}
            </h2>
            <RefHelp help={tool.help} />
          </div>
        {/each}
      {:else}
        <RefHelp {help} />
      {/if}
    {:else}
      {@render content?.(activeTab as T)}
    {/if}
  </div>
</div>

<style>
  .ref-layout {
    display: flex;
    flex-direction: column;
    flex: 1;
    height: 100%;
    min-height: 0;
  }

  .ref-tabs {
    flex-shrink: 0;
    padding-bottom: var(--space-md);
  }

  .ref-body {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
    gap: var(--space-xl);
    overflow-y: auto;
    overscroll-behavior: contain;
    -webkit-overflow-scrolling: touch;
    padding-bottom: var(--space-lg);
    color: var(--color-text-primary);
    -webkit-touch-callout: default;
    user-select: text;
    -webkit-user-select: text;
  }

  /* ── Per-tool help blocks ── */

  .ref-tool-block {
    display: flex;
    flex-direction: column;
    gap: var(--space-lg);
  }

  .ref-tool-block + .ref-tool-block {
    padding-top: var(--space-lg);
    border-top: 1px solid var(--color-border-medium);
  }

  .ref-tool-title {
    display: flex;
    align-items: center;
    gap: var(--space-sm);
    margin: 0;
    font-size: var(--text-lg);
    font-weight: 700;
    color: var(--color-text-primary);
  }

  .ref-tool-badge {
    padding: 2px 8px;
    border-radius: var(--radius-full);
    background-color: var(--color-accent-primary-subtle);
    color: var(--color-accent-primary);
    font-size: var(--text-xs);
    font-weight: 700;
  }

  /* ── Shared reference typography (used by module data tabs) ── */

  .ref-body :global(code) {
    padding: 1px 5px;
    border-radius: var(--radius-xs);
    border: 1px solid var(--color-border-subtle);
    background-color: var(--color-surface-2);
    font-family: var(--font-mono);
    font-size: 0.92em;
    color: var(--color-text-primary);
    white-space: nowrap;
  }

  /* ── Shared reference tables (DESIGN_SYSTEM §3: Tabulky) ── */

  .ref-body :global(.ref-table-wrap) {
    overflow-x: auto;
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-sm);
  }

  .ref-body :global(.ref-table) {
    width: 100%;
    border-collapse: collapse;
    font-size: var(--text-sm);
    text-align: left;
  }

  .ref-body :global(.ref-table th),
  .ref-body :global(.ref-table td) {
    padding: 6px var(--space-sm);
    border-bottom: 1px solid var(--color-border-subtle);
    vertical-align: middle;
  }

  .ref-body :global(.ref-table th) {
    background-color: var(--color-surface-2);
    color: var(--color-text-muted);
    font-size: var(--text-xs);
    font-weight: 700;
  }

  .ref-body :global(.ref-table:not(:has(tr.desc-row)) tbody tr:nth-child(even) td) {
    background-color: rgba(255, 255, 255, 0.025);
  }

  .ref-body :global(.ref-table:has(tr.desc-row) tbody tr:nth-child(4n-1) td),
  .ref-body :global(.ref-table:has(tr.desc-row) tbody tr:nth-child(4n) td) {
    background-color: rgba(255, 255, 255, 0.035);
  }

  .ref-body :global(.ref-table tr:has(+ tr.desc-row) td:not([rowspan])) {
    border-bottom: none;
    padding-bottom: 2px;
  }

  .ref-body :global(.ref-table tr.desc-row td) {
    padding-top: 0;
    padding-bottom: var(--space-sm);
    font-size: var(--text-xs);
    line-height: 1.4;
    color: var(--color-text-secondary);
    border-bottom: 1px solid var(--color-border-medium);
  }

  .ref-body :global(.ref-table td[rowspan]) {
    border-bottom: 1px solid var(--color-border-medium);
  }

  .ref-body :global(.ref-table tbody tr:last-child td),
  .ref-body :global(.ref-table tbody tr:nth-last-child(2) td[rowspan]) {
    border-bottom: none;
  }

  .ref-body :global(.ref-table .col-num),
  .ref-body :global(.ref-table .col-val),
  .ref-body :global(.ref-table .col-code) {
    width: 1%;
    white-space: nowrap;
    font-variant-numeric: tabular-nums;
  }

  .ref-body :global(.ref-table td.col-num) {
    text-align: center;
    font-family: var(--font-mono);
    font-weight: 700;
    color: var(--color-accent-primary);
  }

  .ref-body :global(.ref-table td.col-val),
  .ref-body :global(.ref-table td.col-code) {
    font-family: var(--font-mono);
  }

  .ref-body :global(.ref-table td.col-name) {
    font-weight: 600;
    color: var(--color-text-primary);
  }

  .ref-body :global(.ref-table td.is-muted) {
    color: var(--color-text-muted);
  }
</style>
