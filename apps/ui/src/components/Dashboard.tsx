import React, { useState, useCallback, useEffect } from 'react';
import './Dashboard.css';

export interface Project {
  id: string;
  name: string;
  type: 'database' | 'folder' | 'demo';
  connectionString?: string;
  folderPath?: string;
  lastOpened: string;
  tableCount?: number;
  icon?: string;
}

interface DashboardProps {
  onOpenProject: (project: Project) => void;
  onCreateNew: (type: 'database' | 'folder' | 'demo') => void;
}

const RECENT_PROJECTS_KEY = 'pg-studio-recent-projects';

export const saveRecentProject = (project: Project) => {
  try {
    const stored = localStorage.getItem(RECENT_PROJECTS_KEY);
    let projects: Project[] = stored ? JSON.parse(stored) : [];
    
    // Remove existing project with same id
    projects = projects.filter(p => p.id !== project.id);
    
    // Add to beginning
    projects.unshift({ ...project, lastOpened: new Date().toISOString() });
    
    // Keep only last 10
    projects = projects.slice(0, 10);
    
    localStorage.setItem(RECENT_PROJECTS_KEY, JSON.stringify(projects));
  } catch (e) {
    console.error('Failed to save recent project:', e);
  }
};

export const loadRecentProjects = (): Project[] => {
  try {
    const stored = localStorage.getItem(RECENT_PROJECTS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (e) {
    console.error('Failed to load recent projects:', e);
    return [];
  }
};

const Dashboard: React.FC<DashboardProps> = ({ onOpenProject, onCreateNew }) => {
  const [recentProjects, setRecentProjects] = useState<Project[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    setRecentProjects(loadRecentProjects());
  }, []);

  const filteredProjects = recentProjects.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

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

  const getProjectIcon = (type: string) => {
    switch (type) {
      case 'database':
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <ellipse cx="12" cy="5" rx="9" ry="3" />
            <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
            <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
          </svg>
        );
      case 'folder':
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
          </svg>
        );
      case 'demo':
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M12 2L2 7l10 5 10-5-10-5z" />
            <path d="M2 17l10 5 10-5" />
            <path d="M2 12l10 5 10-5" />
          </svg>
        );
      default:
        return null;
    }
  };

  const handleRemoveProject = useCallback((e: React.MouseEvent, projectId: string) => {
    e.stopPropagation();
    const updated = recentProjects.filter(p => p.id !== projectId);
    setRecentProjects(updated);
    localStorage.setItem(RECENT_PROJECTS_KEY, JSON.stringify(updated));
  }, [recentProjects]);

  return (
    <div className="dashboard">
      {/* Header */}
      <header className="dashboard-header">
        <div className="dashboard-logo">
          <div className="dashboard-logo-icon">PG</div>
          <div className="dashboard-logo-text">
            <span>PG</span> Studio
          </div>
        </div>
        <p className="dashboard-tagline">PostgreSQL Schema Visualizer</p>
      </header>

      {/* Quick Actions */}
      <section className="dashboard-section">
        <h2 className="dashboard-section-title">Get Started</h2>
        <div className="quick-actions">
          <button className="quick-action-card" onClick={() => onCreateNew('database')}>
            <div className="quick-action-icon database">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <ellipse cx="12" cy="5" rx="9" ry="3" />
                <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
                <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
              </svg>
            </div>
            <div className="quick-action-content">
              <h3>Connect Database</h3>
              <p>Connect to a live PostgreSQL database</p>
            </div>
            <div className="quick-action-arrow">→</div>
          </button>

          <button className="quick-action-card" onClick={() => onCreateNew('folder')}>
            <div className="quick-action-icon folder">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <div className="quick-action-content">
              <h3>Open SQL Folder</h3>
              <p>Scan SQL files from your project</p>
            </div>
            <div className="quick-action-arrow">→</div>
          </button>

          <button className="quick-action-card" onClick={() => onCreateNew('demo')}>
            <div className="quick-action-icon demo">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
              </svg>
            </div>
            <div className="quick-action-content">
              <h3>Demo Mode</h3>
              <p>Explore with sample e-commerce schema</p>
            </div>
            <div className="quick-action-arrow">→</div>
          </button>
        </div>
      </section>

      {/* Recent Projects */}
      <section className="dashboard-section">
        <div className="section-header">
          <h2 className="dashboard-section-title">Recent Projects</h2>
          {recentProjects.length > 0 && (
            <div className="section-search">
              <input
                type="text"
                placeholder="Search projects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
            </div>
          )}
        </div>

        {filteredProjects.length > 0 ? (
          <div className="projects-grid">
            {filteredProjects.map((project) => (
              <div
                key={project.id}
                className="project-card"
                onClick={() => onOpenProject(project)}
              >
                <div className={`project-icon ${project.type}`}>
                  {getProjectIcon(project.type)}
                </div>
                <div className="project-info">
                  <h3 className="project-name">{project.name}</h3>
                  <p className="project-meta">
                    {project.type === 'database' && project.connectionString && (
                      <span className="project-connection">
                        {project.connectionString.replace(/\/\/.*:.*@/, '//***:***@')}
                      </span>
                    )}
                    {project.type === 'folder' && project.folderPath && (
                      <span className="project-path">{project.folderPath}</span>
                    )}
                    {project.type === 'demo' && (
                      <span className="project-path">Sample e-commerce schema</span>
                    )}
                  </p>
                  <div className="project-footer">
                    <span className="project-time">{formatDate(project.lastOpened)}</span>
                    {project.tableCount && (
                      <span className="project-tables">{project.tableCount} tables</span>
                    )}
                  </div>
                </div>
                <button 
                  className="project-remove" 
                  onClick={(e) => handleRemoveProject(e, project.id)}
                  title="Remove from recent"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-state-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <line x1="3" y1="9" x2="21" y2="9" />
                <line x1="9" y1="21" x2="9" y2="9" />
              </svg>
            </div>
            <h3>No recent projects</h3>
            <p>Get started by connecting to a database or opening a folder</p>
          </div>
        )}
      </section>

      {/* Footer */}
      <footer className="dashboard-footer">
        <p>PG Studio v1.0.0 • Local-first PostgreSQL Schema Visualizer</p>
      </footer>
    </div>
  );
};

export default Dashboard;
