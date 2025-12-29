import { ChunkConfig } from './types';

/**
 * Default chunk configuration
 */
const DEFAULT_CHUNK_CONFIG: ChunkConfig = {
  chunkSize: 20,
  loadDelay: 50
};

/**
 * Split an array into chunks for lazy loading
 */
export function chunkArray<T>(array: T[], chunkSize: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize));
  }
  return chunks;
}

/**
 * Load items in chunks with delay between each chunk
 */
export async function loadInChunks<T>(
  items: T[],
  onChunkLoaded: (chunk: T[], progress: number) => void,
  config: ChunkConfig = DEFAULT_CHUNK_CONFIG
): Promise<void> {
  const chunks = chunkArray(items, config.chunkSize);
  const totalChunks = chunks.length;
  
  for (let i = 0; i < totalChunks; i++) {
    const progress = (i + 1) / totalChunks;
    onChunkLoaded(chunks[i], progress);
    
    // Add delay between chunks to prevent UI blocking
    if (i < totalChunks - 1) {
      await new Promise(resolve => setTimeout(resolve, config.loadDelay));
    }
  }
}

/**
 * Create a lazy loader that loads items on demand
 */
export function createLazyLoader<T>(
  items: T[],
  config: ChunkConfig = DEFAULT_CHUNK_CONFIG
) {
  const chunks = chunkArray(items, config.chunkSize);
  let loadedChunks = 0;
  const loadedItems: T[] = [];
  
  return {
    /**
     * Load the next chunk of items
     */
    async loadNext(): Promise<T[]> {
      if (loadedChunks >= chunks.length) {
        return [];
      }
      
      const chunk = chunks[loadedChunks];
      loadedChunks++;
      loadedItems.push(...chunk);
      
      return chunk;
    },
    
    /**
     * Get all loaded items
     */
    getLoaded(): T[] {
      return loadedItems;
    },
    
    /**
     * Check if all items are loaded
     */
    isComplete(): boolean {
      return loadedChunks >= chunks.length;
    },
    
    /**
     * Get loading progress (0-1)
     */
    getProgress(): number {
      return chunks.length > 0 ? loadedChunks / chunks.length : 1;
    },
    
    /**
     * Reset the loader
     */
    reset(): void {
      loadedChunks = 0;
      loadedItems.length = 0;
    }
  };
}

/**
 * Priority-based lazy loader that loads high-priority items first
 */
export function createPriorityLoader<T>(
  items: T[],
  getPriority: (item: T) => number,
  config: ChunkConfig = DEFAULT_CHUNK_CONFIG
) {
  // Sort items by priority (higher priority first)
  const sortedItems = [...items].sort((a, b) => getPriority(b) - getPriority(a));
  return createLazyLoader(sortedItems, config);
}
