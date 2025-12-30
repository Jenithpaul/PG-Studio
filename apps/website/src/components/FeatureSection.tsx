import { motion } from 'framer-motion';
import { MousePointer2, GitBranch, Database, FileCode } from 'lucide-react';

const features = [
  {
    icon: <Database size={20} />,
    title: "Direct Introspection",
    desc: "Connect to your local or remote database and fetch schemas directly. No manual SQL exports needed."
  },
  {
    icon: <MousePointer2 size={20} />,
    title: "Interactive ERD",
    desc: "Click, drag, and explore relationships between tables with a smooth, responsive interface."
  },
  {
    icon: <GitBranch size={20} />,
    title: "Relationship Mapping",
    desc: "Automatically detect foreign keys and visualize complex joins through intuitive connection lines."
  },
  {
    icon: <FileCode size={20} />,
    title: "Schema Documentation",
    desc: "Generate comprehensive documentation for your database structure with one click."
  }
];

export const FeatureSection = () => {
  return (
    <section id="features" style={{ padding: '80px 0', background: '#fcfcfc' }}>
      <div className="container">
        <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
          <h2 style={{ fontSize: '2.25rem', marginBottom: '1rem', letterSpacing: '-0.03em' }}>Built for <span style={{ color: 'var(--accent-color)' }}>Modern Teams</span></h2>
          <p style={{ color: 'var(--text-muted)', maxWidth: '600px', margin: '0 auto', fontSize: '1.1rem' }}>
            Everything you need to master your database architecture in one sleek package.
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '1.5rem'
        }}>
          {features.map((f, i) => (
            <motion.div
              key={i}
              whileHover={{ y: -4, borderColor: 'var(--accent-color)' }}
              style={{ 
                padding: '2rem',
                border: '1px solid var(--card-border)',
                borderRadius: '12px',
                background: 'white',
                transition: 'all 0.2s ease'
              }}
            >
              <div style={{
                width: '40px',
                height: '40px',
                background: 'var(--selection-color)',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1.25rem',
                color: 'var(--accent-color)'
              }}>
                {f.icon}
              </div>
              <h3 style={{ marginBottom: '0.75rem', fontSize: '1.2rem', fontWeight: 600 }}>{f.title}</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: 1.6 }}>{f.desc}</p>
            </motion.div>
          ))}
        </div>

        <div style={{
          marginTop: '6rem',
          padding: '3rem',
          borderRadius: '16px',
          background: 'white',
          border: '1px solid var(--card-border)',
          boxShadow: '0 4px 20px rgba(0,0,0,0.03)'
        }}>
          <h3 style={{ fontSize: '1.75rem', marginBottom: '3rem', textAlign: 'center', fontWeight: 700 }}>Simple 3-Step Workflow</h3>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '2rem'
          }}>
            {[
              { step: '01', title: 'Connect', text: 'Provide your PostgreSQL connection string or select a local database.' },
              { step: '02', title: 'Visualize', text: 'Instantly see your tables, columns, and relationships in a map.' },
              { step: '03', title: 'Export', text: 'Export your schema as an image or generate documentation.' }
            ].map((item, idx) => (
              <div key={idx} style={{ textAlign: 'left', paddingLeft: '1.5rem', borderLeft: '2px solid' + (idx === 0 ? ' var(--accent-color)' : '#eee') }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--accent-color)', marginBottom: '0.5rem', opacity: 0.6 }}>STEP {item.step}</div>
                <h4 style={{ marginBottom: '0.5rem', fontSize: '1.1rem' }}>{item.title}</h4>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
