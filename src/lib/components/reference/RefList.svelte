<script lang="ts">
  import RefText from './RefText.svelte';
  import type { RefItem } from './refTypes';

  interface Props {
    items: readonly RefItem[];
    variant?: 'default' | 'warn';
  }

  let { items, variant = 'default' }: Props = $props();
</script>

<ul class="ref-list" class:is-warn={variant === 'warn'}>
  {#each items as item, i (i)}
    <li class="ref-list-item">
      {#if typeof item === 'string'}
        <RefText text={item} />
      {:else}
        <span class="ref-term"><RefText text={item[0]} />:</span>
        <RefText text={item[1]} />
      {/if}
    </li>
  {/each}
</ul>

<style>
  .ref-list {
    display: flex;
    flex-direction: column;
    margin: 0;
    padding: 0;
    list-style: none;
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-sm);
    overflow: hidden;
  }

  .ref-list-item {
    padding: 7px var(--space-sm);
    font-size: var(--text-sm);
    line-height: 1.45;
    color: var(--color-text-secondary);
    border-bottom: 1px solid var(--color-border-subtle);
  }

  .ref-list-item:last-child {
    border-bottom: none;
  }

  .ref-list-item:nth-child(even) {
    background-color: rgba(255, 255, 255, 0.025);
  }

  .ref-term {
    font-weight: 700;
    color: var(--color-text-primary);
  }

  .ref-list.is-warn {
    border-color: rgba(245, 158, 11, 0.35);
    border-left: 3px solid var(--color-accent-warning);
  }
</style>
