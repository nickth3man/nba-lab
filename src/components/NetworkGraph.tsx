"use client";

import React, { useEffect, useState } from "react";
import { SigmaContainer } from "@react-sigma/core";
import type { GraphData, NodeData } from "@/lib/graph-types";
import { isMobileDevice, filterModernPlayers } from "@/lib/performance";
import { loadGraphData } from "@/lib/graph-data";
import { containerStyle, loadingStyle, errorStyle } from "./NetworkGraph.styles";
import GraphLoader from "./NetworkGraphLoader";

const ZOOM_MIN = 0.1;
const ZOOM_MAX = 10;

interface NetworkGraphProps {
  onNodeHover?: (nodeId: string | null, nodeData?: NodeData | null) => void;
  onNodeClick?: (nodeId: string | null, nodeData?: NodeData | null) => void;
  externalGraphData?: GraphData | null;
  onGraphDataLoaded?: (data: GraphData) => void;
  highlightedNode?: string | null;
}

interface UseGraphDataResult {
  graphData: GraphData | null;
  isLoading: boolean;
  error: string | null;
}

function useGraphData(
  externalGraphData: GraphData | null | undefined,
  isMobile: boolean,
  onGraphDataLoaded?: (data: GraphData) => void,
): UseGraphDataResult {
  const [internalGraphData, setInternalGraphData] = useState<GraphData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  const graphData = externalGraphData || internalGraphData;

  return { graphData, isLoading, error };
}

export default function NetworkGraph({
  onNodeHover,
  onNodeClick,
  externalGraphData,
  onGraphDataLoaded,
  highlightedNode,
}: NetworkGraphProps) {
  const isMobile = isMobileDevice();

  const { graphData, isLoading, error } = useGraphData(
    externalGraphData,
    isMobile,
    onGraphDataLoaded,
  );

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
