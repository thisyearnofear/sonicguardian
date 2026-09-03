'use client';

import { useEffect, useState } from 'react';
import { sessionManager } from '@/lib/storage';
import { derivePatternShare, recoverFromShares } from '@/lib/recovery-split';
import { serializeShare } from '@/lib/shamir';

export type AcousticFactorState =
  | 'checking'
  | 'available'
  | 'missing'
  | 'unavailable'
  | 'failed';

/**
 * Reconstructs the (random, decoupled) acoustic secret from the pattern share
 * — derived from the VERIFIED dna hash — plus the device share persisted at
 * mint time, authenticated by the stored secret digest.
 *
 * This hook is the recovery-side half of the M3 ceremony. The pattern is one
 * Shamir factor, not the secret itself (see DIRECTION.md, key decoupling).
 * Cross-device paper-share reconstruction is a documented follow-up.
 */
export function useAcousticFactor(dnaHash: string) {
  const [state, setState] = useState<AcousticFactorState>('checking');
  const [acousticSecret, setAcousticSecret] = useState<string | null>(null);

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
        const serialized = serializeShare(patternShare);
        const secretBytes = await recoverFromShares(
          [serialized, session.deviceShare],
          session.secretDigest,
        );
        if (!secretBytes) {
          if (!cancelled) setState('failed');
          return;
        }
        const felt = bytesToFeltLocal(secretBytes);
        if (!cancelled) {
          setAcousticSecret(felt);
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

  return { state, acousticSecret };
}

// avoid importing starknet EC in the hook — caller derives pubkey if needed
function bytesToFeltLocal(bytes: Uint8Array): string {
  const hex = Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  return BigInt('0x' + hex).toString();
}
