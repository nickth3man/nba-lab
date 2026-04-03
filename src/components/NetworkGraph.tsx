'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { SigmaContainer, useLoadGraph, useRegisterEvents, useSigma, useSetSettings } from '@react-sigma/core';
import Graph from 'graphology';
import { loadGraphData } from '@/lib/graph-data';
import { isMobileDevice, filterModernPlayers, debounce, createViewportCuller, createLODManager, type SigmaInstance } from '@/lib/performance';
import type { GraphData, NodeData, EdgeData } from '@/lib/graph-types';

const ZOOM_MIN = 0.1;
const ZOOM_MAX = 10;
const LOD_ZOOM_THRESHOLD = 0.5;

interface NetworkGraphProps {
  onNodeHover?: (nodeId: string | null, nodeData?: NodeData | null) => void;
  onNodeClick?: (nodeId: string | null, nodeData?: NodeData | null) => void;
  externalGraphData?: GraphData | null;
  onGraphDataLoaded?: (data: GraphData) => void;
  highlightedNode?: string | null;
}

function useDebouncedHandler<T extends (...args: unknown[]) => void>(
  handler: T,
  delay: number
): T {
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  const debouncedRef = useRef(
    debounce((...args: unknown[]) => {
      handlerRef.current(...args);
    }, delay)
  );

  return debouncedRef.current as T;
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

function useLODManagement(sigma: SigmaInstance | null, lodRef: React.MutableRefObject<ReturnType<typeof createLODManager> | null>) {
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
    return 'HIGH' as const;
  }, [lodRef]);

  const getLODLevel = useCallback(() => {
    if (lodRef.current) {
      return lodRef.current.getLevel();
    }
    return 'HIGH' as const;
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
  const [currentHighlighted, setCurrentHighlighted] = useState<string | null>(null);
  
  const lodRef = useRef<ReturnType<typeof createLODManager> | null>(null);
  const { updateLOD, getLODLevel } = useLODManagement(sigma as unknown as SigmaInstance | null, lodRef);
  const { getVisibleNodes, getVisibleEdges } = useViewportCulling(sigma as unknown as SigmaInstance | null);
  
  const debouncedHandleZoom = useDebouncedHandler(
    useCallback(() => {
      if (!sigma || !lodRef.current) return;
      
      const level = updateLOD();
      const sizeMultiplier = lodRef.current.getNodeSizeMultiplier();
      const showLabels = lodRef.current.shouldShowLabels();
      
      const graph = sigma.getGraph();
      graph.nodes().forEach(nodeId => {
        const originalSize = data?.nodes.find(n => n.id === nodeId)?.size || 5;
        graph.setNodeAttribute(nodeId, 'size', originalSize * sizeMultiplier);
      });
      
      setSettings({ renderLabels: showLabels });
    }, [sigma, data, updateLOD, setSettings]),
    100
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
        const nodeData = data.nodes.find(n => n.id === node);
        if (onNodeHover) {
          onNodeHover(node, nodeData || null);
        }
      },
      leaveNode: () => {
        if (onNodeHover) {
          onNodeHover(null, null);
        }
      },
      clickNode: ({ node }) => {
        const nodeData = data.nodes.find(n => n.id === node);
        if (onNodeClick) {
          onNodeClick(node, nodeData || null);
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
  }, [data, loadGraph, registerEvents, onNodeHover, onNodeClick, debouncedHandleZoom]);

  useEffect(() => {
    if (highlightedNode !== currentHighlighted) {
      setCurrentHighlighted(highlightedNode || null);
      
      if (!sigma) return;
      
      const graph = sigma.getGraph();
      
      if (!highlightedNode) {
        graph.nodes().forEach(nodeId => {
          graph.setNodeAttribute(nodeId, 'color', data?.nodes.find(n => n.id === nodeId)?.color || '#808080');
          graph.setNodeAttribute(nodeId, 'size', data?.nodes.find(n => n.id === nodeId)?.size || 5);
        });
        return;
      }

      const connectedEdges = data?.edges.filter(e => e.source === highlightedNode || e.target === highlightedNode) || [];
      const connectedNodes = new Set<string>();
      connectedNodes.add(highlightedNode);
      connectedEdges.forEach(e => {
        connectedNodes.add(e.source);
        connectedNodes.add(e.target);
      });

      graph.nodes().forEach(nodeId => {
        if (connectedNodes.has(nodeId)) {
          graph.setNodeAttribute(nodeId, 'color', data?.nodes.find(n => n.id === nodeId)?.color || '#808080');
          graph.setNodeAttribute(nodeId, 'size', (data?.nodes.find(n => n.id === nodeId)?.size || 5) * 1.5);
        } else {
          graph.setNodeAttribute(nodeId, 'color', '#cccccc');
          graph.setNodeAttribute(nodeId, 'size', (data?.nodes.find(n => n.id === nodeId)?.size || 5) * 0.5);
        }
      });

      connectedEdges.forEach(edge => {
        try {
          graph.setEdgeAttribute(edge.source, edge.target, 'color', '#ff6600');
          graph.setEdgeAttribute(edge.source, edge.target, 'size', (edge.size || 1) * 2);
        } catch {
          try {
            graph.setEdgeAttribute(edge.target, edge.source, 'color', '#ff6600');
            graph.setEdgeAttribute(edge.target, edge.source, 'size', (edge.size || 1) * 2);
          } catch {
          }
        }
      });
    }
  }, [highlightedNode, sigma, data, currentHighlighted]);

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
          setError(err instanceof Error ? err.message : 'Failed to load graph data');
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
        <div style={errorStyle}>
          {error || 'No data available'}
        </div>
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
    <div style={containerStyle}>
      <SigmaContainer
        style={{ width: '100%', height: '100%' }}
        settings={{
          minCameraRatio: ZOOM_MIN,
          maxCameraRatio: ZOOM_MAX,
          renderLabels: false,
          renderEdgeLabels: false,
          hideEdgesOnMove: false,
          labelFont: 'Arial',
          labelSize: 12,
          labelWeight: 'bold',
          labelColor: { color: '#000000' },
          defaultNodeColor: '#808080',
          defaultEdgeColor: '#cccccc',
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
  width: '100%',
  height: '100%',
  position: 'relative',
  backgroundColor: '#f5f5f5',
};

const loadingStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '100%',
  height: '100%',
  color: '#666',
  fontSize: '16px',
};

const errorStyle: React.CSSProperties = {
  ...loadingStyle,
  color: '#e74c3c',
};
