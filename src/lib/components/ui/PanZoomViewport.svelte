<script lang="ts">
  import type { Snippet } from 'svelte';
  import { onMount } from 'svelte';
  import { settings } from '../../state/settings.svelte';

  interface Props {
    minScale?: number;
    maxScale?: number;
    initialScale?: number;
    children?: Snippet;
  }

  let {
    minScale = 0.1,
    maxScale = 5.0,
    initialScale = 1.0,
    children
  }: Props = $props();

  let containerRef: HTMLDivElement | null = $state(null);
  let contentRef: HTMLDivElement | null = $state(null);
  let scale = $state(1.0);
  let panX = $state(0);
  let panY = $state(0);

  // Active pointers map
  const activePointers = new Map<number, { x: number; y: number }>();

  // Two-finger gesture tracking
  let initialDist = 0;
  let initialMidpoint = { x: 0, y: 0 };
  let initialPan = { x: 0, y: 0 };
  let initialGestureScale = 1.0;

  // Desktop drag tracking
  let isMousePanning = false;
  let mouseStart = { x: 0, y: 0 };
  let mouseInitialPan = { x: 0, y: 0 };
  let isAutoPanning = $state(false);

  function getOffsetRelativeTo(element: HTMLElement, ancestor: HTMLElement): { x: number; y: number } {
    let x = 0;
    let y = 0;
    let curr: HTMLElement | null = element;
    while (curr && curr !== ancestor) {
      x += curr.offsetLeft;
      y += curr.offsetTop;
      curr = curr.offsetParent as HTMLElement | null;
    }
    return { x, y };
  }

  function getPanBounds(currentScale: number) {
    if (!containerRef || !contentRef) {
      return { minX: -Infinity, maxX: Infinity, minY: -Infinity, maxY: Infinity };
    }
    const cW = containerRef.clientWidth;
    const cH = containerRef.clientHeight;
    const child = (contentRef.firstElementChild as HTMLElement) || contentRef;
    const elW = child.offsetWidth || contentRef.offsetWidth;
    const elH = child.offsetHeight || contentRef.offsetHeight;

    const scaledW = elW * currentScale;
    const scaledH = elH * currentScale;

    // Content edges are constrained so they cannot pass the halfway mark of the viewport:
    // Left edge (panX) cannot be further right than cW / 2
    // Right edge (panX + scaledW) cannot be further left than cW / 2 -> panX >= cW / 2 - scaledW
    // Top edge (panY) cannot be further down than cH / 2
    // Bottom edge (panY + scaledH) cannot be further up than cH / 2 -> panY >= cH / 2 - scaledH
    const minX = cW / 2 - scaledW;
    const maxX = cW / 2;
    const minY = cH / 2 - scaledH;
    const maxY = cH / 2;

    return { minX, maxX, minY, maxY };
  }

  function clampPan(x: number, y: number, currentScale: number): { x: number; y: number } {
    const { minX, maxX, minY, maxY } = getPanBounds(currentScale);
    return {
      x: Math.min(maxX, Math.max(minX, x)),
      y: Math.min(maxY, Math.max(minY, y))
    };
  }

  export function resetView(vibrate = true) {
    if (vibrate) settings.vibrate(20);
    if (!containerRef || !contentRef) return;

    const cW = containerRef.clientWidth;
    const cH = containerRef.clientHeight;
    if (cW <= 0 || cH <= 0) return;

    const child = (contentRef.firstElementChild as HTMLElement) || contentRef;
    const elW = child.offsetWidth || contentRef.offsetWidth;
    const elH = child.offsetHeight || contentRef.offsetHeight;

    if (elW <= 0 || elH <= 0) {
      scale = 1.0;
      panX = 0;
      panY = 0;
      return;
    }

    // Safety padding around the fitted content (16px on each side)
    const padding = 16;
    const availableW = Math.max(20, cW - padding * 2);
    const availableH = Math.max(20, cH - padding * 2);

    // Compute fit scale: fit entire content comfortably in available viewport without any artificial minimum
    const rawFitScale = Math.min(availableW / elW, availableH / elH);
    const targetScale = Math.min(initialScale, rawFitScale);

    if (targetScale < minScale) {
      minScale = Math.max(0.05, targetScale * 0.8);
    }

    isAutoPanning = true;
    scale = targetScale;
    panX = Math.round((cW - elW * targetScale) / 2);
    panY = Math.round((cH - elH * targetScale) / 2);

    setTimeout(() => {
      isAutoPanning = false;
    }, 220);
  }

  onMount(() => {
    // Initial fit on mount
    const timer = setTimeout(() => {
      resetView(false);
    }, 50);

    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined' && containerRef) {
      ro = new ResizeObserver(() => {
        resetView(false);
      });
      ro.observe(containerRef);
    }

    return () => {
      clearTimeout(timer);
      ro?.disconnect();
    };
  });

  export function ensureVisible(
    el: HTMLElement,
    padding?: number | { padX?: number; padY?: number; padRight?: number; padBottom?: number; padLeft?: number; padTop?: number }
  ) {
    if (!containerRef || !contentRef || !el) return;
    const offset = getOffsetRelativeTo(el, contentRef);
    const elX = offset.x;
    const elY = offset.y;
    const elW = el.offsetWidth;
    const elH = el.offsetHeight;

    const cW = containerRef.clientWidth;
    const cH = containerRef.clientHeight;
    if (cW <= 0 || cH <= 0) return;

    // Default safe zones: ~80px in forward direction of scrolling (bottom & right)
    // with comfortable padding on top & left
    let padBottom = 80;
    let padRight = 80;
    let padTop = 36;
    let padLeft = 36;

    if (typeof padding === 'number') {
      padBottom = padding;
      padRight = padding;
      padTop = padding;
      padLeft = padding;
    } else if (padding) {
      if (padding.padBottom !== undefined) padBottom = padding.padBottom;
      else if (padding.padY !== undefined) padBottom = padding.padY;
      if (padding.padRight !== undefined) padRight = padding.padRight;
      else if (padding.padX !== undefined) padRight = padding.padX;
      if (padding.padTop !== undefined) padTop = padding.padTop;
      if (padding.padLeft !== undefined) padLeft = padding.padLeft;
    }

    const scaledW = elW * scale;
    const scaledH = elH * scale;

    // Guard safe zones so they don't over-constrain on tight containers/high zoom
    const safePadBottom = Math.min(padBottom, Math.max(16, (cH - scaledH) / 2));
    const safePadRight = Math.min(padRight, Math.max(16, (cW - scaledW) / 2));
    const safePadTop = Math.min(padTop, Math.max(16, (cH - scaledH) / 2));
    const safePadLeft = Math.min(padLeft, Math.max(16, (cW - scaledW) / 2));

    // Current on-screen bounds of element
    const screenLeft = panX + elX * scale;
    const screenRight = screenLeft + scaledW;
    const screenTop = panY + elY * scale;
    const screenBottom = screenTop + scaledH;

    let newPanX = panX;
    let newPanY = panY;

    if (screenRight > cW - safePadRight) {
      newPanX = cW - safePadRight - (elX + elW) * scale;
    } else if (screenLeft < safePadLeft) {
      newPanX = safePadLeft - elX * scale;
    }

    if (screenBottom > cH - safePadBottom) {
      newPanY = cH - safePadBottom - (elY + elH) * scale;
    } else if (screenTop < safePadTop) {
      newPanY = safePadTop - elY * scale;
    }

    const clamped = clampPan(newPanX, newPanY, scale);
    newPanX = clamped.x;
    newPanY = clamped.y;

    if (Math.abs(newPanX - panX) > 1 || Math.abs(newPanY - panY) > 1) {
      isAutoPanning = true;
      panX = Math.round(newPanX);
      panY = Math.round(newPanY);
      setTimeout(() => {
        isAutoPanning = false;
      }, 220);
    }
  }

  function handlePointerDown(e: PointerEvent) {
    activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

    // Desktop mouse pan: middle-click, Shift+Left-click, or left-click directly on background canvas
    if (
      e.pointerType === 'mouse' &&
      (e.button === 1 || (e.button === 0 && (e.shiftKey || e.target === containerRef || e.target === contentRef)))
    ) {
      isMousePanning = true;
      mouseStart = { x: e.clientX, y: e.clientY };
      mouseInitialPan = { x: panX, y: panY };
      containerRef?.setPointerCapture(e.pointerId);
      e.preventDefault();
      return;
    }

    if (activePointers.size === 2) {
      // Begin 2-finger pan & pinch zoom
      const pts = Array.from(activePointers.values());
      const p1 = pts[0];
      const p2 = pts[1];

      initialDist = Math.hypot(p2.x - p1.x, p2.y - p1.y);
      initialMidpoint = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };
      initialPan = { x: panX, y: panY };
      initialGestureScale = scale;

      try {
        containerRef?.setPointerCapture(e.pointerId);
      } catch {}
      e.preventDefault();
    }
  }

  function handlePointerMove(e: PointerEvent) {
    if (!activePointers.has(e.pointerId)) return;
    activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (isMousePanning) {
      const dx = e.clientX - mouseStart.x;
      const dy = e.clientY - mouseStart.y;
      const clamped = clampPan(mouseInitialPan.x + dx, mouseInitialPan.y + dy, scale);
      panX = clamped.x;
      panY = clamped.y;
      e.preventDefault();
      return;
    }

    if (activePointers.size === 2 && containerRef) {
      const pts = Array.from(activePointers.values());
      const p1 = pts[0];
      const p2 = pts[1];

      const currentDist = Math.hypot(p2.x - p1.x, p2.y - p1.y);
      const currentMidpoint = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };

      if (initialDist > 0) {
        const ratio = currentDist / initialDist;
        const newScale = Math.min(Math.max(initialGestureScale * ratio, minScale), maxScale);

        const rect = containerRef.getBoundingClientRect();
        const contentX = (initialMidpoint.x - rect.left - initialPan.x) / initialGestureScale;
        const contentY = (initialMidpoint.y - rect.top - initialPan.y) / initialGestureScale;

        const rawPanX = currentMidpoint.x - rect.left - contentX * newScale;
        const rawPanY = currentMidpoint.y - rect.top - contentY * newScale;
        const clamped = clampPan(rawPanX, rawPanY, newScale);
        panX = clamped.x;
        panY = clamped.y;
        scale = newScale;
      }
      e.preventDefault();
    }
  }

  function handlePointerUp(e: PointerEvent) {
    activePointers.delete(e.pointerId);

    if (isMousePanning) {
      isMousePanning = false;
      try {
        containerRef?.releasePointerCapture(e.pointerId);
      } catch {}
    }

    if (activePointers.size < 2) {
      initialDist = 0;
    }
  }

  function handleWheel(e: WheelEvent) {
    if (!containerRef) return;
    e.preventDefault();

    const rect = containerRef.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const factor = e.deltaY < 0 ? 1.15 : 0.85;
    const newScale = Math.min(Math.max(scale * factor, minScale), maxScale);

    const contentX = (mouseX - panX) / scale;
    const contentY = (mouseY - panY) / scale;

    const rawPanX = mouseX - contentX * newScale;
    const rawPanY = mouseY - contentY * newScale;
    const clamped = clampPan(rawPanX, rawPanY, newScale);
    panX = clamped.x;
    panY = clamped.y;
    scale = newScale;
  }
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
  bind:this={containerRef}
  class="panzoom-container"
  onpointerdown={handlePointerDown}
  onpointermove={handlePointerMove}
  onpointerup={handlePointerUp}
  onpointercancel={handlePointerUp}
  onwheel={handleWheel}
>
  <div
    bind:this={contentRef}
    class="panzoom-content"
    class:is-animating={isAutoPanning}
    style="transform: translate3d({panX}px, {panY}px, 0) scale({scale});"
  >
    {#if children}
      {@render children()}
    {/if}
  </div>
</div>

<style>
  .panzoom-container {
    position: relative;
    width: 100%;
    height: 100%;
    overflow: hidden;
    touch-action: none;
    user-select: none;
    background-color: var(--color-bg-canvas);
  }

  .panzoom-content {
    position: absolute;
    top: 0;
    left: 0;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    transform-origin: 0 0;
    will-change: transform;
    pointer-events: auto;
  }

  .panzoom-content.is-animating {
    transition: transform 0.22s cubic-bezier(0.16, 1, 0.3, 1);
  }
</style>
