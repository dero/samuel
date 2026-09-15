<script lang="ts">
  import { onDestroy } from 'svelte';
  import { Backspace } from 'phosphor-svelte';

  interface Props {
    onAction: () => void;
    disabled?: boolean;
    hasActiveSelection?: boolean;
    label?: string;
    cancelLabel?: string;
    title?: string;
    cancelTitle?: string;
    class?: string;
  }

  let {
    onAction,
    disabled = false,
    hasActiveSelection = false,
    label = 'Backspace',
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

    onAction();
    stopRepeat();

    startTimer = setTimeout(() => {
      timer = setInterval(() => {
        if (!disabled) {
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
</script>

<button
  type="button"
  class="utility-btn backspace-btn {customClass}"
  class:has-active={hasActiveSelection}
  {disabled}
  title={displayTitle}
  onpointerdown={startRepeat}
  onpointerup={stopRepeat}
  onpointerleave={stopRepeat}
  onpointercancel={stopRepeat}
  onkeydown={handleKeyDown}
>
  <span class="btn-icon"><Backspace size={18} weight="duotone" /></span>
  <span class="btn-label">{displayLabel}</span>
</button>

<style>
  .utility-btn {
    height: 42px;
    padding: 0 12px;
    background-color: var(--color-surface-1);
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-md);
    font-size: 14px;
    font-weight: 600;
    line-height: 1;
    color: var(--color-text-primary);
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    cursor: pointer;
    user-select: none;
    -webkit-user-select: none;
    transition: background-color 0.12s, border-color 0.12s, transform 0.08s;
    box-sizing: border-box;
    width: 100%;
  }

  .utility-btn:active:not(:disabled) {
    background-color: var(--color-surface-active);
    transform: scale(0.98);
  }

  .utility-btn:disabled {
    opacity: 0.35;
    cursor: not-allowed;
  }

  .utility-btn.has-active {
    color: var(--color-accent-warning);
    border-color: rgba(245, 158, 11, 0.4);
  }

  .btn-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .btn-label {
    display: inline-flex;
    align-items: center;
    letter-spacing: 0.2px;
  }
</style>
