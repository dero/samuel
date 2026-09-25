<script lang="ts">
  import SegmentedControl, { type SegmentOption } from '../../components/ui/SegmentedControl.svelte';
  import { PencilSimple, ClipboardText, ArrowRight, X } from 'phosphor-svelte';

  interface Props {
    sortBy: 'freq' | 'alpha';
    rawText: string;
    onSortChange: (sort: 'freq' | 'alpha') => void;
    onOpenEditor: () => void;
    onClearText: () => void;
    onPasteText: () => void;
    onTransferToSubstitution: () => void;
  }

  let {
    sortBy,
    rawText,
    onSortChange,
    onOpenEditor,
    onClearText,
    onPasteText,
    onTransferToSubstitution
  }: Props = $props();

  const SORT_SEGMENT_OPTIONS: SegmentOption<'freq' | 'alpha'>[] = [
    { id: 'freq', label: 'Podle četnosti ▾' },
    { id: 'alpha', label: 'Abecedně (A–Z)' }
  ];
</script>

<div class="zone-input-flow">
  <!-- 1. Sub-Toolbar: Sort segmented control (36 px) -->
  <div class="subtoolbar-container">
    <SegmentedControl
      options={SORT_SEGMENT_OPTIONS}
      value={sortBy}
      size="sm"
      onChange={onSortChange}
      ariaLabel="Řazení frekvenční analýzy"
    />
  </div>

  <!-- 2. Single-line Input Row (42 px) - Click opens TextEntrySheet, never inline keyboard -->
  <div class="input-row">
    <button
      type="button"
      class="cipher-input-trigger font-mono"
      onclick={onOpenEditor}
      title="Klepnutím zadat nebo upravit šifrový text"
      aria-label="Klepnutím zadat nebo upravit šifrový text"
    >
      {#if rawText}
        <span class="trigger-text">{rawText}</span>
      {:else}
        <span class="trigger-placeholder">Klepnutím zadat text...</span>
      {/if}
    </button>
    {#if rawText}
      <button
        type="button"
        class="input-clear-btn"
        onclick={onClearText}
        title="Vymazat text"
        aria-label="Vymazat text"
      >
        <X size={15} weight="bold" />
      </button>
    {/if}
    <button
      type="button"
      class="input-sheet-btn"
      onclick={onOpenEditor}
      title="Otevřít textový editor"
      aria-label="Otevřít textový editor"
    >
      <PencilSimple size={16} weight="bold" />
    </button>
    <button
      type="button"
      class="input-paste-btn"
      onclick={onPasteText}
      title="Vložit text ze schránky"
      aria-label="Vložit text ze schránky"
    >
      <ClipboardText size={17} weight="bold" />
    </button>
  </div>

  <!-- 3. Bottom Action Row: Transfer text to Substitution -->
  <div class="bottom-actions-row">
    <button
      type="button"
      class="action-transfer-btn primary"
      onclick={onTransferToSubstitution}
      disabled={!rawText.trim()}
      title="Přenést text přímo do modulu Substituce"
    >
      <span>Přenést do Substituce</span>
      <ArrowRight size={15} weight="bold" />
    </button>
  </div>
</div>

<style>
  .zone-input-flow {
    display: flex;
    flex-direction: column;
    gap: var(--zone-input-gap, 8px);
    width: 100%;
    box-sizing: border-box;
  }

  .subtoolbar-container {
    height: 36px;
    display: flex;
    align-items: center;
    overflow: hidden;
    flex-shrink: 0;
  }

  /* Single-line Input Row */
  .input-row {
    display: flex;
    align-items: center;
    gap: 4px;
    width: 100%;
    min-height: 42px;
    height: 42px;
    background-color: var(--color-surface-2);
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-sm);
    padding: 3px 6px;
    box-sizing: border-box;
    transition: border-color 0.12s ease;
  }

  .input-row:focus-within {
    border-color: var(--color-border-focus);
    box-shadow: 0 0 8px rgba(0, 210, 255, 0.15);
  }

  .cipher-input-trigger {
    flex: 1;
    min-width: 0;
    height: 100%;
    background: transparent;
    border: none;
    outline: none;
    display: flex;
    align-items: center;
    text-align: left;
    padding: 0 4px;
    cursor: pointer;
    overflow: hidden;
  }

  .font-mono {
    font-family: var(--font-mono, monospace);
  }

  .trigger-text {
    color: var(--color-text-primary);
    font-size: var(--text-base);
    font-weight: 700;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    letter-spacing: 0.5px;
  }

  .trigger-placeholder {
    color: var(--color-text-muted);
    font-size: var(--text-sm);
    font-family: var(--font-sans);
    font-weight: 400;
  }

  .input-clear-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    background: transparent;
    border: none;
    color: var(--color-text-muted);
    cursor: pointer;
    border-radius: var(--radius-xs);
    flex-shrink: 0;
    transition: color 0.1s ease, background-color 0.1s ease;
  }

  .input-clear-btn:hover {
    color: var(--color-text-primary);
    background-color: var(--color-surface-3);
  }

  .input-sheet-btn,
  .input-paste-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 34px;
    height: 34px;
    background-color: var(--color-surface-3);
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-xs);
    color: var(--color-text-secondary);
    cursor: pointer;
    flex-shrink: 0;
    transition: background-color 0.1s ease, color 0.1s ease, transform 0.08s ease;
  }

  .input-sheet-btn:hover,
  .input-paste-btn:hover {
    color: var(--color-accent-primary);
    background-color: var(--color-surface-active);
  }

  .input-sheet-btn:active,
  .input-paste-btn:active {
    transform: scale(0.96);
  }

  .bottom-actions-row {
    display: flex;
    gap: 8px;
    height: 38px;
    flex-shrink: 0;
  }

  .action-transfer-btn {
    flex: 1;
    appearance: none;
    border: 1px solid rgba(255, 255, 255, 0.15);
    background-color: var(--color-surface-3);
    color: var(--color-accent-primary);
    border-radius: var(--radius-sm);
    font-size: 13px;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    cursor: pointer;
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.1);
    transition: background-color 0.1s ease, transform 0.08s ease;
  }

  .action-transfer-btn:active:not(:disabled) {
    transform: scale(0.98);
  }

  .action-transfer-btn:disabled {
    opacity: 0.48;
    cursor: not-allowed;
  }
</style>
