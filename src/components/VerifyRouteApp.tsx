'use client';

import React, { useState, useEffect } from 'react';
import { useAccount } from '@starknet-react/core';
import { Header } from './Header';
import { VerifyPanel } from './VerifyPanel';
import { PageHero } from './PageHero';
import { useStarknetGuardian } from '@/hooks/use-starknet-guardian';
import { generateStrudelCode } from '@/lib/ai-agent';
import { extractSonicDNA } from '@/lib/dna';
import { downloadFromIPFS } from '@/lib/ipfs';
import { deriveKeyFromSignature, decryptData, isValidBtcAddress, getAcousticPublicKey, getPublicKeyFromSecret } from '@/lib/crypto';
import { sessionManager, isRealAIEnabled } from '@/lib/storage';
import { readGuardianOnChain } from '@/lib/sonic-chain';
import {
  derivePatternShare,
  recoverFromShares,
  recoverFromSharesByPubKey,
  bytesToFelt,
} from '@/lib/recovery-split';
import { serializeShare } from '@/lib/shamir';
import { decryptDeviceShare, migrateSessionDeviceShare } from '@/lib/share-crypto';
import { resolveRecoveryCode, spokenInputMatchesPacked } from '@/lib/recall-phrases';
import { clearRehearsal, readRehearsal } from '@/lib/rehearsal';

export function VerifyRouteApp() {
  const [btcAddress, setBtcAddress] = useState('');
  const [recoveryVibe, setRecoveryVibe] = useState('');
  const [status, setStatus] = useState('');
  const [verifiedDnaHash, setVerifiedDnaHash] = useState('');
  const [awaitingSecondFactor, setAwaitingSecondFactor] = useState(false);
  const [decoupled, setDecoupled] = useState(false);
  const [acousticSecret, setAcousticSecret] = useState<string | null>(null);
  const [paperShareInput, setPaperShareInput] = useState('');
  const [hasDeviceShare, setHasDeviceShare] = useState(true);
  const [recoveryPair, setRecoveryPair] = useState<'music' | 'music+device' | 'music+paper' | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [validationStates, setValidationStates] = useState<
    Map<string, { isValid: boolean; message: string; type: 'error' | 'warning' | 'success' }>
  >(new Map());

  const { account } = useAccount();
  const { authorizeWithAcousticSignature } = useStarknetGuardian();
  const useRealAI = isRealAIEnabled();

  useEffect(() => {
    if (!recoveryVibe.trim()) {
      setValidationStates((prev) => {
        const next = new Map(prev);
        next.set('recovery-phrase', {
          isValid: false,
          message: 'Enter your musical pattern or vibe to verify your identity',
          type: 'warning',
        });
        return next;
      });
      return;
    }
    setValidationStates((prev) => {
      const next = new Map(prev);
      next.set('recovery-phrase', {
        isValid: true,
        message: 'Recovery secret provided',
        type: 'success',
      });
      return next;
    });
  }, [recoveryVibe]);

  useEffect(() => {
    if (!btcAddress.trim()) {
      setValidationStates((prev) => {
        const next = new Map(prev);
        next.set('btc-address', {
          isValid: false,
          message: 'Bitcoin address required for verification',
          type: 'warning',
        });
        return next;
      });
      return;
    }
    const valid = isValidBtcAddress(btcAddress);
    setValidationStates((prev) => {
      const next = new Map(prev);
      next.set('btc-address', {
        isValid: valid,
        message: valid ? 'Valid Bitcoin address' : 'Invalid Bitcoin address format',
        type: valid ? 'success' : 'error',
      });
      return next;
    });
  }, [btcAddress]);

  useEffect(() => {
    // R2/R3 hardening: re-persist any legacy plaintext device share as an
    // encrypted-at-rest envelope (non-extractable wrapping key in IndexedDB).
    void migrateSessionDeviceShare().catch(() => {});
    setHasDeviceShare(Boolean(sessionManager.getCurrentSession()?.deviceShare));
  }, []);

  const handleRecovery = async () => {
    if (!recoveryVibe.trim() || !btcAddress) {
      setStatus('Enter the phrases you remember and the Bitcoin address.');
      return;
    }

    setIsProcessing(true);
    setRecoveryPair(null);
    setAwaitingSecondFactor(false);
    setStatus('Checking your recovery…');

    try {
      let finalDnaHash = '';

      if (recoveryVibe.startsWith('Qm')) {
        setStatus('🌐 Fetching encrypted identity from IPFS...');
        const encryptedData = await downloadFromIPFS(recoveryVibe);
        if (!encryptedData) throw new Error('Could not find identity on IPFS');
        if (!account) throw new Error('Wallet not connected');

        setStatus('🔐 Deriving decryption key from your wallet...');
        const signatureResult = await account.signMessage({
          message:
            'SonicGuardian Decentralized Backup - Signature used to derive your private encryption key. Never share this signature.',
        } as never);
        const signatureStr = Array.isArray(signatureResult)
          ? signatureResult.join('')
          : JSON.stringify(signatureResult);
        const decryptionKey = await deriveKeyFromSignature(signatureStr);

        setStatus('🔓 Decrypting sonic identity...');
        const decryptedData = await decryptData(encryptedData, decryptionKey);
        const backup = JSON.parse(decryptedData) as { dnaHash: string };
        finalDnaHash = backup.dnaHash;
      } else {
        setStatus('Reading the pattern…');
        const rehearsal = readRehearsal();
        const rehearsalCode =
          rehearsal && spokenInputMatchesPacked(recoveryVibe, rehearsal.phrases) ? rehearsal.code : null;
        const resolved = resolveRecoveryCode(recoveryVibe, rehearsalCode);
        const code = resolved ?? (await generateStrudelCode(recoveryVibe, { useRealAI })).code;
        // Continuity (THREAT_MODEL_REVIEW.md R1): guardians minted before the
        // deterministic-salt fix were hashed with a session-random salt. When
        // this device's session belongs to the guardian being verified, reuse
        // its salt to reproduce the mint-time hash. Otherwise the
        // deterministic default salt applies (portable across devices).
        const session = sessionManager.getCurrentSession();
        const continuitySalt =
          session?.storedSalt && session.btcAddress === btcAddress ? session.storedSalt : undefined;
        const dna = await extractSonicDNA(code, continuitySalt);
        if (!dna) throw new Error('DNA extraction failed');
        finalDnaHash = dna.hash;
      }

      // Determine whether this guardian uses the decoupled (random) on-chain
      // key or the legacy pattern-derived key — compare the pattern-derived
      // key against the registered acoustic key.
      setStatus('Looking up this address…');
      const onChain = await readGuardianOnChain(btcAddress);
      if (!onChain.registered) throw new Error('No guardian registered for this address');
      const legacyKey = await getAcousticPublicKey(finalDnaHash);
      const isDecoupled = BigInt(legacyKey) !== BigInt(onChain.acousticKey);
      setDecoupled(isDecoupled);
      setVerifiedDnaHash(finalDnaHash);

      if (!isDecoupled) {
        // Legacy guardian: the pattern-derived key is registered on-chain.
        setRecoveryPair('music');
        await finishAuthorization(finalDnaHash);
      } else {
        // Decoupled guardian: the on-chain key is a random secret — a pattern
        // signature alone can never match it. Reconstruct the secret from two
        // Shamir shares first: pattern + device share locally, else paper.
        const localSecret = await tryLocalReconstruction(finalDnaHash, onChain.acousticKey);
        if (localSecret) {
          setRecoveryPair('music+device');
          await finishAuthorization(finalDnaHash, localSecret);
          return;
        }
        const paperSecret = paperShareInput.trim()
          ? await tryPaperReconstruction(finalDnaHash, onChain.acousticKey, paperShareInput)
          : null;
        if (paperSecret) {
          setRecoveryPair('music+paper');
          await finishAuthorization(finalDnaHash, paperSecret);
        } else {
          setAwaitingSecondFactor(true);
          setStatus(
            'This phone has no saved key. Enter the paper backup you wrote down.',
          );
        }
      }
    } catch (error) {
      console.error(error);
      setStatus('Recovery failed. Check the phrases, the Bitcoin address, or the paper backup.');
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Try to reconstruct the decoupled acoustic secret locally from
   * pattern share + device share. Authenticated by the stored digest when
   * present and always cross-checked against the on-chain acoustic key.
   * Returns the secret as a felt252 decimal, or null.
   */
  const tryLocalReconstruction = async (
    dnaHash: string,
    onChainAcousticKey: string,
  ): Promise<string | null> => {
    try {
      const session = sessionManager.getCurrentSession();
      if (!session?.deviceShare) return null;
      // The share is stored encrypted at rest (R3) — decrypt before use.
      const deviceShare = await decryptDeviceShare(session.deviceShare);
      if (!deviceShare) return null;
      const patternShare = serializeShare(await derivePatternShare(dnaHash, 32));
      const secretBytes = session.secretDigest
        ? await recoverFromShares([patternShare, deviceShare], session.secretDigest)
        : await recoverFromSharesByPubKey(
            [patternShare, deviceShare],
            onChainAcousticKey,
          );
      if (!secretBytes) return null;
      const felt = bytesToFelt(secretBytes);
      // Always confirm the reconstruction controls the on-chain key —
      // the digest authenticates bytes; the pubkey authenticates identity.
      if (BigInt(getPublicKeyFromSecret(felt)) !== BigInt(onChainAcousticKey)) return null;
      return felt;
    } catch {
      return null;
    }
  };

  const tryPaperReconstruction = async (
    dnaHash: string,
    onChainAcousticKey: string,
    paperShare: string,
  ): Promise<string | null> => {
    try {
      const patternShare = serializeShare(await derivePatternShare(dnaHash, 32));
      const secretBytes = await recoverFromSharesByPubKey(
        [patternShare, paperShare.trim()],
        onChainAcousticKey,
      );
      if (!secretBytes) return null;
      const felt = bytesToFelt(secretBytes);
      if (BigInt(getPublicKeyFromSecret(felt)) !== BigInt(onChainAcousticKey)) return null;
      return felt;
    } catch {
      return null;
    }
  };

  /** Complete verification: authorize on-chain with the reconstructed secret. */
  const finishAuthorization = async (dnaHash: string, secret?: string) => {
    setStatus('Checking your keys on-chain…');
    await authorizeWithAcousticSignature(btcAddress, dnaHash, secret);
    if (secret) setAcousticSecret(secret);
    setAwaitingSecondFactor(false);
    setStatus('Verified. Recovery matched without revealing your pattern.');
    sessionManager.addRecoveryAttempt(true); // R2: no prompt material persisted
    clearRehearsal();
  };

  /**
   * Callback from AcousticFactorCard when a paper share reconstructs the
   * secret on a device with no local share.
   */
  const handleAcousticSecretResolved = async (secret: string | null) => {
    if (!secret || !verifiedDnaHash || !awaitingSecondFactor) {
      setAcousticSecret(secret);
      return;
    }
    setIsProcessing(true);
    try {
      setRecoveryPair('music+paper');
      await finishAuthorization(verifiedDnaHash, secret);
    } catch (error) {
      console.error(error);
      setStatus('The paper backup was accepted, but the on-chain check failed. Try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="relative min-h-dvh bg-[color:var(--background)] pt-[calc(3.5rem+env(safe-area-inset-top))] sm:pt-20 pb-[calc(5rem+env(safe-area-inset-bottom))]">
      <Header />
      <div className="noise" />
      <div className="bg-sonic-wash" />

      <main id="main-content" className="relative z-10 container mx-auto px-4 sm:px-6 py-4 sm:py-10 flex flex-col items-center">
        <PageHero
          compact
          title="Recover"
          subtitle="Use what you just made, or paste the whole card you copied. On a new phone, the paper field is already there."
        />

        <VerifyPanel
          btcAddress={btcAddress}
          setBtcAddress={setBtcAddress}
          recoveryVibe={recoveryVibe}
          setRecoveryVibe={setRecoveryVibe}
          isProcessing={isProcessing}
          validationStates={validationStates}
          onVerify={handleRecovery}
          status={status || undefined}
          verifiedDnaHash={verifiedDnaHash || undefined}
          awaitingSecondFactor={awaitingSecondFactor}
          decoupled={decoupled}
          acousticSecret={acousticSecret}
          onAcousticSecret={(s) => void handleAcousticSecretResolved(s)}
          hasDeviceShare={hasDeviceShare}
          paperShareInput={paperShareInput}
          setPaperShareInput={setPaperShareInput}
          recoveryPair={recoveryPair}
        />
      </main>
    </div>
  );
}
