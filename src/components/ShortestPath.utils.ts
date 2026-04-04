import type { EdgeData } from "@/lib/graph-types";

export function findTeamConnection(
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
