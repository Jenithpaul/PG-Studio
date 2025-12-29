import { Schema, Table, Relation } from '@pg-studio/shared';
import { LayoutOptions, LayoutResult, PositionedNode, PositionedEdge, BoundingBox } from './types';

/**
 * Hierarchical layout algorithm based on foreign key relationships.
 * Tables with no incoming foreign keys (root tables) are placed at the top,
 * and dependent tables are placed in subsequent layers.
 */
export function applyHierarchicalLayout(
  schema: Schema,
  options: LayoutOptions
): LayoutResult {
  const startTime = Date.now();
  
  const { tables, relations } = schema;
  const { spacing, nodeSize, direction } = options;

  if (tables.length === 0) {
    return createEmptyResult(options, startTime);
  }

  // Build adjacency information
  const incomingEdges = new Map<string, Set<string>>();
  const outgoingEdges = new Map<string, Set<string>>();
  
  for (const table of tables) {
    incomingEdges.set(table.id, new Set());
    outgoingEdges.set(table.id, new Set());
  }

  for (const relation of relations) {
    // Source table has FK pointing to target table
    // In hierarchical view, target (referenced) table should be above source
    const incoming = incomingEdges.get(relation.sourceTable);
    if (incoming) {
      incoming.add(relation.targetTable);
    }
    const outgoing = outgoingEdges.get(relation.targetTable);
    if (outgoing) {
      outgoing.add(relation.sourceTable);
    }
  }

  // Assign layers using topological sort (Kahn's algorithm variant)
  const layers = assignLayers(tables, incomingEdges, outgoingEdges);
  
  // Position nodes within each layer
  const positionedNodes = positionNodesInLayers(
    layers,
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
      algorithm: 'hierarchical',
      direction,
      nodeCount: positionedNodes.length,
      edgeCount: positionedEdges.length,
      layerCount: layers.length,
      executionTimeMs: Date.now() - startTime,
    },
  };
}

function assignLayers(
  tables: Table[],
  incomingEdges: Map<string, Set<string>>,
  outgoingEdges: Map<string, Set<string>>
): Table[][] {
  const layers: Table[][] = [];
  const assigned = new Set<string>();
  const tableMap = new Map(tables.map(t => [t.id, t]));

  // Find root tables (tables that are referenced but don't reference others,
  // or tables with no incoming references in the FK graph)
  let currentLayer: Table[] = [];
  
  for (const table of tables) {
    const incoming = incomingEdges.get(table.id) || new Set();
    // A root table has no incoming edges (no FKs pointing to other tables)
    if (incoming.size === 0) {
      currentLayer.push(table);
      assigned.add(table.id);
    }
  }

  // If no root tables found (circular dependencies), start with first table
  if (currentLayer.length === 0 && tables.length > 0) {
    currentLayer.push(tables[0]);
    assigned.add(tables[0].id);
  }

  layers.push(currentLayer);

  // BFS to assign remaining tables to layers
  while (assigned.size < tables.length) {
    const nextLayer: Table[] = [];
    
    for (const table of tables) {
      if (assigned.has(table.id)) continue;
      
      const incoming = incomingEdges.get(table.id) || new Set();
      // Check if all referenced tables are already assigned
      let allDepsAssigned = true;
      for (const dep of incoming) {
        if (!assigned.has(dep)) {
          allDepsAssigned = false;
          break;
        }
      }
      
      if (allDepsAssigned) {
        nextLayer.push(table);
      }
    }

    // If no progress (circular dependency), add remaining tables
    if (nextLayer.length === 0) {
      for (const table of tables) {
        if (!assigned.has(table.id)) {
          nextLayer.push(table);
          break;
        }
      }
    }

    for (const table of nextLayer) {
      assigned.add(table.id);
    }
    
    if (nextLayer.length > 0) {
      layers.push(nextLayer);
    }
  }

  return layers;
}

function positionNodesInLayers(
  layers: Table[][],
  spacing: LayoutOptions['spacing'],
  nodeSize: LayoutOptions['nodeSize'],
  direction: LayoutOptions['direction']
): PositionedNode[] {
  const nodes: PositionedNode[] = [];
  const isHorizontal = direction === 'left_right' || direction === 'right_left';
  const isReversed = direction === 'bottom_up' || direction === 'right_left';

  // Calculate max width of each layer for centering
  const maxLayerWidth = Math.max(...layers.map(layer => 
    layer.length * (nodeSize.width + spacing.nodeSpacing) - spacing.nodeSpacing
  ));

  for (let layerIndex = 0; layerIndex < layers.length; layerIndex++) {
    const layer = layers[layerIndex];
    const layerWidth = layer.length * (nodeSize.width + spacing.nodeSpacing) - spacing.nodeSpacing;
    const layerOffset = (maxLayerWidth - layerWidth) / 2;

    for (let nodeIndex = 0; nodeIndex < layer.length; nodeIndex++) {
      const table = layer[nodeIndex];
      
      let x: number, y: number;
      
      if (isHorizontal) {
        const layerPos = layerIndex * (nodeSize.width + spacing.layerSpacing);
        x = isReversed ? -layerPos : layerPos;
        y = layerOffset + nodeIndex * (nodeSize.height + spacing.nodeSpacing);
      } else {
        x = layerOffset + nodeIndex * (nodeSize.width + spacing.nodeSpacing);
        const layerPos = layerIndex * (nodeSize.height + spacing.layerSpacing);
        y = isReversed ? -layerPos : layerPos;
      }

      nodes.push({
        id: table.id,
        position: { x, y },
        size: { ...nodeSize },
        layer: layerIndex,
        rank: nodeIndex,
      });
    }
  }

  return nodes;
}

function createPositionedEdges(relations: Relation[]): PositionedEdge[] {
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
      algorithm: 'hierarchical',
      direction: options.direction,
      nodeCount: 0,
      edgeCount: 0,
      layerCount: 0,
      executionTimeMs: Date.now() - startTime,
    },
  };
}
