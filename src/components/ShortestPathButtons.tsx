"use client";

import React from "react";
import {
  buttonRowStyle,
  buttonStyle,
  buttonPrimaryStyle,
  buttonDisabledStyle,
} from "./ShortestPath.styles";

interface ShortestPathButtonsProps {
  fromPlayerId: string | null;
  toPlayerId: string | null;
  pathsLoading: boolean;
  onFindPath: () => void;
  onClearPath: () => void;
}

export default function ShortestPathButtons({
  fromPlayerId,
  toPlayerId,
  pathsLoading,
  onFindPath,
  onClearPath,
}: ShortestPathButtonsProps) {
  const isDisabled = !fromPlayerId || !toPlayerId || pathsLoading;

  return (
    <div style={buttonRowStyle}>
      <button
        type="button"
        onClick={onFindPath}
        disabled={isDisabled}
        data-testid="find-path-button"
        style={{
          ...buttonStyle,
          ...buttonPrimaryStyle,
          ...(isDisabled ? buttonDisabledStyle : {}),
        }}
      >
        Find Path
      </button>
      <button
        type="button"
        onClick={onClearPath}
        data-testid="clear-path-button"
        style={buttonStyle}
      >
        Clear Path
      </button>
    </div>
  );
}
