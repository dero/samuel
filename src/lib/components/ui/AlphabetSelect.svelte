<script lang="ts">
  import { CaretDown, Check, TextAa, Warning } from 'phosphor-svelte';
  import { alphabet, type AlphabetLayout } from '../../state/alphabet.svelte';
  import { settings } from '../../state/settings.svelte';
  import BottomSheet from './BottomSheet.svelte';

  interface Props {
    value: string;
    defaultId?: string;
    standardIds?: string[];
    label?: string;
    hint?: string;
    onChange: (layoutId: string) => void;
  }

  let {
    value,
    defaultId,
    standardIds,
    label,
    hint,
    onChange
  }: Props = $props();

  let isOpen = $state(false);

  const selectedLayout = $derived<AlphabetLayout | undefined>(
    alphabet.getLayout(value) ?? alphabet.layouts.find((l) => l.id === value)
  );

  const isCurrentStandard = $derived<boolean>(
    !standardIds || standardIds.length === 0 || standardIds.includes(value)
  );

  const isCurrentDefault = $derived<boolean>(
    !!defaultId && value === defaultId
  );

  function handleTriggerClick() {
    settings.vibrate(20);
    isOpen = true;
  }

  function handleSelect(layoutId: string) {
    settings.vibrate(20);
    onChange(layoutId);
    isOpen = false;
  }
</script>

<div class="alphabet-select-container">
  {#if label}
    <div class="select-label">{label}</div>
  {/if}
  {#if hint}
    <div class="select-hint">{hint}</div>
  {/if}

  <button
    type="button"
    class="select-trigger"
    class:is-nonstandard={!isCurrentStandard}
    aria-haspopup="dialog"
    aria-expanded={isOpen}
    oncontextmenu={(e) => e.preventDefault()}
    onclick={handleTriggerClick}
  >
    <div class="trigger-left">
      <span class="trigger-name">{selectedLayout?.name ?? value}</span>
      {#if !isCurrentStandard}
        <span class="status-badge badge-warning">
          <Warning size={12} weight="fill" />
          <span>Nestandardní</span>
        </span>
      {:else if isCurrentDefault}
        <span class="status-badge badge-default">Výchozí</span>
      {/if}
    </div>

    <div class="trigger-right">
      <span class="count-badge">{selectedLayout?.letters.length ?? 0} znaků</span>
      <span class="trigger-caret"><CaretDown size={16} weight="bold" /></span>
    </div>
  </button>
</div>

<BottomSheet
  open={isOpen}
  title="Výběr abecedy"
  icon={TextAa}
  zIndex={230}
  maxWidth="500px"
  onClose={() => (isOpen = false)}
>
  <div class="layouts-sheet-content">
    {#each alphabet.layouts as layout (layout.id)}
      {@const isSelected = layout.id === value}
      {@const isDefault = !!defaultId && layout.id === defaultId}
      {@const isStd = !!standardIds && standardIds.includes(layout.id)}
      {@const isNonStd = !!standardIds && standardIds.length > 0 && !isStd}

      <button
        type="button"
        class="layout-card"
        class:is-selected={isSelected}
        class:is-nonstandard={isNonStd}
        oncontextmenu={(e) => e.preventDefault()}
        onclick={() => handleSelect(layout.id)}
      >
        <div class="card-header">
          <div class="card-title-group">
            <span class="radio-dot" class:is-checked={isSelected}>
              {#if isSelected}
                <Check size={13} weight="bold" />
              {/if}
            </span>
            <span class="card-title">{layout.name}</span>
          </div>

          <div class="card-badges">
            {#if isDefault}
              <span class="badge badge-default">Výchozí</span>
            {:else if isStd}
              <span class="badge badge-standard">Standardní</span>
            {:else if isNonStd}
              <span class="badge badge-warning">
                <Warning size={11} weight="fill" />
                <span>Nestandardní</span>
              </span>
            {/if}
            <span class="badge badge-count">{layout.letters.length} znaků</span>
          </div>
        </div>

        {#if layout.description}
          <div class="card-desc">{layout.description}</div>
        {/if}

        <div class="card-preview" aria-hidden="true">
          {layout.letters.join(' ')}
        </div>
      </button>
    {/each}
  </div>
</BottomSheet>

<style>
  .alphabet-select-container {
    display: flex;
    flex-direction: column;
    gap: var(--space-xs);
    width: 100%;
  }

  .select-label {
    font-size: var(--text-xs);
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.6px;
    color: var(--color-text-secondary);
  }

  .select-hint {
    font-size: var(--text-xs);
    color: var(--color-text-secondary);
    line-height: 1.4;
    margin-top: -2px;
    margin-bottom: 2px;
  }

  .select-trigger {
    width: 100%;
    min-height: var(--tap-min-size);
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-sm);
    padding: 0 var(--space-md);
    background-color: var(--color-surface-2);
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-md);
    color: var(--color-text-primary);
    cursor: pointer;
    transition: background-color 0.12s ease, border-color 0.12s ease;
    user-select: none;
    -webkit-user-select: none;
  }

  .select-trigger:active {
    background-color: var(--color-surface-active);
  }

  .select-trigger.is-nonstandard {
    border-color: rgba(245, 158, 11, 0.4);
  }

  .trigger-left {
    display: flex;
    align-items: center;
    gap: var(--space-sm);
    min-width: 0;
    overflow: hidden;
  }

  .trigger-name {
    font-size: var(--text-base);
    font-weight: 600;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .trigger-right {
    display: flex;
    align-items: center;
    gap: var(--space-sm);
    flex-shrink: 0;
  }

  .count-badge {
    font-size: var(--text-xs);
    color: var(--color-text-secondary);
    background-color: var(--color-surface-1);
    padding: 2px 8px;
    border-radius: var(--radius-full);
    border: 1px solid var(--color-border-subtle);
    white-space: nowrap;
  }

  .trigger-caret {
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--color-text-secondary);
  }

  .status-badge {
    display: inline-flex;
    align-items: center;
    gap: 3px;
    font-size: 11px;
    font-weight: 600;
    padding: 1px 6px;
    border-radius: var(--radius-full);
    text-transform: uppercase;
    letter-spacing: 0.3px;
    white-space: nowrap;
  }

  .status-badge.badge-default {
    background-color: rgba(0, 210, 255, 0.12);
    color: var(--color-accent-primary);
  }

  .status-badge.badge-warning {
    background-color: var(--color-accent-warning-subtle);
    color: var(--color-accent-warning);
  }

  /* Sheet Layouts List */
  .layouts-sheet-content {
    display: flex;
    flex-direction: column;
    gap: var(--space-sm);
    padding-bottom: var(--space-md);
  }

  .layout-card {
    display: flex;
    flex-direction: column;
    gap: var(--space-xs);
    padding: var(--space-md);
    background-color: var(--color-surface-2);
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-md);
    text-align: left;
    cursor: pointer;
    transition: background-color 0.12s ease, border-color 0.12s ease, box-shadow 0.12s ease;
    user-select: none;
    -webkit-user-select: none;
    color: var(--color-text-primary);
    min-height: var(--tap-min-size);
  }

  .layout-card:active {
    background-color: var(--color-surface-active);
  }

  .layout-card.is-selected {
    border-color: var(--color-accent-primary);
    background-color: rgba(0, 210, 255, 0.05);
    box-shadow: 0 0 12px rgba(0, 210, 255, 0.12);
  }

  .layout-card.is-nonstandard:not(.is-selected) {
    border-color: rgba(245, 158, 11, 0.25);
  }

  .card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-sm);
  }

  .card-title-group {
    display: flex;
    align-items: center;
    gap: var(--space-sm);
    min-width: 0;
  }

  .radio-dot {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    border: 1.5px solid var(--color-border-default);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    transition: all 0.12s ease;
    background-color: var(--color-surface-1);
    color: #000;
  }

  .radio-dot.is-checked {
    border-color: var(--color-accent-primary);
    background-color: var(--color-accent-primary);
  }

  .card-title {
    font-size: var(--text-base);
    font-weight: 600;
    color: var(--color-text-primary);
  }

  .card-badges {
    display: flex;
    align-items: center;
    gap: 6px;
    flex-shrink: 0;
  }

  .badge {
    font-size: 11px;
    font-weight: 600;
    padding: 2px 7px;
    border-radius: var(--radius-full);
    display: inline-flex;
    align-items: center;
    gap: 3px;
    white-space: nowrap;
  }

  .badge-default {
    background-color: rgba(0, 210, 255, 0.12);
    color: var(--color-accent-primary);
    border: 1px solid rgba(0, 210, 255, 0.25);
  }

  .badge-standard {
    background-color: var(--color-surface-active);
    color: var(--color-text-secondary);
    border: 1px solid var(--color-border-subtle);
  }

  .badge-warning {
    background-color: var(--color-accent-warning-subtle);
    color: var(--color-accent-warning);
    border: 1px solid rgba(245, 158, 11, 0.3);
  }

  .badge-count {
    background-color: var(--color-surface-1);
    color: var(--color-text-secondary);
    border: 1px solid var(--color-border-subtle);
  }

  .card-desc {
    font-size: var(--text-xs);
    color: var(--color-text-secondary);
    line-height: 1.4;
    padding-left: 28px;
  }

  .card-preview {
    font-family: var(--font-mono);
    font-size: 11px;
    letter-spacing: 0.5px;
    color: var(--color-text-muted);
    padding-left: 28px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
</style>
