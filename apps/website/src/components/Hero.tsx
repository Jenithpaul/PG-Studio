import { motion } from 'framer-motion';
import { Download, ArrowRight, Sparkles } from 'lucide-react';

export const Hero = () => {
  return (
    <section style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      position: 'relative',
      overflow: 'hidden',
      paddingTop: '72px'
    }}>
      {/* Background Effects */}
      <div className="bg-grid" />
      
      {/* Glow Orbs */}
      <div className="glow-orb glow-green" style={{
        width: '600px',
        height: '600px',
        top: '-200px',
        left: '50%',
        transform: 'translateX(-50%)'
      }} />
      <div className="glow-orb glow-blue" style={{
        width: '400px',
        height: '400px',
        bottom: '0',
        right: '-100px'
      }} />

      <div className="container" style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          textAlign: 'center',
          maxWidth: '900px',
          margin: '0 auto'
        }}>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {/* Badge */}
            <div className="badge" style={{ marginBottom: '32px' }}>
              <span className="badge-dot" />
              <span>Version 1.0 is now available</span>
              <Sparkles size={14} style={{ color: 'var(--accent-primary)' }} />
            </div>

            {/* Logo Animation */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              style={{ marginBottom: '32px' }}
            >
              <img 
                src="/logo.png" 
                alt="PG Studio" 
                style={{ 
                  height: '120px',
                  filter: 'drop-shadow(0 20px 40px rgba(16, 185, 129, 0.3))'
                }} 
              />
            </motion.div>

            {/* Headline */}
            <h1 style={{ marginBottom: '24px', letterSpacing: '-0.03em' }}>
              The open-source<br />
              <span className="text-gradient">PostgreSQL visualizer</span>
            </h1>

            {/* Subheadline */}
            <p style={{
              fontSize: '20px',
              color: 'var(--text-muted)',
              maxWidth: '600px',
              margin: '0 auto 48px',
              lineHeight: 1.7
            }}>
              Connect to your database, visualize complex schemas, and generate documentation. 
              Built for developers who love clean, powerful tools.
            </p>

            {/* CTA Buttons */}
            <div style={{ 
              display: 'flex', 
              gap: '16px', 
              justifyContent: 'center',
              flexWrap: 'wrap'
            }}>
              <a href="/PG-Studio-v1.0.0.zip" className="btn btn-primary">
                <Download size={20} />
                Download for Windows
              </a>
              <a href="#features" className="btn btn-secondary">
                Learn More
                <ArrowRight size={18} />
              </a>
            </div>
          </motion.div>

          {/* App Preview */}
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            style={{
              marginTop: '80px',
              width: '100%',
              maxWidth: '1100px'
            }}
          >
            <div style={{
              position: 'relative',
              borderRadius: '20px',
              overflow: 'hidden',
              border: '1px solid var(--border-primary)',
              boxShadow: `
                0 4px 6px rgba(0, 0, 0, 0.1),
                0 20px 50px rgba(0, 0, 0, 0.4),
                0 0 100px -20px rgba(16, 185, 129, 0.3)
              `
            }}>
              {/* Window Chrome */}
              <div style={{
                background: 'var(--bg-tertiary)',
                padding: '12px 16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                borderBottom: '1px solid var(--border-primary)'
              }}>
                <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#ff5f57' }} />
                <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#febc2e' }} />
                <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#28c840' }} />
                <span style={{ 
                  marginLeft: '12px', 
                  fontSize: '13px', 
                  color: 'var(--text-dim)' 
                }}>
                  PG Studio — Schema Visualizer
                </span>
              </div>
              
              <img 
                src="/mockup.png" 
                alt="PG Studio Interface" 
                style={{ 
                  width: '100%', 
                  display: 'block',
                  background: 'var(--bg-secondary)'
                }} 
              />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
