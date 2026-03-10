'use client';

import React from 'react';

export const INFERENCE_STEPS = [
  {
    label: 'Understanding your musical description',
    description: 'Analyzing vibe keywords and musical intent',
  },
  {
    label: 'Generating Strudel pattern via Venice AI',
    description: 'Translating your vibe into live code',
  },
  {
    label: 'Validating syntax & structure',
    description: 'Ensuring the pattern is playable',
  },
  {
    label: 'Ready to play your sonic signature',
    description: 'Pattern is ready for playback',
  },
];

interface InferenceExplainerProps {
  isVisible: boolean;
  currentStep: number;
}

export function InferenceExplainer({ isVisible, currentStep }: InferenceExplainerProps) {
  if (!isVisible) return null;

  return (
    <div className="mt-4 p-4 glass rounded-xl border border-[color:var(--color-primary)]/20 animate-in fade-in slide-in-from-top-2 duration-300">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg">🤖</span>
        <span className="text-[10px] font-bold uppercase tracking-widest text-[color:var(--color-primary)]">
          Venice AI is synthesizing your vibe...
        </span>
      </div>

      <div className="space-y-2">
        {INFERENCE_STEPS.map((step, index) => (
          <div
            key={index}
            className={`flex items-center gap-3 transition-all duration-300 ${
              index <= currentStep ? 'opacity-100' : 'opacity-30'
            }`}
          >
            <div className="flex-shrink-0">
              {index < currentStep ? (
                <span className="flex items-center justify-center w-4 h-4 rounded-full bg-[color:var(--color-success)]/20 text-[color:var(--color-success)] text-[8px]">
                  ✓
                </span>
              ) : index === currentStep ? (
                <span className="flex items-center justify-center w-4 h-4">
                  <span className="w-2 h-2 bg-[color:var(--color-primary)] rounded-full animate-pulse" />
                </span>
              ) : (
                <span className="flex items-center justify-center w-4 h-4 rounded-full border border-[color:var(--color-muted)]/30 text-[8px] text-[color:var(--color-muted)]">
                  ○
                </span>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <p className={`text-[9px] font-medium ${
                index === currentStep
                  ? 'text-[color:var(--color-primary)]'
                  : index < currentStep
                  ? 'text-[color:var(--color-success)]'
                  : 'text-[color:var(--color-muted)]'
              }`}>
                {step.label}
              </p>
              {index === currentStep && (
                <p className="text-[8px] text-[color:var(--color-muted)] mt-0.5">
                  {step.description}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Progress Bar */}
      <div className="mt-3 h-0.5 bg-[color:var(--color-border)] rounded-full overflow-hidden">
        <div
          className="h-full bg-[color:var(--color-primary)] transition-all duration-500 ease-out"
          style={{ width: `${((currentStep + 1) / INFERENCE_STEPS.length) * 100}%` }}
        />
      </div>
    </div>
  );
}
