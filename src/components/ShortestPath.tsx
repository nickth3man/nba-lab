"use client";

import { getBaseUrl, searchPlayers } from "@/lib/graph-data";
import type { EdgeData, GraphData, NodeData } from "@/lib/graph-types";
import React, { useEffect, useRef, useState } from "react";

interface ShortestPathProps {
  data: GraphData;
  onPathChange: (path: string[]) => void;
  onHighlightPath: (path: string[]) => void;
}

interface PathsData {
  [sourcePlayer: string]: {
    [targetPlayer: string]: string[];
  };
}

const DEBOUNCE_MS = 200;
const MAX_RESULTS = 100;
const PATHS_URL = "/data/paths.json";
const PATH_COLOR = "#FF6B35";

function findTeamConnection(
  sourceId: string,
  targetId: string,
  edges: EdgeData[],
): { team: string; edge: EdgeData } | null {
  for (const edge of edges) {
    const isMatchingEdge =
      (edge.source === sourceId && edge.target === targetId) ||
      (edge.source === targetId && edge.target === sourceId);
    const firstTeam = edge.teams?.[0];

    if (isMatchingEdge && edge.teams && edge.teams.length > 0 && firstTeam) {
      return { team: firstTeam.team_abbreviation, edge };
    }
  }
  return null;
}

export default function ShortestPath({ data, onPathChange, onHighlightPath }: ShortestPathProps) {
  const [fromQuery, setFromQuery] = useState("");
  const [toQuery, setToQuery] = useState("");
  const [fromResults, setFromResults] = useState<NodeData[]>([]);
  const [toResults, setToResults] = useState<NodeData[]>([]);
  const [fromOpen, setFromOpen] = useState(false);
  const [toOpen, setToOpen] = useState(false);
  const [fromSelectedIndex, setFromSelectedIndex] = useState(-1);
  const [toSelectedIndex, setToSelectedIndex] = useState(-1);
  const [fromPlayerId, setFromPlayerId] = useState<string | null>(null);
  const [toPlayerId, setToPlayerId] = useState<string | null>(null);
  const [fromPlayerLabel, setFromPlayerLabel] = useState("");
  const [toPlayerLabel, setToPlayerLabel] = useState("");
  const [currentPath, setCurrentPath] = useState<string[]>([]);
  const [pathError, setPathError] = useState<string | null>(null);
  const [pathsData, setPathsData] = useState<PathsData | null>(null);
  const [pathsLoading, setPathsLoading] = useState(true);
  const [pathsError, setPathsError] = useState<string | null>(null);

  const fromInputRef = useRef<HTMLInputElement>(null);
  const toInputRef = useRef<HTMLInputElement>(null);
  const fromContainerRef = useRef<HTMLDivElement>(null);
  const toContainerRef = useRef<HTMLDivElement>(null);
  const fromDebounceRef = useRef<NodeJS.Timeout | null>(null);
  const toDebounceRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    async function loadPaths() {
      try {
        const baseUrl = getBaseUrl();
        const response = await fetch(new URL(PATHS_URL, baseUrl).toString());
        if (!response.ok) {
          throw new Error(`Failed to load paths: ${response.statusText}`);
        }
        const data: PathsData = await response.json();
        setPathsData(data);
        setPathsError(null);
      } catch (err) {
        setPathsError(err instanceof Error ? err.message : "Failed to load paths");
      } finally {
        setPathsLoading(false);
      }
    }
    loadPaths();
  }, []);

  useEffect(() => {
    if (fromDebounceRef.current) {
      clearTimeout(fromDebounceRef.current);
    }

    if (!fromQuery.trim()) {
      setFromResults([]);
      setFromOpen(false);
      return;
    }

    fromDebounceRef.current = setTimeout(() => {
      const results = searchPlayers(data, fromQuery).slice(0, MAX_RESULTS);
      setFromResults(results);
      setFromOpen(true);
      setFromSelectedIndex(-1);
    }, DEBOUNCE_MS);

    return () => {
      if (fromDebounceRef.current) {
        clearTimeout(fromDebounceRef.current);
      }
    };
  }, [fromQuery, data]);

  useEffect(() => {
    if (toDebounceRef.current) {
      clearTimeout(toDebounceRef.current);
    }

    if (!toQuery.trim()) {
      setToResults([]);
      setToOpen(false);
      return;
    }

    toDebounceRef.current = setTimeout(() => {
      const results = searchPlayers(data, toQuery).slice(0, MAX_RESULTS);
      setToResults(results);
      setToOpen(true);
      setToSelectedIndex(-1);
    }, DEBOUNCE_MS);

    return () => {
      if (toDebounceRef.current) {
        clearTimeout(toDebounceRef.current);
      }
    };
  }, [toQuery, data]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (fromContainerRef.current && !fromContainerRef.current.contains(event.target as Node)) {
        setFromOpen(false);
      }
      if (toContainerRef.current && !toContainerRef.current.contains(event.target as Node)) {
        setToOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const hasAvailableGraphData = data.nodes.length > 0 || data.edges.length > 0;

    if (!hasAvailableGraphData) {
      return;
    }

    setFromQuery("");
    setToQuery("");
    setFromResults([]);
    setToResults([]);
    setFromOpen(false);
    setToOpen(false);
    setFromSelectedIndex(-1);
    setToSelectedIndex(-1);
    setFromPlayerId(null);
    setToPlayerId(null);
    setFromPlayerLabel("");
    setToPlayerLabel("");
    setCurrentPath([]);
    setPathError(null);
    onPathChange([]);
    onHighlightPath([]);
  }, [data, onHighlightPath, onPathChange]);

  const handleFromInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!fromOpen || fromResults.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setFromSelectedIndex((prev) => (prev < fromResults.length - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setFromSelectedIndex((prev) => (prev > 0 ? prev - 1 : fromResults.length - 1));
    } else if (e.key === "Enter" && fromSelectedIndex >= 0) {
      e.preventDefault();
      const player = fromResults[fromSelectedIndex];
      if (player) selectFromPlayer(player);
    } else if (e.key === "Escape") {
      setFromOpen(false);
    }
  };

  const handleToInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!toOpen || toResults.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setToSelectedIndex((prev) => (prev < toResults.length - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setToSelectedIndex((prev) => (prev > 0 ? prev - 1 : toResults.length - 1));
    } else if (e.key === "Enter" && toSelectedIndex >= 0) {
      e.preventDefault();
      const player = toResults[toSelectedIndex];
      if (player) selectToPlayer(player);
    } else if (e.key === "Escape") {
      setToOpen(false);
    }
  };

  const selectFromPlayer = (player: NodeData) => {
    setFromPlayerId(player.id);
    setFromPlayerLabel(player.label);
    setFromQuery("");
    setFromResults([]);
    setFromOpen(false);
    setFromSelectedIndex(-1);
    fromInputRef.current?.focus();
  };

  const selectToPlayer = (player: NodeData) => {
    setToPlayerId(player.id);
    setToPlayerLabel(player.label);
    setToQuery("");
    setToResults([]);
    setToOpen(false);
    setToSelectedIndex(-1);
    toInputRef.current?.focus();
  };

  const findPath = () => {
    if (!fromPlayerId || !toPlayerId) {
      setPathError("Please select both players");
      return;
    }

    if (pathsLoading) {
      setPathError("Paths data still loading");
      return;
    }

    if (pathsError) {
      setPathError(`Error loading paths: ${pathsError ?? "unknown"}`);
      return;
    }

    if (!pathsData) {
      setPathError("Paths data not available");
      return;
    }

    const sourcePaths = pathsData[fromPlayerId];
    if (!sourcePaths) {
      setPathError(`No paths from ${fromPlayerLabel} (not in top 100 source set)`);
      setCurrentPath([]);
      onPathChange([]);
      onHighlightPath([]);
      return;
    }

    const path = sourcePaths[toPlayerId];
    if (!path) {
      setPathError("No path found between these players");
      setCurrentPath([]);
      onPathChange([]);
      onHighlightPath([]);
      return;
    }

    setCurrentPath(path);
    setPathError(null);
    onPathChange(path);
    onHighlightPath(path);
  };

  const clearPath = () => {
    setFromPlayerId(null);
    setToPlayerId(null);
    setFromPlayerLabel("");
    setToPlayerLabel("");
    setFromQuery("");
    setToQuery("");
    setCurrentPath([]);
    setPathError(null);
    onPathChange([]);
    onHighlightPath([]);
  };

  const getNodeLabel = (nodeId: string): string => {
    const node = data.nodes.find((n) => n.id === nodeId);
    return node?.label || nodeId;
  };

  const renderPathDisplay = () => {
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
            const node = data.nodes.find((n) => n.id === nodeId);
            const isHighlighted = true;

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
                    ...(isHighlighted ? { backgroundColor: PATH_COLOR, color: "#fff" } : {}),
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
  };

  return (
    <div style={containerStyle}>
      <div style={searchRowStyle}>
        <div ref={fromContainerRef} style={searchContainerStyle}>
          <input
            ref={fromInputRef}
            data-testid="path-from-input"
            type="text"
            value={fromPlayerId ? fromPlayerLabel : fromQuery}
            onChange={(e) => {
              if (!fromPlayerId) {
                setFromQuery(e.target.value);
              }
            }}
            onKeyDown={handleFromInputKeyDown}
            onFocus={() => {
              if (fromQuery.trim() && fromResults.length > 0) {
                setFromOpen(true);
              }
            }}
            placeholder="From Player"
            disabled={!!fromPlayerId}
            style={{
              ...inputStyle,
              ...(fromPlayerId ? inputDisabledStyle : {}),
            }}
            aria-label="Search for starting player"
          />
          {fromPlayerId && (
            <button
              type="button"
              onClick={() => {
                setFromPlayerId(null);
                setFromPlayerLabel("");
                setFromQuery("");
                fromInputRef.current?.focus();
              }}
              style={clearBtnStyle}
              aria-label="Clear from player"
            >
              ×
            </button>
          )}
          {fromOpen && !fromPlayerId && (
            <div style={dropdownStyle} role="listbox" data-testid="path-from-results">
              {fromResults.length === 0 ? (
                <div style={noResultsStyle}>No players found</div>
              ) : (
                fromResults.map((player, index) => {
                  const isSelected = index === fromSelectedIndex;
                  return (
                    <div
                      key={player.id}
                      data-testid={`path-from-result-${index}`}
                      role="option"
                      aria-selected={isSelected ? "true" : "false"}
                      tabIndex={0}
                      style={{
                        ...resultItemStyle,
                        ...(isSelected ? resultItemSelectedStyle : {}),
                      }}
                      onClick={() => selectFromPlayer(player)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          selectFromPlayer(player);
                        }
                      }}
                      onMouseEnter={() => setFromSelectedIndex(index)}
                    >
                      <span style={playerNameStyle}>{player.label}</span>
                      <span style={playerMetaStyle}>{player.position}</span>
                      <span style={playerMetaStyle}>{player.era}</span>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>

        <div ref={toContainerRef} style={searchContainerStyle}>
          <input
            ref={toInputRef}
            data-testid="path-to-input"
            type="text"
            value={toPlayerId ? toPlayerLabel : toQuery}
            onChange={(e) => {
              if (!toPlayerId) {
                setToQuery(e.target.value);
              }
            }}
            onKeyDown={handleToInputKeyDown}
            onFocus={() => {
              if (toQuery.trim() && toResults.length > 0) {
                setToOpen(true);
              }
            }}
            placeholder="To Player"
            disabled={!!toPlayerId}
            style={{
              ...inputStyle,
              ...(toPlayerId ? inputDisabledStyle : {}),
            }}
            aria-label="Search for destination player"
          />
          {toPlayerId && (
            <button
              type="button"
              onClick={() => {
                setToPlayerId(null);
                setToPlayerLabel("");
                setToQuery("");
                toInputRef.current?.focus();
              }}
              style={clearBtnStyle}
              aria-label="Clear to player"
            >
              ×
            </button>
          )}
          {toOpen && !toPlayerId && (
            <div style={dropdownStyle} role="listbox" data-testid="path-to-results">
              {toResults.length === 0 ? (
                <div style={noResultsStyle}>No players found</div>
              ) : (
                toResults.map((player, index) => {
                  const isSelected = index === toSelectedIndex;
                  return (
                    <div
                      key={player.id}
                      data-testid={`path-to-result-${index}`}
                      role="option"
                      aria-selected={isSelected ? "true" : "false"}
                      tabIndex={0}
                      style={{
                        ...resultItemStyle,
                        ...(isSelected ? resultItemSelectedStyle : {}),
                      }}
                      onClick={() => selectToPlayer(player)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          selectToPlayer(player);
                        }
                      }}
                      onMouseEnter={() => setToSelectedIndex(index)}
                    >
                      <span style={playerNameStyle}>{player.label}</span>
                      <span style={playerMetaStyle}>{player.position}</span>
                      <span style={playerMetaStyle}>{player.era}</span>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      </div>

      <div style={buttonRowStyle}>
        <button
          type="button"
          onClick={findPath}
          disabled={!fromPlayerId || !toPlayerId || pathsLoading}
          data-testid="find-path-button"
          style={{
            ...buttonStyle,
            ...buttonPrimaryStyle,
            ...(!fromPlayerId || !toPlayerId || pathsLoading ? buttonDisabledStyle : {}),
          }}
        >
          Find Path
        </button>
        <button
          type="button"
          onClick={clearPath}
          data-testid="clear-path-button"
          style={buttonStyle}
        >
          Clear Path
        </button>
      </div>

      <div data-testid="path-feedback">{renderPathDisplay()}</div>
    </div>
  );
}

const containerStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "12px",
  padding: "16px",
  backgroundColor: "#fff",
  borderRadius: "8px",
  boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
};

const searchRowStyle: React.CSSProperties = {
  display: "flex",
  gap: "12px",
  flexWrap: "wrap",
};

const searchContainerStyle: React.CSSProperties = {
  position: "relative",
  flex: "1 1 200px",
  minWidth: "180px",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 36px 10px 12px",
  fontSize: "14px",
  border: "1px solid #ccc",
  borderRadius: "4px",
  outline: "none",
  boxSizing: "border-box",
};

const inputDisabledStyle: React.CSSProperties = {
  backgroundColor: "#f5f5f5",
  cursor: "default",
};

const dropdownStyle: React.CSSProperties = {
  position: "absolute",
  top: "100%",
  left: 0,
  right: 0,
  maxHeight: "250px",
  overflowY: "auto",
  backgroundColor: "#fff",
  border: "1px solid #ccc",
  borderTop: "none",
  borderRadius: "0 0 4px 4px",
  boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
  zIndex: 1000,
};

const noResultsStyle: React.CSSProperties = {
  padding: "12px",
  color: "#666",
  fontStyle: "italic",
  textAlign: "center",
};

const resultItemStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  padding: "8px 12px",
  cursor: "pointer",
  borderBottom: "1px solid #eee",
  gap: "12px",
};

const resultItemSelectedStyle: React.CSSProperties = {
  backgroundColor: "#e6f0ff",
};

const playerNameStyle: React.CSSProperties = {
  flex: 1,
  fontWeight: 500,
};

const playerMetaStyle: React.CSSProperties = {
  color: "#888",
  fontSize: "12px",
};

const clearBtnStyle: React.CSSProperties = {
  position: "absolute",
  right: "8px",
  top: "50%",
  transform: "translateY(-50%)",
  background: "none",
  border: "none",
  fontSize: "18px",
  color: "#888",
  cursor: "pointer",
  padding: "4px 8px",
};

const buttonRowStyle: React.CSSProperties = {
  display: "flex",
  gap: "12px",
};

const buttonStyle: React.CSSProperties = {
  padding: "10px 20px",
  fontSize: "14px",
  border: "1px solid #ccc",
  borderRadius: "4px",
  cursor: "pointer",
  backgroundColor: "#fff",
};

const buttonPrimaryStyle: React.CSSProperties = {
  backgroundColor: "#007bff",
  color: "#fff",
  borderColor: "#007bff",
};

const buttonDisabledStyle: React.CSSProperties = {
  opacity: 0.6,
  cursor: "not-allowed",
};

const hintStyle: React.CSSProperties = {
  color: "#666",
  fontSize: "14px",
  textAlign: "center",
  margin: "8px 0",
};

const errorStyle: React.CSSProperties = {
  color: "#dc3545",
  fontSize: "14px",
  textAlign: "center",
  margin: "8px 0",
};

const pathContainerStyle: React.CSSProperties = {
  marginTop: "8px",
  padding: "12px",
  backgroundColor: "#f8f9fa",
  borderRadius: "4px",
};

const degreesStyle: React.CSSProperties = {
  fontSize: "16px",
  fontWeight: "bold",
  color: "#333",
  marginBottom: "8px",
};

const pathListStyle: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  alignItems: "center",
  gap: "4px",
};

const pathNodeStyle: React.CSSProperties = {
  padding: "4px 10px",
  borderRadius: "4px",
  fontSize: "13px",
  fontWeight: 500,
  backgroundColor: "#e9ecef",
};

const teamTagStyle: React.CSSProperties = {
  padding: "2px 6px",
  borderRadius: "3px",
  fontSize: "11px",
  backgroundColor: "#17a2b8",
  color: "#fff",
};

const arrowStyle: React.CSSProperties = {
  color: "#666",
  fontSize: "16px",
  padding: "0 2px",
};
