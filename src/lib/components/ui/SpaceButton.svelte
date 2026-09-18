<script lang="ts">
  import { settings } from '../../state/settings.svelte';

  interface Props {
    onAction: () => void;
    disabled?: boolean;
    label?: string;
    showLabel?: boolean;
    symbol?: string;
    title?: string;
    class?: string;
  }

  let {
    onAction,
    disabled = false,
    label = 'Mezera',
    showLabel = false,
    symbol = '␣',
    title = 'Vložit mezeru',
    class: customClass = ''
  }: Props = $props();

  function handlePointerDown(e: PointerEvent) {
    if (disabled) return;
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    e.preventDefault();
    settings.vibrate(20);
    onAction();
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (disabled) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      settings.vibrate(20);
      onAction();
    }
  }
</script>

<button
  type="button"
  class="utility-btn space-btn {customClass}"
  {disabled}
  title={title}
  aria-label={label}
  onpointerdown={handlePointerDown}
  oncontextmenu={(e) => e.preventDefault()}
  onkeydown={handleKeyDown}
>
  <span class="btn-symbol">{symbol}</span>
  {#if showLabel}
    <span class="btn-label">{label}</span>
  {/if}
</button>

<style>
  .utility-btn {
    height: var(--utility-row-height);
    padding: 0 var(--space-sm);
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
    -webkit-user-select: none;
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

  .utility-btn:disabled .btn-symbol,
  .utility-btn:disabled .btn-label {
    opacity: 0.35;
    color: var(--color-text-secondary);
  }

  .btn-symbol {
    font-size: 20px;
    font-weight: 700;
    line-height: 1;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    color: var(--color-text-secondary);
    flex-shrink: 0;
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
