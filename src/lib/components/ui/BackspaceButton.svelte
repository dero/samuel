<script lang="ts">
  import { onDestroy } from 'svelte';
  import { Backspace, X } from 'phosphor-svelte';
  import { settings } from '../../state/settings.svelte';

  interface Props {
    onAction: () => void;
    disabled?: boolean;
    hasActiveSelection?: boolean;
    icon?: 'auto' | 'backspace' | 'cancel';
    label?: string;
    showLabel?: boolean;
    cancelLabel?: string;
    title?: string;
    cancelTitle?: string;
    class?: string;
  }

  let {
    onAction,
    disabled = false,
    hasActiveSelection = false,
    icon = 'auto',
    label = 'Backspace',
    showLabel = false,
    cancelLabel = 'Zrušit výběr',
    title = 'Smazat poslední znak',
    cancelTitle = 'Zrušit aktivní výběr',
    class: customClass = ''
  }: Props = $props();

  let timer: ReturnType<typeof setInterval> | null = null;
  let startTimer: ReturnType<typeof setTimeout> | null = null;

  function stopRepeat() {
    if (startTimer) {
      clearTimeout(startTimer);
      startTimer = null;
    }
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
  }

  function startRepeat(e: PointerEvent) {
    if (disabled) return;
    if (e.button !== 0 && e.pointerType === 'mouse') return;

    settings.vibrate(20);
    onAction();
    stopRepeat();

    startTimer = setTimeout(() => {
      timer = setInterval(() => {
        if (!disabled) {
          settings.vibrate(15);
          onAction();
        } else {
          stopRepeat();
        }
      }, 75);
    }, 400);
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (disabled) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      settings.vibrate(20);
      onAction();
    }
  }

  $effect(() => {
    if (disabled) {
      stopRepeat();
    }
  });

  onDestroy(() => {
    stopRepeat();
  });

  let displayLabel = $derived(hasActiveSelection ? cancelLabel : label);
  let displayTitle = $derived(hasActiveSelection ? cancelTitle : title);
  let resolvedIcon = $derived.by(() => {
    if (icon === 'backspace') return 'backspace';
    if (icon === 'cancel') return 'cancel';
    return hasActiveSelection ? 'cancel' : 'backspace';
  });
</script>

<button
  type="button"
  class="utility-btn backspace-btn {customClass}"
  class:has-active={hasActiveSelection}
  {disabled}
  title={displayTitle}
  aria-label={displayTitle}
  onpointerdown={startRepeat}
  onpointerup={stopRepeat}
  onpointerleave={stopRepeat}
  onpointercancel={stopRepeat}
  oncontextmenu={(e) => e.preventDefault()}
  onkeydown={handleKeyDown}
>
  <span class="btn-icon">
    {#if resolvedIcon === 'cancel'}
      <X size={20} weight="bold" />
    {:else}
      <Backspace size={20} weight="duotone" />
    {/if}
  </span>
  {#if showLabel}
    <span class="btn-label">{displayLabel}</span>
  {/if}
</button>

<style>
  .utility-btn {
    height: var(--utility-row-height, 42px);
    min-height: 0;
    padding: 0 var(--space-xs);
    background-color: var(--color-surface-2);
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-sm);
    font-size: var(--text-sm);
    font-weight: 600;
    line-height: 1;
    color: var(--color-text-primary);
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    cursor: pointer;
    user-select: none;
    box-shadow: 
      inset 0 1px 0 rgba(255, 255, 255, 0.10),
      inset 0 -1px 0 rgba(0, 0, 0, 0.5);
    transition: background-color 0.12s, border-color 0.12s, box-shadow 0.08s, transform 0.08s;
    box-sizing: border-box;
    width: 100%;
    white-space: nowrap;
    overflow: hidden;
  }

  .utility-btn:active:not(:disabled) {
    background-color: var(--color-surface-active);
    box-shadow: inset 0 1.5px 3px rgba(0, 0, 0, 0.7);
    transform: scale(0.98);
  }

  .utility-btn:disabled {
    cursor: not-allowed;
  }

  .utility-btn:disabled .btn-icon,
  .utility-btn:disabled .btn-label {
    opacity: 0.48;
    color: var(--color-text-secondary);
  }

  .utility-btn.has-active {
    color: var(--color-accent-warning);
    background-color: var(--color-accent-warning-subtle);
    border-color: rgba(245, 158, 11, 0.4);
  }

  .btn-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    line-height: 0;
  }

  .btn-icon :global(svg) {
    display: block;
  }

  .btn-label {
    display: inline-flex;
    align-items: center;
    letter-spacing: 0.2px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
</style>
