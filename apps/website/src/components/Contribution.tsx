import { motion } from 'framer-motion';
import { GitPullRequest, Star, Heart } from 'lucide-react';

export const Contribution = () => {
  return (
    <section id="contribute" className="section" style={{ 
      background: 'var(--bg-primary)',
      position: 'relative',
      overflow: 'hidden',
      paddingBottom: '200px'
    }}>
      {/* Background Glow */}
      <div className="glow-orb" style={{
        background: 'radial-gradient(circle, rgba(16, 185, 129, 0.15) 0%, transparent 70%)',
        width: '1000px',
        height: '1000px',
        bottom: '-400px',
        left: '50%',
        transform: 'translateX(-50%)',
        animation: 'pulse-glow 10s infinite alternate'
      }} />

      <div className="container" style={{ position: 'relative', zIndex: 1 }}>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          style={{
            maxWidth: '800px',
            margin: '0 auto',
            textAlign: 'center'
          }}
        >
          <motion.div 
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            style={{
              width: '100px',
              height: '100px',
              background: 'linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.01))',
              border: '1px solid var(--border-primary)',
              borderRadius: '30px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 40px',
              fontSize: '40px',
              boxShadow: '0 20px 40px -10px rgba(0,0,0,0.3)',
              backdropFilter: 'blur(10px)'
            }}
          >
            <Heart size={48} style={{ color: '#ec4899', fill: 'rgba(236, 72, 153, 0.2)' }} />
          </motion.div>

          <h2 style={{ marginBottom: '24px', fontSize: 'clamp(2.5rem, 5vw, 3.5rem)' }}>
            Built by the community,<br />
            <span className="text-gradient">for the community</span>
          </h2>

          <p style={{
            fontSize: '1.2rem',
            color: 'var(--text-muted)',
            marginBottom: '48px',
            lineHeight: 1.8,
            maxWidth: '600px',
            marginLeft: 'auto',
            marginRight: 'auto'
          }}>
            PG Studio is open source and free forever. We believe in building tools 
            that empower developers. Join us in making database visualization accessible to everyone.
          </p>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            style={{
              marginBottom: '48px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '12px',
              background: 'rgba(59, 130, 246, 0.1)',
              border: '1px solid rgba(59, 130, 246, 0.2)',
              borderRadius: '100px',
              padding: '8px 24px',
              cursor: 'pointer'
            }}
            whileHover={{ scale: 1.05, background: 'rgba(59, 130, 246, 0.15)' }}
            onClick={() => window.open('https://twitter.com/Jenithpaul', '_blank')}
          >
             <span style={{ 
               width: '8px', 
               height: '8px', 
               borderRadius: '50%', 
               background: '#60a5fa', 
               boxShadow: '0 0 10px #60a5fa' 
              }} />
             <span style={{ color: '#93c5fd', fontSize: '14px', fontWeight: 500 }}>
               New features coming soon! — Request on X
             </span>
          </motion.div>

          <div style={{ 
            display: 'flex', 
            gap: '20px', 
            justifyContent: 'center',
            flexWrap: 'wrap',
            marginBottom: '80px'
          }}>
            <a 
              href="https://github.com/Jenithpaul/PG-Studio" 
              target="_blank" 
              rel="noopener noreferrer"
              className="btn btn-primary"
            >
              <Star size={20} />
              Star on GitHub
            </a>
            <a 
              href="https://github.com/Jenithpaul/PG-Studio/issues" 
              target="_blank" 
              rel="noopener noreferrer"
              className="btn btn-secondary"
            >
              <GitPullRequest size={20} />
              Contribute
            </a>
          </div>

          {/* Stats */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '24px',
            padding: '24px',
          }}>
            {[
              { value: '100%', label: 'Open Source' },
              { value: 'MIT', label: 'License' },
              { value: '∞', label: 'Possibilities' }
            ].map((stat, i) => (
              <motion.div 
                key={i}
                whileHover={{ y: -5 }}
                className="card"
                style={{ 
                  textAlign: 'center', 
                  padding: '40px 24px',
                  background: 'rgba(255, 255, 255, 0.02)' 
                }}
              >
                <div style={{ 
                  fontSize: '48px', 
                  fontWeight: 800, 
                  marginBottom: '12px',
                  background: 'linear-gradient(135deg, #fff 0%, #10b981 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}>
                  {stat.value}
                </div>
                <div style={{ 
                  color: 'var(--text-muted)', 
                  fontSize: '16px', 
                  fontWeight: 500,
                  letterSpacing: '0.05em'
                }}>
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};
