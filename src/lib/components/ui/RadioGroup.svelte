<script module lang="ts">
  export interface RadioOption<V extends string = string> {
    value: V;
    label: string;
    description?: string;
    badge?: string;
    disabled?: boolean;
  }
</script>

<script lang="ts" generics="T extends string = string">
  import { settings } from '../../state/settings.svelte';

  interface Props {
    options: RadioOption<T>[];
    value: T;
    name?: string;
    disabled?: boolean;
    onChange: (value: T) => void;
  }

  let {
    options,
    value,
    name = 'radio-group-' + Math.random().toString(36).substring(2, 7),
    disabled = false,
    onChange
  }: Props = $props();

  function handleSelect(optionValue: T, optionDisabled?: boolean) {
    if (disabled || optionDisabled || optionValue === value) return;
    settings.vibrate(20);
    onChange(optionValue);
  }
</script>

<div class="radio-group" role="radiogroup">
  {#each options as opt (opt.value)}
    {@const isSelected = opt.value === value}
    {@const isDisabled = disabled || opt.disabled}
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
    <label
      class="radio-item"
      class:is-selected={isSelected}
      class:is-disabled={isDisabled}
      onclick={(e) => {
        if ((e.target as HTMLElement).tagName !== 'INPUT') {
          e.preventDefault();
          handleSelect(opt.value as T, isDisabled);
        }
      }}
    >
      <div class="radio-control">
        <input
          type="radio"
          {name}
          value={opt.value}
          checked={isSelected}
          disabled={isDisabled}
          onchange={() => handleSelect(opt.value as T, isDisabled)}
        />
        <span class="custom-radio" aria-hidden="true">
          <span class="radio-dot"></span>
        </span>
      </div>

      <div class="radio-content">
        <div class="radio-label-row">
          <span class="radio-label">{opt.label}</span>
          {#if opt.badge}
            <span class="radio-badge">{opt.badge}</span>
          {/if}
        </div>
        {#if opt.description}
          <span class="radio-description">{opt.description}</span>
        {/if}
      </div>
    </label>
  {/each}
</div>

<style>
  .radio-group {
    display: flex;
    flex-direction: column;
    gap: var(--space-xs);
    width: 100%;
  }

  .radio-item {
    display: flex;
    align-items: center;
    gap: var(--space-md);
    padding: var(--space-sm) var(--space-md);
    border-radius: var(--radius-md);
    background: var(--color-surface-2);
    border: 1px solid var(--color-border-subtle);
    cursor: pointer;
    user-select: none;
    -webkit-user-select: none;
    touch-action: manipulation;
    min-height: var(--tap-min-size);
    transition: background-color 0.12s ease, border-color 0.12s ease;
  }

  .radio-item:active:not(.is-disabled) {
    background-color: var(--color-surface-active);
  }

  .radio-item.is-selected {
    background-color: var(--color-accent-primary-subtle);
    border-color: var(--color-accent-primary-glow);
  }

  .radio-item.is-disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .radio-control {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .radio-control input[type='radio'] {
    position: absolute;
    opacity: 0;
    width: 0;
    height: 0;
    margin: 0;
    pointer-events: none;
  }

  .custom-radio {
    width: 20px;
    height: 20px;
    border-radius: var(--radius-full);
    border: 2px solid var(--color-border-medium);
    background: var(--color-bg-canvas);
    display: flex;
    align-items: center;
    justify-content: center;
    transition: border-color 0.12s ease;
  }

  .radio-item.is-selected .custom-radio {
    border-color: var(--color-accent-primary);
  }

  .radio-dot {
    width: 10px;
    height: 10px;
    border-radius: var(--radius-full);
    background: var(--color-accent-primary);
    transform: scale(0);
    transition: transform 0.15s cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  .radio-item.is-selected .radio-dot {
    transform: scale(1);
  }

  .radio-content {
    display: flex;
    flex-direction: column;
    gap: 2px;
    flex: 1;
    min-width: 0;
  }

  .radio-label-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-xs);
  }

  .radio-label {
    font-size: var(--text-base);
    font-weight: 600;
    color: var(--color-text-primary);
  }

  .radio-item.is-selected .radio-label {
    color: var(--color-accent-primary);
  }

  .radio-badge {
    font-size: var(--text-xs);
    font-family: var(--font-mono);
    color: var(--color-text-secondary);
    background: rgba(255, 255, 255, 0.06);
    padding: 1px 6px;
    border-radius: var(--radius-sm);
  }

  .radio-item.is-selected .radio-badge {
    background: var(--color-accent-primary-subtle);
    color: var(--color-accent-primary);
  }

  .radio-description {
    font-size: var(--text-xs);
    color: var(--color-text-secondary);
    line-height: 1.3;
  }
</style>
