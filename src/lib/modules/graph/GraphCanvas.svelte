<script lang="ts">
  import { onDestroy } from 'svelte';
  import PanZoomViewport from '../../components/ui/PanZoomViewport.svelte';
  import type { GraphEdge, GraphNode } from './graphParser';
  import type { NodePosition } from './graphLayout';

  interface Props {
    nodes: GraphNode[];
    edges: GraphEdge[];
    positions: Record<string, NodePosition>;
    contentWidth: number;
    contentHeight: number;
    pinnedNodeIds: Set<string>;
    selectedStartId: string | null;
    selectedEndId: string | null;
    selectedEdgeId: string | null;
    highlightedNodeIds: Set<string>;
    highlightedEdgeIds: Set<string>;
    usedUndirectedFallback?: boolean;
    showEdgeLabels?: boolean;
    onNodeTap: (nodeId: string) => void;
    onEdgeTap?: (edgeId: string) => void;
    onNodeDrag: (nodeId: string, x: number, y: number) => void;
    onBackgroundTap: () => void;
  }

  let {
    nodes,
    edges,
    positions,
    contentWidth,
    contentHeight,
    pinnedNodeIds,
    selectedStartId,
    selectedEndId,
    selectedEdgeId,
    highlightedNodeIds,
    highlightedEdgeIds,
    usedUndirectedFallback = false,
    showEdgeLabels = true,
    onNodeTap,
    onEdgeTap,
    onNodeDrag,
    onBackgroundTap
  }: Props = $props();

  let viewportRef = $state<ReturnType<typeof PanZoomViewport> | null>(null);
  let scale = $state(1);

  export function resetView(vibrate = true) {
    viewportRef?.resetView(vibrate);
  }

  export function zoomIn() {
    viewportRef?.zoomIn();
  }

  export function zoomOut() {
    viewportRef?.zoomOut();
  }

  const MARGIN = 26;
  const stageW = $derived(Math.max(200, contentWidth + MARGIN * 2));
  const stageH = $derived(Math.max(140, contentHeight + MARGIN * 2));

  const hasHighlight = $derived(selectedStartId !== null || selectedEdgeId !== null);
  const renderLabels = $derived(showEdgeLabels && (edges.length <= 24 || scale >= 0.28));

  function toStage(pos: NodePosition | undefined): NodePosition {
    if (!pos) return { x: stageW / 2, y: stageH / 2 };
    return { x: pos.x + MARGIN, y: pos.y + MARGIN };
  }

  /** Computes intersection of ray (towards `toward`) with the node's visual boundary. */
  function clipToNodeBoundary(
    nodeCenter: NodePosition,
    toward: NodePosition,
    node: GraphNode,
    extraPad = 3
  ): NodePosition {
    const dx = toward.x - nodeCenter.x;
    const dy = toward.y - nodeCenter.y;
    const dist = Math.hypot(dx, dy);
    if (dist < 1e-3) return { ...nodeCenter };

    const ux = dx / dist;
    const uy = dy / dist;

    if (node.width === node.height) {
      const r = node.width / 2 + extraPad;
      return { x: nodeCenter.x + ux * r, y: nodeCenter.y + uy * r };
    }

    const hw = node.width / 2 + extraPad;
    const hh = node.height / 2 + extraPad;
    const tx = Math.abs(ux) > 1e-4 ? hw / Math.abs(ux) : Infinity;
    const ty = Math.abs(uy) > 1e-4 ? hh / Math.abs(uy) : Infinity;
    const t = Math.min(tx, ty);
    return { x: nodeCenter.x + ux * t, y: nodeCenter.y + uy * t };
  }

  interface RenderedEdge {
    edge: GraphEdge;
    pathD: string;
    labelX: number;
    labelY: number;
    labelW: number;
    highlighted: boolean;
    dimmed: boolean;
  }

  const nodeById = $derived.by(() => {
    const map = new Map<string, GraphNode>();
    for (const n of nodes) map.set(n.id, n);
    return map;
  });

  const renderedEdges = $derived.by<RenderedEdge[]>(() => {
    // Group parallel edges between the same unordered endpoint pair
    const pairGroups = new Map<string, GraphEdge[]>();
    for (const e of edges) {
      const key = e.source <= e.target ? `${e.source}\0${e.target}` : `${e.target}\0${e.source}`;
      let list = pairGroups.get(key);
      if (!list) {
        list = [];
        pairGroups.set(key, list);
      }
      list.push(e);
    }

    const out: RenderedEdge[] = [];

    for (const group of pairGroups.values()) {
      const n = group.length;
      for (let idx = 0; idx < n; idx++) {
        const edge = group[idx];
        const srcNode = nodeById.get(edge.source);
        const tgtNode = nodeById.get(edge.target);
        if (!srcNode || !tgtNode) continue;

        const pSrc = toStage(positions[edge.source]);
        const pTgt = toStage(positions[edge.target]);
        const highlighted = highlightedEdgeIds.has(edge.id) || selectedEdgeId === edge.id;
        const dimmed = hasHighlight && !highlighted;

        let pathD = '';
        let labelX = (pSrc.x + pTgt.x) / 2;
        let labelY = (pSrc.y + pTgt.y) / 2;

        if (edge.source === edge.target) {
          // Self-loop arc above the node
          const topY = pSrc.y - srcNode.height / 2;
          const x1 = pSrc.x - 9;
          const x2 = pSrc.x + 9;
          const loopLift = 34 + idx * 14;
          const c1x = pSrc.x - 24 - idx * 6;
          const c2x = pSrc.x + 24 + idx * 6;
          const cy = topY - loopLift;
          pathD = `M ${x1} ${topY - 1} C ${c1x} ${cy}, ${c2x} ${cy}, ${x2} ${topY - 3}`;
          labelX = pSrc.x;
          labelY = cy + 6;
        } else if (n === 1) {
          const startPt = clipToNodeBoundary(pSrc, pTgt, srcNode, 2);
          const endPt = clipToNodeBoundary(pTgt, pSrc, tgtNode, edge.directed ? 5 : 2);
          pathD = `M ${startPt.x} ${startPt.y} L ${endPt.x} ${endPt.y}`;
          labelX = (startPt.x + endPt.x) / 2;
          labelY = (startPt.y + endPt.y) / 2;
        } else {
          // Parallel edges: offset perpendicular to canonical direction
          const canonA = edge.source <= edge.target ? pSrc : pTgt;
          const canonB = edge.source <= edge.target ? pTgt : pSrc;
          const cdx = canonB.x - canonA.x;
          const cdy = canonB.y - canonA.y;
          const cLen = Math.max(1, Math.hypot(cdx, cdy));
          const nx = -cdy / cLen;
          const ny = cdx / cLen;

          const slot = idx - (n - 1) / 2;
          const offsetMag = slot * 34;
          const midX = (pSrc.x + pTgt.x) / 2 + nx * offsetMag;
          const midY = (pSrc.y + pTgt.y) / 2 + ny * offsetMag;

          // Quadratic Bezier midpoint at t=0.5 is 0.25*P0 + 0.5*C + 0.25*P2; place C at 2*mid - 0.5*(P0+P2)
          const ctrlX = midX * 2 - (pSrc.x + pTgt.x) / 2;
          const ctrlY = midY * 2 - (pSrc.y + pTgt.y) / 2;
          const ctrl = { x: ctrlX, y: ctrlY };

          const startPt = clipToNodeBoundary(pSrc, ctrl, srcNode, 2);
          const endPt = clipToNodeBoundary(pTgt, ctrl, tgtNode, edge.directed ? 5 : 2);

          pathD = `M ${startPt.x} ${startPt.y} Q ${ctrlX} ${ctrlY} ${endPt.x} ${endPt.y}`;
          labelX = 0.25 * startPt.x + 0.5 * ctrlX + 0.25 * endPt.x;
          labelY = 0.25 * startPt.y + 0.5 * ctrlY + 0.25 * endPt.y;
        }

        const labelText = edge.label ?? '';
        const labelW = labelText ? Math.max(20, Math.min(120, [...labelText].length * 7 + 12)) : 0;

        out.push({
          edge,
          pathD,
          labelX,
          labelY,
          labelW,
          highlighted,
          dimmed
        });
      }
    }

    // Draw highlighted edges on top of dimmed edges
    out.sort((a, b) => Number(a.highlighted) - Number(b.highlighted));
    return out;
  });

  // Node drag tracking (in graph coordinates, divided by current PanZoomViewport scale)
  let draggingNodeId = $state<string | null>(null);
  let activeDrag: {
    nodeId: string;
    pointerId: number;
    startClientX: number;
    startClientY: number;
    startPosX: number;
    startPosY: number;
    moved: boolean;
  } | null = null;

  function onWindowPointerMove(e: PointerEvent) {
    if (!activeDrag || e.pointerId !== activeDrag.pointerId) return;
    const dx = e.clientX - activeDrag.startClientX;
    const dy = e.clientY - activeDrag.startClientY;
    if (!activeDrag.moved && Math.hypot(dx, dy) > 6) {
      activeDrag.moved = true;
      draggingNodeId = activeDrag.nodeId;
    }
    if (activeDrag.moved) {
      const s = viewportRef?.getScale() || scale || 1;
      const node = nodeById.get(activeDrag.nodeId);
      const hw = (node?.width ?? 34) / 2;
      const hh = (node?.height ?? 34) / 2;
      const rawX = activeDrag.startPosX + dx / s;
      const rawY = activeDrag.startPosY + dy / s;
      // Keep inside stage margins (pos + MARGIN inside [hw+6, stageW-hw-6])
      const minX = hw + 8 - MARGIN;
      const maxX = stageW - hw - 8 - MARGIN;
      const minY = hh + 8 - MARGIN;
      const maxY = stageH - hh - 8 - MARGIN;
      onNodeDrag(
        activeDrag.nodeId,
        Math.round(Math.min(maxX, Math.max(minX, rawX)) * 10) / 10,
        Math.round(Math.min(maxY, Math.max(minY, rawY)) * 10) / 10
      );
    }
  }

  function cleanupNodeDrag() {
    draggingNodeId = null;
    activeDrag = null;
    if (typeof window !== 'undefined') {
      window.removeEventListener('pointermove', onWindowPointerMove);
      window.removeEventListener('pointerup', onWindowPointerUp);
      window.removeEventListener('pointercancel', onWindowPointerCancel);
    }
  }

  function onWindowPointerUp(e: PointerEvent) {
    if (!activeDrag || e.pointerId !== activeDrag.pointerId) return;
    const tapNodeId = !activeDrag.moved ? activeDrag.nodeId : null;
    cleanupNodeDrag();
    if (tapNodeId) onNodeTap(tapNodeId);
  }

  function onWindowPointerCancel(e: PointerEvent) {
    if (!activeDrag || e.pointerId !== activeDrag.pointerId) return;
    cleanupNodeDrag();
  }

  function handleNodePointerDown(e: PointerEvent, node: GraphNode) {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    e.stopPropagation();
    e.preventDefault();
    cleanupNodeDrag();

    const pos = positions[node.id] ?? { x: contentWidth / 2, y: contentHeight / 2 };
    activeDrag = {
      nodeId: node.id,
      pointerId: e.pointerId,
      startClientX: e.clientX,
      startClientY: e.clientY,
      startPosX: pos.x,
      startPosY: pos.y,
      moved: false
    };

    window.addEventListener('pointermove', onWindowPointerMove);
    window.addEventListener('pointerup', onWindowPointerUp);
    window.addEventListener('pointercancel', onWindowPointerCancel);
  }

  // Edge tap without blocking background pan
  let edgeTapCandidate: { edgeId: string; pointerId: number; x: number; y: number } | null = null;
  function handleEdgePointerDown(e: PointerEvent, edgeId: string) {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    edgeTapCandidate = { edgeId, pointerId: e.pointerId, x: e.clientX, y: e.clientY };
  }
  function handleEdgePointerUp(e: PointerEvent, edgeId: string) {
    if (!edgeTapCandidate || edgeTapCandidate.pointerId !== e.pointerId) return;
    const dist = Math.hypot(e.clientX - edgeTapCandidate.x, e.clientY - edgeTapCandidate.y);
    edgeTapCandidate = null;
    if (dist <= 6 && onEdgeTap) {
      e.stopPropagation();
      onEdgeTap(edgeId);
    }
  }

  // Background tap detection (clears focus when tapping empty canvas without panning)
  let bgTapCandidate: { pointerId: number; x: number; y: number } | null = null;
  function handleWrapPointerDown(e: PointerEvent) {
    if (!e.isPrimary) {
      bgTapCandidate = null;
      return;
    }
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    const target = e.target as Element | null;
    if (target?.closest('.graph-node, .graph-edge-hit, .graph-edge-label')) {
      bgTapCandidate = null;
      return;
    }
    bgTapCandidate = { pointerId: e.pointerId, x: e.clientX, y: e.clientY };
  }

  function handleWrapPointerUp(e: PointerEvent) {
    if (!bgTapCandidate || bgTapCandidate.pointerId !== e.pointerId) return;
    const dist = Math.hypot(e.clientX - bgTapCandidate.x, e.clientY - bgTapCandidate.y);
    bgTapCandidate = null;
    if (dist <= 8) {
      onBackgroundTap();
    }
  }

  function handleWrapPointerCancel() {
    bgTapCandidate = null;
  }

  onDestroy(() => {
    cleanupNodeDrag();
  });

  // Re-fit view when layout dimensions change (e.g. Podklad edited or layout mode switched)
  let prevDims = '';
  $effect(() => {
    const key = `${stageW}x${stageH}`;
    if (prevDims && prevDims !== key) {
      requestAnimationFrame(() => viewportRef?.resetView(false));
    }
    prevDims = key;
  });
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
  class="graph-viewport-wrap"
  onpointerdown={handleWrapPointerDown}
  onpointerup={handleWrapPointerUp}
  onpointercancel={handleWrapPointerCancel}
  oncontextmenu={(e) => e.preventDefault()}
>
  {#if nodes.length === 0}
    <div class="graph-empty">
      <p>Zatím žádné uzly ani spojnice</p>
    </div>
  {:else}
    <PanZoomViewport
      bind:this={viewportRef}
      contentWidth={stageW}
      contentHeight={stageH}
      allowSinglePointerPan={true}
      doubleTapToZoom={true}
      minScale={0.2}
      maxScale={4.5}
      bind:currentScale={scale}
    >
      <div class="graph-stage" style:width="{stageW}px" style:height="{stageH}px">
        <svg
          class="graph-svg"
          width={stageW}
          height={stageH}
          viewBox="0 0 {stageW} {stageH}"
          role="img"
          aria-label="Vizualizace grafu"
        >
          <defs>
            <marker
              id="graph-arrow-default"
              viewBox="0 0 10 10"
              refX="8.5"
              refY="5"
              markerWidth="6.5"
              markerHeight="6.5"
              orient="auto-start-reverse"
            >
              <path d="M 0 1.2 L 9.5 5 L 0 8.8 z" class="arrow-fill-default" />
            </marker>
            <marker
              id="graph-arrow-active"
              viewBox="0 0 10 10"
              refX="8.5"
              refY="5"
              markerWidth="6.5"
              markerHeight="6.5"
              orient="auto-start-reverse"
            >
              <path d="M 0 1.2 L 9.5 5 L 0 8.8 z" class="arrow-fill-active" />
            </marker>
            <marker
              id="graph-arrow-fallback"
              viewBox="0 0 10 10"
              refX="8.5"
              refY="5"
              markerWidth="6.5"
              markerHeight="6.5"
              orient="auto-start-reverse"
            >
              <path d="M 0 1.2 L 9.5 5 L 0 8.8 z" class="arrow-fill-fallback" />
            </marker>
            <marker
              id="graph-arrow-dim"
              viewBox="0 0 10 10"
              refX="8.5"
              refY="5"
              markerWidth="6.5"
              markerHeight="6.5"
              orient="auto-start-reverse"
            >
              <path d="M 0 1.2 L 9.5 5 L 0 8.8 z" class="arrow-fill-dim" />
            </marker>
          </defs>

          <!-- Edges layer -->
          {#each renderedEdges as item (item.edge.id)}
            {@const markerId = item.edge.directed
              ? item.highlighted
                ? usedUndirectedFallback
                  ? 'url(#graph-arrow-fallback)'
                  : 'url(#graph-arrow-active)'
                : item.dimmed
                  ? 'url(#graph-arrow-dim)'
                  : 'url(#graph-arrow-default)'
              : undefined}
            <g
              class="graph-edge"
              class:is-highlighted={item.highlighted}
              class:is-fallback={item.highlighted && usedUndirectedFallback}
              class:is-dimmed={item.dimmed}
            >
              <path
                d={item.pathD}
                class="graph-edge-hit"
                onpointerdown={(e) => handleEdgePointerDown(e, item.edge.id)}
                onpointerup={(e) => handleEdgePointerUp(e, item.edge.id)}
              />
              <path d={item.pathD} class="graph-edge-line" marker-end={markerId} />

              {#if renderLabels && item.edge.label}
                <g
                  class="graph-edge-label"
                  transform="translate({item.labelX}, {item.labelY})"
                  onpointerdown={(e) => handleEdgePointerDown(e, item.edge.id)}
                  onpointerup={(e) => handleEdgePointerUp(e, item.edge.id)}
                >
                  <rect
                    x={-item.labelW / 2}
                    y={-10}
                    width={item.labelW}
                    height={20}
                    rx={6}
                    class="edge-label-bg"
                  />
                  <text y="0.5" class="edge-label-text">{item.edge.label}</text>
                </g>
              {/if}
            </g>
          {/each}

          <!-- Nodes layer -->
          {#each nodes as node (node.id)}
            {@const pos = toStage(positions[node.id])}
            {@const isStart = selectedStartId === node.id}
            {@const isEnd = selectedEndId === node.id}
            {@const isHighlighted = highlightedNodeIds.has(node.id)}
            {@const isDimmed = hasHighlight && !isHighlighted}
            {@const isPinned = pinnedNodeIds.has(node.id)}
            {@const isDragging = draggingNodeId === node.id}
            {@const isCircle = node.width === node.height}
            <g
              class="graph-node"
              class:is-start={isStart}
              class:is-end={isEnd}
              class:is-highlighted={isHighlighted}
              class:is-dimmed={isDimmed}
              class:is-pinned={isPinned}
              class:is-dragging={isDragging}
              transform="translate({pos.x}, {pos.y})"
              onpointerdown={(e) => handleNodePointerDown(e, node)}
            >
              <rect
                x={-node.width / 2 - 5}
                y={-node.height / 2 - 5}
                width={node.width + 10}
                height={node.height + 10}
                rx={isCircle ? node.width / 2 + 5 : 19}
                class="node-hitarea"
              />

              {#if isCircle}
                <circle r={node.width / 2} class="node-body" />
              {:else}
                <rect
                  x={-node.width / 2}
                  y={-node.height / 2}
                  width={node.width}
                  height={node.height}
                  rx={16}
                  class="node-body"
                />
              {/if}

              {#if isPinned}
                <circle
                  cx={node.width / 2 - (isCircle ? 4 : 6)}
                  cy={-node.height / 2 + (isCircle ? 4 : 6)}
                  r={2.5}
                  class="node-pin-dot"
                />
              {/if}

              <text
                y="0.5"
                class="node-label"
                class:is-word={!isCircle}
              >
                {node.label}
              </text>
            </g>
          {/each}
        </svg>
      </div>
    </PanZoomViewport>
  {/if}
</div>

<style>
  .graph-viewport-wrap {
    width: 100%;
    height: 100%;
    min-height: 0;
    position: relative;
    overflow: hidden;
    user-select: none;
    -webkit-user-select: none;
    touch-action: none;
  }

  .graph-empty {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--color-text-muted);
    font-size: var(--text-sm);
  }

  .graph-empty p {
    margin: 0;
  }

  .graph-stage {
    position: relative;
  }

  .graph-svg {
    display: block;
    overflow: visible;
  }

  .arrow-fill-default {
    fill: var(--color-text-secondary);
  }

  .arrow-fill-active {
    fill: var(--color-accent-primary);
  }

  .arrow-fill-fallback {
    fill: var(--color-accent-warning);
  }

  .arrow-fill-dim {
    fill: var(--color-border-strong);
  }

  .graph-edge {
    transition: opacity 0.14s ease;
  }

  .graph-edge.is-dimmed {
    opacity: 0.22;
  }

  .graph-edge-hit {
    fill: none;
    stroke: transparent;
    stroke-width: 14px;
    cursor: pointer;
  }

  .graph-edge-line {
    fill: none;
    stroke: var(--color-text-secondary);
    stroke-opacity: 0.65;
    stroke-width: 1.7px;
    stroke-linecap: round;
    pointer-events: none;
  }

  .graph-edge.is-highlighted .graph-edge-line {
    stroke: var(--color-accent-primary);
    stroke-opacity: 1;
    stroke-width: 2.6px;
  }

  .graph-edge.is-highlighted.is-fallback .graph-edge-line {
    stroke: var(--color-accent-warning);
    stroke-dasharray: 5 3;
  }

  .graph-edge-label {
    cursor: pointer;
  }

  .edge-label-bg {
    fill: var(--color-surface-1);
    stroke: var(--color-border-subtle);
    stroke-width: 1px;
  }

  .graph-edge.is-highlighted .edge-label-bg {
    fill: var(--color-accent-primary-subtle);
    stroke: var(--color-accent-primary);
  }

  .graph-edge.is-highlighted.is-fallback .edge-label-bg {
    fill: color-mix(in srgb, var(--color-accent-warning) 14%, var(--color-surface-1));
    stroke: var(--color-accent-warning);
  }

  .edge-label-text {
    fill: var(--color-text-secondary);
    font-family: var(--font-mono);
    font-size: 10.5px;
    font-weight: 600;
    text-anchor: middle;
    dominant-baseline: central;
    pointer-events: none;
  }

  .graph-edge.is-highlighted .edge-label-text {
    fill: var(--color-text-primary);
  }

  .graph-node {
    cursor: grab;
    transition: opacity 0.14s ease;
  }

  .graph-node.is-dragging {
    cursor: grabbing;
  }

  .graph-node.is-dimmed {
    opacity: 0.28;
  }

  .node-hitarea {
    fill: transparent;
  }

  .node-body {
    fill: var(--color-surface-2);
    stroke: var(--color-border-strong);
    stroke-width: 1.5px;
    transition: fill 0.12s ease, stroke 0.12s ease, stroke-width 0.12s ease;
  }

  .graph-node.is-highlighted .node-body {
    fill: var(--color-accent-primary-subtle);
    stroke: var(--color-accent-primary);
    stroke-width: 2px;
  }

  .graph-node.is-start .node-body {
    fill: var(--color-accent-primary-subtle);
    stroke: var(--color-accent-primary);
    stroke-width: 2.5px;
  }

  .graph-node.is-end .node-body {
    fill: color-mix(in srgb, var(--color-accent-success) 16%, var(--color-surface-2));
    stroke: var(--color-accent-success);
    stroke-width: 2.5px;
  }

  .node-pin-dot {
    fill: var(--color-accent-warning);
    pointer-events: none;
  }

  .node-label {
    fill: var(--color-text-primary);
    font-family: var(--font-mono);
    font-size: 13.5px;
    font-weight: 700;
    text-anchor: middle;
    dominant-baseline: central;
    pointer-events: none;
  }

  .node-label.is-word {
    font-family: var(--font-sans);
    font-size: 12px;
    font-weight: 650;
  }
</style>
