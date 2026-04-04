import type { EdgeData, NodeData } from "@/lib/graph-types";

export interface ShortestPathProps {
  data: GraphData;
  onPathChange: (path: string[]) => void;
  onHighlightPath: (path: string[]) => void;
}

export interface PathsData {
  [sourcePlayer: string]: {
    [targetPlayer: string]: string[];
  };
}

export interface GraphData {
  nodes: NodeData[];
  edges: EdgeData[];
}
