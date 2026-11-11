<script lang="ts">
  import type { TurtleState } from './turtleTypes';

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

    const cx = (minX + maxX) / 2;
    const cy = (minY + maxY) / 2;

    const contentHeight = Math.max(spanY + sidePadding * 2, 4);
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
    // SVG y grows downwards, the drawing's y upwards
    const viewBoxY = -(cy + viewBoxHeight / 2);

    const markerRadius = Math.max(0.38, effectiveSpan * 0.04);

    // Visible integer grid bounds covering the full viewport
    const gMinX = Math.floor(viewBoxX);
    const gMaxX = Math.ceil(viewBoxX + viewBoxWidth);
    const gMinY = Math.floor(-(viewBoxY + viewBoxHeight));
    const gMaxY = Math.ceil(-viewBoxY);

    const rawCols = gMaxX - gMinX + 1;
    const rawRows = gMaxY - gMinY + 1;
    const rawCount = rawCols * rawRows;

    // Coarser grid for bigger drawings: at most about 2 500 dots, steps 1, 2, 5, 10, 20, 50…
    const MAX_DOTS = 2500;
    let gridStep = 1;
    for (let k = 0; rawCount / (gridStep * gridStep) > MAX_DOTS; k++) {
      gridStep = [1, 2, 5][k % 3] * 10 ** Math.floor(k / 3);
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
</script>

<div
  class="turtle-canvas-wrapper"
  bind:clientWidth={containerWidth}
  bind:clientHeight={containerHeight}
>
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
            fill="var(--color-border-medium)"
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
            stroke="var(--color-text-primary)"
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
            stroke="var(--color-border-medium)"
            stroke-width="1.5"
            stroke-dasharray="3 3"
            stroke-linecap="round"
            vector-effect="non-scaling-stroke"
          />
        {/if}
      {/each}
    </g>

    <!-- Start: a hollow ring, told apart from the markers by shape -->
    <circle
      cx="0"
      cy="0"
      r={bounds.markerRadius * 0.45}
      fill="var(--color-bg-canvas)"
      stroke="var(--color-text-secondary)"
      stroke-width="2"
      vector-effect="non-scaling-stroke"
    />

    <!-- Numbered Markers Layer -->
    <g class="markers-layer">
      {#each turtleState.markers as m (m.id)}
        <g class="marker-node" transform="translate({m.position.x}, {-m.position.y})">
          <circle
            cx="0"
            cy="0"
            r={bounds.markerRadius}
            fill="var(--drawing-marker)"
            stroke="var(--color-bg-canvas)"
            stroke-width={bounds.markerRadius * 0.12}
          />
          <text
            x="0"
            y="0"
            fill="var(--color-text-inverse)"
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
      <!-- Halo -->
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
        stroke="var(--color-bg-canvas)"
        stroke-width="0.06"
        stroke-linejoin="round"
      />
    </g>
  </svg>
</div>

<style>
  .turtle-canvas-wrapper {
    /* Content colour: a marker is a found point of the drawing, not a status */
    --drawing-marker: #ffd23f;
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
</style>
