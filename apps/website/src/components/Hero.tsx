import { motion } from 'framer-motion';
import { Download, ArrowRight, Terminal } from 'lucide-react';
import { InteractiveDemo } from './InteractiveDemo';

export const Hero = () => {
  return (
    <section style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      position: 'relative',
      overflow: 'hidden',
      paddingTop: '160px',
      paddingBottom: '80px'
    }}>
      {/* New Spotlight Effect */}
      <div className="bg-spotlight" />
      <div className="bg-grid opacity-20" />
      
      {/* Decorative Gradient Blob */}
      <div style={{
          position: 'absolute',
          top: '-20%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '120vw',
          height: '1000px',
          background: 'radial-gradient(ellipse at center, rgba(16, 185, 129, 0.08) 0%, transparent 60%)',
          zIndex: 0,
          pointerEvents: 'none'
      }} />

      <div className="container" style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          textAlign: 'center',
          maxWidth: '1200px',
          margin: '0 auto'
        }}>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            {/* New "Announce" Badge */}
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="badge" 
              style={{ 
                marginBottom: '40px', 
                background: 'rgba(59, 130, 246, 0.1)', 
                borderColor: 'rgba(59, 130, 246, 0.2)',
                color: '#60a5fa'
              }}
            >
              <Terminal size={14} />
              <span style={{ fontWeight: 600, fontSize: '13px' }}>v1.0 is now live</span>
              <span style={{ width: '1px', height: '12px', background: 'rgba(59, 130, 246, 0.3)', margin: '0 8px' }} />
              <span style={{ color: '#93c5fd', cursor: 'pointer' }} className="flex items-center gap-1">
                Read the changes <ArrowRight size={12} />
              </span>
            </motion.div>

            {/* Headline */}
            <h1 style={{ 
              marginBottom: '32px', 
              fontSize: 'clamp(3.5rem, 7vw, 6rem)',
              fontWeight: 800,
              lineHeight: 1.05,
              position: 'relative',
              letterSpacing: '-0.04em'
            }}>
              Your database,<br />
              <span style={{ 
                  background: 'linear-gradient(to right, #fff 30%, #9ca3af 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
               }}>
                  visually remastered.
               </span>
              
              {/* Cursive Accent */}
              <motion.div
                initial={{ opacity: 0, rotate: -10, scale: 0.8 }}
                animate={{ opacity: 1, rotate: -10, scale: 1 }}
                transition={{ delay: 0.5, duration: 0.5 }}
                style={{
                  position: 'absolute',
                  top: '-40px',
                  right: '10%',
                  fontFamily: 'var(--font-script)',
                  fontSize: '32px',
                  color: '#10b981',
                  transform: 'rotate(-10deg)',
                  textShadow: '0 0 20px rgba(16, 185, 129, 0.3)'
                }}
              >
                Local-first & privacy focused!
                <svg width="40" height="20" viewBox="0 0 30 10" style={{ position: 'absolute', bottom: -5, right: 0, stroke: '#10b981', strokeWidth: 2, fill: 'none' }}>
                   <path d="M0,5 Q15,15 30,5" />
                </svg>
              </motion.div>
            </h1>

            {/* Subheadline */}
            <p style={{
              fontSize: 'clamp(1.2rem, 2vw, 1.5rem)',
              color: 'var(--text-secondary)',
              maxWidth: '680px',
              margin: '0 auto 48px',
              lineHeight: 1.6,
              opacity: 0.9
            }}>
              Design schemas, visualize relationships, and export documentation without writing a single line of DDL.
              <br /><span style={{ color: "var(--text-primary)", fontWeight: 500 }}>Open Source. Local. Forever Free.</span>
            </p>

            {/* CTA Buttons */}
            <div style={{ 
              display: 'flex', 
              gap: '20px', 
              justifyContent: 'center',
              flexWrap: 'wrap'
            }}>
              <a href="/PG-Studio/PG-Studio-v1.0.0.zip" className="btn btn-primary" style={{ padding: '18px 36px', fontSize: '18px', borderRadius: '100px' }}>
                <Download size={22} />
                Download for Windows
              </a>
              <a href="https://github.com/Jenithpaul/PG-Studio" target="_blank" rel="noopener noreferrer" className="btn btn-secondary" style={{ padding: '18px 36px', fontSize: '18px', borderRadius: '100px' }}>
                View on GitHub
                <ArrowRight size={20} />
              </a>
            </div>
          </motion.div>

          {/* App Preview - Container */}
          <motion.div
            initial={{ opacity: 0, y: 80, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 1, delay: 0.3, ease: [0.22, 1, 0.36, 1] }} // Bezier for smooth "Apple" easing
            style={{
              marginTop: '100px',
              width: '100%',
              maxWidth: '1200px',
              position: 'relative'
            }}
          >
            {/* Browser/App Window Container */}
            <div style={{
                background: '#050505',
                borderRadius: '24px',
                border: '1px solid rgba(255,255,255,0.1)',
                boxShadow: `
                    0 0 0 1px rgba(0,0,0,1),
                    0 50px 100px -20px rgba(0,0,0,0.7),
                    0 0 0 12px rgba(255,255,255,0.02)
                `,
                overflow: 'hidden'
            }}>
                {/* Traffic Lights */}
                <div style={{
                    padding: '16px 24px',
                    borderBottom: '1px solid rgba(255,255,255,0.08)',
                    display: 'flex',
                    alignItems: 'center',
                    background: 'rgba(255,255,255,0.01)'
                }}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#ff5f57' }} />
                        <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#febc2e' }} />
                        <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#28c840' }} />
                    </div>
                </div>

                {/* The Demo */}
                <InteractiveDemo />
            </div>
            
            {/* Ambient Glow behind the window */}
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '90%',
              height: '90%',
              background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.15), rgba(16, 185, 129, 0.15))',
              filter: 'blur(120px)',
              zIndex: -1,
            }} />
          </motion.div>
        </div>
      </div>
    </section>
  );
};
