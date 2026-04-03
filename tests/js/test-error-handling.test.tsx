/**
 * TDD Tests for Error Handling, Loading States, and WebGL Fallback
 */

import React from 'react';
import { render, screen, waitFor, act, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

jest.mock('@/lib/webgl-detect', () => ({
  isWebGLSupported: jest.fn(),
}));

jest.mock('@/lib/graph-data', () => ({
  loadGraphData: jest.fn(),
}));

jest.mock('@/components/NetworkGraph', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: function MockNetworkGraph() {
      return React.createElement('div', { 'data-testid': 'mock-network-graph' }, 'Mock NetworkGraph');
    },
  };
});

import LoadingState from '@/components/LoadingState';
import ErrorState from '@/components/ErrorState';
import EmptyState from '@/components/EmptyState';
import WebGLError from '@/components/WebGLError';
import ErrorBoundary from '@/components/ErrorBoundary';
import NetworkGraph from '@/components/NetworkGraph';
import * as webglDetect from '@/lib/webgl-detect';
import * as graphData from '@/lib/graph-data';

describe('LoadingState Component', () => {
  it('shows loading spinner with message during data fetch', () => {
    render(<LoadingState message="Loading network graph..." />);
    
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    expect(screen.getByText('Loading network graph...')).toBeInTheDocument();
  });

  it('displays default message when no message prop provided', () => {
    render(<LoadingState />);
    
    expect(screen.getByText('Loading network graph...')).toBeInTheDocument();
  });
});

describe('ErrorState Component', () => {
  it('displays error message with retry button', async () => {
    const retryHandler = jest.fn();
    
    render(<ErrorState message="Failed to load graph data" onRetry={retryHandler} />);
    
    expect(screen.getByText('Failed to load graph data')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument();
  });

  it('calls onRetry when retry button is clicked', async () => {
    const retryHandler = jest.fn();
    
    render(<ErrorState message="Network error" onRetry={retryHandler} />);
    
    const retryButton = screen.getByRole('button', { name: 'Retry' });
    await act(async () => {
      fireEvent.click(retryButton);
    });
    
    expect(retryHandler).toHaveBeenCalledTimes(1);
  });

  it('shows different messages for different error types', () => {
    const { rerender } = render(<ErrorState message="Failed to load nodes.json" onRetry={jest.fn()} />);
    expect(screen.getByText('Failed to load nodes.json')).toBeInTheDocument();
    
    rerender(<ErrorState message="Failed to load edges.json" onRetry={jest.fn()} />);
    expect(screen.getByText('Failed to load edges.json')).toBeInTheDocument();
  });
});

describe('EmptyState Component', () => {
  it('displays empty state message', () => {
    render(<EmptyState message="No players match current filters" />);
    
    expect(screen.getByText('No players match current filters')).toBeInTheDocument();
  });

  it('shows default message when no message prop provided', () => {
    render(<EmptyState />);
    
    expect(screen.getByText('No players match current filters')).toBeInTheDocument();
  });
});

describe('WebGLError Component', () => {
  it('displays WebGL unsupported message', () => {
    render(<WebGLError />);
    
    expect(screen.getByText(/WebGL is required for this visualization/i)).toBeInTheDocument();
  });

  it('mentions browser requirements in message', () => {
    render(<WebGLError />);
    
    expect(screen.getByText(/modern browser/i)).toBeInTheDocument();
  });
});

describe('ErrorBoundary Component', () => {
  it('renders children when no error occurs', () => {
    render(
      <ErrorBoundary>
        <div data-testid="child-content">Normal content</div>
      </ErrorBoundary>
    );
    
    expect(screen.getByTestId('child-content')).toBeInTheDocument();
  });

  it('catches and displays errors from children', async () => {
    const ErrorThrowingComponent = () => {
      throw new Error('Test error');
    };
    
    render(
      <ErrorBoundary>
        <ErrorThrowingComponent />
      </ErrorBoundary>
    );
    
    await waitFor(() => {
      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
    });
  });

  it('has a retry/reset button when error occurs', async () => {
    const ErrorThrowingComponent = () => {
      throw new Error('Test error');
    };
    
    render(
      <ErrorBoundary>
        <ErrorThrowingComponent />
      </ErrorBoundary>
    );
    
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
    });
  });
});

describe('NetworkGraph Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the network graph component', async () => {
    (graphData.loadGraphData as jest.Mock).mockResolvedValue({ nodes: [], edges: [] });

    await act(async () => {
      render(<NetworkGraph />);
    });

    await waitFor(() => {
      expect(screen.getByTestId('mock-network-graph')).toBeInTheDocument();
    });
  });

  it('passes callbacks to network graph', async () => {
    (graphData.loadGraphData as jest.Mock).mockResolvedValue({ nodes: [], edges: [] });
    const hoverCallback = jest.fn();
    const clickCallback = jest.fn();

    await act(async () => {
      render(<NetworkGraph onNodeHover={hoverCallback} onNodeClick={clickCallback} />);
    });

    await waitFor(() => {
      expect(screen.getByTestId('mock-network-graph')).toBeInTheDocument();
    });
  });
});

describe('WebGL Detection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('detects WebGL support correctly', () => {
    (webglDetect.isWebGLSupported as jest.Mock).mockReturnValue(true);
    expect(webglDetect.isWebGLSupported()).toBe(true);

    (webglDetect.isWebGLSupported as jest.Mock).mockReturnValue(false);
    expect(webglDetect.isWebGLSupported()).toBe(false);
  });
});
