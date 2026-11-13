import {
  findConnectedComponents,
  type GraphEdge,
  type GraphLayoutMode,
  type GraphNode
} from './graphParser';

export interface NodePosition {
  x: number;
  y: number;
}

export interface GraphLayoutResult {
  positions: Record<string, NodePosition>;
  width: number;
  height: number;
}

interface SimpleEdge {
  a: number;
  b: number;
}

interface LocalLayout {
  nodes: GraphNode[];
  coords: NodePosition[];
  width: number;
  height: number;
}

function buildSimpleGraph(
  compNodes: GraphNode[],
  compEdges: GraphEdge[]
): { simpleEdges: SimpleEdge[]; adj: number[][] } {
  const indexById = new Map<string, number>();
  compNodes.forEach((n, idx) => indexById.set(n.id, idx));

  const seen = new Set<string>();
  const simpleEdges: SimpleEdge[] = [];
  const adj: number[][] = Array.from({ length: compNodes.length }, () => []);

  for (const e of compEdges) {
    const u = indexById.get(e.source);
    const v = indexById.get(e.target);
    if (u === undefined || v === undefined || u === v) continue;
    const lo = Math.min(u, v);
    const hi = Math.max(u, v);
    const key = `${lo}|${hi}`;
    if (seen.has(key)) continue;
    seen.add(key);
    simpleEdges.push({ a: lo, b: hi });
    adj[lo].push(hi);
    adj[hi].push(lo);
  }

  return { simpleEdges, adj };
}

function normalizeCoords(
  nodes: GraphNode[],
  coords: NodePosition[],
  edgePadding = 20
): LocalLayout {
  if (nodes.length === 0) {
    return { nodes, coords: [], width: 120, height: 120 };
  }

  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;

  for (let i = 0; i < nodes.length; i++) {
    const hw = nodes[i].width / 2;
    const hh = nodes[i].height / 2;
    minX = Math.min(minX, coords[i].x - hw);
    maxX = Math.max(maxX, coords[i].x + hw);
    minY = Math.min(minY, coords[i].y - hh);
    maxY = Math.max(maxY, coords[i].y + hh);
  }

  const shifted = coords.map((p) => ({
    x: Math.round((p.x - minX + edgePadding) * 10) / 10,
    y: Math.round((p.y - minY + edgePadding) * 10) / 10
  }));

  return {
    nodes,
    coords: shifted,
    width: Math.max(80, Math.ceil(maxX - minX + edgePadding * 2)),
    height: Math.max(80, Math.ceil(maxY - minY + edgePadding * 2))
  };
}

function separateOverlaps(nodes: GraphNode[], coords: NodePosition[], gap = 18, passes = 24) {
  const n = nodes.length;
  for (let pass = 0; pass < passes; pass++) {
    let moved = false;
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const dx = coords[j].x - coords[i].x;
        const dy = coords[j].y - coords[i].y;
        const reqX = (nodes[i].width + nodes[j].width) / 2 + gap;
        const reqY = (nodes[i].height + nodes[j].height) / 2 + gap;

        const overlapX = reqX - Math.abs(dx);
        const overlapY = reqY - Math.abs(dy);
        if (overlapX > 0 && overlapY > 0) {
          moved = true;
          if (overlapX < overlapY) {
            const sign = dx === 0 ? (i % 2 === 0 ? 1 : -1) : Math.sign(dx);
            const push = overlapX / 2 + 0.5;
            coords[i].x -= sign * push;
            coords[j].x += sign * push;
          } else {
            const sign = dy === 0 ? (i % 2 === 0 ? 1 : -1) : Math.sign(dy);
            const push = overlapY / 2 + 0.5;
            coords[i].y -= sign * push;
            coords[j].y += sign * push;
          }
        }
      }
    }
    if (!moved) break;
  }
}

function segmentsIntersect(
  ax: number,
  ay: number,
  bx: number,
  by: number,
  cx: number,
  cy: number,
  dx: number,
  dy: number
): boolean {
  const d1 = (dx - cx) * (ay - cy) - (dy - cy) * (ax - cx);
  const d2 = (dx - cx) * (by - cy) - (dy - cy) * (bx - cx);
  if ((d1 > 0 && d2 > 0) || (d1 < 0 && d2 < 0)) return false;

  const d3 = (bx - ax) * (cy - ay) - (by - ay) * (cx - ax);
  const d4 = (bx - ax) * (dy - ay) - (by - ay) * (dx - ax);
  if ((d3 > 0 && d4 > 0) || (d3 < 0 && d4 < 0)) return false;

  if (d1 === 0 && d2 === 0 && d3 === 0 && d4 === 0) return false;
  return true;
}

function countCrossings(coords: NodePosition[], edges: SimpleEdge[]): number {
  let count = 0;
  for (let i = 0; i < edges.length; i++) {
    const e1 = edges[i];
    const p1 = coords[e1.a];
    const p2 = coords[e1.b];
    for (let j = i + 1; j < edges.length; j++) {
      const e2 = edges[j];
      if (e1.a === e2.a || e1.a === e2.b || e1.b === e2.a || e1.b === e2.b) continue;
      const p3 = coords[e2.a];
      const p4 = coords[e2.b];
      if (segmentsIntersect(p1.x, p1.y, p2.x, p2.y, p3.x, p3.y, p4.x, p4.y)) {
        count++;
      }
    }
  }
  return count;
}

function edgeLengthEnergy(coords: NodePosition[], edges: SimpleEdge[]): number {
  let total = 0;
  for (const e of edges) {
    total += Math.hypot(coords[e.a].x - coords[e.b].x, coords[e.a].y - coords[e.b].y);
  }
  return total;
}

function untangleBySwaps(nodes: GraphNode[], coords: NodePosition[], edges: SimpleEdge[]) {
  if (nodes.length < 4 || nodes.length > 52 || edges.length < 2) return;

  let currentCrossings = countCrossings(coords, edges);
  if (currentCrossings === 0) return;

  let currentEnergy = edgeLengthEnergy(coords, edges);
  const maxPasses = 4;

  for (let pass = 0; pass < maxPasses && currentCrossings > 0; pass++) {
    let improved = false;

    // Prioritize nodes involved in crossing edges
    const hot = new Set<number>();
    for (let i = 0; i < edges.length; i++) {
      const e1 = edges[i];
      for (let j = i + 1; j < edges.length; j++) {
        const e2 = edges[j];
        if (e1.a === e2.a || e1.a === e2.b || e1.b === e2.a || e1.b === e2.b) continue;
        if (
          segmentsIntersect(
            coords[e1.a].x,
            coords[e1.a].y,
            coords[e1.b].x,
            coords[e1.b].y,
            coords[e2.a].x,
            coords[e2.a].y,
            coords[e2.b].x,
            coords[e2.b].y
          )
        ) {
          hot.add(e1.a);
          hot.add(e1.b);
          hot.add(e2.a);
          hot.add(e2.b);
        }
      }
    }

    const candidates = Array.from(hot);
    for (let ci = 0; ci < candidates.length; ci++) {
      const u = candidates[ci];
      for (let v = 0; v < nodes.length; v++) {
        if (u === v) continue;
        const tmp = coords[u];
        coords[u] = coords[v];
        coords[v] = tmp;

        const nextCrossings = countCrossings(coords, edges);
        const nextEnergy = edgeLengthEnergy(coords, edges);
        if (
          nextCrossings < currentCrossings ||
          (nextCrossings === currentCrossings && nextEnergy < currentEnergy - 8)
        ) {
          currentCrossings = nextCrossings;
          currentEnergy = nextEnergy;
          improved = true;
          if (currentCrossings === 0) break;
        } else {
          // Revert
          coords[v] = coords[u];
          coords[u] = tmp;
        }
      }
      if (currentCrossings === 0) break;
    }

    if (!improved) break;
  }
}

function layoutCycle(nodes: GraphNode[], adj: number[][]): LocalLayout | null {
  const n = nodes.length;
  if (n < 3) return null;
  if (!adj.every((list) => list.length === 2)) return null;

  const order: number[] = [0];
  const visited = new Set<number>([0]);
  let cur = adj[0][0];
  while (!visited.has(cur)) {
    order.push(cur);
    visited.add(cur);
    const next = adj[cur].find((nb) => !visited.has(nb));
    if (next === undefined) break;
    cur = next;
  }
  if (order.length !== n) return null;

  const perimeter = order.reduce((sum, idx) => sum + Math.max(nodes[idx].width, 40) + 34, 0);
  const radius = Math.max(66, perimeter / (2 * Math.PI));

  const coords: NodePosition[] = Array.from({ length: n }, () => ({ x: 0, y: 0 }));
  for (let k = 0; k < n; k++) {
    const angle = -Math.PI / 2 + (2 * Math.PI * k) / n;
    coords[order[k]] = {
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius
    };
  }
  separateOverlaps(nodes, coords, 16, 12);
  return normalizeCoords(nodes, coords);
}

function pickDirectionalStart(nodes: GraphNode[], endpoints: number[], edges: GraphEdge[]): number {
  const inCount = new Map<string, number>();
  for (const e of edges) {
    if (e.directed) {
      inCount.set(e.target, (inCount.get(e.target) ?? 0) + 1);
    }
  }
  for (const idx of endpoints) {
    if ((inCount.get(nodes[idx].id) ?? 0) === 0) return idx;
  }
  return endpoints[0];
}

function layoutPath(
  nodes: GraphNode[],
  edges: GraphEdge[],
  adj: number[][],
  simpleEdges: SimpleEdge[]
): LocalLayout | null {
  const n = nodes.length;
  if (n === 1) {
    return normalizeCoords(nodes, [{ x: 0, y: 0 }]);
  }
  if (simpleEdges.length !== n - 1) return null;
  const endpoints: number[] = [];
  for (let i = 0; i < n; i++) {
    if (adj[i].length === 1) endpoints.push(i);
    else if (adj[i].length !== 2) return null;
  }
  if (endpoints.length !== 2) return null;

  const start = pickDirectionalStart(nodes, endpoints, edges);
  const order: number[] = [start];
  const visited = new Set<number>([start]);
  let cur = start;
  while (order.length < n) {
    const next = adj[cur].find((nb) => !visited.has(nb));
    if (next === undefined) break;
    visited.add(next);
    order.push(next);
    cur = next;
  }

  const coords: NodePosition[] = Array.from({ length: n }, () => ({ x: 0, y: 0 }));
  const cols = n <= 5 ? n : Math.min(5, Math.ceil(Math.sqrt(n * 1.35)));
  const maxW = Math.max(...nodes.map((nd) => nd.width));
  const stepX = maxW + 46;
  const stepY = 74;

  for (let k = 0; k < order.length; k++) {
    const row = Math.floor(k / cols);
    const colRaw = k % cols;
    const col = row % 2 === 0 ? colRaw : cols - 1 - colRaw;
    coords[order[k]] = {
      x: col * stepX,
      y: row * stepY
    };
  }

  return normalizeCoords(nodes, coords);
}

function layoutTree(
  nodes: GraphNode[],
  edges: GraphEdge[],
  adj: number[][],
  simpleEdges: SimpleEdge[]
): LocalLayout | null {
  const n = nodes.length;
  if (simpleEdges.length !== n - 1 || n < 3) return null;

  // Prefer directed root (inDegree === 0), else graph center by leaf peeling
  let root = -1;
  const directedSources = nodes
    .map((nd, idx) => ({ nd, idx }))
    .filter(({ nd }) => nd.inDegree === 0 && nd.outDegree > 0);
  if (directedSources.length === 1) {
    root = directedSources[0].idx;
  } else {
    const deg = adj.map((l) => l.length);
    const removed = new Array<boolean>(n).fill(false);
    let remaining = n;
    let leaves = deg.map((d, i) => (d <= 1 ? i : -1)).filter((i) => i !== -1);
    while (remaining > 2 && leaves.length > 0) {
      const nextLeaves: number[] = [];
      for (const leaf of leaves) {
        removed[leaf] = true;
        remaining--;
        for (const nb of adj[leaf]) {
          if (!removed[nb]) {
            deg[nb]--;
            if (deg[nb] === 1) nextLeaves.push(nb);
          }
        }
      }
      leaves = nextLeaves;
    }
    root = deg.findIndex((_, i) => !removed[i]);
    if (root < 0) root = 0;
  }

  const children: number[][] = Array.from({ length: n }, () => []);
  const visited = new Set<number>([root]);
  const queue = [root];
  for (let qi = 0; qi < queue.length; qi++) {
    const u = queue[qi];
    for (const v of adj[u]) {
      if (!visited.has(v)) {
        visited.add(v);
        children[u].push(v);
        queue.push(v);
      }
    }
  }

  const hGap = 22;
  const vGap = 62;
  const subtreeW = new Array<number>(n).fill(0);

  function computeSubtreeWidth(u: number): number {
    if (children[u].length === 0) {
      subtreeW[u] = nodes[u].width;
      return subtreeW[u];
    }
    let sum = 0;
    for (let i = 0; i < children[u].length; i++) {
      if (i > 0) sum += hGap;
      sum += computeSubtreeWidth(children[u][i]);
    }
    subtreeW[u] = Math.max(nodes[u].width, sum);
    return subtreeW[u];
  }
  computeSubtreeWidth(root);

  const coords: NodePosition[] = Array.from({ length: n }, () => ({ x: 0, y: 0 }));

  function place(u: number, centerX: number, depth: number) {
    coords[u] = { x: centerX, y: depth * vGap };
    const ch = children[u];
    if (ch.length === 0) return;

    const totalChildW = ch.reduce((s, c, idx) => s + subtreeW[c] + (idx > 0 ? hGap : 0), 0);
    let cursor = centerX - totalChildW / 2;
    for (const c of ch) {
      const w = subtreeW[c];
      place(c, cursor + w / 2, depth + 1);
      cursor += w + hGap;
    }
  }
  place(root, 0, 0);

  return normalizeCoords(nodes, coords);
}

function bfsOrder(n: number, adj: number[][], start: number): number[] {
  const order: number[] = [start];
  const seen = new Set<number>([start]);
  for (let i = 0; i < order.length; i++) {
    const u = order[i];
    for (const v of adj[u]) {
      if (!seen.has(v)) {
        seen.add(v);
        order.push(v);
      }
    }
  }
  return order;
}

function computeAllPairsDist(n: number, adj: number[][]): number[][] {
  const dist: number[][] = Array.from({ length: n }, () => new Array<number>(n).fill(n));
  for (let s = 0; s < n; s++) {
    dist[s][s] = 0;
    const queue = [s];
    for (let qi = 0; qi < queue.length; qi++) {
      const u = queue[qi];
      for (const v of adj[u]) {
        if (dist[s][v] > dist[s][u] + 1) {
          dist[s][v] = dist[s][u] + 1;
          queue.push(v);
        }
      }
    }
  }
  return dist;
}

function layoutGeneralAuto(
  nodes: GraphNode[],
  adj: number[][],
  simpleEdges: SimpleEdge[]
): LocalLayout {
  const n = nodes.length;
  let root = 0;
  for (let i = 1; i < n; i++) {
    if (adj[i].length > adj[root].length) root = i;
  }

  // Deterministic circular initialization ordered by BFS so connected vertices start near each other
  const order = bfsOrder(n, adj, root);
  const avgW = nodes.reduce((s, nd) => s + nd.width, 0) / n;
  const edgeTarget = Math.max(76, avgW + 44);
  const initRadius = Math.max(edgeTarget, (n * edgeTarget) / (2 * Math.PI));

  const coords: NodePosition[] = Array.from({ length: n }, () => ({ x: 0, y: 0 }));
  for (let k = 0; k < n; k++) {
    const angle = -Math.PI / 2 + (2 * Math.PI * k) / n;
    coords[order[k]] = {
      x: Math.cos(angle) * initRadius,
      y: Math.sin(angle) * initRadius
    };
  }

  // Stress majorization (Kamada-Kawai style) over graph-theoretic distances
  const dist = computeAllPairsDist(n, adj);
  const maxIter = n <= 30 ? 110 : 75;

  for (let iter = 0; iter < maxIter; iter++) {
    const nextCoords: NodePosition[] = Array.from({ length: n }, () => ({ x: 0, y: 0 }));
    for (let i = 0; i < n; i++) {
      let sumW = 0;
      let sumX = 0;
      let sumY = 0;

      for (let j = 0; j < n; j++) {
        if (i === j) continue;
        const gDist = dist[i][j];
        const idealDist =
          gDist * edgeTarget + ((nodes[i].width + nodes[j].width) / 2 - avgW) * 0.45;
        const w = 1 / (gDist * gDist);
        const dx = coords[i].x - coords[j].x;
        const dy = coords[i].y - coords[j].y;
        const curDist = Math.hypot(dx, dy);

        let targetX = coords[j].x;
        let targetY = coords[j].y;
        if (curDist > 1e-4) {
          targetX += (dx / curDist) * idealDist;
          targetY += (dy / curDist) * idealDist;
        } else {
          const fallbackAngle = ((i * 2.39996 + j) % (2 * Math.PI));
          targetX += Math.cos(fallbackAngle) * idealDist;
          targetY += Math.sin(fallbackAngle) * idealDist;
        }

        sumW += w;
        sumX += w * targetX;
        sumY += w * targetY;
      }

      nextCoords[i] =
        sumW > 0
          ? { x: sumX / sumW, y: sumY / sumW }
          : { x: coords[i].x, y: coords[i].y };
    }

    for (let i = 0; i < n; i++) coords[i] = nextCoords[i];
  }

  // Untangle crossing edges via bounded swaps, then enforce clean node-pill spacing
  untangleBySwaps(nodes, coords, simpleEdges);
  separateOverlaps(nodes, coords, 20, 28);

  return normalizeCoords(nodes, coords);
}

function layoutLayers(compNodes: GraphNode[], compEdges: GraphEdge[]): LocalLayout {
  const n = compNodes.length;
  if (n === 1) return normalizeCoords(compNodes, [{ x: 0, y: 0 }]);

  const indexById = new Map<string, number>();
  compNodes.forEach((nd, i) => indexById.set(nd.id, i));

  // Build DAG edges (break cycles greedily using node degree heuristic)
  const outAdj: number[][] = Array.from({ length: n }, () => []);
  const inAdj: number[][] = Array.from({ length: n }, () => []);
  const hasDirected = compEdges.some((e) => e.directed);

  if (hasDirected) {
    for (const e of compEdges) {
      const u = indexById.get(e.source)!;
      const v = indexById.get(e.target)!;
      if (u === v) continue;
      if (e.directed) {
        if (!outAdj[u].includes(v)) {
          outAdj[u].push(v);
          inAdj[v].push(u);
        }
      } else {
        // Orient undirected edge deterministically by first-seen order
        const lo = Math.min(u, v);
        const hi = Math.max(u, v);
        if (!outAdj[lo].includes(hi)) {
          outAdj[lo].push(hi);
          inAdj[hi].push(lo);
        }
      }
    }
  } else {
    // Undirected graph: orient along BFS levels from highest-degree root
    const { adj } = buildSimpleGraph(compNodes, compEdges);
    let root = 0;
    for (let i = 1; i < n; i++) {
      if (adj[i].length > adj[root].length) root = i;
    }
    const level = new Array<number>(n).fill(-1);
    level[root] = 0;
    const queue = [root];
    for (let qi = 0; qi < queue.length; qi++) {
      const u = queue[qi];
      for (const v of adj[u]) {
        if (level[v] === -1) {
          level[v] = level[u] + 1;
          queue.push(v);
        }
        if (level[u] < level[v] || (level[u] === level[v] && u < v)) {
          if (!outAdj[u].includes(v)) {
            outAdj[u].push(v);
            inAdj[v].push(u);
          }
        }
      }
    }
  }

  // Greedy feedback-arc break for any remaining directed cycles (DFS colors)
  const dagOut: number[][] = Array.from({ length: n }, () => []);
  const dagIn: number[][] = Array.from({ length: n }, () => []);
  const color = new Array<number>(n).fill(0); // 0 unvisited, 1 active, 2 done

  function dfsBreak(u: number) {
    color[u] = 1;
    for (const v of outAdj[u]) {
      if (color[v] === 1) {
        // Reverse cycle edge in layering view
        if (!dagOut[v].includes(u)) {
          dagOut[v].push(u);
          dagIn[u].push(v);
        }
      } else {
        if (!dagOut[u].includes(v)) {
          dagOut[u].push(v);
          dagIn[v].push(u);
        }
        if (color[v] === 0) dfsBreak(v);
      }
    }
    color[u] = 2;
  }

  // Start DFS from natural sources (`inAdj[i].length === 0`) first
  const sourcesFirst = Array.from({ length: n }, (_, i) => i).sort(
    (a, b) => inAdj[a].length - inAdj[b].length
  );
  for (const s of sourcesFirst) {
    if (color[s] === 0) dfsBreak(s);
  }

  // Topological longest-path layer assignment
  const inDeg = dagIn.map((l) => l.length);
  const layerOf = new Array<number>(n).fill(0);
  const topoQueue: number[] = [];
  for (let i = 0; i < n; i++) {
    if (inDeg[i] === 0) topoQueue.push(i);
  }

  for (let qi = 0; qi < topoQueue.length; qi++) {
    const u = topoQueue[qi];
    for (const v of dagOut[u]) {
      layerOf[v] = Math.max(layerOf[v], layerOf[u] + 1);
      inDeg[v]--;
      if (inDeg[v] === 0) topoQueue.push(v);
    }
  }

  const maxLayer = Math.max(0, ...layerOf);
  const layers: number[][] = Array.from({ length: maxLayer + 1 }, () => []);
  for (let i = 0; i < n; i++) layers[layerOf[i]].push(i);

  // Barycenter crossing reduction (down-sweep + up-sweep)
  const posInLayer = new Array<number>(n).fill(0);
  const syncPositions = () => {
    for (const row of layers) {
      row.forEach((id, idx) => {
        posInLayer[id] = idx;
      });
    }
  };
  syncPositions();

  for (let pass = 0; pass < 6; pass++) {
    for (let l = 1; l < layers.length; l++) {
      layers[l].sort((a, b) => {
        const pa = dagIn[a];
        const pb = dagIn[b];
        const ba = pa.length ? pa.reduce((s, p) => s + posInLayer[p], 0) / pa.length : posInLayer[a];
        const bb = pb.length ? pb.reduce((s, p) => s + posInLayer[p], 0) / pb.length : posInLayer[b];
        return ba - bb;
      });
      syncPositions();
    }
    for (let l = layers.length - 2; l >= 0; l--) {
      layers[l].sort((a, b) => {
        const ca = dagOut[a];
        const cb = dagOut[b];
        const ba = ca.length ? ca.reduce((s, c) => s + posInLayer[c], 0) / ca.length : posInLayer[a];
        const bb = cb.length ? cb.reduce((s, c) => s + posInLayer[c], 0) / cb.length : posInLayer[b];
        return ba - bb;
      });
      syncPositions();
    }
  }

  const hGap = 28;
  const vGap = 80;
  const coords: NodePosition[] = Array.from({ length: n }, () => ({ x: 0, y: 0 }));

  for (let l = 0; l < layers.length; l++) {
    const row = layers[l];
    const rowW = row.reduce((s, id, idx) => s + compNodes[id].width + (idx > 0 ? hGap : 0), 0);
    let cursor = -rowW / 2;
    for (const id of row) {
      const w = compNodes[id].width;
      coords[id] = { x: cursor + w / 2, y: l * vGap };
      cursor += w + hGap;
    }
  }

  return normalizeCoords(compNodes, coords);
}

function layoutCircle(
  compNodes: GraphNode[],
  adj: number[][],
  simpleEdges: SimpleEdge[]
): LocalLayout {
  const n = compNodes.length;
  if (n === 1) return normalizeCoords(compNodes, [{ x: 0, y: 0 }]);
  if (n === 2) {
    const gap = (compNodes[0].width + compNodes[1].width) / 2 + 56;
    return normalizeCoords(compNodes, [
      { x: -gap / 2, y: 0 },
      { x: gap / 2, y: 0 }
    ]);
  }

  // BFS seed order then 2-opt chord-crossing minimization around the circle
  let root = 0;
  for (let i = 1; i < n; i++) {
    if (adj[i].length > adj[root].length) root = i;
  }
  const order = bfsOrder(n, adj, root);

  const countCircleCrossings = (ord: number[]): number => {
    const slot = new Array<number>(n);
    ord.forEach((nodeIdx, pos) => {
      slot[nodeIdx] = pos;
    });
    let cross = 0;
    for (let i = 0; i < simpleEdges.length; i++) {
      let a1 = slot[simpleEdges[i].a];
      let b1 = slot[simpleEdges[i].b];
      if (a1 > b1) [a1, b1] = [b1, a1];
      for (let j = i + 1; j < simpleEdges.length; j++) {
        let a2 = slot[simpleEdges[j].a];
        let b2 = slot[simpleEdges[j].b];
        if (a2 > b2) [a2, b2] = [b2, a2];
        if (a1 === a2 || a1 === b2 || b1 === a2 || b1 === b2) continue;
        if ((a1 < a2 && a2 < b1 && b1 < b2) || (a2 < a1 && a1 < b2 && b2 < b1)) {
          cross++;
        }
      }
    }
    return cross;
  };

  if (n <= 64 && simpleEdges.length >= 2) {
    let bestCross = countCircleCrossings(order);
    for (let pass = 0; pass < 3 && bestCross > 0; pass++) {
      let improved = false;
      for (let i = 0; i < n; i++) {
        for (let j = i + 1; j < n; j++) {
          const tmp = order[i];
          order[i] = order[j];
          order[j] = tmp;
          const nextCross = countCircleCrossings(order);
          if (nextCross < bestCross) {
            bestCross = nextCross;
            improved = true;
          } else {
            order[j] = order[i];
            order[i] = tmp;
          }
        }
      }
      if (!improved) break;
    }
  }

  const perimeter = order.reduce((s, idx) => s + Math.max(compNodes[idx].width, 40) + 32, 0);
  const radius = Math.max(72, perimeter / (2 * Math.PI));
  const coords: NodePosition[] = Array.from({ length: n }, () => ({ x: 0, y: 0 }));

  for (let k = 0; k < n; k++) {
    const angle = -Math.PI / 2 + (2 * Math.PI * k) / n;
    coords[order[k]] = {
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius
    };
  }
  separateOverlaps(compNodes, coords, 16, 10);
  return normalizeCoords(compNodes, coords);
}

function layoutComponent(
  compNodes: GraphNode[],
  compEdges: GraphEdge[],
  mode: GraphLayoutMode
): LocalLayout {
  if (compNodes.length === 1) {
    return normalizeCoords(compNodes, [{ x: 0, y: 0 }]);
  }

  const { simpleEdges, adj } = buildSimpleGraph(compNodes, compEdges);

  if (mode === 'layers') {
    return layoutLayers(compNodes, compEdges);
  }
  if (mode === 'circle') {
    return layoutCircle(compNodes, adj, simpleEdges);
  }

  // 'auto' mode: recognize clean planar topologies first
  if (compNodes.length === 2) {
    const gap = (compNodes[0].width + compNodes[1].width) / 2 + 64;
    return normalizeCoords(compNodes, [
      { x: -gap / 2, y: 0 },
      { x: gap / 2, y: 0 }
    ]);
  }

  const cycleLayout = layoutCycle(compNodes, adj);
  if (cycleLayout) return cycleLayout;

  const pathLayout = layoutPath(compNodes, compEdges, adj, simpleEdges);
  if (pathLayout) return pathLayout;

  const treeLayout = layoutTree(compNodes, compEdges, adj, simpleEdges);
  if (treeLayout) return treeLayout;

  return layoutGeneralAuto(compNodes, adj, simpleEdges);
}

function packComponents(layouts: LocalLayout[]): GraphLayoutResult {
  if (layouts.length === 0) {
    return { positions: {}, width: 300, height: 220 };
  }

  const positions: Record<string, NodePosition> = {};
  if (layouts.length === 1) {
    const only = layouts[0];
    only.nodes.forEach((nd, i) => {
      positions[nd.id] = only.coords[i];
    });
    return { positions, width: only.width, height: only.height };
  }

  const totalArea = layouts.reduce((s, l) => s + l.width * l.height, 0);
  const maxCompW = Math.max(...layouts.map((l) => l.width));
  const targetRowW = Math.max(maxCompW, Math.round(Math.sqrt(totalArea * 2.0)));

  const gap = 20;
  const outerPad = 12;
  let cursorX = outerPad;
  let cursorY = outerPad;
  let rowH = 0;
  let totalW = 0;

  for (const comp of layouts) {
    if (cursorX > outerPad && cursorX + comp.width + outerPad > targetRowW) {
      cursorX = outerPad;
      cursorY += rowH + gap;
      rowH = 0;
    }

    comp.nodes.forEach((nd, i) => {
      positions[nd.id] = {
        x: Math.round((cursorX + comp.coords[i].x) * 10) / 10,
        y: Math.round((cursorY + comp.coords[i].y) * 10) / 10
      };
    });

    totalW = Math.max(totalW, cursorX + comp.width + outerPad);
    cursorX += comp.width + gap;
    rowH = Math.max(rowH, comp.height);
  }

  const totalH = cursorY + rowH + outerPad;
  return {
    positions,
    width: Math.max(160, Math.ceil(totalW)),
    height: Math.max(160, Math.ceil(totalH))
  };
}

export function computeGraphLayout(
  nodes: GraphNode[],
  edges: GraphEdge[],
  mode: GraphLayoutMode
): GraphLayoutResult {
  if (nodes.length === 0) {
    return { positions: {}, width: 300, height: 220 };
  }

  const nodeById = new Map<string, GraphNode>();
  for (const nd of nodes) nodeById.set(nd.id, nd);

  const compIdsList = findConnectedComponents(nodes, edges);
  const compSetList = compIdsList.map((ids) => new Set(ids));

  const compLayouts: LocalLayout[] = compIdsList.map((ids, cIdx) => {
    const compNodes = ids.map((id) => nodeById.get(id)!);
    const idSet = compSetList[cIdx];
    const compEdges = edges.filter((e) => idSet.has(e.source) && idSet.has(e.target));
    return layoutComponent(compNodes, compEdges, mode);
  });

  return packComponents(compLayouts);
}
