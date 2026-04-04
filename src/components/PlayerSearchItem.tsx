"use client";

import React from "react";
import type { NodeData } from "@/lib/graph-types";
import {
  resultItemStyle,
  resultItemSelectedStyle,
  playerNameStyle,
  playerMetaStyle,
} from "./ShortestPath.styles";

interface PlayerSearchItemProps {
  player: NodeData;
  isSelected: boolean;
  index: number;
  onSelect: (player: NodeData) => void;
  onHover: () => void;
}

export default function PlayerSearchItem({
  player,
  isSelected,
  index,
  onSelect,
  onHover,
}: PlayerSearchItemProps) {
  return (
    <div
      key={player.id}
      data-testid={`path-from-result-${index}`}
      role="option"
      aria-selected={isSelected ? "true" : "false"}
      tabIndex={0}
      style={{
        ...resultItemStyle,
        ...(isSelected ? resultItemSelectedStyle : {}),
      }}
      onClick={() => onSelect(player)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect(player);
        }
      }}
      onMouseEnter={onHover}
    >
      <span style={playerNameStyle}>{player.label}</span>
      <span style={playerMetaStyle}>{player.position}</span>
      <span style={playerMetaStyle}>{player.era}</span>
    </div>
  );
}
