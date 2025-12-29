import { Schema } from '@pg-studio/shared';
import { LayoutOptions, LayoutResult, DEFAULT_LAYOUT_OPTIONS, PositionedNode } from './types';
import { applyHierarchicalLayout } from './hierarchical-layout';
import { applyForceDirectedLayout } from './force-directed-layout';
import { applyGridLayout } from './grid-layout';

/**
 * Main layout engine that provides access to all layout algorithms.
 */
export class LayoutEngine {
  private defaultOptions: LayoutOptions;

  constructor(options?: Partial<LayoutOptions>) {
    this.defaultOptions = {
      ...DEFAULT_LAYOUT_OPTIONS,
      ...options,
    };
  }

  /**
   * Apply hierarchical layout based on foreign key relationships.
   * Root tables (referenced but not referencing) are placed at the top.
   */
  applyHierarchicalLayout(
    schema: Schema,
    options?: Partial<LayoutOptions>
  ): LayoutResult {
    const mergedOptions = this.mergeOptions(options);
    return applyHierarchicalLayout(schema, mergedOptions);
  }

  /**
   * Apply force-directed layout using physics simulation.
   * Creates organic arrangements where connected tables cluster together.
   */
  applyForceDirectedLayout(
    schema: Schema,
    options?: Partial<LayoutOptions>
  ): LayoutResult {
    const mergedOptions = this.mergeOptions(options);
    return applyForceDirectedLayout(schema, mergedOptions);
  }

  /**
   * Apply grid layout for structured arrangement.
   * Tables are arranged in a grid, sorted by relationship count.
   */
  applyGridLayout(
    schema: Schema,
    options?: Partial<LayoutOptions>
  ): LayoutResult {
    const mergedOptions = this.mergeOptions(options);
    return applyGridLayout(schema, mergedOptions);
  }

  /**
   * Apply layout based on the algorithm specified in options.
   */
  applyLayout(
    schema: Schema,
    options?: Partial<LayoutOptions>
  ): LayoutResult {
    const mergedOptions = this.mergeOptions(options);
    
    switch (mergedOptions.algorithm) {
      case 'hierarchical':
        return applyHierarchicalLayout(schema, mergedOptions);
      case 'force_directed':
        return applyForceDirectedLayout(schema, mergedOptions);
      case 'grid':
        return applyGridLayout(schema, mergedOptions);
      case 'circular':
        // Circular layout can be implemented as a special case of force-directed
        // with nodes constrained to a circle
        return this.applyCircularLayout(schema, mergedOptions);
      default:
        return applyHierarchicalLayout(schema, mergedOptions);
    }
  }

  /**
   * Apply circular layout - tables arranged in a circle.
   */
  private applyCircularLayout(
    schema: Schema,
    options: LayoutOptions
  ): LayoutResult {
    const startTime = Date.now();
    const { tables, relations } = schema;
    const { nodeSize, spacing } = options;

    if (tables.length === 0) {
      return {
        nodes: [],
        edges: [],
        bounds: { x: 0, y: 0, width: 0, height: 0 },
        metadata: {
          algorithm: 'circular',
          direction: options.direction,
          nodeCount: 0,
          edgeCount: 0,
          executionTimeMs: Date.now() - startTime,
        },
      };
    }

    // Calculate radius based on number of tables
    const circumference = tables.length * (nodeSize.width + spacing.nodeSpacing);
    const radius = Math.max(200, circumference / (2 * Math.PI));

    const nodes: PositionedNode[] = tables.map((table, i) => {
      const angle = (2 * Math.PI * i) / tables.length - Math.PI / 2; // Start from top
      return {
        id: table.id,
        position: {
          x: radius * Math.cos(angle),
          y: radius * Math.sin(angle),
        },
        size: { ...nodeSize },
        rank: i,
      };
    });

    const edges = relations.map(relation => ({
      id: relation.id,
      source: relation.sourceTable,
      target: relation.targetTable,
      sourceHandle: `${relation.sourceColumn}-source`,
      targetHandle: `${relation.targetColumn}-target`,
    }));

    // Calculate bounds
    let minX = Infinity, minY = Infinity;
    let maxX = -Infinity, maxY = -Infinity;
    for (const node of nodes) {
      minX = Math.min(minX, node.position.x);
      minY = Math.min(minY, node.position.y);
      maxX = Math.max(maxX, node.position.x + node.size.width);
      maxY = Math.max(maxY, node.position.y + node.size.height);
    }

    return {
      nodes,
      edges,
      bounds: {
        x: minX,
        y: minY,
        width: maxX - minX,
        height: maxY - minY,
      },
      metadata: {
        algorithm: 'circular',
        direction: options.direction,
        nodeCount: nodes.length,
        edgeCount: edges.length,
        executionTimeMs: Date.now() - startTime,
      },
    };
  }

  /**
   * Optimize an existing layout by reducing edge crossings.
   * This is a simple optimization that swaps nodes within layers.
   */
  optimizeLayout(currentLayout: LayoutResult): LayoutResult {
    // For now, return the layout as-is
    // A full implementation would use techniques like:
    // - Barycenter method for reducing edge crossings
    // - Median method for node ordering
    // - Iterative improvement
    return currentLayout;
  }

  private mergeOptions(options?: Partial<LayoutOptions>): LayoutOptions {
    if (!options) {
      return this.defaultOptions;
    }

    return {
      algorithm: options.algorithm ?? this.defaultOptions.algorithm,
      direction: options.direction ?? this.defaultOptions.direction,
      spacing: {
        ...this.defaultOptions.spacing,
        ...options.spacing,
      },
      nodeSize: {
        ...this.defaultOptions.nodeSize,
        ...options.nodeSize,
      },
    };
  }
}

/**
 * Create a new layout engine instance with optional default options.
 */
export function createLayoutEngine(options?: Partial<LayoutOptions>): LayoutEngine {
  return new LayoutEngine(options);
}
