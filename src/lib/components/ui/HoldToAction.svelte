<script lang="ts">
  import { settings } from "../../state/settings.svelte";
  import { toast } from "../../state/toast.svelte";
  import { Trash, Check } from "phosphor-svelte";

  interface Props {
    onAction: () => void;
    disabled?: boolean;
    label?: string;
    showLabel?: boolean;
    confirmedLabel?: string;
    ariaLabel?: string;
    tapWarning?: string;
    holdDuration?: number;
    variant?: "utility" | "outline" | "menu" | "icon-only";
    iconSize?: number;
    class?: string;
  }

  let {
    onAction,
    disabled = false,
    label = "Vymazat",
    showLabel,
    confirmedLabel = "Smazáno",
    ariaLabel,
    tapWarning,
    holdDuration = 380,
    variant = "utility",
    iconSize,
    class: customClass = "",
  }: Props = $props();

  let effectiveShowLabel = $derived(
    showLabel ?? (variant === "menu" || variant === "outline")
  );

  let effectiveIconSize = $derived(
    iconSize ?? (variant === "menu" ? 20 : variant === "outline" ? 16 : variant === "icon-only" ? 15 : 20)
  );

  let effectiveTapWarning = $derived(
    tapWarning ?? (label.toLowerCase() === "vymazat" ? "Podržte pro smazání" : `Podržte pro ${label.toLowerCase()}`)
  );

  let isHolding = $state(false);
  let progress = $state(0);
  let isConfirmed = $state(false);
  let hasTriggered = $state(false);
  let isShaking = $state(false);

  let holdStartTime = 0;
  let holdRafId: number | null = null;
  let shakeTimeoutId: ReturnType<typeof setTimeout> | null = null;

  function cancelHold(wasUserTap = false) {
    const elapsed = holdStartTime > 0 ? performance.now() - holdStartTime : 0;
    isHolding = false;

    if (holdRafId !== null) {
      cancelAnimationFrame(holdRafId);
      holdRafId = null;
    }

    if (!isConfirmed) {
      progress = 0;
    }

    holdStartTime = 0;

    // If released before completion after an intentional tap (>35ms and <holdDuration)
    if (wasUserTap && !isConfirmed && !disabled && !hasTriggered) {
      if (elapsed >= 35 && elapsed < holdDuration) {
        triggerShakeAndToast();
      }
    }
  }

  function triggerShakeAndToast() {
    if (shakeTimeoutId) {
      clearTimeout(shakeTimeoutId);
    }
    isShaking = true;
    shakeTimeoutId = setTimeout(() => {
      isShaking = false;
      shakeTimeoutId = null;
    }, 320);

    settings.vibrate(15);
    toast.show(effectiveTapWarning, { type: "warning", duration: 1800 });
  }

  function startHold() {
    cancelHold(false);
    isHolding = true;
    holdStartTime = performance.now();

    function step(now: number) {
      if (!isHolding || hasTriggered) return;
      const elapsed = now - holdStartTime;
      const p = Math.min(1, elapsed / holdDuration);
      progress = p;

      if (p >= 1) {
        cancelHold(false);
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
      cancelHold(false);
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
      cancelHold(true);
    }
  }

  function handlePointerCancel() {
    if (!isConfirmed) {
      cancelHold(false);
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
        cancelHold(true);
      }
    }
  }
</script>

<button
  type="button"
  class="hold-btn variant-{variant} {customClass}"
  class:is-holding={isHolding}
  class:is-confirmed={isConfirmed}
  class:is-shaking={isShaking}
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
  <!-- Thin top progress line positioned along the top edge of the button -->
  <div class="progress-track" aria-hidden="true">
    <div
      class="progress-bar"
      class:is-active={progress > 0 || isConfirmed}
      class:is-confirmed={isConfirmed}
      class:no-transition={isHolding}
      style:width="{progress * 100}%"
    ></div>
  </div>

  <!-- Button content -->
  <span class="btn-content">
    <span class="btn-icon">
      {#if isConfirmed}
        <Check size={effectiveIconSize} weight="bold" />
      {:else}
        <Trash size={effectiveIconSize} weight="duotone" />
      {/if}
    </span>
    {#if effectiveShowLabel}
      <span class="btn-label">{isConfirmed ? confirmedLabel : label}</span>
    {/if}
  </span>
</button>

<style>
  .hold-btn {
    position: relative;
    box-sizing: border-box;
    cursor: pointer;
    user-select: none;
    -webkit-user-select: none;
    touch-action: none;
    white-space: nowrap;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background-color 0.12s, border-color 0.12s, box-shadow 0.08s;
  }

  /* Utility variant (default cipher keypad button) */
  .variant-utility {
    width: 100%;
    height: var(--utility-row-height, 42px);
    min-height: 0;
    padding: 0 var(--space-xs);
    background-color: var(--color-surface-2);
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-sm);
    font-size: var(--text-sm);
    font-weight: 600;
    line-height: 1;
    color: var(--color-accent-danger);
    box-shadow: 
      inset 0 1px 0 rgba(255, 255, 255, 0.10),
      inset 0 -1px 0 rgba(0, 0, 0, 0.5);
  }

  /* Menu variant (for BottomSheet menus like ModuleMenu) */
  .variant-menu {
    width: 100%;
    min-height: var(--tap-min-size, 48px);
    padding: var(--space-md);
    background-color: var(--color-surface-2);
    border: 1px solid rgba(239, 68, 68, 0.3);
    border-radius: var(--radius-md);
    font-size: var(--text-base);
    font-weight: 600;
    color: var(--color-accent-danger);
    justify-content: flex-start;
  }

  /* Outline variant (for Settings cards) */
  .variant-outline {
    width: 100%;
    min-height: var(--tap-min-size, 48px);
    padding: 10px 14px;
    background-color: transparent;
    border: 1px solid var(--color-accent-danger);
    border-radius: var(--radius-sm);
    font-size: var(--text-sm);
    font-weight: 600;
    color: var(--color-accent-danger);
    justify-content: center;
  }

  /* Icon-only variant (for row actions like deleting custom alphabets) */
  .variant-icon-only {
    width: 36px;
    height: 36px;
    min-height: 36px;
    padding: 0;
    background-color: transparent;
    border: 1px solid rgba(239, 68, 68, 0.25);
    border-radius: var(--radius-sm);
    color: var(--color-accent-danger);
    justify-content: center;
  }

  .hold-btn:active:not(:disabled),
  .hold-btn.is-holding {
    box-shadow: inset 0 1.5px 3px rgba(0, 0, 0, 0.7);
  }

  .hold-btn:disabled {
    cursor: not-allowed;
  }

  .hold-btn:disabled .btn-content {
    opacity: 0.48;
    color: var(--color-text-secondary);
  }

  /* Progress track along top edge */
  .progress-track {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: transparent;
    pointer-events: none;
    z-index: 3;
    overflow: hidden;
  }

  .progress-bar {
    position: absolute;
    top: 0;
    left: 0;
    bottom: 0;
    width: 0%;
    opacity: 0;
    background: var(--color-accent-danger);
    box-shadow: 0 0 6px rgba(239, 68, 68, 0.8), 0 0 2px rgba(239, 68, 68, 1);
    pointer-events: none;
    transition: width 0.15s ease-out, opacity 0.1s ease;
  }

  .progress-bar.is-active {
    opacity: 1;
  }

  .progress-bar.no-transition {
    transition: none;
  }

  .progress-bar.is-confirmed {
    width: 100% !important;
    opacity: 1;
  }

  .hold-btn.is-confirmed {
    background-color: var(--color-accent-danger);
    color: #ffffff;
    border-color: var(--color-accent-danger);
  }

  /* Subtle horizontal micro-shake when tap is not held */
  @keyframes microShake {
    0%, 100% {
      transform: translateX(0);
    }
    20% {
      transform: translateX(-3px);
    }
    40% {
      transform: translateX(3px);
    }
    60% {
      transform: translateX(-2px);
    }
    80% {
      transform: translateX(2px);
    }
  }

  .hold-btn.is-shaking {
    animation: microShake 0.32s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
  }

  .btn-content {
    position: relative;
    z-index: 2;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--space-sm);
    pointer-events: none;
    line-height: 1;
  }

  .variant-menu .btn-content {
    gap: var(--space-md);
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
    font-size: inherit;
    font-weight: inherit;
    line-height: 1.2;
    letter-spacing: 0.2px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
</style>
