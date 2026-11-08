<script lang="ts">
  import { FileText } from 'phosphor-svelte';
  import type { PodkladConfig } from '../../state/podklad.svelte';

  interface Props {
    config: PodkladConfig;
  }

  let { config }: Props = $props();
</script>

<!-- Podklad phase, ZONE-OUTPUT: what the module expects, seated right above the methods -->
<div class="podklad-intro">
  <h2 class="intro-title">
    <FileText size={20} weight="duotone" />
    <span>{config.title}</span>
  </h2>
  <p class="intro-desc">{config.description}</p>
  {#if config.example}
    <p class="intro-desc">Např. <code>{config.example}</code></p>
  {/if}
</div>

<style>
  .podklad-intro {
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    gap: var(--space-sm);
    height: 100%;
    padding: var(--space-sm) var(--space-xs);
    box-sizing: border-box;
    overflow-y: auto;
  }

  .intro-title {
    display: flex;
    align-items: center;
    gap: var(--space-sm);
    margin: 0;
    font-size: var(--text-base);
    font-weight: 700;
    color: var(--color-text-primary);
  }

  .intro-title :global(svg) {
    color: var(--color-text-secondary);
    flex-shrink: 0;
  }

  .intro-desc {
    margin: 0;
    font-size: var(--text-sm);
    line-height: 1.4;
    color: var(--color-text-secondary);
  }

  code {
    font-family: var(--font-mono);
    padding: 1px 6px;
    background-color: var(--color-surface-2);
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-xs);
    color: var(--color-text-primary);
    overflow-wrap: anywhere;
  }
</style>
