"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import type { GraphData, NodeData } from "@/lib/graph-types";
import { searchPlayers } from "@/lib/graph-data";
import PlayerSearchItem from "./PlayerSearchItem";
import {
  searchRowStyle,
  searchContainerStyle,
  inputStyle,
  inputDisabledStyle,
  dropdownStyle,
  noResultsStyle,
  clearBtnStyle,
} from "./ShortestPath.styles";

const DEBOUNCE_MS = 200;
const MAX_RESULTS = 100;

interface ShortestPathControlsProps {
  data: GraphData;
  fromPlayer: { id: string | null; label: string };
  toPlayer: { id: string | null; label: string };
  onSelectFromPlayer: (player: NodeData) => void;
  onSelectToPlayer: (player: NodeData) => void;
  onClearFromPlayer: () => void;
  onClearToPlayer: () => void;
}

function usePlayerInput(data: GraphData, onSelect: (player: NodeData) => void) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<NodeData[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim()) {
      return;
    }
    debounceRef.current = setTimeout(() => {
      setResults(searchPlayers(data, query).slice(0, MAX_RESULTS));
      setIsOpen(true);
      setSelectedIndex(-1);
    }, DEBOUNCE_MS);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, data]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (!isOpen || results.length === 0) return;
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : 0));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : results.length - 1));
      } else if (e.key === "Enter" && selectedIndex >= 0) {
        e.preventDefault();
        const player = results[selectedIndex];
        if (player) onSelect(player);
      } else if (e.key === "Escape") {
        setIsOpen(false);
      }
    },
    [isOpen, results, selectedIndex, onSelect],
  );

  return {
    query,
    setQuery,
    results,
    isOpen,
    setIsOpen,
    selectedIndex,
    setSelectedIndex,
    inputRef,
    containerRef,
    handleKeyDown,
  };
}

interface PlayerInputProps {
  label: string;
  placeholder: string;
  value: { id: string | null; label: string };
  state: ReturnType<typeof usePlayerInput>;
  onClear: () => void;
  onSelect: (player: NodeData) => void;
  testId: string;
}

function PlayerInput({
  label,
  placeholder,
  value,
  state,
  onClear,
  testId,
  onSelect,
}: PlayerInputProps) {
  const {
    query,
    setQuery,
    results,
    isOpen,
    setIsOpen,
    selectedIndex,
    setSelectedIndex,
    inputRef,
    containerRef,
    handleKeyDown,
  } = state;

  return (
    <div ref={containerRef} style={searchContainerStyle}>
      <input
        ref={inputRef}
        data-testid={testId}
        type="text"
        value={value.id ? value.label : query}
        onChange={(e) => {
          if (!value.id) setQuery(e.target.value);
        }}
        onKeyDown={handleKeyDown}
        onFocus={() => {
          if (query.trim() && results.length > 0) setIsOpen(true);
        }}
        placeholder={placeholder}
        disabled={!!value.id}
        style={{ ...inputStyle, ...(value.id ? inputDisabledStyle : {}) }}
        aria-label={`Search for ${label} player`}
      />
      {value.id && (
        <button
          type="button"
          onClick={onClear}
          style={clearBtnStyle}
          aria-label={`Clear ${label} player`}
        >
          ×
        </button>
      )}
      {isOpen && !value.id && (
        <div style={dropdownStyle} role="listbox" data-testid={`${testId}-results`}>
          {results.length === 0 ? (
            <div style={noResultsStyle}>No players found</div>
          ) : (
            results.map((player, index) => (
              <PlayerSearchItem
                key={player.id}
                player={player}
                isSelected={index === selectedIndex}
                index={index}
                onSelect={onSelect}
                onHover={() => setSelectedIndex(index)}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default function ShortestPathControls({
  data,
  fromPlayer,
  toPlayer,
  onSelectFromPlayer,
  onSelectToPlayer,
  onClearFromPlayer,
  onClearToPlayer,
}: ShortestPathControlsProps) {
  const fromState = usePlayerInput(data, onSelectFromPlayer);
  const toState = usePlayerInput(data, onSelectToPlayer);

  const { containerRef: fromContainerRef, setIsOpen: setFromIsOpen } = fromState;
  const { containerRef: toContainerRef, setIsOpen: setToIsOpen } = toState;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (fromContainerRef.current && !fromContainerRef.current.contains(e.target as Node)) {
        setFromIsOpen(false);
      }
      if (toContainerRef.current && !toContainerRef.current.contains(e.target as Node)) {
        setToIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [fromContainerRef, setFromIsOpen, toContainerRef, setToIsOpen]);

  return (
    <div style={searchRowStyle}>
      <PlayerInput
        label="starting"
        placeholder="From Player"
        value={fromPlayer}
        state={fromState}
        onClear={onClearFromPlayer}
        onSelect={onSelectFromPlayer}
        testId="path-from-input"
      />
      <PlayerInput
        label="destination"
        placeholder="To Player"
        value={toPlayer}
        state={toState}
        onClear={onClearToPlayer}
        onSelect={onSelectToPlayer}
        testId="path-to-input"
      />
    </div>
  );
}
