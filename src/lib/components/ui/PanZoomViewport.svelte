<script lang="ts">
  import type { Snippet } from 'svelte';
  import { onMount } from 'svelte';
  import { settings } from '../../state/settings.svelte';

  interface Props {
    minScale?: number;
    maxScale?: number;
    initialScale?: number;
    currentScale?: number;
    autoFitOnMount?: boolean;
    children?: Snippet;
  }

  let {
    minScale = 0.1,
    maxScale = 5.0,
    initialScale = 1.0,
    currentScale = $bindable(1.0),
    autoFitOnMount = true,
    children
  }: Props = $props();

  let containerRef: HTMLDivElement | null = $state(null);
  let contentRef: HTMLDivElement | null = $state(null);

  // View transform is intentionally NOT reactive state.
  // Pointer/wheel events fire at 60–240 Hz; routing every event through Svelte reactivity
  // (and the bound `currentScale` into parents) caused a flush per event. Instead we keep the
  // transform in plain variables and write it to the DOM at most once per animation frame.
  // svelte-ignore state_referenced_locally
  let scale = initialScale;
  let panX = 0;
  let panY = 0;
  let rafId = 0;

  // Lower bound may be relaxed by resetView() when the content needs a smaller fit scale.
  // Kept local so we never write into a (non-bindable) prop.
  let fitMinScale = Infinity;
  const effectiveMinScale = () => Math.min(minScale, fitMinScale);
  const clampScale = (s: number) => Math.min(Math.max(s, effectiveMinScale()), maxScale);

  function renderTransform() {
    rafId = 0;
    if (!contentRef) return;
    contentRef.style.transform = `translate3d(${panX}px, ${panY}px, 0) scale(${scale})`;
    // Propagate scale to parent only once per frame (drives LOD in consumers)
    if (currentScale !== scale) currentScale = scale;
  }

  function scheduleRender() {
    if (rafId) return;
    rafId = requestAnimationFrame(renderTransform);
  }

  function setView(x: number, y: number, s: number) {
    panX = x;
    panY = y;
    scale = s;
    scheduleRender();
  }

  // Active pointers map
  const activePointers = new Map<number, { x: number; y: number }>();

  // Two-finger gesture tracking
  let initialDist = 0;
  let initialMidpoint = { x: 0, y: 0 };
  let initialPan = { x: 0, y: 0 };
  let initialGestureScale = 1.0;
  // Container rect cached for the duration of a gesture (avoids layout reads on every move)
  let gestureRect: DOMRect | null = null;

  // Desktop drag tracking
  let isMousePanning = false;
  let mouseStart = { x: 0, y: 0 };
  let mouseInitialPan = { x: 0, y: 0 };
  let isAutoPanning = $state(false);
  let autoPanTimer: ReturnType<typeof setTimeout> | null = null;

  function startAutoPan() {
    isAutoPanning = true;
    if (autoPanTimer) clearTimeout(autoPanTimer);
    autoPanTimer = setTimeout(() => {
      isAutoPanning = false;
      autoPanTimer = null;
    }, 220);
  }

  function stopAutoPan() {
    if (autoPanTimer) {
      clearTimeout(autoPanTimer);
      autoPanTimer = null;
    }
    if (isAutoPanning) isAutoPanning = false;
  }

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

  let cachedElW = 0;
  let cachedElH = 0;

  function updateContentDimensions() {
    if (!contentRef) return;
    const child = (contentRef.firstElementChild as HTMLElement) || contentRef;
    const w = child.offsetWidth || contentRef.offsetWidth || 0;
    const h = child.offsetHeight || contentRef.offsetHeight || 0;
    if (w > 0) cachedElW = w;
    if (h > 0) cachedElH = h;
  }

  let containerW = 0;
  let containerH = 0;

  function readContainerSize() {
    if (!containerRef) return;
    containerW = containerRef.clientWidth;
    containerH = containerRef.clientHeight;
  }

  function getPanBounds(currentScale: number) {
    if (!containerRef || !contentRef) {
      return { minX: -Infinity, maxX: Infinity, minY: -Infinity, maxY: Infinity };
    }
    if (containerW <= 0 || containerH <= 0) readContainerSize();
    const cW = containerW;
    const cH = containerH;
    if (cachedElW <= 0 || cachedElH <= 0) {
      updateContentDimensions();
    }
    const elW = cachedElW || 2750;
    const elH = cachedElH || 1600;

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

  export function getScale(): number {
    return scale;
  }

  export function resetView(vibrate = true) {
    if (vibrate) settings.vibrate(20);
    if (!containerRef || !contentRef) return;

    readContainerSize();
    const cW = containerW;
    const cH = containerH;
    if (cW <= 0 || cH <= 0) return;

    updateContentDimensions();
    const elW = cachedElW;
    const elH = cachedElH;

    if (elW <= 0 || elH <= 0) {
      setView(0, 0, 1.0);
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
      fitMinScale = Math.max(0.05, targetScale * 0.8);
    }

    startAutoPan();
    setView(
      Math.round((cW - elW * targetScale) / 2),
      Math.round((cH - elH * targetScale) / 2),
      targetScale
    );
  }

  let isInitialMountDone = false;
  let lastContainerW = 0;
  let lastContainerH = 0;

  onMount(() => {
    // Paint initial transform synchronously (no flash of untransformed content)
    renderTransform();

    // Initial fit on mount
    let timer: ReturnType<typeof setTimeout> | null = null;
    if (autoFitOnMount) {
      timer = setTimeout(() => {
        resetView(false);
        isInitialMountDone = true;
      }, 50);
    } else {
      isInitialMountDone = true;
    }

    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined' && containerRef) {
      ro = new ResizeObserver(() => {
        if (!containerRef) return;
        readContainerSize();
        const cW = containerW;
        const cH = containerH;
        if (cW <= 0 || cH <= 0) return;

        // Skip if viewport container dimensions haven't changed after initial mount
        if (isInitialMountDone && cW === lastContainerW && cH === lastContainerH) {
          return;
        }
        lastContainerW = cW;
        lastContainerH = cH;

        if (!isInitialMountDone) {
          if (autoFitOnMount) {
            resetView(false);
          }
          isInitialMountDone = true;
        } else {
          // Viewport resized (e.g. orientation change): re-clamp existing view without resetting scale!
          updateContentDimensions();
          const clamped = clampPan(panX, panY, scale);
          setView(clamped.x, clamped.y, scale);
        }
      });
      ro.observe(containerRef);
    }

    return () => {
      if (timer) clearTimeout(timer);
      if (autoPanTimer) clearTimeout(autoPanTimer);
      if (rafId) cancelAnimationFrame(rafId);
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

    readContainerSize();
    const cW = containerW;
    const cH = containerH;
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
      startAutoPan();
      setView(Math.round(newPanX), Math.round(newPanY), scale);
    }
  }

  export function focusElement(
    el: HTMLElement,
    targetScale?: number,
    vibrate = false
  ) {
    if (vibrate) settings.vibrate(20);
    if (!containerRef || !contentRef || !el) return;

    readContainerSize();
    const cW = containerW;
    const cH = containerH;
    if (cW <= 0 || cH <= 0) return;

    const nextScale = targetScale !== undefined ? clampScale(targetScale) : scale;

    const offset = getOffsetRelativeTo(el, contentRef);
    const elW = el.offsetWidth;
    const elH = el.offsetHeight;

    const newPanX = (cW - elW * nextScale) / 2 - offset.x * nextScale;
    const newPanY = (cH - elH * nextScale) / 2 - offset.y * nextScale;

    const clamped = clampPan(newPanX, newPanY, nextScale);
    startAutoPan();
    setView(Math.round(clamped.x), Math.round(clamped.y), nextScale);
  }

  function beginPinch() {
    if (!containerRef) return;
    const pts = Array.from(activePointers.values());
    const p1 = pts[0];
    const p2 = pts[1];
    gestureRect = containerRef.getBoundingClientRect();
    initialDist = Math.hypot(p2.x - p1.x, p2.y - p1.y);
    initialMidpoint = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };
    initialPan = { x: panX, y: panY };
    initialGestureScale = scale;
  }

  function handlePointerDown(e: PointerEvent) {
    stopAutoPan();

    // A primary touch pointer means no other touch is active. Any entries left in the map are
    // stale (their pointerup/cancel never reached us) and would turn the next single-finger
    // touch into a phantom pinch against a ghost point.
    if (e.isPrimary) activePointers.clear();
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
      beginPinch();
      try {
        containerRef?.setPointerCapture(e.pointerId);
      } catch {}
      e.preventDefault();
    }
  }

  function handlePointerMove(e: PointerEvent) {
    const prev = activePointers.get(e.pointerId);
    if (!prev) return;
    prev.x = e.clientX;
    prev.y = e.clientY;

    if (isMousePanning) {
      const dx = e.clientX - mouseStart.x;
      const dy = e.clientY - mouseStart.y;
      const clamped = clampPan(mouseInitialPan.x + dx, mouseInitialPan.y + dy, scale);
      setView(clamped.x, clamped.y, scale);
      e.preventDefault();
      return;
    }

    if (activePointers.size === 2 && gestureRect && initialDist > 0) {
      const it = activePointers.values();
      const p1 = it.next().value!;
      const p2 = it.next().value!;

      const currentDist = Math.hypot(p2.x - p1.x, p2.y - p1.y);
      const midX = (p1.x + p2.x) / 2;
      const midY = (p1.y + p2.y) / 2;

      const ratio = currentDist / initialDist;
      const newScale = clampScale(initialGestureScale * ratio);

      const rect = gestureRect;
      const contentX = (initialMidpoint.x - rect.left - initialPan.x) / initialGestureScale;
      const contentY = (initialMidpoint.y - rect.top - initialPan.y) / initialGestureScale;

      const rawPanX = midX - rect.left - contentX * newScale;
      const rawPanY = midY - rect.top - contentY * newScale;
      const clamped = clampPan(rawPanX, rawPanY, newScale);
      setView(clamped.x, clamped.y, newScale);
      e.preventDefault();
    }
  }

  function handlePointerUp(e: PointerEvent) {
    if (!activePointers.delete(e.pointerId)) return;

    if (isMousePanning) {
      isMousePanning = false;
      try {
        containerRef?.releasePointerCapture(e.pointerId);
      } catch {}
    }

    if (activePointers.size === 2) {
      // 3 -> 2 fingers: re-baseline so the remaining pair doesn't jump
      beginPinch();
    } else if (activePointers.size < 2) {
      initialDist = 0;
      gestureRect = null;
    }
  }

  function resetPointers() {
    activePointers.clear();
    isMousePanning = false;
    initialDist = 0;
    gestureRect = null;
  }

  function handleWheel(e: WheelEvent) {
    if (!containerRef) return;
    stopAutoPan();
    e.preventDefault();

    const rect = containerRef.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Normalize delta: mouse wheels send ~100px notches, trackpads send many tiny deltas
    // (and ctrlKey+wheel for pinch). A fixed per-event factor made trackpads zoom through the
    // whole range in a fraction of a second.
    let dy = e.deltaY;
    if (e.deltaMode === 1) dy *= 16;
    else if (e.deltaMode === 2) dy *= containerH || 800;
    dy = Math.max(-120, Math.min(120, dy));
    const sensitivity = e.ctrlKey ? 0.01 : 0.0015;
    const factor = Math.exp(-dy * sensitivity);

    const newScale = clampScale(scale * factor);
    if (newScale === scale) return;

    const contentX = (mouseX - panX) / scale;
    const contentY = (mouseY - panY) / scale;

    const rawPanX = mouseX - contentX * newScale;
    const rawPanY = mouseY - contentY * newScale;
    const clamped = clampPan(rawPanX, rawPanY, newScale);
    setView(clamped.x, clamped.y, newScale);
  }
</script>

<!--
  pointerup/cancel are listened on window: if a release happens outside the container (or its
  implicit-capture target was removed from the DOM), the pointer would otherwise stay in the
  map forever and break gesture detection.
-->
<svelte:window
  onpointerup={handlePointerUp}
  onpointercancel={handlePointerUp}
  onblur={resetPointers}
/>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
  bind:this={containerRef}
  class="panzoom-container"
  onpointerdown={handlePointerDown}
  onpointermove={handlePointerMove}
  onwheel={handleWheel}
>
  <div
    bind:this={contentRef}
    class="panzoom-content"
    class:is-animating={isAutoPanning}
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
