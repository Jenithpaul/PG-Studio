export const Footer = () => {
  return (
    <footer style={{
      padding: '80px 0 40px',
      borderTop: '1px solid var(--card-border)',
      background: '#fafafa'
    }}>
      <div className="container">
        <div style={{
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '2rem',
          marginBottom: '4rem'
        }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: '1.25rem', marginBottom: '0.5rem' }}>
              PG Studio
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', maxWidth: '300px' }}>
              The open-source PostgreSQL schema visualizer built for clarity and speed.
            </p>
          </div>
          <div style={{
            display: 'flex',
            gap: '3rem',
            color: 'var(--text-muted)',
            fontSize: '0.9rem'
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <span style={{ color: 'var(--text-color)', fontWeight: 600 }}>Product</span>
              <a href="#" className="footer-link">Home</a>
              <a href="#features" className="footer-link">Features</a>
              <a href="/PG-Studio-v1.0.0.zip" className="footer-link">Download</a>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <span style={{ color: 'var(--text-color)', fontWeight: 600 }}>Community</span>
              <a href="https://github.com/Jenithpaul/PG-Studio" className="footer-link">GitHub</a>
              <a href="#contribute" className="footer-link">Contribute</a>
              <a href="https://github.com/Jenithpaul/PG-Studio/issues" className="footer-link">Issues</a>
            </div>
          </div>
        </div>
        <div style={{ 
          paddingTop: '2rem',
          borderTop: '1px solid #efefef',
          display: 'flex',
          justifyContent: 'space-between',
          color: 'var(--text-muted)', 
          fontSize: '0.85rem' 
        }}>
          <span>© {new Date().getFullYear()} PG Studio. Open source MIT License.</span>
          <span>Built with ❤️ for developers</span>
        </div>
      </div>
      <style>{`
        .footer-link {
            transition: color 0.2s;
        }
        .footer-link:hover {
          color: var(--accent-color);
        }
      `}</style>
    </footer>
  );
};
