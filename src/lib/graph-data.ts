import type { GraphData, NodeData, EdgeData } from "./graph-types";

const NODES_PATH = "/data/nodes.json";
const EDGES_PATH = "/data/edges.json";

export function getBaseUrl(): string {
  if (typeof window !== "undefined") {
    return window.location.origin;
  }
  return "http://localhost:3000";
}

export async function loadGraphData(): Promise<GraphData> {
  const baseUrl = getBaseUrl();
  const nodesUrl = new URL(NODES_PATH, baseUrl).toString();
  const edgesUrl = new URL(EDGES_PATH, baseUrl).toString();

  const [nodesResponse, edgesResponse] = await Promise.all([fetch(nodesUrl), fetch(edgesUrl)]);

  if (!nodesResponse.ok) {
    throw new Error(`Failed to load nodes: ${nodesResponse.statusText}`);
  }
  if (!edgesResponse.ok) {
    throw new Error(`Failed to load edges: ${edgesResponse.statusText}`);
  }

  const nodes: NodeData[] = await nodesResponse.json();
  const edges: EdgeData[] = await edgesResponse.json();

  return { nodes, edges };
}

export function filterByEra(data: GraphData, era: string): GraphData {
  const eraLower = era.toLowerCase();
  const filteredNodes = data.nodes.filter((node) => node.era.toLowerCase() === eraLower);
  const filteredNodeIds = new Set(filteredNodes.map((n) => n.id));

  const filteredEdges = data.edges.filter(
    (edge) => filteredNodeIds.has(edge.source) && filteredNodeIds.has(edge.target),
  );

  return { nodes: filteredNodes, edges: filteredEdges };
}

export function filterByTeam(data: GraphData, teamId: string): GraphData {
  const teamIdUpper = teamId.toUpperCase();

  const relevantEdgeIds = new Set<string>();
  data.edges.forEach((edge) => {
    const hasTeam = edge.teams.some((t) => t.team_id.toUpperCase() === teamIdUpper);
    if (hasTeam) {
      relevantEdgeIds.add(edge.source);
      relevantEdgeIds.add(edge.target);
    }
  });

  const filteredNodes = data.nodes.filter((node) => relevantEdgeIds.has(node.id));

  const filteredEdges = data.edges.filter((edge) =>
    edge.teams.some((t) => t.team_id.toUpperCase() === teamIdUpper),
  );

  return { nodes: filteredNodes, edges: filteredEdges };
}

export function filterByPosition(data: GraphData, position: string): GraphData {
  const positionUpper = position.toUpperCase();

  const filteredNodes = data.nodes.filter((node) => node.position.toUpperCase() === positionUpper);
  const filteredNodeIds = new Set(filteredNodes.map((n) => n.id));

  const filteredEdges = data.edges.filter(
    (edge) => filteredNodeIds.has(edge.source) && filteredNodeIds.has(edge.target),
  );

  return { nodes: filteredNodes, edges: filteredEdges };
}

export function filterByPositions(data: GraphData, positions: string[]): GraphData {
  const positionsUpper = new Set(positions.map((p) => p.toUpperCase()));

  const filteredNodes = data.nodes.filter((node) =>
    positionsUpper.has(node.position.toUpperCase()),
  );
  const filteredNodeIds = new Set(filteredNodes.map((n) => n.id));

  const filteredEdges = data.edges.filter(
    (edge) => filteredNodeIds.has(edge.source) && filteredNodeIds.has(edge.target),
  );

  return { nodes: filteredNodes, edges: filteredEdges };
}

export function searchPlayers(data: GraphData, query: string): NodeData[] {
  if (!query.trim()) {
    return data.nodes;
  }

  const queryLower = query.toLowerCase();
  return data.nodes.filter((node) => node.label.toLowerCase().includes(queryLower));
}
