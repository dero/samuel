<script lang="ts">
  import { X } from 'phosphor-svelte';
  import { settings } from '../../state/settings.svelte';

  interface Props {
    open: boolean;
    title: string;
    icon?: any;
    badge?: string | number;
    maxWidth?: string;
    maxHeight?: string;
    height?: string;
    scrollable?: boolean;
    padding?: boolean;
    zIndex?: number;
    onClose: () => void;
    children?: import('svelte').Snippet;
    headerActions?: import('svelte').Snippet;
  }

  let {
    open,
    title,
    icon: IconComponent,
    badge,
    maxWidth = '520px',
    maxHeight = '80dvh',
    height,
    scrollable = true,
    padding = true,
    zIndex = 210,
    onClose,
    children,
    headerActions
  }: Props = $props();

  let isDragging = $state(false);
  let dragOffsetY = $state(0);
  let startY = 0;
  let startTime = 0;

  function handleBackdropClick(e: MouseEvent) {
    if (e.target === e.currentTarget) {
      settings.vibrate(15);
      onClose();
    }
  }

  function handleCloseClick() {
    settings.vibrate(20);
    onClose();
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === 'Escape' && open) {
      onClose();
    }
  }

  function shouldDismiss(): boolean {
    const elapsed = Math.max(1, Date.now() - startTime);
    const velocity = dragOffsetY / elapsed; // px/ms
    return dragOffsetY > 50 || (velocity > 0.25 && dragOffsetY > 12);
  }

  function dragHeader(node: HTMLElement) {
    let isTouchActive = false;

    function onTouchStart(e: TouchEvent) {
      if (e.touches.length !== 1) return;
      if ((e.target as HTMLElement).closest('button')) return;
      startY = e.touches[0].clientY;
      startTime = Date.now();
      dragOffsetY = 0;
      isDragging = true;
      isTouchActive = true;
    }

    function onTouchMove(e: TouchEvent) {
      if (!isDragging || !isTouchActive) return;
      // Guarantee the mobile compositor NEVER initiates kinetic fling scroll momentum
      if (e.cancelable) {
        e.preventDefault();
      }
      if (e.touches.length === 0) return;
      const currentY = e.touches[0].clientY;
      const dy = currentY - startY;
      dragOffsetY = Math.max(0, dy);
    }

    function onTouchEnd(e: TouchEvent) {
      if (!isDragging || !isTouchActive) return;
      isTouchActive = false;
      const dismiss = shouldDismiss();
      isDragging = false;
      dragOffsetY = 0;
      if (e.cancelable) {
        e.preventDefault();
      }
      if (dismiss) {
        settings.vibrate(20);
        if (typeof window !== 'undefined') {
          window.scrollTo(0, 0);
        }
        onClose();
      }
    }

    function onTouchCancel() {
      isTouchActive = false;
      isDragging = false;
      dragOffsetY = 0;
    }

    function onMouseDown(e: MouseEvent) {
      if (e.button !== 0 || (e.target as HTMLElement).closest('button')) return;
      startY = e.clientY;
      startTime = Date.now();
      dragOffsetY = 0;
      isDragging = true;

      function onMouseMove(ev: MouseEvent) {
        if (!isDragging) return;
        const dy = ev.clientY - startY;
        dragOffsetY = Math.max(0, dy);
      }

      function onMouseUp() {
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);
        if (!isDragging) return;
        const dismiss = shouldDismiss();
        isDragging = false;
        dragOffsetY = 0;
        if (dismiss) {
          settings.vibrate(20);
          onClose();
        }
      }

      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
    }

    node.addEventListener('touchstart', onTouchStart, { passive: true });
    node.addEventListener('touchmove', onTouchMove, { passive: false });
    node.addEventListener('touchend', onTouchEnd, { passive: false });
    node.addEventListener('touchcancel', onTouchCancel, { passive: true });
    node.addEventListener('mousedown', onMouseDown);

    return {
      destroy() {
        node.removeEventListener('touchstart', onTouchStart);
        node.removeEventListener('touchmove', onTouchMove);
        node.removeEventListener('touchend', onTouchEnd);
        node.removeEventListener('touchcancel', onTouchCancel);
        node.removeEventListener('mousedown', onMouseDown);
      }
    };
  }
</script>

<svelte:window onkeydown={handleKeyDown} />

{#if open}
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div class="sheet-backdrop type-scaled" style:z-index={zIndex} onclick={handleBackdropClick}>
    <div
      class="sheet-panel"
      style:max-width={maxWidth}
      style:max-height={maxHeight}
      style:height={height || null}
      style:transform={isDragging && dragOffsetY > 0 ? `translateY(${dragOffsetY}px)` : null}
      style:transition={isDragging ? 'none' : 'transform 0.18s cubic-bezier(0.16, 1, 0.3, 1)'}
      onclick={(e) => e.stopPropagation()}
    >
      <header
        class="sheet-header"
        class:is-dragging={isDragging}
        use:dragHeader
      >
        <div class="sheet-drag-handle" aria-hidden="true"></div>
        <div class="sheet-title-group">
          {#if IconComponent}
            <span class="sheet-title-icon">
              <IconComponent size={20} weight="duotone" />
            </span>
          {/if}
          <span class="sheet-title">{title}</span>
          {#if badge !== undefined && badge !== ''}
            <span class="sheet-badge">{badge}</span>
          {/if}
        </div>

        <div class="sheet-actions">
          {#if headerActions}
            {@render headerActions()}
          {/if}
          <button
            type="button"
            class="sheet-close-btn"
            aria-label="Zavřít panel"
            oncontextmenu={(e) => e.preventDefault()}
            onclick={handleCloseClick}
          >
            <X size={20} weight="bold" />
          </button>
        </div>
      </header>

      <div
        class="sheet-body"
        class:is-scrollable={scrollable}
        class:has-padding={padding}
        data-allow-copy
      >
        {#if children}
          {@render children()}
        {/if}
      </div>
    </div>
  </div>
{/if}

<style>
  .sheet-backdrop {
    position: fixed;
    inset: 0;
    background-color: rgba(0, 0, 0, 0.72);
    backdrop-filter: blur(4px);
    -webkit-backdrop-filter: blur(4px);
    z-index: 210;
    display: flex;
    align-items: flex-end;
    justify-content: center;
    touch-action: none;
    overscroll-behavior: none;
  }

  @media (min-width: 600px) {
    .sheet-backdrop {
      align-items: center;
      padding: var(--space-xl);
    }
  }

  .sheet-panel {
    background-color: var(--color-surface-1);
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-lg) var(--radius-lg) 0 0;
    width: 100%;
    max-height: 80vh;
    max-height: 80dvh;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    animation: sheetSlideUp 0.22s cubic-bezier(0.16, 1, 0.3, 1);
    box-shadow: var(--shadow-sheet);
    overscroll-behavior: contain;
    touch-action: auto;
    padding-bottom: env(safe-area-inset-bottom, 0px);
  }

  @media (min-width: 600px) {
    .sheet-panel {
      border-radius: var(--radius-lg);
      box-shadow: 0 16px 48px rgba(0, 0, 0, 0.85);
      padding-bottom: 0;
    }
  }

  @keyframes sheetSlideUp {
    from {
      transform: translateY(100%);
      opacity: 0.7;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }

  .sheet-header {
    position: relative;
    height: var(--header-height);
    padding: 0 var(--space-lg);
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-bottom: 1px solid var(--color-border-subtle);
    background-color: var(--color-surface-1);
    flex-shrink: 0;
    touch-action: none;
    cursor: grab;
    user-select: none;
    -webkit-user-select: none;
  }

  .sheet-header.is-dragging {
    cursor: grabbing;
  }

  .sheet-drag-handle {
    position: absolute;
    top: 5px;
    left: 50%;
    transform: translateX(-50%);
    width: 36px;
    height: 4px;
    border-radius: var(--radius-full);
    background-color: var(--color-border-medium);
    opacity: 0.6;
    pointer-events: none;
    transition: opacity 0.15s, background-color 0.15s;
  }

  .sheet-header:hover .sheet-drag-handle,
  .sheet-header.is-dragging .sheet-drag-handle {
    opacity: 1;
    background-color: var(--color-text-secondary);
  }

  .sheet-title-group {
    display: flex;
    align-items: center;
    gap: var(--space-sm);
    min-width: 0;
  }

  .sheet-title-icon {
    display: flex;
    align-items: center;
    color: var(--color-accent-primary);
    flex-shrink: 0;
  }

  .sheet-title {
    font-size: var(--text-base);
    font-weight: 700;
    color: var(--color-text-primary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .sheet-badge {
    font-size: var(--text-xs);
    font-weight: 600;
    color: var(--color-text-muted);
    background-color: var(--color-surface-2);
    padding: 2px 8px;
    border-radius: var(--radius-full);
    border: 1px solid var(--color-border-subtle);
    flex-shrink: 0;
  }

  .sheet-actions {
    display: flex;
    align-items: center;
    gap: var(--space-xs);
  }

  .sheet-close-btn {
    width: var(--tap-min-size);
    height: var(--tap-min-size);
    font-size: 18px;
    color: var(--color-text-secondary);
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: var(--radius-sm);
    transition: color 0.12s, background-color 0.12s;
  }

  .sheet-close-btn:active {
    color: #ffffff;
    background-color: var(--color-surface-active);
  }

  .sheet-body {
    display: flex;
    flex-direction: column;
    flex: 1;
    min-height: 0;
    overflow: hidden;
    user-select: text;
    -webkit-user-select: text;
    -webkit-touch-callout: default;
    touch-action: pan-y;
  }

  .sheet-body.is-scrollable {
    overflow-y: auto;
    overscroll-behavior: contain;
    -webkit-overflow-scrolling: touch;
    touch-action: pan-y;
    gap: var(--space-md);
  }

  .sheet-body.has-padding {
    padding: var(--space-lg);
  }
</style>
