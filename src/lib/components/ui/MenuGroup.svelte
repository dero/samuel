<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    title?: string;
    children: Snippet;
  }

  let { title, children }: Props = $props();
</script>

<div class="menu-group">
  {#if title}
    <div class="menu-group-title">{title}</div>
  {/if}
  {@render children()}
</div>

<style>
  .menu-group {
    display: flex;
    flex-direction: column;
    gap: var(--space-xs);
    padding-bottom: var(--space-sm);
    border-bottom: 1px solid var(--color-border-subtle);
  }

  .menu-group:last-child {
    padding-bottom: 0;
    border-bottom: none;
  }

  .menu-group-title {
    font-size: var(--text-xs);
    font-weight: 700;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    color: var(--color-text-secondary);
  }
</style>
