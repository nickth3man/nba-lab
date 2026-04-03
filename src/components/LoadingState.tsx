'use client';

import React from 'react';

interface LoadingStateProps {
  message?: string;
}

export default function LoadingState({ message = 'Loading network graph...' }: LoadingStateProps) {
  return (
    <div 
      data-testid="loading-state"
      style={containerStyle}
      role="status"
      aria-live="polite"
    >
      <div data-testid="loading-spinner" style={spinnerContainerStyle}>
        <div style={spinnerStyle} />
        <div style={{...spinnerStyle, animationDelay: '0.15s'}} />
        <div style={{...spinnerStyle, animationDelay: '0.3s'}} />
      </div>
      <p style={messageStyle}>{message}</p>
    </div>
  );
}

const containerStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  width: '100%',
  height: '100%',
  backgroundColor: '#f5f5f5',
  gap: '16px',
};

const spinnerContainerStyle: React.CSSProperties = {
  display: 'flex',
  gap: '8px',
};

const spinnerStyle: React.CSSProperties = {
  width: '12px',
  height: '12px',
  backgroundColor: '#3498db',
  borderRadius: '50%',
  animation: 'pulse 1.2s ease-in-out infinite',
};

const messageStyle: React.CSSProperties = {
  color: '#666',
  fontSize: '16px',
  margin: 0,
};
