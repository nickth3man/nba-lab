/**
 * Graph Type Definitions
 * TypeScript interfaces for NBA teammate overlap graph data
 */

export interface TeamTenure {
  team_id: string;
  team_name: string;
  team_abbreviation: string;
  seasons: string[];
  overlap_days: number;
}

export interface NodeData {
  id: string;
  label: string;
  x: number;
  y: number;
  size: number;
  color: string;
  position: string;
  era: string;
  is_active: boolean;
  hof: boolean;
  draft_year: number | null;
  degree: number;
  betweenness: number;
  community: number;
}

export interface EdgeData {
  id: string;
  source: string;
  target: string;
  weight: number;
  teams: TeamTenure[];
  total_days: number;
  size: number;
}

export interface GraphData {
  nodes: NodeData[];
  edges: EdgeData[];
}
