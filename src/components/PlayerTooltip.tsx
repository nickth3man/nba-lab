'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import type { NodeData, EdgeData, GraphData, TeamTenure } from '@/lib/graph-types';

const HOVER_DELAY_MS = 100;

interface PlayerTooltipProps {
  player: NodeData | null;
  graphData: GraphData | null;
  position?: { x: number; y: number };
  onClose?: () => void;
  onOpen?: () => void;
  onHighlight?: (nodeId: string) => void;
}

interface TeammateInfo {
  id: string;
  name: string;
  team: string;
  seasons: number;
  totalDays: number;
}

function getTopTeammates(playerId: string, graphData: GraphData | null, limit = 5): TeammateInfo[] {
  if (!graphData || !playerId) return [];

  const connectedEdges = graphData.edges.filter(
    (edge) => edge.source === playerId || edge.target === playerId
  );

  const teammateMap = new Map<string, { teammateId: string; totalDays: number; bestTeam: TeamTenure }>();

  for (const edge of connectedEdges) {
    const firstTeam = edge.teams[0];
    if (!firstTeam) continue;

    const teammateId = edge.source === playerId ? edge.target : edge.source;
    const existing = teammateMap.get(teammateId);

    if (!existing || existing.totalDays < edge.total_days) {
      const bestTeam = edge.teams.reduce<TeamTenure>((best, t) =>
        t.overlap_days > best.overlap_days ? t : best
      , firstTeam);

      teammateMap.set(teammateId, {
        teammateId,
        totalDays: edge.total_days,
        bestTeam,
      });
    }
  }

  const teammates: TeammateInfo[] = [];
  for (const [, info] of teammateMap) {
    const teammateNode = graphData.nodes.find((n) => n.id === info.teammateId);
    if (teammateNode) {
      teammates.push({
        id: info.teammateId,
        name: teammateNode.label,
        team: info.bestTeam.team_name,
        seasons: info.bestTeam.seasons.length,
        totalDays: info.totalDays,
      });
    }
  }

  return teammates
    .sort((a, b) => b.totalDays - a.totalDays)
    .slice(0, limit);
}

export default function PlayerTooltip({
  player,
  graphData,
  onClose,
  onOpen,
  onHighlight,
}: PlayerTooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [highlightedNode, setHighlightedNode] = useState<string | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (player) {
      timeoutRef.current = setTimeout(() => {
        setIsVisible(true);
        if (onOpen) onOpen();
      }, HOVER_DELAY_MS);
    } else {
      setIsVisible(false);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [player, onOpen]);

  const handleClick = useCallback(() => {
    if (player && onHighlight) {
      if (highlightedNode === player.id) {
        setHighlightedNode(null);
        onHighlight(player.id);
      } else {
        setHighlightedNode(player.id);
        onHighlight(player.id);
      }
    }
  }, [player, onHighlight, highlightedNode]);

  const handleClose = useCallback(() => {
    setIsVisible(false);
    setHighlightedNode(null);
    if (onClose) onClose();
  }, [onClose]);

  if (!player || !isVisible) {
    return null;
  }

  const teammates = getTopTeammates(player.id, graphData);

  return (
    <div
      data-testid="player-tooltip"
      style={tooltipStyle}
      onClick={handleClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      }}
      role="button"
      tabIndex={0}
    >
      <button
        data-testid="tooltip-close"
        type="button"
        style={closeButtonStyle}
        onClick={(e) => {
          e.stopPropagation();
          handleClose();
        }}
      >
        ×
      </button>

      <div style={headerStyle}>
        <h3 style={nameStyle}>{player.label}</h3>
        <span style={positionStyle}>{player.position}</span>
      </div>

      <div style={metaStyle}>
        <span>{player.era}</span>
        <span style={divider}>|</span>
        <span>Hall of Fame: {player.hof ? 'Yes' : 'No'}</span>
      </div>

      <div style={statStyle}>
        Degree Centrality: {player.degree}
      </div>

      <div style={sectionDivider} />

      {teammates.length > 0 ? (
        <>
          <h4 style={sectionTitleStyle}>Top 5 Teammates</h4>
          <div style={teammatesListStyle}>
            {teammates.map((teammate, index) => (
              <div
                key={teammate.id}
                data-testid={`teammate-${index}`}
                style={teammateItemStyle}
              >
                <span style={teammateNameStyle}>{teammate.name}</span>
                <span style={teammateMetaStyle}>
                  {teammate.team} • {teammate.seasons} season{teammate.seasons !== 1 ? 's' : ''}
                </span>
              </div>
            ))}
          </div>
        </>
      ) : (
        <p style={noDataStyle}>No teammate data available</p>
      )}

      {highlightedNode === player.id && (
        <div style={highlightHintStyle}>
          Click again to reset
        </div>
      )}
    </div>
  );
}

const tooltipStyle: React.CSSProperties = {
  position: 'fixed',
  top: '16px',
  right: '16px',
  width: '320px',
  padding: '16px',
  backgroundColor: 'rgba(0, 0, 0, 0.92)',
  color: '#ffffff',
  borderRadius: '8px',
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
  zIndex: 1000,
  cursor: 'pointer',
  fontFamily: 'system-ui, -apple-system, sans-serif',
  maxHeight: 'calc(100vh - 32px)',
  overflowY: 'auto',
};

const closeButtonStyle: React.CSSProperties = {
  position: 'absolute',
  top: '8px',
  right: '8px',
  background: 'none',
  border: 'none',
  color: '#888',
  fontSize: '20px',
  cursor: 'pointer',
  padding: '4px 8px',
  lineHeight: 1,
};

const headerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  marginBottom: '8px',
};

const nameStyle: React.CSSProperties = {
  margin: 0,
  fontSize: '18px',
  fontWeight: 600,
};

const positionStyle: React.CSSProperties = {
  padding: '2px 8px',
  backgroundColor: 'rgba(255, 255, 255, 0.15)',
  borderRadius: '4px',
  fontSize: '12px',
  fontWeight: 500,
};

const metaStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  fontSize: '13px',
  color: '#aaa',
  marginBottom: '8px',
};

const divider: React.CSSProperties = {
  color: '#555',
};

const statStyle: React.CSSProperties = {
  fontSize: '13px',
  color: '#aaa',
};

const sectionDivider: React.CSSProperties = {
  height: '1px',
  backgroundColor: 'rgba(255, 255, 255, 0.1)',
  margin: '12px 0',
};

const sectionTitleStyle: React.CSSProperties = {
  margin: '0 0 8px 0',
  fontSize: '14px',
  fontWeight: 600,
  color: '#fff',
};

const teammatesListStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '6px',
};

const teammateItemStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  padding: '6px 0',
  borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
};

const teammateNameStyle: React.CSSProperties = {
  fontSize: '14px',
  fontWeight: 500,
  color: '#fff',
};

const teammateMetaStyle: React.CSSProperties = {
  fontSize: '12px',
  color: '#888',
  marginTop: '2px',
};

const noDataStyle: React.CSSProperties = {
  fontSize: '13px',
  color: '#888',
  fontStyle: 'italic',
  margin: 0,
};

const highlightHintStyle: React.CSSProperties = {
  marginTop: '12px',
  padding: '8px',
  backgroundColor: 'rgba(255, 255, 255, 0.1)',
  borderRadius: '4px',
  fontSize: '12px',
  color: '#aaa',
  textAlign: 'center',
};
