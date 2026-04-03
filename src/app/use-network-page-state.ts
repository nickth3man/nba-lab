"use client";

import { useState, useCallback } from "react";
import type { GraphData, NodeData } from "@/lib/graph-types";

export function useNetworkPageState() {
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [hoveredNodeData, setHoveredNodeData] = useState<NodeData | null>(null);
  const [selectedNodeData, setSelectedNodeData] = useState<NodeData | null>(null);
  const [fullGraphData, setFullGraphData] = useState<GraphData | null>(null);
  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [highlightedNode, setHighlightedNode] = useState<string | null>(null);
  const [highlightedPath, setHighlightedPath] = useState<string[]>([]);

  const resetActiveState = useCallback(() => {
    setSelectedNodeId(null);
    setSelectedNodeData(null);
    setHighlightedNode(null);
    setHighlightedPath([]);
  }, []);

  const handleSearchSelect = useCallback(
    (nodeId: string) => {
      const node = graphData?.nodes.find((n) => n.id === nodeId) || null;
      setHighlightedPath([]);
      setHighlightedNode(nodeId);
      setSelectedNodeId(nodeId);
      setSelectedNodeData(node);
    },
    [graphData],
  );

  const handleFilterChange = useCallback(
    (filteredData: GraphData) => {
      setGraphData(filteredData);
      resetActiveState();
    },
    [resetActiveState],
  );

  const handleGraphDataLoaded = useCallback((loadedData: GraphData) => {
    setFullGraphData(loadedData);
    setGraphData(loadedData);
  }, []);

  const handlePathChange = useCallback((path: string[]) => {
    setHighlightedPath(path);
  }, []);

  const handleHighlightPath = useCallback((path: string[]) => {
    setHighlightedPath(path);
    setHighlightedNode(path[0] ?? null);
  }, []);

  const handleNodeHover = useCallback((nodeId: string | null, nodeData?: NodeData | null) => {
    setHoveredNodeId(nodeId);
    setHoveredNodeData(nodeData || null);
  }, []);

  const handleNodeClick = useCallback(
    (nodeId: string | null, nodeData?: NodeData | null) => {
      if (nodeId === null) {
        resetActiveState();
      } else if (selectedNodeId === nodeId) {
        resetActiveState();
      } else {
        setSelectedNodeId(nodeId);
        setSelectedNodeData(nodeData || null);
        setHighlightedNode(nodeId);
        setHighlightedPath([]);
      }
    },
    [resetActiveState, selectedNodeId],
  );

  const handleTooltipClose = useCallback(() => {
    resetActiveState();
  }, [resetActiveState]);

  const handleHighlight = useCallback(
    (nodeId: string) => {
      setHighlightedNode(nodeId === highlightedNode ? null : nodeId);
    },
    [highlightedNode],
  );

  const effectiveHighlightedNode =
    highlightedPath.length > 0 ? (highlightedPath[0] ?? null) : highlightedNode;

  const displayedPlayer = selectedNodeData;

  return {
    graphData,
    fullGraphData,
    displayedPlayer,
    effectiveHighlightedNode,
    handleSearchSelect,
    handleFilterChange,
    handleGraphDataLoaded,
    handlePathChange,
    handleHighlightPath,
    handleNodeHover,
    handleNodeClick,
    handleTooltipClose,
    handleHighlight,
  };
}
