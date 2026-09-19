<script lang="ts">
  import { settings } from '../../state/settings.svelte';

  interface Props {
    pendingChar?: string | null;
    disabled?: boolean;
    spaceDisabled?: boolean;
    commitDisabled?: boolean;
    spaceSymbol?: string;
    commitSymbol?: string;
    onSpace: () => void;
    onCommit?: () => void;
    class?: string;
  }

  let {
    pendingChar = '',
    disabled = false,
    spaceDisabled = false,
    commitDisabled = false,
    spaceSymbol = '␣',
    commitSymbol,
    onSpace,
    onCommit,
    class: customClass = ''
  }: Props = $props();

  const isCommitMode = $derived(!!pendingChar && pendingChar.length > 0);
  const effectiveDisabled = $derived(
    disabled || (isCommitMode ? commitDisabled : spaceDisabled)
  );

  const displaySymbol = $derived.by(() => {
    if (isCommitMode) {
      if (commitSymbol) return commitSymbol;
      return pendingChar || '↵';
    }
    return spaceSymbol;
  });

  const displayTitle = $derived(
    isCommitMode ? (pendingChar ? `Vložit „${pendingChar}“` : 'Vložit znak') : 'Mezera'
  );

  function handlePointerDown(e: PointerEvent) {
    if (effectiveDisabled) return;
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    e.preventDefault();

    if (isCommitMode) {
      settings.vibrate(22);
      onCommit?.();
    } else {
      settings.vibrate(20);
      onSpace();
    }
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (effectiveDisabled) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (isCommitMode) {
        settings.vibrate(22);
        onCommit?.();
      } else {
        settings.vibrate(20);
        onSpace();
      }
    }
  }
</script>

<button
  type="button"
  class="utility-btn space-commit-btn {customClass}"
  class:is-commit={isCommitMode}
  disabled={effectiveDisabled}
  title={displayTitle}
  aria-label={displayTitle}
  onpointerdown={handlePointerDown}
  oncontextmenu={(e) => e.preventDefault()}
  onkeydown={handleKeyDown}
>
  {#if isCommitMode}
    <span
      class="btn-symbol"
      class:is-char={pendingChar && pendingChar !== '↵'}
      title={pendingChar || undefined}
    >
      {displaySymbol}
    </span>
  {:else if spaceSymbol && spaceSymbol !== '␣'}
    <span class="btn-symbol">{spaceSymbol}</span>
  {:else}
    <span class="btn-icon space-icon-wrapper">
      <svg viewBox="0 0 24 24" class="space-svg" aria-hidden="true">
        <path d="M5 10v4h14v-4" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" />
      </svg>
    </span>
  {/if}
</button>

<style>
  .space-commit-btn {
    height: var(--utility-row-height, 42px);
    padding: 0 var(--space-xs);
    background-color: var(--color-surface-2);
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-sm);
    font-size: var(--text-sm);
    font-weight: 700;
    line-height: 1;
    color: var(--color-text-primary);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    user-select: none;
    -webkit-user-select: none;
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.10),
      inset 0 -1px 0 rgba(0, 0, 0, 0.5);
    transition:
      background-color 0.12s,
      border-color 0.12s,
      box-shadow 0.08s,
      color 0.12s;
    box-sizing: border-box;
    width: 100%;
    min-width: 0;
    white-space: nowrap;
    overflow: hidden;
  }

  .space-commit-btn:active:not(:disabled) {
    background-color: var(--color-surface-active);
    box-shadow: inset 0 1.5px 3px rgba(0, 0, 0, 0.7);
    transform: none;
  }

  /* Active Commit / Enter state - top highlight unified with idle state */
  .space-commit-btn.is-commit {
    border-color: rgba(0, 210, 255, 0.45);
    background-color: var(--color-surface-2);
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.10),
      inset 0 -1px 0 rgba(0, 0, 0, 0.6),
      0 0 10px rgba(0, 210, 255, 0.18);
  }

  .space-commit-btn.is-commit:active:not(:disabled) {
    background-color: var(--color-surface-active);
    border-color: var(--color-accent-primary);
  }

  .space-commit-btn:disabled {
    cursor: not-allowed;
    border-color: var(--color-border-subtle);
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.05),
      inset 0 -1px 0 rgba(0, 0, 0, 0.5);
  }

  .space-commit-btn:disabled .btn-symbol,
  .space-commit-btn:disabled .space-svg {
    opacity: 0.35;
    color: var(--color-text-secondary);
  }

  .btn-symbol {
    font-size: 18px;
    font-weight: 700;
    line-height: 1;
    display: block;
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    text-align: center;
    color: var(--color-text-secondary);
    transition: color 0.12s ease, font-size 0.12s ease;
    padding: 0 4px;
    box-sizing: border-box;
  }

  .space-commit-btn.is-commit .btn-symbol {
    color: var(--color-accent-primary);
    font-family: var(--font-mono);
    font-weight: 800;
  }

  .btn-symbol.is-char {
    font-size: clamp(12px, 3.5vw, 16px);
    letter-spacing: 0.5px;
  }

  .space-icon-wrapper {
    display: flex;
    align-items: center;
    justify-content: center;
    line-height: 0;
  }

  .space-svg {
    width: 22px;
    height: 16px;
    color: var(--color-text-secondary);
    display: block;
    flex-shrink: 0;
  }
</style>
