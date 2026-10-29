<script lang="ts">
  import { Warning, ArrowCounterClockwise } from 'phosphor-svelte';
  import { settings } from '../../state/settings.svelte';

  interface Props {
    /** Number of non-standard settings active in the module */
    count: number;
    /** Callback to reset all non-standard settings to defaults */
    onResetDefaults: () => void;
  }

  let {
    count,
    onResetDefaults
  }: Props = $props();
</script>

{#if count > 0}
  <div class="nonstandard-settings-banner" role="alert">
    <div class="banner-main">
      <span class="banner-icon" aria-hidden="true">
        <Warning size={18} weight="fill" />
      </span>
      <div class="banner-text">
        <span class="banner-title">
          {count === 1
            ? '1 nestandardní nastavení'
            : count >= 2 && count <= 4
              ? `${count} nestandardní nastavení`
              : `${count} nestandardních nastavení`}
        </span>
      </div>
      <button
        type="button"
        class="reset-defaults-btn"
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
  </div>
{/if}

<style>
  .nonstandard-settings-banner {
    background-color: var(--color-surface-warning-subtle, rgba(234, 179, 8, 0.1));
    border: 1px solid var(--color-accent-warning, #f59e0b);
    border-radius: var(--radius-sm);
    padding: var(--space-xs) var(--space-sm);
    margin-bottom: var(--space-sm);
    box-sizing: border-box;
  }

  .banner-main {
    display: flex;
    align-items: center;
    gap: var(--space-sm);
  }

  .banner-icon {
    color: var(--color-accent-warning, #f59e0b);
    flex-shrink: 0;
    display: flex;
    align-items: center;
  }

  .banner-text {
    flex: 1;
    min-width: 0;
    display: flex;
    align-items: center;
  }

  .banner-title {
    font-size: var(--text-xs);
    font-weight: 700;
    color: var(--color-text-primary);
    line-height: 1.3;
  }

  .reset-defaults-btn {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    background-color: var(--color-surface-2);
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-xs);
    color: var(--color-text-primary);
    font-size: calc(11px * var(--font-scale));
    font-weight: 700;
    padding: 4px 8px;
    cursor: pointer;
    flex-shrink: 0;
    transition: background-color 0.1s ease, transform 0.08s ease;
  }

  .reset-defaults-btn:active {
    background-color: var(--color-surface-active);
    transform: scale(0.96);
  }
</style>
