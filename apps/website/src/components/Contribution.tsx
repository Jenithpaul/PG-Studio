import { Github, MessageSquare, Coffee, Terminal } from 'lucide-react';

export const Contribution = () => {
  return (
    <section id="contribute" style={{ padding: '100px 0', background: 'white' }}>
      <div className="container">
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '4rem',
          alignItems: 'center'
        }}>
          <div>
            <h2 style={{ fontSize: '2.5rem', marginBottom: '1.5rem', letterSpacing: '-0.03em' }}>Join the <span style={{ color: 'var(--accent-color)' }}>Open Source</span> Community</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '2.5rem', fontSize: '1.1rem' }}>
              PG Studio is built by developers for developers. We believe in the power of community-driven software and welcome all contributions.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <div style={{ color: 'var(--accent-color)' }}><Terminal size={20} /></div>
                <span style={{ fontWeight: 500, fontSize: '0.95rem' }}>Fix bugs & implement new features</span>
              </div>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <div style={{ color: 'var(--accent-color)' }}><MessageSquare size={20} /></div>
                <span style={{ fontWeight: 500, fontSize: '0.95rem' }}>Suggest improvements and report issues</span>
              </div>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <div style={{ color: 'var(--accent-color)' }}><Coffee size={20} /></div>
                <span style={{ fontWeight: 500, fontSize: '0.95rem' }}>Support the project development</span>
              </div>
            </div>
          </div>

          <div style={{
            padding: '3rem',
            background: '#fafafa',
            borderRadius: '24px',
            border: '1px solid var(--card-border)',
            textAlign: 'center'
          }}>
            <h3 style={{ marginBottom: '1.5rem', fontSize: '1.5rem', fontWeight: 700 }}>Ready to contribute?</h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', fontSize: '0.95rem' }}>Explore the codebase, pick up an issue, and start building with us.</p>
            <a
              href="https://github.com/Jenithpaul/PG-Studio"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary"
              style={{ width: '100%', maxWidth: '280px', justifyContent: 'center', padding: '1rem', fontSize: '1.1rem' }}
            >
              <Github size={20} />
              GitHub Repository
            </a>
            <p style={{ marginTop: '1.5rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
              Read the <code>CONTRIBUTING.md</code> for setup instructions.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
