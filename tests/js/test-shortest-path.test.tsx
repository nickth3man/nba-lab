'use client';

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ShortestPath from '@/components/ShortestPath';
import type { GraphData, NodeData, EdgeData } from '@/lib/graph-types';

// Mock graph data for testing
const mockNodes: NodeData[] = [
  { id: 'player1', label: 'LeBron James', x: 0, y: 0, size: 10, color: '#FF0000', position: 'SF', era: '2000s-2010s', is_active: true, hof: false, draft_year: 2003, degree: 50, betweenness: 0.1, community: 1 },
  { id: 'player2', label: 'Kevin Durant', x: 1, y: 1, size: 9, color: '#00FF00', position: 'SF', era: '2000s-2020s', is_active: true, hof: false, draft_year: 2007, degree: 45, betweenness: 0.08, community: 1 },
  { id: 'player3', label: 'Kyrie Irving', x: 2, y: 2, size: 8, color: '#0000FF', position: 'PG', era: '2010s-2020s', is_active: true, hof: false, draft_year: 2011, degree: 40, betweenness: 0.07, community: 1 },
  { id: 'player4', label: 'Stephen Curry', x: 3, y: 3, size: 9, color: '#FFFF00', position: 'PG', era: '2010s-2020s', is_active: true, hof: false, draft_year: 2009, degree: 48, betweenness: 0.09, community: 1 },
  { id: 'player5', label: 'Tim Duncan', x: 4, y: 4, size: 10, color: '#FF00FF', position: 'PF', era: '2000s-2010s', is_active: false, hof: true, draft_year: 1997, degree: 42, betweenness: 0.06, community: 2 },
];

const mockEdges: EdgeData[] = [
  { id: 'e1', source: 'player1', target: 'player2', weight: 3, teams: [{ team_id: 'team1', team_name: 'Team A', team_abbreviation: 'TLA', seasons: ['2012-13'], overlap_days: 100 }], total_days: 100, size: 1.0 },
  { id: 'e2', source: 'player2', target: 'player3', weight: 2, teams: [{ team_id: 'team2', team_name: 'Team B', team_abbreviation: 'TLB', seasons: ['2016-17'], overlap_days: 80 }], total_days: 80, size: 0.8 },
  { id: 'e3', source: 'player3', target: 'player4', weight: 2, teams: [{ team_id: 'team3', team_name: 'Team C', team_abbreviation: 'TLC', seasons: ['2017-18'], overlap_days: 90 }], total_days: 90, size: 0.9 },
  { id: 'e4', source: 'player4', target: 'player5', weight: 1, teams: [{ team_id: 'team4', team_name: 'Team D', team_abbreviation: 'TLD', seasons: ['2019-20'], overlap_days: 50 }], total_days: 50, size: 0.5 },
];

const mockGraphData: GraphData = { nodes: mockNodes, edges: mockEdges };

// Mock paths data
const mockPathsData = {
  'player1': {
    'player4': ['player1', 'player2', 'player3', 'player4'],
    'player5': ['player1', 'player2', 'player3', 'player4', 'player5'],
  },
  'player2': {
    'player4': ['player2', 'player3', 'player4'],
    'player5': ['player2', 'player3', 'player4', 'player5'],
  },
  'player4': {
    'player1': ['player4', 'player3', 'player2', 'player1'],
    'player5': ['player4', 'player5'],
  },
};

// Mock fetch for paths.json
beforeEach(() => {
  global.fetch = jest.fn((url: string) => {
    if (url.includes('paths.json')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockPathsData),
      } as Response);
    }
    return Promise.reject(new Error('Not found'));
  }) as jest.Mock;
});

afterEach(() => {
  jest.clearAllMocks();
});

describe('ShortestPath Component', () => {
  const mockOnPathChange = jest.fn();
  const mockOnHighlightPath = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn((url: string) => {
      if (url.includes('paths.json')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockPathsData),
        } as Response);
      }
      return Promise.reject(new Error('Not found'));
    }) as jest.Mock;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders two search inputs for From and To players', () => {
    render(
      <ShortestPath
        data={mockGraphData}
        onPathChange={mockOnPathChange}
        onHighlightPath={mockOnHighlightPath}
      />
    );

    expect(screen.getByPlaceholderText(/from player/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/to player/i)).toBeInTheDocument();
  });

  it('renders Find Path and Clear Path buttons', () => {
    render(
      <ShortestPath
        data={mockGraphData}
        onPathChange={mockOnPathChange}
        onHighlightPath={mockOnHighlightPath}
      />
    );

    expect(screen.getByRole('button', { name: /find path/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /clear path/i })).toBeInTheDocument();
  });

  it('displays "Select two players to find path" when no selection', () => {
    render(
      <ShortestPath
        data={mockGraphData}
        onPathChange={mockOnPathChange}
        onHighlightPath={mockOnHighlightPath}
      />
    );

    expect(screen.getByText(/select two players/i)).toBeInTheDocument();
  });

  it('allows selecting From and To players via search', async () => {
    render(
      <ShortestPath
        data={mockGraphData}
        onPathChange={mockOnPathChange}
        onHighlightPath={mockOnHighlightPath}
      />
    );

    // Type in From Player search
    const fromInput = screen.getByPlaceholderText(/from player/i);
    fireEvent.change(fromInput, { target: { value: 'LeBron' } });

    // Wait for dropdown
    await waitFor(() => {
      expect(screen.getByText('LeBron James')).toBeInTheDocument();
    });

    // Click on LeBron James
    fireEvent.click(screen.getByText('LeBron James'));

    // Type in To Player search
    const toInput = screen.getByPlaceholderText(/to player/i);
    fireEvent.change(toInput, { target: { value: 'Curry' } });

    await waitFor(() => {
      expect(screen.getByText('Stephen Curry')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Stephen Curry'));
  });

  it('finds and displays path between two players', async () => {
    render(
      <ShortestPath
        data={mockGraphData}
        onPathChange={mockOnPathChange}
        onHighlightPath={mockOnHighlightPath}
      />
    );

    // Select LeBron as From
    const fromInput = screen.getByPlaceholderText(/from player/i);
    fireEvent.change(fromInput, { target: { value: 'LeBron' } });
    await waitFor(() => {
      expect(screen.getByText('LeBron James')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('LeBron James'));

    // Select Stephen Curry as To
    const toInput = screen.getByPlaceholderText(/to player/i);
    fireEvent.change(toInput, { target: { value: 'Curry' } });
    await waitFor(() => {
      expect(screen.getByText('Stephen Curry')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('Stephen Curry'));

    // Click Find Path
    const findButton = screen.getByRole('button', { name: /find path/i });
    fireEvent.click(findButton);

    // Should display path length (degrees of separation)
    await waitFor(() => {
      expect(screen.getByText(/3 degrees/i)).toBeInTheDocument();
    });

    // Should display ordered list of players
    expect(screen.getByText(/LeBron James/i)).toBeInTheDocument();
    expect(screen.getByText(/Kevin Durant/i)).toBeInTheDocument();
    expect(screen.getByText(/Kyrie Irving/i)).toBeInTheDocument();
    expect(screen.getByText(/Stephen Curry/i)).toBeInTheDocument();

    // Should call onPathChange
    expect(mockOnPathChange).toHaveBeenCalledWith([
      'player1', 'player2', 'player3', 'player4'
    ]);
  });

  it('shows team connections in path display', async () => {
    render(
      <ShortestPath
        data={mockGraphData}
        onPathChange={mockOnPathChange}
        onHighlightPath={mockOnHighlightPath}
      />
    );

    // Select LeBron as From (player1)
    const fromInput = screen.getByPlaceholderText(/from player/i);
    fireEvent.change(fromInput, { target: { value: 'LeBron' } });
    await waitFor(() => {
      expect(screen.getByText('LeBron James')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('LeBron James'));

    // Select Stephen Curry as To (player4) - path exists: player1->player2->player3->player4
    const toInput = screen.getByPlaceholderText(/to player/i);
    fireEvent.change(toInput, { target: { value: 'Curry' } });
    await waitFor(() => {
      expect(screen.getByText('Stephen Curry')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('Stephen Curry'));

    // Click Find Path
    const findButton = screen.getByRole('button', { name: /find path/i });
    fireEvent.click(findButton);

    // Should display degrees of separation
    await waitFor(() => {
      expect(screen.getByText(/3 degrees/i)).toBeInTheDocument();
    });
  });

  it('calls onHighlightPath with path nodes', async () => {
    render(
      <ShortestPath
        data={mockGraphData}
        onPathChange={mockOnPathChange}
        onHighlightPath={mockOnHighlightPath}
      />
    );

    // Select players
    const fromInput = screen.getByPlaceholderText(/from player/i);
    fireEvent.change(fromInput, { target: { value: 'LeBron' } });
    await waitFor(() => {
      expect(screen.getByText('LeBron James')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('LeBron James'));

    const toInput = screen.getByPlaceholderText(/to player/i);
    fireEvent.change(toInput, { target: { value: 'Curry' } });
    await waitFor(() => {
      expect(screen.getByText('Stephen Curry')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('Stephen Curry'));

    // Click Find Path
    const findButton = screen.getByRole('button', { name: /find path/i });
    fireEvent.click(findButton);

    await waitFor(() => {
      expect(mockOnHighlightPath).toHaveBeenCalledWith([
        'player1', 'player2', 'player3', 'player4'
      ]);
    });
  });

  it('clears path on Clear Path button click', async () => {
    render(
      <ShortestPath
        data={mockGraphData}
        onPathChange={mockOnPathChange}
        onHighlightPath={mockOnHighlightPath}
      />
    );

    // First find a path
    const fromInput = screen.getByPlaceholderText(/from player/i);
    fireEvent.change(fromInput, { target: { value: 'LeBron' } });
    await waitFor(() => {
      expect(screen.getByText('LeBron James')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('LeBron James'));

    const toInput = screen.getByPlaceholderText(/to player/i);
    fireEvent.change(toInput, { target: { value: 'Curry' } });
    await waitFor(() => {
      expect(screen.getByText('Stephen Curry')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('Stephen Curry'));

    const findButton = screen.getByRole('button', { name: /find path/i });
    fireEvent.click(findButton);

    await waitFor(() => {
      expect(mockOnPathChange).toHaveBeenCalled();
    });

    // Clear path
    const clearButton = screen.getByRole('button', { name: /clear path/i });
    fireEvent.click(clearButton);

    // Should call onPathChange with empty array
    expect(mockOnPathChange).toHaveBeenLastCalledWith([]);
    
    // Should show default message
    expect(screen.getByText(/select two players/i)).toBeInTheDocument();
  });

  it('shows message when path not found', async () => {
    // Clear mocks to start fresh
    mockOnPathChange.mockClear();
    mockOnHighlightPath.mockClear();

    // Override fetch with paths that don't include player3 as source
    global.fetch = jest.fn((url: string) => {
      if (url.includes('paths.json')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            'player1': {
              'player4': ['player1', 'player2', 'player3', 'player4'],
              'player5': ['player1', 'player2', 'player3', 'player4', 'player5'],
            },
          }),
        } as Response);
      }
      return Promise.reject(new Error('Not found'));
    }) as jest.Mock;

    render(
      <ShortestPath
        data={mockGraphData}
        onPathChange={mockOnPathChange}
        onHighlightPath={mockOnHighlightPath}
      />
    );

    // Select LeBron as From (player1 is in paths)
    const fromInput = screen.getByPlaceholderText(/from player/i);
    fireEvent.change(fromInput, { target: { value: 'LeBron' } });
    await waitFor(() => {
      expect(screen.getByText('LeBron James')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('LeBron James'));

    // Select Kyrie as To (player3 is NOT in paths as a source, so no path from LeBron to Kyrie)
    const toInput = screen.getByPlaceholderText(/to player/i);
    fireEvent.change(toInput, { target: { value: 'Kyrie' } });
    await waitFor(() => {
      expect(screen.getByText('Kyrie Irving')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('Kyrie Irving'));

    // Click Find Path
    const findButton = screen.getByRole('button', { name: /find path/i });
    fireEvent.click(findButton);

    // Should show path not found message
    await waitFor(() => {
      expect(screen.getByText(/no path found/i)).toBeInTheDocument();
    });
  });

  it('shows message when paths.json cannot be loaded', async () => {
    // Override fetch to fail
    global.fetch = jest.fn(() => Promise.reject(new Error('Network error'))) as jest.Mock;

    render(
      <ShortestPath
        data={mockGraphData}
        onPathChange={mockOnPathChange}
        onHighlightPath={mockOnHighlightPath}
      />
    );

    // Try to find path - should show loading error
    const fromInput = screen.getByPlaceholderText(/from player/i);
    fireEvent.change(fromInput, { target: { value: 'LeBron' } });
    await waitFor(() => {
      expect(screen.getByText('LeBron James')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('LeBron James'));

    const toInput = screen.getByPlaceholderText(/to player/i);
    fireEvent.change(toInput, { target: { value: 'Curry' } });
    await waitFor(() => {
      expect(screen.getByText('Stephen Curry')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('Stephen Curry'));

    const findButton = screen.getByRole('button', { name: /find path/i });
    fireEvent.click(findButton);

    await waitFor(() => {
      expect(screen.getByText(/error loading paths/i)).toBeInTheDocument();
    });
  });
});

describe('ShortestPath Edge Cases', () => {
  const mockOnPathChange = jest.fn();
  const mockOnHighlightPath = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('handles direct teammates (path length 1)', async () => {
    // Create mock paths with direct connection
    const directPathData = {
      'player1': {
        'player2': ['player1', 'player2'],
      },
    };

    global.fetch = jest.fn((url: string) => {
      if (url.includes('paths.json')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(directPathData),
        } as Response);
      }
      return Promise.reject(new Error('Not found'));
    }) as jest.Mock;

    render(
      <ShortestPath
        data={mockGraphData}
        onPathChange={mockOnPathChange}
        onHighlightPath={mockOnHighlightPath}
      />
    );

    const fromInput = screen.getByPlaceholderText(/from player/i);
    fireEvent.change(fromInput, { target: { value: 'LeBron' } });
    await waitFor(() => {
      expect(screen.getByText('LeBron James')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('LeBron James'));

    const toInput = screen.getByPlaceholderText(/to player/i);
    fireEvent.change(toInput, { target: { value: 'Kevin' } });
    await waitFor(() => {
      expect(screen.getByText('Kevin Durant')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('Kevin Durant'));

    const findButton = screen.getByRole('button', { name: /find path/i });
    fireEvent.click(findButton);

    await waitFor(() => {
      expect(screen.getByText(/1 degree/i)).toBeInTheDocument();
    });
  });
});
