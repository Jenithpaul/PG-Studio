import { ViewportBounds, NodeBounds, CullingResult } from './types';

/**
 * Padding around viewport for pre-loading nodes
 */
const VIEWPORT_PADDING = 100;

/**
 * Check if a node is visible within the viewport
 */
export function isNodeVisible(
  node: NodeBounds,
  viewport: ViewportBounds,
  padding: number = VIEWPORT_PADDING
): boolean {
  // Calculate viewport bounds with padding and zoom
  const viewLeft = viewport.x - padding / viewport.zoom;
  const viewRight = viewport.x + viewport.width / viewport.zoom + padding / viewport.zoom;
  const viewTop = viewport.y - padding / viewport.zoom;
  const viewBottom = viewport.y + viewport.height / viewport.zoom + padding / viewport.zoom;
  
  // Check if node intersects with viewport
  const nodeRight = node.x + node.width;
  const nodeBottom = node.y + node.height;
  
  return !(
    node.x > viewRight ||
    nodeRight < viewLeft ||
    node.y > viewBottom ||
    nodeBottom < viewTop
  );
}

/**
 * Perform viewport culling on a set of nodes
 */
export function cullNodes(
  nodes: NodeBounds[],
  viewport: ViewportBounds,
  padding: number = VIEWPORT_PADDING
): CullingResult {
  const visibleNodeIds = new Set<string>();
  const hiddenNodeIds = new Set<string>();
  
  for (const node of nodes) {
    if (isNodeVisible(node, viewport, padding)) {
      visibleNodeIds.add(node.id);
    } else {
      hiddenNodeIds.add(node.id);
    }
  }
  
  return {
    visibleNodeIds,
    hiddenNodeIds,
    totalNodes: nodes.length,
    visibleCount: visibleNodeIds.size
  };
}

/**
 * Calculate the bounding box of all nodes
 */
export function calculateBoundingBox(nodes: NodeBounds[]): ViewportBounds {
  if (nodes.length === 0) {
    return { x: 0, y: 0, width: 0, height: 0, zoom: 1 };
  }
  
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  
  for (const node of nodes) {
    minX = Math.min(minX, node.x);
    minY = Math.min(minY, node.y);
    maxX = Math.max(maxX, node.x + node.width);
    maxY = Math.max(maxY, node.y + node.height);
  }
  
  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
    zoom: 1
  };
}

/**
 * Get nodes that should be rendered based on viewport
 */
export function getVisibleNodes<T extends NodeBounds>(
  nodes: T[],
  viewport: ViewportBounds,
  padding: number = VIEWPORT_PADDING
): T[] {
  return nodes.filter(node => isNodeVisible(node, viewport, padding));
}
