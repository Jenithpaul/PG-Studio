import { motion } from 'framer-motion';
import { Database, MousePointer2, GitBranch, FileCode, Zap, Shield, ArrowRight } from 'lucide-react';
import { useState } from 'react';

const features = [
  {
    icon: <Database size={28} />,
    title: "Direct Introspection",
    desc: "Connect to your local or remote PostgreSQL database and fetch schemas directly. No manual SQL exports needed.",
    gradient: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
    delay: 0
  },
  {
    icon: <MousePointer2 size={28} />,
    title: "Interactive ERD",
    desc: "Click, drag, and explore relationships between tables with a smooth, responsive canvas interface.",
    gradient: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
    delay: 0.1
  },
  {
    icon: <GitBranch size={28} />,
    title: "Relationship Mapping",
    desc: "Automatically detect foreign keys and visualize complex joins through intuitive curved connection lines.",
    gradient: "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)",
    delay: 0.2
  },
  {
    icon: <FileCode size={28} />,
    title: "Export Anywhere",
    desc: "Generate SQL DDL, export to PNG, SVG, or JSON. Share your schema documentation with your team.",
    gradient: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
    delay: 0.3
  },
  {
    icon: <Zap size={28} />,
    title: "Lightning Fast",
    desc: "Built with React and optimized for performance. Handle schemas with hundreds of tables smoothly.",
    gradient: "linear-gradient(135deg, #ec4899 0%, #db2777 100%)",
    delay: 0.4
  },
  {
    icon: <Shield size={28} />,
    title: "Privacy First",
    desc: "100% local-first. Your data never leaves your machine. No cloud, no tracking, no compromise.",
    gradient: "linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)",
    delay: 0.5
  }
];

const FeatureCard = ({ feature }: { feature: any }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: feature.delay, duration: 0.5 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        background: 'rgba(26, 26, 26, 0.6)',
        backdropFilter: 'blur(10px)',
        border: '1px solid var(--border-primary)',
        borderRadius: '24px',
        padding: '32px',
        position: 'relative',
        overflow: 'hidden',
        transition: 'all 0.3s ease',
        transform: isHovered ? 'translateY(-5px)' : 'translateY(0)',
        boxShadow: isHovered 
          ? `0 20px 40px -10px rgba(0,0,0,0.5), 0 0 0 1px ${feature.gradient.split(' ')[2]}` 
          : 'none'
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '2px',
          background: feature.gradient,
          opacity: isHovered ? 1 : 0,
          transition: 'opacity 0.3s ease'
        }}
      />
      
      <div style={{
        width: '64px',
        height: '64px',
        background: feature.gradient,
        borderRadius: '18px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '24px',
        color: 'white',
        boxShadow: `0 10px 25px -5px ${feature.gradient.includes('#10b981') ? 'rgba(16, 185, 129, 0.4)' : 'rgba(0,0,0,0.3)'}`,
        position: 'relative',
        zIndex: 1
      }}>
        {feature.icon}
      </div>

      <h3 style={{ 
        marginBottom: '12px', 
        fontSize: '20px', 
        fontWeight: 700,
        color: 'var(--text-primary)' 
      }}>
        {feature.title}
      </h3>
      
      <p style={{ 
        color: 'var(--text-secondary)', 
        fontSize: '16px', 
        lineHeight: 1.6,
        opacity: 0.9 
      }}>
        {feature.desc}
      </p>

      {/* Decorative gradient blob */}
      <div style={{
        position: 'absolute',
        top: '-20%',
        right: '-20%',
        width: '150px',
        height: '150px',
        background: feature.gradient,
        filter: 'blur(60px)',
        opacity: 0.1,
        borderRadius: '50%',
        pointerEvents: 'none'
      }} />
    </motion.div>
  );
};

export const FeatureSection = () => {
  return (
    <section id="features" style={{ 
      padding: '120px 0', 
      position: 'relative',
      overflow: 'hidden',
      background: 'linear-gradient(to bottom, var(--bg-primary), var(--bg-secondary))'
    }}>
      {/* Background Grid */}
      <div className="bg-grid" style={{ opacity: 0.05 }} />

      <div className="container">
        <div className="section-header">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div style={{
              display: 'inline-block',
              padding: '6px 16px',
              borderRadius: '100px',
              background: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid rgba(16, 185, 129, 0.2)',
              color: '#10b981',
              fontSize: '14px',
              fontWeight: 600,
              marginBottom: '24px',
              letterSpacing: '0.05em'
            }}>
              FEATURES
            </div>
            <h2 style={{ fontSize: 'clamp(2.5rem, 5vw, 3.5rem)', marginBottom: '24px' }}>
              Everything you need to<br />
              <span className="text-gradient">master your database</span>
            </h2>
            <p style={{ fontSize: '1.2rem', maxWidth: '600px', margin: '0 auto', color: 'var(--text-muted)' }}>
              A complete toolkit for visualizing, understanding, and documenting 
              your PostgreSQL schema architecture.
            </p>
          </motion.div>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
          gap: '32px',
          position: 'relative',
          zIndex: 1
        }}>
          {features.map((f, i) => (
            <FeatureCard key={i} feature={f} />
          ))}
        </div>

        {/* Workflow Section */}
        <div id="workflow" style={{ marginTop: '200px' }}>
          <div className="section-header">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 style={{ fontSize: 'clamp(2rem, 4vw, 3rem)' }}>
                Simple <span className="text-gradient">3-step</span> workflow
              </h2>
              <p style={{ fontSize: '1.2rem', color: 'var(--text-muted)' }}>
                From connection to visualization in under a minute.
              </p>
            </motion.div>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '40px',
            position: 'relative'
          }}>
            {/* Connecting Line (Desktop) */}
            <div className="desktop-only" style={{
              position: 'absolute',
              top: '100px',
              left: '15%',
              right: '15%',
              height: '2px',
              background: 'linear-gradient(90deg, transparent, var(--border-hover) 20%, var(--border-hover) 80%, transparent)',
              zIndex: 0,
              display: 'none' // Hidden by default, enable via media query in CSS if needed, or keeping it subtle
            }} />

            {[
              { 
                step: '01', 
                title: 'Connect', 
                text: 'Provide your connection string or drop SQL files directly.',
                icon: <Database size={32} color="#10b981" />
              },
              { 
                step: '02', 
                title: 'Visualize', 
                text: 'Instantly explore tables and relationships on an infinite canvas.',
                icon: <Zap size={32} color="#3b82f6" />
              },
              { 
                step: '03', 
                title: 'Export', 
                text: 'Export as SQL, PNG, or JSON to share with your team.',
                icon: <FileCode size={32} color="#f59e0b" />
              }
            ].map((item, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.2 }}
                style={{
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border-primary)',
                  borderRadius: '24px',
                  padding: '48px 32px',
                  position: 'relative',
                  zIndex: 1,
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center'
                }}
              >
                <div style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '50%',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-hover)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '24px',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.2)'
                }}>
                  {item.icon}
                </div>
                
                <div style={{
                  position: 'absolute',
                  top: '24px',
                  right: '24px',
                  fontSize: '14px',
                  fontWeight: 900,
                  opacity: 0.3,
                  color: 'var(--text-muted)'
                }}>
                  {item.step}
                </div>

                <h3 style={{ marginBottom: '16px', fontSize: '24px' }}>{item.title}</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '16px', lineHeight: 1.6 }}>{item.text}</p>
                
                {idx < 2 && (
                  <div className="arrow-icon" style={{
                    position: 'absolute',
                    right: '-20px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    zIndex: 2,
                    color: 'var(--text-muted)',
                    display: 'none' // Control via CSS media queries if possible
                  }}>
                    <ArrowRight size={24} />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
