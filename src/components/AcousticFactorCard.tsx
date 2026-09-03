'use client';

import { useEffect, useState } from 'react';
import { sessionManager } from '@/lib/storage';
import { derivePatternShare, recoverFromShares, bytesToFelt } from '@/lib/recovery-split';
import { getAcousticPublicKey } from '@/lib/crypto';

/**
 * Recovery-side half of the M3 ceremony: the user has replayed their pattern
 * (this panel only renders once the DNA hash is verified), so the PATTERN
 * share can be re-derived. Combined with the DEVICE share persisted at mint
 * time, the acoustic secret is reconstructed — digest-authenticated — without
 * ever having been stored whole.
 *
 * The paper share (x=3) path for cross-device recovery is a documented
 * follow-up (requires on-chain acoustic-key verification to authenticate
 * reconstruction without the local digest).
 */
export function AcousticFactorCard({ dnaHash }: { dnaHash: string }) {
  const [state, setState] = useState<'checking' | 'available' | 'missing' | 'unavailable' | 'failed'>('checking');
  const [pubKeyPreview, setPubKeyPreview] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      const session = sessionManager.getCurrentSession();
      if (!session?.deviceShare || !session?.secretDigest) {
        if (!cancelled) setState(session ? 'missing' : 'unavailable');
        return;
      }
      try {
        const patternShare = await derivePatternShare(dnaHash, 32);
        const serialized = await import('@/lib/shamir').then((m) => m.serializeShare(patternShare));
        const secret = await recoverFromShares([serialized, session.deviceShare], session.secretDigest);
        if (!secret) {
          if (!cancelled) setState('failed');
          return;
        }
        const pubKey = await getAcousticPublicKey(bytesToFelt(secret));
        if (!cancelled) {
          setPubKeyPreview(`${pubKey.slice(0, 10)}…${pubKey.slice(-6)}`);
          setState('available');
        }
      } catch {
        if (!cancelled) setState('failed');
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [dnaHash]);

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
          {pubKeyPreview && <> Acoustic key: <code className="font-mono">{pubKeyPreview}</code></>}
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
