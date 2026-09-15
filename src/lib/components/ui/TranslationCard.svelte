<script lang="ts">
  import { tick } from 'svelte';
  import { Copy } from 'phosphor-svelte';
  import { copyToClipboard } from '../../utils/clipboard';
  import Badge from './Badge.svelte';

  interface Props {
    text: string;
    label?: string;
    placeholder?: string;
    showBadges?: boolean;
    class?: string;
  }

  let {
    text = '',
    label = 'PŘEKLAD',
    placeholder = 'Zde se zobrazí přeložený text...',
    showBadges = true,
    class: customClass = ''
  }: Props = $props();

  let textEl = $state<HTMLDivElement | null>(null);

  let charCount = $derived(text.replace(/\s/g, '').length);
  let wordCount = $derived(text.trim() ? text.trim().split(/\s+/).length : 0);

  $effect(() => {
    // When text changes, auto-scroll to the bottom of the container
    if (text && textEl) {
      tick().then(() => {
        if (textEl) {
          textEl.scrollTop = textEl.scrollHeight;
        }
      });
    }
  });

  async function handleCopy() {
    if (!text.trim()) return;
    await copyToClipboard(text);
  }
</script>

<div class="output-container {customClass}">
  <!-- Decoded Text Card (1-tap copy) -->
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div
    class="result-card"
    class:is-clickable={text.trim().length > 0}
    onclick={handleCopy}
    title="Klepnutím zkopírujete do schránky"
  >
    <div class="result-header">
      <span class="result-label">{label}</span>
      <div class="result-badges">
        {#if showBadges && charCount > 0}
          <Badge variant="neutral">
            {charCount} {charCount === 1 ? 'znak' : charCount < 5 ? 'znaky' : 'znaků'}
          </Badge>
          <Badge variant="neutral">
            {wordCount} {wordCount === 1 ? 'slovo' : wordCount < 5 ? 'slova' : 'slov'}
          </Badge>
        {/if}
        {#if text.trim().length > 0}
          <span class="copy-hint"><Copy size={13} weight="bold" /> Kopírovat</span>
        {/if}
      </div>
    </div>

    <div
      bind:this={textEl}
      class="result-text"
      class:empty={!text.trim()}
    >
      {text || placeholder}
    </div>
  </div>
</div>

<style>
  .output-container {
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;
    flex: 1;
    min-height: 0;
    position: relative;
  }

  .result-card {
    background-color: var(--color-surface-1);
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-md);
    padding: var(--space-sm) var(--space-md);
    display: flex;
    flex-direction: column;
    gap: var(--space-xs);
    flex: 1;
    min-height: var(--output-min-height);
    overflow: hidden;
    transition: border-color 0.15s ease, background-color 0.15s ease;
    user-select: text;
    box-sizing: border-box;
  }

  .result-card.is-clickable {
    cursor: pointer;
  }

  .result-card.is-clickable:active {
    background-color: var(--color-surface-active);
    border-color: var(--color-border-focus);
  }

  .result-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-shrink: 0;
  }

  .result-label {
    font-size: var(--text-xs);
    font-weight: 700;
    color: var(--color-text-secondary);
    letter-spacing: 0.8px;
  }

  .result-badges {
    display: flex;
    align-items: center;
    gap: var(--space-xs);
  }

  .copy-hint {
    font-size: var(--text-xs);
    font-weight: 600;
    color: var(--color-accent-primary);
    display: inline-flex;
    align-items: center;
    gap: 4px;
    margin-left: var(--space-xs);
  }

  .result-text {
    font-family: var(--font-mono);
    font-size: clamp(18px, 2.7vh, 24px);
    font-weight: 700;
    color: var(--color-text-primary);
    line-height: 1.35;
    overflow-y: auto;
    word-break: break-word;
    flex: 1;
  }

  .result-text.empty {
    color: var(--color-text-muted);
    font-family: var(--font-sans);
    font-size: var(--text-sm);
    font-weight: 400;
  }
</style>
