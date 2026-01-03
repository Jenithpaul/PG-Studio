import { motion } from 'framer-motion';
import { GitPullRequest, Star, Heart } from 'lucide-react';

export const Contribution = () => {
  return (
    <section id="contribute" className="section" style={{ 
      background: 'var(--bg-primary)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Background Glow */}
      <div className="glow-orb glow-green" style={{
        width: '500px',
        height: '500px',
        bottom: '-200px',
        left: '50%',
        transform: 'translateX(-50%)'
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
          <div style={{
            width: '80px',
            height: '80px',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-primary)',
            borderRadius: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 32px',
            fontSize: '40px'
          }}>
            <Heart size={36} style={{ color: 'var(--accent-primary)' }} />
          </div>

          <h2 style={{ marginBottom: '24px' }}>
            Built by the community,<br />
            <span className="text-gradient">for the community</span>
          </h2>

          <p style={{
            fontSize: '18px',
            color: 'var(--text-muted)',
            marginBottom: '48px',
            lineHeight: 1.8
          }}>
            PG Studio is open source and free forever. We believe in building tools 
            that empower developers. Join us in making database visualization accessible to everyone.
          </p>

          <div style={{ 
            display: 'flex', 
            gap: '16px', 
            justifyContent: 'center',
            flexWrap: 'wrap',
            marginBottom: '64px'
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
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '32px',
            padding: '40px',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-primary)',
            borderRadius: '20px'
          }}>
            {[
              { value: '100%', label: 'Open Source' },
              { value: 'MIT', label: 'License' },
              { value: '∞', label: 'Possibilities' }
            ].map((stat, i) => (
              <div key={i}>
                <div style={{ 
                  fontSize: '32px', 
                  fontWeight: 800, 
                  marginBottom: '8px',
                  background: 'linear-gradient(135deg, #10b981 0%, #34d399 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}>
                  {stat.value}
                </div>
                <div style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};
