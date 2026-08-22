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
import { deriveKeyFromSignature, decryptData, isValidBtcAddress } from '@/lib/crypto';
import { sessionManager, isRealAIEnabled } from '@/lib/storage';

export function VerifyRouteApp() {
  const [btcAddress, setBtcAddress] = useState('');
  const [recoveryVibe, setRecoveryVibe] = useState('');
  const [status, setStatus] = useState('');
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

      setStatus('🔮 Generating ZK-Proof (Acoustic Signature)...');
      await authorizeWithAcousticSignature(btcAddress, finalDnaHash);

      setStatus('✅ Authorship Verified! ZK-Signature matches on-chain public key.');
      sessionManager.addRecoveryAttempt(recoveryVibe.trim(), true, finalDnaHash);
    } catch (error) {
      console.error(error);
      setStatus('❌ Verification Failed. Pattern mismatch or decryption error.');
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
          subtitle="Replay your secret to prove you know it — without putting the pattern on-chain."
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
        />
      </main>
    </div>
  );
}
