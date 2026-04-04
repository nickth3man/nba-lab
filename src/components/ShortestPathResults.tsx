"use client";

import React from "react";
import type { GraphData } from "@/lib/graph-types";
import { findTeamConnection } from "./ShortestPath.utils";
import {
  pathContainerStyle,
  degreesStyle,
  pathListStyle,
  pathNodeStyle,
  teamTagStyle,
  arrowStyle,
  hintStyle,
  errorStyle,
} from "./ShortestPath.styles";

const PATH_COLOR = "#FF6B35";

interface ShortestPathResultsProps {
  fromPlayerId: string | null;
  toPlayerId: string | null;
  currentPath: string[];
  pathError: string | null;
  pathsLoading: boolean;
  data: GraphData;
}

export default function ShortestPathResults({
  fromPlayerId,
  toPlayerId,
  currentPath,
  pathError,
  pathsLoading,
  data,
}: ShortestPathResultsProps) {
  const getNodeLabel = (nodeId: string): string => {
    const node = data.nodes.find((n) => n.id === nodeId);
    return node?.label || nodeId;
  };

  if (!fromPlayerId || !toPlayerId) {
    return <p style={hintStyle}>Select two players to find path</p>;
  }

  if (pathError) {
    return <p style={errorStyle}>{pathError}</p>;
  }

  if (pathsLoading) {
    return <p style={hintStyle}>Loading paths data...</p>;
  }

  if (currentPath.length === 0) {
    return null;
  }

  const degrees = currentPath.length - 1;

  return (
    <div style={pathContainerStyle}>
      <p style={degreesStyle}>
        {degrees} degree{degrees !== 1 ? "s" : ""}
      </p>
      <div style={pathListStyle}>
        {currentPath.map((nodeId, index) => {
          const label = getNodeLabel(nodeId);

          let teamInfo: string | null = null;
          if (index < currentPath.length - 1) {
            const nextNodeId = currentPath[index + 1];
            if (nextNodeId) {
              const connection = findTeamConnection(nodeId, nextNodeId, data.edges);
              if (connection) {
                teamInfo = connection.team;
              }
            }
          }

          return (
            <React.Fragment key={nodeId}>
              <span
                style={{
                  ...pathNodeStyle,
                  backgroundColor: PATH_COLOR,
                  color: "#fff",
                }}
              >
                {label}
              </span>
              {teamInfo && <span style={teamTagStyle}>{teamInfo}</span>}
              {index < currentPath.length - 1 && <span style={arrowStyle}>→</span>}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
