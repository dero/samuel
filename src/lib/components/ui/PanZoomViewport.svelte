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
    contentWidth?: number;
    contentHeight?: number;
    allowSinglePointerPan?: boolean | 'when-zoomed';
    doubleTapToZoom?: boolean;
    class?: string;
    children?: Snippet;
  }

  let {
    minScale = 0.1,
    maxScale = 5.0,
    initialScale = 1.0,
    currentScale = $bindable(1.0),
    autoFitOnMount = true,
    contentWidth,
    contentHeight,
    allowSinglePointerPan = false,
    doubleTapToZoom = true,
    class: className = '',
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
  let fitScale = 1.0;
  let isCurrentlyZoomed = $state(false);

  const effectiveMinScale = () => Math.min(minScale, fitMinScale);
  const clampScale = (s: number) => Math.min(Math.max(s, effectiveMinScale()), maxScale);

  function renderTransform() {
    rafId = 0;
    if (!contentRef) return;
    contentRef.style.transform = `translate3d(${panX}px, ${panY}px, 0) scale(${scale})`;
    // Propagate scale to parent only once per frame (drives LOD in consumers)
    if (currentScale !== scale) currentScale = scale;
    const baseFit = fitScale || (fitMinScale < Infinity ? fitMinScale / 0.8 : initialScale);
    const nextZoomed = scale > baseFit * 1.06;
    if (isCurrentlyZoomed !== nextZoomed) isCurrentlyZoomed = nextZoomed;
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
  let isMousePanning = $state(false);
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
    if (contentWidth && contentHeight) {
      cachedElW = contentWidth;
      cachedElH = contentHeight;
      return;
    }
    const child = (contentRef.firstElementChild as HTMLElement) || contentRef;
    let w = child.offsetWidth || 0;
    let h = child.offsetHeight || 0;
    if ((!w || !h) && child.getBoundingClientRect) {
      const rect = child.getBoundingClientRect();
      const s = scale || 1;
      w = w || Math.round(rect.width / s);
      h = h || Math.round(rect.height / s);
    }
    w = w || contentRef.offsetWidth || 0;
    h = h || contentRef.offsetHeight || 0;
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
    const elW = contentWidth || cachedElW || 2750;
    const elH = contentHeight || cachedElH || 1600;

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

  export function getFitScale(): number {
    return fitScale || (fitMinScale < Infinity ? fitMinScale / 0.8 : initialScale);
  }

  export function zoomTo(targetScale: number, centerX?: number, centerY?: number) {
    if (!containerRef) return;
    readContainerSize();
    const cW = containerW;
    const cH = containerH;
    if (cW <= 0 || cH <= 0) return;

    const nextScale = clampScale(targetScale);
    const focusX = centerX !== undefined ? centerX : cW / 2;
    const focusY = centerY !== undefined ? centerY : cH / 2;

    const currentS = scale || 1;
    const contentX = (focusX - panX) / currentS;
    const contentY = (focusY - panY) / currentS;

    const rawPanX = focusX - contentX * nextScale;
    const rawPanY = focusY - contentY * nextScale;
    const clamped = clampPan(rawPanX, rawPanY, nextScale);

    startAutoPan();
    setView(Math.round(clamped.x), Math.round(clamped.y), nextScale);
  }

  export function zoomIn(factor = 1.35) {
    settings.vibrate(15);
    zoomTo(scale * factor);
  }

  export function zoomOut(factor = 1.35) {
    settings.vibrate(15);
    zoomTo(scale / factor);
  }

  export function resetView(vibrate = true) {
    if (vibrate) settings.vibrate(20);
    if (!containerRef || !contentRef) return;

    readContainerSize();
    const cW = containerW;
    const cH = containerH;
    if (cW <= 0 || cH <= 0) return;

    updateContentDimensions();
    const elW = contentWidth || cachedElW;
    const elH = contentHeight || cachedElH;

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

    fitScale = targetScale;
    fitMinScale = Math.max(0.05, targetScale * 0.8);
    isCurrentlyZoomed = false;

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

  let isTouchPanning = $state(false);
  let touchStart = { x: 0, y: 0 };
  let touchInitialPan = { x: 0, y: 0 };
  let lastTapTime = 0;
  let lastTapPos = { x: 0, y: 0 };

  function handleDoubleTap(e: PointerEvent) {
    if (!containerRef) return;
    readContainerSize();
    const cW = containerW;
    const cH = containerH;
    if (cW <= 0 || cH <= 0) return;

    const baseFit = fitScale || (fitMinScale < Infinity ? fitMinScale / 0.8 : initialScale);
    const isAlreadyZoomed = scale > baseFit * 1.25;

    if (isAlreadyZoomed) {
      resetView(true);
    } else {
      settings.vibrate(20);
      const rect = containerRef.getBoundingClientRect();
      const tapX = e.clientX - rect.left;
      const tapY = e.clientY - rect.top;
      const targetScale = clampScale(baseFit * 2.5);
      zoomTo(targetScale, tapX, tapY);
    }
  }

  function handlePointerDown(e: PointerEvent) {
    stopAutoPan();

    // A primary touch pointer means no other touch is active. Any entries left in the map are
    // stale (their pointerup/cancel never reached us) and would turn the next single-finger
    // touch into a phantom pinch against a ghost point.
    if (e.isPrimary) activePointers.clear();
    activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

    // Double-tap detection
    const now = Date.now();
    const dt = now - lastTapTime;
    const dist = Math.hypot(e.clientX - lastTapPos.x, e.clientY - lastTapPos.y);

    if (doubleTapToZoom && dt > 40 && dt < 320 && dist < 24) {
      lastTapTime = 0;
      handleDoubleTap(e);
      e.preventDefault();
      return;
    }
    lastTapTime = now;
    lastTapPos = { x: e.clientX, y: e.clientY };

    const canSinglePan =
      allowSinglePointerPan === true ||
      (allowSinglePointerPan === 'when-zoomed' && isCurrentlyZoomed);

    // Desktop mouse pan: middle-click, Shift+Left-click, or left-click directly on background canvas or content when single pan allowed
    if (e.pointerType === 'mouse') {
      const isPanButton =
        e.button === 1 ||
        (e.button === 0 && (canSinglePan || e.shiftKey || e.target === containerRef || e.target === contentRef));

      if (isPanButton) {
        isMousePanning = true;
        mouseStart = { x: e.clientX, y: e.clientY };
        mouseInitialPan = { x: panX, y: panY };
        containerRef?.setPointerCapture(e.pointerId);
        e.preventDefault();
        return;
      }
    }

    // Touch single-finger pan
    if (e.pointerType === 'touch' && activePointers.size === 1 && canSinglePan) {
      isTouchPanning = true;
      touchStart = { x: e.clientX, y: e.clientY };
      touchInitialPan = { x: panX, y: panY };
      try {
        containerRef?.setPointerCapture(e.pointerId);
      } catch {}
      e.preventDefault();
      return;
    }

    if (activePointers.size === 2) {
      // Begin 2-finger pan & pinch zoom
      isTouchPanning = false;
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

    if (isTouchPanning && activePointers.size === 1) {
      const dx = e.clientX - touchStart.x;
      const dy = e.clientY - touchStart.y;
      const clamped = clampPan(touchInitialPan.x + dx, touchInitialPan.y + dy, scale);
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

    if (isTouchPanning) {
      isTouchPanning = false;
      try {
        containerRef?.releasePointerCapture(e.pointerId);
      } catch {}
    }

    const canSinglePan =
      allowSinglePointerPan === true ||
      (allowSinglePointerPan === 'when-zoomed' && isCurrentlyZoomed);

    if (activePointers.size === 2) {
      // 3 -> 2 fingers: re-baseline so the remaining pair doesn't jump
      beginPinch();
    } else if (activePointers.size === 1 && canSinglePan) {
      // 2 -> 1 finger: transition smoothly to single-finger pan
      const remaining = activePointers.values().next().value;
      if (remaining) {
        touchStart = { x: remaining.x, y: remaining.y };
        touchInitialPan = { x: panX, y: panY };
        isTouchPanning = true;
      }
      initialDist = 0;
      gestureRect = null;
    } else if (activePointers.size < 2) {
      initialDist = 0;
      gestureRect = null;
    }
  }

  function resetPointers() {
    activePointers.clear();
    isMousePanning = false;
    isTouchPanning = false;
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
  class="panzoom-container {className}"
  class:cursor-grab={(allowSinglePointerPan === true || (allowSinglePointerPan === 'when-zoomed' && isCurrentlyZoomed)) && !isMousePanning && !isTouchPanning}
  class:cursor-grabbing={isMousePanning || isTouchPanning}
  style:touch-action={allowSinglePointerPan === 'when-zoomed' ? (isCurrentlyZoomed ? 'none' : 'pan-y') : 'none'}
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
    user-select: none;
    background-color: var(--color-bg-canvas);
  }

  .panzoom-container.cursor-grab {
    cursor: grab;
  }

  .panzoom-container.cursor-grabbing {
    cursor: grabbing;
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
