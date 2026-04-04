import type { NodeData, EdgeData } from "./graph-types";
import Graph from "graphology";

export function toGraphologyNodeAttrs(node: NodeData): Record<string, unknown> {
  return {
    x: node.x,
    y: node.y,
    size: node.size,
    label: node.label,
    color: node.color,
  };
}

export function toGraphologyEdgeAttrs(edge: EdgeData): Record<string, unknown> {
  const size = Math.max(0.1, Math.min(edge.size || 0.5, 2));
  return {
    size: size,
    weight: edge.weight,
  };
}

export function createGraphologyGraph(data: { nodes: NodeData[]; edges: EdgeData[] }): Graph {
  const graph = new Graph();

  data.nodes.forEach((node) => {
    graph.addNode(node.id, toGraphologyNodeAttrs(node));
  });

  data.edges.forEach((edge) => {
    graph.addEdge(edge.source, edge.target, toGraphologyEdgeAttrs(edge));
  });

  return graph;
}

export const GRAPHOLOGY_NODE_ATTRS = {
  X: "x",
  Y: "y",
  SIZE: "size",
  LABEL: "label",
  COLOR: "color",
} as const;

export const GRAPHOLOGY_EDGE_ATTRS = {
  SIZE: "size",
  WEIGHT: "weight",
  COLOR: "color",
} as const;
