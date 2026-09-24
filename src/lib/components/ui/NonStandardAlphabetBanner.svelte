<script lang="ts">
  import { navigation } from '../../state/navigation.svelte';
  import { Warning } from 'phosphor-svelte';
  import type { Snippet } from 'svelte';

  interface Props {
    isWarning: boolean;
    title?: string;
    description?: string;
    children?: Snippet;
  }

  let {
    isWarning,
    title = 'Nestandardní abeceda',
    description,
    children
  }: Props = $props();

  $effect(() => {
    navigation.setMenuWarning(isWarning);
    return () => {
      navigation.setMenuWarning(false);
    };
  });
</script>

{#if isWarning}
  <div class="nonstandard-banner" role="alert">
    <div class="banner-top">
      <span class="banner-icon"><Warning size={20} weight="fill" /></span>
      <div class="banner-text">
        <span class="banner-title">{title}</span>
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
  </div>
{/if}

<style>
  .nonstandard-banner {
    background-color: var(--color-surface-warning-subtle, rgba(234, 179, 8, 0.1));
    border: 1px solid var(--color-accent-warning);
    border-radius: var(--radius-md);
    padding: var(--space-sm);
    margin-bottom: var(--space-sm);
  }

  .banner-top {
    display: flex;
    align-items: flex-start;
    gap: var(--space-sm);
  }

  .banner-icon {
    color: var(--color-accent-warning);
    flex-shrink: 0;
    display: flex;
    align-items: center;
    margin-top: 1px;
  }

  .banner-text {
    flex: 1;
    min-width: 0;
  }

  .banner-title {
    display: block;
    font-size: var(--text-sm);
    font-weight: 700;
    color: var(--color-text-primary);
    margin-bottom: 2px;
  }

  .banner-desc {
    font-size: var(--text-xs);
    color: var(--color-text-secondary);
    margin: 0;
    line-height: 1.4;
  }

  .banner-desc :global(strong) {
    color: var(--color-text-primary);
  }
</style>
