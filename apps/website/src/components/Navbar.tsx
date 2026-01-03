import { motion } from 'framer-motion';
import { Github, Menu, X } from 'lucide-react';
import { useState } from 'react';

export const Navbar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav style={{
      position: 'fixed',
      top: 0,
      width: '100%',
      zIndex: 1000,
      background: 'rgba(10, 10, 10, 0.8)',
      backdropFilter: 'blur(20px)',
      borderBottom: '1px solid var(--border-subtle)'
    }}>
      <div className="container" style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        height: '72px'
      }}>
        {/* Logo */}
        <a href="#" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <img 
            src="/logo.png" 
            alt="PG Studio" 
            style={{ 
              height: '40px', 
              width: 'auto',
              filter: 'drop-shadow(0 2px 8px rgba(16, 185, 129, 0.2))'
            }} 
          />
        </a>

        {/* Desktop Navigation */}
        <div style={{ 
          display: 'flex', 
          gap: '8px', 
          alignItems: 'center'
        }} className="desktop-nav">
          <a href="#features" className="btn btn-ghost">Features</a>
          <a href="#workflow" className="btn btn-ghost">How it Works</a>
          <a href="#contribute" className="btn btn-ghost">Contribute</a>
          <div style={{ width: '1px', height: '24px', background: 'var(--border-primary)', margin: '0 8px' }} />
          <a 
            href="https://github.com/Jenithpaul/PG-Studio" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="btn btn-secondary"
            style={{ padding: '10px 20px' }}
          >
            <Github size={18} />
            <span>Star on GitHub</span>
          </a>
        </div>

        {/* Mobile Menu Button */}
        <button 
          className="mobile-menu-btn"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          style={{ display: 'none' }}
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            position: 'absolute',
            top: '72px',
            left: 0,
            right: 0,
            background: 'var(--bg-secondary)',
            borderBottom: '1px solid var(--border-primary)',
            padding: '20px'
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <a href="#features" className="btn btn-ghost">Features</a>
            <a href="#workflow" className="btn btn-ghost">How it Works</a>
            <a href="#contribute" className="btn btn-ghost">Contribute</a>
            <a 
              href="https://github.com/Jenithpaul/PG-Studio" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="btn btn-secondary"
            >
              <Github size={18} />
              Star on GitHub
            </a>
          </div>
        </motion.div>
      )}

      <style>{`
        @media (max-width: 768px) {
          .desktop-nav { display: none !important; }
          .mobile-menu-btn { display: flex !important; }
        }
      `}</style>
    </nav>
  );
};
