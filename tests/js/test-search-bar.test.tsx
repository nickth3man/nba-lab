/**
 * TDD Tests for SearchBar Component
 * Player search with autocomplete functionality
 */

import React from "react";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import "@testing-library/jest-dom";
import SearchBar from "@/components/SearchBar";
import { searchPlayers } from "@/lib/graph-data";
import type { GraphData, NodeData } from "@/lib/graph-types";

// Mock graph-data
jest.mock("@/lib/graph-data", () => ({
  searchPlayers: jest.fn(),
}));

const mockSearchPlayers = searchPlayers as jest.MockedFunction<typeof searchPlayers>;

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

const createMockGraphData = (nodes: NodeData[]): GraphData => ({
  nodes,
  edges: [],
});

describe("SearchBar Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe("Rendering", () => {
    it("renders input element", () => {
      const mockData = createMockGraphData([createMockNode("1", { label: "Michael Jordan" })]);
      mockSearchPlayers.mockReturnValue([]);

      render(<SearchBar data={mockData} onSelect={jest.fn()} />);

      const input = screen.getByRole("textbox");
      expect(input).toBeInTheDocument();
    });

    it("renders with placeholder text", () => {
      const mockData = createMockGraphData([createMockNode("1", { label: "Michael Jordan" })]);
      mockSearchPlayers.mockReturnValue([]);

      render(<SearchBar data={mockData} onSelect={jest.fn()} />);

      const input = screen.getByRole("textbox");
      expect(input).toHaveAttribute("placeholder", "Search players...");
    });

    it("renders without dropdown initially", () => {
      const mockData = createMockGraphData([createMockNode("1", { label: "Michael Jordan" })]);
      mockSearchPlayers.mockReturnValue([]);

      render(<SearchBar data={mockData} onSelect={jest.fn()} />);

      // Dropdown should not be visible initially
      expect(screen.queryByText("No players found")).not.toBeInTheDocument();
    });
  });

  describe("Autocomplete Results", () => {
    it("shows matching players after debounce", async () => {
      const mockData = createMockGraphData([
        createMockNode("1", { label: "Michael Jordan", position: "SG", era: "1990s" }),
        createMockNode("2", { label: "Michael Cooper", position: "PG", era: "1980s" }),
        createMockNode("3", { label: "LeBron James", position: "SF", era: "2010s" }),
      ]);
      mockSearchPlayers.mockImplementation((data, query) => {
        return data.nodes.filter((n) => n.label.toLowerCase().includes(query.toLowerCase()));
      });

      render(<SearchBar data={mockData} onSelect={jest.fn()} />);

      const input = screen.getByRole("textbox");
      fireEvent.change(input, { target: { value: "Michael" } });

      // Debounce delay is 200ms, so advance timers
      act(() => {
        jest.advanceTimersByTime(200);
      });

      await waitFor(() => {
        const items = screen.queryAllByTestId(/player-result/);
        expect(items.length).toBe(2);
      });
    });

    it("displays player name, position, and era in dropdown", async () => {
      const mockData = createMockGraphData([
        createMockNode("1", { label: "Michael Jordan", position: "SG", era: "1990s" }),
      ]);
      mockSearchPlayers.mockReturnValue([
        createMockNode("1", { label: "Michael Jordan", position: "SG", era: "1990s" }),
      ]);

      render(<SearchBar data={mockData} onSelect={jest.fn()} />);

      const input = screen.getByRole("textbox");
      fireEvent.change(input, { target: { value: "Jordan" } });

      act(() => {
        jest.advanceTimersByTime(200);
      });

      await waitFor(() => {
        // Check player name
        expect(screen.getByText("Michael Jordan")).toBeInTheDocument();
        // Check position
        expect(screen.getByText("SG")).toBeInTheDocument();
        // Check era
        expect(screen.getByText("1990s")).toBeInTheDocument();
      });
    });

    it('shows "No players found" when no matches', async () => {
      const mockData = createMockGraphData([createMockNode("1", { label: "Michael Jordan" })]);
      mockSearchPlayers.mockReturnValue([]);

      render(<SearchBar data={mockData} onSelect={jest.fn()} />);

      const input = screen.getByRole("textbox");
      fireEvent.change(input, { target: { value: "xyz123" } });

      act(() => {
        jest.advanceTimersByTime(200);
      });

      await waitFor(() => {
        expect(screen.getByText("No players found")).toBeInTheDocument();
      });
    });

    it("limits results to maximum 100 players", async () => {
      // Create 150 mock nodes
      const nodes = Array.from({ length: 150 }, (_, i) =>
        createMockNode(`player_${i}`, { label: `Player ${i}` }),
      );
      const mockData = createMockGraphData(nodes);
      mockSearchPlayers.mockImplementation((data, query) => {
        return data.nodes.filter((n) => n.label.toLowerCase().includes(query.toLowerCase()));
      });

      render(<SearchBar data={mockData} onSelect={jest.fn()} />);

      const input = screen.getByRole("textbox");
      fireEvent.change(input, { target: { value: "Player" } });

      act(() => {
        jest.advanceTimersByTime(200);
      });

      await waitFor(() => {
        const items = screen.queryAllByTestId(/player-result-/);
        expect(items.length).toBe(100); // Should be capped at 100
      });
    });
  });

  describe("Player Selection", () => {
    it("calls onSelect with correct nodeId when player is clicked", async () => {
      const mockData = createMockGraphData([
        createMockNode("1", { label: "Michael Jordan", position: "SG", era: "1990s" }),
      ]);
      mockSearchPlayers.mockReturnValue([
        createMockNode("1", { label: "Michael Jordan", position: "SG", era: "1990s" }),
      ]);

      const onSelect = jest.fn();
      render(<SearchBar data={mockData} onSelect={onSelect} />);

      const input = screen.getByRole("textbox");
      fireEvent.change(input, { target: { value: "Jordan" } });

      act(() => {
        jest.advanceTimersByTime(200);
      });

      await waitFor(() => {
        const playerItem = screen.getByTestId("player-result-0");
        fireEvent.click(playerItem);
      });

      expect(onSelect).toHaveBeenCalledWith("1");
    });

    it("clears input after selection", async () => {
      const mockData = createMockGraphData([
        createMockNode("1", { label: "Michael Jordan", position: "SG", era: "1990s" }),
      ]);
      mockSearchPlayers.mockReturnValue([
        createMockNode("1", { label: "Michael Jordan", position: "SG", era: "1990s" }),
      ]);

      const onSelect = jest.fn();
      render(<SearchBar data={mockData} onSelect={onSelect} />);

      const input = screen.getByRole("textbox");
      fireEvent.change(input, { target: { value: "Jordan" } });

      act(() => {
        jest.advanceTimersByTime(200);
      });

      await waitFor(() => {
        const playerItem = screen.getByTestId("player-result-0");
        fireEvent.click(playerItem);
      });

      expect(input).toHaveValue("");
    });

    it("closes dropdown after selection", async () => {
      const mockData = createMockGraphData([
        createMockNode("1", { label: "Michael Jordan", position: "SG", era: "1990s" }),
      ]);
      mockSearchPlayers.mockReturnValue([
        createMockNode("1", { label: "Michael Jordan", position: "SG", era: "1990s" }),
      ]);

      render(<SearchBar data={mockData} onSelect={jest.fn()} />);

      const input = screen.getByRole("textbox");
      fireEvent.change(input, { target: { value: "Jordan" } });

      act(() => {
        jest.advanceTimersByTime(200);
      });

      await waitFor(() => {
        expect(screen.getByText("Michael Jordan")).toBeInTheDocument();
      });

      // Click on player
      const playerItem = screen.getByTestId("player-result-0");
      fireEvent.click(playerItem);

      // Dropdown should be closed
      await waitFor(() => {
        expect(screen.queryByText("No players found")).not.toBeInTheDocument();
      });
    });
  });

  describe("Debounce Behavior", () => {
    it("does not search immediately after typing", () => {
      const mockData = createMockGraphData([createMockNode("1", { label: "Michael Jordan" })]);
      mockSearchPlayers.mockReturnValue([]);

      render(<SearchBar data={mockData} onSelect={jest.fn()} />);

      const input = screen.getByRole("textbox");
      fireEvent.change(input, { target: { value: "Jordan" } });

      // Should not have called search yet (before debounce)
      expect(mockSearchPlayers).not.toHaveBeenCalled();
    });

    it("searches after 200ms debounce delay", async () => {
      const mockData = createMockGraphData([createMockNode("1", { label: "Michael Jordan" })]);
      mockSearchPlayers.mockReturnValue([createMockNode("1", { label: "Michael Jordan" })]);

      render(<SearchBar data={mockData} onSelect={jest.fn()} />);

      const input = screen.getByRole("textbox");
      fireEvent.change(input, { target: { value: "Jordan" } });

      // Advance by 100ms - still not enough
      act(() => {
        jest.advanceTimersByTime(100);
      });

      expect(mockSearchPlayers).not.toHaveBeenCalled();

      // Advance by another 100ms to reach 200ms total
      act(() => {
        jest.advanceTimersByTime(100);
      });

      expect(mockSearchPlayers).toHaveBeenCalledWith(mockData, "Jordan");
    });

    it("cancels previous search when new input is typed", async () => {
      const mockData = createMockGraphData([
        createMockNode("1", { label: "Michael Jordan" }),
        createMockNode("2", { label: "Michael Cooper" }),
      ]);
      mockSearchPlayers.mockImplementation((data, query) => {
        return data.nodes.filter((n) => n.label.toLowerCase().includes(query.toLowerCase()));
      });

      render(<SearchBar data={mockData} onSelect={jest.fn()} />);

      const input = screen.getByRole("textbox");

      // Type first query
      fireEvent.change(input, { target: { value: "Michael" } });
      act(() => {
        jest.advanceTimersByTime(200);
      });

      // Type additional characters
      fireEvent.change(input, { target: { value: "Michael J" } });

      // Before debounce completes for second query
      act(() => {
        jest.advanceTimersByTime(100);
      });

      // Only the second query should be searched (first was cancelled)
      await waitFor(() => {
        expect(mockSearchPlayers).toHaveBeenLastCalledWith(mockData, "Michael J");
      });
    });
  });

  describe("Case Insensitivity", () => {
    it("matches players regardless of case", async () => {
      const mockData = createMockGraphData([
        createMockNode("1", { label: "Michael Jordan", position: "SG", era: "1990s" }),
      ]);
      mockSearchPlayers.mockImplementation((data, query) => {
        return data.nodes.filter((n) => n.label.toLowerCase().includes(query.toLowerCase()));
      });

      render(<SearchBar data={mockData} onSelect={jest.fn()} />);

      const input = screen.getByRole("textbox");
      fireEvent.change(input, { target: { value: "michael" } });

      act(() => {
        jest.advanceTimersByTime(200);
      });

      await waitFor(() => {
        expect(screen.getByText("Michael Jordan")).toBeInTheDocument();
      });
    });
  });

  describe("Empty Query", () => {
    it("shows no dropdown for empty query", async () => {
      const mockData = createMockGraphData([createMockNode("1", { label: "Michael Jordan" })]);
      mockSearchPlayers.mockReturnValue([]);

      render(<SearchBar data={mockData} onSelect={jest.fn()} />);

      const input = screen.getByRole("textbox");
      fireEvent.change(input, { target: { value: "" } });

      act(() => {
        jest.advanceTimersByTime(200);
      });

      await waitFor(() => {
        expect(screen.queryByText("No players found")).not.toBeInTheDocument();
      });
    });
  });
});
