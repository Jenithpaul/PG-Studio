import { Schema, Table } from '@pg-studio/shared';
import { LayoutOptions, LayoutResult, PositionedNode, PositionedEdge, BoundingBox } from './types';

/**
 * Grid layout algorithm for structured arrangement.
 * Tables are arranged in a grid pattern, optionally sorted by relationship count.
 */
export function applyGridLayout(
  schema: Schema,
  options: LayoutOptions
): LayoutResult {
  const startTime = Date.now();
  
  const { tables, relations } = schema;
  const { spacing, nodeSize, direction } = options;

  if (tables.length === 0) {
    return createEmptyResult(options, startTime);
  }

  // Calculate relationship counts for sorting
  const relationCounts = calculateRelationCounts(tables, relations);
  
  // Sort tables by relationship count (most connected first)
  const sortedTables = [...tables].sort((a, b) => {
    return (relationCounts.get(b.id) || 0) - (relationCounts.get(a.id) || 0);
  });

  // Calculate grid dimensions
  const columns = Math.ceil(Math.sqrt(tables.length));
  const rows = Math.ceil(tables.length / columns);

  // Position nodes in grid
  const positionedNodes = positionNodesInGrid(
    sortedTables,
    columns,
    spacing,
    nodeSize,
    direction
  );

  // Create positioned edges
  const positionedEdges = createPositionedEdges(relations);

  // Calculate bounding box
  const bounds = calculateBounds(positionedNodes);

  return {
    nodes: positionedNodes,
    edges: positionedEdges,
    bounds,
    metadata: {
      algorithm: 'grid',
      direction,
      nodeCount: positionedNodes.length,
      edgeCount: positionedEdges.length,
      executionTimeMs: Date.now() - startTime,
    },
  };
}

function calculateRelationCounts(
  tables: Table[],
  relations: { sourceTable: string; targetTable: string }[]
): Map<string, number> {
  const counts = new Map<string, number>();
  
  for (const table of tables) {
    counts.set(table.id, 0);
  }

  for (const relation of relations) {
    counts.set(relation.sourceTable, (counts.get(relation.sourceTable) || 0) + 1);
    counts.set(relation.targetTable, (counts.get(relation.targetTable) || 0) + 1);
  }

  return counts;
}

function positionNodesInGrid(
  tables: Table[],
  columns: number,
  spacing: LayoutOptions['spacing'],
  nodeSize: LayoutOptions['nodeSize'],
  direction: LayoutOptions['direction']
): PositionedNode[] {
  const nodes: PositionedNode[] = [];
  const isHorizontal = direction === 'left_right' || direction === 'right_left';
  const isReversed = direction === 'bottom_up' || direction === 'right_left';

  const cellWidth = nodeSize.width + spacing.nodeSpacing;
  const cellHeight = nodeSize.height + spacing.layerSpacing;

  for (let i = 0; i < tables.length; i++) {
    const table = tables[i];
    const col = i % columns;
    const row = Math.floor(i / columns);

    let x: number, y: number;

    if (isHorizontal) {
      x = isReversed ? -row * cellWidth : row * cellWidth;
      y = col * cellHeight;
    } else {
      x = col * cellWidth;
      y = isReversed ? -row * cellHeight : row * cellHeight;
    }

    nodes.push({
      id: table.id,
      position: { x, y },
      size: { ...nodeSize },
      rank: i,
    });
  }

  return nodes;
}

function createPositionedEdges(relations: { id: string; sourceTable: string; targetTable: string; sourceColumn: string; targetColumn: string }[]): PositionedEdge[] {
  return relations.map(relation => ({
    id: relation.id,
    source: relation.sourceTable,
    target: relation.targetTable,
    sourceHandle: `${relation.sourceColumn}-source`,
    targetHandle: `${relation.targetColumn}-target`,
  }));
}

function calculateBounds(nodes: PositionedNode[]): BoundingBox {
  if (nodes.length === 0) {
    return { x: 0, y: 0, width: 0, height: 0 };
  }

  let minX = Infinity, minY = Infinity;
  let maxX = -Infinity, maxY = -Infinity;

  for (const node of nodes) {
    minX = Math.min(minX, node.position.x);
    minY = Math.min(minY, node.position.y);
    maxX = Math.max(maxX, node.position.x + node.size.width);
    maxY = Math.max(maxY, node.position.y + node.size.height);
  }

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  };
}

function createEmptyResult(options: LayoutOptions, startTime: number): LayoutResult {
  return {
    nodes: [],
    edges: [],
    bounds: { x: 0, y: 0, width: 0, height: 0 },
    metadata: {
      algorithm: 'grid',
      direction: options.direction,
      nodeCount: 0,
      edgeCount: 0,
      executionTimeMs: Date.now() - startTime,
    },
  };
}
