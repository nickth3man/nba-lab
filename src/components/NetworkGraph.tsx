"use client";

import React, { useEffect, useState, useCallback, useRef, useMemo } from "react";
import {
  SigmaContainer,
  useLoadGraph,
  useRegisterEvents,
  useSigma,
  useSetSettings,
} from "@react-sigma/core";
import Graph from "graphology";
import { loadGraphData } from "@/lib/graph-data";
import {
  isMobileDevice,
  filterModernPlayers,
  debounce,
  createViewportCuller,
  createLODManager,
  type SigmaInstance,
} from "@/lib/performance";
import type { GraphData, NodeData, EdgeData } from "@/lib/graph-types";

const ZOOM_MIN = 0.1;
const ZOOM_MAX = 10;
interface NetworkGraphProps {
  onNodeHover?: (nodeId: string | null, nodeData?: NodeData | null) => void;
  onNodeClick?: (nodeId: string | null, nodeData?: NodeData | null) => void;
  externalGraphData?: GraphData | null;
  onGraphDataLoaded?: (data: GraphData) => void;
  highlightedNode?: string | null;
}

function getEdgeLookupKey(source: string, target: string): string {
  return source < target ? `${source}::${target}` : `${target}::${source}`;
}

function useDebouncedHandler<T extends (...args: unknown[]) => void>(
  handler: T,
  delay: number,
): T {
  const handlerRef = useRef<T | null>(null);

  useEffect(() => {
    handlerRef.current = handler;
  });

  return useMemo(
    () =>
      (debounce((...args: unknown[]) => {
        handlerRef.current?.(...(args as Parameters<T>));
      }, delay) as unknown as T),
    [delay],
  );
}

function useViewportCulling(sigma: SigmaInstance | null) {
  const cullerRef = useRef<ReturnType<typeof createViewportCuller> | null>(null);

  useEffect(() => {
    if (sigma) {
      cullerRef.current = createViewportCuller(sigma);
    }
  }, [sigma]);

  const getVisibleNodes = useCallback(() => {
    return cullerRef.current?.getVisibleNodes() || [];
  }, []);

  const getVisibleEdges = useCallback(() => {
    return cullerRef.current?.getVisibleEdges() || [];
  }, []);

  return { getVisibleNodes, getVisibleEdges };
}

function useLODManagement(
  sigma: SigmaInstance | null,
  lodRef: React.MutableRefObject<ReturnType<typeof createLODManager> | null>,
) {
  useEffect(() => {
    if (sigma) {
      lodRef.current = createLODManager(sigma);
    }
  }, [sigma, lodRef]);

  const updateLOD = useCallback(() => {
    if (lodRef.current) {
      lodRef.current.update();
      return lodRef.current.getLevel();
    }
    return "HIGH" as const;
  }, [lodRef]);

  const getLODLevel = useCallback(() => {
    if (lodRef.current) {
      return lodRef.current.getLevel();
    }
    return "HIGH" as const;
  }, [lodRef]);

  return { updateLOD, getLODLevel };
}

function GraphLoader({
  data,
  onNodeHover,
  onNodeClick,
  highlightedNode,
}: {
  data: GraphData | null;
  onNodeHover?: (nodeId: string | null, nodeData?: NodeData | null) => void;
  onNodeClick?: (nodeId: string | null, nodeData?: NodeData | null) => void;
  highlightedNode?: string | null;
}) {
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

  const lodRef = useRef<ReturnType<typeof createLODManager> | null>(null);
  const { updateLOD, getLODLevel } = useLODManagement(
    sigma as unknown as SigmaInstance | null,
    lodRef,
  );
  const { getVisibleNodes, getVisibleEdges } = useViewportCulling(
    sigma as unknown as SigmaInstance | null,
  );

  const debouncedHandleZoom = useDebouncedHandler(
    useCallback(() => {
      if (!sigma || !lodRef.current) return;

      const level = updateLOD();
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
      graph.addNode(node.id, {
        x: node.x,
        y: node.y,
        size: node.size,
        label: node.label,
        color: node.color,
      });
    });

    data.edges.forEach((edge: EdgeData) => {
      const size = Math.max(0.1, Math.min(edge.size || 0.5, 2));
      graph.addEdge(edge.source, edge.target, {
        size: size,
        weight: edge.weight,
      });
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
      graph.setEdgeAttribute(
        edgeId,
        "size",
        Math.max(0.1, Math.min(originalEdge?.size || 0.5, 2)),
      );
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

export default function NetworkGraph({
  onNodeHover,
  onNodeClick,
  externalGraphData,
  onGraphDataLoaded,
  highlightedNode,
}: NetworkGraphProps) {
  const [internalGraphData, setInternalGraphData] = useState<GraphData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  const graphData = externalGraphData || internalGraphData;

  useEffect(() => {
    setIsMobile(isMobileDevice());
  }, []);

  useEffect(() => {
    if (externalGraphData) {
      const dataToUse = isMobile ? filterModernPlayers(externalGraphData) : externalGraphData;
      setInternalGraphData(dataToUse);
      setIsLoading(false);
      return;
    }

    let mounted = true;

    async function fetchData() {
      try {
        const data = await loadGraphData();
        if (mounted) {
          const processedData = isMobile ? filterModernPlayers(data) : data;
          setInternalGraphData(processedData);
          if (onGraphDataLoaded) {
            onGraphDataLoaded(processedData);
          }
          setError(null);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : "Failed to load graph data");
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    fetchData();

    return () => {
      mounted = false;
    };
  }, [externalGraphData, onGraphDataLoaded, isMobile]);

  if (isLoading) {
    return (
      <div style={containerStyle}>
        <div style={loadingStyle}>Loading network graph...</div>
      </div>
    );
  }

  if (error || !graphData) {
    return (
      <div style={containerStyle}>
        <div style={errorStyle}>{error || "No data available"}</div>
      </div>
    );
  }

  if (graphData.nodes.length === 0) {
    return (
      <div style={containerStyle}>
        <div style={loadingStyle}>No data available</div>
      </div>
    );
  }

  return (
    <div style={containerStyle} data-testid="network-graph">
      <SigmaContainer
        style={{ width: "100%", height: "100%" }}
        settings={{
          allowInvalidContainer: true,
          minCameraRatio: ZOOM_MIN,
          maxCameraRatio: ZOOM_MAX,
          renderLabels: false,
          renderEdgeLabels: false,
          hideEdgesOnMove: false,
          labelFont: "Arial",
          labelSize: 12,
          labelWeight: "bold",
          labelColor: { color: "#000000" },
          defaultNodeColor: "#808080",
          defaultEdgeColor: "#cccccc",
          enableCameraZooming: true,
          enableCameraPanning: true,
        }}
      >
        <GraphLoader
          data={graphData}
          onNodeHover={onNodeHover}
          onNodeClick={onNodeClick}
          highlightedNode={highlightedNode}
        />
      </SigmaContainer>
    </div>
  );
}

const containerStyle: React.CSSProperties = {
  width: "100%",
  height: "100%",
  position: "relative",
  backgroundColor: "#f5f5f5",
};

const loadingStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: "100%",
  height: "100%",
  color: "#666",
  fontSize: "16px",
};

const errorStyle: React.CSSProperties = {
  ...loadingStyle,
  color: "#e74c3c",
};
