"use client";

import React from "react";

interface EmptyStateProps {
  message?: string;
}

export default function EmptyState({
  message = "No players match current filters",
}: EmptyStateProps) {
  return (
    <div data-testid="empty-state" style={containerStyle} role="status" aria-live="polite">
      <div style={iconContainerStyle}>
        <svg
          style={iconStyle}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
          />
        </svg>
      </div>
      <p style={messageStyle}>{message}</p>
      <p style={hintStyle}>Try adjusting your filters to see more players</p>
    </div>
  );
}

const containerStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  width: "100%",
  height: "100%",
  backgroundColor: "#f5f5f5",
  gap: "12px",
  padding: "24px",
};

const iconContainerStyle: React.CSSProperties = {
  width: "80px",
  height: "80px",
  borderRadius: "50%",
  backgroundColor: "#e8f4f8",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const iconStyle: React.CSSProperties = {
  width: "40px",
  height: "40px",
  color: "#3498db",
};

const messageStyle: React.CSSProperties = {
  color: "#333",
  fontSize: "18px",
  fontWeight: 500,
  margin: 0,
};

const hintStyle: React.CSSProperties = {
  color: "#888",
  fontSize: "14px",
  margin: 0,
};
