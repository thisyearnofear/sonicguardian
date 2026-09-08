'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { isValidBtcAddress } from '@/lib/crypto';
import { readRehearsal, type RehearsalDraft } from '@/lib/rehearsal';
import { StatusBanner } from './StatusBanner';
import { FlowState } from './FlowState';
import { RecoveryFactors } from './RecoveryFactors';
import { PromotedShareNotice } from './PromotedShareNotice';
import { BTC_ADDRESS_EVENT } from './ConnectWalletModal';
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

export type RecoveryPair = 'music' | 'music+device' | 'music+paper';

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
  hasDeviceShare?: boolean;
  paperShareInput?: string;
  setPaperShareInput?: (v: string) => void;
  recoveryPair?: RecoveryPair | null;
}

function pairCopy(pair: RecoveryPair | null | undefined): string {
  if (pair === 'music+device') return 'The music plus this device unlocked you.';
  if (pair === 'music+paper') return 'The music plus your paper backup unlocked you.';
  if (pair === 'music') return 'The music unlocked you.';
  return 'Recovery matched. Your pattern was never revealed on-chain.';
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
  hasDeviceShare = true,
  paperShareInput = '',
  setPaperShareInput,
  recoveryPair,
}: VerifyPanelProps) {
  const recoveryValidation = validationStates.get('recovery-phrase');
  const btcValidation = validationStates.get('btc-address');
  const verified = status?.includes('Verified') ?? false;
  const [rehearsal, setRehearsal] = useState<RehearsalDraft | null>(null);

  useEffect(() => {
    setRehearsal(readRehearsal());
  }, []);

  useEffect(() => {
    const onBtc = (event: Event) => {
      const address = (event as CustomEvent<{ address?: string }>).detail?.address;
      if (address) setBtcAddress(address);
    };
    window.addEventListener(BTC_ADDRESS_EVENT, onBtc);
    return () => window.removeEventListener(BTC_ADDRESS_EVENT, onBtc);
  }, [setBtcAddress]);

  const useRehearsal = () => {
    if (!rehearsal) return;
    setRecoveryVibe(rehearsal.phrases);
    setBtcAddress(rehearsal.btcAddress);
  };

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
          description={pairCopy(recoveryPair)}
        />
        <RecoveryFactors
          pattern="ready"
          device={recoveryPair === 'music+device' || !decoupled ? 'ready' : 'pending'}
          paper={recoveryPair === 'music+paper' ? 'ready' : 'pending'}
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
        <details className="text-sm text-[color:var(--color-muted)]">
          <summary className="cursor-pointer font-medium">More options</summary>
          <div className="mt-3">
            <Link href="/pool" prefetch className="min-h-11 py-2 rounded-lg border border-[color:var(--color-border)] text-sm font-semibold text-center block">
              Privacy pool demo
            </Link>
          </div>
        </details>
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
          {hasDeviceShare
            ? 'Paste the card you copied. This device already holds one key.'
            : 'This looks like a new phone. Paste the card you copied and the paper backup you wrote down.'}
        </p>
      </div>

      {rehearsal && (
        <button
          type="button"
          onClick={useRehearsal}
          className="w-full min-h-11 py-3 rounded-xl border border-[color:var(--color-primary)]/30 bg-[color:var(--color-primary)]/8 text-sm font-semibold text-[color:var(--color-primary)]"
          data-testid="use-rehearsal"
        >
          Use what you just made
        </button>
      )}

      <RecoveryFactors
        pattern={recoveryVibe.trim() ? 'ready' : 'needed'}
        device={hasDeviceShare ? 'ready' : 'missing'}
        paper={!hasDeviceShare && paperShareInput.trim() ? 'ready' : !hasDeviceShare ? 'needed' : 'pending'}
      />

      <div>
        <label htmlFor="recovery-secret" className="field-label">
          Recovery card
        </label>
        <textarea
          id="recovery-secret"
          value={recoveryVibe}
          onChange={(e) => setRecoveryVibe(e.target.value)}
          placeholder="Paste the whole card you copied"
          rows={3}
          className="input-mobile"
          disabled={isProcessing}
          autoComplete="off"
        />
        <p className="text-xs text-[color:var(--color-muted)] mt-1.5">
          Paste the whole card. The spoken lines are what you remember; Recover needs the complete copy.
        </p>
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

      {!hasDeviceShare && setPaperShareInput && (
        <div>
          <label htmlFor="recover-paper" className="field-label">
            Paper backup
          </label>
          <input
            id="recover-paper"
            type="text"
            value={paperShareInput}
            onChange={(e) => setPaperShareInput(e.target.value)}
            placeholder="SGS1:3:…"
            className="input-mobile font-mono text-sm"
            disabled={isProcessing}
            autoComplete="off"
            autoCapitalize="off"
            spellCheck={false}
            data-testid="recover-paper-input"
          />
          <p className="text-xs text-[color:var(--color-muted)] mt-1.5">
            Shown once when you created this recovery, before lock. Starts with SGS1:3:
          </p>
        </div>
      )}

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

      <details className="text-sm text-[color:var(--color-muted)]">
        <summary className="cursor-pointer font-medium">More options</summary>
        <div className="mt-3">
          <Link href="/pool" prefetch className="min-h-11 py-2 rounded-lg border border-[color:var(--color-border)] text-sm font-semibold text-center block">
            Privacy pool demo
          </Link>
        </div>
      </details>

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
