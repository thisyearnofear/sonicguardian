'use client';

import { useState, useEffect } from 'react';

interface WelcomeModalProps {
  onClose: () => void;
}

export function WelcomeModal({ onClose }: WelcomeModalProps) {
  const [step, setStep] = useState(0);

  const steps = [
    {
      title: "Welcome to Sonic Guardian 🎵",
      content: "Create a unique sonic identity using live-coded musical patterns. Your vibe becomes your on-chain signature.",
      emoji: "🔐"
    },
    {
      title: "How It Works",
      content: "Generate a musical pattern → Commit to Starknet → Verify your identity anytime by replaying your sound. Privacy-preserving with zero-knowledge proofs.",
      emoji: "⚡"
    },
    {
      title: "Ready to Start?",
      content: "Choose 'Secure Generation' for a random pattern, or enter your own vibe. Your musical DNA will be cryptographically unique and verifiably yours.",
      emoji: "🚀"
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="relative w-full max-w-md rounded-2xl border border-[color:var(--color-primary)]/30 bg-[color:var(--color-bg)] shadow-2xl p-8 text-center space-y-6">
        <div className="text-6xl">{steps[step].emoji}</div>
        
        <div className="space-y-3">
          <h2 className="text-2xl font-bold text-[color:var(--color-primary)]">
            {steps[step].title}
          </h2>
          <p className="text-sm text-[color:var(--color-muted)] leading-relaxed">
            {steps[step].content}
          </p>
        </div>

        <div className="flex gap-2 justify-center">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all ${
                i === step
                  ? 'w-8 bg-[color:var(--color-primary)]'
                  : 'w-1.5 bg-[color:var(--color-primary)]/30'
              }`}
            />
          ))}
        </div>

        <div className="flex gap-3">
          {step > 0 && (
            <button
              onClick={() => setStep(step - 1)}
              className="flex-1 py-3 rounded-xl border border-[color:var(--color-primary)]/30 text-[color:var(--color-muted)] hover:text-[color:var(--color-primary)] hover:border-[color:var(--color-primary)] transition-all text-sm font-medium"
            >
              Back
            </button>
          )}
          <button
            onClick={() => {
              if (step < steps.length - 1) {
                setStep(step + 1);
              } else {
                onClose();
              }
            }}
            className="flex-1 py-3 rounded-xl bg-[color:var(--color-primary)] text-black hover:opacity-90 transition-opacity text-sm font-bold"
          >
            {step < steps.length - 1 ? 'Next' : 'Get Started'}
          </button>
        </div>

        <button
          onClick={onClose}
          className="text-xs text-[color:var(--color-muted)] hover:text-[color:var(--color-primary)] transition-colors"
        >
          Skip tutorial
        </button>
      </div>
    </div>
  );
}
