"use client";

import { useEffect, useState, useCallback } from "react";
import type { GraphData, NodeData } from "@/lib/graph-types";
import ShortestPathControls from "./ShortestPathControls";
import ShortestPathButtons from "./ShortestPathButtons";
import ShortestPathResults from "./ShortestPathResults";
import { containerStyle } from "./ShortestPath.styles";

const PATHS_URL = "/data/paths.json";

interface PathsData {
  [sourcePlayer: string]: {
    [targetPlayer: string]: string[];
  };
}

interface ShortestPathProps {
  data: GraphData;
  onPathChange: (path: string[]) => void;
  onHighlightPath: (path: string[]) => void;
}

export default function ShortestPath({ data, onPathChange, onHighlightPath }: ShortestPathProps) {
  const [fromPlayer, setFromPlayer] = useState<{
    id: string | null;
    label: string;
  }>({ id: null, label: "" });
  const [toPlayer, setToPlayer] = useState<{
    id: string | null;
    label: string;
  }>({ id: null, label: "" });
  const [currentPath, setCurrentPath] = useState<string[]>([]);
  const [pathError, setPathError] = useState<string | null>(null);
  const [pathsData, setPathsData] = useState<PathsData | null>(null);
  const [pathsLoading, setPathsLoading] = useState(true);
  const [pathsError, setPathsError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadPaths() {
      try {
        const baseUrl =
          typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";
        const response = await fetch(new URL(PATHS_URL, baseUrl).toString());
        if (!response.ok) {
          throw new Error(`Failed to load paths: ${response.statusText}`);
        }
        const loadedData: PathsData = await response.json();
        if (mounted) {
          setPathsData(loadedData);
          setPathsError(null);
        }
      } catch (err) {
        if (mounted) {
          setPathsError(err instanceof Error ? err.message : "Failed to load paths");
        }
      } finally {
        if (mounted) {
          setPathsLoading(false);
        }
      }
    }

    loadPaths();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const hasAvailableGraphData = data.nodes.length > 0 || data.edges.length > 0;

    if (!hasAvailableGraphData) {
      return;
    }

    setFromPlayer({ id: null, label: "" });
    setToPlayer({ id: null, label: "" });
    setCurrentPath([]);
    setPathError(null);
    onPathChange([]);
    onHighlightPath([]);
  }, [data, onHighlightPath, onPathChange]);

  const handleSelectFromPlayer = useCallback((player: NodeData) => {
    setFromPlayer({ id: player.id, label: player.label });
  }, []);

  const handleSelectToPlayer = useCallback((player: NodeData) => {
    setToPlayer({ id: player.id, label: player.label });
  }, []);

  const handleClearFromPlayer = useCallback(() => {
    setFromPlayer({ id: null, label: "" });
  }, []);

  const handleClearToPlayer = useCallback(() => {
    setToPlayer({ id: null, label: "" });
  }, []);

  const findPath = useCallback(() => {
    if (!fromPlayer.id || !toPlayer.id) {
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

    const sourcePaths = pathsData[fromPlayer.id];
    if (!sourcePaths) {
      setPathError(`No paths from ${fromPlayer.label} (not in top 100 source set)`);
      setCurrentPath([]);
      onPathChange([]);
      onHighlightPath([]);
      return;
    }

    const path = sourcePaths[toPlayer.id];
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
  }, [fromPlayer, toPlayer, pathsLoading, pathsError, pathsData, onPathChange, onHighlightPath]);

  const clearPath = useCallback(() => {
    setFromPlayer({ id: null, label: "" });
    setToPlayer({ id: null, label: "" });
    setCurrentPath([]);
    setPathError(null);
    onPathChange([]);
    onHighlightPath([]);
  }, [onPathChange, onHighlightPath]);

  return (
    <div style={containerStyle}>
      <ShortestPathControls
        data={data}
        fromPlayer={fromPlayer}
        toPlayer={toPlayer}
        onSelectFromPlayer={handleSelectFromPlayer}
        onSelectToPlayer={handleSelectToPlayer}
        onClearFromPlayer={handleClearFromPlayer}
        onClearToPlayer={handleClearToPlayer}
      />

      <ShortestPathButtons
        fromPlayerId={fromPlayer.id}
        toPlayerId={toPlayer.id}
        pathsLoading={pathsLoading}
        onFindPath={findPath}
        onClearPath={clearPath}
      />

      <ShortestPathResults
        fromPlayerId={fromPlayer.id}
        toPlayerId={toPlayer.id}
        currentPath={currentPath}
        pathError={pathError}
        pathsLoading={pathsLoading}
        data={data}
      />
    </div>
  );
}

export type { PathsData };
