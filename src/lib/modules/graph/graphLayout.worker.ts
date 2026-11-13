import { computeGraphLayout, type GraphLayoutResult } from './graphLayout';
import type { GraphEdge, GraphLayoutMode, GraphNode } from './graphParser';

export interface GraphLayoutWorkerRequest {
  seq: number;
  nodes: GraphNode[];
  edges: GraphEdge[];
  mode: GraphLayoutMode;
}

export interface GraphLayoutWorkerResponse {
  seq: number;
  result: GraphLayoutResult;
}

self.onmessage = (event: MessageEvent<GraphLayoutWorkerRequest>) => {
  const { seq, nodes, edges, mode } = event.data;
  const result = computeGraphLayout(nodes, edges, mode);
  const response: GraphLayoutWorkerResponse = { seq, result };
  self.postMessage(response);
};
