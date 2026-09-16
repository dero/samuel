<script lang="ts">
  import { settings } from "../../state/settings.svelte";
  import { Trash, Check } from "phosphor-svelte";

  interface Props {
    onAction: () => void;
    disabled?: boolean;
    label?: string;
    confirmedLabel?: string;
    icon?: string;
    ariaLabel?: string;
    threshold?: number;
    holdDuration?: number;
    class?: string;
  }

  let {
    onAction,
    disabled = false,
    label = "Vymazat",
    confirmedLabel = "Smazáno",
    icon,
    ariaLabel,
    threshold = 0.85,
    holdDuration = 400,
    class: customClass = "",
  }: Props = $props();

  let trackEl = $state<HTMLElement | null>(null);
  let thumbEl = $state<HTMLElement | null>(null);

  let isDragging = $state(false);
  let isHolding = $state(false);
  let isManualDrag = $state(false);
  let currentX = $state(0);
  let maxDistance = $state(0);
  let isConfirmed = $state(false);
  let hasTriggered = $state(false);

  let startPointerX = 0;
  let holdStartTime = 0;
  let holdRafId: number | null = null;

  let progress = $derived(
    maxDistance > 0 ? Math.min(1, Math.max(0, currentX / maxDistance)) : 0,
  );
  let labelOpacity = $derived(
    isConfirmed ? 0 : Math.max(0, 1 - progress * 1.8),
  );
  let fillWidth = $derived(
    isConfirmed
      ? (trackEl?.clientWidth ?? 0)
      : maxDistance > 0 && currentX > 0
        ? Math.min(
            trackEl?.clientWidth ?? 0,
            currentX + progress * ((thumbEl?.offsetWidth ?? 36) + 3),
          )
        : 0,
  );

  function cancelHold() {
    isHolding = false;
    if (holdRafId !== null) {
      cancelAnimationFrame(holdRafId);
      holdRafId = null;
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
      currentX = p * maxDistance;

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
      currentX = 0;
      isDragging = false;
      isHolding = false;
      isManualDrag = false;
      hasTriggered = false;
      isConfirmed = false;
    }
  });

  function updateMaxDistance() {
    if (trackEl && thumbEl) {
      const trackRect = trackEl.getBoundingClientRect();
      const thumbRect = thumbEl.getBoundingClientRect();
      maxDistance = Math.max(0, trackRect.width - thumbRect.width - 6);
    }
  }

  function trigger() {
    if (hasTriggered || disabled) return;
    hasTriggered = true;
    isConfirmed = true;
    settings.vibrate(35);
    onAction();

    setTimeout(() => {
      currentX = 0;
      isConfirmed = false;
      hasTriggered = false;
    }, 350);
  }

  function handlePointerDown(e: PointerEvent) {
    if (disabled || isConfirmed) return;
    // Only primary mouse button or touch
    if (e.button !== 0 && e.pointerType === "mouse") return;

    updateMaxDistance();
    if (maxDistance <= 0) return;

    isDragging = true;
    isManualDrag = false;
    hasTriggered = false;
    startPointerX = e.clientX;

    const target = e.currentTarget as HTMLElement;
    try {
      target.setPointerCapture(e.pointerId);
    } catch {
      // ignore
    }

    // Start auto-slide on press and hold
    startHold();
  }

  function handlePointerMove(e: PointerEvent) {
    if (!isDragging || hasTriggered) return;

    const deltaX = e.clientX - startPointerX;

    // If user moves finger horizontally by > 8px, switch from holding to active dragging
    if (!isManualDrag && Math.abs(deltaX) > 8) {
      cancelHold();
      isManualDrag = true;
      // Adjust startPointerX so drag position smoothly continues from current position
      startPointerX = e.clientX - currentX;
    }

    if (isManualDrag) {
      const dragDelta = e.clientX - startPointerX;
      currentX = Math.max(0, Math.min(dragDelta, maxDistance));

      if (maxDistance > 0 && currentX / maxDistance >= 0.95) {
        trigger();
      }
    }
  }

  function handlePointerUp(e: PointerEvent) {
    cancelHold();
    if (!isDragging) return;
    isDragging = false;

    const target = e.currentTarget as HTMLElement;
    try {
      target.releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }

    if (!hasTriggered) {
      if (
        isManualDrag &&
        maxDistance > 0 &&
        currentX / maxDistance >= threshold
      ) {
        trigger();
      } else {
        currentX = 0;
      }
    }
    isManualDrag = false;
  }

  function handlePointerCancel(e: PointerEvent) {
    cancelHold();
    if (!isDragging) return;
    isDragging = false;
    isManualDrag = false;
    if (!hasTriggered) {
      currentX = 0;
    }
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (disabled || isConfirmed) return;

    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      updateMaxDistance();
      currentX = maxDistance;
      trigger();
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      updateMaxDistance();
      const step = maxDistance * 0.34;
      currentX = Math.min(maxDistance, currentX + step);
      if (currentX >= maxDistance * 0.95) {
        trigger();
      }
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      updateMaxDistance();
      const step = maxDistance * 0.34;
      currentX = Math.max(0, currentX - step);
    } else if (e.key === "Escape") {
      currentX = 0;
    }
  }
</script>

<div
  bind:this={trackEl}
  class="slide-track {customClass}"
  class:is-active={isDragging || isHolding}
  class:is-confirmed={isConfirmed}
  class:is-disabled={disabled}
  role="slider"
  aria-label={ariaLabel || label}
  aria-valuemin={0}
  aria-valuemax={100}
  aria-valuenow={Math.round(progress * 100)}
  aria-disabled={disabled}
  tabindex={disabled ? -1 : 0}
  title="Podržte nebo posuňte pro vymazání"
  onpointerdown={handlePointerDown}
  onpointermove={handlePointerMove}
  onpointerup={handlePointerUp}
  onpointercancel={handlePointerCancel}
  oncontextmenu={(e) => e.preventDefault()}
  onkeydown={handleKeyDown}
>
  <!-- Background progress fill -->
  <div
    class="slide-fill"
    class:no-transition={isDragging || isHolding}
    class:is-active={currentX > 0 || isConfirmed}
    style:width="{fillWidth}px"
  ></div>

  <!-- Centered / Offset text guide with static subtle arrows -->
  <div class="slide-label-container" style:opacity={labelOpacity}>
    <span class="slide-label-text">{label}</span>
    <span class="slide-chevrons" aria-hidden="true">››</span>
  </div>

  {#if isConfirmed}
    <div class="slide-confirmed-text">
      {confirmedLabel}
    </div>
  {/if}

  <!-- Draggable thumb -->
  <div
    bind:this={thumbEl}
    class="slide-thumb"
    class:no-transition={isDragging || isHolding}
    class:is-active={isDragging || isHolding}
    class:is-confirmed={isConfirmed}
    style:transform="translateX({currentX}px)"
  >
    <span class="thumb-icon">
      {#if isConfirmed}
        <Check size={18} weight="bold" />
      {:else if !icon || icon === "🗑️" || icon === "trash"}
        <Trash size={18} weight="duotone" />
      {:else}
        {icon}
      {/if}
    </span>
  </div>
</div>

<style>
  .slide-track {
    position: relative;
    height: 42px;
    width: 100%;
    background-color: var(--color-surface-2);
    border: 1px solid rgba(239, 68, 68, 0.3);
    border-radius: var(--radius-md);
    overflow: hidden;
    display: flex;
    align-items: center;
    user-select: none;
    -webkit-user-select: none;
    touch-action: none;
    cursor: grab;
    outline: none;
    transition:
      border-color 0.15s,
      opacity 0.15s;
    box-sizing: border-box;
  }

  .slide-track:focus-visible {
    outline: 2px solid var(--color-border-focus);
    outline-offset: 1px;
  }

  .slide-track.is-active {
    cursor: grabbing;
    border-color: rgba(239, 68, 68, 0.6);
  }

  .slide-track.is-confirmed {
    border-color: var(--color-accent-danger);
    background-color: rgba(239, 68, 68, 0.15);
  }

  .slide-track.is-disabled {
    opacity: 0.35;
    cursor: not-allowed;
    border-color: var(--color-border-subtle);
  }

  /* Progress Fill */
  .slide-fill {
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    background: linear-gradient(
      90deg,
      rgba(239, 68, 68, 0.12) 0%,
      rgba(239, 68, 68, 0.35) 100%
    );
    border-right: 1px solid rgba(239, 68, 68, 0.5);
    pointer-events: none;
    opacity: 0;
    transition:
      width 0.25s cubic-bezier(0.2, 0.9, 0.3, 1),
      opacity 0.2s ease;
    z-index: 1;
  }

  .slide-fill.is-active {
    opacity: 1;
  }

  .slide-fill.no-transition {
    transition: none;
  }

  /* Label & static chevrons (no blinking) */
  .slide-label-container {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    padding-left: 32px;
    padding-right: 12px;
    gap: 6px;
    color: var(--color-accent-danger);
    font-size: 13.5px;
    font-weight: 600;
    letter-spacing: 0.2px;
    pointer-events: none;
    transition: opacity 0.15s ease;
    z-index: 2;
  }

  .slide-label-text {
    white-space: nowrap;
  }

  .slide-chevrons {
    display: inline-block;
    font-size: 13px;
    font-weight: 700;
    letter-spacing: -1px;
    opacity: 0.55;
  }

  .slide-confirmed-text {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--color-accent-danger);
    font-size: 13px;
    font-weight: 700;
    letter-spacing: 0.5px;
    pointer-events: none;
    animation: fadeIn 0.15s ease-out;
    z-index: 2;
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: scale(0.95);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }

  /* Thumb */
  .slide-thumb {
    position: absolute;
    left: 3px;
    top: 3px;
    bottom: 3px;
    width: 36px;
    background-color: var(--color-surface-3);
    border: 1px solid rgba(239, 68, 68, 0.4);
    border-radius: calc(var(--radius-md) - 3px);
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.45);
    pointer-events: none;
    transition:
      transform 0.25s cubic-bezier(0.2, 0.9, 0.3, 1),
      background-color 0.15s,
      border-color 0.15s;
    box-sizing: border-box;
    z-index: 3;
  }

  .slide-thumb.no-transition {
    transition: none;
  }

  .slide-thumb.is-active {
    background-color: var(--color-surface-active);
    border-color: var(--color-accent-danger);
    box-shadow: 0 2px 8px rgba(239, 68, 68, 0.35);
  }

  .slide-thumb.is-confirmed {
    background-color: var(--color-accent-danger);
    border-color: var(--color-accent-danger);
    color: #ffffff;
  }

  .thumb-icon {
    font-size: 15px;
    line-height: 1;
    display: flex;
    align-items: center;
    justify-content: center;
  }
</style>
