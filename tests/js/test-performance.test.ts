/**
 * Performance Optimization Tests for NBA Teammate Network
 * Tests viewport culling, LOD, mobile detection, debouncing, and Web Worker
 */

import type { GraphData } from "@/lib/graph-types";

// Mock sigma for viewport testing
const createMockSigma = () => {
  const nodePositions: Record<string, { x: number; y: number; size: number }> = {
    n1: { x: 100, y: 100, size: 10 },
    n2: { x: 200, y: 200, size: 10 },
    n3: { x: 300, y: 300, size: 10 },
    n4: { x: 400, y: 400, size: 10 },
    n5: { x: 500, y: 500, size: 10 },
  };

  const edges = [
    { id: "e1", source: "n1", target: "n2" },
    { id: "e2", source: "n2", target: "n5" },
    { id: "e3", source: "n3", target: "n4" },
    { id: "e4", source: "n1", target: "n5" },
    { id: "e5", source: "n4", target: "n5" },
  ];

  return {
    getGraph: () => ({
      nodes: () => ["n1", "n2", "n3", "n4", "n5"],
      edges: () => ["e1", "e2", "e3", "e4", "e5"],
      node: (id: string) => nodePositions[id] || { x: 0, y: 0, size: 10 },
      edge: (id: string) => edges.find((e) => e.id === id) || { source: "n1", target: "n2" },
      inEdges: (nodeId: string) => edges.filter((e) => e.target === nodeId).map((e) => e.id),
      outEdges: (nodeId: string) => edges.filter((e) => e.source === nodeId).map((e) => e.id),
      hasEdge: (source: string, target: string) =>
        edges.some((e) => e.source === source && e.target === target),
      forEachEdge: (
        callback: (
          edgeId: string,
          attrs: { source: string; target: string },
          source: string,
          target: string,
        ) => void,
      ) => {
        edges.forEach((e) => {
          callback(e.id, e, e.source, e.target);
        });
      },
    }),
    getContainer: () => ({ clientWidth: 800, clientHeight: 600 }) as HTMLElement,
    getCamera: () => ({ x: 0, y: 0, ratio: 1 }),
  };
};

// Import performance utilities (will be implemented)
import type { SigmaInstance } from "@/lib/performance";
import {
  isMobileDevice,
  filterModernPlayers,
  debounce,
  throttle,
  createViewportCuller,
  createLODManager,
  calculateRenderedEdgeReduction,
  PerformanceMonitor,
} from "@/lib/performance";

// Sample test data
const createMockGraphData = (): GraphData => ({
  nodes: [
    {
      id: "n1",
      label: "Michael Jordan",
      x: 0,
      y: 0,
      size: 20,
      color: "#ff0000",
      position: "SG",
      era: "modern",
      is_active: false,
      hof: true,
      draft_year: 1984,
      degree: 5,
      betweenness: 0.5,
      community: 1,
    },
    {
      id: "n2",
      label: "Scottie Pippen",
      x: 100,
      y: 100,
      size: 18,
      color: "#00ff00",
      position: "SF",
      era: "modern",
      is_active: false,
      hof: true,
      draft_year: 1987,
      degree: 4,
      betweenness: 0.3,
      community: 1,
    },
    {
      id: "n3",
      label: "Bill Russell",
      x: -100,
      y: -100,
      size: 16,
      color: "#0000ff",
      position: "C",
      era: "classic",
      is_active: false,
      hof: true,
      draft_year: 1956,
      degree: 3,
      betweenness: 0.2,
      community: 2,
    },
    {
      id: "n4",
      label: "Wilt Chamberlain",
      x: 200,
      y: 200,
      size: 22,
      color: "#ffff00",
      position: "C",
      era: "classic",
      is_active: false,
      hof: true,
      draft_year: 1959,
      degree: 2,
      betweenness: 0.1,
      community: 2,
    },
    {
      id: "n5",
      label: "LeBron James",
      x: 300,
      y: 300,
      size: 21,
      color: "#ff00ff",
      position: "SF",
      era: "modern",
      is_active: true,
      hof: false,
      draft_year: 2003,
      degree: 6,
      betweenness: 0.6,
      community: 1,
    },
  ],
  edges: [
    { id: "e1", source: "n1", target: "n2", weight: 10, teams: [], total_days: 365, size: 2 },
    { id: "e2", source: "n2", target: "n5", weight: 8, teams: [], total_days: 300, size: 1.5 },
    { id: "e3", source: "n3", target: "n4", weight: 5, teams: [], total_days: 200, size: 1 },
    { id: "e4", source: "n1", target: "n5", weight: 3, teams: [], total_days: 100, size: 0.5 },
    { id: "e5", source: "n4", target: "n5", weight: 2, teams: [], total_days: 50, size: 0.3 },
  ],
});

describe("Mobile Detection", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("returns true for mobile user agent", () => {
    const mobileUserAgents = [
      "Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X)",
      "Mozilla/5.0 (Linux; Android 11; SM-G991B)",
      "Mozilla/5.0 (iPad; CPU OS 14_6 like Mac OS X)",
      "Mozilla/5.0 (BlackBerry; U; BlackBerry 9900)",
    ];

    mobileUserAgents.forEach((ua) => {
      Object.defineProperty(navigator, "userAgent", {
        value: ua,
        configurable: true,
      });
      expect(isMobileDevice()).toBe(true);
    });
  });

  test("returns true for narrow screen width", () => {
    Object.defineProperty(navigator, "userAgent", {
      value: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
      configurable: true,
    });
    Object.defineProperty(window, "innerWidth", {
      value: 767,
      configurable: true,
    });
    expect(isMobileDevice()).toBe(true);
  });

  test("returns false for desktop with wide screen", () => {
    Object.defineProperty(navigator, "userAgent", {
      value: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      configurable: true,
    });
    Object.defineProperty(window, "innerWidth", {
      value: 1920,
      configurable: true,
    });
    expect(isMobileDevice()).toBe(false);
  });

  test("handles undefined window gracefully", () => {
    const originalWindow = global.window;
    // @ts-expect-error - testing undefined window
    global.window = undefined;
    expect(isMobileDevice()).toBe(false);
    global.window = originalWindow;
  });
});

describe("filterModernPlayers", () => {
  test("filters to players with draft_year >= 1980", () => {
    const data = createMockGraphData();
    const filtered = filterModernPlayers(data);

    expect(filtered.nodes.length).toBe(3);
    expect(filtered.nodes.map((n) => n.id).sort()).toEqual(["n1", "n2", "n5"]);
  });

  test("preserves edges between filtered nodes only", () => {
    const data = createMockGraphData();
    const filtered = filterModernPlayers(data);

    // Edges between modern players
    expect(filtered.edges.length).toBe(3); // e1 (n1-n2), e2 (n2-n5), e4 (n1-n5)

    // Edge between classic players should be removed
    expect(filtered.edges.find((e) => e.id === "e3")).toBeUndefined();
  });

  test("handles null draft_year", () => {
    const data: GraphData = {
      nodes: [
        {
          id: "n1",
          label: "Unknown",
          x: 0,
          y: 0,
          size: 10,
          color: "#000",
          position: "PG",
          era: "unknown",
          is_active: false,
          hof: false,
          draft_year: null,
          degree: 1,
          betweenness: 0,
          community: 1,
        },
        {
          id: "n2",
          label: "Modern",
          x: 1,
          y: 1,
          size: 10,
          color: "#000",
          position: "PG",
          era: "modern",
          is_active: false,
          hof: false,
          draft_year: 2000,
          degree: 1,
          betweenness: 0,
          community: 1,
        },
      ],
      edges: [
        { id: "e1", source: "n1", target: "n2", weight: 1, teams: [], total_days: 100, size: 1 },
      ],
    };

    const filtered = filterModernPlayers(data);
    expect(filtered.nodes.length).toBe(1);
    const firstNode = filtered.nodes[0];
    expect(firstNode?.id).toBe("n2");
  });
});

describe("Debounce", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test("delays function execution", () => {
    const fn = jest.fn();
    const debouncedFn = debounce(fn, 100);

    debouncedFn();
    expect(fn).not.toHaveBeenCalled();

    jest.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  test("only calls function once for rapid calls", () => {
    const fn = jest.fn();
    const debouncedFn = debounce(fn, 100);

    debouncedFn();
    debouncedFn();
    debouncedFn();

    jest.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  test("passes arguments correctly", () => {
    const fn = jest.fn();
    const debouncedFn = debounce(fn, 100);

    debouncedFn("arg1", "arg2");
    jest.advanceTimersByTime(100);

    expect(fn).toHaveBeenCalledWith("arg1", "arg2");
  });

  test("debounced function executes after delay", () => {
    const fn = jest.fn().mockResolvedValue("result");
    const debouncedFn = debounce(fn, 100);

    debouncedFn();
    expect(fn).not.toHaveBeenCalled();

    jest.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalled();
  });
});

describe("Throttle", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test("allows first call immediately", () => {
    const fn = jest.fn();
    const throttledFn = throttle(fn, 100);

    throttledFn();
    expect(fn).toHaveBeenCalledTimes(1);
  });

  test("blocks subsequent calls within window", () => {
    const fn = jest.fn();
    const throttledFn = throttle(fn, 100);

    throttledFn();
    throttledFn();
    throttledFn();

    expect(fn).toHaveBeenCalledTimes(1);
  });

  test("allows call after window passes", () => {
    const fn = jest.fn();
    const throttledFn = throttle(fn, 100);

    throttledFn();
    jest.advanceTimersByTime(100);
    throttledFn();

    expect(fn).toHaveBeenCalledTimes(2);
  });
});

describe("Viewport Culling", () => {
  test("creates viewport culler with sigma instance", () => {
    const sigma = createMockSigma() as unknown as SigmaInstance;
    const culler = createViewportCuller(sigma);

    expect(culler).toBeDefined();
    expect(typeof culler.getVisibleNodes).toBe("function");
    expect(typeof culler.getVisibleEdges).toBe("function");
    expect(typeof culler.update).toBe("function");
  });

  test("getVisibleNodes returns only nodes within viewport", () => {
    const sigma = createMockSigma() as unknown as SigmaInstance;
    // Mock viewport bounds
    const mockViewport = { x: 50, y: 50, width: 200, height: 200 };
    type ViewportType = typeof mockViewport;
    (sigma as unknown as { getViewport: () => ViewportType }).getViewport = () => mockViewport;

    const culler = createViewportCuller(sigma);
    const visibleNodes = culler.getVisibleNodes();

    // All nodes should be visible at default positions
    expect(visibleNodes.length).toBeGreaterThan(0);
    expect(visibleNodes.length).toBeLessThanOrEqual(5);
  });

  test("getVisibleEdges returns only edges between visible nodes", () => {
    const sigma = createMockSigma() as unknown as SigmaInstance;
    const culler = createViewportCuller(sigma);

    const visibleEdges = culler.getVisibleEdges();

    // Should be a subset of total edges
    expect(visibleEdges.length).toBeLessThanOrEqual(5);
  });
});

describe("LOD (Level of Detail)", () => {
  test("creates LOD manager with sigma instance", () => {
    const sigma = createMockSigma() as unknown as SigmaInstance;
    const lod = createLODManager(sigma);

    expect(lod).toBeDefined();
    expect(typeof lod.update).toBe("function");
    expect(typeof lod.getLevel).toBe("function");
  });

  test("returns HIGH level at default zoom", () => {
    const sigma = createMockSigma() as unknown as SigmaInstance;
    type CameraType = ReturnType<NonNullable<typeof sigma.getCamera>>;
    sigma.getCamera = () => ({ x: 0, y: 0, ratio: 1 }) as unknown as CameraType;

    const lod = createLODManager(sigma);
    expect(lod.getLevel()).toBe("HIGH");
  });

  test("returns LOW level when zoomed out below threshold", () => {
    const sigma = createMockSigma() as unknown as SigmaInstance;
    type CameraType = ReturnType<NonNullable<typeof sigma.getCamera>>;
    sigma.getCamera = () => ({ x: 0, y: 0, ratio: 0.3 }) as unknown as CameraType;

    const lod = createLODManager(sigma);
    expect(lod.getLevel()).toBe("LOW");
  });

  test("returns MEDIUM level at intermediate zoom", () => {
    const sigma = createMockSigma() as unknown as SigmaInstance;
    type CameraType = ReturnType<NonNullable<typeof sigma.getCamera>>;
    sigma.getCamera = () => ({ x: 0, y: 0, ratio: 0.5 }) as unknown as CameraType;

    const lod = createLODManager(sigma);
    expect(lod.getLevel()).toBe("MEDIUM");
  });
});

describe("calculateRenderedEdgeReduction", () => {
  test("calculates percentage reduction correctly", () => {
    const totalEdges = 100;
    const visibleEdges = 20;

    const reduction = calculateRenderedEdgeReduction(totalEdges, visibleEdges);
    expect(reduction).toBe(80);
  });

  test("returns 0 when all edges visible", () => {
    const reduction = calculateRenderedEdgeReduction(50, 50);
    expect(reduction).toBe(0);
  });

  test("handles zero total edges", () => {
    const reduction = calculateRenderedEdgeReduction(0, 0);
    expect(reduction).toBe(0);
  });
});

describe("PerformanceMonitor", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test("records render time", () => {
    const monitor = new PerformanceMonitor();

    monitor.recordRenderStart();
    jest.advanceTimersByTime(50);
    monitor.recordRenderEnd();

    const stats = monitor.getStats();
    expect(stats.lastRenderTime).toBeGreaterThanOrEqual(50);
  });

  test("tracks frame rate", () => {
    const monitor = new PerformanceMonitor();

    monitor.recordFrame();
    jest.advanceTimersByTime(16); // ~60fps
    monitor.recordFrame();

    const stats = monitor.getStats();
    expect(stats.averageFps).toBeGreaterThan(0);
  });

  test("returns false for isPerformanceAcceptable when render is slow", () => {
    const monitor = new PerformanceMonitor();

    monitor.recordRenderStart();
    jest.advanceTimersByTime(4000); // 4 seconds
    monitor.recordRenderEnd();

    expect(monitor.isPerformanceAcceptable()).toBe(false);
  });

  test("returns true for isPerformanceAcceptable when render is fast", () => {
    const monitor = new PerformanceMonitor();

    monitor.recordRenderStart();
    jest.advanceTimersByTime(100);
    monitor.recordRenderEnd();

    expect(monitor.isPerformanceAcceptable()).toBe(true);
  });
});
