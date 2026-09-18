<script lang="ts">
  import { settings } from "../../state/settings.svelte";
  import { Trash, Check } from "phosphor-svelte";

  interface Props {
    onAction: () => void;
    disabled?: boolean;
    label?: string;
    showLabel?: boolean;
    confirmedLabel?: string;
    icon?: string;
    ariaLabel?: string;
    holdDuration?: number;
    class?: string;
  }

  let {
    onAction,
    disabled = false,
    label = "Vymazat",
    showLabel = false,
    confirmedLabel = "Smazáno",
    icon,
    ariaLabel = "Podržte pro vymazání",
    holdDuration = 450,
    class: customClass = "",
  }: Props = $props();

  let isHolding = $state(false);
  let progress = $state(0);
  let isConfirmed = $state(false);
  let hasTriggered = $state(false);

  let holdStartTime = 0;
  let holdRafId: number | null = null;

  function cancelHold() {
    isHolding = false;
    if (holdRafId !== null) {
      cancelAnimationFrame(holdRafId);
      holdRafId = null;
    }
    if (!isConfirmed) {
      progress = 0;
    }
  }

  function startHold() {
    cancelHold();
    isHolding = true;
    holdStartTime = performance.now();

    function step(now: number) {
      if (!isHolding || hasTriggered) return;
      const elapsed = now - holdStartTime;
      const p = Math.min(1, elapsed / holdDuration);
      progress = p;

      if (p >= 1) {
        cancelHold();
        trigger();
      } else {
        holdRafId = requestAnimationFrame(step);
      }
    }

    holdRafId = requestAnimationFrame(step);
  }

  // Auto-reset when disabled becomes true
  $effect(() => {
    if (disabled) {
      cancelHold();
      hasTriggered = false;
      isConfirmed = false;
      progress = 0;
    }
  });

  function trigger() {
    if (hasTriggered || disabled) return;
    hasTriggered = true;
    isConfirmed = true;
    progress = 1;
    settings.vibrate(35);
    onAction();

    setTimeout(() => {
      progress = 0;
      isConfirmed = false;
      hasTriggered = false;
    }, 350);
  }

  function handlePointerDown(e: PointerEvent) {
    if (disabled || isConfirmed) return;
    if (e.button !== 0 && e.pointerType === "mouse") return;
    e.preventDefault();
    startHold();
  }

  function handlePointerUp() {
    if (!isConfirmed) {
      cancelHold();
    }
  }

  function handlePointerCancel() {
    if (!isConfirmed) {
      cancelHold();
    }
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (disabled || isConfirmed) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (!isHolding) {
        startHold();
      }
    }
  }

  function handleKeyUp(e: KeyboardEvent) {
    if (e.key === "Enter" || e.key === " ") {
      if (!isConfirmed) {
        cancelHold();
      }
    }
  }
</script>

<button
  type="button"
  class="utility-btn hold-delete-btn {customClass}"
  class:is-holding={isHolding}
  class:is-confirmed={isConfirmed}
  {disabled}
  title={ariaLabel || label}
  aria-label={ariaLabel || label}
  onpointerdown={handlePointerDown}
  onpointerup={handlePointerUp}
  onpointerleave={handlePointerCancel}
  onpointercancel={handlePointerCancel}
  oncontextmenu={(e) => e.preventDefault()}
  onkeydown={handleKeyDown}
  onkeyup={handleKeyUp}
>
  <!-- Liquid progress fill sweeping left to right -->
  <div
    class="fill-bar"
    class:is-active={progress > 0 || isConfirmed}
    class:is-confirmed={isConfirmed}
    class:no-transition={isHolding}
    style:width="{progress * 100}%"
  ></div>

  <!-- Button content -->
  <span class="btn-content">
    <span class="btn-icon">
      {#if isConfirmed}
        <Check size={20} weight="bold" />
      {:else}
        <Trash size={20} weight="duotone" />
      {/if}
    </span>
    {#if showLabel}
      <span class="btn-label">{isConfirmed ? confirmedLabel : label}</span>
    {/if}
  </span>
</button>

<style>
  .utility-btn {
    position: relative;
    height: var(--utility-row-height);
    padding: 0 var(--space-sm);
    background-color: var(--color-surface-2);
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-sm);
    font-size: var(--text-sm);
    font-weight: 600;
    line-height: 1;
    color: var(--color-accent-danger);
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    cursor: pointer;
    user-select: none;
    -webkit-user-select: none;
    touch-action: none;
    box-shadow: 
      inset 0 1px 0 rgba(255, 255, 255, 0.10),
      inset 0 -1px 0 rgba(0, 0, 0, 0.5);
    transition: background-color 0.12s, border-color 0.12s, box-shadow 0.08s, transform 0.08s;
    box-sizing: border-box;
    width: 100%;
    white-space: nowrap;
    overflow: hidden;
  }

  .utility-btn:active:not(:disabled),
  .utility-btn.is-holding {
    box-shadow: inset 0 1.5px 3px rgba(0, 0, 0, 0.7);
  }

  .utility-btn:disabled {
    cursor: not-allowed;
  }

  .utility-btn:disabled .btn-content {
    opacity: 0.35;
    color: var(--color-text-secondary);
  }

  .fill-bar {
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 0%;
    opacity: 0;
    background: linear-gradient(
      90deg,
      rgba(239, 68, 68, 0.45) 0%,
      rgba(239, 68, 68, 0.85) 100%
    );
    border-right: 1.5px solid var(--color-accent-danger);
    pointer-events: none;
    transition: width 0.2s cubic-bezier(0.2, 0.8, 0.2, 1), opacity 0.1s ease;
    z-index: 1;
  }

  .fill-bar.is-active {
    opacity: 1;
  }

  .fill-bar.no-transition {
    transition: none;
  }

  .fill-bar.is-confirmed {
    width: 100% !important;
    background: var(--color-accent-danger);
    border-right: none;
  }

  .utility-btn.is-confirmed {
    background-color: var(--color-accent-danger);
    color: #ffffff;
  }

  .btn-content {
    position: relative;
    z-index: 2;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    pointer-events: none;
  }

  .btn-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .btn-label {
    letter-spacing: 0.2px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
</style>
