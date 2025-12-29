export * from './types';
export { DefaultExportManager } from './export-manager';
import { DefaultExportManager } from './export-manager';

// Factory function for easier usage
export function createExportManager() {
  return new DefaultExportManager();
}