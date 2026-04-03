/**
 * TDD Tests for Graph Data Module
 * Tests data loading, filtering, and search functionality
 */

import { GraphData, NodeData, EdgeData, TeamTenure } from '@/lib/graph-types';

// Mock data for testing
const mockNodes: NodeData[] = [
  {
    id: 'player_001',
    label: 'Michael Jordan',
    x: 100.5,
    y: 200.3,
    size: 25,
    color: '#1E90FF',
    position: 'SG',
    era: '1990s',
    is_active: false,
    hof: true,
    draft_year: 1984,
    degree: 45,
    betweenness: 0.0823,
    community: 1,
  },
  {
    id: 'player_002',
    label: 'Scottie Pippen',
    x: 120.8,
    y: 210.1,
    size: 20,
    color: '#1E90FF',
    position: 'SF',
    era: '1990s',
    is_active: false,
    hof: true,
    draft_year: 1987,
    degree: 38,
    betweenness: 0.0541,
    community: 1,
  },
  {
    id: 'player_003',
    label: 'LeBron James',
    x: 300.5,
    y: 150.7,
    size: 30,
    color: '#FF6B6B',
    position: 'SF',
    era: '2010s',
    is_active: true,
    hof: false,
    draft_year: 2003,
    degree: 112,
    betweenness: 0.1234,
    community: 2,
  },
  {
    id: 'player_004',
    label: 'Kobe Bryant',
    x: 180.3,
    y: 175.2,
    size: 28,
    color: '#FFD93D',
    position: 'SG',
    era: '2000s',
    is_active: false,
    hof: true,
    draft_year: 1996,
    degree: 89,
    betweenness: 0.0912,
    community: 3,
  },
  {
    id: 'player_005',
    label: 'Stephen Curry',
    x: 350.1,
    y: 160.4,
    size: 22,
    color: '#FF6B6B',
    position: 'PG',
    era: '2010s',
    is_active: true,
    hof: false,
    draft_year: 2009,
    degree: 75,
    betweenness: 0.0723,
    community: 2,
  },
];

const mockEdges: EdgeData[] = [
  {
    id: 'player_001--player_002',
    source: 'player_001',
    target: 'player_002',
    weight: 7,
    teams: [
      {
        team_id: 'CHI',
        team_name: 'Chicago Bulls',
        team_abbreviation: 'CHI',
        seasons: ['1987-88', '1988-89', '1989-90', '1990-91', '1991-92', '1992-93'],
        overlap_days: 2555,
      },
    ],
    total_days: 2555,
    size: 14,
  },
  {
    id: 'player_003--player_005',
    source: 'player_003',
    target: 'player_005',
    weight: 4,
    teams: [
      {
        team_id: 'CLE',
        team_name: 'Cleveland Cavaliers',
        team_abbreviation: 'CLE',
        seasons: ['2014-15'],
        overlap_days: 365,
      },
    ],
    total_days: 395,
    size: 8,
  },
  {
    id: 'player_004--player_006',
    source: 'player_004',
    target: 'player_006',
    weight: 3,
    teams: [
      {
        team_id: 'LAL',
        team_name: 'Los Angeles Lakers',
        team_abbreviation: 'LAL',
        seasons: ['1996-97', '1997-98', '1998-99'],
        overlap_days: 1095,
      },
    ],
    total_days: 1095,
    size: 6,
  },
];

const mockGraphData: GraphData = {
  nodes: mockNodes,
  edges: mockEdges,
};

// Import functions - will be implemented in src/lib/graph-data.ts
// Using dynamic import to allow for mocking in tests
let graphDataModule: typeof import('@/lib/graph-data');

beforeAll(async () => {
  graphDataModule = await import('@/lib/graph-data');
});

// Mock fetch for loadGraphData tests
const mockFetch = async (url: RequestInfo | URL) => {
  const urlStr = url.toString();
  if (urlStr.includes('nodes.json')) {
    return {
      ok: true,
      json: async () => mockNodes,
    } as Response;
  }
  if (urlStr.includes('edges.json')) {
    return {
      ok: true,
      json: async () => mockEdges,
    } as Response;
  }
  throw new Error('Unknown URL');
};

describe('graph-data module', () => {
  beforeEach(() => {
    global.fetch = mockFetch;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('loadGraphData', () => {
    it('should be a function', () => {
      expect(typeof graphDataModule.loadGraphData).toBe('function');
    });

    it('should return GraphData with nodes and edges arrays', async () => {
      const data = await graphDataModule.loadGraphData();
      expect(data).toHaveProperty('nodes');
      expect(data).toHaveProperty('edges');
      expect(Array.isArray(data.nodes)).toBe(true);
      expect(Array.isArray(data.edges)).toBe(true);
    });

    it('should load valid NodeData objects', async () => {
      const data = await graphDataModule.loadGraphData();
      const node = data.nodes[0];
      expect(node).toHaveProperty('id');
      expect(node).toHaveProperty('label');
      expect(node).toHaveProperty('position');
      expect(node).toHaveProperty('era');
      expect(typeof node.x).toBe('number');
      expect(typeof node.y).toBe('number');
    });

    it('should load valid EdgeData objects', async () => {
      const data = await graphDataModule.loadGraphData();
      const edge = data.edges[0];
      expect(edge).toHaveProperty('source');
      expect(edge).toHaveProperty('target');
      expect(edge).toHaveProperty('weight');
      expect(edge).toHaveProperty('teams');
    });
  });

  describe('filterByEra', () => {
    it('should be a function', () => {
      expect(typeof graphDataModule.filterByEra).toBe('function');
    });

    it('should return only nodes matching the era', () => {
      const result = graphDataModule.filterByEra(mockGraphData, '1990s');
      expect(result.nodes).toHaveLength(2);
      expect(result.nodes.every((n: NodeData) => n.era === '1990s')).toBe(true);
    });

    it('should return only edges where both nodes are in filtered era', () => {
      const result = graphDataModule.filterByEra(mockGraphData, '1990s');
      // Edge player_001--player_002 connects two 1990s players
      expect(result.edges).toHaveLength(1);
    });

    it('should return empty GraphData when no matches', () => {
      const result = graphDataModule.filterByEra(mockGraphData, '1970s');
      expect(result.nodes).toHaveLength(0);
      expect(result.edges).toHaveLength(0);
    });

    it('should not mutate original data', () => {
      const original = { ...mockGraphData, nodes: [...mockGraphData.nodes] };
      graphDataModule.filterByEra(mockGraphData, '2010s');
      expect(mockGraphData.nodes).toEqual(original.nodes);
    });
  });

  describe('filterByTeam', () => {
    it('should be a function', () => {
      expect(typeof graphDataModule.filterByTeam).toBe('function');
    });

    it('should return nodes connected to specified team', () => {
      const result = graphDataModule.filterByTeam(mockGraphData, 'CHI');
      expect(result.nodes.length).toBeGreaterThan(0);
      const nodeIds = result.nodes.map((n: NodeData) => n.id);
      expect(nodeIds).toContain('player_001');
      expect(nodeIds).toContain('player_002');
    });

    it('should return empty when team not found', () => {
      const result = graphDataModule.filterByTeam(mockGraphData, 'XYZ');
      expect(result.nodes).toHaveLength(0);
      expect(result.edges).toHaveLength(0);
    });

    it('should filter edges to only those with the team', () => {
      const result = graphDataModule.filterByTeam(mockGraphData, 'CHI');
      expect(result.edges.every((e: EdgeData) => 
        e.teams.some((t: TeamTenure) => t.team_id === 'CHI')
      )).toBe(true);
    });
  });

  describe('filterByPosition', () => {
    it('should be a function', () => {
      expect(typeof graphDataModule.filterByPosition).toBe('function');
    });

    it('should return only nodes matching the position', () => {
      const result = graphDataModule.filterByPosition(mockGraphData, 'SG');
      expect(result.nodes).toHaveLength(2);
      expect(result.nodes.every((n: NodeData) => n.position === 'SG')).toBe(true);
    });

    it('should return edges where both nodes match position filter', () => {
      const result = graphDataModule.filterByPosition(mockGraphData, 'SG');
      // Jordan-Pippen edge: Jordan is SG but Pippen is SF
      expect(result.edges).toHaveLength(0);
    });

    it('should return empty when position not found', () => {
      const result = graphDataModule.filterByPosition(mockGraphData, 'C');
      expect(result.nodes).toHaveLength(0);
    });

    it('should be case-insensitive for position', () => {
      const result1 = graphDataModule.filterByPosition(mockGraphData, 'sg');
      const result2 = graphDataModule.filterByPosition(mockGraphData, 'SG');
      expect(result1.nodes).toEqual(result2.nodes);
    });
  });

  describe('searchPlayers', () => {
    it('should be a function', () => {
      expect(typeof graphDataModule.searchPlayers).toBe('function');
    });

    it('should return matching nodes', () => {
      const result = graphDataModule.searchPlayers(mockGraphData, 'Jordan');
      expect(result).toHaveLength(1);
      expect(result[0].label).toBe('Michael Jordan');
    });

    it('should be case-insensitive', () => {
      const result1 = graphDataModule.searchPlayers(mockGraphData, 'jordan');
      const result2 = graphDataModule.searchPlayers(mockGraphData, 'JORDAN');
      expect(result1).toEqual(result2);
    });

    it('should match substring', () => {
      const result = graphDataModule.searchPlayers(mockGraphData, 'Le');
      expect(result.some((n: NodeData) => n.label === 'LeBron James')).toBe(true);
    });

    it('should return empty array when no match', () => {
      const result = graphDataModule.searchPlayers(mockGraphData, 'xyz123');
      expect(result).toHaveLength(0);
    });

    it('should return all nodes for empty query', () => {
      const result = graphDataModule.searchPlayers(mockGraphData, '');
      expect(result).toEqual(mockGraphData.nodes);
    });
  });

  describe('immutability', () => {
    it('filterByEra should not mutate original', () => {
      const originalNodeCount = mockGraphData.nodes.length;
      graphDataModule.filterByEra(mockGraphData, '2010s');
      expect(mockGraphData.nodes).toHaveLength(originalNodeCount);
    });

    it('filterByTeam should not mutate original', () => {
      const originalNodeCount = mockGraphData.nodes.length;
      graphDataModule.filterByTeam(mockGraphData, 'CHI');
      expect(mockGraphData.nodes).toHaveLength(originalNodeCount);
    });

    it('filterByPosition should not mutate original', () => {
      const originalNodeCount = mockGraphData.nodes.length;
      graphDataModule.filterByPosition(mockGraphData, 'PG');
      expect(mockGraphData.nodes).toHaveLength(originalNodeCount);
    });
  });

  describe('edge cases', () => {
    it('should handle empty graph data', () => {
      const emptyGraph: GraphData = { nodes: [], edges: [] };
      
      expect(graphDataModule.filterByEra(emptyGraph, '1990s').nodes).toHaveLength(0);
      expect(graphDataModule.filterByTeam(emptyGraph, 'CHI').nodes).toHaveLength(0);
      expect(graphDataModule.filterByPosition(emptyGraph, 'SG').nodes).toHaveLength(0);
      expect(graphDataModule.searchPlayers(emptyGraph, 'Jordan')).toHaveLength(0);
    });

    it('should handle nodes without edges', () => {
      const isolatedNode: NodeData = {
        id: 'player_999',
        label: 'Isolated Player',
        x: 0,
        y: 0,
        size: 5,
        color: '#000',
        position: 'C',
        era: '2020s',
        is_active: true,
        hof: false,
        draft_year: 2020,
        degree: 0,
        betweenness: 0,
        community: 99,
      };
      const graphWithIsolated: GraphData = {
        nodes: [...mockNodes, isolatedNode],
        edges: [...mockEdges],
      };

      const result = graphDataModule.filterByEra(graphWithIsolated, '2020s');
      expect(result.nodes).toHaveLength(1);
      expect(result.nodes[0].id).toBe('player_999');
    });
  });
});
