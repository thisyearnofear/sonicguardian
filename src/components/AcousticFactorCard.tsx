'use client';

import { useEffect, useState } from 'react';
import { useAcousticFactor } from '@/hooks/use-acoustic-factor';

interface AcousticFactorCardProps {
  dnaHash: string;
  /** Guardian's BTC address — enables cross-device paper-share recovery */
  btcAddress?: string;
  /** Reports the reconstructed secret (or null when unavailable) upward */
  onResolved?: (acousticSecret: string | null) => void;
}

export function AcousticFactorCard({ dnaHash, btcAddress, onResolved }: AcousticFactorCardProps) {
  const { state, acousticSecret, paperBusy, submitPaperShare } = useAcousticFactor(
    dnaHash,
    btcAddress,
  );
  const [paperInput, setPaperInput] = useState('');

  useEffect(() => {
    if (acousticSecret) onResolved?.(acousticSecret);
  }, [acousticSecret, onResolved]);

  const showPaperInput =
    !!btcAddress && (state === 'awaiting-paper' || state === 'failed' || state === 'missing' || state === 'unavailable');

  return (
    <div
      className="rounded-xl border border-[color:var(--color-border)] p-4 space-y-2"
      data-testid="acoustic-factor-card"
    >
      <p className="text-sm font-semibold">Paper backup</p>
      {state === 'checking' && (
        <p className="text-sm text-[color:var(--color-muted)]">Checking this device for a saved key…</p>
      )}
      {state === 'available' && (
        <p className="text-sm text-[color:var(--color-success)]" data-testid="acoustic-factor-success">
          Two keys matched. Recovery can continue.
        </p>
      )}
      {state === 'awaiting-paper' && (
        <p className="text-sm text-[color:var(--color-muted)]">
          No key is saved in this browser. Paste the paper backup you wrote down (it starts with{' '}
          <code className="text-xs">SGS1:3:</code>).
        </p>
      )}
      {state === 'missing' && (
        <p className="text-sm text-[color:var(--color-muted)]">
          No key on this phone. Open recovery on the device you used to create it, or paste the paper backup.
        </p>
      )}
      {state === 'unavailable' && (
        <p className="text-sm text-[color:var(--color-muted)]">
          This browser has no saved key. Use the paper backup to continue.
        </p>
      )}
      {state === 'failed' && (
        <p className="text-sm text-[color:var(--color-error)]" data-testid="acoustic-factor-failed">
          Those keys don’t match this recovery. Check the paper backup and the phrases you entered.
        </p>
      )}

      {showPaperInput && (
        <div className="pt-2 space-y-2">
          <label htmlFor="paper-share-input" className="field-label">
            Paper backup
          </label>
          <input
            id="paper-share-input"
            type="text"
            value={paperInput}
            onChange={(e) => setPaperInput(e.target.value)}
            placeholder="SGS1:3:…"
            className="input-mobile font-mono text-sm"
            disabled={paperBusy}
            autoComplete="off"
            autoCapitalize="off"
            spellCheck={false}
            data-testid="paper-share-input"
          />
          <button
            type="button"
            disabled={paperBusy || !paperInput.trim()}
            onClick={() => void submitPaperShare(paperInput)}
            className="btn-primary py-3 text-sm"
            data-testid="paper-share-submit"
          >
            {paperBusy ? 'Checking…' : 'Use paper backup'}
          </button>
        </div>
      )}
    </div>
  );
}
