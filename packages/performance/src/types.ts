/**
 * Viewport bounds for culling calculations
 */
export interface ViewportBounds {
  x: number;
  y: number;
  width: number;
  height: number;
  zoom: number;
}

/**
 * Node position and size for visibility calculations
 */
export interface NodeBounds {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Result of viewport culling
 */
export interface CullingResult {
  visibleNodeIds: Set<string>;
  hiddenNodeIds: Set<string>;
  totalNodes: number;
  visibleCount: number;
}

/**
 * Memory usage statistics
 */
export interface MemoryStats {
  usedJSHeapSize?: number;
  totalJSHeapSize?: number;
  jsHeapSizeLimit?: number;
  usagePercentage?: number;
  timestamp: Date;
}

/**
 * Performance metrics
 */
export interface PerformanceMetrics {
  renderTime: number;
  layoutTime: number;
  searchTime: number;
  memoryUsage: MemoryStats;
  nodeCount: number;
  edgeCount: number;
  fps: number;
}

/**
 * Chunk configuration for lazy loading
 */
export interface ChunkConfig {
  chunkSize: number;
  loadDelay: number;
  priorityField?: string;
}

/**
 * Virtual scrolling configuration
 */
export interface VirtualScrollConfig {
  itemHeight: number;
  overscan: number;
  containerHeight: number;
}

/**
 * Virtual scroll result
 */
export interface VirtualScrollResult<T> {
  visibleItems: T[];
  startIndex: number;
  endIndex: number;
  totalHeight: number;
  offsetY: number;
}
