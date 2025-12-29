import { useState, useEffect, useCallback, useMemo, useRef } from 'react';

/**
 * Memory stats interface
 */
interface MemoryStats {
  usedJSHeapSize?: number;
  totalJSHeapSize?: number;
  jsHeapSizeLimit?: number;
  usagePercentage?: number;
}

/**
 * Hook for monitoring memory usage
 */
export function useMemoryMonitor(
  thresholdMB: number = 500,
  checkIntervalMs: number = 30000
) {
  const [memoryStats, setMemoryStats] = useState<MemoryStats>({});
  const [isThresholdExceeded, setIsThresholdExceeded] = useState(false);
  
  useEffect(() => {
    const checkMemory = () => {
      if (typeof performance !== 'undefined' && (performance as any).memory) {
        const memory = (performance as any).memory;
        const stats: MemoryStats = {
          usedJSHeapSize: memory.usedJSHeapSize,
          totalJSHeapSize: memory.totalJSHeapSize,
          jsHeapSizeLimit: memory.jsHeapSizeLimit,
          usagePercentage: (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100
        };
        setMemoryStats(stats);
        setIsThresholdExceeded(memory.usedJSHeapSize > thresholdMB * 1024 * 1024);
      }
    };
    
    checkMemory();
    const intervalId = setInterval(checkMemory, checkIntervalMs);
    
    return () => clearInterval(intervalId);
  }, [thresholdMB, checkIntervalMs]);
  
  return { memoryStats, isThresholdExceeded };
}

/**
 * Hook for debouncing values
 */
export function useDebounce<T>(value: T, delayMs: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);
  
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedValue(value);
    }, delayMs);
    
    return () => clearTimeout(timeoutId);
  }, [value, delayMs]);
  
  return debouncedValue;
}

/**
 * Hook for throttling callbacks
 */
export function useThrottle<T extends (...args: any[]) => any>(
  callback: T,
  limitMs: number
): T {
  const lastCall = useRef(0);
  const timeoutId = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  return useCallback((...args: Parameters<T>) => {
    const now = Date.now();
    const timeSinceLastCall = now - lastCall.current;
    
    if (timeSinceLastCall >= limitMs) {
      lastCall.current = now;
      callback(...args);
    } else if (!timeoutId.current) {
      timeoutId.current = setTimeout(() => {
        lastCall.current = Date.now();
        callback(...args);
        timeoutId.current = null;
      }, limitMs - timeSinceLastCall);
    }
  }, [callback, limitMs]) as T;
}

/**
 * Hook for virtual scrolling
 */
export function useVirtualScroll<T>(
  items: T[],
  containerHeight: number,
  itemHeight: number = 40,
  overscan: number = 5
) {
  const [scrollTop, setScrollTop] = useState(0);
  
  const result = useMemo(() => {
    const totalHeight = items.length * itemHeight;
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const visibleCount = Math.ceil(containerHeight / itemHeight) + 2 * overscan;
    const endIndex = Math.min(items.length - 1, startIndex + visibleCount);
    const visibleItems = items.slice(startIndex, endIndex + 1);
    const offsetY = startIndex * itemHeight;
    
    return {
      visibleItems,
      startIndex,
      endIndex,
      totalHeight,
      offsetY
    };
  }, [items, scrollTop, containerHeight, itemHeight, overscan]);
  
  const handleScroll = useCallback((e: React.UIEvent<HTMLElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);
  
  const scrollToIndex = useCallback((index: number) => {
    setScrollTop(index * itemHeight);
  }, [itemHeight]);
  
  return {
    ...result,
    scrollTop,
    handleScroll,
    scrollToIndex
  };
}

/**
 * Hook for lazy loading items
 */
export function useLazyLoad<T>(
  items: T[],
  chunkSize: number = 20,
  loadDelayMs: number = 50
) {
  const [loadedItems, setLoadedItems] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const loadedChunks = useRef(0);
  
  const chunks = useMemo(() => {
    const result: T[][] = [];
    for (let i = 0; i < items.length; i += chunkSize) {
      result.push(items.slice(i, i + chunkSize));
    }
    return result;
  }, [items, chunkSize]);
  
  const loadNext = useCallback(async () => {
    if (loadedChunks.current >= chunks.length || isLoading) {
      return;
    }
    
    setIsLoading(true);
    
    const chunk = chunks[loadedChunks.current];
    loadedChunks.current++;
    
    await new Promise(resolve => setTimeout(resolve, loadDelayMs));
    
    setLoadedItems(prev => [...prev, ...chunk]);
    setProgress(loadedChunks.current / chunks.length);
    setIsLoading(false);
  }, [chunks, isLoading, loadDelayMs]);
  
  const loadAll = useCallback(async () => {
    while (loadedChunks.current < chunks.length) {
      await loadNext();
    }
  }, [chunks.length, loadNext]);
  
  const reset = useCallback(() => {
    loadedChunks.current = 0;
    setLoadedItems([]);
    setProgress(0);
  }, []);
  
  // Reset when items change
  useEffect(() => {
    reset();
  }, [items, reset]);
  
  return {
    loadedItems,
    isLoading,
    progress,
    isComplete: loadedChunks.current >= chunks.length,
    loadNext,
    loadAll,
    reset
  };
}

/**
 * Hook for viewport culling
 */
export function useViewportCulling<T extends { id: string; x: number; y: number; width: number; height: number }>(
  nodes: T[],
  viewport: { x: number; y: number; width: number; height: number; zoom: number },
  padding: number = 100
) {
  return useMemo(() => {
    const viewLeft = viewport.x - padding / viewport.zoom;
    const viewRight = viewport.x + viewport.width / viewport.zoom + padding / viewport.zoom;
    const viewTop = viewport.y - padding / viewport.zoom;
    const viewBottom = viewport.y + viewport.height / viewport.zoom + padding / viewport.zoom;
    
    const visibleNodes: T[] = [];
    const hiddenNodeIds = new Set<string>();
    
    for (const node of nodes) {
      const nodeRight = node.x + node.width;
      const nodeBottom = node.y + node.height;
      
      const isVisible = !(
        node.x > viewRight ||
        nodeRight < viewLeft ||
        node.y > viewBottom ||
        nodeBottom < viewTop
      );
      
      if (isVisible) {
        visibleNodes.push(node);
      } else {
        hiddenNodeIds.add(node.id);
      }
    }
    
    return {
      visibleNodes,
      hiddenNodeIds,
      totalCount: nodes.length,
      visibleCount: visibleNodes.length
    };
  }, [nodes, viewport, padding]);
}

/**
 * Hook for FPS monitoring
 */
export function useFPSMonitor() {
  const [fps, setFps] = useState(60);
  const frameCount = useRef(0);
  const lastTime = useRef(performance.now());
  
  useEffect(() => {
    let animationId: number;
    
    const measureFPS = () => {
      frameCount.current++;
      const currentTime = performance.now();
      const elapsed = currentTime - lastTime.current;
      
      if (elapsed >= 1000) {
        setFps(Math.round((frameCount.current * 1000) / elapsed));
        frameCount.current = 0;
        lastTime.current = currentTime;
      }
      
      animationId = requestAnimationFrame(measureFPS);
    };
    
    animationId = requestAnimationFrame(measureFPS);
    
    return () => cancelAnimationFrame(animationId);
  }, []);
  
  return fps;
}
