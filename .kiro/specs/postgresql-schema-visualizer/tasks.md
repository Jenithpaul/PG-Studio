# Implementation Plan: PostgreSQL Schema Visualizer

## Overview

This implementation plan converts the design into discrete coding tasks that build upon the existing solid foundation. The tasks focus on completing the missing 35% of functionality to achieve a professional PostgreSQL schema visualization desktop application. Each task builds incrementally, with testing integrated throughout to ensure correctness.

## Tasks

- [x] 1. Enhanced SQL Parser - Foreign Key Support
- [x] 1.1 Extend schema-parser to handle FOREIGN KEY constraints in CREATE TABLE statements
  - Add foreign key parsing logic to existing parser
  - Extract REFERENCES clauses and constraint names
  - Create bidirectional relationship objects
  - _Requirements: 2.1, 2.3_

- [ ]* 1.2 Write property test for foreign key parsing
  - **Property 4: Foreign Key Relationship Extraction**
  - **Validates: Requirements 2.1, 2.2, 2.3**

- [x] 1.3 Add ALTER TABLE statement parsing support
  - Parse ADD CONSTRAINT FOREIGN KEY statements
  - Handle named and unnamed constraints
  - Extract referential actions (CASCADE, SET NULL, etc.)
  - _Requirements: 2.2_

- [ ]* 1.4 Write property test for SQL parsing round-trip consistency
  - **Property 3: SQL Parsing Round-Trip Consistency**
  - **Validates: Requirements 2.6**

- [x] 1.5 Implement pretty printer for schema-to-SQL conversion
  - Generate CREATE TABLE statements from schema objects
  - Include all constraints and relationships
  - Format with proper SQL syntax
  - _Requirements: 2.5, 2.6_

- [ ]* 1.6 Write unit tests for error handling in SQL parsing
  - Test invalid SQL graceful handling
  - Test partial parsing with mixed valid/invalid files
  - _Requirements: 2.4_

- [x] 2. File System Integration
- [x] 2.1 Create file-scanner package with project detection
  - Implement recursive directory scanning
  - Add pattern matching for backend folders (/backend, /server, /api, /db, /database, /migrations)
  - Create interfaces for ProjectScanResult and DetectedFolder
  - _Requirements: 1.2, 3.1_

- [ ]* 2.2 Write property test for file discovery completeness
  - **Property 1: File Discovery Completeness**
  - **Validates: Requirements 1.2, 1.3, 3.1, 3.4**

- [x] 2.3 Implement SQL file discovery and classification
  - Identify all .sql files in detected directories
  - Classify files by type (table, migration, view, function)
  - Handle migration file ordering by timestamp/sequence
  - _Requirements: 1.3, 3.3_

- [ ]* 2.4 Write property test for migration file chronological processing
  - **Property 5: Migration File Chronological Processing**
  - **Validates: Requirements 3.3**

- [x] 2.5 Complete Electron IPC folder dialog implementation
  - Extend existing preload script with proper folder selection
  - Add native OS dialog integration
  - Handle cross-platform dialog differences
  - _Requirements: 1.1, 7.2_

- [ ]* 2.6 Write unit tests for folder dialog integration
  - Test dialog opening and folder selection
  - Test cross-platform compatibility
  - _Requirements: 1.1, 7.2_

- [-] 3. Schema Builder Package
- [x] 3.1 Create schema-builder package for multi-source merging
  - Implement SchemaBuilder interface with source prioritization
  - Add conflict detection and resolution logic
  - Create metadata tracking for source attribution
  - _Requirements: 1.4, 1.5_

- [ ]* 3.2 Write property test for schema source prioritization
  - **Property 2: Schema Source Prioritization**
  - **Validates: Requirements 1.4, 1.5**

- [ ] 3.3 Integrate schema-builder with agent endpoints
  - Extend existing agent endpoints to use schema builder
  - Add new endpoint for folder-based schema building
  - Handle multiple data source combinations
  - _Requirements: 1.4, 1.5_

- [ ]* 3.4 Write unit tests for conflict resolution
  - Test database vs SQL file priority
  - Test metadata preservation
  - _Requirements: 1.4, 1.5_

- [x] 4. Checkpoint - Core Parsing and File Integration Complete
- Ensure all tests pass, ask the user if questions arise.

- [x] 5. Layout Engine Package
- [x] 5.1 Create layout-engine package with hierarchical algorithm
  - Implement hierarchical layout based on foreign key relationships
  - Add force-directed layout using physics simulation
  - Create grid layout for structured arrangement
  - _Requirements: 4.3_

- [ ]* 5.2 Write property test for layout algorithm non-overlap
  - **Property 7: Layout Algorithm Non-Overlap**
  - **Validates: Requirements 4.3**

- [x] 5.3 Integrate layout engine with React UI
  - Add auto-layout button to TopBar component
  - Connect layout algorithms to ReactFlow positioning
  - Implement zoom-to-fit functionality
  - _Requirements: 4.3, 4.6_

- [ ]* 5.4 Write unit tests for layout integration
  - Test layout button functionality
  - Test zoom-to-fit behavior
  - _Requirements: 4.3, 4.6_

- [x] 6. Advanced UI Features
- [x] 6.1 Implement search and filter functionality
  - Add search box to UI with table name filtering
  - Implement table highlighting and dimming
  - Add filter options for tables, views, relations
  - _Requirements: 4.1, 4.2_

- [ ]* 6.2 Write property test for search and filter consistency
  - **Property 6: Search and Filter Consistency**
  - **Validates: Requirements 4.1, 4.2**

- [x] 6.3 Add relationship hover tooltips and side panel
  - Implement constraint details on edge hover
  - Create side panel for detailed table information
  - Add table selection and detail display
  - _Requirements: 4.4, 4.5_

- [ ]* 6.4 Write unit tests for UI interactions
  - Test tooltip display and content
  - Test side panel functionality
  - _Requirements: 4.4, 4.5_

- [x] 6.5 Implement theme switching and responsive design
  - Add light/dark theme toggle
  - Ensure responsive layout at various window sizes
  - Implement professional styling and typography
  - _Requirements: 6.5, 6.6_

- [ ]* 6.6 Write unit tests for theme and responsive behavior
  - Test theme switching functionality
  - Test responsive layout behavior
  - _Requirements: 6.5, 6.6_

- [x] 7. Export Manager Package
- [x] 7.1 Create export-manager package with multiple format support
  - Implement PNG/SVG image export from canvas
  - Add JSON export with schema and layout data
  - Create SQL DDL export with complete CREATE TABLE statements
  - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [ ]* 7.2 Write property test for export format completeness
  - **Property 8: Export Format Completeness**
  - **Validates: Requirements 5.2, 5.3, 5.4**

- [x] 7.3 Implement layout persistence and project state management
  - Add automatic layout saving on changes
  - Implement project reopening with restored positions
  - Create project bookmarks and recent projects
  - _Requirements: 5.5, 5.6_

- [ ]* 7.4 Write property test for layout persistence round-trip
  - **Property 9: Layout Persistence Round-Trip**
  - **Validates: Requirements 5.5, 5.6**

- [x] 7.5 Integrate export functionality with UI
  - Add export button and format selection dialog
  - Implement progress feedback for large exports
  - Add export success/failure notifications
  - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [ ]* 7.6 Write unit tests for export UI integration
  - Test export dialog and format selection
  - Test progress feedback display
  - _Requirements: 5.1_

- [x] 8. Checkpoint - Advanced Features Complete
- Ensure all tests pass, ask the user if questions arise.

- [x] 9. Error Handling and Performance
- [x] 9.1 Implement comprehensive error handling
  - Add database connection error recovery with retry logic
  - Implement graceful SQL parsing error handling
  - Add file system permission error handling
  - _Requirements: 8.1, 8.2, 8.3_

- [ ]* 9.2 Write property test for error handling graceful degradation
  - **Property 10: Error Handling Graceful Degradation**
  - **Validates: Requirements 8.1, 8.2, 8.3**

- [x] 9.3 Implement performance optimizations
  - Add virtual scrolling for large schemas
  - Implement lazy loading and viewport culling
  - Add memory cleanup and optimization strategies
  - _Requirements: 8.4, 9.4, 9.5_

- [ ]* 9.4 Write property test for performance bounds compliance
  - **Property 11: Performance Bounds Compliance**
  - **Validates: Requirements 9.1, 9.3**

- [x] 9.5 Add loading indicators and progress feedback
  - Implement loading states for all async operations
  - Add progress bars for file scanning and parsing
  - Create user-friendly error messages with suggested actions
  - _Requirements: 6.2, 6.3_

- [ ]* 9.6 Write property test for UI responsiveness under load
  - **Property 12: UI Responsiveness Under Load**
  - **Validates: Requirements 9.2, 9.6**

- [x] 10. Desktop Integration and Polish
- [x] 10.1 Enhance Electron desktop integration
  - Implement drag-and-drop for SQL files
  - Add keyboard shortcuts following OS conventions
  - Improve window state management and native controls
  - _Requirements: 7.1, 7.3, 7.4, 7.5_

- [ ]* 10.2 Write unit tests for desktop integration
  - Test drag-and-drop functionality
  - Test keyboard shortcuts
  - Test window state management
  - _Requirements: 7.1, 7.3, 7.4, 7.5_

- [x] 10.3 Add application update handling and data preservation
  - Implement graceful update process
  - Ensure user data survives application updates
  - Add update notifications and changelog display
  - _Requirements: 7.6_

- [ ]* 10.4 Write unit tests for update handling
  - Test data preservation during updates
  - Test update notification display
  - _Requirements: 7.6_

- [x] 11. Final Integration and Testing
- [x] 11.1 Wire all components together in main application
  - Connect all new packages to existing agent endpoints
  - Ensure proper error propagation and handling
  - Verify all IPC communication works correctly
  - _Requirements: All_

- [ ]* 11.2 Write integration tests for complete workflows
  - Test end-to-end folder selection to visualization
  - Test database connection to export workflow
  - Test error scenarios and recovery
  - _Requirements: All_

- [ ] 11.3 Performance testing and optimization
  - Test with large schemas (100+ tables)
  - Verify performance requirements are met
  - Optimize any bottlenecks discovered
  - _Requirements: 9.1, 9.2, 9.3_

- [ ]* 11.4 Write performance benchmark tests
  - Test rendering performance with large schemas
  - Test search performance with many tables
  - Test memory usage patterns
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6_

- [x] 12. Final Checkpoint - Complete Application
- All components integrated, Supabase-style UI implemented, application ready for production use.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation and user feedback
- Property tests validate universal correctness properties using fast-check library
- Unit tests validate specific examples, edge cases, and integration points
- The implementation builds incrementally on the existing solid foundation
- All new packages follow the established monorepo structure and TypeScript patterns