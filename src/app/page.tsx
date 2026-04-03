'use client';

import NetworkGraph from '@/components/NetworkGraph';
import PlayerTooltip from '@/components/PlayerTooltip';
import SearchBar from '@/components/SearchBar';
import Filters from '@/components/Filters';
import ShortestPath from '@/components/ShortestPath';
import { useState, useCallback } from 'react';
import type { GraphData, NodeData } from '@/lib/graph-types';

export default function Home() {
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [hoveredNodeData, setHoveredNodeData] = useState<NodeData | null>(null);
  const [selectedNodeData, setSelectedNodeData] = useState<NodeData | null>(null);
  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [highlightedNode, setHighlightedNode] = useState<string | null>(null);
  const [highlightedPath, setHighlightedPath] = useState<string[]>([]);

  const handleSearchSelect = useCallback((nodeId: string) => {
    const node = graphData?.nodes.find(n => n.id === nodeId) || null;
    setHighlightedNode(nodeId);
    setSelectedNodeId(nodeId);
    setSelectedNodeData(node);
  }, [graphData]);

  const handleFilterChange = useCallback((filteredData: GraphData) => {
    setGraphData(filteredData);
  }, []);

  const handlePathChange = useCallback((path: string[]) => {
    setHighlightedPath(path);
  }, []);

  const handleHighlightPath = useCallback((path: string[]) => {
    setHighlightedPath(path);
    if (path.length > 0) {
      setHighlightedNode(path[0] ?? null);
    }
  }, []);

  const handleNodeHover = useCallback((nodeId: string | null, nodeData?: NodeData | null) => {
    setHoveredNodeId(nodeId);
    setHoveredNodeData(nodeData || null);
  }, []);

  const handleNodeClick = useCallback((nodeId: string | null, nodeData?: NodeData | null) => {
    if (nodeId === null) {
      setSelectedNodeId(null);
      setSelectedNodeData(null);
      setHighlightedNode(null);
      setHighlightedPath([]);
    } else if (selectedNodeId === nodeId) {
      setSelectedNodeId(null);
      setSelectedNodeData(null);
      setHighlightedNode(null);
      setHighlightedPath([]);
    } else {
      setSelectedNodeId(nodeId);
      setSelectedNodeData(nodeData || null);
      setHighlightedNode(nodeId);
      setHighlightedPath([]);
    }
  }, [selectedNodeId]);

  const handleTooltipClose = useCallback(() => {
    setSelectedNodeId(null);
    setSelectedNodeData(null);
    setHighlightedNode(null);
    setHighlightedPath([]);
  }, []);

  const handleHighlight = useCallback((nodeId: string) => {
    setHighlightedNode(nodeId === highlightedNode ? null : nodeId);
  }, [highlightedNode]);

  const effectiveHighlightedNode = highlightedPath.length > 0 ? (highlightedPath[0] ?? null) : highlightedNode;

  const displayedPlayer = selectedNodeData;

  return (
    <div style={pageStyle}>
      <header style={headerStyle}>
        <h1 style={titleStyle}>NBA Teammate Network</h1>
        <p style={subtitleStyle}>
          Interactive visualization of NBA player teammate relationships (1946-2026)
        </p>
      </header>
      <main style={mainStyle}>
        <div style={controlsStyle}>
          <div style={searchBarContainerStyle}>
            {graphData && (
              <SearchBar data={graphData} onSelect={handleSearchSelect} />
            )}
          </div>
          <div style={filtersContainerStyle}>
            {graphData && (
              <Filters data={graphData} onFilterChange={handleFilterChange} />
            )}
          </div>
          <div style={shortestPathContainerStyle}>
            {graphData && (
              <ShortestPath
                data={graphData}
                onPathChange={handlePathChange}
                onHighlightPath={handleHighlightPath}
              />
            )}
          </div>
        </div>
        <div style={graphContainerStyle}>
          <NetworkGraph
            onNodeHover={handleNodeHover}
            onNodeClick={handleNodeClick}
            externalGraphData={graphData}
            onGraphDataLoaded={setGraphData}
            highlightedNode={effectiveHighlightedNode}
          />
        </div>
        {displayedPlayer && (
          <PlayerTooltip
            player={displayedPlayer}
            graphData={graphData}
            onClose={handleTooltipClose}
            onHighlight={handleHighlight}
          />
        )}
      </main>
    </div>
  );
}

const pageStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  height: '100vh',
  width: '100vw',
  overflow: 'hidden',
};

const headerStyle: React.CSSProperties = {
  padding: '16px 24px',
  backgroundColor: '#1a1a2e',
  color: '#ffffff',
  flexShrink: 0,
};

const titleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: '24px',
  fontWeight: 600,
};

const subtitleStyle: React.CSSProperties = {
  margin: '8px 0 0 0',
  fontSize: '14px',
  color: '#a0a0a0',
};

const mainStyle: React.CSSProperties = {
  flex: 1,
  display: 'flex',
  flexDirection: 'row',
  overflow: 'hidden',
};

const controlsStyle: React.CSSProperties = {
  width: '320px',
  flexShrink: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: '12px',
  padding: '12px',
  backgroundColor: '#f8f9fa',
  borderRight: '1px solid #e0e0e0',
  overflowY: 'auto',
};

const searchBarContainerStyle: React.CSSProperties = {
  flexShrink: 0,
};

const filtersContainerStyle: React.CSSProperties = {
  flexShrink: 0,
};

const shortestPathContainerStyle: React.CSSProperties = {
  flexShrink: 0,
};

const graphContainerStyle: React.CSSProperties = {
  flex: 1,
  overflow: 'hidden',
};