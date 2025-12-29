import { ErrorCodeDefinition } from './error-codes';

/**
 * SQL parsing error codes
 */
export const SQL_PARSING_ERRORS: Record<string, ErrorCodeDefinition> = {
  SYNTAX_ERROR: {
    code: 'SQL_001',
    category: 'sql_parsing',
    severity: 'warning',
    defaultMessage: 'SQL syntax error',
    userMessage: 'The SQL file contains syntax errors.',
    suggestedActions: [
      'Check the SQL syntax in the file',
      'Verify the SQL is valid PostgreSQL syntax',
      'Look for missing semicolons or brackets'
    ],
    recoverable: true
  },
  UNSUPPORTED_FEATURE: {
    code: 'SQL_002',
    category: 'sql_parsing',
    severity: 'warning',
    defaultMessage: 'Unsupported SQL feature',
    userMessage: 'The SQL file contains features that are not supported.',
    suggestedActions: [
      'The parser will skip unsupported statements',
      'Check if the SQL uses PostgreSQL-specific features',
      'Consider simplifying complex statements'
    ],
    recoverable: true
  },
  ENCODING_ERROR: {
    code: 'SQL_003',
    category: 'sql_parsing',
    severity: 'warning',
    defaultMessage: 'File encoding error',
    userMessage: 'Unable to read the SQL file due to encoding issues.',
    suggestedActions: [
      'Save the file with UTF-8 encoding',
      'Remove special characters from the file',
      'Check for binary content in the file'
    ],
    recoverable: true
  },
  EMPTY_FILE: {
    code: 'SQL_004',
    category: 'sql_parsing',
    severity: 'info',
    defaultMessage: 'Empty SQL file',
    userMessage: 'The SQL file is empty or contains no valid statements.',
    suggestedActions: [
      'Check if the file contains SQL statements',
      'Verify the file path is correct'
    ],
    recoverable: true
  },
  PARTIAL_PARSE: {
    code: 'SQL_005',
    category: 'sql_parsing',
    severity: 'warning',
    defaultMessage: 'Partial SQL parsing',
    userMessage: 'Some SQL statements could not be parsed.',
    suggestedActions: [
      'Review the parsing warnings for details',
      'Valid statements have been processed',
      'Check problematic statements manually'
    ],
    recoverable: true
  }
};

/**
 * File system error codes
 */
export const FILE_SYSTEM_ERRORS: Record<string, ErrorCodeDefinition> = {
  PERMISSION_DENIED: {
    code: 'FS_001',
    category: 'file_system',
    severity: 'error',
    defaultMessage: 'File system permission denied',
    userMessage: 'Unable to access the file or folder due to permission restrictions.',
    suggestedActions: [
      'Check file/folder permissions',
      'Run the application with appropriate permissions',
      'Select a different folder'
    ],
    recoverable: false
  },
  FILE_NOT_FOUND: {
    code: 'FS_002',
    category: 'file_system',
    severity: 'error',
    defaultMessage: 'File not found',
    userMessage: 'The specified file could not be found.',
    suggestedActions: [
      'Verify the file path is correct',
      'Check if the file has been moved or deleted',
      'Select the file again'
    ],
    recoverable: false
  },
  DIRECTORY_NOT_FOUND: {
    code: 'FS_003',
    category: 'file_system',
    severity: 'error',
    defaultMessage: 'Directory not found',
    userMessage: 'The specified folder could not be found.',
    suggestedActions: [
      'Verify the folder path is correct',
      'Check if the folder has been moved or deleted',
      'Select a different folder'
    ],
    recoverable: false
  },
  DISK_FULL: {
    code: 'FS_004',
    category: 'file_system',
    severity: 'error',
    defaultMessage: 'Disk space full',
    userMessage: 'Unable to save data due to insufficient disk space.',
    suggestedActions: [
      'Free up disk space',
      'Save to a different location',
      'Delete unnecessary files'
    ],
    recoverable: false
  },
  PATH_TOO_LONG: {
    code: 'FS_005',
    category: 'file_system',
    severity: 'warning',
    defaultMessage: 'Path too long',
    userMessage: 'The file path is too long for the operating system.',
    suggestedActions: [
      'Move files to a shorter path',
      'Rename folders to shorter names',
      'Use a different location'
    ],
    recoverable: false
  }
};
