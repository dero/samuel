<script lang="ts">
  import { settings } from '../../state/settings.svelte';

  interface Props {
    symbol: string;
    name: string;
    variant?: 'default' | 'accent' | 'warning' | 'secondary';
    ready?: boolean;
    disabled?: boolean;
    title?: string;
    haptic?: number | number[];
    class?: string;
    onClick: () => void;
  }

  let {
    symbol,
    name,
    variant = 'default',
    ready = false,
    disabled = false,
    title,
    haptic = 20,
    class: customClass = '',
    onClick
  }: Props = $props();

  let isPressed = $state(false);

  function handlePointerDown(e: PointerEvent) {
    if (disabled) return;
    if (e.pointerType === 'mouse' && e.button !== 0) return;

    // Prevent multi-touch gesture arbitration and trigger immediate tactile action
    e.preventDefault();
    isPressed = true;
    settings.vibrate(haptic);
    onClick();
  }

  function handlePointerUp() {
    isPressed = false;
  }

  function handlePointerCancel() {
    isPressed = false;
  }

  function handleClick(e: MouseEvent) {
    if (disabled) return;
    // W3C UI Events spec: detail === 0 indicates non-pointer triggers (keyboard/screen readers).
    // Pointer clicks (detail >= 1) were already executed instantly at pointerdown.
    if (e.detail === 0) {
      settings.vibrate(haptic);
      onClick();
    }
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (disabled) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      settings.vibrate(haptic);
      onClick();
    }
  }
</script>

<button
  type="button"
  class="dominant-btn {customClass}"
  class:variant-accent={variant === 'accent'}
  class:variant-warning={variant === 'warning'}
  class:variant-secondary={variant === 'secondary'}
  class:is-ready={ready}
  class:is-pressed={isPressed}
  {disabled}
  title={title || name}
  onpointerdown={handlePointerDown}
  onpointerup={handlePointerUp}
  onpointerleave={handlePointerCancel}
  onpointercancel={handlePointerCancel}
  oncontextmenu={(e) => e.preventDefault()}
  onclick={handleClick}
  onkeydown={handleKeyDown}
>
  <span class="btn-symbol">{symbol}</span>
  <span class="btn-name">{name}</span>
</button>

<style>
  .dominant-btn {
    height: var(--dominant-key-height);
    background-color: var(--color-surface-2);
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-sm);
    box-shadow: 
      inset 0 1px 0 rgba(255, 255, 255, 0.10),
      inset 0 -1px 0 rgba(0, 0, 0, 0.5);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 3px;
    padding: 4px 6px;
    transition: background-color 0.08s ease, border-color 0.08s ease, box-shadow 0.08s ease;
    user-select: none;
    -webkit-user-select: none;
    -webkit-touch-callout: none;
    touch-action: none;
    box-sizing: border-box;
    width: 100%;
    cursor: pointer;
  }

  .dominant-btn:active:not(:disabled),
  .dominant-btn.is-pressed:not(:disabled) {
    background-color: var(--color-surface-active);
    box-shadow: inset 0 1.5px 3px rgba(0, 0, 0, 0.7);
    transform: none;
  }

  .dominant-btn:disabled {
    cursor: not-allowed;
  }

  .dominant-btn:disabled .btn-symbol,
  .dominant-btn:disabled .btn-name {
    opacity: 0.35;
  }

  .btn-symbol {
    font-family: var(--font-mono);
    font-size: clamp(24px, 4vh, 36px);
    font-weight: 900;
    line-height: 1;
    color: var(--color-text-primary);
  }

  .btn-name {
    font-size: var(--text-xs);
    font-weight: 700;
    color: var(--color-text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.5px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 95%;
  }

  /* Variant symbol accents */
  .variant-accent .btn-symbol {
    color: var(--color-accent-primary);
  }

  .variant-warning .btn-symbol {
    color: var(--color-accent-warning);
  }

  .variant-secondary .btn-symbol {
    color: var(--color-text-secondary);
  }

  /* Ready to commit state: clear bright letter without colored glow or gradient */
  .dominant-btn.is-ready {
    border-color: var(--color-border-subtle);
  }

  .dominant-btn.is-ready .btn-symbol {
    color: #ffffff;
  }

  .dominant-btn.is-ready .btn-name {
    color: var(--color-text-primary);
  }

  .dominant-btn.is-ready:active,
  .dominant-btn.is-ready.is-pressed {
    background-color: var(--color-surface-active);
    box-shadow: inset 0 1.5px 3px rgba(0, 0, 0, 0.7);
    transform: none;
  }
</style>
