<script lang="ts">
  import { CaretDown, ArrowsLeftRight } from 'phosphor-svelte';
  import type { DecodeResult } from './numbersSolver';

  interface Props {
    isSourceNumber: boolean;
    isSourceRoman: boolean;
    isSourceChar: boolean;
    isTargetNumber: boolean;
    isTargetRoman: boolean;
    isTargetChar: boolean;
    buffer: string;
    sourceShort: string;
    targetShort: string;
    requiredLength: number;
    autoEnter: boolean;
    lastCharInput: string;
    lastCharOutputStr: string;
    isSourceInputError: boolean;
    decodeCharResult: DecodeResult;
    decodeNumResult: { result: string | null };
    decodeRomanResult: { result: string | null; error?: string };
    onOpenSourceModal: () => void;
    onOpenTargetModal: () => void;
    onSwapFlow: () => void;
  }

  let {
    isSourceNumber,
    isSourceRoman,
    isSourceChar,
    isTargetNumber,
    isTargetRoman,
    isTargetChar,
    buffer,
    sourceShort,
    targetShort,
    requiredLength,
    autoEnter,
    lastCharInput,
    lastCharOutputStr,
    isSourceInputError,
    decodeCharResult,
    decodeNumResult,
    decodeRomanResult,
    onOpenSourceModal,
    onOpenTargetModal,
    onSwapFlow
  }: Props = $props();
</script>

<div class="flow-bar">
  <!-- Vstupní tlačítko -->
  <button
    type="button"
    class="flow-btn"
    class:has-live-val={(isSourceNumber || isSourceRoman) && buffer.length > 0}
    class:is-error={isSourceInputError}
    onclick={onOpenSourceModal}
    aria-label="Nastavit vstupní soustavu"
  >
    <span class="flow-btn-tag">Z:</span>
    {#if (isSourceNumber || isSourceRoman) && buffer.length > 0}
      <span class="flow-val-live font-mono">
        {buffer}
      </span>
      {#if isSourceNumber && isTargetChar && autoEnter}
        <span class="flow-progress">({buffer.length}/{requiredLength})</span>
      {/if}
    {:else if isSourceChar && lastCharInput}
      <span class="flow-char-badge is-valid">{lastCharInput}</span>
    {:else}
      <span class="flow-btn-val">{sourceShort}</span>
    {/if}
    <span class="flow-caret"><CaretDown size={14} weight="bold" /></span>
  </button>

  <!-- Prohodit vstup a výstup -->
  <button
    type="button"
    class="flow-swap-btn"
    onclick={onSwapFlow}
    title="Prohodit vstup a výstup"
    aria-label="Prohodit vstup a výstup"
  >
    <ArrowsLeftRight size={18} weight="bold" />
  </button>

  <!-- Výstupní tlačítko -->
  <button
    type="button"
    class="flow-btn"
    class:has-live-val={((isSourceNumber || isSourceRoman) && buffer.length > 0) || (isSourceChar && !!lastCharOutputStr)}
    class:is-error={(isSourceNumber || isSourceRoman) && ((isTargetChar && (decodeCharResult.status === 'out_of_range' || decodeCharResult.status === 'invalid_digit')) || (isTargetRoman && !decodeRomanResult.result && !!decodeRomanResult.error))}
    onclick={onOpenTargetModal}
    aria-label="Nastavit cílovou soustavu"
  >
    <span class="flow-btn-tag">DO:</span>
    {#if (isSourceNumber || isSourceRoman) && isTargetChar && buffer.length > 0}
      {#if decodeCharResult.status === 'valid'}
        <span class="flow-char-badge is-valid">{decodeCharResult.character}</span>
      {:else if decodeCharResult.status === 'out_of_range' || decodeCharResult.status === 'invalid_digit'}
        <span class="flow-char-badge is-error" title={decodeCharResult.errorText}>Mimo</span>
      {:else}
        <span class="flow-char-badge is-empty">—</span>
      {/if}
    {:else if (isSourceNumber || isSourceRoman) && isTargetNumber && buffer.length > 0}
      <span class="flow-val-live font-mono font-accent">
        {decodeNumResult.result || '—'}
      </span>
    {:else if (isSourceNumber || isSourceRoman) && isTargetRoman && buffer.length > 0}
      {#if decodeRomanResult.result}
        <span class="flow-val-live font-mono font-accent">
          {decodeRomanResult.result}
        </span>
      {:else}
        <span class="flow-char-badge is-error" title={decodeRomanResult.error}>Mimo</span>
      {/if}
    {:else if isSourceChar && (isTargetNumber || isTargetRoman) && lastCharOutputStr}
      <span class="flow-val-live font-mono font-accent">
        {lastCharOutputStr}
      </span>
    {:else}
      <span class="flow-btn-val">{targetShort}</span>
    {/if}
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
    margin: 0;
  }

  .flow-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    background-color: var(--color-surface-2);
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-sm);
    height: 100%;
    padding: 0 var(--space-sm);
    cursor: pointer;
    overflow: hidden;
    white-space: nowrap;
    box-sizing: border-box;
    transition: background-color 0.12s ease, border-color 0.12s ease;
  }

  .flow-btn:active {
    background-color: var(--color-surface-active);
    border-color: var(--color-accent-primary);
  }

  .flow-btn.has-live-val {
    border-color: var(--color-border-medium);
  }

  .flow-btn.is-error {
    border-color: var(--color-accent-danger);
    background-color: var(--color-accent-danger-subtle);
  }

  .flow-btn-tag {
    font-size: var(--text-2xs);
    font-weight: 700;
    color: var(--color-text-secondary);
    text-transform: uppercase;
  }

  .flow-btn-val {
    font-family: var(--font-mono, monospace);
    font-size: var(--text-sm);
    font-weight: 700;
    color: var(--color-accent-primary);
  }

  .flow-val-live {
    font-family: var(--font-mono, monospace);
    font-size: var(--text-sm);
    font-weight: 700;
    color: var(--color-text-primary);
    max-width: 90px;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .font-accent {
    color: var(--color-accent-primary);
  }

  .flow-progress {
    font-size: var(--text-2xs);
    font-family: var(--font-mono, monospace);
    color: var(--color-text-secondary);
  }

  .flow-char-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 22px;
    height: 20px;
    padding: 0 5px;
    border-radius: var(--radius-sm);
    font-family: var(--font-mono, monospace);
    font-size: var(--text-xs);
    font-weight: 800;
    line-height: 1;
  }

  .flow-char-badge.is-valid {
    background-color: var(--color-accent-primary);
    color: var(--color-text-inverse);
    box-shadow: 0 0 6px var(--color-accent-primary-glow);
  }

  .flow-char-badge.is-error {
    background-color: var(--color-accent-danger);
    color: var(--color-text-primary);
    font-size: var(--text-2xs);
  }

  .flow-char-badge.is-empty {
    background-color: var(--color-surface-3);
    color: var(--color-text-muted);
  }

  .flow-caret {
    color: var(--color-text-muted);
    margin-left: auto;
    display: flex;
    align-items: center;
  }

  .flow-swap-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: var(--subtoolbar-height);
    height: 100%;
    border-radius: var(--radius-sm);
    background-color: var(--color-surface-2);
    border: 1px solid var(--color-border-subtle);
    color: var(--color-text-secondary);
    cursor: pointer;
    box-sizing: border-box;
    transition: background-color 0.12s ease, color 0.12s ease, transform 0.1s ease;
  }

  .flow-swap-btn:active {
    background-color: var(--color-surface-active);
    color: var(--color-accent-primary);
    transform: scale(0.94);
  }
</style>
