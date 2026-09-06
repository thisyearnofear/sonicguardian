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

export function VerifyRouteApp() {
  const [btcAddress, setBtcAddress] = useState('');
  const [recoveryVibe, setRecoveryVibe] = useState('');
  const [status, setStatus] = useState('');
  const [verifiedDnaHash, setVerifiedDnaHash] = useState('');
  const [awaitingSecondFactor, setAwaitingSecondFactor] = useState(false);
  const [decoupled, setDecoupled] = useState(false);
  const [acousticSecret, setAcousticSecret] = useState<string | null>(null);
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

  const handleRecovery = async () => {
    if (!recoveryVibe.trim() || !btcAddress) {
      setStatus('Please provide your vibe (or CID) and Bitcoin address.');
      return;
    }

    setIsProcessing(true);
    setStatus('Verifying authorship of sonic identity...');

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
        setStatus('Extracting DNA from musical pattern...');
        const agentResponse = await generateStrudelCode(recoveryVibe, { useRealAI });
        const dna = await extractSonicDNA(agentResponse.code);
        if (!dna) throw new Error('DNA extraction failed');
        finalDnaHash = dna.hash;
      }

      // Determine whether this guardian uses the decoupled (random) on-chain
      // key or the legacy pattern-derived key — compare the pattern-derived
      // key against the registered acoustic key.
      setStatus('🔍 Reading on-chain guardian…');
      const onChain = await readGuardianOnChain(btcAddress);
      if (!onChain.registered) throw new Error('No guardian registered for this address');
      const legacyKey = await getAcousticPublicKey(finalDnaHash);
      const isDecoupled = BigInt(legacyKey) !== BigInt(onChain.acousticKey);
      setDecoupled(isDecoupled);
      setVerifiedDnaHash(finalDnaHash);

      if (!isDecoupled) {
        // Legacy guardian: the pattern-derived key is registered on-chain.
        setStatus('🔮 Generating ZK-Proof (Acoustic Signature)...');
        await authorizeWithAcousticSignature(btcAddress, finalDnaHash);
        setStatus('✅ Authorship Verified! ZK-Signature matches on-chain public key.');
        sessionManager.addRecoveryAttempt(recoveryVibe.trim(), true, finalDnaHash);
      } else {
        // Decoupled guardian: the on-chain key is a random secret — a pattern
        // signature alone can never match it. Reconstruct the secret from two
        // Shamir shares first: pattern + device share locally, else ask for
        // the paper share (cross-device).
        const secret = await tryLocalReconstruction(finalDnaHash, onChain.acousticKey);
        if (secret) {
          await finishAuthorization(finalDnaHash, secret);
        } else {
          setAwaitingSecondFactor(true);
          setStatus(
            'Second recovery factor required — no device share on this browser. Enter your paper share below.',
          );
        }
      }
    } catch (error) {
      console.error(error);
      setStatus('❌ Verification Failed. Pattern mismatch or decryption error.');
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
      const patternShare = serializeShare(await derivePatternShare(dnaHash, 32));
      const secretBytes = session.secretDigest
        ? await recoverFromShares([patternShare, session.deviceShare], session.secretDigest)
        : await recoverFromSharesByPubKey(
            [patternShare, session.deviceShare],
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

  /** Complete verification: authorize on-chain with the reconstructed secret. */
  const finishAuthorization = async (dnaHash: string, secret: string) => {
    setStatus('🔮 Generating ZK-Proof (Acoustic Signature)...');
    await authorizeWithAcousticSignature(btcAddress, dnaHash, secret);
    setAcousticSecret(secret);
    setAwaitingSecondFactor(false);
    setStatus('✅ Authorship Verified! ZK-Signature matches on-chain public key.');
    sessionManager.addRecoveryAttempt(recoveryVibe.trim(), true, dnaHash);
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
      await finishAuthorization(verifiedDnaHash, secret);
    } catch (error) {
      console.error(error);
      setStatus('❌ Authorization failed after share reconstruction.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="relative min-h-dvh bg-[color:var(--background)] pt-[calc(3.5rem+env(safe-area-inset-top))] sm:pt-20 pb-[calc(5rem+env(safe-area-inset-bottom))]">
      <Header />
      <div className="noise" />
      <div className="bg-gradient-mesh" />

      <main className="relative z-10 container mx-auto px-4 sm:px-6 py-4 sm:py-10 flex flex-col items-center">
        <PageHero
          compact
          title="Verify authorship"
          subtitle="Prove human authority over a sonic identity — then optionally authorize recovery privately via the STRK20 pool."
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
        />
      </main>
    </div>
  );
}
