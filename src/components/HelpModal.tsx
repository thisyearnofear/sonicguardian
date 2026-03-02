'use client';

import { useState } from 'react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function HelpModal({ isOpen, onClose }: HelpModalProps) {
  const [activeTab, setActiveTab] = useState<'faq' | 'guide'>('guide');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl max-h-[80vh] overflow-hidden rounded-2xl border border-[color:var(--color-primary)]/30 bg-[color:var(--color-bg)] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[color:var(--color-primary)]/20">
          <h2 className="text-xl font-bold text-[color:var(--color-primary)]">Help & Guide</h2>
          <button
            onClick={onClose}
            className="text-[color:var(--color-muted)] hover:text-[color:var(--color-primary)] transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[color:var(--color-primary)]/20">
          <button
            onClick={() => setActiveTab('guide')}
            className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === 'guide'
                ? 'text-[color:var(--color-primary)] border-b-2 border-[color:var(--color-primary)]'
                : 'text-[color:var(--color-muted)] hover:text-[color:var(--color-primary)]'
            }`}
          >
            Quick Start
          </button>
          <button
            onClick={() => setActiveTab('faq')}
            className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === 'faq'
                ? 'text-[color:var(--color-primary)] border-b-2 border-[color:var(--color-primary)]'
                : 'text-[color:var(--color-muted)] hover:text-[color:var(--color-primary)]'
            }`}
          >
            FAQ
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(80vh-140px)] p-6 space-y-6">
          {activeTab === 'guide' ? (
            <>
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-[color:var(--color-primary)]">How It Works</h3>
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[color:var(--color-primary)]/20 flex items-center justify-center text-[color:var(--color-primary)] font-bold">1</div>
                    <div>
                      <h4 className="font-bold text-[color:var(--color-text)]">Generate Musical DNA</h4>
                      <p className="text-sm text-[color:var(--color-muted)] mt-1">
                        Enter a vibe or use secure generation. AI creates a unique Strudel pattern that becomes your cryptographic signature.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[color:var(--color-primary)]/20 flex items-center justify-center text-[color:var(--color-primary)] font-bold">2</div>
                    <div>
                      <h4 className="font-bold text-[color:var(--color-text)]">Anchor to Starknet</h4>
                      <p className="text-sm text-[color:var(--color-muted)] mt-1">
                        Connect wallet, enter your Bitcoin address, and commit. Only a Pedersen commitment is stored on-chain (privacy preserved).
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[color:var(--color-primary)]/20 flex items-center justify-center text-[color:var(--color-primary)] font-bold">3</div>
                    <div>
                      <h4 className="font-bold text-[color:var(--color-text)]">Recover Anytime</h4>
                      <p className="text-sm text-[color:var(--color-muted)] mt-1">
                        Switch to Recovery mode, replay your musical pattern, and prove ownership without revealing your secret.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[color:var(--color-accent)]/10 border border-[color:var(--color-accent)]/20">
                <p className="text-xs text-[color:var(--color-muted)]">
                  💡 <strong>Tip:</strong> Save your musical chunks! They're like a BIP39 seed phrase but way more memorable.
                </p>
              </div>
            </>
          ) : (
            <div className="space-y-6">
              <div>
                <h4 className="font-bold text-[color:var(--color-primary)] mb-2">What is Musical DNA?</h4>
                <p className="text-sm text-[color:var(--color-muted)]">
                  Your musical pattern is converted to a SHA-256 hash (256-bit entropy). This "DNA" is deterministic—same pattern always produces the same hash.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-[color:var(--color-primary)] mb-2">What is a Pedersen Commitment?</h4>
                <p className="text-sm text-[color:var(--color-muted)]">
                  A cryptographic commitment that hides your DNA hash using a blinding factor. You can later prove you know the secret without revealing it (zero-knowledge).
                </p>
              </div>

              <div>
                <h4 className="font-bold text-[color:var(--color-primary)] mb-2">Is my data private?</h4>
                <p className="text-sm text-[color:var(--color-muted)]">
                  Yes! Only the commitment is stored on-chain. Your musical pattern, DNA hash, and blinding factor stay client-side. No one can reverse-engineer your secret.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-[color:var(--color-primary)] mb-2">What if I forget my pattern?</h4>
                <p className="text-sm text-[color:var(--color-muted)]">
                  Save your musical chunks (the text descriptions). You can reconstruct the pattern from them using the entropy decoder.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-[color:var(--color-primary)] mb-2">Why Strudel?</h4>
                <p className="text-sm text-[color:var(--color-muted)]">
                  Strudel is a live-coding language for music. It's deterministic (same code = same sound) and human-readable, making it perfect for memorable cryptographic keys.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-[color:var(--color-primary)] mb-2">Can I use this for real Bitcoin?</h4>
                <p className="text-sm text-[color:var(--color-muted)]">
                  This is a proof-of-concept for the hackathon. For production use, integrate with actual Bitcoin recovery mechanisms and audit the cryptography.
                </p>
              </div>

              <div className="pt-4 border-t border-[color:var(--color-primary)]/20">
                <a
                  href="https://github.com/thisyearnofear/sonicguardian"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-[color:var(--color-accent)] hover:underline"
                >
                  📚 Read full documentation →
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
