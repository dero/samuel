<script lang="ts">
  import type { TurtleState } from './turtleTypes';
  import EmptyHint from '../../components/ui/EmptyHint.svelte';
  import { PencilSimple } from 'phosphor-svelte';

  interface Props {
    state: TurtleState;
    showDashes?: boolean;
    showGrid?: boolean;
  }

  let { state: turtleState, showDashes = true, showGrid = true }: Props = $props();

  let containerWidth = $state(0);
  let containerHeight = $state(0);

  const bounds = $derived.by(() => {
    let minX = Math.min(0, turtleState.position.x);
    let maxX = Math.max(0, turtleState.position.x);
    let minY = Math.min(0, turtleState.position.y);
    let maxY = Math.max(0, turtleState.position.y);

    for (const seg of turtleState.segments) {
      minX = Math.min(minX, seg.from.x, seg.to.x);
      maxX = Math.max(maxX, seg.from.x, seg.to.x);
      minY = Math.min(minY, seg.from.y, seg.to.y);
      maxY = Math.max(maxY, seg.from.y, seg.to.y);
    }

    for (const m of turtleState.markers) {
      minX = Math.min(minX, m.position.x);
      maxX = Math.max(maxX, m.position.x);
      minY = Math.min(minY, m.position.y);
      maxY = Math.max(maxY, m.position.y);
    }

    const spanX = maxX - minX;
    const spanY = maxY - minY;
    const effectiveSpan = Math.max(spanX, spanY, 3.5);
    const sidePadding = Math.max(1.0, effectiveSpan * 0.16);
    // Dedicated top padding so the highest element or turtle heading never intersects the HUD pill
    const topClearance = Math.max(1.6, effectiveSpan * 0.30);

    const cx = (minX + maxX) / 2;

    const cartMinY = minY - sidePadding;
    const cartMaxY = maxY + sidePadding + topClearance;
    const contentHeight = Math.max(cartMaxY - cartMinY, 4);
    const contentWidth = Math.max(spanX + sidePadding * 2, 4);

    const aspect =
      containerWidth > 0 && containerHeight > 0
        ? containerWidth / containerHeight
        : 1.5;

    let viewBoxWidth = contentWidth;
    let viewBoxHeight = contentHeight;

    if (viewBoxWidth / viewBoxHeight < aspect) {
      // Container is wider than content: expand width so canvas fills full width without pillarboxing
      viewBoxWidth = viewBoxHeight * aspect;
    } else {
      // Container is taller than content: expand height
      viewBoxHeight = viewBoxWidth / aspect;
    }

    const viewBoxX = cx - viewBoxWidth / 2;
    const extraHeight = viewBoxHeight - contentHeight;
    const viewBoxY = -(cartMaxY + extraHeight * 0.3);

    const markerRadius = Math.max(0.38, effectiveSpan * 0.04);

    // Visible integer grid bounds covering the full viewport
    const gMinX = Math.floor(viewBoxX);
    const gMaxX = Math.ceil(viewBoxX + viewBoxWidth);
    const gMinY = Math.floor(-(viewBoxY + viewBoxHeight));
    const gMaxY = Math.ceil(-viewBoxY);

    const rawCols = gMaxX - gMinX + 1;
    const rawRows = gMaxY - gMinY + 1;
    const rawCount = rawCols * rawRows;

    let gridStep = 1;
    if (rawCount > 900) {
      gridStep = 2;
    }
    if (rawCount > 3600) {
      gridStep = 5;
    }
    if (rawCount > 15000) {
      gridStep = 10;
    }

    const dotRadius =
      Math.max(0.048, Math.min(0.065, markerRadius * 0.15)) * Math.sqrt(gridStep);

    return {
      viewBox: `${viewBoxX} ${viewBoxY} ${viewBoxWidth} ${viewBoxHeight}`,
      markerRadius,
      dotRadius,
      gridStep,
      gMinX,
      gMaxX,
      gMinY,
      gMaxY
    };
  });

  const gridDots = $derived.by(() => {
    if (!showGrid) return [];
    const step = bounds.gridStep;
    const dots: { x: number; y: number }[] = [];
    const startX = Math.ceil(bounds.gMinX / step) * step;
    const startY = Math.ceil(bounds.gMinY / step) * step;
    for (let x = startX; x <= bounds.gMaxX; x += step) {
      for (let y = startY; y <= bounds.gMaxY; y += step) {
        dots.push({ x, y: -y });
      }
    }
    return dots;
  });

  const hasContent = $derived(
    turtleState.segments.length > 0 || turtleState.markers.length > 0
  );
</script>

<div
  class="turtle-canvas-wrapper"
  bind:clientWidth={containerWidth}
  bind:clientHeight={containerHeight}
>
  <!-- HUD Badge -->
  <div class="canvas-hud">
    <div class="hud-pill">
      <span class="hud-item heading-indicator">
        <span class="heading-deg">{turtleState.heading}°</span>
      </span>
      <span class="hud-sep">•</span>
      <span class="hud-item steps-indicator">
        {turtleState.segments.length} {turtleState.segments.length === 1 ? 'krok' : turtleState.segments.length >= 2 && turtleState.segments.length <= 4 ? 'kroky' : 'kroků'}
      </span>
      {#if turtleState.markers.length > 0}
        <span class="hud-sep">•</span>
        <span class="hud-item marker-indicator">
          📍 {turtleState.markers.length}
        </span>
      {/if}
      <span class="hud-sep">•</span>
      <span class="hud-item pen-indicator" class:is-pen-up={!turtleState.penDown}>
        <span class="hud-pen-icon">
          <PencilSimple size={12} weight="bold" />
        </span>
        {turtleState.penDown ? 'Kreslí' : 'Zvednuto'}
      </span>
    </div>
  </div>

  <EmptyHint
    text="Kreslete tlačítky níže."
    hidden={hasContent}
  />

  <svg
    class="turtle-svg"
    viewBox={bounds.viewBox}
    preserveAspectRatio="xMidYMid meet"
    aria-label="Plátno želví grafiky"
  >
    <!-- Background Grid Dots -->
    {#if showGrid}
      <g class="grid-layer">
        {#each gridDots as dot}
          <circle
            cx={dot.x}
            cy={dot.y}
            r={bounds.dotRadius}
            fill="rgba(255, 255, 255, 0.28)"
          />
        {/each}
      </g>
    {/if}

    <!-- Segments Layer -->
    <g class="segments-layer">
      {#each turtleState.segments as seg (seg.id)}
        {#if seg.penDown}
          <line
            x1={seg.from.x}
            y1={-seg.from.y}
            x2={seg.to.x}
            y2={-seg.to.y}
            class="pen-down-line"
            stroke="var(--color-accent-primary)"
            stroke-width="2.75"
            stroke-linecap="round"
            stroke-linejoin="round"
            vector-effect="non-scaling-stroke"
          />
        {:else if showDashes}
          <line
            x1={seg.from.x}
            y1={-seg.from.y}
            x2={seg.to.x}
            y2={-seg.to.y}
            class="pen-up-line"
            stroke="rgba(255, 255, 255, 0.22)"
            stroke-width="1.5"
            stroke-dasharray="3 3"
            stroke-linecap="round"
            vector-effect="non-scaling-stroke"
          />
        {/if}
      {/each}
    </g>

    <!-- Start Indicator (Green Dot) -->
    <g class="start-layer">
      <circle
        cx="0"
        cy="0"
        r={bounds.markerRadius * 0.45}
        fill="var(--color-accent-success)"
        stroke="#000000"
        stroke-width="0.05"
      />
    </g>

    <!-- Numbered Markers Layer -->
    <g class="markers-layer">
      {#each turtleState.markers as m (m.id)}
        <g class="marker-node" transform="translate({m.position.x}, {-m.position.y})">
          <circle
            cx="0"
            cy="0"
            r={bounds.markerRadius}
            fill="var(--color-accent-warning)"
            stroke="#000000"
            stroke-width={bounds.markerRadius * 0.12}
          />
          <text
            x="0"
            y="0"
            fill="#000000"
            font-size={bounds.markerRadius * 1.25}
            font-weight="900"
            font-family="var(--font-sans)"
            text-anchor="middle"
            dominant-baseline="central"
          >
            {m.id}
          </text>
        </g>
      {/each}
    </g>

    <!-- Turtle / Heading Arrow -->
    <g
      class="turtle-cursor"
      transform="translate({turtleState.position.x}, {-turtleState.position.y}) rotate({turtleState.heading})"
    >
      <!-- Halo glow circle -->
      <circle
        cx="0"
        cy="0"
        r={bounds.markerRadius * 1.2}
        fill="var(--color-accent-primary-subtle)"
        stroke="var(--color-accent-primary)"
        stroke-width="0.05"
        opacity="0.45"
      />
      <!-- Sharp directional arrow pointing North -->
      <polygon
        points={`0,${-bounds.markerRadius * 1.3} ${bounds.markerRadius * 0.8},${bounds.markerRadius * 0.8} 0,${bounds.markerRadius * 0.35} ${-bounds.markerRadius * 0.8},${bounds.markerRadius * 0.8}`}
        fill="var(--color-accent-primary)"
        stroke="#000000"
        stroke-width="0.06"
        stroke-linejoin="round"
      />
    </g>
  </svg>
</div>

<style>
  .turtle-canvas-wrapper {
    position: relative;
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: var(--color-bg-canvas);
    border-radius: var(--radius-sm);
    border: 1px solid var(--color-border-subtle);
    overflow: hidden;
    box-sizing: border-box;
  }

  .turtle-svg {
    width: 100%;
    height: 100%;
    display: block;
    user-select: none;
    touch-action: none;
  }

  .canvas-hud {
    position: absolute;
    top: var(--space-xs);
    left: 50%;
    transform: translateX(-50%);
    z-index: 10;
    pointer-events: none;
    max-width: calc(100% - 16px);
  }

  .hud-pill {
    display: flex;
    align-items: center;
    gap: var(--space-xs);
    background-color: rgba(18, 18, 18, 0.85);
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-full);
    padding: 3px 10px;
    font-size: var(--text-xs);
    color: var(--color-text-secondary);
    backdrop-filter: blur(8px);
    box-shadow: var(--shadow-sm);
  }

  .hud-item {
    display: inline-flex;
    align-items: center;
    white-space: nowrap;
  }

  .heading-deg {
    font-family: var(--font-mono);
    color: var(--color-accent-primary);
    font-weight: 700;
  }

  .marker-indicator {
    color: var(--color-accent-warning);
    font-weight: 600;
  }

  .pen-indicator {
    color: var(--color-accent-success);
    font-weight: 600;
  }

  .pen-indicator.is-pen-up {
    color: var(--color-text-muted);
  }

  .hud-pen-icon {
    display: inline-flex;
    align-items: center;
    margin-right: 3px;
    transform: translateY(0.5px);
  }

  .hud-sep {
    color: var(--color-border-medium);
    opacity: 0.6;
    font-size: calc(8px * var(--font-scale));
  }

  .pen-down-line {
    filter: drop-shadow(0 0 2px var(--color-accent-primary-glow));
  }
</style>
