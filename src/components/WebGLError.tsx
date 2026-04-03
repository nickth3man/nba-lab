"use client";

import React from "react";

export default function WebGLError() {
  return (
    <div data-testid="webgl-error" style={containerStyle} role="alert" aria-live="assertive">
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
            d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
          />
        </svg>
      </div>
      <h2 style={titleStyle}>WebGL Required</h2>
      <p style={messageStyle}>
        WebGL is required for this visualization. Please use a modern browser with WebGL support.
      </p>
      <div style={browserListStyle}>
        <p style={browserListTitleStyle}>Supported browsers:</p>
        <ul style={browserListItemsStyle}>
          <li>Chrome 56+</li>
          <li>Firefox 51+</li>
          <li>Safari 15+</li>
          <li>Edge 79+</li>
        </ul>
      </div>
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
  padding: "24px",
  textAlign: "center",
};

const iconContainerStyle: React.CSSProperties = {
  width: "96px",
  height: "96px",
  borderRadius: "50%",
  backgroundColor: "#fee",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  marginBottom: "16px",
};

const iconStyle: React.CSSProperties = {
  width: "48px",
  height: "48px",
  color: "#e74c3c",
};

const titleStyle: React.CSSProperties = {
  color: "#333",
  fontSize: "24px",
  fontWeight: 600,
  margin: "0 0 12px 0",
};

const messageStyle: React.CSSProperties = {
  color: "#666",
  fontSize: "16px",
  margin: "0 0 24px 0",
  maxWidth: "500px",
};

const browserListStyle: React.CSSProperties = {
  backgroundColor: "#fff",
  padding: "16px 24px",
  borderRadius: "8px",
  border: "1px solid #e0e0e0",
};

const browserListTitleStyle: React.CSSProperties = {
  color: "#333",
  fontSize: "14px",
  fontWeight: 600,
  margin: "0 0 8px 0",
};

const browserListItemsStyle: React.CSSProperties = {
  color: "#666",
  fontSize: "14px",
  margin: 0,
  paddingLeft: "20px",
  textAlign: "left",
};
