<script lang="ts">
  import { settings } from '../../state/settings.svelte';

  interface Props {
    label: string;
    hint?: string;
    checked: boolean;
    type?: 'checkbox' | 'switch';
    disabled?: boolean;
    onChange: (checked: boolean) => void;
  }

  let {
    label,
    hint,
    checked,
    type = 'checkbox',
    disabled = false,
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
  onclick={(e) => {
    // If clicked on input itself, native change fires; otherwise toggle manually
    if ((e.target as HTMLElement).tagName !== 'INPUT') {
      e.preventDefault();
      handleToggle();
    }
  }}
>
  <div class="option-content">
    <span class="option-label">{label}</span>
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
    padding: var(--space-sm) 0;
    cursor: pointer;
    user-select: none;
    -webkit-user-select: none;
    border-bottom: 1px solid rgba(255, 255, 255, 0.04);
  }

  .option-row:last-child {
    border-bottom: none;
  }

  .option-row.is-disabled {
    opacity: 0.4;
    cursor: not-allowed;
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
    background-color: #2a2a34;
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
    background-color: #ffffff;
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
