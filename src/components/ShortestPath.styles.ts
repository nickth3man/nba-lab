import type React from "react";

export const containerStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "12px",
  padding: "16px",
  backgroundColor: "#fff",
  borderRadius: "8px",
  boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
};

export const searchRowStyle: React.CSSProperties = {
  display: "flex",
  gap: "12px",
  flexWrap: "wrap",
};

export const searchContainerStyle: React.CSSProperties = {
  position: "relative",
  flex: "1 1 200px",
  minWidth: "180px",
};

export const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 36px 10px 12px",
  fontSize: "14px",
  border: "1px solid #ccc",
  borderRadius: "4px",
  outline: "none",
  boxSizing: "border-box",
};

export const inputDisabledStyle: React.CSSProperties = {
  backgroundColor: "#f5f5f5",
  cursor: "default",
};

export const dropdownStyle: React.CSSProperties = {
  position: "absolute",
  top: "100%",
  left: 0,
  right: 0,
  maxHeight: "250px",
  overflowY: "auto",
  backgroundColor: "#fff",
  border: "1px solid #ccc",
  borderTop: "none",
  borderRadius: "0 0 4px 4px",
  boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
  zIndex: 1000,
};

export const noResultsStyle: React.CSSProperties = {
  padding: "12px",
  color: "#666",
  fontStyle: "italic",
  textAlign: "center",
};

export const resultItemStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  padding: "8px 12px",
  cursor: "pointer",
  borderBottom: "1px solid #eee",
  gap: "12px",
};

export const resultItemSelectedStyle: React.CSSProperties = {
  backgroundColor: "#e6f0ff",
};

export const playerNameStyle: React.CSSProperties = {
  flex: 1,
  fontWeight: 500,
};

export const playerMetaStyle: React.CSSProperties = {
  color: "#888",
  fontSize: "12px",
};

export const clearBtnStyle: React.CSSProperties = {
  position: "absolute",
  right: "8px",
  top: "50%",
  transform: "translateY(-50%)",
  background: "none",
  border: "none",
  fontSize: "18px",
  color: "#888",
  cursor: "pointer",
  padding: "4px 8px",
};

export const buttonRowStyle: React.CSSProperties = {
  display: "flex",
  gap: "12px",
};

export const buttonStyle: React.CSSProperties = {
  padding: "10px 20px",
  fontSize: "14px",
  border: "1px solid #ccc",
  borderRadius: "4px",
  cursor: "pointer",
  backgroundColor: "#fff",
};

export const buttonPrimaryStyle: React.CSSProperties = {
  backgroundColor: "#007bff",
  color: "#fff",
  borderColor: "#007bff",
};

export const buttonDisabledStyle: React.CSSProperties = {
  opacity: 0.6,
  cursor: "not-allowed",
};

export const hintStyle: React.CSSProperties = {
  color: "#666",
  fontSize: "14px",
  textAlign: "center",
  margin: "8px 0",
};

export const errorStyle: React.CSSProperties = {
  color: "#dc3545",
  fontSize: "14px",
  textAlign: "center",
  margin: "8px 0",
};

export const pathContainerStyle: React.CSSProperties = {
  marginTop: "8px",
  padding: "12px",
  backgroundColor: "#f8f9fa",
  borderRadius: "4px",
};

export const degreesStyle: React.CSSProperties = {
  fontSize: "16px",
  fontWeight: "bold",
  color: "#333",
  marginBottom: "8px",
};

export const pathListStyle: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  alignItems: "center",
  gap: "4px",
};

export const pathNodeStyle: React.CSSProperties = {
  padding: "4px 10px",
  borderRadius: "4px",
  fontSize: "13px",
  fontWeight: 500,
  backgroundColor: "#e9ecef",
};

export const teamTagStyle: React.CSSProperties = {
  padding: "2px 6px",
  borderRadius: "3px",
  fontSize: "11px",
  backgroundColor: "#17a2b8",
  color: "#fff",
};

export const arrowStyle: React.CSSProperties = {
  color: "#666",
  fontSize: "16px",
  padding: "0 2px",
};
