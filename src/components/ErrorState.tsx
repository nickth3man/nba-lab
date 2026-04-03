"use client";

import React from "react";

interface ErrorStateProps {
  message: string;
  onRetry: () => void;
}

export default function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div data-testid="error-state" style={containerStyle} role="alert" aria-live="assertive">
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
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      </div>
      <p style={messageStyle}>{message}</p>
      <button onClick={onRetry} style={buttonStyle} type="button">
        Retry
      </button>
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
  gap: "16px",
  padding: "24px",
};

const iconContainerStyle: React.CSSProperties = {
  width: "64px",
  height: "64px",
  borderRadius: "50%",
  backgroundColor: "#fee",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const iconStyle: React.CSSProperties = {
  width: "32px",
  height: "32px",
  color: "#e74c3c",
};

const messageStyle: React.CSSProperties = {
  color: "#333",
  fontSize: "16px",
  margin: 0,
  textAlign: "center",
  maxWidth: "400px",
};

const buttonStyle: React.CSSProperties = {
  padding: "10px 24px",
  backgroundColor: "#3498db",
  color: "white",
  border: "none",
  borderRadius: "4px",
  fontSize: "14px",
  fontWeight: 500,
  cursor: "pointer",
  transition: "background-color 0.2s",
};
