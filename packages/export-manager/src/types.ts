import { Schema } from '@pg-studio/shared';
import { LayoutResult, BoundingBox } from '@pg-studio/layout-engine';

export interface ExportManager {
  exportAsPng(canvas: HTMLCanvasElement, options: ImageExportOptions): Promise<Blob>;
  exportAsSvg(schema: Schema, layout: LayoutResult, options: SvgExportOptions): Promise<string>;
  exportAsJson(schema: Schema, layout: LayoutResult): Promise<string>;
  exportAsSql(schema: Schema, options: SqlExportOptions): Promise<string>;
  saveLayout(projectPath: string, layout: LayoutResult): Promise<void>;
  loadLayout(projectPath: string): Promise<LayoutResult | null>;
  autoSaveLayout(projectPath: string, layout: LayoutResult): Promise<void>;
  setAutoSave(enabled: boolean, delayMs?: number): void;
  getProjectState(): ProjectState;
  getRecentProjects(): RecentProject[];
  getBookmarks(): ProjectBookmark[];
  setCurrentProject(path: string): void;
  getCurrentProject(): string | null;
  addBookmark(path: string, name: string, description?: string): void;
  removeBookmark(path: string): void;
  clearRecentProjects(): void;
  removeFromRecent(path: string): void;
}

export interface ImageExportOptions {
  width: number;
  height: number;
  scale: number;
  backgroundColor: string;
  includeBackground: boolean;
}

export interface SvgExportOptions {
  includeStyles: boolean;
  embedFonts: boolean;
  viewBox: BoundingBox;
}

export interface SqlExportOptions {
  includeConstraints: boolean;
  includeIndexes: boolean;
  includeComments: boolean;
  dialectTarget: 'postgresql' | 'mysql' | 'sqlite';
}

export interface ProjectState {
  currentPath: string | null;
  recentProjects: RecentProject[];
  bookmarks: ProjectBookmark[];
}

export interface RecentProject {
  path: string;
  name: string;
  lastOpened: Date;
  tableCount: number;
}

export interface ProjectBookmark {
  path: string;
  name: string;
  description?: string;
  createdAt: Date;
}

export interface ExportProgress {
  stage: 'preparing' | 'processing' | 'finalizing' | 'complete' | 'error';
  progress: number; // 0-100
  message: string;
  error?: string;
}

export type ExportFormat = 'png' | 'svg' | 'json' | 'sql';

export interface ExportResult {
  success: boolean;
  data?: Blob | string;
  filename: string;
  error?: string;
}