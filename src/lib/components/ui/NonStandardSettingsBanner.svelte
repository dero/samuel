<script lang="ts">
  import { Warning, CheckCircle, ArrowCounterClockwise } from 'phosphor-svelte';
  import { settings } from '../../state/settings.svelte';

  /**
   * Always shown at the top of the Menu, in the same size for both states,
   * so turning an option on or off never moves the rows below it.
   */
  interface Props {
    /** Number of non-standard settings active in the module */
    count: number;
    /** Callback to reset all non-standard settings to defaults */
    onResetDefaults: () => void;
  }

  let { count, onResetDefaults }: Props = $props();

  const isWarning = $derived(count > 0);
  const title = $derived(
    count === 0
      ? 'Výchozí nastavení'
      : count === 1
        ? '1 nestandardní nastavení'
        : count >= 2 && count <= 4
          ? `${count} nestandardní nastavení`
          : `${count} nestandardních nastavení`
  );
</script>

<div class="settings-banner" class:is-warning={isWarning} role={isWarning ? 'alert' : 'status'}>
  <span class="banner-icon" aria-hidden="true">
    {#if isWarning}
      <Warning size={18} weight="fill" />
    {:else}
      <CheckCircle size={18} weight="bold" />
    {/if}
  </span>
  <span class="banner-title">{title}</span>
  <button
    type="button"
    class="reset-defaults-btn"
    disabled={!isWarning}
    onclick={() => {
      settings.vibrate(25);
      onResetDefaults();
    }}
    title="Obnovit výchozí hodnoty nastavení"
    aria-label="Obnovit výchozí hodnoty nastavení"
  >
    <ArrowCounterClockwise size={14} weight="bold" />
    <span>Výchozí</span>
  </button>
</div>

<style>
  .settings-banner {
    display: flex;
    align-items: center;
    gap: var(--space-sm);
    min-height: calc(var(--control-min-height) + 2 * var(--space-xs));
    padding: var(--space-xs) var(--space-xs) var(--space-xs) var(--space-sm);
    margin-bottom: var(--space-sm);
    background-color: var(--color-surface-1);
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-sm);
    box-sizing: border-box;
  }

  .settings-banner.is-warning {
    background-color: color-mix(in srgb, var(--color-accent-warning) 10%, transparent);
    border-color: var(--color-accent-warning);
  }

  .banner-icon {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    color: var(--color-text-muted);
  }

  .is-warning .banner-icon {
    color: var(--color-accent-warning);
  }

  .banner-title {
    flex: 1;
    min-width: 0;
    font-size: var(--text-xs);
    font-weight: 700;
    line-height: 1.3;
    color: var(--color-text-secondary);
  }

  .is-warning .banner-title {
    color: var(--color-text-primary);
  }

  .reset-defaults-btn {
    flex-shrink: 0;
    display: inline-flex;
    align-items: center;
    gap: 4px;
    min-height: var(--control-min-height);
    padding: 0 var(--space-sm);
    background-color: var(--color-surface-2);
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-xs);
    color: var(--color-text-primary);
    font-size: var(--text-xs);
    font-weight: 700;
    cursor: pointer;
    transition: background-color 0.1s ease;
  }

  .reset-defaults-btn:active:not(:disabled) {
    background-color: var(--color-surface-active);
  }

  /* Disabled keeps its surface; only the content dims */
  .reset-defaults-btn:disabled {
    cursor: default;
  }

  .reset-defaults-btn:disabled > :global(*) {
    opacity: 0.4;
  }
</style>
