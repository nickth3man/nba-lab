/**
 * TDD Tests for PlayerTooltip Component
 * Hover tooltips and click drill-down for NBA teammate network
 */

import React from "react";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import "@testing-library/jest-dom";
import PlayerTooltip from "@/components/PlayerTooltip";
import type { GraphData, NodeData, EdgeData } from "@/lib/graph-types";

const createMockNode = (id: string, overrides: Partial<NodeData> = {}): NodeData => ({
  id,
  label: `Player ${id}`,
  x: Math.random() * 1000,
  y: Math.random() * 1000,
  size: 5 + Math.random() * 10,
  color: "#" + Math.floor(Math.random() * 16777215).toString(16),
  position: "SG",
  era: "1990s",
  is_active: false,
  hof: false,
  draft_year: 2000,
  degree: 10,
  betweenness: 0.01,
  community: 1,
  ...overrides,
});

const createMockEdge = (
  id: string,
  source: string,
  target: string,
  overrides: Partial<EdgeData> = {},
): EdgeData => ({
  id,
  source,
  target,
  weight: 1,
  teams: [
    {
      team_id: "TEAM1",
      team_name: "Chicago Bulls",
      team_abbreviation: "CHI",
      seasons: ["1990-91", "1991-92"],
      overlap_days: 730,
    },
  ],
  total_days: 730,
  size: 1,
  ...overrides,
});

const createMockGraphData = (nodes: NodeData[], edges: EdgeData[]): GraphData => ({
  nodes,
  edges,
});

describe("PlayerTooltip Component", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe("Rendering", () => {
    it("does not render when player is null", () => {
      const mockData = createMockGraphData([], []);
      const { container } = render(
        <PlayerTooltip player={null} graphData={mockData} onClose={jest.fn()} />,
      );

      expect(container.firstChild).toBeNull();
    });

    it("does not render immediately when player is provided", () => {
      const node = createMockNode("1", { label: "Michael Jordan" });
      const mockData = createMockGraphData([node], []);

      render(<PlayerTooltip player={node} graphData={mockData} onClose={jest.fn()} />);

      expect(screen.queryByText("Michael Jordan")).not.toBeInTheDocument();
    });

    it("renders player name after 100ms delay", () => {
      const node = createMockNode("1", { label: "Michael Jordan" });
      const mockData = createMockGraphData([node], []);

      render(<PlayerTooltip player={node} graphData={mockData} onClose={jest.fn()} />);

      act(() => {
        jest.advanceTimersByTime(100);
      });

      expect(screen.getByText("Michael Jordan")).toBeInTheDocument();
    });

    it("renders player position", () => {
      const node = createMockNode("1", { position: "PG" });
      const mockData = createMockGraphData([node], []);

      render(<PlayerTooltip player={node} graphData={mockData} onClose={jest.fn()} />);

      act(() => {
        jest.advanceTimersByTime(100);
      });

      expect(screen.getByText("PG")).toBeInTheDocument();
    });

    it("renders player era", () => {
      const node = createMockNode("1", { era: "1980s" });
      const mockData = createMockGraphData([node], []);

      render(<PlayerTooltip player={node} graphData={mockData} onClose={jest.fn()} />);

      act(() => {
        jest.advanceTimersByTime(100);
      });

      expect(screen.getByText("1980s")).toBeInTheDocument();
    });

    it("renders Hall of Fame status as Yes when hof is true", () => {
      const node = createMockNode("1", { hof: true });
      const mockData = createMockGraphData([node], []);

      render(<PlayerTooltip player={node} graphData={mockData} onClose={jest.fn()} />);

      act(() => {
        jest.advanceTimersByTime(100);
      });

      expect(screen.getByText("Hall of Fame: Yes")).toBeInTheDocument();
    });

    it("renders Hall of Fame status as No when hof is false", () => {
      const node = createMockNode("1", { hof: false });
      const mockData = createMockGraphData([node], []);

      render(<PlayerTooltip player={node} graphData={mockData} onClose={jest.fn()} />);

      act(() => {
        jest.advanceTimersByTime(100);
      });

      expect(screen.getByText("Hall of Fame: No")).toBeInTheDocument();
    });

    it("renders degree centrality value", () => {
      const node = createMockNode("1", { degree: 42 });
      const mockData = createMockGraphData([node], []);

      render(<PlayerTooltip player={node} graphData={mockData} onClose={jest.fn()} />);

      act(() => {
        jest.advanceTimersByTime(100);
      });

      expect(screen.getByText(/Degree Centrality: 42/)).toBeInTheDocument();
    });

    it('renders "No teammates" when player has no edges', () => {
      const node = createMockNode("1");
      const mockData = createMockGraphData([node], []);

      render(<PlayerTooltip player={node} graphData={mockData} onClose={jest.fn()} />);

      act(() => {
        jest.advanceTimersByTime(100);
      });

      expect(screen.getByText("No teammate data available")).toBeInTheDocument();
    });
  });

  describe("Top 5 Teammates", () => {
    it("renders up to 5 teammates sorted by duration", () => {
      const playerNode = createMockNode("1", { label: "Michael Jordan" });
      const teammate1 = createMockNode("2", { label: "Scottie Pippen" });
      const teammate2 = createMockNode("3", { label: "Phil Jackson" });
      const teammate3 = createMockNode("4", { label: "Dennis Rodman" });
      const teammate4 = createMockNode("5", { label: "Horace Grant" });
      const teammate5 = createMockNode("6", { label: "Bob Love" });
      const teammate6 = createMockNode("7", { label: "Jerry Sloan" });

      const edges: EdgeData[] = [
        createMockEdge("e1", "1", "2", {
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
        }),
        createMockEdge("e2", "1", "3", {
          teams: [
            {
              team_id: "CHI",
              team_name: "Chicago Bulls",
              team_abbreviation: "CHI",
              seasons: ["1989-90"],
              overlap_days: 365,
            },
          ],
          total_days: 365,
        }),
        createMockEdge("e3", "1", "4", {
          teams: [
            {
              team_id: "CHI",
              team_name: "Chicago Bulls",
              team_abbreviation: "CHI",
              seasons: ["1995-96"],
              overlap_days: 365,
            },
          ],
          total_days: 365,
        }),
        createMockEdge("e4", "1", "5", {
          teams: [
            {
              team_id: "CHI",
              team_name: "Chicago Bulls",
              team_abbreviation: "CHI",
              seasons: ["1987-88"],
              overlap_days: 365,
            },
          ],
          total_days: 365,
        }),
        createMockEdge("e5", "1", "6", {
          teams: [
            {
              team_id: "CHI",
              team_name: "Chicago Bulls",
              team_abbreviation: "CHI",
              seasons: ["1971-72"],
              overlap_days: 365,
            },
          ],
          total_days: 365,
        }),
        createMockEdge("e6", "1", "7", {
          teams: [
            {
              team_id: "CHI",
              team_name: "Chicago Bulls",
              team_abbreviation: "CHI",
              seasons: ["1966-67"],
              overlap_days: 365,
            },
          ],
          total_days: 365,
        }),
      ];

      const mockData = createMockGraphData(
        [playerNode, teammate1, teammate2, teammate3, teammate4, teammate5, teammate6],
        edges,
      );

      render(<PlayerTooltip player={playerNode} graphData={mockData} onClose={jest.fn()} />);

      act(() => {
        jest.advanceTimersByTime(100);
      });

      expect(screen.getByText("Top 5 Teammates")).toBeInTheDocument();

      const teammateElements = screen.getAllByTestId(/teammate-/);
      expect(teammateElements.length).toBe(5);
    });

    it("shows teammate name, team, and seasons together", () => {
      const playerNode = createMockNode("1", { label: "Michael Jordan" });
      const teammate1 = createMockNode("2", { label: "Scottie Pippen" });

      const edges: EdgeData[] = [
        createMockEdge("e1", "1", "2", {
          teams: [
            {
              team_id: "CHI",
              team_name: "Chicago Bulls",
              team_abbreviation: "CHI",
              seasons: ["1990-91", "1991-92", "1992-93"],
              overlap_days: 1095,
            },
          ],
          total_days: 1095,
        }),
      ];

      const mockData = createMockGraphData([playerNode, teammate1], edges);

      render(<PlayerTooltip player={playerNode} graphData={mockData} onClose={jest.fn()} />);

      act(() => {
        jest.advanceTimersByTime(100);
      });

      expect(screen.getByText("Scottie Pippen")).toBeInTheDocument();
      expect(screen.getByText(/Chicago Bulls/)).toBeInTheDocument();
      expect(screen.getByText(/3 seasons/)).toBeInTheDocument();
    });

    it("sorts teammates by total overlap days descending", () => {
      const playerNode = createMockNode("1", { label: "Player 1" });
      const teammate1 = createMockNode("2", { label: "Short Tenure" });
      const teammate2 = createMockNode("3", { label: "Long Tenure" });

      const edges: EdgeData[] = [
        createMockEdge("e1", "1", "2", {
          teams: [
            {
              team_id: "T1",
              team_name: "Team A",
              team_abbreviation: "T1",
              seasons: ["2020-21"],
              overlap_days: 100,
            },
          ],
          total_days: 100,
        }),
        createMockEdge("e2", "1", "3", {
          teams: [
            {
              team_id: "T2",
              team_name: "Team B",
              team_abbreviation: "T2",
              seasons: ["2010-11", "2011-12", "2012-13", "2013-14"],
              overlap_days: 1460,
            },
          ],
          total_days: 1460,
        }),
      ];

      const mockData = createMockGraphData([playerNode, teammate1, teammate2], edges);

      render(<PlayerTooltip player={playerNode} graphData={mockData} onClose={jest.fn()} />);

      act(() => {
        jest.advanceTimersByTime(100);
      });

      const teammates = screen.getAllByTestId(/teammate-/);
      expect(teammates[0]).toHaveTextContent("Long Tenure");
      expect(teammates[1]).toHaveTextContent("Short Tenure");
    });
  });

  describe("Hover Delay", () => {
    it("does not show tooltip before 100ms", () => {
      const node = createMockNode("1", { label: "Michael Jordan" });
      const mockData = createMockGraphData([node], []);

      render(<PlayerTooltip player={node} graphData={mockData} onClose={jest.fn()} />);

      act(() => {
        jest.advanceTimersByTime(50);
      });

      expect(screen.queryByText("Michael Jordan")).not.toBeInTheDocument();
    });

    it("shows tooltip after 100ms", () => {
      const node = createMockNode("1", { label: "Michael Jordan" });
      const mockData = createMockGraphData([node], []);

      render(<PlayerTooltip player={node} graphData={mockData} onClose={jest.fn()} />);

      act(() => {
        jest.advanceTimersByTime(100);
      });

      expect(screen.getByText("Michael Jordan")).toBeInTheDocument();
    });

    it("calls onOpen after 100ms delay", () => {
      const node = createMockNode("1", { label: "Michael Jordan" });
      const mockData = createMockGraphData([node], []);
      const onOpen = jest.fn();

      render(
        <PlayerTooltip player={node} graphData={mockData} onClose={jest.fn()} onOpen={onOpen} />,
      );

      act(() => {
        jest.advanceTimersByTime(50);
      });

      expect(onOpen).not.toHaveBeenCalled();

      act(() => {
        jest.advanceTimersByTime(50);
      });

      expect(onOpen).toHaveBeenCalledTimes(1);
    });
  });

  describe("Click Drill-Down", () => {
    it("calls onHighlight when tooltip is clicked", () => {
      const node = createMockNode("1", { label: "Michael Jordan" });
      const mockData = createMockGraphData([node], []);
      const onHighlight = jest.fn();

      render(
        <PlayerTooltip
          player={node}
          graphData={mockData}
          onClose={jest.fn()}
          onHighlight={onHighlight}
        />,
      );

      act(() => {
        jest.advanceTimersByTime(100);
      });

      const tooltip = screen.getByTestId("player-tooltip");
      fireEvent.click(tooltip);

      expect(onHighlight).toHaveBeenCalledWith("1");
    });

    it("calls onClose when close button is clicked", () => {
      const node = createMockNode("1", { label: "Michael Jordan" });
      const mockData = createMockGraphData([node], []);
      const onClose = jest.fn();

      render(<PlayerTooltip player={node} graphData={mockData} onClose={onClose} />);

      act(() => {
        jest.advanceTimersByTime(100);
      });

      const closeButton = screen.getByTestId("tooltip-close");
      fireEvent.click(closeButton);

      expect(onClose).toHaveBeenCalled();
    });

    it("toggles highlight state on multiple clicks", () => {
      const node = createMockNode("1", { label: "Michael Jordan" });
      const mockData = createMockGraphData([node], []);
      const onHighlight = jest.fn();

      render(
        <PlayerTooltip
          player={node}
          graphData={mockData}
          onClose={jest.fn()}
          onHighlight={onHighlight}
        />,
      );

      act(() => {
        jest.advanceTimersByTime(100);
      });

      const tooltip = screen.getByTestId("player-tooltip");

      fireEvent.click(tooltip);
      expect(onHighlight).toHaveBeenCalledWith("1");

      onHighlight.mockClear();

      fireEvent.click(tooltip);
      expect(onHighlight).toHaveBeenCalledWith("1");
    });
  });

  describe("Styling", () => {
    it("has dark background style", () => {
      const node = createMockNode("1", { label: "Michael Jordan" });
      const mockData = createMockGraphData([node], []);

      render(<PlayerTooltip player={node} graphData={mockData} onClose={jest.fn()} />);

      act(() => {
        jest.advanceTimersByTime(100);
      });

      const tooltip = screen.getByTestId("player-tooltip");
      expect(tooltip).toHaveStyle({
        backgroundColor: "rgba(0, 0, 0, 0.92)",
      });
    });

    it("has pointer cursor", () => {
      const node = createMockNode("1", { label: "Michael Jordan" });
      const mockData = createMockGraphData([node], []);

      render(<PlayerTooltip player={node} graphData={mockData} onClose={jest.fn()} />);

      act(() => {
        jest.advanceTimersByTime(100);
      });

      const tooltip = screen.getByTestId("player-tooltip");
      expect(tooltip).toHaveStyle({
        cursor: "pointer",
      });
    });
  });

  describe("Edge Cases", () => {
    it("handles player with multiple teams on one edge", () => {
      const playerNode = createMockNode("1", { label: "Kobe Bryant" });
      const teammate1 = createMockNode("2", { label: "Shaquille O'Neal" });

      const edges: EdgeData[] = [
        createMockEdge("e1", "1", "2", {
          teams: [
            {
              team_id: "LAL",
              team_name: "Los Angeles Lakers",
              team_abbreviation: "LAL",
              seasons: ["1996-97", "1997-98", "1998-99", "1999-00"],
              overlap_days: 1461,
            },
            {
              team_id: "MIA",
              team_name: "Miami Heat",
              team_abbreviation: "MIA",
              seasons: ["2004-05"],
              overlap_days: 365,
            },
          ],
          total_days: 1826,
        }),
      ];

      const mockData = createMockGraphData([playerNode, teammate1], edges);

      render(<PlayerTooltip player={playerNode} graphData={mockData} onClose={jest.fn()} />);

      act(() => {
        jest.advanceTimersByTime(100);
      });

      expect(screen.getByText(/Los Angeles Lakers/)).toBeInTheDocument();
    });

    it("handles teammate with empty seasons array", () => {
      const playerNode = createMockNode("1", { label: "Player 1" });
      const teammate1 = createMockNode("2", { label: "Weird Teammate" });

      const edges: EdgeData[] = [
        createMockEdge("e1", "1", "2", {
          teams: [
            {
              team_id: "T1",
              team_name: "Team",
              team_abbreviation: "T1",
              seasons: [],
              overlap_days: 0,
            },
          ],
          total_days: 0,
        }),
      ];

      const mockData = createMockGraphData([playerNode, teammate1], edges);

      render(<PlayerTooltip player={playerNode} graphData={mockData} onClose={jest.fn()} />);

      act(() => {
        jest.advanceTimersByTime(100);
      });

      expect(screen.getByText("Weird Teammate")).toBeInTheDocument();
      expect(screen.getByText(/0 seasons/)).toBeInTheDocument();
    });
  });

  describe("Visibility Behavior", () => {
    it("hides tooltip when player becomes null", () => {
      const node = createMockNode("1", { label: "Michael Jordan" });
      const mockData = createMockGraphData([node], []);

      const { rerender } = render(
        <PlayerTooltip player={node} graphData={mockData} onClose={jest.fn()} />,
      );

      act(() => {
        jest.advanceTimersByTime(100);
      });

      expect(screen.getByText("Michael Jordan")).toBeInTheDocument();

      rerender(<PlayerTooltip player={null} graphData={mockData} onClose={jest.fn()} />);

      act(() => {
        jest.advanceTimersByTime(0);
      });

      expect(screen.queryByText("Michael Jordan")).not.toBeInTheDocument();
    });
  });
});

describe("PlayerTooltip Integration with GraphData", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("finds top 5 teammates correctly from graph edges", () => {
    const playerNode = createMockNode("p1", { label: "Player 1" });

    const teammates = Array.from({ length: 10 }, (_, i) =>
      createMockNode(`t${i}`, { label: `Teammate ${i}` }),
    );

    const edges: EdgeData[] = teammates.map((tm, i) =>
      createMockEdge(`e${i}`, "p1", tm.id, {
        teams: [
          {
            team_id: "T1",
            team_name: "Team",
            team_abbreviation: "T1",
            seasons: [`${2000 + i}-${2001 + i}`],
            overlap_days: (10 - i) * 100,
          },
        ],
        total_days: (10 - i) * 100,
      }),
    );

    const mockData = createMockGraphData([playerNode, ...teammates], edges);

    render(<PlayerTooltip player={playerNode} graphData={mockData} onClose={jest.fn()} />);

    act(() => {
      jest.advanceTimersByTime(100);
    });

    const teammateElements = screen.getAllByTestId(/teammate-/);
    expect(teammateElements.length).toBe(5);
    expect(teammateElements[0]).toHaveTextContent("Teammate 0");
  });
});
