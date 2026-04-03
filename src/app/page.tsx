'use client';

import NetworkGraph from '@/components/NetworkGraph';
import PlayerTooltip from '@/components/PlayerTooltip';
import { useState, useCallback } from 'react';
import type { GraphData, NodeData } from '@/lib/graph-types';

export default function Home() {
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [hoveredNodeData, setHoveredNodeData] = useState<NodeData | null>(null);
  const [selectedNodeData, setSelectedNodeData] = useState<NodeData | null>(null);
  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [highlightedNode, setHighlightedNode] = useState<string | null>(null);

  const handleNodeHover = useCallback((nodeId: string | null, nodeData?: NodeData | null) => {
    setHoveredNodeId(nodeId);
    setHoveredNodeData(nodeData || null);
  }, []);

  const handleNodeClick = useCallback((nodeId: string | null, nodeData?: NodeData | null) => {
    if (nodeId === null) {
      setSelectedNodeId(null);
      setSelectedNodeData(null);
      setHighlightedNode(null);
    } else if (selectedNodeId === nodeId) {
      setSelectedNodeId(null);
      setSelectedNodeData(null);
      setHighlightedNode(null);
    } else {
      setSelectedNodeId(nodeId);
      setSelectedNodeData(nodeData || null);
      setHighlightedNode(nodeId);
    }
  }, [selectedNodeId]);

  const handleTooltipClose = useCallback(() => {
    setSelectedNodeId(null);
    setSelectedNodeData(null);
    setHighlightedNode(null);
  }, []);

  const handleHighlight = useCallback((nodeId: string) => {
    setHighlightedNode(nodeId === highlightedNode ? null : nodeId);
  }, [highlightedNode]);

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
        <div style={graphContainerStyle}>
          <NetworkGraph
            onNodeHover={handleNodeHover}
            onNodeClick={handleNodeClick}
            externalGraphData={graphData}
            onGraphDataLoaded={setGraphData}
            highlightedNode={highlightedNode}
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
  flexDirection: 'column',
  overflow: 'hidden',
};

const graphContainerStyle: React.CSSProperties = {
  flex: 1,
  width: '100%',
  overflow: 'hidden',
};
