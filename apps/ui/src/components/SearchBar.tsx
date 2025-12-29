import React, { useState, useCallback } from 'react';
import './SearchBar.css';

export interface FilterOptions {
  showTables: boolean;
  showViews: boolean;
  showRelations: boolean;
}

interface SearchBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  filterOptions: FilterOptions;
  onFilterChange: (options: FilterOptions) => void;
  disabled?: boolean;
  tableCount?: number;
  matchCount?: number;
}

const SearchBar: React.FC<SearchBarProps> = ({
  searchQuery,
  onSearchChange,
  filterOptions,
  onFilterChange,
  disabled = false,
  tableCount = 0,
  matchCount = 0,
}) => {
  const [showFilters, setShowFilters] = useState(false);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onSearchChange(e.target.value);
  }, [onSearchChange]);

  const handleClearSearch = useCallback(() => {
    onSearchChange('');
  }, [onSearchChange]);

  const handleFilterToggle = useCallback((key: keyof FilterOptions) => {
    onFilterChange({
      ...filterOptions,
      [key]: !filterOptions[key],
    });
  }, [filterOptions, onFilterChange]);

  // Don't render if disabled (no schema loaded)
  if (disabled) return null;

  return (
    <div className="search-bar">
      <div className="search-input-container">
        <span className="search-input-icon">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
        </span>
        <input
          type="text"
          className="search-input"
          placeholder="Search tables..."
          value={searchQuery}
          onChange={handleSearchChange}
        />
        {searchQuery && (
          <button 
            className="search-clear-btn"
            onClick={handleClearSearch}
            title="Clear search"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}
      </div>
      
      {searchQuery && tableCount > 0 && (
        <span className="search-results-count">
          <strong>{matchCount}</strong> / {tableCount}
        </span>
      )}

      <button
        className={`filter-toggle ${showFilters ? 'active' : ''}`}
        onClick={() => setShowFilters(!showFilters)}
        title="Toggle filters"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
        </svg>
        Filters
      </button>

      {showFilters && (
        <div className="search-filters">
          <label className="filter-toggle active">
            <input
              type="checkbox"
              checked={filterOptions.showTables}
              onChange={() => handleFilterToggle('showTables')}
            />
            Tables
          </label>
          <label className="filter-toggle">
            <input
              type="checkbox"
              checked={filterOptions.showViews}
              onChange={() => handleFilterToggle('showViews')}
            />
            Views
          </label>
          <label className={`filter-toggle ${filterOptions.showRelations ? 'active' : ''}`}>
            <input
              type="checkbox"
              checked={filterOptions.showRelations}
              onChange={() => handleFilterToggle('showRelations')}
            />
            Relations
          </label>
        </div>
      )}
    </div>
  );
};

export default SearchBar;
