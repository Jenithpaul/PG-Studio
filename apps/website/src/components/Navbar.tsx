import { motion, AnimatePresence } from 'framer-motion';
import { Github, Menu, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import logoImg from '../assets/logo.png';

export const Navbar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      <motion.nav
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="floating-nav-container">
        <div style={{
          width: '100%',
          background: scrolled ? 'rgba(10, 10, 10, 0.8)' : 'rgba(20, 20, 20, 0.4)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '100px',
          padding: '12px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: scrolled ? '0 10px 30px -10px rgba(0,0,0,0.5)' : 'none',
          transition: 'all 0.3s ease'
        }}>
          {/* Logo */}
          <a href="#" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <img 
              src={logoImg}
              alt="PG Studio" 
              style={{ 
                height: '32px', 
                width: 'auto',
                filter: 'drop-shadow(0 0 10px rgba(16, 185, 129, 0.3))'
              }} 
            />
            <span style={{ fontWeight: 700, fontSize: '18px', letterSpacing: '-0.02em' }}>PG Studio</span>
          </a>

          {/* Desktop Navigation */}
          <div className="desktop-nav" style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
            {['Features', 'Workflow', 'Contribute'].map((item) => (
              <a 
                key={item}
                href={`#${item.toLowerCase()}`}
                className="btn btn-ghost"
                style={{ fontSize: '14px', borderRadius: '100px' }}
              >
                {item}
              </a>
            ))}
            
            <div style={{ width: '1px', height: '20px', background: 'rgba(255,255,255,0.1)', margin: '0 12px' }} />
            
            <a 
              href="https://github.com/Jenithpaul/PG-Studio" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="btn btn-primary"
              style={{ padding: '8px 20px', fontSize: '14px' }}
            >
              <Github size={16} />
              <span>Star</span>
            </a>
          </div>

          {/* Mobile Menu Button */}
          <button 
            className="mobile-menu-btn"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            style={{ display: 'none', color: 'white' }}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>
      </motion.nav>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            style={{
              position: 'fixed',
              top: '90px',
              left: '5%',
              width: '90%',
              background: '#1a1a1a',
              border: '1px solid var(--border-primary)',
              borderRadius: '24px',
              padding: '24px',
              zIndex: 999,
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              boxShadow: '0 20px 50px rgba(0,0,0,0.5)'
            }}
          >
            {['Features', 'Workflow', 'Contribute'].map((item) => (
              <a 
                key={item}
                href={`#${item.toLowerCase()}`}
                onClick={() => setMobileMenuOpen(false)}
                style={{ 
                  fontSize: '18px', 
                  fontWeight: 500, 
                  padding: '12px',
                  borderRadius: '12px',
                  background: 'rgba(255,255,255,0.03)'
                }}
              >
                {item}
              </a>
            ))}
            <a 
              href="https://github.com/Jenithpaul/PG-Studio" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="btn btn-primary"
              style={{ justifyContent: 'center', width: '100%' }}
            >
              <Github size={20} />
              Star on GitHub
            </a>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        @media (max-width: 768px) {
          .desktop-nav { display: none !important; }
          .mobile-menu-btn { display: flex !important; }
        }
      `}</style>
    </>
  );
};
