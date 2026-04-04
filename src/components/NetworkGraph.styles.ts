"use client";

import type React from "react";

export const containerStyle: React.CSSProperties = {
  width: "100%",
  height: "100%",
  position: "relative",
  backgroundColor: "#f5f5f5",
};

export const loadingStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: "100%",
  height: "100%",
  color: "#666",
  fontSize: "16px",
};

export const errorStyle: React.CSSProperties = {
  ...loadingStyle,
  color: "#e74c3c",
};
