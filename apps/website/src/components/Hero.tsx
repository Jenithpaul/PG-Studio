import { motion } from 'framer-motion';
import { Download } from 'lucide-react';

export const Hero = () => {
  return (
    <section className="hero" style={{
      padding: '120px 0 80px',
      position: 'relative',
      background: 'white'
    }}>
      <div className="container" style={{ textAlign: 'center' }}>
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '4px 12px',
            borderRadius: '100px',
            background: 'var(--selection-color)',
            color: 'var(--accent-hover)',
            fontSize: '0.8rem',
            fontWeight: 600,
            marginBottom: '1.5rem',
            border: '1px solid rgba(62, 207, 142, 0.2)'
          }}>
            <span style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', background: 'currentColor' }}></span>
            Version 1.0.0 is live
          </div>
          
          <h1 style={{ fontSize: 'clamp(2.5rem, 6vw, 4rem)', marginBottom: '1.5rem', letterSpacing: '-0.04em' }}>
            The open-source <br />
            <span style={{ color: 'var(--accent-color)' }}>PostgreSQL visualizer</span>
          </h1>
          
          <p style={{
            fontSize: '1.2rem',
            color: 'var(--text-muted)',
            maxWidth: '650px',
            margin: '0 auto 2.5rem',
            lineHeight: 1.5,
            fontWeight: 450
          }}>
            Connect to your database, visualize complex schemas, and generate documentation. Built for developers who love clean tools.
          </p>

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', marginBottom: '4rem' }}>
            <a href="/PG-Studio-v1.0.0.zip" className="btn btn-primary" style={{ padding: '0.75rem 1.5rem', fontSize: '1rem' }}>
              <Download size={18} />
              Download .exe
            </a>
            <a href="#features" className="btn btn-secondary" style={{ padding: '0.75rem 1.5rem', fontSize: '1rem' }}>
              View Features
            </a>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          style={{
            maxWidth: '1000px',
            margin: '0 auto',
            borderRadius: '12px',
            overflow: 'hidden',
            boxShadow: '0 20px 50px rgba(0,0,0,0.1)',
            border: '1px solid var(--card-border)',
            background: '#f9fafb'
          }}
        >
          <img 
            src="/mockup.png" 
            alt="PG Studio Preview" 
            style={{ 
              width: '100%', 
              height: 'auto',
              display: 'block'
            }} 
          />
        </motion.div>
      </div>
    </section>
  );
};
