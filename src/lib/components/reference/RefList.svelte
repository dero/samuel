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
        <span class="ref-full"><RefText text={item} /></span>
      {:else}
        <span class="ref-term"><RefText text={item[0]} /></span>
        <span class="ref-value"><RefText text={item[1]} /></span>
      {/if}
    </li>
  {/each}
</ul>

<style>
  /* Two aligned columns: terms under each other, values under each other */
  .ref-list {
    display: grid;
    grid-template-columns: fit-content(45%) minmax(0, 1fr);
    margin: 0;
    padding: 0;
    list-style: none;
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-sm);
    overflow: hidden;
  }

  .ref-list-item {
    display: grid;
    grid-column: 1 / -1;
    grid-template-columns: subgrid;
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

  .ref-term,
  .ref-value,
  .ref-full {
    padding: 10px var(--space-md);
    min-width: 0;
  }

  .ref-term {
    font-weight: 700;
    color: var(--color-text-primary);
    border-right: 1px solid var(--color-border-subtle);
  }

  .ref-full {
    grid-column: 1 / -1;
  }

  .ref-list.is-warn {
    border-color: rgba(245, 158, 11, 0.35);
    border-left: 3px solid var(--color-accent-warning);
  }
</style>
