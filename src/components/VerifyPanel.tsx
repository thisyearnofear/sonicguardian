'use client';

import Link from 'next/link';
import { isValidBtcAddress } from '@/lib/crypto';
import { StatusBanner } from './StatusBanner';
import { FlowState } from './FlowState';
import { RecoveryFactors } from './RecoveryFactors';
import { PromotedShareNotice } from './PromotedShareNotice';
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
  awaitingSecondFactor?: boolean;
  decoupled?: boolean;
  acousticSecret?: string | null;
  onAcousticSecret?: (secret: string | null) => void;
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
  awaitingSecondFactor,
  decoupled,
  acousticSecret,
  onAcousticSecret,
}: VerifyPanelProps) {
  const recoveryValidation = validationStates.get('recovery-phrase');
  const btcValidation = validationStates.get('btc-address');
  const verified = status?.includes('Verified') ?? false;

  if (verifiedDnaHash && awaitingSecondFactor && !verified) {
    return (
      <div className="glass rounded-[var(--border-radius)] p-4 sm:p-8 w-full max-w-2xl mx-auto space-y-6">
        <FlowState
          variant="empty"
          icon="♩"
          title="One more key"
          description="You remembered the music. This phone doesn’t have a saved copy, so enter the paper backup you wrote down."
        />
        <RecoveryFactors pattern="ready" device="missing" paper="needed" />
        {status && <StatusBanner message={status} />}
        <AcousticFactorCard
          dnaHash={verifiedDnaHash}
          btcAddress={btcAddress}
          onResolved={onAcousticSecret}
        />
        <PromotedShareNotice />
        <div className="pt-2 border-t border-[color:var(--color-border)] text-center">
          <Link
            href="/"
            prefetch
            className="text-sm text-[color:var(--color-muted)] hover:text-[color:var(--color-foreground)] transition-colors block"
            data-testid="nav-to-mint"
          >
            ← Back to create
          </Link>
        </div>
      </div>
    );
  }

  if (verified) {
    return (
      <div className="glass rounded-[var(--border-radius)] p-4 sm:p-8 w-full max-w-2xl mx-auto space-y-6">
        <FlowState
          variant="success"
          icon="♩"
          title="You’re back"
          description="Recovery matched. Your pattern was never revealed on-chain."
        />
        <RecoveryFactors
          pattern="ready"
          device={acousticSecret || !decoupled ? 'ready' : 'pending'}
          paper={acousticSecret && decoupled ? 'ready' : 'pending'}
        />
        {status && <StatusBanner message={status} />}
        <PromotedShareNotice />
        {verifiedDnaHash && btcAddress && (
          <details className="rounded-xl border border-[color:var(--color-border)]">
            <summary className="cursor-pointer px-4 py-3 text-sm font-semibold">
              Authorize privately (optional)
            </summary>
            <div className="px-4 pb-4">
              <PrivateRecoveryPanel
                btcAddress={btcAddress}
                dnaHash={verifiedDnaHash}
                acousticSecret={acousticSecret}
              />
            </div>
          </details>
        )}
        {verifiedDnaHash && decoupled && !acousticSecret && (
          <AcousticFactorCard
            dnaHash={verifiedDnaHash}
            btcAddress={btcAddress}
            onResolved={onAcousticSecret}
          />
        )}
        <div className="pt-2 border-t border-[color:var(--color-border)] text-center">
          <Link
            href="/"
            prefetch
            className="text-sm text-[color:var(--color-muted)] hover:text-[color:var(--color-foreground)] transition-colors block"
            data-testid="nav-to-mint"
          >
            ← Back to create
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="glass rounded-[var(--border-radius)] p-4 sm:p-8 w-full max-w-2xl mx-auto space-y-6">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight" data-testid="verify-panel-title">
          Recover with what you have
        </h2>
        <p className="text-sm text-[color:var(--color-muted)] mt-2 leading-relaxed">
          Paste the phrases you remembered. Any two keys — the music, this device, or paper — are enough.
        </p>
      </div>

      <RecoveryFactors
        pattern={recoveryVibe.trim() ? 'ready' : 'needed'}
        device="pending"
        paper="pending"
      />

      <div>
        <label htmlFor="recovery-secret" className="field-label">
          The phrases you remember
        </label>
        <input
          id="recovery-secret"
          type="text"
          value={recoveryVibe}
          onChange={(e) => setRecoveryVibe(e.target.value)}
          placeholder="sawtooth c2 · sine c4 · …"
          className="input-mobile"
          disabled={isProcessing}
          autoComplete="off"
        />
        {recoveryVibe.trim() && recoveryValidation && (
          <p
            className={`text-sm mt-1.5 ${
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
        {btcAddress.trim() && btcValidation && (
          <p
            className={`text-sm mt-1.5 ${
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
        className="btn-primary py-4 text-sm"
      >
        {isProcessing ? 'Checking…' : 'Recover'}
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
          ← Back to create
        </Link>
      </div>
    </div>
  );
}
