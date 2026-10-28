<script lang="ts">
  import RefText from './RefText.svelte';

  interface Props {
    title: string;
    /** Optional one-line note under the heading (supports `code`). */
    note?: string;
    children?: import('svelte').Snippet;
  }

  let { title, note, children }: Props = $props();
</script>

<section class="ref-section">
  <h3 class="ref-section-title">{title}</h3>
  {#if note}
    <p class="ref-section-note"><RefText text={note} /></p>
  {/if}
  {@render children?.()}
</section>

<style>
  .ref-section {
    display: flex;
    flex-direction: column;
    gap: var(--space-sm);
  }

  .ref-section-title {
    margin: 0;
    font-size: var(--text-xs);
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--color-text-muted);
  }

  .ref-section-note {
    margin: 0;
    font-size: var(--text-sm);
    line-height: 1.45;
    color: var(--color-text-secondary);
  }
</style>
