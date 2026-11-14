<script lang="ts">
  import {
    DISPLAY_CONFIGS,
    DISPLAY_VIEWBOX,
    SEVEN_SEG_DIGIT_TO_LETTER,
    type DisplayType
  } from './displaysData';
  import { settings } from '../../state/settings.svelte';

  interface Props {
    type: DisplayType;
    activeSegments: string[];
    committedFade?: boolean;
    letterIndexing?: boolean;
    autoInsert?: boolean;
    onSegmentsChange: (segments: string[]) => void;
    onStrokeCommit?: () => void;
    onStartInteraction?: () => void;
  }

  let {
    type,
    activeSegments,
    committedFade = false,
    letterIndexing = false,
    autoInsert = false,
    onSegmentsChange,
    onStrokeCommit,
    onStartInteraction
  }: Props = $props();

  const config = $derived(DISPLAY_CONFIGS[type]);
  const activeSet = $derived(new Set(activeSegments));
  const labelFontSize = $derived(type === '7seg' ? 14 : 11);

  function segLabel(id: string): string {
    return type === '7seg' && letterIndexing ? (SEVEN_SEG_DIGIT_TO_LETTER[id] ?? id) : id;
  }

  let svgEl = $state<SVGSVGElement | null>(null);
  let isPointerDown = false;
  let strokeTouched = new Set<string>();
  let initialWasActive = false;
  let lastPoint: { x: number; y: number } | null = null;

  function distToAxis(
    px: number,
    py: number,
    [x1, y1, x2, y2]: readonly [number, number, number, number]
  ): number {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const lenSq = dx * dx + dy * dy;
    if (lenSq === 0) return Math.hypot(px - x1, py - y1);
    const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / lenSq));
    return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy));
  }

  function getSegmentAtClientPoint(clientX: number, clientY: number): string | null {
    if (!svgEl) return null;
    const rect = svgEl.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return null;

    const svgX = ((clientX - rect.left) / rect.width) * 180;
    const svgY = ((clientY - rect.top) / rect.height) * 260;

    let bestId: string | null = null;
    let bestDist = config.hitRadius;

    for (const seg of config.segments) {
      const d = distToAxis(svgX, svgY, seg.axis);
      if (d < bestDist) {
        bestDist = d;
        bestId = seg.id;
      }
    }
    return bestId;
  }

  function activateSegment(id: string, vibrateMs: number) {
    if (activeSet.has(id)) return;
    settings.vibrate(vibrateMs);
    const next = [...activeSegments, id].sort();
    onSegmentsChange(next);
  }

  function handlePointerDown(e: PointerEvent) {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    e.preventDefault();

    onStartInteraction?.();

    isPointerDown = true;
    strokeTouched = new Set();
    initialWasActive = false;
    lastPoint = { x: e.clientX, y: e.clientY };

    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch {
      // ignore
    }

    const segId = getSegmentAtClientPoint(e.clientX, e.clientY);
    if (segId) {
      strokeTouched.add(segId);
      initialWasActive = activeSet.has(segId);
      if (!initialWasActive) {
        activateSegment(segId, 20);
      }
    }
  }

  function handlePointerMove(e: PointerEvent) {
    if (!isPointerDown) return;

    const prev = lastPoint ?? { x: e.clientX, y: e.clientY };
    const dist = Math.hypot(e.clientX - prev.x, e.clientY - prev.y);
    const steps = Math.max(1, Math.ceil(dist / 10));

    for (let i = 1; i <= steps; i++) {
      const t = i / steps;
      const sx = prev.x + (e.clientX - prev.x) * t;
      const sy = prev.y + (e.clientY - prev.y) * t;
      const segId = getSegmentAtClientPoint(sx, sy);
      if (segId && !strokeTouched.has(segId)) {
        strokeTouched.add(segId);
        activateSegment(segId, 16);
      }
    }

    lastPoint = { x: e.clientX, y: e.clientY };
  }

  function handlePointerUp(e: PointerEvent) {
    if (!isPointerDown) return;
    isPointerDown = false;
    lastPoint = null;

    if (!autoInsert && strokeTouched.size === 1 && initialWasActive) {
      const [segId] = strokeTouched;
      settings.vibrate(20);
      onSegmentsChange(activeSegments.filter((id) => id !== segId));
    }

    const hadInteraction = strokeTouched.size > 0;
    strokeTouched.clear();

    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }

    if (autoInsert && hadInteraction) {
      onStrokeCommit?.();
    }
  }

  function handlePointerCancel() {
    isPointerDown = false;
    lastPoint = null;
    strokeTouched.clear();
  }
</script>

<div class="display-pad-wrap">
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div
    class="display-bezel"
    role="group"
    aria-label="Segmentový displej ({config.label})"
    onpointerdown={handlePointerDown}
    onpointermove={handlePointerMove}
    onpointerup={handlePointerUp}
    onpointercancel={handlePointerCancel}
  >
    <svg bind:this={svgEl} viewBox={DISPLAY_VIEWBOX} class="display-svg" aria-hidden="true">
      {#each config.segments as seg (seg.id)}
        {@const isActive = activeSet.has(seg.id)}
        <g class="seg-group" class:is-active={isActive} class:is-fading={committedFade && isActive}>
          <polygon points={seg.points} class="seg-poly" />
          <text
            x={seg.labelPos[0]}
            y={seg.labelPos[1]}
            font-size={labelFontSize}
            class="seg-label"
            dominant-baseline="central"
            text-anchor="middle"
          >{segLabel(seg.id)}</text>
        </g>
      {/each}
    </svg>
  </div>
</div>

<style>
  .display-pad-wrap {
    width: 100%;
    container-type: inline-size;
    height: min(
      90cqw,
      calc(
        100dvh - var(--header-height) - 108px - var(--status-bar-height) - var(--zone-input-offset) -
          var(--subtoolbar-height) - (2 * var(--zone-input-gap)) - var(--utility-row-height) -
          var(--space-md) - env(safe-area-inset-top, 0px) - env(safe-area-inset-bottom, 0px)
      )
    );
    min-height: 140px;
    display: flex;
    align-items: center;
    justify-content: center;
    touch-action: none;
    user-select: none;
    -webkit-user-select: none;
  }

  .display-bezel {
    height: 100%;
    aspect-ratio: 180 / 260;
    max-width: 100%;
    padding: 8px 14px;
    background-color: var(--color-surface-sunken);
    border: 1.5px solid var(--color-border-subtle);
    border-radius: var(--radius-md);
    box-shadow:
      inset 0 4px 10px rgba(0, 0, 0, 0.95),
      inset 0 1.5px 3px rgba(0, 0, 0, 0.9),
      inset 0 -1px 0 rgba(255, 255, 255, 0.06);
    display: flex;
    align-items: center;
    justify-content: center;
    touch-action: none;
    cursor: pointer;
    box-sizing: border-box;
  }

  .display-svg {
    width: 100%;
    height: 100%;
    display: block;
    overflow: visible;
    pointer-events: none;
  }

  .seg-poly {
    fill: var(--color-surface-2);
    stroke: var(--color-border-subtle);
    stroke-width: 1.4;
    transition: fill 0.1s ease, stroke 0.1s ease, filter 0.1s ease;
  }

  .seg-group.is-active .seg-poly {
    fill: var(--color-accent-primary);
    stroke: var(--color-text-primary);
    stroke-width: 1.6;
    filter: drop-shadow(0 0 8px var(--color-accent-primary-glow));
  }

  .seg-group.is-active.is-fading .seg-poly {
    animation: segFadeOut 0.38s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
  }

  @keyframes segFadeOut {
    0%, 25% {
      fill: var(--color-accent-primary);
      stroke: var(--color-text-primary);
      filter: drop-shadow(0 0 10px var(--color-accent-primary));
    }
    100% {
      fill: var(--color-surface-2);
      stroke: var(--color-border-subtle);
      filter: none;
    }
  }

  .seg-label {
    font-family: var(--font-mono);
    font-weight: 800;
    fill: var(--color-text-secondary);
    pointer-events: none;
    user-select: none;
    -webkit-user-select: none;
  }

  .seg-group.is-active .seg-label {
    fill: var(--color-text-inverse);
  }

  .seg-group.is-active.is-fading .seg-label {
    animation: segLabelFadeOut 0.38s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
  }

  @keyframes segLabelFadeOut {
    0%, 25% { fill: var(--color-text-inverse); }
    100% { fill: var(--color-text-secondary); }
  }
</style>
