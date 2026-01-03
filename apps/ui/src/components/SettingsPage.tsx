import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useUser } from '../contexts/UserContext';
import './SettingsPage.css';

interface SettingsPageProps {
  onClose: () => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ onClose }) => {
  const { theme, toggleTheme } = useTheme();
  const { user, updateName } = useUser();
  const [editingName, setEditingName] = React.useState(user.name);

  // Sync state if context content changes externally
  React.useEffect(() => {
    setEditingName(user.name);
  }, [user.name]);

  const handleNameBlur = () => {
    if (editingName.trim()) {
      updateName(editingName.trim());
    } else {
      setEditingName(user.name); // Revert if empty
    }
  };

  return (
    <div className="settings-page">
      <header className="settings-header">
        <button className="back-btn" onClick={onClose}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          <span>Back</span>
        </button>
        <h1>Settings</h1>
      </header>

      <div className="settings-content">
        {/* Profile Section */}
        <section className="settings-section">
          <h2>Profile</h2>
          <div className="setting-item">
            <div className="setting-info">
              <span className="setting-label">Display Name</span>
              <span className="setting-description">Your name as it appears in the app</span>
            </div>
            <input 
              className="setting-input" 
              value={editingName} 
              onChange={(e) => setEditingName(e.target.value)}
              onBlur={handleNameBlur}
            />
          </div>
        </section>

        {/* Appearance Section */}
        <section className="settings-section">
          <h2>Appearance</h2>
          <div className="setting-item">
            <div className="setting-info">
              <span className="setting-label">Theme</span>
              <span className="setting-description">Choose between light and dark mode</span>
            </div>
            <div className="theme-switcher">
              <button 
                className={`theme-option ${theme === 'light' ? 'active' : ''}`}
                onClick={() => theme === 'dark' && toggleTheme()}
              >
                <div className="theme-preview light"></div>
                <span>Light</span>
              </button>
              <button 
                className={`theme-option ${theme === 'dark' ? 'active' : ''}`}
                onClick={() => theme === 'light' && toggleTheme()}
              >
                <div className="theme-preview dark"></div>
                <span>Dark</span>
              </button>
            </div>
          </div>
        </section>

        {/* Editor Section */}
        <section className="settings-section">
          <h2>Editor</h2>
          <div className="setting-item">
            <div className="setting-info">
              <span className="setting-label">Font Size</span>
              <span className="setting-description">Adjust the code editor font size</span>
            </div>
            <select className="setting-select" defaultValue="14">
              <option value="12">12px</option>
              <option value="14">14px</option>
              <option value="16">16px</option>
              <option value="18">18px</option>
            </select>
          </div>
          <div className="setting-item">
            <div className="setting-info">
              <span className="setting-label">Auto-save</span>
              <span className="setting-description">Automatically save changes</span>
            </div>
            <label className="toggle-switch">
              <input type="checkbox" defaultChecked />
              <span className="toggle-slider"></span>
            </label>
          </div>
        </section>

        {/* Visualization Section */}
        <section className="settings-section">
          <h2>Visualization</h2>
          <div className="setting-item">
            <div className="setting-info">
              <span className="setting-label">Default Layout</span>
              <span className="setting-description">Choose the default layout algorithm</span>
            </div>
            <select className="setting-select" defaultValue="hierarchical">
              <option value="hierarchical">Hierarchical</option>
              <option value="force_directed">Force Directed</option>
              <option value="grid">Grid</option>
            </select>
          </div>
          <div className="setting-item">
            <div className="setting-info">
              <span className="setting-label">Animate Connections</span>
              <span className="setting-description">Show animated edges between tables</span>
            </div>
            <label className="toggle-switch">
              <input type="checkbox" defaultChecked />
              <span className="toggle-slider"></span>
            </label>
          </div>
        </section>

        {/* About Section */}
        <section className="settings-section">
          <h2>About</h2>
          <div className="about-info">
            <div className="app-logo">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <ellipse cx="12" cy="5" rx="9" ry="3"/>
                <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/>
                <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>
              </svg>
            </div>
            <h3>PG Studio</h3>
            <p>Version 1.0.0</p>
            <p className="copyright">© 2024 PG Studio. Open Source.</p>
          </div>
        </section>
      </div>
    </div>
  );
};
