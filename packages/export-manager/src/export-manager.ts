import { Schema, Table, Column, Relation } from '@pg-studio/shared';
import { LayoutResult, PositionedNode, PositionedEdge } from '@pg-studio/layout-engine';
import {
  ExportManager,
  ImageExportOptions,
  SvgExportOptions,
  SqlExportOptions,
  ProjectState,
  RecentProject,
  ProjectBookmark,
  ExportResult,
  ExportFormat
} from './types';

export class DefaultExportManager implements ExportManager {
  private projectState: ProjectState = {
    currentPath: null,
    recentProjects: [],
    bookmarks: []
  };
  private autoSaveEnabled: boolean = true;
  private autoSaveDelay: number = 2000; // 2 seconds
  private autoSaveTimeout: NodeJS.Timeout | null = null;

  constructor() {
    this.loadProjectState();
  }

  /**
   * Export canvas as PNG image
   */
  async exportAsPng(canvas: HTMLCanvasElement, options: ImageExportOptions): Promise<Blob> {
    return new Promise((resolve, reject) => {
      try {
        // Create a temporary canvas with the desired dimensions
        const exportCanvas = document.createElement('canvas');
        exportCanvas.width = options.width * options.scale;
        exportCanvas.height = options.height * options.scale;
        
        const ctx = exportCanvas.getContext('2d');
        if (!ctx) {
          throw new Error('Failed to get canvas context');
        }

        // Set background if requested
        if (options.includeBackground) {
          ctx.fillStyle = options.backgroundColor;
          ctx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);
        }

        // Scale the context for high DPI
        ctx.scale(options.scale, options.scale);

        // Draw the original canvas content
        ctx.drawImage(canvas, 0, 0, options.width, options.height);

        // Convert to blob
        exportCanvas.toBlob((blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to create PNG blob'));
          }
        }, 'image/png');
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Export schema as SVG
   */
  async exportAsSvg(schema: Schema, layout: LayoutResult, options: SvgExportOptions): Promise<string> {
    const { viewBox } = options;
    
    let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}">`;
    
    if (options.includeStyles) {
      svg += this.generateSvgStyles();
    }

    // Add table nodes
    for (const node of layout.nodes) {
      const table = schema.tables.find(t => t.id === node.id);
      if (table) {
        svg += this.generateTableSvg(table, node);
      }
    }

    // Add relationship edges
    for (const edge of layout.edges) {
      const relation = schema.relations.find(r => r.id === edge.id);
      if (relation) {
        svg += this.generateRelationSvg(relation, edge, layout.nodes);
      }
    }

    svg += '</svg>';
    return svg;
  }

  /**
   * Export schema and layout as JSON
   */
  async exportAsJson(schema: Schema, layout: LayoutResult): Promise<string> {
    const exportData = {
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      schema,
      layout,
      metadata: {
        tableCount: schema.tables.length,
        relationCount: schema.relations.length,
        nodeCount: layout.nodes.length,
        edgeCount: layout.edges.length
      }
    };

    return JSON.stringify(exportData, null, 2);
  }

  /**
   * Export schema as SQL DDL
   */
  async exportAsSql(schema: Schema, options: SqlExportOptions): Promise<string> {
    let sql = '';
    
    // Add header comment
    sql += `-- PostgreSQL Schema Export\n`;
    sql += `-- Generated on ${new Date().toISOString()}\n`;
    sql += `-- Tables: ${schema.tables.length}, Relations: ${schema.relations.length}\n\n`;

    // Create tables
    for (const table of schema.tables) {
      sql += this.generateCreateTableSql(table, schema.relations, options);
      sql += '\n\n';
    }

    // Add foreign key constraints if not included inline
    if (options.includeConstraints) {
      const alterStatements = this.generateAlterTableConstraints(schema.relations, options);
      if (alterStatements.length > 0) {
        sql += '-- Foreign Key Constraints\n';
        sql += alterStatements.join('\n');
        sql += '\n\n';
      }
    }

    return sql;
  }

  /**
   * Save layout to local storage or file system
   */
  async saveLayout(projectPath: string, layout: LayoutResult): Promise<void> {
    try {
      const layoutData = {
        projectPath,
        layout,
        savedAt: new Date().toISOString()
      };

      // In a browser environment, use localStorage
      if (typeof localStorage !== 'undefined') {
        const key = `pg-studio-layout-${this.sanitizePathForKey(projectPath)}`;
        localStorage.setItem(key, JSON.stringify(layoutData));
      }

      // Update project state
      this.updateRecentProjects(projectPath, layout.nodes.length);
      this.projectState.currentPath = projectPath;
      this.saveProjectState();
    } catch (error) {
      throw new Error(`Failed to save layout: ${error}`);
    }
  }

  /**
   * Auto-save layout with debouncing
   */
  async autoSaveLayout(projectPath: string, layout: LayoutResult): Promise<void> {
    if (!this.autoSaveEnabled) {
      return;
    }

    // Debounce auto-save to avoid excessive saves during interactions
    if (this.autoSaveTimeout) {
      clearTimeout(this.autoSaveTimeout);
    }

    this.autoSaveTimeout = setTimeout(async () => {
      try {
        await this.saveLayout(projectPath, layout);
      } catch (error) {
        console.warn('Auto-save failed:', error);
      }
    }, this.autoSaveDelay);
  }

  /**
   * Enable or disable auto-save
   */
  setAutoSave(enabled: boolean, delayMs?: number): void {
    this.autoSaveEnabled = enabled;
    if (delayMs !== undefined) {
      this.autoSaveDelay = delayMs;
    }
  }

  /**
   * Load layout from local storage or file system
   */
  async loadLayout(projectPath: string): Promise<LayoutResult | null> {
    try {
      // In a browser environment, use localStorage
      if (typeof localStorage !== 'undefined') {
        const key = `pg-studio-layout-${this.sanitizePathForKey(projectPath)}`;
        const stored = localStorage.getItem(key);
        
        if (stored) {
          const layoutData = JSON.parse(stored);
          return layoutData.layout;
        }
      }

      return null;
    } catch (error) {
      console.warn(`Failed to load layout: ${error}`);
      return null;
    }
  }

  /**
   * Get project state (recent projects, bookmarks)
   */
  getProjectState(): ProjectState {
    return { ...this.projectState };
  }

  /**
   * Add project bookmark
   */
  addBookmark(path: string, name: string, description?: string): void {
    const bookmark: ProjectBookmark = {
      path,
      name,
      description,
      createdAt: new Date()
    };

    this.projectState.bookmarks = this.projectState.bookmarks.filter(b => b.path !== path);
    this.projectState.bookmarks.unshift(bookmark);
    this.saveProjectState();
  }

  /**
   * Get recent projects
   */
  getRecentProjects(): RecentProject[] {
    return [...this.projectState.recentProjects];
  }

  /**
   * Get project bookmarks
   */
  getBookmarks(): ProjectBookmark[] {
    return [...this.projectState.bookmarks];
  }

  /**
   * Set current project path
   */
  setCurrentProject(path: string): void {
    this.projectState.currentPath = path;
    this.saveProjectState();
  }

  /**
   * Get current project path
   */
  getCurrentProject(): string | null {
    return this.projectState.currentPath;
  }

  /**
   * Clear recent projects
   */
  clearRecentProjects(): void {
    this.projectState.recentProjects = [];
    this.saveProjectState();
  }

  /**
   * Remove project from recent list
   */
  removeFromRecent(path: string): void {
    this.projectState.recentProjects = this.projectState.recentProjects.filter(p => p.path !== path);
    this.saveProjectState();
  }

  /**
   * Remove project bookmark
   */
  removeBookmark(path: string): void {
    this.projectState.bookmarks = this.projectState.bookmarks.filter(b => b.path !== path);
    this.saveProjectState();
  }

  // Private helper methods

  private generateSvgStyles(): string {
    return `
      <defs>
        <style>
          .table-node { fill: #ffffff; stroke: #e2e8f0; stroke-width: 1; }
          .table-header { fill: #f8fafc; stroke: #e2e8f0; stroke-width: 1; }
          .table-title { font-family: Arial, sans-serif; font-size: 14px; font-weight: bold; fill: #1a202c; }
          .column-text { font-family: Arial, sans-serif; font-size: 12px; fill: #4a5568; }
          .primary-key { fill: #fbbf24; }
          .foreign-key { fill: #60a5fa; }
          .relation-line { stroke: #6b7280; stroke-width: 2; fill: none; }
          .relation-arrow { fill: #6b7280; }
        </style>
      </defs>
    `;
  }

  private generateTableSvg(table: Table, node: PositionedNode): string {
    const { x, y } = node.position;
    const { width, height } = node.size;
    const headerHeight = 30;
    const rowHeight = 20;

    let svg = `<g class="table" transform="translate(${x}, ${y})">`;
    
    // Table background
    svg += `<rect class="table-node" width="${width}" height="${height}" rx="4"/>`;
    
    // Table header
    svg += `<rect class="table-header" width="${width}" height="${headerHeight}" rx="4"/>`;
    svg += `<text class="table-title" x="${width/2}" y="${headerHeight/2 + 5}" text-anchor="middle">${table.name}</text>`;
    
    // Columns
    let yOffset = headerHeight + 15;
    for (const column of table.columns) {
      const iconX = 10;
      const textX = 30;
      
      // Column icon
      if (column.isPrimaryKey) {
        svg += `<circle class="primary-key" cx="${iconX}" cy="${yOffset}" r="4"/>`;
      } else if (column.isForeignKey) {
        svg += `<circle class="foreign-key" cx="${iconX}" cy="${yOffset}" r="4"/>`;
      }
      
      // Column text
      svg += `<text class="column-text" x="${textX}" y="${yOffset + 4}">${column.name}: ${column.type}</text>`;
      
      yOffset += rowHeight;
    }
    
    svg += '</g>';
    return svg;
  }

  private generateRelationSvg(relation: Relation, edge: PositionedEdge, nodes: PositionedNode[]): string {
    const sourceNode = nodes.find(n => n.id === edge.source);
    const targetNode = nodes.find(n => n.id === edge.target);
    
    if (!sourceNode || !targetNode) {
      return '';
    }

    const sourceX = sourceNode.position.x + sourceNode.size.width / 2;
    const sourceY = sourceNode.position.y + sourceNode.size.height;
    const targetX = targetNode.position.x + targetNode.size.width / 2;
    const targetY = targetNode.position.y;

    let svg = `<g class="relation">`;
    svg += `<line class="relation-line" x1="${sourceX}" y1="${sourceY}" x2="${targetX}" y2="${targetY}"/>`;
    
    // Arrow head
    const angle = Math.atan2(targetY - sourceY, targetX - sourceX);
    const arrowLength = 10;
    const arrowAngle = Math.PI / 6;
    
    const arrowX1 = targetX - arrowLength * Math.cos(angle - arrowAngle);
    const arrowY1 = targetY - arrowLength * Math.sin(angle - arrowAngle);
    const arrowX2 = targetX - arrowLength * Math.cos(angle + arrowAngle);
    const arrowY2 = targetY - arrowLength * Math.sin(angle + arrowAngle);
    
    svg += `<polygon class="relation-arrow" points="${targetX},${targetY} ${arrowX1},${arrowY1} ${arrowX2},${arrowY2}"/>`;
    svg += '</g>';
    
    return svg;
  }

  private generateCreateTableSql(table: Table, relations: Relation[], options: SqlExportOptions): string {
    let sql = `CREATE TABLE ${this.quoteIdentifier(table.name)} (\n`;
    
    // Columns
    const columnSql = table.columns.map(column => {
      let colSql = `  ${this.quoteIdentifier(column.name)} ${column.type}`;
      if (!column.isNullable) {
        colSql += ' NOT NULL';
      }
      return colSql;
    });

    // Primary key constraint
    const primaryKeys = table.columns.filter(c => c.isPrimaryKey);
    if (primaryKeys.length > 0) {
      const pkColumns = primaryKeys.map(c => this.quoteIdentifier(c.name)).join(', ');
      columnSql.push(`  PRIMARY KEY (${pkColumns})`);
    }

    // Foreign key constraints (if including inline)
    if (options.includeConstraints) {
      const tableForeignKeys = relations.filter(r => r.sourceTable === table.name);
      for (const fk of tableForeignKeys) {
        let fkSql = `  FOREIGN KEY (${this.quoteIdentifier(fk.sourceColumn)}) REFERENCES ${this.quoteIdentifier(fk.targetTable)}(${this.quoteIdentifier(fk.targetColumn)})`;
        
        if (fk.onDelete) {
          fkSql += ` ON DELETE ${fk.onDelete}`;
        }
        if (fk.onUpdate) {
          fkSql += ` ON UPDATE ${fk.onUpdate}`;
        }
        
        columnSql.push(fkSql);
      }
    }

    sql += columnSql.join(',\n');
    sql += '\n);';

    if (options.includeComments) {
      sql += `\n\n-- Table: ${table.name} (${table.columns.length} columns)`;
    }

    return sql;
  }

  private generateAlterTableConstraints(relations: Relation[], options: SqlExportOptions): string[] {
    const statements: string[] = [];
    
    for (const relation of relations) {
      if (relation.constraintName) {
        let sql = `ALTER TABLE ${this.quoteIdentifier(relation.sourceTable)} ADD CONSTRAINT ${this.quoteIdentifier(relation.constraintName)}`;
        sql += ` FOREIGN KEY (${this.quoteIdentifier(relation.sourceColumn)})`;
        sql += ` REFERENCES ${this.quoteIdentifier(relation.targetTable)}(${this.quoteIdentifier(relation.targetColumn)})`;
        
        if (relation.onDelete) {
          sql += ` ON DELETE ${relation.onDelete}`;
        }
        if (relation.onUpdate) {
          sql += ` ON UPDATE ${relation.onUpdate}`;
        }
        
        sql += ';';
        statements.push(sql);
      }
    }
    
    return statements;
  }

  private quoteIdentifier(identifier: string): string {
    // Simple identifier quoting for PostgreSQL
    if (/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(identifier)) {
      return identifier;
    }
    return `"${identifier.replace(/"/g, '""')}"`;
  }

  private sanitizePathForKey(path: string): string {
    return path.replace(/[^a-zA-Z0-9]/g, '_');
  }

  private updateRecentProjects(projectPath: string, tableCount: number = 0): void {
    const existing = this.projectState.recentProjects.findIndex(p => p.path === projectPath);
    
    const recentProject: RecentProject = {
      path: projectPath,
      name: projectPath.split('/').pop() || projectPath,
      lastOpened: new Date(),
      tableCount
    };

    if (existing >= 0) {
      this.projectState.recentProjects[existing] = recentProject;
    } else {
      this.projectState.recentProjects.unshift(recentProject);
    }

    // Keep only last 10 recent projects
    this.projectState.recentProjects = this.projectState.recentProjects.slice(0, 10);
    this.saveProjectState();
  }

  private saveProjectState(): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('pg-studio-project-state', JSON.stringify(this.projectState));
    }
  }

  private loadProjectState(): void {
    if (typeof localStorage !== 'undefined') {
      const stored = localStorage.getItem('pg-studio-project-state');
      if (stored) {
        try {
          this.projectState = JSON.parse(stored);
        } catch (error) {
          console.warn('Failed to load project state:', error);
        }
      }
    }
  }
}