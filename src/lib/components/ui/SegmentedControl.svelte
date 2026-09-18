<script module lang="ts">
  export interface SegmentOption<V extends string = string> {
    id: V;
    label: string;
    badge?: string | number;
  }
</script>

<script lang="ts" generics="T extends string = string">
  import { settings } from '../../state/settings.svelte';

  interface Props {
    options: SegmentOption<T>[];
    value: T;
    ariaLabel?: string;
    class?: string;
    onChange: (val: T) => void;
  }

  let {
    options,
    value,
    ariaLabel = 'Volby',
    class: customClass = '',
    onChange
  }: Props = $props();

  function selectOption(id: T) {
    if (id === value) return;
    settings.vibrate(20);
    onChange(id);
  }
</script>

<div class="segmented-control {customClass}" role="tablist" aria-label={ariaLabel}>
  {#each options as opt (opt.id)}
    {@const isActive = opt.id === value}
    <button
      type="button"
      role="tab"
      aria-selected={isActive}
      class="segment-btn"
      class:is-active={isActive}
      onclick={() => selectOption(opt.id)}
    >
      <span class="segment-label">{opt.label}</span>
      {#if opt.badge !== undefined}
        <span class="segment-badge">{opt.badge}</span>
      {/if}
    </button>
  {/each}
</div>

<style>
  .segmented-control {
    display: flex;
    align-items: center;
    gap: 4px;
    background-color: var(--color-surface-1);
    padding: 3px;
    border-radius: var(--radius-sm);
    border: 1px solid var(--color-border-subtle);
    width: 100%;
    box-sizing: border-box;
    flex-shrink: 0;
  }

  .segment-btn {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    min-height: 34px;
    padding: 4px 8px;
    background: transparent;
    border: none;
    border-radius: var(--radius-xs);
    color: var(--color-text-secondary);
    font-size: var(--text-xs);
    font-weight: 600;
    cursor: pointer;
    transition: background-color 0.12s ease, color 0.12s ease;
    user-select: none;
    -webkit-user-select: none;
  }

  .segment-btn.is-active {
    background-color: var(--color-surface-3);
    color: var(--color-text-primary);
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
  }

  .segment-badge {
    font-size: 10px;
    padding: 1px 5px;
    border-radius: var(--radius-full);
    background-color: var(--color-surface-2);
    color: var(--color-text-muted);
    line-height: 1.2;
  }

  .segment-btn.is-active .segment-badge {
    background-color: var(--color-accent-primary-subtle);
    color: var(--color-accent-primary);
  }
</style>
