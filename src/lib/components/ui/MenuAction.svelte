<script lang="ts">
  import { CaretRight } from 'phosphor-svelte';
  import { settings } from '../../state/settings.svelte';

  /** A row in the Menu tab that opens something instead of toggling an option. */
  interface Props {
    label: string;
    hint?: string;
    icon?: any;
    disabled?: boolean;
    onClick: () => void;
  }

  let { label, hint, icon: Icon, disabled = false, onClick }: Props = $props();
</script>

<button
  type="button"
  class="menu-action"
  {disabled}
  onclick={() => {
    settings.vibrate(20);
    onClick();
  }}
>
  <span class="action-body">
    {#if Icon}
      <Icon size={20} weight="duotone" />
    {/if}
    <span class="action-text">
      <span class="action-label">{label}</span>
      {#if hint}
        <span class="action-hint">{hint}</span>
      {/if}
    </span>
    <CaretRight size={16} weight="bold" />
  </span>
</button>

<style>
  .menu-action {
    width: 100%;
    min-height: var(--tap-min-size);
    padding: var(--space-xs) var(--space-md);
    background-color: var(--color-surface-2);
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-sm);
    color: var(--color-text-primary);
    text-align: left;
    box-sizing: border-box;
    transition: background-color 0.12s ease;
  }

  .menu-action:active:not(:disabled) {
    background-color: var(--color-surface-active);
  }

  .action-body {
    display: flex;
    align-items: center;
    gap: var(--space-md);
  }

  .menu-action:disabled .action-body {
    opacity: 0.48;
  }

  .action-text {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-width: 0;
  }

  .action-label {
    font-size: var(--text-sm);
    font-weight: 700;
  }

  .action-hint {
    font-size: var(--text-xs);
    color: var(--color-text-secondary);
  }
</style>
