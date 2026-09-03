'use client';

import React from 'react';
import Link from 'next/link';
import { isValidBtcAddress } from '@/lib/crypto';
import { StatusBanner } from './StatusBanner';
import { FlowState } from './FlowState';
import dynamic from 'next/dynamic';

const PrivateRecoveryPanel = dynamic(
  () => import('./PrivateRecoveryPanel').then((m) => m.PrivateRecoveryPanel),
  { ssr: false },
);

const AcousticFactorCard = dynamic(
  () => import('./AcousticFactorCard').then((m) => m.AcousticFactorCard),
  { ssr: false },
);

interface ValidationState {
  isValid: boolean;
  message: string;
  type: 'error' | 'warning' | 'success';
}

export interface VerifyPanelProps {
  btcAddress: string;
  setBtcAddress: (v: string) => void;
  recoveryVibe: string;
  setRecoveryVibe: (v: string) => void;
  isProcessing: boolean;
  validationStates: Map<string, ValidationState>;
  onVerify: () => void;
  status?: string;
  verifiedDnaHash?: string;
}

export function VerifyPanel({
  btcAddress,
  setBtcAddress,
  recoveryVibe,
  setRecoveryVibe,
  isProcessing,
  validationStates,
  onVerify,
  status,
  verifiedDnaHash,
}: VerifyPanelProps) {
  const recoveryValidation = validationStates.get('recovery-phrase');
  const btcValidation = validationStates.get('btc-address');
  const verified = status?.includes('Verified') ?? false;

  if (verified) {
    return (
      <div className="glass rounded-[var(--border-radius)] p-4 sm:p-8 w-full max-w-2xl mx-auto space-y-6">
        <FlowState
          variant="success"
          icon="✅"
          title="Authorship verified"
          description="Your zero-knowledge proof matched the on-chain acoustic public key. Your pattern was never revealed."
        />
        {status && <StatusBanner message={status} />}
        {verifiedDnaHash && btcAddress && (
          <PrivateRecoveryPanel btcAddress={btcAddress} dnaHash={verifiedDnaHash} />
        )}
        {verifiedDnaHash && <AcousticFactorCard dnaHash={verifiedDnaHash} />}
        <div className="pt-2 border-t border-[color:var(--color-border)] text-center space-y-1">
          <Link
            href="/"
            prefetch
            className="text-sm text-[color:var(--color-muted)] hover:text-[color:var(--color-foreground)] transition-colors block"
            data-testid="nav-to-mint"
          >
            ← Back to minting
          </Link>
          <p className="text-xs text-[color:var(--color-muted)]">
            Haven't created an identity yet?{' '}
            <Link href="/" prefetch className="text-[color:var(--color-primary)] hover:underline">
              Create your first Sonic Guardian
            </Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="glass rounded-[var(--border-radius)] p-4 sm:p-8 w-full max-w-2xl mx-auto space-y-6">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight" data-testid="verify-panel-title">
          Prove it&apos;s you
        </h2>
        <p className="text-sm text-[color:var(--color-muted)] mt-2 leading-relaxed">
          Replay your secret to generate a zero-knowledge proof. The contract checks your signature — not your pattern.
        </p>
      </div>

      <div className="p-4 rounded-xl bg-[color:var(--color-primary)]/5 border border-[color:var(--color-primary)]/15">
        <p className="text-xs text-[color:var(--color-muted)] leading-relaxed">
          <strong className="text-[color:var(--color-foreground)]">No audio needed.</strong>{' '}
          Paste the musical chunks you saved at mint time, your vibe phrase, or an IPFS backup CID.
        </p>
      </div>

      <div>
        <label htmlFor="recovery-secret" className="field-label">
          Your recovery secret
        </label>
        {!recoveryVibe.trim() && !btcAddress.trim() ? (
          <FlowState
            variant="empty"
            icon="🔑"
            title="Enter what you saved at mint time"
            description="Paste your musical recovery chunks, vibe phrase, or IPFS backup CID below."
            className="mb-4 py-4"
          />
        ) : null}
        <input
          id="recovery-secret"
          type="text"
          value={recoveryVibe}
          onChange={(e) => setRecoveryVibe(e.target.value)}
          placeholder="sawtooth c2 · sine c4 · … or Qm…"
          className="input-mobile"
          disabled={isProcessing}
          autoComplete="off"
        />
        {recoveryValidation && (
          <p
            className={`text-xs mt-1.5 ${
              recoveryValidation.type === 'error'
                ? 'text-[color:var(--color-error)]'
                : recoveryValidation.type === 'success'
                  ? 'text-[color:var(--color-success)]'
                  : 'text-[color:var(--color-muted)]'
            }`}
          >
            {recoveryValidation.message}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="verify-btc" className="field-label">
          Protected Bitcoin address
        </label>
        <input
          id="verify-btc"
          type="text"
          value={btcAddress}
          onChange={(e) => setBtcAddress(e.target.value)}
          placeholder="bc1q…"
          className="input-mobile font-mono"
          disabled={isProcessing}
          autoComplete="off"
          autoCapitalize="off"
          spellCheck={false}
        />
        {btcValidation && (
          <p
            className={`text-xs mt-1.5 ${
              btcValidation.type === 'error' ? 'text-[color:var(--color-error)]' : 'text-[color:var(--color-muted)]'
            }`}
          >
            {btcValidation.message}
          </p>
        )}
      </div>

      {status && <StatusBanner message={status} />}

      <button
        type="button"
        onClick={onVerify}
        disabled={isProcessing || !recoveryVibe.trim() || !btcAddress.trim() || !isValidBtcAddress(btcAddress)}
        className={`btn-primary py-4 text-sm ${verified ? 'opacity-60' : ''}`}
      >
        {isProcessing ? 'Verifying…' : verified ? 'Verified' : 'Verify authorship'}
        {isProcessing && (
          <span className="w-4 h-4 border-2 border-[color:var(--background)] border-t-transparent rounded-full animate-spin" />
        )}
      </button>

      <div className="pt-4 border-t border-[color:var(--color-border)] text-center">
        <Link
          href="/"
          prefetch
          className="text-sm text-[color:var(--color-muted)] hover:text-[color:var(--color-foreground)] transition-colors"
          data-testid="nav-to-mint"
        >
          ← Back to minting
        </Link>
      </div>
    </div>
  );
}
