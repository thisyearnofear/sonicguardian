'use client';

import { useState } from 'react';
import { RecoveryFactors } from './RecoveryFactors';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function HelpModal({ isOpen, onClose }: HelpModalProps) {
  const [activeTab, setActiveTab] = useState<'faq' | 'guide'>('guide');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl max-h-[80vh] overflow-hidden rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--background)] shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-[color:var(--color-border)]">
          <h2 className="text-xl font-bold">How recovery works</h2>
          <button
            type="button"
            onClick={onClose}
            className="touch-target text-[color:var(--color-muted)] hover:text-[color:var(--color-foreground)]"
            aria-label="Close help"
          >
            ✕
          </button>
        </div>

        <div className="flex border-b border-[color:var(--color-border)]">
          <button
            type="button"
            onClick={() => setActiveTab('guide')}
            className={`flex-1 px-6 py-3 text-sm font-medium ${
              activeTab === 'guide'
                ? 'text-[color:var(--color-foreground)] border-b-2 border-[color:var(--color-primary)]'
                : 'text-[color:var(--color-muted)]'
            }`}
          >
            Guide
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('faq')}
            className={`flex-1 px-6 py-3 text-sm font-medium ${
              activeTab === 'faq'
                ? 'text-[color:var(--color-foreground)] border-b-2 border-[color:var(--color-primary)]'
                : 'text-[color:var(--color-muted)]'
            }`}
          >
            FAQ
          </button>
        </div>

        <div className="overflow-y-auto max-h-[calc(80vh-140px)] p-6 space-y-6">
          {activeTab === 'guide' ? (
            <>
              <RecoveryFactors pattern="pending" device="pending" paper="pending" />

              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[color:var(--color-primary)]/15 flex items-center justify-center text-sm font-bold">
                    1
                  </div>
                  <div>
                    <h3 className="font-bold">Create a musical secret</h3>
                    <p className="text-sm text-[color:var(--color-muted)] mt-1">
                      Random phrases are strongest — they are one of three keys, not the whole secret. Hear the clip,
                      then pick yours so you know you can remember it.
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[color:var(--color-primary)]/15 flex items-center justify-center text-sm font-bold">
                    2
                  </div>
                  <div>
                    <h3 className="font-bold">Link the Bitcoin address to protect</h3>
                    <p className="text-sm text-[color:var(--color-muted)] mt-1">
                      Paste it, connect a Bitcoin wallet, or use the demo address. No Bitcoin moves. A Starknet wallet
                      is only needed later, to lock.
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[color:var(--color-primary)]/15 flex items-center justify-center text-sm font-bold">
                    3
                  </div>
                  <div>
                    <h3 className="font-bold">Write down the paper key, then lock</h3>
                    <p className="text-sm text-[color:var(--color-muted)] mt-1">
                      The paper sheet appears once after you pick your clip — before any Starknet transaction. This
                      device keeps the third key. Any two recover you later.
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[color:var(--color-primary)]/15 flex items-center justify-center text-sm font-bold">
                    4
                  </div>
                  <div>
                    <h3 className="font-bold">Recover on this phone or another</h3>
                    <p className="text-sm text-[color:var(--color-muted)] mt-1">
                      Open Recover and use what you just made, or paste the whole card you copied. On a new phone, the
                      paper field is already there.
                    </p>
                  </div>
                </div>
              </div>

              <p className="text-sm text-[color:var(--color-muted)] leading-relaxed">
                Privacy pool is a separate demo, linked in the footer after you lock — not part of recovery.
              </p>
            </>
          ) : (
            <div className="space-y-6">
              <div>
                <h3 className="font-bold mb-2">What do I have to save?</h3>
                <p className="text-sm text-[color:var(--color-muted)]">
                  The musical phrases (in your head) and the paper backup (offline, shown before lock). This device
                  keeps the third key automatically. Any two are enough.
                </p>
              </div>
              <div>
                <h3 className="font-bold mb-2">What if I get a new phone?</h3>
                <p className="text-sm text-[color:var(--color-muted)]">
                  Replay the phrases and paste the paper backup. After that, this new device can hold a local key so
                  you don’t need the paper every time — you’ll see a notice if that happens.
                </p>
              </div>
              <div>
                <h3 className="font-bold mb-2">Does anyone hear or see my music on-chain?</h3>
                <p className="text-sm text-[color:var(--color-muted)]">
                  No. Only a lock that proves you know the secret is stored. The pattern itself stays in the browser.
                </p>
              </div>
              <div>
                <h3 className="font-bold mb-2">Which wallet do I connect?</h3>
                <p className="text-sm text-[color:var(--color-muted)]">
                  Bitcoin wallet (or a pasted address) names what you are protecting. A Starknet wallet appears only
                  when you lock. The privacy pool is a separate demo and needs its own mainnet wallet.
                </p>
              </div>
              <div>
                <h3 className="font-bold mb-2">Can I use this for real funds?</h3>
                <p className="text-sm text-[color:var(--color-muted)]">
                  This is a working demo of the recovery idea. Treat it as a prototype, not a replacement for a
                  production seed-phrase backup.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
