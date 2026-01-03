import { Github, Twitter } from 'lucide-react';

export const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer style={{
      background: 'var(--bg-secondary)',
      borderTop: '1px solid var(--border-primary)',
      padding: '80px 0 40px'
    }}>
      <div className="container">
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '48px',
          marginBottom: '64px'
        }}>
          {/* Brand */}
          <div>
            <img 
              src="/logo.png" 
              alt="PG Studio" 
              style={{ 
                height: '48px', 
                marginBottom: '20px',
                filter: 'drop-shadow(0 2px 8px rgba(16, 185, 129, 0.2))'
              }} 
            />
            <p style={{ 
              color: 'var(--text-muted)', 
              fontSize: '14px', 
              lineHeight: 1.7,
              maxWidth: '280px'
            }}>
              The open-source PostgreSQL schema visualizer built for clarity, speed, and privacy.
            </p>
          </div>

          {/* Product Links */}
          <div>
            <h4 style={{ 
              fontSize: '13px', 
              fontWeight: 600, 
              marginBottom: '20px',
              color: 'var(--text-primary)',
              letterSpacing: '0.05em'
            }}>
              PRODUCT
            </h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <li><a href="#features" style={{ color: 'var(--text-muted)', fontSize: '14px', transition: 'color 0.2s' }} onMouseOver={(e) => e.currentTarget.style.color = 'var(--accent-primary)'} onMouseOut={(e) => e.currentTarget.style.color = 'var(--text-muted)'}>Features</a></li>
              <li><a href="#workflow" style={{ color: 'var(--text-muted)', fontSize: '14px', transition: 'color 0.2s' }} onMouseOver={(e) => e.currentTarget.style.color = 'var(--accent-primary)'} onMouseOut={(e) => e.currentTarget.style.color = 'var(--text-muted)'}>How it Works</a></li>
              <li><a href="/PG-Studio-v1.0.0.zip" style={{ color: 'var(--text-muted)', fontSize: '14px', transition: 'color 0.2s' }} onMouseOver={(e) => e.currentTarget.style.color = 'var(--accent-primary)'} onMouseOut={(e) => e.currentTarget.style.color = 'var(--text-muted)'}>Download</a></li>
            </ul>
          </div>

          {/* Community Links */}
          <div>
            <h4 style={{ 
              fontSize: '13px', 
              fontWeight: 600, 
              marginBottom: '20px',
              color: 'var(--text-primary)',
              letterSpacing: '0.05em'
            }}>
              COMMUNITY
            </h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <li><a href="https://github.com/Jenithpaul/PG-Studio" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--text-muted)', fontSize: '14px', transition: 'color 0.2s' }} onMouseOver={(e) => e.currentTarget.style.color = 'var(--accent-primary)'} onMouseOut={(e) => e.currentTarget.style.color = 'var(--text-muted)'}>GitHub</a></li>
              <li><a href="#contribute" style={{ color: 'var(--text-muted)', fontSize: '14px', transition: 'color 0.2s' }} onMouseOver={(e) => e.currentTarget.style.color = 'var(--accent-primary)'} onMouseOut={(e) => e.currentTarget.style.color = 'var(--text-muted)'}>Contribute</a></li>
              <li><a href="https://github.com/Jenithpaul/PG-Studio/issues" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--text-muted)', fontSize: '14px', transition: 'color 0.2s' }} onMouseOver={(e) => e.currentTarget.style.color = 'var(--accent-primary)'} onMouseOut={(e) => e.currentTarget.style.color = 'var(--text-muted)'}>Report Issues</a></li>
            </ul>
          </div>

          {/* Social Links */}
          <div>
            <h4 style={{ 
              fontSize: '13px', 
              fontWeight: 600, 
              marginBottom: '20px',
              color: 'var(--text-primary)',
              letterSpacing: '0.05em'
            }}>
              CONNECT
            </h4>
            <div style={{ display: 'flex', gap: '12px' }}>
              <a 
                href="https://github.com/Jenithpaul/PG-Studio" 
                target="_blank" 
                rel="noopener noreferrer"
                style={{
                  width: '40px',
                  height: '40px',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-primary)',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--text-muted)',
                  transition: 'all 0.2s'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.borderColor = 'var(--accent-primary)';
                  e.currentTarget.style.color = 'var(--accent-primary)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-primary)';
                  e.currentTarget.style.color = 'var(--text-muted)';
                }}
              >
                <Github size={18} />
              </a>
              <a 
                href="https://twitter.com" 
                target="_blank" 
                rel="noopener noreferrer"
                style={{
                  width: '40px',
                  height: '40px',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-primary)',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--text-muted)',
                  transition: 'all 0.2s'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.borderColor = 'var(--accent-primary)';
                  e.currentTarget.style.color = 'var(--accent-primary)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-primary)';
                  e.currentTarget.style.color = 'var(--text-muted)';
                }}
              >
                <Twitter size={18} />
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div style={{
          paddingTop: '32px',
          borderTop: '1px solid var(--border-primary)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px'
        }}>
          <span style={{ color: 'var(--text-dim)', fontSize: '13px' }}>
            © {currentYear} PG Studio. Open source under MIT License.
          </span>
          <span style={{ color: 'var(--text-dim)', fontSize: '13px' }}>
            Built with ❤️ for developers
          </span>
        </div>
      </div>
    </footer>
  );
};
