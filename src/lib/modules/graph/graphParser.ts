export type GraphLayoutMode = 'auto' | 'layers' | 'circle';

export interface GraphNode {
  id: string;
  label: string;
  width: number;
  height: number;
  degree: number;
  inDegree: number;
  outDegree: number;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  directed: boolean;
  label?: string;
  lineNumber: number;
}

export interface GraphInvalidLine {
  lineNumber: number;
  text: string;
  reason: string;
}

export interface ParsedGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
  invalidLines: GraphInvalidLine[];
  rawLinesCount: number;
  hasDirectedEdges: boolean;
}

export interface GraphPathResult {
  nodeIds: string[];
  edgeIds: string[];
  usedUndirectedFallback: boolean;
}

interface ParsedOp {
  directed: boolean;
  reverse: boolean;
  label?: string;
}

interface LineScanResult {
  ok: true;
  nodes: string[];
  ops: ParsedOp[];
}

interface LineScanError {
  ok: false;
  reason: string;
}

function normalizeLabel(raw: string): string {
  return raw.trim().replace(/\s+/g, ' ');
}

export function measureNodeSize(label: string): { width: number; height: number } {
  const len = [...label].length;
  if (len <= 2) {
    return { width: 34, height: 34 };
  }
  const width = Math.max(44, Math.min(196, Math.round(len * 8.4 + 22)));
  return { width, height: 32 };
}

/**
 * Scans a single non-empty Podklad line into alternating node strings and edge operators.
 * Supported operators:
 *   - `A-B`, `A->B`, `A<-B`
 *   - `A-(popisek)-B`, `A-(popisek)->B`, `A<-(popisek)-B`
 *   - `A-B: popisek`, `A->B: popisek`, `A<-B: popisek`
 *   - chains: `A-B-C`, `A->B->C->A`
 *   - isolated node: `A`
 */
function scanGraphLine(line: string): LineScanResult | LineScanError {
  const nodesRaw: string[] = [];
  const ops: ParsedOp[] = [];
  let segStart = 0;
  let i = 0;

  while (i < line.length) {
    const ch = line[i];

    // Check `<-` or `<-(label)-`
    if (ch === '<' && line[i + 1] === '-') {
      nodesRaw.push(line.slice(segStart, i));
      if (line[i + 2] === '(') {
        const closeIdx = line.indexOf(')-', i + 3);
        if (closeIdx === -1) {
          return { ok: false, reason: 'Neuzavřený popisek hrany <(...)−' };
        }
        const label = normalizeLabel(line.slice(i + 3, closeIdx));
        if (!label) {
          return { ok: false, reason: 'Prázdný popisek v závorce' };
        }
        ops.push({ directed: true, reverse: true, label });
        i = closeIdx + 2;
        segStart = i;
        continue;
      }
      ops.push({ directed: true, reverse: true });
      i += 2;
      segStart = i;
      continue;
    }

    // Check `-(label)->`, `-(label)-`, `->`, `-`
    if (ch === '-') {
      nodesRaw.push(line.slice(segStart, i));
      if (line[i + 1] === '(') {
        const closeArrowIdx = line.indexOf(')->', i + 2);
        const closeDashIdx = line.indexOf(')-', i + 2);
        const isArrow =
          closeArrowIdx !== -1 && (closeDashIdx === -1 || closeArrowIdx <= closeDashIdx);

        if (isArrow) {
          const label = normalizeLabel(line.slice(i + 2, closeArrowIdx));
          if (!label) {
            return { ok: false, reason: 'Prázdný popisek v závorce' };
          }
          ops.push({ directed: true, reverse: false, label });
          i = closeArrowIdx + 3;
          segStart = i;
          continue;
        }

        if (closeDashIdx !== -1) {
          const label = normalizeLabel(line.slice(i + 2, closeDashIdx));
          if (!label) {
            return { ok: false, reason: 'Prázdný popisek v závorce' };
          }
          ops.push({ directed: false, reverse: false, label });
          i = closeDashIdx + 2;
          segStart = i;
          continue;
        }

        return { ok: false, reason: 'Neuzavřený popisek hrany -(...)−' };
      }

      if (line[i + 1] === '>') {
        ops.push({ directed: true, reverse: false });
        i += 2;
        segStart = i;
        continue;
      }

      ops.push({ directed: false, reverse: false });
      i += 1;
      segStart = i;
      continue;
    }

    i += 1;
  }

  nodesRaw.push(line.slice(segStart));

  // Optional trailing `: label` shorthand on single-edge lines (e.g. `A -> B : 3`)
  if (ops.length === 1) {
    const lastSeg = nodesRaw[nodesRaw.length - 1];
    const colonIdx = lastSeg.indexOf(':');
    if (colonIdx !== -1) {
      if (ops[0].label) {
        return { ok: false, reason: 'Dvojí popisek jedné hrany' };
      }
      const targetPart = lastSeg.slice(0, colonIdx);
      const edgeLabel = normalizeLabel(lastSeg.slice(colonIdx + 1));
      if (!edgeLabel) {
        return { ok: false, reason: 'Prázdný popisek za dvojtečkou' };
      }
      nodesRaw[nodesRaw.length - 1] = targetPart;
      ops[0].label = edgeLabel;
    }
  }

  const nodes = nodesRaw.map(normalizeLabel);
  for (let idx = 0; idx < nodes.length; idx++) {
    const n = nodes[idx];
    if (!n) {
      return { ok: false, reason: 'Chybějící název uzlu u spojnice' };
    }
    if (n.includes('<') || n.includes('>')) {
      return { ok: false, reason: 'Neplatný znak směru v názvu uzlu' };
    }
  }

  return { ok: true, nodes, ops };
}

export function parseGraphPodklad(text: string): ParsedGraph {
  const rawLines = text.split(/\r?\n/);
  const nodeMap = new Map<string, GraphNode>();
  const edges: GraphEdge[] = [];
  const invalidLines: GraphInvalidLine[] = [];
  let rawLinesCount = 0;

  const ensureNode = (label: string): GraphNode => {
    const existing = nodeMap.get(label);
    if (existing) return existing;
    const size = measureNodeSize(label);
    const created: GraphNode = {
      id: label,
      label,
      width: size.width,
      height: size.height,
      degree: 0,
      inDegree: 0,
      outDegree: 0
    };
    nodeMap.set(label, created);
    return created;
  };

  for (let idx = 0; idx < rawLines.length; idx++) {
    const trimmed = rawLines[idx].trim();
    if (!trimmed) continue;
    rawLinesCount++;

    const scanned = scanGraphLine(trimmed);
    if (!scanned.ok) {
      invalidLines.push({
        lineNumber: idx + 1,
        text: trimmed,
        reason: scanned.reason
      });
      continue;
    }

    if (scanned.ops.length === 0) {
      ensureNode(scanned.nodes[0]);
      continue;
    }

    for (let eIdx = 0; eIdx < scanned.ops.length; eIdx++) {
      const op = scanned.ops[eIdx];
      const left = scanned.nodes[eIdx];
      const right = scanned.nodes[eIdx + 1];
      const source = op.reverse ? right : left;
      const target = op.reverse ? left : right;

      const srcNode = ensureNode(source);
      const tgtNode = ensureNode(target);

      srcNode.degree++;
      tgtNode.degree++;
      if (op.directed) {
        srcNode.outDegree++;
        tgtNode.inDegree++;
      }

      edges.push({
        id: `e${edges.length}`,
        source,
        target,
        directed: op.directed,
        label: op.label,
        lineNumber: idx + 1
      });
    }
  }

  const nodes = Array.from(nodeMap.values());
  const hasDirectedEdges = edges.some((e) => e.directed);

  return {
    nodes,
    edges,
    invalidLines,
    rawLinesCount,
    hasDirectedEdges
  };
}

export function findConnectedComponents(nodes: GraphNode[], edges: GraphEdge[]): string[][] {
  const adj = new Map<string, string[]>();
  for (const n of nodes) adj.set(n.id, []);
  for (const e of edges) {
    adj.get(e.source)?.push(e.target);
    adj.get(e.target)?.push(e.source);
  }

  const visited = new Set<string>();
  const components: string[][] = [];

  for (const n of nodes) {
    if (visited.has(n.id)) continue;
    const comp: string[] = [];
    const queue: string[] = [n.id];
    visited.add(n.id);
    for (let qi = 0; qi < queue.length; qi++) {
      const cur = queue[qi];
      comp.push(cur);
      const neighbors = adj.get(cur) ?? [];
      for (const nb of neighbors) {
        if (!visited.has(nb)) {
          visited.add(nb);
          queue.push(nb);
        }
      }
    }
    components.push(comp);
  }

  // Largest components first; stable tie-breaker preserves order of appearance
  components.sort((a, b) => b.length - a.length);
  return components;
}

function bfsPath(
  edges: GraphEdge[],
  startId: string,
  endId: string,
  followDirections: boolean
): { nodeIds: string[]; edgeIds: string[] } | null {
  if (startId === endId) {
    return { nodeIds: [startId], edgeIds: [] };
  }

  const adj = new Map<string, { to: string; edgeId: string }[]>();
  const pushAdj = (from: string, to: string, edgeId: string) => {
    let list = adj.get(from);
    if (!list) {
      list = [];
      adj.set(from, list);
    }
    list.push({ to, edgeId });
  };

  for (const e of edges) {
    if (followDirections && e.directed) {
      pushAdj(e.source, e.target, e.id);
    } else {
      pushAdj(e.source, e.target, e.id);
      if (e.source !== e.target) {
        pushAdj(e.target, e.source, e.id);
      }
    }
  }

  const prev = new Map<string, { nodeId: string; edgeId: string }>();
  const visited = new Set<string>([startId]);
  const queue: string[] = [startId];

  for (let qi = 0; qi < queue.length; qi++) {
    const cur = queue[qi];
    const neighbors = adj.get(cur) ?? [];
    for (const { to, edgeId } of neighbors) {
      if (visited.has(to)) continue;
      visited.add(to);
      prev.set(to, { nodeId: cur, edgeId });
      if (to === endId) {
        const nodeIds: string[] = [endId];
        const edgeIds: string[] = [];
        let trace = endId;
        while (trace !== startId) {
          const step = prev.get(trace)!;
          edgeIds.push(step.edgeId);
          nodeIds.push(step.nodeId);
          trace = step.nodeId;
        }
        nodeIds.reverse();
        edgeIds.reverse();
        return { nodeIds, edgeIds };
      }
      queue.push(to);
    }
  }

  return null;
}

export function findShortestPath(
  graph: ParsedGraph,
  startId: string,
  endId: string,
  respectDirection: boolean
): GraphPathResult | null {
  if (respectDirection && graph.hasDirectedEdges) {
    const directed = bfsPath(graph.edges, startId, endId, true);
    if (directed) {
      return { ...directed, usedUndirectedFallback: false };
    }
    const undirected = bfsPath(graph.edges, startId, endId, false);
    if (undirected) {
      return { ...undirected, usedUndirectedFallback: true };
    }
    return null;
  }

  const undirected = bfsPath(graph.edges, startId, endId, false);
  if (!undirected) return null;
  return { ...undirected, usedUndirectedFallback: false };
}
