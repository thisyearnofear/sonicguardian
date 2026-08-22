'use client';

import React from 'react';

interface WelcomeModalProps {
  onClose: () => void;
  onStart?: () => void;
}

export function WelcomeModal({ onClose, onStart }: WelcomeModalProps) {
  const handleStart = () => {
    onStart?.();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="welcome-title"
        className="relative w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--background)] shadow-2xl p-6 sm:p-8 space-y-6"
        style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}
      >
        <div className="w-10 h-1 rounded-full bg-[color:var(--color-border)] mx-auto sm:hidden" />

        <div className="text-center space-y-4">
          <div className="flow-state-icon mx-auto text-4xl" aria-hidden>
            🎵
          </div>
          <div className="space-y-2">
            <h2 id="welcome-title" className="text-xl font-bold tracking-tight">
              Start with a secret only you know
            </h2>
            <p className="text-sm text-[color:var(--color-muted)] leading-relaxed">
              Your sonic identity is built from a musical pattern. We recommend{' '}
              <strong className="text-[color:var(--color-foreground)]">Random pattern</strong> — you&apos;ll
              get recovery chunks to write down, then link a Bitcoin address and commit on Starknet.
            </p>
          </div>
        </div>

        <ol className="text-left text-xs text-[color:var(--color-muted)] space-y-2 pl-4 list-decimal max-w-xs mx-auto">
          <li>Pick how to create your secret</li>
          <li>Link a Bitcoin address (demo OK)</li>
          <li>Generate and commit — pattern stays private</li>
        </ol>

        <button
          type="button"
          onClick={handleStart}
          className="btn-primary py-3.5 text-sm"
          data-testid="welcome-get-started"
        >
          Choose my secret
        </button>

        <button
          type="button"
          onClick={onClose}
          className="w-full text-xs text-[color:var(--color-muted)] hover:text-[color:var(--color-foreground)]"
        >
          Skip — I know the flow
        </button>
      </div>
    </div>
  );
}
