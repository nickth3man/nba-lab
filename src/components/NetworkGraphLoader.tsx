"use client";

import { useEffect, useCallback, useRef, useMemo } from "react";
import { useLoadGraph, useRegisterEvents, useSigma, useSetSettings } from "@react-sigma/core";
import Graph from "graphology";
import type { NodeData, EdgeData } from "@/lib/graph-types";
import type { GraphData } from "@/lib/graph-types";
import { getEdgeLookupKey } from "./NetworkGraph.utils";
import { useDebouncedHandler, useViewportCulling, useLODManagement } from "./NetworkGraphHooks";
import { toGraphologyNodeAttrs, toGraphologyEdgeAttrs } from "@/lib/graphology-adapter";
import type { SigmaInstance } from "@/lib/performance";

export interface GraphLoaderProps {
  data: GraphData | null;
  onNodeHover?: (nodeId: string | null, nodeData?: NodeData | null) => void;
  onNodeClick?: (nodeId: string | null, nodeData?: NodeData | null) => void;
  highlightedNode?: string | null;
}

function GraphLoader({ data, onNodeHover, onNodeClick, highlightedNode }: GraphLoaderProps) {
  const loadGraph = useLoadGraph();
  const registerEvents = useRegisterEvents();
  const sigma = useSigma();
  const setSettings = useSetSettings();
  const nodeLookup = useMemo(() => {
    const lookup = new Map<string, NodeData>();

    data?.nodes.forEach((node) => {
      lookup.set(node.id, node);
    });

    return lookup;
  }, [data]);

  const edgeLookup = useMemo(() => {
    const lookup = new Map<string, EdgeData>();

    data?.edges.forEach((edge) => {
      lookup.set(getEdgeLookupKey(edge.source, edge.target), edge);
    });

    return lookup;
  }, [data]);

  const connectedEdgeLookup = useMemo(() => {
    const lookup = new Map<string, EdgeData[]>();

    data?.edges.forEach((edge) => {
      const sourceEdges = lookup.get(edge.source);
      const targetEdges = lookup.get(edge.target);

      if (sourceEdges) {
        sourceEdges.push(edge);
      } else {
        lookup.set(edge.source, [edge]);
      }

      if (targetEdges) {
        targetEdges.push(edge);
      } else {
        lookup.set(edge.target, [edge]);
      }
    });

    return lookup;
  }, [data]);

  const getNodeData = useCallback(
    (nodeId: string) => {
      return nodeLookup.get(nodeId) || null;
    },
    [nodeLookup],
  );

  const lodRef = useRef<ReturnType<typeof import("@/lib/performance").createLODManager> | null>(
    null,
  );
  const sigmaAdapter = sigma as unknown as SigmaInstance | null;
  const { updateLOD } = useLODManagement(sigmaAdapter, lodRef);
  useViewportCulling(sigmaAdapter);

  const debouncedHandleZoom = useDebouncedHandler(
    useCallback(() => {
      if (!sigma || !lodRef.current) return;

      updateLOD();
      const sizeMultiplier = lodRef.current.getNodeSizeMultiplier();
      const showLabels = lodRef.current.shouldShowLabels();

      const graph = sigma.getGraph();
      graph.nodes().forEach((nodeId) => {
        const originalSize = getNodeData(nodeId)?.size || 5;
        graph.setNodeAttribute(nodeId, "size", originalSize * sizeMultiplier);
      });

      setSettings({ renderLabels: showLabels });
    }, [sigma, getNodeData, updateLOD, setSettings]),
    100,
  );

  useEffect(() => {
    if (!data) return;

    const graph = new Graph();

    data.nodes.forEach((node: NodeData) => {
      graph.addNode(node.id, toGraphologyNodeAttrs(node));
    });

    data.edges.forEach((edge: EdgeData) => {
      graph.addEdge(edge.source, edge.target, toGraphologyEdgeAttrs(edge));
    });

    loadGraph(graph);

    registerEvents({
      enterNode: ({ node }) => {
        const nodeData = getNodeData(node);
        if (onNodeHover) {
          onNodeHover(node, nodeData);
        }
      },
      leaveNode: () => {
        if (onNodeHover) {
          onNodeHover(null, null);
        }
      },
      clickNode: ({ node }) => {
        const nodeData = getNodeData(node);
        if (onNodeClick) {
          onNodeClick(node, nodeData);
        }
      },
      clickStage: () => {
        if (onNodeClick) {
          onNodeClick(null, null);
        }
      },
      downNode: debouncedHandleZoom,
      downStage: debouncedHandleZoom,
    });
  }, [data, loadGraph, registerEvents, onNodeHover, onNodeClick, debouncedHandleZoom, getNodeData]);

  useEffect(() => {
    if (!sigma) return;

    const graph = sigma.getGraph();

    graph.nodes().forEach((nodeId) => {
      const originalNode = nodeLookup.get(nodeId);
      graph.setNodeAttribute(nodeId, "color", originalNode?.color || "#808080");
      graph.setNodeAttribute(nodeId, "size", originalNode?.size || 5);
    });

    graph.forEachEdge((edgeId, _attributes, source, target) => {
      const originalEdge = edgeLookup.get(getEdgeLookupKey(source, target));

      graph.setEdgeAttribute(edgeId, "color", "#cccccc");
      graph.setEdgeAttribute(edgeId, "size", Math.max(0.1, Math.min(originalEdge?.size || 0.5, 2)));
    });

    if (!highlightedNode) {
      return;
    }

    const connectedEdges = connectedEdgeLookup.get(highlightedNode) || [];
    const connectedNodes = new Set<string>();
    connectedNodes.add(highlightedNode);
    connectedEdges.forEach((e) => {
      connectedNodes.add(e.source);
      connectedNodes.add(e.target);
    });

    graph.nodes().forEach((nodeId) => {
      const originalNode = nodeLookup.get(nodeId);

      if (connectedNodes.has(nodeId)) {
        graph.setNodeAttribute(nodeId, "color", originalNode?.color || "#808080");
        graph.setNodeAttribute(nodeId, "size", (originalNode?.size || 5) * 1.5);
      } else {
        graph.setNodeAttribute(nodeId, "color", "#cccccc");
        graph.setNodeAttribute(nodeId, "size", (originalNode?.size || 5) * 0.5);
      }
    });

    connectedEdges.forEach((edge) => {
      const edgeKey = graph.hasEdge(edge.source, edge.target)
        ? [edge.source, edge.target]
        : graph.hasEdge(edge.target, edge.source)
          ? [edge.target, edge.source]
          : null;

      if (!edgeKey) {
        return;
      }

      graph.setEdgeAttribute(edgeKey[0], edgeKey[1], "color", "#ff6600");
      graph.setEdgeAttribute(edgeKey[0], edgeKey[1], "size", (edge.size || 1) * 2);
    });
  }, [highlightedNode, sigma, nodeLookup, edgeLookup, connectedEdgeLookup]);

  return null;
}

export default GraphLoader;
