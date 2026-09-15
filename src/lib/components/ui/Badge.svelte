<script lang="ts">
  interface Props {
    variant?: 'neutral' | 'accent' | 'success' | 'warning' | 'danger';
    size?: 'sm' | 'md';
    class?: string;
    children?: import('svelte').Snippet;
  }

  let {
    variant = 'neutral',
    size = 'sm',
    class: customClass = '',
    children
  }: Props = $props();
</script>

<span
  class="badge variant-{variant} size-{size} {customClass}"
>
  {#if children}
    {@render children()}
  {/if}
</span>

<style>
  .badge {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-weight: 600;
    line-height: 1;
    border-radius: var(--radius-sm);
    white-space: nowrap;
    user-select: none;
    -webkit-user-select: none;
  }

  .size-sm {
    font-size: var(--text-xs);
    padding: 2px 6px;
  }

  .size-md {
    font-size: var(--text-sm);
    padding: 3px 8px;
  }

  .variant-neutral {
    color: var(--color-text-muted);
    background-color: var(--color-surface-2);
    border: 1px solid var(--color-border-subtle);
  }

  .variant-accent {
    color: var(--color-accent-primary);
    background-color: var(--color-accent-primary-subtle);
    border: 1px solid rgba(0, 210, 255, 0.3);
  }

  .variant-success {
    color: var(--color-accent-success);
    background-color: var(--color-accent-success-subtle);
    border: 1px solid rgba(16, 185, 129, 0.3);
  }

  .variant-warning {
    color: var(--color-accent-warning);
    background-color: var(--color-accent-warning-subtle);
    border: 1px solid rgba(245, 158, 11, 0.3);
  }

  .variant-danger {
    color: var(--color-accent-danger);
    background-color: var(--color-accent-danger-subtle);
    border: 1px solid rgba(239, 68, 68, 0.3);
  }
</style>
