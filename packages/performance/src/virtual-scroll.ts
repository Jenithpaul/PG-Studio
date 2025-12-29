import { VirtualScrollConfig, VirtualScrollResult } from './types';

/**
 * Default virtual scroll configuration
 */
const DEFAULT_VIRTUAL_SCROLL_CONFIG: VirtualScrollConfig = {
  itemHeight: 40,
  overscan: 5,
  containerHeight: 400
};

/**
 * Calculate virtual scroll parameters
 */
export function calculateVirtualScroll<T>(
  items: T[],
  scrollTop: number,
  config: VirtualScrollConfig = DEFAULT_VIRTUAL_SCROLL_CONFIG
): VirtualScrollResult<T> {
  const { itemHeight, overscan, containerHeight } = config;
  const totalHeight = items.length * itemHeight;
  
  // Calculate visible range
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const visibleCount = Math.ceil(containerHeight / itemHeight) + 2 * overscan;
  const endIndex = Math.min(items.length - 1, startIndex + visibleCount);
  
  // Get visible items
  const visibleItems = items.slice(startIndex, endIndex + 1);
  
  // Calculate offset for positioning
  const offsetY = startIndex * itemHeight;
  
  return {
    visibleItems,
    startIndex,
    endIndex,
    totalHeight,
    offsetY
  };
}

/**
 * Create a virtual scroll manager
 */
export function createVirtualScrollManager<T>(
  items: T[],
  config: VirtualScrollConfig = DEFAULT_VIRTUAL_SCROLL_CONFIG
) {
  let currentScrollTop = 0;
  let currentItems = items;
  
  return {
    /**
     * Update scroll position and get visible items
     */
    scroll(scrollTop: number): VirtualScrollResult<T> {
      currentScrollTop = scrollTop;
      return calculateVirtualScroll(currentItems, scrollTop, config);
    },
    
    /**
     * Update the items list
     */
    setItems(newItems: T[]): VirtualScrollResult<T> {
      currentItems = newItems;
      return calculateVirtualScroll(currentItems, currentScrollTop, config);
    },
    
    /**
     * Get current visible items
     */
    getVisible(): VirtualScrollResult<T> {
      return calculateVirtualScroll(currentItems, currentScrollTop, config);
    },
    
    /**
     * Scroll to a specific item index
     */
    scrollToIndex(index: number): number {
      const scrollTop = index * config.itemHeight;
      currentScrollTop = scrollTop;
      return scrollTop;
    },
    
    /**
     * Get total height for scroll container
     */
    getTotalHeight(): number {
      return currentItems.length * config.itemHeight;
    }
  };
}

/**
 * Hook-friendly virtual scroll calculator
 */
export function useVirtualScroll<T>(
  items: T[],
  scrollTop: number,
  containerHeight: number,
  itemHeight: number = 40,
  overscan: number = 5
): VirtualScrollResult<T> {
  return calculateVirtualScroll(items, scrollTop, {
    itemHeight,
    overscan,
    containerHeight
  });
}
