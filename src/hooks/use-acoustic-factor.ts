'use client';

import { useCallback, useEffect, useState } from 'react';
import { sessionManager } from '@/lib/storage';
import {
  derivePatternShare,
  recoverFromShares,
  recoverFromSharesByPubKey,
  sha256Hex,
} from '@/lib/recovery-split';
import { serializeShare } from '@/lib/shamir';
import { readGuardianOnChain } from '@/lib/sonic-chain';

export type AcousticFactorState =
  | 'checking'
  | 'available'
  | 'awaiting-paper'
  | 'missing'
  | 'unavailable'
  | 'failed';

/**
 * Reconstructs the (random, decoupled) acoustic secret from the pattern share
 * — derived from the VERIFIED dna hash — plus the device share persisted at
 * mint time, authenticated by the stored secret digest.
 *
 * Cross-device path: when this browser has no device share (state
 * 'awaiting-paper'), `submitPaperShare` reconstructs from pattern + paper
 * shares and authenticates the result against the guardian's on-chain
 * acoustic public key (`get_acoustic_key`) — no local digest needed. On
 * success the paper share is persisted as this device's share so future
 * recoveries on this device stay local.
 *
 * This hook is the recovery-side half of the M3 ceremony. The pattern is one
 * Shamir factor, not the secret itself (see DIRECTION.md, key decoupling).
 */
export function useAcousticFactor(dnaHash: string, btcAddress?: string) {
  const [state, setState] = useState<AcousticFactorState>('checking');
  const [acousticSecret, setAcousticSecret] = useState<string | null>(null);
  const [paperBusy, setPaperBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      const session = sessionManager.getCurrentSession();
      if (!session?.deviceShare || !session?.secretDigest) {
        if (cancelled) return;
        // No local share — cross-device recovery is possible via paper share
        // whenever we know which guardian to authenticate against.
        setState(btcAddress ? 'awaiting-paper' : session ? 'missing' : 'unavailable');
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
  }, [dnaHash, btcAddress]);

  /**
   * Cross-device recovery: combine the pattern share with a user-supplied
   * paper share, authenticating the reconstruction against the on-chain
   * acoustic public key. Returns true when the secret was recovered.
   */
  const submitPaperShare = useCallback(
    async (serializedPaperShare: string): Promise<boolean> => {
      if (!btcAddress) return false;
      setPaperBusy(true);
      try {
        const { acousticKey } = await readGuardianOnChain(btcAddress);
        if (!acousticKey || BigInt(acousticKey) === 0n) {
          setState('unavailable');
          return false;
        }
        const patternShare = serializeShare(await derivePatternShare(dnaHash, 32));
        const secretBytes = await recoverFromSharesByPubKey(
          [patternShare, serializedPaperShare.trim()],
          acousticKey,
        );
        if (!secretBytes) {
          setState('failed');
          return false;
        }
        setAcousticSecret(bytesToFeltLocal(secretBytes));
        setState('available');
        // Persist the paper share as this device's share so subsequent
        // recoveries on this device stay local (digest now known). No-op
        // when there is no session on this device yet.
        sessionManager.updateSession({
          deviceShare: serializedPaperShare.trim(),
          secretDigest: await sha256Hex(secretBytes),
        });
        return true;
      } catch {
        setState('failed');
        return false;
      } finally {
        setPaperBusy(false);
      }
    },
    [dnaHash, btcAddress],
  );

  return { state, acousticSecret, paperBusy, submitPaperShare };
}

// avoid importing starknet EC in the hook — caller derives pubkey if needed
function bytesToFeltLocal(bytes: Uint8Array): string {
  const hex = Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  return BigInt('0x' + hex).toString();
}
