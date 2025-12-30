import { Github } from 'lucide-react';

export const Navbar = () => {
  return (
    <nav className="navbar" style={{
      position: 'fixed',
      top: 0,
      width: '100%',
      zIndex: 100,
      background: 'rgba(255, 255, 255, 0.8)',
      backdropFilter: 'blur(8px)',
      borderBottom: '1px solid var(--card-border)'
    }}>
      <div className="container" style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        height: '60px'
      }}>
        <div className="logo" style={{ fontWeight: 700, fontSize: '1.25rem', letterSpacing: '-0.5px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '24px', height: '24px', background: 'var(--accent-color)', borderRadius: '4px' }}></div>
          PG Studio
        </div>
        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
          <a href="#features" className="nav-link">Features</a>
          <a href="#contribute" className="nav-link">Contribute</a>
          <div style={{ width: '1px', height: '20px', background: 'var(--card-border)' }}></div>
          <a href="https://github.com/Jenithpaul/PG-Studio" target="_blank" rel="noopener noreferrer" className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.875rem' }}>
            <Github size={16} />
            Star on GitHub
          </a>
        </div>
      </div>
      <style>{`
        .nav-link {
          color: var(--text-muted);
          font-weight: 500;
          font-size: 0.9rem;
          transition: color 0.3s;
        }
        .nav-link:hover {
          color: var(--text-color);
        }
      `}</style>
    </nav>
  );
};
