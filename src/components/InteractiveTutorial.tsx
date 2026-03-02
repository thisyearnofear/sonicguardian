'use client';

import React, { useState, useEffect } from 'react';
import { Tooltip } from './Tooltip';

interface TutorialStep {
  id: string;
  title: string;
  description: string;
  elementId?: string;
  highlightSelector?: string;
  tooltipPosition?: 'top' | 'bottom' | 'left' | 'right';
  nextButtonText?: string;
  skipable?: boolean;
}

interface InteractiveTutorialProps {
  isOpen: boolean;
  onClose: () => void;
}

const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to Sonic Guardian!',
    description: 'This interactive tutorial will guide you through creating your first musical Bitcoin guardian. Let\'s start by understanding the interface.',
    nextButtonText: 'Let\'s Begin',
    skipable: true
  },
  {
    id: 'visualizer',
    title: 'The Sonic Visualizer',
    description: 'This is your acoustic DNA visualizer. It shows the particles and patterns that represent your musical guardian.',
    elementId: 'visualizer-container',
    tooltipPosition: 'bottom',
    nextButtonText: 'Next'
  },
  {
    id: 'bitcoin-address',
    title: 'Your Bitcoin Address',
    description: 'Enter the Bitcoin address you want to protect. This address will be anchored to Starknet using your musical pattern.',
    elementId: 'btc-address-input',
    tooltipPosition: 'top',
    nextButtonText: 'Got it'
  },
  {
    id: 'secure-generation',
    title: 'Secure Pattern Generation',
    description: 'We use cryptographically secure 256-bit entropy to generate your musical pattern. This ensures maximum security.',
    elementId: 'secure-mode-toggle',
    tooltipPosition: 'right',
    nextButtonText: 'Continue'
  },
  {
    id: 'generate-button',
    title: 'Generate Your Guardian',
    description: 'Click this button to create your unique musical pattern. The system will generate a pattern and extract its DNA hash.',
    elementId: 'generate-button',
    tooltipPosition: 'top',
    nextButtonText: 'Generate'
  },
  {
    id: 'musical-chunks',
    title: 'Your Musical Chunks',
    description: 'Your pattern is broken down into memorable chunks. Memorize these - they\'re your recovery key!',
    elementId: 'musical-chunks-display',
    tooltipPosition: 'bottom',
    nextButtonText: 'Next'
  },
  {
    id: 'anchor-to-starknet',
    title: 'Anchor to Starknet',
    description: 'This anchors your musical DNA to the blockchain using Pedersen commitments. Your pattern is now cryptographically secured.',
    elementId: 'anchor-button',
    tooltipPosition: 'top',
    nextButtonText: 'Anchor'
  },
  {
    id: 'pattern-library',
    title: 'Explore Patterns',
    description: 'Browse our pattern library to understand different musical styles and techniques you can use.',
    elementId: 'pattern-library',
    tooltipPosition: 'bottom',
    nextButtonText: 'Explore'
  },
  {
    id: 'strudel-editor',
    title: 'Live Code Editor',
    description: 'This is a live Strudel code editor. You can modify your pattern in real-time and hear the changes instantly.',
    elementId: 'strudel-editor',
    tooltipPosition: 'top',
    nextButtonText: 'Try it'
  },
  {
    id: 'completion',
    title: 'Congratulations!',
    description: 'You\'ve successfully created your first Sonic Guardian! Your Bitcoin is now protected by your unique musical pattern.',
    nextButtonText: 'Finish Tutorial',
    skipable: false
  }
];

export function InteractiveTutorial({ isOpen, onClose }: InteractiveTutorialProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [highlightedElement, setHighlightedElement] = useState<HTMLElement | null>(null);

  const currentStep = TUTORIAL_STEPS[currentStepIndex];

  useEffect(() => {
    if (isOpen && currentStep.highlightSelector) {
      const element = document.querySelector(currentStep.highlightSelector) as HTMLElement;
      if (element) {
        setHighlightedElement(element);
        // Scroll to element
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [currentStepIndex, isOpen]);

  const handleNext = () => {
    if (currentStepIndex < TUTORIAL_STEPS.length - 1) {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentStepIndex(currentStepIndex + 1);
        setIsAnimating(false);
      }, 300);
    } else {
      handleClose();
    }
  };

  const handlePrevious = () => {
    if (currentStepIndex > 0) {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentStepIndex(currentStepIndex - 1);
        setIsAnimating(false);
      }, 300);
    }
  };

  const handleClose = () => {
    setHighlightedElement(null);
    setCurrentStepIndex(0);
    onClose();
  };

  const handleSkip = () => {
    if (currentStep.skipable) {
      handleClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] pointer-events-none">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm pointer-events-auto"
        onClick={handleClose}
      />

      {/* Highlight Overlay */}
      {highlightedElement && (
        <div className="absolute inset-0 pointer-events-none">
          <div 
            className="absolute border-4 border-[color:var(--color-primary)] rounded-xl shadow-[0_0_30px_rgba(var(--color-primary-rgb),0.5)] animate-pulse"
            style={{
              top: highlightedElement.offsetTop,
              left: highlightedElement.offsetLeft,
              width: highlightedElement.offsetWidth,
              height: highlightedElement.offsetHeight,
              zIndex: 999
            }}
          />
        </div>
      )}

      {/* Tutorial Modal */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-md mx-4 pointer-events-auto">
        <div className="glass rounded-2xl p-6 border border-[color:var(--color-primary)]/30 shadow-2xl">
          {/* Progress Indicator */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-[color:var(--color-primary)] rounded-full animate-pulse" />
              <span className="text-xs font-bold text-[color:var(--color-primary)] uppercase tracking-widest">
                Tutorial
              </span>
            </div>
            <div className="text-[10px] text-[color:var(--color-muted)] font-mono">
              Step {currentStepIndex + 1} of {TUTORIAL_STEPS.length}
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-[color:var(--color-border)] rounded-full h-1 mb-6">
            <div 
              className="bg-[color:var(--color-primary)] h-1 rounded-full transition-all duration-300"
              style={{ width: `${((currentStepIndex + 1) / TUTORIAL_STEPS.length) * 100}%` }}
            />
          </div>

          {/* Content */}
          <div className={`space-y-4 ${isAnimating ? 'animate-fade-out' : 'animate-fade-in'}`}>
            <h3 className="text-lg font-bold text-[color:var(--color-foreground)]">
              {currentStep.title}
            </h3>
            <p className="text-sm text-[color:var(--color-muted)] leading-relaxed">
              {currentStep.description}
            </p>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4 border-t border-[color:var(--color-border)]">
              {currentStepIndex > 0 && (
                <button
                  onClick={handlePrevious}
                  className="flex-1 py-2 px-4 rounded-lg border border-[color:var(--color-border)] text-[color:var(--color-muted)] font-bold text-xs uppercase tracking-widest hover:border-[color:var(--color-primary)] hover:text-[color:var(--color-primary)] transition-all"
                >
                  ← Back
                </button>
              )}
              
              <button
                onClick={handleNext}
                className="flex-1 py-2 px-4 rounded-lg bg-[color:var(--color-primary)] text-white font-bold text-xs uppercase tracking-widest hover:scale-[1.02] transition-all"
              >
                {currentStep.nextButtonText || 'Next'} →
              </button>
            </div>

            {/* Skip Option */}
            {currentStep.skipable && (
              <div className="text-center pt-2">
                <button
                  onClick={handleSkip}
                  className="text-[10px] text-[color:var(--color-muted)] hover:text-[color:var(--color-primary)] font-bold uppercase tracking-widest underline"
                >
                  Skip Tutorial
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Floating Help Button */}
      <div className="fixed bottom-8 left-8 z-50">
        <button
          onClick={handleClose}
          className="glass px-4 py-2 rounded-full font-bold text-xs tracking-widest uppercase transition-all hover:scale-105"
        >
          ✕ Exit Tutorial
        </button>
      </div>
    </div>
  );
}

export function TutorialTrigger({ onTrigger }: { onTrigger: () => void }) {
  return (
    <Tooltip text="Start Interactive Tutorial" position="left">
      <button
        onClick={onTrigger}
        className="fixed bottom-8 left-8 z-50 glass px-4 py-2 rounded-full font-bold text-xs tracking-widest uppercase transition-all hover:scale-105 hover:border-[color:var(--color-primary)]/50 border border-[color:var(--color-border)]"
      >
        🎓 Tutorial
      </button>
    </Tooltip>
  );
}