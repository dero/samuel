<script lang="ts">
  import { settings } from '../../state/settings.svelte';

  interface Props {
    label: string;
    hint?: string;
    checked: boolean;
    type?: 'checkbox' | 'switch';
    disabled?: boolean;
    isNonStandard?: boolean;
    onChange: (checked: boolean) => void;
  }

  let {
    label,
    hint,
    checked,
    type = 'checkbox',
    disabled = false,
    isNonStandard,
    onChange
  }: Props = $props();

  function handleToggle() {
    if (disabled) return;
    settings.vibrate(20);
    onChange(!checked);
  }
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<label
  class="option-row"
  class:is-disabled={disabled}
  class:is-nonstandard={isNonStandard}
  class:can-be-nonstandard={isNonStandard !== undefined}
  onclick={(e) => {
    // If clicked on input itself, native change fires; otherwise toggle manually
    if ((e.target as HTMLElement).tagName !== 'INPUT') {
      e.preventDefault();
      handleToggle();
    }
  }}
>
  <div class="option-content">
    <span class="option-label">
      {label}
      {#if isNonStandard !== undefined}
        <!-- Always in the layout, so switching the option never reflows the label -->
        <span
          class="nonstandard-badge"
          class:is-visible={isNonStandard}
          title={isNonStandard ? 'Nestandardní nastavení' : undefined}
          aria-hidden={!isNonStandard}
        >⚠</span>
      {/if}
    </span>
    {#if hint}
      <span class="option-hint">{hint}</span>
    {/if}
  </div>

  <div class="option-control">
    {#if type === 'switch'}
      <input
        type="checkbox"
        class="custom-switch"
        {checked}
        {disabled}
        onchange={(e) => {
          settings.vibrate(20);
          onChange((e.currentTarget as HTMLInputElement).checked);
        }}
      />
    {:else}
      <input
        type="checkbox"
        class="custom-checkbox"
        {checked}
        {disabled}
        onchange={(e) => {
          settings.vibrate(20);
          onChange((e.currentTarget as HTMLInputElement).checked);
        }}
      />
    {/if}
  </div>
</label>

<style>
  .option-row {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: var(--space-md);
    padding: var(--space-sm) var(--space-xs) var(--space-sm) var(--space-sm);
    border-left: 3px solid transparent;
    /* The gutter for the non-standard bar reaches into the parent's padding: labels line up */
    margin-left: calc(-1 * (var(--space-sm) + 3px));
    cursor: pointer;
    user-select: none;
    -webkit-user-select: none;
    border-bottom: 1px solid var(--color-border-subtle);
  }

  .option-row:last-child {
    border-bottom: none;
  }

  .option-row.is-disabled {
    opacity: 0.52;
    cursor: not-allowed;
  }

  .option-row.is-nonstandard {
    border-left-color: var(--color-accent-warning);
    background-color: color-mix(in srgb, var(--color-accent-warning) 6%, transparent);
  }

  .nonstandard-badge {
    visibility: hidden;
    color: var(--color-accent-warning);
    font-size: 0.85em;
    margin-left: 4px;
    font-weight: 700;
  }

  .nonstandard-badge.is-visible {
    visibility: visible;
  }

  .option-content {
    display: flex;
    flex-direction: column;
    gap: 2px;
    flex: 1;
    min-width: 0;
  }

  .option-label {
    font-size: var(--text-sm);
    font-weight: 600;
    color: var(--color-text-primary);
    line-height: 1.35;
  }

  .option-hint {
    font-size: var(--text-xs);
    color: var(--color-text-muted);
    line-height: 1.35;
  }

  .option-control {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    margin-top: 1px;
  }

  .custom-checkbox {
    width: 20px;
    height: 20px;
    border-radius: var(--radius-xs);
    accent-color: var(--color-accent-primary);
    cursor: pointer;
  }

  .custom-switch {
    width: 44px;
    height: 24px;
    appearance: none;
    background-color: var(--color-surface-3);
    border-radius: var(--radius-full);
    position: relative;
    cursor: pointer;
    outline: none;
    transition: background-color 0.2s ease;
    flex-shrink: 0;
    margin: 0;
  }

  .custom-switch::after {
    content: '';
    position: absolute;
    top: 2px;
    left: 2px;
    width: 20px;
    height: 20px;
    background-color: var(--color-text-primary);
    border-radius: 50%;
    transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  }

  .custom-switch:checked {
    background-color: var(--color-accent-primary);
  }

  .custom-switch:checked::after {
    transform: translateX(20px);
  }
</style>
