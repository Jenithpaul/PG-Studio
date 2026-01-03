import React, { useState } from 'react';
import { useUser } from '../contexts/UserContext';
import { useTheme } from '../contexts/ThemeContext';
import './Onboarding.css';

export const Onboarding: React.FC = () => {
  const { completeOnboarding } = useUser();
  const { theme, toggleTheme } = useTheme();
  const [step, setStep] = useState<1 | 2>(1);
  const [name, setName] = useState('');

  const handleNext = () => {
    if (step === 1 && name.trim()) {
      setStep(2);
    } else if (step === 2) {
      completeOnboarding(name);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleNext();
    }
  };

  return (
    <div className="onboarding-container">
      <div className="onboarding-card">
        {/* Progress Dots */}
        <div className="step-indicators">
          <div className={`step-dot ${step >= 1 ? 'active' : ''}`} />
          <div className={`step-dot ${step >= 2 ? 'active' : ''}`} />
        </div>

        {step === 1 ? (
          <div className="step-content fade-in">
            <h1 className="onboarding-title">Welcome to PG Studio</h1>
            <p className="onboarding-subtitle">Let's get to know you. What's your name?</p>
            
            <input
              type="text"
              className="onboarding-input"
              placeholder="Enter your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={handleKeyDown}
              autoFocus
            />
          </div>
        ) : (
          <div className="step-content fade-in">
            <h1 className="onboarding-title">Choose your Vibe</h1>
            <p className="onboarding-subtitle">Select a theme that suits your style.</p>

            <div className="theme-selector">
              <button 
                className={`theme-option ${theme === 'light' ? 'selected' : ''}`}
                onClick={() => theme === 'dark' && toggleTheme()}
              >
                <div className="theme-preview light">
                  <div className="preview-header"></div>
                  <div className="preview-body">
                    <div className="preview-line"></div>
                    <div className="preview-line short"></div>
                  </div>
                </div>
                <span>Light</span>
              </button>

              <button 
                className={`theme-option ${theme === 'dark' ? 'selected' : ''}`}
                onClick={() => theme === 'light' && toggleTheme()}
              >
                <div className="theme-preview dark">
                  <div className="preview-header"></div>
                  <div className="preview-body">
                    <div className="preview-line"></div>
                    <div className="preview-line short"></div>
                  </div>
                </div>
                <span>Dark</span>
              </button>
            </div>
          </div>
        )}

        <button 
          className="onboarding-btn" 
          onClick={handleNext}
          disabled={step === 1 && !name.trim()}
        >
          {step === 1 ? 'Next' : 'Get Started'}
        </button>
      </div>
    </div>
  );
};
