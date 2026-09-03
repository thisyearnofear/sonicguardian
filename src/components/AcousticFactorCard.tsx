'use client';

import { useEffect, useState } from 'react';
import { useAcousticFactor } from '@/hooks/use-acoustic-factor';

interface AcousticFactorCardProps {
  dnaHash: string;
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
 * The paper share (x=3) path for cross-device recovery is a documented
 * follow-up (requires on-chain acoustic-key verification to authenticate
 * reconstruction without the local digest).
 */
export function AcousticFactorCard({ dnaHash, onResolved }: AcousticFactorCardProps) {
  const { state, acousticSecret } = useAcousticFactor(dnaHash);

  // Report resolution upward once the secret is available
  useEffect(() => {
    if (acousticSecret) onResolved?.(acousticSecret);
  }, [acousticSecret, onResolved]);

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
          ✓ Acoustic secret reconstructed (2-of-3: pattern + device) and digest-verified.
        </p>
      )}
      {state === 'missing' && (
        <p className="text-xs text-[color:var(--color-muted)]">
          No device share found in this browser. Open recovery on the device where you minted, or
          reconstruct via your paper share (cross-device paper flow coming soon).
        </p>
      )}
      {state === 'unavailable' && (
        <p className="text-xs text-[color:var(--color-muted)]">
          No local session found — device share unavailable on this device.
        </p>
      )}
      {state === 'failed' && (
        <p className="text-xs text-[color:var(--color-error)]" data-testid="acoustic-factor-failed">
          Reconstruction failed — shares don&apos;t match. The pattern may belong to a different identity.
        </p>
      )}
    </div>
  );
}

// keep imports referenced for tree-shaking clarity
