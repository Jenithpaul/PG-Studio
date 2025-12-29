import { Schema } from '@pg-studio/shared';

export type LayoutAlgorithm = 'hierarchical' | 'force_directed' | 'grid' | 'circular';
export type LayoutDirection = 'top_down' | 'left_right' | 'bottom_up' | 'right_left';

export interface LayoutOptions {
  algorithm: LayoutAlgorithm;
  direction: LayoutDirection;
  spacing: {
    nodeSpacing: number;
    layerSpacing: number;
    edgeSpacing: number;
  };
  nodeSize: {
    width: number;
    height: number;
  };
}

export interface PositionedNode {
  id: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  layer?: number;
  rank?: number;
}

export interface PositionedEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
}

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface LayoutMetadata {
  algorithm: LayoutAlgorithm;
  direction: LayoutDirection;
  nodeCount: number;
  edgeCount: number;
  layerCount?: number;
  executionTimeMs: number;
}

export interface LayoutResult {
  nodes: PositionedNode[];
  edges: PositionedEdge[];
  bounds: BoundingBox;
  metadata: LayoutMetadata;
}

export const DEFAULT_LAYOUT_OPTIONS: LayoutOptions = {
  algorithm: 'hierarchical',
  direction: 'top_down',
  spacing: {
    nodeSpacing: 100,
    layerSpacing: 150,
    edgeSpacing: 20,
  },
  nodeSize: {
    width: 250,
    height: 150,
  },
};
