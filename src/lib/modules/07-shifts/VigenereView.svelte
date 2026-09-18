<script lang="ts">
  import TranslationCard from '../../components/ui/TranslationCard.svelte';

  interface Props {
    text: string;
    keyText: string;
    resultText: string;
    keyStream: string;
  }

  let { text, keyText, resultText, keyStream }: Props = $props();
</script>

<div class="vigenere-container">
  <div class="output-wrapper">
    <TranslationCard
      text={resultText}
      placeholder="Dešifrovaný text se zobrazí zde..."
    />
  </div>

  {#if text && keyText && keyStream}
    <div class="alignment-ribbon" title="Párování znaků a klíče">
      <span class="ribbon-tag">Klíč:</span>
      <span class="ribbon-stream font-mono">{keyStream.slice(0, 36)}{keyStream.length > 36 ? '…' : ''}</span>
    </div>
  {/if}
</div>

<style>
  .vigenere-container {
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;
    flex: 1;
    min-height: 0;
    gap: var(--space-xs);
  }

  .output-wrapper {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
  }

  .alignment-ribbon {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px var(--space-sm);
    background-color: var(--color-surface-2);
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-sm);
    font-size: 11px;
    color: var(--color-text-muted);
    flex-shrink: 0;
  }

  .ribbon-tag {
    font-weight: 700;
    text-transform: uppercase;
    font-size: 10px;
    color: var(--color-text-secondary);
    letter-spacing: 0.5px;
  }

  .ribbon-stream {
    color: var(--color-accent-primary);
    letter-spacing: 1.5px;
    font-weight: 700;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
</style>
