/**
 * TDD Tests for Filters Component
 * Era, Team, and Position filters with AND logic
 */

import React from "react";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import "@testing-library/jest-dom";
import Filters from "@/components/Filters";
import { filterByEra, filterByTeam, filterByPosition } from "@/lib/graph-data";
import type { GraphData, NodeData, EdgeData, TeamTenure } from "@/lib/graph-types";

// Mock graph-data module
jest.mock("@/lib/graph-data", () => ({
  filterByEra: jest.fn(),
  filterByTeam: jest.fn(),
  filterByPosition: jest.fn(),
}));

const mockFilterByEra = filterByEra as jest.MockedFunction<typeof filterByEra>;
const mockFilterByTeam = filterByTeam as jest.MockedFunction<typeof filterByTeam>;
const mockFilterByPosition = filterByPosition as jest.MockedFunction<typeof filterByPosition>;

// Era buckets
const ERA_BUCKETS = ["1940s-1950s", "1960s", "1970s", "1980s", "1990s", "2000s", "2010s", "2020s"];

// Position options
const POSITION_OPTIONS = ["PG", "SG", "SF", "PF", "C", "G", "F"];

// Team abbreviations (from team-colors.ts)
const TEAM_ABBREVIATIONS = [
  "ATL",
  "BOS",
  "CLE",
  "NOP",
  "CHI",
  "DAL",
  "DEN",
  "GSW",
  "HOU",
  "LAC",
  "LAL",
  "MIA",
  "MIL",
  "MIN",
  "BKN",
  "NYK",
  "ORL",
  "IND",
  "PHI",
  "TOR",
  "UTA",
  "POR",
  "SAC",
  "SAS",
  "OKC",
  "PHX",
  "MEM",
  "CHA",
  "DET",
  "WAS",
];

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
  teams: TeamTenure[] = [],
): EdgeData => ({
  id,
  source,
  target,
  weight: 1,
  teams,
  total_days: 100,
  size: 5,
});

const createMockGraphData = (nodes: NodeData[], edges: EdgeData[] = []): GraphData => ({
  nodes,
  edges,
});

describe("Filters Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Default mock implementations - return input data unchanged
    mockFilterByEra.mockImplementation((data) => data);
    mockFilterByTeam.mockImplementation((data) => data);
    mockFilterByPosition.mockImplementation((data) => data);
  });

  describe("Rendering", () => {
    it("renders all three filter dropdowns", () => {
      const mockData = createMockGraphData([]);
      render(<Filters data={mockData} onFilterChange={jest.fn()} />);

      // Era dropdown
      expect(screen.getByLabelText(/era/i)).toBeInTheDocument();
      // Team dropdown
      expect(screen.getByLabelText(/team/i)).toBeInTheDocument();
      // Position dropdown
      expect(screen.getByLabelText(/position/i)).toBeInTheDocument();
    });

    it("renders Reset All button", () => {
      const mockData = createMockGraphData([]);
      render(<Filters data={mockData} onFilterChange={jest.fn()} />);

      expect(screen.getByRole("button", { name: /reset/i })).toBeInTheDocument();
    });

    it("renders Era dropdown with all era bucket options", () => {
      const mockData = createMockGraphData([]);
      render(<Filters data={mockData} onFilterChange={jest.fn()} />);

      const eraSelect = screen.getByLabelText(/era/i) as HTMLSelectElement;
      ERA_BUCKETS.forEach((era) => {
        expect(screen.getByRole("option", { name: era })).toBeInTheDocument();
      });
    });

    it("renders Team dropdown with all 30 NBA teams plus All Teams option", () => {
      const mockData = createMockGraphData([]);
      render(<Filters data={mockData} onFilterChange={jest.fn()} />);

      // Should have "All Teams" option
      expect(screen.getByRole("option", { name: /all teams/i })).toBeInTheDocument();

      // Should have all 30 team abbreviations
      TEAM_ABBREVIATIONS.forEach((team) => {
        expect(screen.getByRole("option", { name: team })).toBeInTheDocument();
      });
    });

    it("renders Position options as checkboxes", () => {
      const mockData = createMockGraphData([]);
      render(<Filters data={mockData} onFilterChange={jest.fn()} />);

      POSITION_OPTIONS.forEach((pos) => {
        expect(screen.getByRole("checkbox", { name: pos })).toBeInTheDocument();
      });
    });

    it("has All Teams as default team selection", () => {
      const mockData = createMockGraphData([]);
      render(<Filters data={mockData} onFilterChange={jest.fn()} />);

      const teamSelect = screen.getByLabelText(/team/i) as HTMLSelectElement;
      expect(teamSelect.value).toBe("");
    });

    it("has all positions unchecked by default", () => {
      const mockData = createMockGraphData([]);
      render(<Filters data={mockData} onFilterChange={jest.fn()} />);

      POSITION_OPTIONS.forEach((pos) => {
        const checkbox = screen.getByRole("checkbox", { name: pos }) as HTMLInputElement;
        expect(checkbox.checked).toBe(false);
      });
    });
  });

  describe("Era Filter", () => {
    it("calls filterByEra when era is selected", () => {
      const mockData = createMockGraphData([createMockNode("1", { era: "1990s" })]);
      const onFilterChange = jest.fn();
      render(<Filters data={mockData} onFilterChange={onFilterChange} />);

      const eraSelect = screen.getByLabelText(/era/i);
      fireEvent.change(eraSelect, { target: { value: "1990s" } });

      expect(mockFilterByEra).toHaveBeenCalledWith(mockData, "1990s");
    });

    it("triggers onFilterChange with filtered data when era changes", () => {
      const mockData = createMockGraphData([createMockNode("1", { era: "1990s" })]);
      const filteredData = createMockGraphData([createMockNode("1", { era: "1990s" })]);
      mockFilterByEra.mockReturnValue(filteredData);
      const onFilterChange = jest.fn();
      render(<Filters data={mockData} onFilterChange={onFilterChange} />);

      const eraSelect = screen.getByLabelText(/era/i);
      fireEvent.change(eraSelect, { target: { value: "1990s" } });

      expect(onFilterChange).toHaveBeenCalledWith(filteredData);
    });

    it("filters out nodes not matching the era", () => {
      const mockData = createMockGraphData([
        createMockNode("1", { era: "1990s" }),
        createMockNode("2", { era: "2010s" }),
      ]);
      const filteredData = createMockGraphData([createMockNode("1", { era: "1990s" })]);
      mockFilterByEra.mockReturnValue(filteredData);
      const onFilterChange = jest.fn();
      render(<Filters data={mockData} onFilterChange={onFilterChange} />);

      const eraSelect = screen.getByLabelText(/era/i);
      fireEvent.change(eraSelect, { target: { value: "1990s" } });

      expect(onFilterChange).toHaveBeenCalledWith(
        expect.objectContaining({
          nodes: expect.arrayContaining([expect.objectContaining({ id: "1" })]),
        }),
      );
    });
  });

  describe("Team Filter", () => {
    it("calls filterByTeam when team is selected", () => {
      const mockData = createMockGraphData([createMockNode("1")]);
      const onFilterChange = jest.fn();
      render(<Filters data={mockData} onFilterChange={onFilterChange} />);

      const teamSelect = screen.getByLabelText(/team/i);
      fireEvent.change(teamSelect, { target: { value: "LAL" } });

      expect(mockFilterByTeam).toHaveBeenCalledWith(mockData, "LAL");
    });

    it("triggers onFilterChange with filtered data when team changes", () => {
      const mockData = createMockGraphData([createMockNode("1")]);
      const filteredData = createMockGraphData([createMockNode("1")]);
      mockFilterByTeam.mockReturnValue(filteredData);
      const onFilterChange = jest.fn();
      render(<Filters data={mockData} onFilterChange={onFilterChange} />);

      const teamSelect = screen.getByLabelText(/team/i);
      fireEvent.change(teamSelect, { target: { value: "LAL" } });

      expect(onFilterChange).toHaveBeenCalledWith(filteredData);
    });
  });

  describe("Position Filter (Multi-select)", () => {
    it("renders position options as checkboxes or multi-select", () => {
      const mockData = createMockGraphData([]);
      render(<Filters data={mockData} onFilterChange={jest.fn()} />);

      POSITION_OPTIONS.forEach((pos) => {
        expect(screen.getByRole("checkbox", { name: pos })).toBeInTheDocument();
      });
    });

    it("calls filterByPosition when position is toggled", () => {
      const mockData = createMockGraphData([createMockNode("1", { position: "PG" })]);
      const onFilterChange = jest.fn();
      render(<Filters data={mockData} onFilterChange={onFilterChange} />);

      const pgCheckbox = screen.getByRole("checkbox", { name: "PG" });
      fireEvent.click(pgCheckbox);

      expect(mockFilterByPosition).toHaveBeenCalledWith(mockData, "PG");
    });

    it("triggers onFilterChange with filtered data when position is selected", () => {
      const mockData = createMockGraphData([createMockNode("1", { position: "PG" })]);
      const filteredData = createMockGraphData([createMockNode("1", { position: "PG" })]);
      mockFilterByPosition.mockReturnValue(filteredData);
      const onFilterChange = jest.fn();
      render(<Filters data={mockData} onFilterChange={onFilterChange} />);

      const pgCheckbox = screen.getByRole("checkbox", { name: "PG" });
      fireEvent.click(pgCheckbox);

      expect(onFilterChange).toHaveBeenCalledWith(filteredData);
    });

    it("can select multiple positions", () => {
      const mockData = createMockGraphData([
        createMockNode("1", { position: "PG" }),
        createMockNode("2", { position: "SG" }),
      ]);
      const onFilterChange = jest.fn();
      render(<Filters data={mockData} onFilterChange={onFilterChange} />);

      const pgCheckbox = screen.getByRole("checkbox", { name: "PG" });
      const sgCheckbox = screen.getByRole("checkbox", { name: "SG" });
      fireEvent.click(pgCheckbox);
      fireEvent.click(sgCheckbox);

      // With PG and SG selected, filterByPosition is called twice in the AND chain
      // First for PG (when selected), then for SG (when selected)
      // PG adds: filterByPosition(data, 'PG')
      // SG adds: filterByPosition(result, 'PG') and filterByPosition(result, 'SG')
      // So 3 total calls to filterByPosition
      expect(mockFilterByPosition).toHaveBeenCalledTimes(3);
    });
  });

  describe("Combined Filters (AND Logic)", () => {
    it("applies era filter first, then team filter", () => {
      const mockData = createMockGraphData([createMockNode("1")]);
      const eraFiltered = createMockGraphData([createMockNode("1")]);
      const teamFiltered = createMockGraphData([createMockNode("1")]);

      mockFilterByEra.mockReturnValue(eraFiltered);
      mockFilterByTeam.mockReturnValue(teamFiltered);

      const onFilterChange = jest.fn();
      render(<Filters data={mockData} onFilterChange={onFilterChange} />);

      // Set era
      const eraSelect = screen.getByLabelText(/era/i);
      fireEvent.change(eraSelect, { target: { value: "1990s" } });

      // Set team
      const teamSelect = screen.getByLabelText(/team/i);
      fireEvent.change(teamSelect, { target: { value: "LAL" } });

      // Era should be called first, then team on the result of era
      expect(mockFilterByEra).toHaveBeenCalledWith(mockData, "1990s");
      expect(mockFilterByTeam).toHaveBeenCalledWith(eraFiltered, "LAL");
    });

    it("applies era filter, then team filter, then position filter", () => {
      const mockData = createMockGraphData([createMockNode("1")]);
      const eraFiltered = createMockGraphData([createMockNode("1")]);
      const teamFiltered = createMockGraphData([createMockNode("1")]);
      const positionFiltered = createMockGraphData([createMockNode("1")]);

      mockFilterByEra.mockReturnValue(eraFiltered);
      mockFilterByTeam.mockReturnValue(teamFiltered);
      mockFilterByPosition.mockReturnValue(positionFiltered);

      const onFilterChange = jest.fn();
      render(<Filters data={mockData} onFilterChange={onFilterChange} />);

      // Set era
      const eraSelect = screen.getByLabelText(/era/i);
      fireEvent.change(eraSelect, { target: { value: "1990s" } });

      // Set team
      const teamSelect = screen.getByLabelText(/team/i);
      fireEvent.change(teamSelect, { target: { value: "LAL" } });

      // Set position
      const pgCheckbox = screen.getByRole("checkbox", { name: "PG" });
      fireEvent.click(pgCheckbox);

      // Filters should be chained: data -> era -> team -> position
      expect(mockFilterByEra).toHaveBeenCalledWith(mockData, "1990s");
      expect(mockFilterByTeam).toHaveBeenCalledWith(eraFiltered, "LAL");
      expect(mockFilterByPosition).toHaveBeenCalledWith(teamFiltered, "PG");
    });

    it("returns empty data when no nodes match combined filters", () => {
      const mockData = createMockGraphData([
        createMockNode("1", { era: "1990s", position: "SG" }),
        createMockNode("2", { era: "2010s", position: "PG" }),
      ]);
      const emptyData = createMockGraphData([], []);

      mockFilterByEra.mockReturnValue(emptyData);

      const onFilterChange = jest.fn();
      render(<Filters data={mockData} onFilterChange={onFilterChange} />);

      const eraSelect = screen.getByLabelText(/era/i);
      fireEvent.change(eraSelect, { target: { value: "1970s" } }); // No 1970s players

      expect(onFilterChange).toHaveBeenCalledWith(emptyData);
    });
  });

  describe("Reset All", () => {
    it("resets era dropdown to default", () => {
      const mockData = createMockGraphData([]);
      const onFilterChange = jest.fn();
      render(<Filters data={mockData} onFilterChange={onFilterChange} />);

      // Select an era
      const eraSelect = screen.getByLabelText(/era/i);
      fireEvent.change(eraSelect, { target: { value: "1990s" } });

      // Click reset
      const resetButton = screen.getByRole("button", { name: /reset/i });
      fireEvent.click(resetButton);

      // Era should be back to default
      expect((screen.getByLabelText(/era/i) as HTMLSelectElement).value).toBe("");
    });

    it("resets team dropdown to default", () => {
      const mockData = createMockGraphData([]);
      const onFilterChange = jest.fn();
      render(<Filters data={mockData} onFilterChange={onFilterChange} />);

      // Select a team
      const teamSelect = screen.getByLabelText(/team/i);
      fireEvent.change(teamSelect, { target: { value: "LAL" } });

      // Click reset
      const resetButton = screen.getByRole("button", { name: /reset/i });
      fireEvent.click(resetButton);

      // Team should be back to default (All)
      expect((screen.getByLabelText(/team/i) as HTMLSelectElement).value).toBe("");
    });

    it("resets position checkboxes to unchecked", () => {
      const mockData = createMockGraphData([]);
      const onFilterChange = jest.fn();
      render(<Filters data={mockData} onFilterChange={onFilterChange} />);

      // Select a position
      const pgCheckbox = screen.getByRole("checkbox", { name: "PG" });
      fireEvent.click(pgCheckbox);
      expect(pgCheckbox).toBeChecked();

      // Click reset
      const resetButton = screen.getByRole("button", { name: /reset/i });
      fireEvent.click(resetButton);

      // Position should be unchecked
      expect(pgCheckbox).not.toBeChecked();
    });

    it("calls onFilterChange with original data when reset", () => {
      const mockData = createMockGraphData([createMockNode("1")]);
      const onFilterChange = jest.fn();
      render(<Filters data={mockData} onFilterChange={onFilterChange} />);

      // Set filters
      const eraSelect = screen.getByLabelText(/era/i);
      fireEvent.change(eraSelect, { target: { value: "1990s" } });

      // Reset
      const resetButton = screen.getByRole("button", { name: /reset/i });
      fireEvent.click(resetButton);

      // Should call onFilterChange with original data
      expect(onFilterChange).toHaveBeenLastCalledWith(mockData);
    });
  });

  describe("Filter Integration with Graph", () => {
    it("passes filtered data to onFilterChange callback", () => {
      const mockData = createMockGraphData([
        createMockNode("1", { era: "1990s", position: "SG" }),
        createMockNode("2", { era: "1990s", position: "SF" }),
      ]);

      const filteredData = createMockGraphData([
        createMockNode("1", { era: "1990s", position: "SG" }),
      ]);
      mockFilterByEra.mockReturnValue(filteredData);

      const onFilterChange = jest.fn();
      render(<Filters data={mockData} onFilterChange={onFilterChange} />);

      const eraSelect = screen.getByLabelText(/era/i);
      fireEvent.change(eraSelect, { target: { value: "1990s" } });

      expect(onFilterChange).toHaveBeenCalledWith(
        expect.objectContaining({
          nodes: expect.arrayContaining([expect.objectContaining({ era: "1990s" })]),
        }),
      );
    });

    it("handles empty filter selection gracefully", () => {
      const mockData = createMockGraphData([createMockNode("1")]);
      const onFilterChange = jest.fn();
      render(<Filters data={mockData} onFilterChange={onFilterChange} />);

      // Click reset without selecting anything
      const resetButton = screen.getByRole("button", { name: /reset/i });
      fireEvent.click(resetButton);

      expect(onFilterChange).toHaveBeenCalledWith(mockData);
    });
  });
});
