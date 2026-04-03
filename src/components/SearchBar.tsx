"use client";

import React, { useState, useEffect, useRef } from "react";
import type { GraphData, NodeData } from "@/lib/graph-types";
import { searchPlayers } from "@/lib/graph-data";

interface SearchBarProps {
  data: GraphData;
  onSelect: (nodeId: string) => void;
}

const DEBOUNCE_MS = 200;
const MAX_RESULTS = 100;

export default function SearchBar({ data, onSelect }: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<NodeData[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (!query.trim()) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    debounceRef.current = setTimeout(() => {
      const searchResults = searchPlayers(data, query);
      setResults(searchResults.slice(0, MAX_RESULTS));
      setIsOpen(true);
      setSelectedIndex(-1);
    }, DEBOUNCE_MS);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query, data]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || results.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : results.length - 1));
    } else if (e.key === "Enter" && selectedIndex >= 0) {
      e.preventDefault();
      const selected = results[selectedIndex];
      if (selected) selectPlayer(selected);
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  const selectPlayer = (player: NodeData) => {
    onSelect(player.id);
    setQuery("");
    setResults([]);
    setIsOpen(false);
    setSelectedIndex(-1);
    inputRef.current?.focus();
  };

  return (
    <div ref={containerRef} style={containerStyle}>
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={handleInputChange}
        onKeyDown={handleInputKeyDown}
        placeholder="Search players..."
        style={inputStyle}
        aria-label="Search for players"
        aria-autocomplete="list"
        aria-controls="search-results"
      />
      {isOpen && (
        <div style={dropdownStyle} id="search-results" role="listbox">
          {results.length === 0 ? (
            <div style={noResultsStyle}>No players found</div>
          ) : (
            results.map((player, index) => {
              const isSelected = index === selectedIndex;
              return (
                <div
                  key={player.id}
                  data-testid={`player-result-${index}`}
                  role="option"
                  aria-selected={isSelected}
                  tabIndex={0}
                  style={{
                    ...resultItemStyle,
                    ...(isSelected ? resultItemSelectedStyle : {}),
                  }}
                  onClick={() => selectPlayer(player)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      selectPlayer(player);
                    }
                  }}
                  onMouseEnter={() => setSelectedIndex(index)}
                >
                  <span style={playerNameStyle}>{player.label}</span>
                  <span style={playerMetaStyle}>{player.position}</span>
                  <span style={playerMetaStyle}>{player.era}</span>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

const containerStyle: React.CSSProperties = {
  position: "relative",
  width: "100%",
  maxWidth: "400px",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  fontSize: "14px",
  border: "1px solid #ccc",
  borderRadius: "4px",
  outline: "none",
  boxSizing: "border-box",
};

const dropdownStyle: React.CSSProperties = {
  position: "absolute",
  top: "100%",
  left: 0,
  right: 0,
  maxHeight: "300px",
  overflowY: "auto",
  backgroundColor: "#fff",
  border: "1px solid #ccc",
  borderTop: "none",
  borderRadius: "0 0 4px 4px",
  boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
  zIndex: 1000,
};

const noResultsStyle: React.CSSProperties = {
  padding: "12px",
  color: "#666",
  fontStyle: "italic",
  textAlign: "center",
};

const resultItemStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  padding: "8px 12px",
  cursor: "pointer",
  borderBottom: "1px solid #eee",
  gap: "12px",
};

const resultItemSelectedStyle: React.CSSProperties = {
  backgroundColor: "#e6f0ff",
};

const playerNameStyle: React.CSSProperties = {
  flex: 1,
  fontWeight: 500,
};

const playerMetaStyle: React.CSSProperties = {
  color: "#888",
  fontSize: "12px",
};
