import { MemoryStats } from './types';

/**
 * Memory threshold for triggering cleanup (500MB as per requirements)
 */
const MEMORY_THRESHOLD_MB = 500;
const MEMORY_THRESHOLD_BYTES = MEMORY_THRESHOLD_MB * 1024 * 1024;

/**
 * Get current memory usage statistics
 */
export function getMemoryStats(): MemoryStats {
  const stats: MemoryStats = {
    timestamp: new Date()
  };
  
  // Check if performance.memory is available (Chrome only)
  if (typeof performance !== 'undefined' && (performance as any).memory) {
    const memory = (performance as any).memory;
    stats.usedJSHeapSize = memory.usedJSHeapSize;
    stats.totalJSHeapSize = memory.totalJSHeapSize;
    stats.jsHeapSizeLimit = memory.jsHeapSizeLimit;
    stats.usagePercentage = (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100;
  }
  
  return stats;
}

/**
 * Check if memory usage exceeds threshold
 */
export function isMemoryThresholdExceeded(): boolean {
  const stats = getMemoryStats();
  if (stats.usedJSHeapSize !== undefined) {
    return stats.usedJSHeapSize > MEMORY_THRESHOLD_BYTES;
  }
  return false;
}

/**
 * Memory cleanup callback type
 */
export type CleanupCallback = () => void;

/**
 * Create a memory monitor that triggers cleanup when threshold is exceeded
 */
export function createMemoryMonitor(
  onThresholdExceeded: CleanupCallback,
  checkIntervalMs: number = 30000
) {
  let intervalId: ReturnType<typeof setInterval> | null = null;
  let isRunning = false;
  
  const check = () => {
    if (isMemoryThresholdExceeded()) {
      onThresholdExceeded();
    }
  };
  
  return {
    /**
     * Start monitoring memory usage
     */
    start(): void {
      if (isRunning) return;
      isRunning = true;
      intervalId = setInterval(check, checkIntervalMs);
      // Initial check
      check();
    },
    
    /**
     * Stop monitoring memory usage
     */
    stop(): void {
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }
      isRunning = false;
    },
    
    /**
     * Manually trigger a memory check
     */
    check(): boolean {
      const exceeded = isMemoryThresholdExceeded();
      if (exceeded) {
        onThresholdExceeded();
      }
      return exceeded;
    },
    
    /**
     * Get current memory stats
     */
    getStats(): MemoryStats {
      return getMemoryStats();
    },
    
    /**
     * Check if monitor is running
     */
    isRunning(): boolean {
      return isRunning;
    }
  };
}

/**
 * Cache with automatic cleanup based on size and age
 */
export function createLRUCache<K, V>(maxSize: number = 100) {
  const cache = new Map<K, { value: V; timestamp: number }>();
  
  const cleanup = () => {
    if (cache.size <= maxSize) return;
    
    // Remove oldest entries
    const entries = Array.from(cache.entries())
      .sort((a, b) => a[1].timestamp - b[1].timestamp);
    
    const toRemove = entries.slice(0, cache.size - maxSize);
    for (const [key] of toRemove) {
      cache.delete(key);
    }
  };
  
  return {
    get(key: K): V | undefined {
      const entry = cache.get(key);
      if (entry) {
        entry.timestamp = Date.now();
        return entry.value;
      }
      return undefined;
    },
    
    set(key: K, value: V): void {
      cache.set(key, { value, timestamp: Date.now() });
      cleanup();
    },
    
    has(key: K): boolean {
      return cache.has(key);
    },
    
    delete(key: K): boolean {
      return cache.delete(key);
    },
    
    clear(): void {
      cache.clear();
    },
    
    size(): number {
      return cache.size;
    }
  };
}

/**
 * Debounce function to prevent excessive calls
 */
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delayMs: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  
  return (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      fn(...args);
      timeoutId = null;
    }, delayMs);
  };
}

/**
 * Throttle function to limit call frequency
 */
export function throttle<T extends (...args: any[]) => any>(
  fn: T,
  limitMs: number
): (...args: Parameters<T>) => void {
  let lastCall = 0;
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  
  return (...args: Parameters<T>) => {
    const now = Date.now();
    const timeSinceLastCall = now - lastCall;
    
    if (timeSinceLastCall >= limitMs) {
      lastCall = now;
      fn(...args);
    } else if (!timeoutId) {
      timeoutId = setTimeout(() => {
        lastCall = Date.now();
        fn(...args);
        timeoutId = null;
      }, limitMs - timeSinceLastCall);
    }
  };
}
