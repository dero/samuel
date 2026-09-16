<script lang="ts">
  import { MagnifyingGlass, X } from 'phosphor-svelte';
  import { settings } from '../../state/settings.svelte';

  interface Props {
    value: string;
    placeholder?: string;
    ariaLabel?: string;
    class?: string;
  }

  let {
    value = $bindable(''),
    placeholder = 'Hledat...',
    ariaLabel = 'Vyhledávání',
    class: customClass = ''
  }: Props = $props();

  function handleClear() {
    settings.vibrate(20);
    value = '';
  }
</script>

<div class="search-box {customClass}">
  <span class="search-icon" aria-hidden="true">
    <MagnifyingGlass size={16} weight="bold" />
  </span>
  <input
    type="search"
    {placeholder}
    aria-label={ariaLabel}
    bind:value
    autocomplete="off"
    autocorrect="off"
    autocapitalize="off"
    spellcheck="false"
  />
  {#if value}
    <button
      type="button"
      class="clear-search"
      aria-label="Vymazat hledání"
      onclick={handleClear}
    >
      <X size={14} weight="bold" />
    </button>
  {/if}
</div>

<style>
  .search-box {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 12px;
    background-color: var(--color-surface-2);
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-md);
    flex-shrink: 0;
    transition: border-color 0.15s ease;
    box-sizing: border-box;
    width: 100%;
  }

  .search-box:focus-within {
    border-color: var(--color-border-focus);
  }

  .search-box input {
    flex: 1;
    background: none;
    border: none;
    outline: none;
    color: var(--color-text-primary);
    font-size: var(--text-sm);
    font-family: inherit;
    min-width: 0;
  }

  .search-box input::placeholder {
    color: var(--color-text-muted);
  }

  .search-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--color-text-secondary);
    flex-shrink: 0;
  }

  .clear-search {
    display: flex;
    align-items: center;
    justify-content: center;
    background: none;
    border: none;
    color: var(--color-text-muted);
    padding: 2px 4px;
    cursor: pointer;
    border-radius: var(--radius-xs);
    transition: color 0.12s ease;
  }

  .clear-search:active {
    color: var(--color-text-primary);
  }
</style>
