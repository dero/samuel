<script lang="ts">
  import { CaretDown, ArrowsLeftRight } from 'phosphor-svelte';

  /** Variants row of Čísla: picks the source and target system of the conversion. */
  interface Props {
    sourceShort: string;
    targetShort: string;
    onOpenSourceModal: () => void;
    onOpenTargetModal: () => void;
    onSwapFlow: () => void;
  }

  let { sourceShort, targetShort, onOpenSourceModal, onOpenTargetModal, onSwapFlow }: Props =
    $props();
</script>

<div class="flow-bar">
  <button
    type="button"
    class="flow-btn"
    onclick={onOpenSourceModal}
    aria-label="Nastavit vstupní soustavu"
  >
    <span class="flow-btn-tag">Z:</span>
    <span class="flow-btn-val">{sourceShort}</span>
    <span class="flow-caret"><CaretDown size={14} weight="bold" /></span>
  </button>

  <button
    type="button"
    class="flow-swap-btn"
    onclick={onSwapFlow}
    title="Prohodit vstup a výstup"
    aria-label="Prohodit vstup a výstup"
  >
    <ArrowsLeftRight size={18} weight="bold" />
  </button>

  <button
    type="button"
    class="flow-btn"
    onclick={onOpenTargetModal}
    aria-label="Nastavit cílovou soustavu"
  >
    <span class="flow-btn-tag">DO:</span>
    <span class="flow-btn-val">{targetShort}</span>
    <span class="flow-caret"><CaretDown size={14} weight="bold" /></span>
  </button>
</div>

<style>
  .flow-bar {
    display: grid;
    grid-template-columns: 1fr auto 1fr;
    align-items: center;
    gap: var(--space-xs);
    width: 100%;
    height: var(--subtoolbar-height);
    box-sizing: border-box;
  }

  .flow-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    height: 100%;
    min-width: 0;
    padding: 0 var(--space-sm);
    background-color: var(--color-surface-2);
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-sm);
    overflow: hidden;
    white-space: nowrap;
    box-sizing: border-box;
    transition: background-color 0.12s ease, border-color 0.12s ease;
  }

  .flow-btn:active {
    background-color: var(--color-surface-active);
    border-color: var(--color-accent-primary);
  }

  .flow-btn-tag {
    font-size: var(--text-xs);
    font-weight: 700;
    color: var(--color-text-secondary);
  }

  .flow-btn-val {
    font-family: var(--font-mono);
    font-size: var(--text-sm);
    font-weight: 700;
    color: var(--color-text-primary);
  }

  .flow-caret {
    display: flex;
    align-items: center;
    margin-left: auto;
    color: var(--color-text-secondary);
  }

  .flow-swap-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: var(--subtoolbar-height);
    height: 100%;
    background-color: var(--color-surface-2);
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-sm);
    color: var(--color-text-secondary);
    box-sizing: border-box;
    transition: background-color 0.12s ease, color 0.12s ease;
  }

  .flow-swap-btn:active {
    background-color: var(--color-surface-active);
    color: var(--color-accent-primary);
  }
</style>
