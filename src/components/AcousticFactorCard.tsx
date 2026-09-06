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

/**
 * Recovery-side half of the M3 ceremony: the user has replayed their pattern
 * (this card only renders once the DNA hash is verified), so the PATTERN
 * share can be re-derived. Combined with the DEVICE share persisted at mint
 * time, the random acoustic secret is reconstructed — digest-authenticated —
 * without ever having been stored whole, and without the on-chain key being
 * derivable from the pattern alone (key decoupling).
 *
 * Cross-device: when this browser holds no device share, the user can paste
 * their PAPER share (x=3). Pattern + paper reconstructs the secret, which is
 * authenticated against the guardian's on-chain acoustic public key — no
 * local digest required.
 */
export function AcousticFactorCard({ dnaHash, btcAddress, onResolved }: AcousticFactorCardProps) {
  const { state, acousticSecret, paperBusy, submitPaperShare } = useAcousticFactor(
    dnaHash,
    btcAddress,
  );
  const [paperInput, setPaperInput] = useState('');

  // Report resolution upward once the secret is available
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
      <p className="text-sm font-semibold">Acoustic recovery factor</p>
      {state === 'checking' && (
        <p className="text-xs text-[color:var(--color-muted)]">Reconstructing acoustic secret from pattern + device shares…</p>
      )}
      {state === 'available' && (
        <p className="text-xs text-[color:var(--color-success)]" data-testid="acoustic-factor-success">
          ✓ Acoustic secret reconstructed (2-of-3) and verified against the on-chain key.
        </p>
      )}
      {state === 'awaiting-paper' && (
        <p className="text-xs text-[color:var(--color-muted)]">
          No device share found in this browser. Paste your paper share (starts with{' '}
          <code className="text-[10px]">SGS1:3:</code>) to recover on this device.
        </p>
      )}
      {state === 'missing' && (
        <p className="text-xs text-[color:var(--color-muted)]">
          No device share found in this browser. Open recovery on the device where you minted.
        </p>
      )}
      {state === 'unavailable' && (
        <p className="text-xs text-[color:var(--color-muted)]">
          No local session found — device share unavailable on this device.
        </p>
      )}
      {state === 'failed' && (
        <p className="text-xs text-[color:var(--color-error)]" data-testid="acoustic-factor-failed">
          Reconstruction failed — shares don&apos;t match this identity. Check the paper share and pattern.
        </p>
      )}

      {showPaperInput && (
        <div className="pt-2 space-y-2">
          <label htmlFor="paper-share-input" className="field-label">
            Paper share
          </label>
          <input
            id="paper-share-input"
            type="text"
            value={paperInput}
            onChange={(e) => setPaperInput(e.target.value)}
            placeholder="SGS1:3:…"
            className="input-mobile font-mono text-xs"
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
            className="w-full py-2.5 rounded-lg bg-[color:var(--color-primary)] text-white text-xs font-semibold disabled:opacity-50"
            data-testid="paper-share-submit"
          >
            {paperBusy ? 'Verifying on-chain…' : 'Recover with paper share'}
          </button>
        </div>
      )}
    </div>
  );
}
