<script lang="ts">
  import { onDestroy, untrack } from 'svelte';
  import type {
    CubeNode,
    CubeVariant,
    CubeViewMode,
    ShellElementType
  } from './cubeData';
  import {
    applyFloatRotation,
    buildWireframeEdges,
    IDENTITY_ROTATION,
    matchesFilter,
    projectFloatCoord,
    projectViewCoord,
    type AxisFilter
  } from './cubeSolver';

  export interface SwapAnimationTrigger {
    aId: string;
    bId: string;
    seq: number;
  }

  export interface NodePulseTrigger {
    nodeId: string;
    seq: number;
  }

  interface Props {
    nodes: CubeNode[];
    variant: CubeVariant;
    viewMode: CubeViewMode;
    renderMatrix?: readonly number[];
    axisFilter: AxisFilter;
    shellTypeFilter: ShellElementType | null;
    hasFilter: boolean;
    editMode: boolean;
    inspectedNodeId: string | null;
    selectedNodeId?: string | null;
    swapAnim?: SwapAnimationTrigger | null;
    pulseAnim?: NodePulseTrigger | null;
    draggingNodeId: string | null;
    hoveredNodeId: string | null;
    onNodePointerDown: (e: PointerEvent, node: CubeNode) => void;
    onBackgroundPointerDown?: () => void;
  }

  let {
    nodes,
    variant,
    viewMode,
    renderMatrix = IDENTITY_ROTATION,
    axisFilter,
    shellTypeFilter,
    hasFilter,
    editMode,
    inspectedNodeId,
    selectedNodeId = null,
    swapAnim = null,
    pulseAnim = null,
    draggingNodeId,
    hoveredNodeId,
    onNodePointerDown,
    onBackgroundPointerDown
  }: Props = $props();

  let svgEl = $state<SVGSVGElement | null>(null);
  let canvasEl = $state<HTMLDivElement | null>(null);

  const viewBoxW = $derived(variant === 'shell26' ? 316 : 304);
  const viewBoxH = $derived(variant === 'shell26' ? 272 : 256);

  const projectedNodes = $derived.by(() => {
    const items = nodes.map((node) => {
      const fv = applyFloatRotation(renderMatrix, node.coord);
      const { px, py } = projectFloatCoord(fv, variant);
      return {
        node,
        fv,
        px,
        py,
        matched: !hasFilter || matchesFilter(node, variant, axisFilter, shellTypeFilter)
      };
    });
    return items.sort((a, b) => {
      if (Math.abs(b.fv.z - a.fv.z) > 1e-4) return b.fv.z - a.fv.z;
      if (Math.abs(a.fv.y - b.fv.y) > 1e-4) return a.fv.y - b.fv.y;
      return a.fv.x - b.fv.x;
    });
  });

  const projectedById = $derived.by(() => {
    const map = new Map<string, { px: number; py: number; vz: number; matched: boolean }>();
    for (const p of projectedNodes) {
      map.set(p.node.id, { px: p.px, py: p.py, vz: p.fv.z, matched: p.matched });
    }
    return map;
  });

  const wireframeEdges = $derived.by(() => {
    const edges = buildWireframeEdges(nodes, variant);
    return edges
      .map((edge) => {
        const a = projectedById.get(edge.from.id);
        const b = projectedById.get(edge.to.id);
        const active = (a?.matched ?? true) && (b?.matched ?? true);
        const avgZ = a && b ? (a.vz + b.vz) / 2 : edge.avgZ;
        return {
          ...edge,
          avgZ,
          x1: a?.px ?? 0,
          y1: a?.py ?? 0,
          x2: b?.px ?? 0,
          y2: b?.py ?? 0,
          active
        };
      })
      .sort((e1, e2) => e2.avgZ - e1.avgZ);
  });

  // Subtle translucent depth planes in wireframe mode for spatial readability
  const depthQuads = $derived.by(() => {
    const slices: (-1 | 0 | 1)[] = variant === 'grid27' ? [1, 0, -1] : [1, -1];
    return slices.map((z) => {
      const tl = projectViewCoord({ x: -1, y: -1, z }, variant);
      const tr = projectViewCoord({ x: 1, y: -1, z }, variant);
      const br = projectViewCoord({ x: 1, y: 1, z }, variant);
      const bl = projectViewCoord({ x: -1, y: 1, z }, variant);
      const planeFiltered =
        hasFilter &&
        ((axisFilter.z !== null && axisFilter.z !== z) ||
          (variant === 'shell26' && shellTypeFilter === 'face' && z === 0));
      return {
        z,
        points: `${tl.px},${tl.py} ${tr.px},${tr.py} ${br.px},${br.py} ${bl.px},${bl.py}`,
        dimmed: planeFiltered
      };
    });
  });

  // 3-layer flat grids sorted by current view Z
  const layers = $derived.by(() => {
    const layerDefs: { z: -1 | 0 | 1; label: string }[] = [
      { z: -1, label: 'Přední' },
      { z: 0, label: 'Střední' },
      { z: 1, label: 'Zadní' }
    ];
    const byViewKey = new Map<string, CubeNode>();
    for (const n of nodes) {
      byViewKey.set(`${n.viewCoord.x},${n.viewCoord.y},${n.viewCoord.z}`, n);
    }

    return layerDefs.map(({ z, label }) => {
      const cells: (CubeNode | null)[] = [];
      for (const y of [-1, 0, 1] as const) {
        for (const x of [-1, 0, 1] as const) {
          cells.push(byViewKey.get(`${x},${y},${z}`) ?? null);
        }
      }
      return { z, label, cells };
    });
  });

  function nodeRadius(vz: number): number {
    return 15.5 - Math.max(-1, Math.min(1, vz)) * 1.5;
  }

  function jiggleDelay(node: CubeNode): string {
    const hash = (node.coord.x + 1) * 9 + (node.coord.y + 1) * 3 + (node.coord.z + 1);
    return `${(hash % 7) * -0.04}s`;
  }

  function edgeOpacity(avgZ: number, active: boolean, kind: 'lattice' | 'face-guide'): number {
    if (!active) return 0.08;
    const base = avgZ <= -0.5 ? 0.55 : avgZ <= 0.25 ? 0.34 : 0.2;
    return kind === 'face-guide' ? base * 0.65 : base;
  }

  let activeSwap = $state<{
    aId: string;
    bId: string;
    ax: number;
    ay: number;
    bx: number;
    by: number;
    t: number;
  } | null>(null);
  let swapRaf: number | null = null;

  function cancelSwapAnim() {
    if (swapRaf !== null) {
      cancelAnimationFrame(swapRaf);
      swapRaf = null;
    }
    activeSwap = null;
  }

  let activePulse = $state<NodePulseTrigger | null>(null);
  let pulseTimer: number | null = null;

  function cancelPulseAnim() {
    if (pulseTimer !== null) {
      clearTimeout(pulseTimer);
      pulseTimer = null;
    }
    activePulse = null;
  }

  onDestroy(() => {
    cancelSwapAnim();
    cancelPulseAnim();
  });

  $effect(() => {
    const req = pulseAnim;
    untrack(() => {
      cancelPulseAnim();
      if (!req) return;
      const reduceMotion =
        typeof window !== 'undefined' &&
        window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
      if (reduceMotion) return;
      activePulse = req;
      pulseTimer = window.setTimeout(() => {
        activePulse = null;
        pulseTimer = null;
      }, 320);
    });
  });

  $effect(() => {
    const req = swapAnim;
    untrack(() => {
      cancelSwapAnim();
      if (!req) return;
      const reduceMotion =
        typeof window !== 'undefined' &&
        window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
      if (reduceMotion) return;

      let ax = 0;
      let ay = 0;
      let bx = 0;
      let by = 0;

      if (viewMode === 'wireframe') {
        const pA = projectedById.get(req.aId);
        const pB = projectedById.get(req.bId);
        if (!pA || !pB) return;
        ax = pA.px;
        ay = pA.py;
        bx = pB.px;
        by = pB.py;
      } else {
        const elA = canvasEl?.querySelector(`[data-node-id="${req.aId}"]`) as HTMLElement | null;
        const elB = canvasEl?.querySelector(`[data-node-id="${req.bId}"]`) as HTMLElement | null;
        if (!elA || !elB) return;
        const rA = elA.getBoundingClientRect();
        const rB = elB.getBoundingClientRect();
        ax = rA.left + rA.width / 2;
        ay = rA.top + rA.height / 2;
        bx = rB.left + rB.width / 2;
        by = rB.top + rB.height / 2;
      }

      const duration = 240;
      const startTime = performance.now();

      const tick = (now: number) => {
        const rawT = Math.min(1, (now - startTime) / duration);
        const eased = 1 - Math.pow(1 - rawT, 3);
        activeSwap = { aId: req.aId, bId: req.bId, ax, ay, bx, by, t: eased };
        if (rawT < 1) {
          swapRaf = requestAnimationFrame(tick);
        } else {
          activeSwap = null;
          swapRaf = null;
        }
      };

      activeSwap = { aId: req.aId, bId: req.bId, ax, ay, bx, by, t: 0 };
      swapRaf = requestAnimationFrame(tick);
    });
  });

  function getSwapFlightOffset(nodeId: string): { dx: number; dy: number; lift: number } | null {
    if (!activeSwap) return null;
    if (nodeId !== activeSwap.aId && nodeId !== activeSwap.bId) return null;

    const isA = nodeId === activeSwap.aId;
    const vx = activeSwap.bx - activeSwap.ax;
    const vy = activeSwap.by - activeSwap.ay;
    const dist = Math.hypot(vx, vy) || 1;
    const remaining = 1 - activeSwap.t;
    const sinArc = Math.sin(Math.PI * activeSwap.t);
    const arc = sinArc * Math.min(18, dist * 0.22);
    const nx = -vy / dist;
    const ny = vx / dist;
    const sign = isA ? 1 : -1;

    return {
      dx: (isA ? vx : -vx) * remaining + sign * nx * arc,
      dy: (isA ? vy : -vy) * remaining + sign * ny * arc,
      lift: 1 + 0.16 * sinArc
    };
  }

  export function hitTestClientPoint(clientX: number, clientY: number): string | null {
    if (viewMode === 'layers') {
      const el = document.elementFromPoint(clientX, clientY) as HTMLElement | null;
      const cell = el?.closest('[data-node-id]') as HTMLElement | null;
      return cell?.dataset.nodeId ?? null;
    }

    if (!svgEl) return null;
    const ctm = svgEl.getScreenCTM();
    if (!ctm) return null;
    const pt = svgEl.createSVGPoint();
    pt.x = clientX;
    pt.y = clientY;
    const local = pt.matrixTransform(ctm.inverse());

    let bestId: string | null = null;
    let bestDist = 30;
    for (const item of projectedNodes) {
      const d = Math.hypot(item.px - local.x, item.py - local.y);
      if (d < bestDist) {
        bestDist = d;
        bestId = item.node.id;
      }
    }
    return bestId;
  }

  function handleCanvasPointerDown(e: PointerEvent) {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    if ((e.target as Element | null)?.closest('.cube-node, .layer-cell')) return;
    onBackgroundPointerDown?.();
  }
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
  bind:this={canvasEl}
  class="cube-canvas"
  class:is-edit-mode={editMode}
  onpointerdown={handleCanvasPointerDown}
  oncontextmenu={(e) => e.preventDefault()}
>
  {#if viewMode === 'wireframe'}
    <svg
      bind:this={svgEl}
      class="cube-svg"
      viewBox="0 0 {viewBoxW} {viewBoxH}"
      role="img"
      aria-label="Drátěný model krychle"
    >
      {#each depthQuads as quad (quad.z)}
        <polygon
          points={quad.points}
          class="depth-plane"
          class:is-front={quad.z === -1}
          class:is-dimmed={quad.dimmed}
        />
      {/each}

      {#each wireframeEdges as edge, i (i)}
        <line
          x1={edge.x1}
          y1={edge.y1}
          x2={edge.x2}
          y2={edge.y2}
          class="wire-edge"
          class:is-guide={edge.kind === 'face-guide'}
          stroke-opacity={edgeOpacity(edge.avgZ, edge.active, edge.kind)}
        />
      {/each}

      {#each projectedNodes as { node, fv, px, py, matched } (node.id)}
        {@const r = nodeRadius(fv.z)}
        {@const isInspected = inspectedNodeId === node.id}
        {@const isSelected = editMode && selectedNodeId === node.id}
        {@const isHovered = hoveredNodeId === node.id}
        {@const isDragged = draggingNodeId === node.id}
        {@const isSwapping = !!activeSwap && (activeSwap.aId === node.id || activeSwap.bId === node.id)}
        {@const isPulsing = !!activePulse && activePulse.nodeId === node.id}
        {@const isEmpty = !node.char}
        {@const isFaceSquare = variant === 'shell26' && node.elementType === 'face'}
        {@const isCorner = variant === 'shell26' && node.elementType === 'corner'}
        <g
          class="cube-node"
          class:is-dimmed={hasFilter && !matched && !isHovered}
          class:is-highlighted={(hasFilter && matched) || isInspected}
          class:is-selected={isSelected}
          class:is-hovered={isHovered}
          class:is-dragged={isDragged}
          class:is-empty={isEmpty}
          class:depth-back={fv.z > 0.35}
          class:depth-mid={fv.z >= -0.35 && fv.z <= 0.35}
          class:depth-front={fv.z < -0.35}
          data-node-id={node.id}
          transform="translate({px}, {py})"
          onpointerdown={(e) => onNodePointerDown(e, node)}
        >
          <g
            class="cube-node-jiggle"
            class:is-jiggling={editMode && !isDragged && !isSelected}
            style:--jiggle-delay={jiggleDelay(node)}
          >
            <circle r={r + 6} class="node-hitarea" />

            {#if isHovered || isSelected}
              {#if isFaceSquare}
                <rect
                  x={-(r + 4)}
                  y={-(r + 4)}
                  width={(r + 4) * 2}
                  height={(r + 4) * 2}
                  rx="7"
                  class="node-drop-halo"
                />
              {:else}
                <circle r={r + 5} class="node-drop-halo" />
              {/if}
            {/if}

            {#if isFaceSquare}
              <rect
                x={-r}
                y={-r}
                width={r * 2}
                height={r * 2}
                rx="5"
                class="node-shape"
              />
            {:else}
              <circle
                {r}
                class="node-shape"
                class:is-corner={isCorner}
              />
            {/if}

            {#if isPulsing && activePulse}
              {#key activePulse.seq}
                {#if isFaceSquare}
                  <rect
                    x={-r}
                    y={-r}
                    width={r * 2}
                    height={r * 2}
                    rx="5"
                    class="node-pulse-ring"
                  />
                {:else}
                  <circle {r} class="node-pulse-ring" />
                {/if}
              {/key}
            {/if}

            {#if !isSwapping}
              {#key isPulsing ? activePulse?.seq : 0}
                <g class="node-pop" class:is-popping={isPulsing}>
                  <text
                    y="0.5"
                    class="node-char"
                    class:is-small={node.char.length > 1}
                  >
                    {node.char || (editMode ? '·' : '')}
                  </text>

                  {#if node.tag}
                    <g class="node-tag" transform="translate({r * 0.72}, {-r * 0.72})">
                      <rect x="-8" y="-6.5" width="16" height="13" rx="4" class="tag-bg" />
                      <text y="0.5" class="tag-text">{node.tag.slice(0, 2)}</text>
                    </g>
                  {/if}
                </g>
              {/key}
            {/if}
          </g>
        </g>
      {/each}

      {#if activeSwap}
        <g class="swap-flight-layer" pointer-events="none">
          {#each projectedNodes as { node, fv, px, py } (node.id)}
            {@const flight = getSwapFlightOffset(node.id)}
            {#if flight}
              {@const r = nodeRadius(fv.z)}
              <g
                class="swap-flight-token"
                transform="translate({px + flight.dx}, {py + flight.dy}) scale({flight.lift})"
              >
                <circle r={r * 0.88} class="swap-token-bg" />
                <text
                  y="0.5"
                  class="node-char"
                  class:is-small={node.char.length > 1}
                >
                  {node.char || '·'}
                </text>
                {#if node.tag}
                  <g class="node-tag" transform="translate({r * 0.72}, {-r * 0.72})">
                    <rect x="-8" y="-6.5" width="16" height="13" rx="4" class="tag-bg" />
                    <text y="0.5" class="tag-text">{node.tag.slice(0, 2)}</text>
                  </g>
                {/if}
              </g>
            {/if}
          {/each}
        </g>
      {/if}
    </svg>
  {:else}
    <div class="layers-grid">
      {#each layers as layer (layer.z)}
        <div class="layer-col">
          <div class="layer-title">{layer.label}</div>
          <div class="layer-cells">
            {#each layer.cells as cell, cellIdx (cell?.id ?? `core-${layer.z}-${cellIdx}`)}
              {#if cell}
                {@const matched = !hasFilter || matchesFilter(cell, variant, axisFilter, shellTypeFilter)}
                {@const isInspected = inspectedNodeId === cell.id}
                {@const isSelected = editMode && selectedNodeId === cell.id}
                {@const isHovered = hoveredNodeId === cell.id}
                {@const isDragged = draggingNodeId === cell.id}
                {@const flight = getSwapFlightOffset(cell.id)}
                {@const isPulsing = !!activePulse && activePulse.nodeId === cell.id}
                <button
                  type="button"
                  class="layer-cell"
                  class:is-dimmed={hasFilter && !matched && !isHovered}
                  class:is-highlighted={(hasFilter && matched) || isInspected}
                  class:is-selected={isSelected}
                  class:is-hovered={isHovered}
                  class:is-dragged={isDragged}
                  class:is-swapping={!!flight}
                  class:is-empty={!cell.char}
                  class:is-jiggling={editMode && !isDragged && !isSelected && !flight}
                  style:--jiggle-delay="{(cellIdx % 5) * -0.08}s"
                  data-node-id={cell.id}
                  onpointerdown={(e) => onNodePointerDown(e, cell)}
                >
                  {#if isPulsing && activePulse}
                    {#key activePulse.seq}
                      <span class="layer-pulse-ring" aria-hidden="true"></span>
                    {/key}
                  {/if}
                  {#key isPulsing ? activePulse?.seq : 0}
                    <span
                      class="layer-payload"
                      class:is-popping={isPulsing}
                      style:transform={flight
                        ? `translate(${flight.dx}px, ${flight.dy}px) scale(${flight.lift})`
                        : null}
                    >
                      <span class="layer-char" class:is-small={cell.char.length > 1}>
                        {cell.char || (editMode ? '·' : '')}
                      </span>
                      {#if cell.tag}
                        <span class="layer-tag">{cell.tag.slice(0, 2)}</span>
                      {/if}
                    </span>
                  {/key}
                </button>
              {:else}
                <div class="layer-core" aria-hidden="true"></div>
              {/if}
            {/each}
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>

<style>
  .cube-canvas {
    width: 100%;
    height: 100%;
    min-height: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    user-select: none;
    -webkit-user-select: none;
    -webkit-touch-callout: none;
    touch-action: none;
  }

  .cube-svg {
    width: 100%;
    height: 100%;
    max-height: 100%;
    max-width: 100%;
    overflow: visible;
    touch-action: none;
  }

  .depth-plane {
    fill: rgba(255, 255, 255, 0.018);
    stroke: rgba(255, 255, 255, 0.05);
    stroke-width: 1;
    pointer-events: none;
    transition: opacity 0.15s ease;
  }

  .depth-plane.is-front {
    fill: rgba(255, 255, 255, 0.028);
  }

  .depth-plane.is-dimmed {
    opacity: 0.25;
  }

  .wire-edge {
    stroke: var(--color-text-secondary);
    stroke-width: 1.25;
    stroke-linecap: round;
    pointer-events: none;
  }

  .wire-edge.is-guide {
    stroke-dasharray: 2.5 3;
  }

  .cube-node {
    cursor: pointer;
    touch-action: none;
    transition: opacity 0.14s ease;
  }

  .cube-node.is-dimmed {
    opacity: 0.16;
  }

  .cube-node.is-dragged {
    opacity: 0.3;
  }

  .node-hitarea {
    fill: transparent;
  }

  .node-drop-halo {
    fill: var(--color-accent-primary-subtle);
    stroke: var(--color-accent-primary);
    stroke-width: 2;
  }

  .node-shape {
    fill: var(--color-surface-2);
    stroke: var(--color-border-medium);
    stroke-width: 1.3;
  }

  .depth-back .node-shape {
    fill: var(--color-surface-1);
    stroke: var(--color-border-subtle);
  }

  .depth-front .node-shape {
    fill: var(--color-surface-3);
    stroke: var(--color-border-strong);
  }

  .node-shape.is-corner {
    stroke-width: 1.8;
  }

  .cube-node.is-empty .node-shape {
    fill: var(--color-surface-sunken);
    stroke-dasharray: 3 2.5;
  }

  .cube-node.is-highlighted .node-shape,
  .cube-node.is-hovered .node-shape,
  .cube-node.is-selected .node-shape {
    fill: var(--color-surface-3);
    stroke: var(--color-accent-primary);
    stroke-width: 2.2;
    stroke-dasharray: none;
  }

  .node-char {
    fill: var(--color-text-primary);
    font-family: var(--font-mono);
    font-size: 13.5px;
    font-weight: 700;
    text-anchor: middle;
    dominant-baseline: central;
    pointer-events: none;
  }

  .depth-back .node-char {
    fill: var(--color-text-secondary);
  }

  .cube-node.is-empty .node-char {
    fill: var(--color-text-muted);
  }

  .node-char.is-small {
    font-size: 11px;
  }

  .tag-bg {
    fill: var(--color-surface-1);
    stroke: var(--color-accent-warning);
    stroke-width: 1.2;
  }

  .tag-text {
    fill: var(--color-accent-warning);
    font-family: var(--font-mono);
    font-size: 8.5px;
    font-weight: 700;
    text-anchor: middle;
    dominant-baseline: central;
    pointer-events: none;
  }

  /* Arrangement jiggle & edit affordance */
  .is-edit-mode .cube-node:not(.is-highlighted):not(.is-hovered):not(.is-selected) .node-shape {
    stroke: var(--color-accent-primary);
    stroke-opacity: 0.72;
    stroke-dasharray: 3.5 2.5;
  }

  .is-edit-mode .layer-cell:not(.is-highlighted):not(.is-hovered):not(.is-selected) {
    border-style: dashed;
    border-color: var(--color-accent-primary);
  }

  .cube-node-jiggle {
    transform-box: fill-box;
    transform-origin: center;
  }

  .is-jiggling {
    animation: cube-jiggle 0.26s ease-in-out infinite alternate;
    animation-delay: var(--jiggle-delay, 0s);
    will-change: transform;
  }

  @keyframes cube-jiggle {
    0% {
      transform: translate(-1.4px, -0.7px) rotate(-5deg);
    }
    50% {
      transform: translate(0.5px, 0.9px) rotate(3deg);
    }
    100% {
      transform: translate(1.4px, -0.5px) rotate(5.5deg);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .is-jiggling {
      animation: none;
    }
  }

  /* 3-layer flat view */
  .layers-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: var(--space-sm);
    width: 100%;
    max-width: 340px;
    align-items: center;
  }

  .layer-col {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-xs);
  }

  .layer-title {
    font-size: var(--text-xs);
    font-weight: 600;
    color: var(--color-text-secondary);
    letter-spacing: 0.02em;
  }

  .layer-cells {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 3px;
    width: 100%;
    padding: 3px;
    background-color: var(--color-surface-1);
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-sm);
    box-sizing: border-box;
  }

  .layer-cell {
    position: relative;
    aspect-ratio: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    background-color: var(--color-surface-2);
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-xs);
    color: var(--color-text-primary);
    font-family: var(--font-mono);
    font-weight: 700;
    cursor: pointer;
    touch-action: none;
    transition: opacity 0.14s ease, border-color 0.12s ease;
  }

  .layer-cell.is-empty {
    background-color: var(--color-surface-sunken);
    border-style: dashed;
    color: var(--color-text-muted);
  }

  .layer-cell.is-dimmed {
    opacity: 0.18;
  }

  .layer-cell.is-dragged {
    opacity: 0.3;
  }

  .layer-cell.is-highlighted,
  .layer-cell.is-hovered,
  .layer-cell.is-selected {
    border-style: solid;
    border-color: var(--color-accent-primary);
    background-color: var(--color-accent-primary-subtle);
  }

  .layer-cell.is-selected {
    box-shadow: 0 0 0 1px var(--color-accent-primary);
  }

  .layer-cell.is-swapping {
    z-index: 10;
    overflow: visible;
  }

  .layer-payload {
    position: relative;
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    pointer-events: none;
  }

  .layer-cell.is-swapping .layer-payload {
    background-color: var(--color-surface-3);
    border: 1px solid var(--color-accent-primary);
    border-radius: var(--radius-xs);
    box-shadow: var(--shadow-md);
  }

  .swap-token-bg {
    fill: var(--color-surface-3);
    stroke: var(--color-accent-primary);
    stroke-width: 1.5;
  }

  /* Replace / update confirmation: pop-in + expanding accent ring */
  .node-pop {
    transform-box: fill-box;
    transform-origin: center;
  }

  .node-pop.is-popping,
  .layer-payload.is-popping {
    animation: cube-node-pop 0.28s cubic-bezier(0.22, 1, 0.36, 1);
  }

  .node-pulse-ring {
    fill: none;
    stroke: var(--color-accent-primary);
    stroke-width: 2.2;
    pointer-events: none;
    transform-box: fill-box;
    transform-origin: center;
    animation: cube-pulse-ring 0.3s ease-out forwards;
  }

  .layer-pulse-ring {
    position: absolute;
    inset: -1px;
    border-radius: var(--radius-xs);
    border: 2px solid var(--color-accent-primary);
    pointer-events: none;
    z-index: 4;
    animation: cube-layer-pulse 0.3s ease-out forwards;
  }

  @keyframes cube-node-pop {
    0% {
      transform: scale(1.36);
    }
    55% {
      transform: scale(0.92);
    }
    100% {
      transform: scale(1);
    }
  }

  @keyframes cube-pulse-ring {
    0% {
      transform: scale(1);
      opacity: 0.9;
    }
    100% {
      transform: scale(1.52);
      opacity: 0;
    }
  }

  @keyframes cube-layer-pulse {
    0% {
      transform: scale(1);
      opacity: 0.9;
    }
    100% {
      transform: scale(1.24);
      opacity: 0;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .node-pop.is-popping,
    .layer-payload.is-popping,
    .node-pulse-ring,
    .layer-pulse-ring {
      animation: none;
    }
  }

  .layer-char {
    font-size: var(--text-sm);
    line-height: 1;
  }

  .layer-char.is-small {
    font-size: var(--text-xs);
  }

  .layer-tag {
    position: absolute;
    top: 1px;
    right: 2px;
    font-size: 9px;
    line-height: 1;
    color: var(--color-accent-warning);
  }

  .layer-core {
    aspect-ratio: 1;
    border-radius: var(--radius-xs);
    background-color: transparent;
    border: 1px dashed var(--color-border-sunken);
    opacity: 0.45;
  }
</style>
