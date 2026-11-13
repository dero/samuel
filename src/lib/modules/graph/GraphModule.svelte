<script lang="ts">
  import { onDestroy } from 'svelte';
  import {
    CornersOut,
    Crosshair,
    MagnifyingGlassMinus,
    MagnifyingGlassPlus,
    X
  } from 'phosphor-svelte';
  import ModuleShell from '../../components/layout/ModuleShell.svelte';
  import type { ModuleBarConfig } from '../../components/layout/ModuleBar.svelte';
  import SegmentedControl, { type SegmentOption } from '../../components/ui/SegmentedControl.svelte';
  import Chassis from '../../components/ui/Chassis.svelte';
  import Keycap from '../../components/ui/Keycap.svelte';
  import MenuGroup from '../../components/ui/MenuGroup.svelte';
  import OptionRow from '../../components/ui/OptionRow.svelte';
  import GraphCanvas from './GraphCanvas.svelte';
  import GraphReference from './GraphReference.svelte';
  import {
    findConnectedComponents,
    findShortestPath,
    parseGraphPodklad,
    type GraphLayoutMode
  } from './graphParser';
  import { computeGraphLayout, type GraphLayoutResult, type NodePosition } from './graphLayout';
  import GraphLayoutWorker from './graphLayout.worker.ts?worker';
  import type {
    GraphLayoutWorkerRequest,
    GraphLayoutWorkerResponse
  } from './graphLayout.worker';
  import { localSettingsService } from '../../services/localSettingsService';
  import { settings } from '../../state/settings.svelte';
  import { toast } from '../../state/toast.svelte';

  const modSettings = localSettingsService.forModule('graph');

  const LAYOUT_OPTIONS: SegmentOption<GraphLayoutMode>[] = [
    { id: 'auto', label: 'Auto' },
    { id: 'layers', label: 'Vrstvy' },
    { id: 'circle', label: 'Kruh' }
  ];

  // Larger graphs offload layout computation to the dedicated Web Worker
  const WORKER_NODE_THRESHOLD = 18;
  const WORKER_EDGE_THRESHOLD = 28;

  let podkladText = $state<string>(modSettings.getString('podklad', ''));
  let layoutMode = $state<GraphLayoutMode>(
    (modSettings.getString('layout_mode', 'auto') as GraphLayoutMode) || 'auto'
  );
  let respectDirection = $state<boolean>(modSettings.getBoolean('respect_direction', true));
  let showEdgeLabels = $state<boolean>(modSettings.getBoolean('show_edge_labels', true));
  let pinnedPositions = $state<Record<string, NodePosition>>(
    modSettings.getJSON<Record<string, NodePosition>>('pinned_positions', {})
  );

  $effect(() => {
    modSettings.update({
      podklad: podkladText,
      layout_mode: layoutMode,
      respect_direction: respectDirection,
      show_edge_labels: showEdgeLabels,
      pinned_positions: pinnedPositions
    });
  });

  const parsed = $derived(parseGraphPodklad(podkladText));
  const components = $derived(findConnectedComponents(parsed.nodes, parsed.edges));

  let autoLayout = $state<GraphLayoutResult>({ positions: {}, width: 300, height: 220 });
  let layoutSeq = 0;
  let worker: Worker | null = null;
  let canvasRef = $state<ReturnType<typeof GraphCanvas> | null>(null);

  function ensureWorker(): Worker | null {
    if (typeof Worker === 'undefined') return null;
    if (!worker) {
      worker = new GraphLayoutWorker();
      worker.onmessage = (event: MessageEvent<GraphLayoutWorkerResponse>) => {
        if (event.data.seq !== layoutSeq) return;
        autoLayout = event.data.result;
      };
    }
    return worker;
  }

  $effect(() => {
    const nodes = parsed.nodes;
    const edges = parsed.edges;
    const mode = layoutMode;
    const seq = ++layoutSeq;

    if (nodes.length === 0) {
      autoLayout = { positions: {}, width: 300, height: 220 };
      return;
    }

    const useWorker =
      nodes.length > WORKER_NODE_THRESHOLD || edges.length > WORKER_EDGE_THRESHOLD;

    if (useWorker) {
      const w = ensureWorker();
      if (w) {
        const payload: GraphLayoutWorkerRequest = {
          seq,
          nodes: nodes.map((n) => ({ ...n })),
          edges: edges.map((e) => ({ ...e })),
          mode
        };
        w.postMessage(payload);
        return;
      }
    }

    autoLayout = computeGraphLayout(nodes, edges, mode);
  });

  onDestroy(() => {
    worker?.terminate();
    worker = null;
  });

  // Drop pinned coordinates for nodes that were removed in Podklad
  const activePinned = $derived.by(() => {
    const validIds = new Set(parsed.nodes.map((n) => n.id));
    const filtered: Record<string, NodePosition> = {};
    for (const [id, pos] of Object.entries(pinnedPositions)) {
      if (validIds.has(id)) filtered[id] = pos;
    }
    return filtered;
  });

  const pinnedNodeIds = $derived(new Set(Object.keys(activePinned)));

  const effectivePositions = $derived.by<Record<string, NodePosition>>(() => {
    const merged: Record<string, NodePosition> = { ...autoLayout.positions };
    for (const [id, pos] of Object.entries(activePinned)) {
      merged[id] = pos;
    }
    return merged;
  });

  // Selection state (browse & shortest path)
  let selectedStartId = $state<string | null>(null);
  let selectedEndId = $state<string | null>(null);
  let selectedEdgeId = $state<string | null>(null);

  // Clear stale selection if nodes/edges disappear after editing Podklad
  $effect(() => {
    const nodeIds = new Set(parsed.nodes.map((n) => n.id));
    if (selectedStartId && !nodeIds.has(selectedStartId)) {
      selectedStartId = null;
      selectedEndId = null;
    }
    if (selectedEndId && !nodeIds.has(selectedEndId)) {
      selectedEndId = null;
    }
    if (selectedEdgeId && !parsed.edges.some((e) => e.id === selectedEdgeId)) {
      selectedEdgeId = null;
    }
  });

  const pathResult = $derived.by(() => {
    if (!selectedStartId || !selectedEndId) return null;
    return findShortestPath(parsed, selectedStartId, selectedEndId, respectDirection);
  });

  const highlightedNodeIds = $derived.by(() => {
    const set = new Set<string>();
    if (selectedEndId && selectedStartId) {
      if (pathResult) {
        for (const id of pathResult.nodeIds) set.add(id);
      } else {
        set.add(selectedStartId);
        set.add(selectedEndId);
      }
      return set;
    }
    if (selectedStartId) {
      set.add(selectedStartId);
      for (const e of parsed.edges) {
        if (e.source === selectedStartId) set.add(e.target);
        else if (e.target === selectedStartId) set.add(e.source);
      }
      return set;
    }
    if (selectedEdgeId) {
      const edge = parsed.edges.find((e) => e.id === selectedEdgeId);
      if (edge) {
        set.add(edge.source);
        set.add(edge.target);
      }
    }
    return set;
  });

  const highlightedEdgeIds = $derived.by(() => {
    const set = new Set<string>();
    if (selectedEndId && selectedStartId) {
      if (pathResult) {
        for (const id of pathResult.edgeIds) set.add(id);
      }
      return set;
    }
    if (selectedStartId) {
      for (const e of parsed.edges) {
        if (e.source === selectedStartId || e.target === selectedStartId) set.add(e.id);
      }
      return set;
    }
    if (selectedEdgeId) {
      set.add(selectedEdgeId);
    }
    return set;
  });

  const hasSelection = $derived(
    selectedStartId !== null || selectedEndId !== null || selectedEdgeId !== null
  );

  function clearSelection() {
    selectedStartId = null;
    selectedEndId = null;
    selectedEdgeId = null;
  }

  function handleNodeTap(nodeId: string) {
    settings.vibrate(18);
    selectedEdgeId = null;

    if (selectedStartId === null) {
      selectedStartId = nodeId;
      selectedEndId = null;
      return;
    }

    if (selectedEndId === null) {
      if (selectedStartId === nodeId) {
        selectedStartId = null;
      } else {
        selectedEndId = nodeId;
      }
      return;
    }

    // Path was active: tapping one of the endpoints clears; tapping a new node starts fresh from it
    if (selectedEndId === nodeId || selectedStartId === nodeId) {
      clearSelection();
    } else {
      selectedStartId = nodeId;
      selectedEndId = null;
    }
  }

  function handleEdgeTap(edgeId: string) {
    settings.vibrate(15);
    if (selectedEdgeId === edgeId) {
      selectedEdgeId = null;
    } else {
      selectedStartId = null;
      selectedEndId = null;
      selectedEdgeId = edgeId;
    }
  }

  function handleNodeDrag(nodeId: string, x: number, y: number) {
    pinnedPositions = { ...activePinned, [nodeId]: { x, y } };
  }

  function handleBackgroundTap() {
    if (hasSelection) {
      settings.vibrate(12);
      clearSelection();
    }
  }

  function handleRelayoutAndFit() {
    const hadPins = pinnedNodeIds.size > 0;
    if (hadPins) {
      pinnedPositions = {};
    }
    autoLayout = computeGraphLayout(parsed.nodes, parsed.edges, layoutMode);
    requestAnimationFrame(() => {
      canvasRef?.resetView(true);
    });
    if (hadPins) {
      toast.show('Uzly srovnány');
    }
  }

  function handleLayoutChange(mode: GraphLayoutMode) {
    layoutMode = mode;
    pinnedPositions = {};
    requestAnimationFrame(() => {
      canvasRef?.resetView(false);
    });
  }

  function handleReset() {
    podkladText = '';
    layoutMode = 'auto';
    respectDirection = true;
    showEdgeLabels = true;
    pinnedPositions = {};
    clearSelection();
  }

  function formatStepCount(steps: number): string {
    if (steps === 1) return '1 krok';
    if (steps >= 2 && steps <= 4) return `${steps} kroky`;
    return `${steps} kroků`;
  }

  const bar = $derived.by<ModuleBarConfig>(() => {
    let status = `${parsed.nodes.length} uzlů · ${parsed.edges.length} hran`;
    if (components.length > 1) {
      status += ` · ${components.length} částí`;
    }

    if (selectedStartId && selectedEndId) {
      if (pathResult) {
        const steps = pathResult.edgeIds.length;
        status = `Cesta ${selectedStartId} → ${selectedEndId}: ${formatStepCount(steps)}`;
        if (pathResult.usedUndirectedFallback) {
          status += ' (proti šipce)';
        }
      } else {
        status = `Mezi ${selectedStartId} a ${selectedEndId} nevede cesta`;
      }
    } else if (selectedStartId) {
      const node = parsed.nodes.find((n) => n.id === selectedStartId);
      if (node) {
        status = parsed.hasDirectedEdges
          ? `${node.label} · st. ${node.degree} (←${node.inDegree} →${node.outDegree})`
          : `${node.label} · stupeň ${node.degree}`;
      }
    } else if (selectedEdgeId) {
      const edge = parsed.edges.find((e) => e.id === selectedEdgeId);
      if (edge) {
        const arrow = edge.directed ? '→' : '—';
        status = `${edge.source} ${arrow} ${edge.target}${edge.label ? ` : ${edge.label}` : ''}`;
      }
    }

    const actions =
      parsed.nodes.length > 0
        ? [
            {
              label: 'Srovnat',
              icon: Crosshair,
              ariaLabel: 'Srovnat rozložení a vycentrovat graf',
              onClick: handleRelayoutAndFit
            }
          ]
        : [];

    const firstBad = parsed.invalidLines[0];
    return {
      empty: parsed.rawLinesCount === 0,
      hint: 'Zadejte spojnice v Podkladu.',
      warning:
        parsed.invalidLines.length > 0
          ? `Neplatné řádky (${parsed.invalidLines.length}): ř. ${firstBad.lineNumber}`
          : null,
      status,
      actions
    };
  });
</script>

<ModuleShell
  hasWarning={!respectDirection || !showEdgeLabels}
  onReset={handleReset}
  podklad={{
    kind: 'text',
    required: true,
    empty: parsed.rawLinesCount === 0,
    title: 'Vazby grafu',
    description:
      'Zadejte spojnice po řádcích, graf se sám zpřehlední. Popisky a řetězce najdete v nápovědě (ikona knihy).',
    placeholder: 'A-B\nA->B',
    format: 'Jeden řádek = jedna vazba.',
    attention:
      parsed.invalidLines.length > 0
        ? `Neplatné řádky: ${parsed.invalidLines.map((l) => `ř. ${l.lineNumber} (${l.reason})`).slice(0, 3).join(', ')}`
        : null,
    value: podkladText,
    onSave: (val) => {
      podkladText = val;
    }
  }}
  {bar}
>
  {#snippet menuOptions()}
    <MenuGroup title="Cesta a zobrazení">
      <OptionRow
        label="Respektovat směr šipek"
        hint="Hledání cesty mezi dvěma uzly sleduje orientované hrany"
        type="switch"
        checked={respectDirection}
        isNonStandard={!respectDirection}
        onChange={(checked) => {
          respectDirection = checked;
        }}
      />
      <OptionRow
        label="Popisky hran"
        hint="Zobrazit textové štítky u popsaných spojnic"
        type="switch"
        checked={showEdgeLabels}
        isNonStandard={!showEdgeLabels}
        onChange={(checked) => {
          showEdgeLabels = checked;
        }}
      />
    </MenuGroup>
  {/snippet}

  {#snippet reference()}
    <GraphReference />
  {/snippet}

  {#snippet output()}
    <GraphCanvas
      bind:this={canvasRef}
      nodes={parsed.nodes}
      edges={parsed.edges}
      positions={effectivePositions}
      contentWidth={autoLayout.width}
      contentHeight={autoLayout.height}
      {pinnedNodeIds}
      {selectedStartId}
      {selectedEndId}
      {selectedEdgeId}
      {highlightedNodeIds}
      {highlightedEdgeIds}
      usedUndirectedFallback={pathResult?.usedUndirectedFallback ?? false}
      {showEdgeLabels}
      onNodeTap={handleNodeTap}
      onEdgeTap={handleEdgeTap}
      onNodeDrag={handleNodeDrag}
      onBackgroundTap={handleBackgroundTap}
    />
  {/snippet}

  {#snippet variants()}
    <SegmentedControl
      options={LAYOUT_OPTIONS}
      value={layoutMode}
      size="sm"
      ariaLabel="Rozložení grafu"
      onChange={handleLayoutChange}
    />
  {/snippet}

  {#snippet input()}
    <div class="graph-controls">
      <Chassis columns={3} keyHeight="var(--control-min-height)">
        <Keycap
          size="s"
          disabled={parsed.nodes.length === 0}
          ariaLabel="Oddálit graf"
          title="Oddálit"
          onPress={() => canvasRef?.zoomOut()}
        >
          <MagnifyingGlassMinus size={18} weight="bold" />
        </Keycap>

        {#if hasSelection}
          <Keycap
            size="s"
            ariaLabel="Zrušit výběr uzlu nebo cesty"
            title="Zrušit výběr"
            onPress={clearSelection}
          >
            <span class="center-key-label">
              <X size={15} weight="bold" />
              <span>Zrušit výběr</span>
            </span>
          </Keycap>
        {:else}
          <Keycap
            size="s"
            disabled={parsed.nodes.length === 0}
            ariaLabel="Vycentrovat celý graf"
            title="Celý graf"
            onPress={() => canvasRef?.resetView(true)}
          >
            <span class="center-key-label">
              <CornersOut size={15} weight="bold" />
              <span>Celý graf</span>
            </span>
          </Keycap>
        {/if}

        <Keycap
          size="s"
          disabled={parsed.nodes.length === 0}
          ariaLabel="Přiblížit graf"
          title="Přiblížit"
          onPress={() => canvasRef?.zoomIn()}
        >
          <MagnifyingGlassPlus size={18} weight="bold" />
        </Keycap>
      </Chassis>
    </div>
  {/snippet}
</ModuleShell>

<style>
  .graph-controls {
    width: 100%;
    max-width: var(--max-width-chassis);
    margin: 0 auto;
    box-sizing: border-box;
  }

  .center-key-label {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    font-size: var(--text-xs);
    font-weight: 700;
    letter-spacing: 0.02em;
    white-space: nowrap;
  }
</style>
