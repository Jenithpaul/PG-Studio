import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useUser } from '../contexts/UserContext';
import { ConnectionModal } from './ConnectionModal';
import './Dashboard.css';

export interface Project {
  id: string;
  name: string;
  type: 'database' | 'folder' | 'demo';
  connectionString?: string;
  folderPath?: string;
  lastOpened: string;
  tableCount?: number;
}

interface DashboardProps {
  onOpenProject: (project: Project) => void;
  onCreateNew: (type: 'database' | 'folder' | 'demo') => void;
  onOpenSettings: () => void;
}

const RECENT_PROJECTS_KEY = 'pg-studio-recent-projects';

export const loadRecentProjects = (): Project[] => {
  try {
    const stored = localStorage.getItem(RECENT_PROJECTS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

export const saveRecentProject = (project: Project) => {
  try {
    const stored = localStorage.getItem(RECENT_PROJECTS_KEY);
    let projects: Project[] = stored ? JSON.parse(stored) : [];
    projects = projects.filter(p => p.id !== project.id);
    projects.unshift({ ...project, lastOpened: new Date().toISOString() });
    projects = projects.slice(0, 10);
    localStorage.setItem(RECENT_PROJECTS_KEY, JSON.stringify(projects));
  } catch (e) {
    console.error('Failed to save recent project:', e);
  }
};

const Dashboard: React.FC<DashboardProps> = ({ onOpenProject, onCreateNew, onOpenSettings }) => {
  const { theme, toggleTheme } = useTheme();
  const { user } = useUser();
  const [recentProjects, setRecentProjects] = useState<Project[]>([]);
  const [connectionModalOpen, setConnectionModalOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const refreshHistory = useCallback(() => {
    const projects = loadRecentProjects();
    setRecentProjects(projects);
  }, []);

  useEffect(() => {
    refreshHistory();
  }, [refreshHistory]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setProfileDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const activeUser = user || { name: 'User' }; // Fallback
  
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .slice(0, 2)
      .join('')
      .toUpperCase() || 'U';
  };

  const handleConnect = (url: string) => {
    setConnectionModalOpen(false);
    const project: Project = {
      id: `db-${Date.now()}`,
      name: url.split('/').pop() || 'Database',
      type: 'database',
      connectionString: url,
      lastOpened: new Date().toISOString()
    };
    onOpenProject(project);
  };

  const clearHistory = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Clear all recent history?')) {
      localStorage.removeItem(RECENT_PROJECTS_KEY);
      setRecentProjects([]);
    }
  };

  const handleImport = () => {
    onCreateNew('folder');
  };

  return (
    <div className="dashboard-container">
      <ConnectionModal 
        isOpen={connectionModalOpen}
        onClose={() => setConnectionModalOpen(false)}
        onConnect={handleConnect}
      />

      {/* Unified Action Pill */}
      <div className="top-right-pill-container">
        <div className="action-pill">
          <button 
            className="pill-btn theme-toggle-btn" 
            onClick={toggleTheme}
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          >
            {theme === 'dark' ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
              </svg>
            )}
          </button>
          
          <div className="pill-divider"></div>
          
          <div className="profile-dropdown-wrapper" ref={dropdownRef}>
            <button 
              className="pill-btn profile-trigger" 
              onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
            >
              <div className="compact-avatar">{getInitials(activeUser.name)}</div>
            </button>
            
            {profileDropdownOpen && (
              <div className="profile-dropdown">
                <div className="dropdown-header">
                  <div className="dropdown-avatar">{getInitials(activeUser.name)}</div>
                  <div className="dropdown-user-info">
                    <span className="dropdown-name">{activeUser.name}</span>
                    <span className="dropdown-email">{activeUser.name.toLowerCase().replace(/\s+/g, '')}@example.com</span>
                  </div>
                </div>
                <div className="dropdown-divider"></div>
                <button className="dropdown-item" onClick={() => { setProfileDropdownOpen(false); onOpenSettings(); }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
                  </svg>
                  Settings
                </button>
                <div className="dropdown-divider"></div>
                <button className="dropdown-item">Log out</button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="center-content dashboard-hero">
        <h1 className="app-title">PG Studio</h1>

        <div className="actions-row">
          <button className="action-card" onClick={() => onCreateNew('demo')}>
            <div className="action-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <polygon points="5 3 19 12 5 21 5 3"></polygon>
              </svg>
            </div>
            <span>Demo</span>
          </button>

          <button className="action-card" onClick={() => setConnectionModalOpen(true)}>
            <div className="action-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <ellipse cx="12" cy="5" rx="9" ry="3"></ellipse>
                <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path>
                <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path>
              </svg>
            </div>
            <span>Connect</span>
          </button>

          <button className="action-card" onClick={handleImport}>
            <div className="action-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
                <line x1="12" y1="11" x2="12" y2="17"></line>
                <line x1="9" y1="14" x2="15" y2="14"></line>
              </svg>
            </div>
            <span>Import</span>
          </button>
        </div>

        <div className="history-section">
          <div className="history-header">
            <h2 className="history-title">History</h2>
            {recentProjects.length > 0 && (
              <button className="clear-history-btn" onClick={clearHistory}>Clear</button>
            )}
            <div className="history-line"></div>
          </div>
          
          {recentProjects.length > 0 ? (
            <div className="history-list">
              {recentProjects.map(project => (
                <div 
                  key={project.id} 
                  className="history-item"
                  onClick={() => onOpenProject(project)}
                >
                  <div className="history-icon">
                    {project.type === 'database' ? (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>
                      </svg>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
                      </svg>
                    )}
                  </div>
                  <div className="history-info">
                    <span className="history-name">{project.name}</span>
                    <span className="history-meta">
                      {project.type.charAt(0).toUpperCase() + project.type.slice(1)} • {formatDate(project.lastOpened)}
                    </span>
                  </div>
                  <svg className="history-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 18l6-6-6-6"/>
                  </svg>
                </div>
              ))}
            </div>
          ) : (
            <div className="history-empty">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="empty-icon">
                <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
              </svg>
              <span>No recent projects yet.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
