import type { GraphData, NodeData } from "./graph-types";

export function isMobileDevice(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  const userAgent = navigator.userAgent.toLowerCase();
  const mobileKeywords = ["android", "iphone", "ipad", "ipod", "blackberry", "mobile"];
  const isMobileUA = mobileKeywords.some((keyword) => userAgent.includes(keyword));

  if (isMobileUA) {
    return true;
  }

  const isNarrowScreen = window.innerWidth < 768;
  return isNarrowScreen;
}

export function filterModernPlayers(data: GraphData): GraphData {
  const modernNodes = data.nodes.filter((node: NodeData) => {
    if (node.draft_year === null) {
      return false;
    }
    return node.draft_year >= 1980;
  });

  const modernNodeIds = new Set(modernNodes.map((n) => n.id));

  const modernEdges = data.edges.filter(
    (edge) => modernNodeIds.has(edge.source) && modernNodeIds.has(edge.target),
  );

  return {
    nodes: modernNodes,
    edges: modernEdges,
  };
}

export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number,
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return function (this: unknown, ...args: Parameters<T>): void {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      fn.apply(this, args);
    }, delay);
  };
}

export function throttle<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number,
): (...args: Parameters<T>) => void {
  let lastCall = 0;

  return function (this: unknown, ...args: Parameters<T>): void {
    const now = Date.now();

    if (now - lastCall >= delay) {
      lastCall = now;
      fn.apply(this, args);
    }
  };
}

export interface SigmaCamera {
  x: number;
  y: number;
  ratio: number;
}

export interface SigmaViewport {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface SigmaInstance {
  getGraph: () => GraphInstance;
  getCamera: () => SigmaCamera;
  getContainer: () => HTMLElement | null;
}

export interface GraphInstance {
  nodes: (iterator?: "out" | "in" | "undirected") => string[];
  edges: (iterator?: "out" | "in" | "undirected") => string[];
  node: (id: string) => { x: number; y: number; size: number; [key: string]: unknown };
  edge: (id: string) => { source: string; target: string; [key: string]: unknown };
  hasEdge: (source: string, target: string, directed?: boolean) => boolean;
  inEdges: (nodeId: string) => string[];
  outEdges: (nodeId: string) => string[];
  undirectedEdges: (nodeId: string) => string[];
  forEachEdge: (
    callback: (
      edgeId: string,
      attributes: { source: string; target: string },
      source: string,
      target: string,
      sourceBag: unknown,
      targetBag: unknown,
    ) => void,
  ) => void;
}

export interface ViewportCuller {
  getVisibleNodes: () => string[];
  getVisibleEdges: () => string[];
  update: () => void;
}

export function createViewportCuller(sigma: SigmaInstance): ViewportCuller {
  const getVisibleNodes = (): string[] => {
    const graph = sigma.getGraph();
    const camera = sigma.getCamera();
    const container = sigma.getContainer();

    if (!container) return [];

    const viewportWidth = container.clientWidth;
    const viewportHeight = container.clientHeight;

    const cameraX = camera.x;
    const cameraY = camera.y;
    const ratio = camera.ratio;

    const halfWidth = viewportWidth / 2 / ratio;
    const halfHeight = viewportHeight / 2 / ratio;

    const minX = cameraX - halfWidth;
    const maxX = cameraX + halfWidth;
    const minY = cameraY - halfHeight;
    const maxY = cameraY + halfHeight;

    const nodes: string[] = [];

    graph.nodes().forEach((nodeId) => {
      const node = graph.node(nodeId);
      const nodeX = node.x;
      const nodeY = node.y;

      if (nodeX >= minX && nodeX <= maxX && nodeY >= minY && nodeY <= maxY) {
        nodes.push(nodeId);
      }
    });

    return nodes;
  };

  const getVisibleEdges = (): string[] => {
    const graph = sigma.getGraph();
    const visibleNodes = new Set(getVisibleNodes());
    const visibleEdges: string[] = [];

    graph.forEachEdge((edgeId, attrs, source, target) => {
      if (visibleNodes.has(source) && visibleNodes.has(target)) {
        visibleEdges.push(edgeId);
      }
    });

    return visibleEdges;
  };

  return {
    getVisibleNodes,
    getVisibleEdges,
    update: () => {},
  };
}

export type LODLevel = "HIGH" | "MEDIUM" | "LOW";

export interface LODManager {
  update: () => void;
  getLevel: () => LODLevel;
  getNodeSizeMultiplier: () => number;
  shouldShowLabels: () => boolean;
}

const LOD_THRESHOLD_LOW = 0.5;
const LOD_THRESHOLD_MEDIUM = 0.75;

export function createLODManager(_sigma: SigmaInstance): LODManager {
  let currentLevel: LODLevel = "HIGH";

  const getLevel = (): LODLevel => {
    const camera = _sigma.getCamera();
    const ratio = camera.ratio;

    if (ratio < LOD_THRESHOLD_LOW) {
      currentLevel = "LOW";
    } else if (ratio < LOD_THRESHOLD_MEDIUM) {
      currentLevel = "MEDIUM";
    } else {
      currentLevel = "HIGH";
    }

    return currentLevel;
  };

  const getNodeSizeMultiplier = (): number => {
    const level = getLevel();
    switch (level) {
      case "LOW":
        return 0.5;
      case "MEDIUM":
        return 0.75;
      case "HIGH":
        return 1.0;
    }
  };

  const shouldShowLabels = (): boolean => {
    return getLevel() === "HIGH";
  };

  return {
    update: () => {
      getLevel();
    },
    getLevel,
    getNodeSizeMultiplier,
    shouldShowLabels,
  };
}

export function calculateRenderedEdgeReduction(totalEdges: number, visibleEdges: number): number {
  if (totalEdges === 0) {
    return 0;
  }

  const reduction = ((totalEdges - visibleEdges) / totalEdges) * 100;
  return Math.round(reduction * 100) / 100;
}

export class PerformanceMonitor {
  private renderStartTime: number = 0;
  private lastRenderTime: number = 0;
  private frameTimestamps: number[] = [];
  private frameCount: number = 0;

  recordRenderStart(): void {
    this.renderStartTime = performance.now();
  }

  recordRenderEnd(): void {
    this.lastRenderTime = performance.now() - this.renderStartTime;
  }

  recordFrame(): void {
    const now = performance.now();
    this.frameTimestamps.push(now);
    this.frameCount++;

    const oneSecondAgo = now - 1000;
    this.frameTimestamps = this.frameTimestamps.filter((ts) => ts > oneSecondAgo);
  }

  getStats(): {
    lastRenderTime: number;
    averageFps: number;
    totalFrames: number;
  } {
    const fps = this.frameTimestamps.length > 0 ? this.frameTimestamps.length : 0;

    return {
      lastRenderTime: this.lastRenderTime,
      averageFps: fps,
      totalFrames: this.frameCount,
    };
  }

  isPerformanceAcceptable(): boolean {
    return this.lastRenderTime < 3000;
  }
}

export class SearchWorker {
  private worker: Worker | null = null;
  private pendingQuery: string | null = null;
  private resolve: ((result: NodeData[]) => void) | null = null;

  constructor() {
    if (typeof Worker !== "undefined") {
      this.initWorker();
    }
  }

  private initWorker(): void {
    const workerCode = `
      self.onmessage = function(e) {
        const { nodes, query } = e.data;
        
        if (!query || !query.trim()) {
          self.postMessage(nodes);
          return;
        }
        
        const queryLower = query.toLowerCase();
        const filtered = nodes.filter(node => 
          node.label.toLowerCase().includes(queryLower)
        );
        
        self.postMessage(filtered);
      };
    `;

    const blob = new Blob([workerCode], { type: "application/javascript" });
    const url = URL.createObjectURL(blob);

    this.worker = new Worker(url);
    this.worker.onmessage = (e: MessageEvent<NodeData[]>) => {
      if (this.resolve) {
        this.resolve(e.data);
        this.resolve = null;
      }
    };
  }

  search(nodes: NodeData[], query: string): Promise<NodeData[]> {
    return new Promise((resolve) => {
      if (!this.worker) {
        const filtered = query.trim()
          ? nodes.filter((n) => n.label.toLowerCase().includes(query.toLowerCase()))
          : nodes;
        resolve(filtered);
        return;
      }

      this.resolve = resolve;
      this.worker.postMessage({ nodes, query });
    });
  }

  terminate(): void {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
  }
}
