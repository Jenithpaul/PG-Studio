export * from './types';
export * from './file-scanner';

import { FileScannerImpl } from './file-scanner';

export const createFileScanner = () => new FileScannerImpl();