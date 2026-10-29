<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    onclick?: () => void;
    title?: string;
    ariaLabel?: string;
    left?: Snippet;
    right?: Snippet;
    children?: Snippet;
  }

  let {
    onclick,
    title,
    ariaLabel,
    left,
    right,
    children
  }: Props = $props();
</script>

{#if onclick}
  <button
    type="button"
    class="status-summary-bar is-interactive"
    {onclick}
    {title}
    aria-label={ariaLabel}
  >
    {#if left}
      <div class="status-left">
        {@render left()}
      </div>
    {:else if children}
      {@render children()}
    {/if}

    {#if right}
      <div class="status-right">
        {@render right()}
      </div>
    {/if}
  </button>
{:else}
  <div
    class="status-summary-bar"
    {title}
    aria-label={ariaLabel}
  >
    {#if left}
      <div class="status-left">
        {@render left()}
      </div>
    {:else if children}
      {@render children()}
    {/if}

    {#if right}
      <div class="status-right">
        {@render right()}
      </div>
    {/if}
  </div>
{/if}

<style>
  .status-summary-bar {
    appearance: none;
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 32px;
    padding: 0 8px;
    background-color: var(--color-surface-2);
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-sm);
    margin-bottom: 6px;
    flex-shrink: 0;
    gap: 8px;
    box-sizing: border-box;
    color: var(--color-text-primary);
    text-align: left;
  }

  .status-summary-bar.is-interactive {
    cursor: pointer;
    transition: background-color 0.12s ease;
  }

  .status-summary-bar.is-interactive:hover {
    background-color: var(--color-surface-3);
  }

  .status-summary-bar.is-interactive:active {
    background-color: var(--color-surface-active);
  }

  .status-left {
    display: flex;
    align-items: center;
    gap: 6px;
    min-width: 0;
    overflow: hidden;
    font-size: calc(11px * var(--font-scale));
    font-weight: 700;
    color: var(--color-text-secondary);
    white-space: nowrap;
    text-overflow: ellipsis;
  }

  .status-right {
    display: flex;
    align-items: center;
    gap: 5px;
    flex-shrink: 0;
  }
</style>
