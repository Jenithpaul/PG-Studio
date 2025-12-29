import { Schema, Table, Relation } from '@pg-studio/shared';
import { LayoutOptions, LayoutResult, PositionedNode, PositionedEdge, BoundingBox } from './types';

interface ForceNode {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  table: Table;
}

/**
 * Force-directed layout using physics simulation.
 * Nodes repel each other while edges act as springs pulling connected nodes together.
 */
export function applyForceDirectedLayout(
  schema: Schema,
  options: LayoutOptions
): LayoutResult {
  const startTime = Date.now();
  
  const { tables, relations } = schema;
  const { spacing, nodeSize } = options;

  if (tables.length === 0) {
    return createEmptyResult(options, startTime);
  }

  // Initialize nodes with random positions in a circle
  const forceNodes = initializeNodes(tables, nodeSize);
  
  // Build edge map for quick lookup
  const edgeMap = buildEdgeMap(relations);

  // Run simulation
  const iterations = 100;
  const coolingFactor = 0.95;
  let temperature = 100;

  const repulsionStrength = 5000;
  const attractionStrength = 0.01;
  const idealDistance = spacing.nodeSpacing + Math.max(nodeSize.width, nodeSize.height);

  for (let i = 0; i < iterations; i++) {
    // Reset velocities
    for (const node of forceNodes) {
      node.vx = 0;
      node.vy = 0;
    }

    // Apply repulsion forces between all pairs
    for (let j = 0; j < forceNodes.length; j++) {
      for (let k = j + 1; k < forceNodes.length; k++) {
        applyRepulsion(forceNodes[j], forceNodes[k], repulsionStrength);
      }
    }

    // Apply attraction forces along edges
    for (const relation of relations) {
      const sourceNode = forceNodes.find(n => n.id === relation.sourceTable);
      const targetNode = forceNodes.find(n => n.id === relation.targetTable);
      if (sourceNode && targetNode) {
        applyAttraction(sourceNode, targetNode, attractionStrength, idealDistance);
      }
    }

    // Update positions with temperature-limited movement
    for (const node of forceNodes) {
      const magnitude = Math.sqrt(node.vx * node.vx + node.vy * node.vy);
      if (magnitude > 0) {
        const scale = Math.min(magnitude, temperature) / magnitude;
        node.x += node.vx * scale;
        node.y += node.vy * scale;
      }
    }

    // Cool down
    temperature *= coolingFactor;
  }

  // Center the layout
  centerLayout(forceNodes);

  // Convert to positioned nodes
  const positionedNodes: PositionedNode[] = forceNodes.map(node => ({
    id: node.id,
    position: { x: node.x, y: node.y },
    size: { ...nodeSize },
  }));

  // Create positioned edges
  const positionedEdges = createPositionedEdges(relations);

  // Calculate bounding box
  const bounds = calculateBounds(positionedNodes);

  return {
    nodes: positionedNodes,
    edges: positionedEdges,
    bounds,
    metadata: {
      algorithm: 'force_directed',
      direction: options.direction,
      nodeCount: positionedNodes.length,
      edgeCount: positionedEdges.length,
      executionTimeMs: Date.now() - startTime,
    },
  };
}

function initializeNodes(tables: Table[], nodeSize: { width: number; height: number }): ForceNode[] {
  const nodes: ForceNode[] = [];
  const radius = Math.max(200, tables.length * 50);

  for (let i = 0; i < tables.length; i++) {
    const angle = (2 * Math.PI * i) / tables.length;
    nodes.push({
      id: tables[i].id,
      x: radius * Math.cos(angle),
      y: radius * Math.sin(angle),
      vx: 0,
      vy: 0,
      table: tables[i],
    });
  }

  return nodes;
}

function buildEdgeMap(relations: Relation[]): Map<string, Set<string>> {
  const edgeMap = new Map<string, Set<string>>();
  
  for (const relation of relations) {
    if (!edgeMap.has(relation.sourceTable)) {
      edgeMap.set(relation.sourceTable, new Set());
    }
    edgeMap.get(relation.sourceTable)!.add(relation.targetTable);
    
    if (!edgeMap.has(relation.targetTable)) {
      edgeMap.set(relation.targetTable, new Set());
    }
    edgeMap.get(relation.targetTable)!.add(relation.sourceTable);
  }

  return edgeMap;
}

function applyRepulsion(node1: ForceNode, node2: ForceNode, strength: number): void {
  const dx = node2.x - node1.x;
  const dy = node2.y - node1.y;
  const distSq = dx * dx + dy * dy;
  const dist = Math.sqrt(distSq) || 1;

  // Coulomb's law: F = k / r^2
  const force = strength / distSq;
  const fx = (dx / dist) * force;
  const fy = (dy / dist) * force;

  node1.vx -= fx;
  node1.vy -= fy;
  node2.vx += fx;
  node2.vy += fy;
}

function applyAttraction(
  node1: ForceNode,
  node2: ForceNode,
  strength: number,
  idealDistance: number
): void {
  const dx = node2.x - node1.x;
  const dy = node2.y - node1.y;
  const dist = Math.sqrt(dx * dx + dy * dy) || 1;

  // Hooke's law: F = k * (d - ideal)
  const displacement = dist - idealDistance;
  const force = strength * displacement;
  const fx = (dx / dist) * force;
  const fy = (dy / dist) * force;

  node1.vx += fx;
  node1.vy += fy;
  node2.vx -= fx;
  node2.vy -= fy;
}

function centerLayout(nodes: ForceNode[]): void {
  if (nodes.length === 0) return;

  let sumX = 0, sumY = 0;
  for (const node of nodes) {
    sumX += node.x;
    sumY += node.y;
  }

  const centerX = sumX / nodes.length;
  const centerY = sumY / nodes.length;

  for (const node of nodes) {
    node.x -= centerX;
    node.y -= centerY;
  }
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
      algorithm: 'force_directed',
      direction: options.direction,
      nodeCount: 0,
      edgeCount: 0,
      executionTimeMs: Date.now() - startTime,
    },
  };
}
