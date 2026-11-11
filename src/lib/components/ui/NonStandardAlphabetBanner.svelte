<script lang="ts">
  import { Warning, CheckCircle } from 'phosphor-svelte';
  import type { Snippet } from 'svelte';

  /**
   * Always shown above the alphabet choice, in the same layout for both states,
   * so picking another alphabet never moves the rows below it.
   */
  interface Props {
    isWarning: boolean;
    title?: string;
    standardTitle?: string;
    description?: string;
    children?: Snippet;
  }

  let {
    isWarning,
    title = 'Nestandardní abeceda',
    standardTitle = 'Obvyklá abeceda',
    description,
    children
  }: Props = $props();
</script>

<div class="alphabet-banner" class:is-warning={isWarning} role={isWarning ? 'alert' : 'status'}>
  <span class="banner-icon" aria-hidden="true">
    {#if isWarning}
      <Warning size={20} weight="fill" />
    {:else}
      <CheckCircle size={20} weight="bold" />
    {/if}
  </span>
  <div class="banner-text">
    <span class="banner-title">{isWarning ? title : standardTitle}</span>
    {#if description}
      <p class="banner-desc">{description}</p>
    {/if}
    {#if children}
      <div class="banner-desc">
        {@render children()}
      </div>
    {/if}
  </div>
</div>

<style>
  .alphabet-banner {
    display: flex;
    align-items: flex-start;
    gap: var(--space-sm);
    padding: var(--space-sm);
    margin-bottom: var(--space-sm);
    background-color: var(--color-surface-1);
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-md);
  }

  .alphabet-banner.is-warning {
    background-color: color-mix(in srgb, var(--color-accent-warning) 10%, transparent);
    border-color: var(--color-accent-warning);
  }

  .banner-icon {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    margin-top: 1px;
    color: var(--color-text-muted);
  }

  .is-warning .banner-icon {
    color: var(--color-accent-warning);
  }

  .banner-text {
    flex: 1;
    min-width: 0;
  }

  .banner-title {
    display: block;
    margin-bottom: 2px;
    font-size: var(--text-sm);
    font-weight: 700;
    color: var(--color-text-secondary);
  }

  .is-warning .banner-title {
    color: var(--color-text-primary);
  }

  .banner-desc {
    margin: 0;
    font-size: var(--text-xs);
    line-height: 1.4;
    color: var(--color-text-secondary);
  }

  .banner-desc :global(strong) {
    color: var(--color-text-primary);
  }
</style>
