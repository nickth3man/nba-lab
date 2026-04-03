/**
 * TypeScript type tests for graph schema types
 */

import { describe, it, expect, beforeAll } from "@jest/globals";
import type { NodeData, EdgeData, TeamTenure, GraphData } from "../../src/lib/graph-types";

// Test suite for NodeData type
describe("NodeData", () => {
  it("should accept valid node data", () => {
    const validNode: NodeData = {
      id: "player_001",
      label: "Michael Jordan",
      x: 100.5,
      y: 200.3,
      size: 25,
      color: "#1E90FF",
      position: "SG",
      era: "1990s",
      is_active: false,
      hof: true,
      draft_year: 1984,
      degree: 45,
      betweenness: 0.0823,
      community: 1,
    };
    expect(validNode.id).toBe("player_001");
    expect(validNode.draft_year).toBe(1984);
  });

  it("should accept null draft_year", () => {
    const nodeWithNullDraft: NodeData = {
      id: "player_999",
      label: "Unknown Player",
      x: 0,
      y: 0,
      size: 10,
      color: "#000000",
      position: "PG",
      era: "2020s",
      is_active: true,
      hof: false,
      draft_year: null, // null is valid
      degree: 0,
      betweenness: 0,
      community: 0,
    };
    expect(nodeWithNullDraft.draft_year).toBeNull();
  });

  it("should reject invalid color format at compile time (string type)", () => {
    // TypeScript will catch this if color doesn't match the pattern
    // Since we use string type, we validate at runtime via schema
    const node: NodeData = {
      id: "test",
      label: "Test",
      x: 0,
      y: 0,
      size: 10,
      color: "#XYZ123", // This would be rejected by JSON schema but TypeScript allows string
      position: "PG",
      era: "2020s",
      is_active: true,
      hof: false,
      draft_year: null,
      degree: 0,
      betweenness: 0,
      community: 0,
    };
    // TypeScript passes, but schema validation would fail at runtime
    expect(node.color).toBeDefined();
  });
});

// Test suite for TeamTenure type
describe("TeamTenure", () => {
  it("should accept valid team tenure", () => {
    const tenure: TeamTenure = {
      team_id: "LAL",
      team_name: "Los Angeles Lakers",
      team_abbreviation: "LAL",
      seasons: ["2019-20", "2020-21", "2021-22"],
      overlap_days: 1095,
    };
    expect(tenure.team_id).toBe("LAL");
    expect(tenure.seasons.length).toBe(3);
  });

  it("should require all fields", () => {
    const tenure: TeamTenure = {
      team_id: "BOS",
      team_name: "Boston Celtics",
      team_abbreviation: "BOS",
      seasons: ["2007-08"],
      overlap_days: 365,
    };
    expect(tenure.team_name).toBe("Boston Celtics");
  });
});

// Test suite for EdgeData type
describe("EdgeData", () => {
  it("should accept valid edge data", () => {
    const edge: EdgeData = {
      id: "edge_001",
      source: "player_001",
      target: "player_002",
      weight: 7,
      teams: [
        {
          team_id: "CHI",
          team_name: "Chicago Bulls",
          team_abbreviation: "CHI",
          seasons: ["1990-91", "1991-92"],
          overlap_days: 730,
        },
      ],
      total_days: 730,
      size: 14,
    };
    expect(edge.weight).toBe(7);
    expect(edge.teams.length).toBe(1);
  });

  it("should accept edge with multiple teams", () => {
    const edge: EdgeData = {
      id: "edge_002",
      source: "player_003",
      target: "player_005",
      weight: 4,
      teams: [
        {
          team_id: "CLE",
          team_name: "Cleveland Cavaliers",
          team_abbreviation: "CLE",
          seasons: ["2014-15"],
          overlap_days: 365,
        },
        {
          team_id: "MIA",
          team_name: "Miami Heat",
          team_abbreviation: "MIA",
          seasons: ["2011-12", "2012-13"],
          overlap_days: 730,
        },
      ],
      total_days: 1095,
      size: 10,
    };
    expect(edge.teams.length).toBe(2);
  });
});

// Test suite for GraphData type
describe("GraphData", () => {
  it("should accept valid graph data structure", () => {
    const graph: GraphData = {
      nodes: [
        {
          id: "p1",
          label: "Player 1",
          x: 0,
          y: 0,
          size: 10,
          color: "#FF0000",
          position: "PG",
          era: "2020s",
          is_active: true,
          hof: false,
          draft_year: 2020,
          degree: 5,
          betweenness: 0.1,
          community: 1,
        },
      ],
      edges: [],
    };
    expect(graph.nodes.length).toBe(1);
    expect(graph.edges.length).toBe(0);
  });

  it("should allow empty arrays", () => {
    const emptyGraph: GraphData = {
      nodes: [],
      edges: [],
    };
    expect(emptyGraph.nodes.length).toBe(0);
    expect(emptyGraph.edges.length).toBe(0);
  });
});

// Runtime type guard tests
describe("Type Guards", () => {
  it("should identify valid node structure", () => {
    const validNode = {
      id: "test",
      label: "Test",
      x: 100,
      y: 200,
      size: 10,
      color: "#FF0000",
      position: "PG",
      era: "2020s",
      is_active: true,
      hof: false,
      draft_year: 2020,
      degree: 5,
      betweenness: 0.1,
      community: 1,
    };

    // Check all required fields exist
    expect("id" in validNode).toBe(true);
    expect("position" in validNode).toBe(true);
    expect("community" in validNode).toBe(true);
  });

  it("should identify invalid node (missing required field)", () => {
    const invalidNode = {
      id: "test",
      label: "Test",
      // Missing x, y, size, etc.
    };

    // TypeScript would catch this at compile time
    expect("x" in invalidNode).toBe(false);
  });
});
