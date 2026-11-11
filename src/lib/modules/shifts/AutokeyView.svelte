<script lang="ts">
  import TranslationCard from '../../components/ui/TranslationCard.svelte';

  interface Props {
    text: string;
    primerText: string;
    resultText: string;
    keyStream: string;
  }

  let { text, primerText, resultText, keyStream }: Props = $props();
</script>

<div class="autokey-container">
  <div class="output-wrapper">
    <TranslationCard text={resultText} />
  </div>

  {#if text && primerText && keyStream}
    <div class="alignment-ribbon" title="Průběh samoposuvného klíče">
      <span class="ribbon-tag">Klíč:</span>
      <span class="ribbon-stream font-mono">{keyStream.slice(0, 36)}{keyStream.length > 36 ? '…' : ''}</span>
    </div>
  {/if}
</div>

<style>
  .autokey-container {
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
    font-size: var(--text-xs);
    color: var(--color-text-muted);
    flex-shrink: 0;
  }

  .ribbon-tag {
    font-weight: 700;
    text-transform: uppercase;
    font-size: var(--text-xs);
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
