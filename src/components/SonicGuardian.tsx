'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { extractSonicDNA, SonicDNA } from '@/lib/dna';
import { generateStrudelCode } from '@/lib/ai-agent';
import { generateAudio } from '@/lib/audio';
import {
  sessionManager,
  preferencesManager,
  isRealAIEnabled,
  setRealAIEnabled
} from '@/lib/storage';
import { getCurrentTheme, setTheme } from '@/lib/theme';
import { Header } from './Header';
import { useStarknetGuardian } from '../hooks/use-starknet-guardian';
import { useMintValidation } from '@/hooks/use-mint-validation';
import { useDebouncedCallback } from '@/hooks/use-debounce';
import { STRUDEL_PATTERN_LIBRARY } from '@/lib/strudel-patterns';
import { stopStrudel } from '@/lib/strudel-lazy';
import { generateBlinding, isValidBtcAddress, encryptData, deriveKeyFromSignature, generateAcousticSecret } from '@/lib/crypto';
import { createRecoverySplit, feltToBytes } from '@/lib/recovery-split';
import { encryptDeviceShare, migrateSessionDeviceShare } from '@/lib/share-crypto';
import { humanizeChunks, humanizeNamedPattern, packRecoverySecret } from '@/lib/recall-phrases';
import { saveRehearsal } from '@/lib/rehearsal';
import { uploadToIPFS } from '@/lib/ipfs';
import { useAccount } from '@starknet-react/core';
import { MobileUtils } from '@/lib/mobile';
import {
  generateEntropy,
  encodePattern,
  chunksToSeedPhrase,
  type MusicalChunk,
  type EncodedPattern
} from '@/lib/entropy-encoder';
import dynamic from 'next/dynamic';
import { MintWizard, type SecretMode } from './MintWizard';
import { InferenceExplainer, INFERENCE_STEPS } from './InferenceExplainer';
import { RecoveryFactors } from './RecoveryFactors';
import { PageHero } from './PageHero';
import { StatusBanner } from './StatusBanner';
import { PaperShareCard } from './PaperShareCard';
import { JudgeDemoButton } from './JudgeDemoButton';
import { DEMO_BTC_ADDRESS } from '@/lib/demo-btc';

const StrudelLabs = dynamic(
  () => import('./StrudelLabs').then((m) => m.StrudelLabs),
  { ssr: false },
);
const HelpModal = dynamic(
  () => import('./HelpModal').then((m) => m.HelpModal),
  { ssr: false },
);

export default function SonicGuardian() {
  const [secretVibe, setSecretVibe] = useState('');
  const [btcAddress, setBtcAddress] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');
  const [musicalChunks, setMusicalChunks] = useState<MusicalChunk[]>([]);
  const [seedPhrase, setSeedPhrase] = useState('');
  const [dna, setDna] = useState<SonicDNA | null>(null);
  const [dnaHash, setDnaHash] = useState('');
  const [blinding, setBlinding] = useState('');
  const [status, setStatus] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [useRealAI, setUseRealAI] = useState(false);
  const [audioEnabled, setAudioState] = useState(true);
  const [currentTheme, setCurrentTheme] = useState<'light' | 'dark' | 'system'>('dark');
  const [hasVisited, setHasVisited] = useState(false);
  const [wizardStep, setWizardStep] = useState<1 | 2 | 3>(1);
  const [secretMode, setSecretMode] = useState<SecretMode>('random');
  const [selectedLibraryPattern, setSelectedLibraryPattern] = useState<string | null>(null);
  const [showExplanations, setShowExplanations] = useState(false);
  const [judgeDemoPending, setJudgeDemoPending] = useState(false);
  
  // Inference Explainer State
  const [showExplainer, setShowExplainer] = useState(false);
  const [inferenceStep, setInferenceStep] = useState(0);

  const audioContextRef = useRef<AudioContext | null>(null);
  const formContainerRef = useRef<HTMLDivElement>(null);
  const tooltipsRef = useRef<Map<string, { destroy: () => void }>>(new Map());

  const validationStates = useMintValidation(btcAddress, secretVibe, secretMode);

  const { 
    isConnected, 
    registerGuardian, 
    getCommitment,
  } = useStarknetGuardian();
  const [isCommiting, setIsCommiting] = useState(false);
  const [onChainStatus, setOnChainStatus] = useState<'none' | 'pending' | 'success' | 'failed'>('none');
  const [paperShare, setPaperShare] = useState<string | null>(null);
  const [paperShareSaved, setPaperShareSaved] = useState(false);
  const [recallLines, setRecallLines] = useState<string[]>([]);
  const [packedSecret, setPackedSecret] = useState('');
  const [quizPassed, setQuizPassed] = useState(false);
  const [pendingAcousticSecret, setPendingAcousticSecret] = useState<string | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  
  // Decentralized Backup State
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [backupCid, setBackupCid] = useState<string | null>(null);

  const { account } = useAccount();

  useEffect(() => {
    // Track visit for UX adjustments (e.g. compact hero)
    const hasVisited = localStorage.getItem('sonic_guardian_visited');
    if (hasVisited) {
      setHasVisited(true);
    }
  }, []);

  useEffect(() => {
    return () => { void stopStrudel(); };
  }, []);


  useEffect(() => {
    const theme = getCurrentTheme();
    setTheme(theme);
    const prefs = preferencesManager.get();
    setUseRealAI(prefs.useRealAI);
    setAudioState(prefs.audioEnabled);
  }, []);

  useEffect(() => {
    const deviceInfo = MobileUtils.getDeviceInfo();
    if (deviceInfo.isMobile && formContainerRef.current) {
      MobileUtils.optimizeFormInputs(formContainerRef.current);
    }

    const btcInput = document.querySelector('input[placeholder*="bc1q"]') as HTMLElement | null;
    if (btcInput) {
      const tooltip = MobileUtils.createTooltip(
        btcInput,
        'Paste or connect a Bitcoin address to protect with your sonic identity.',
        'top',
      );
      tooltipsRef.current.set('btc-address', tooltip);
    }

    const cleanupViewport = MobileUtils.fixMobileViewport();

    return () => {
      cleanupViewport();
      tooltipsRef.current.forEach((tooltip) => tooltip.destroy());
      tooltipsRef.current.clear();
    };
  }, []);

  useEffect(() => {
    // R2/R3 hardening: re-persist any legacy plaintext device share as an
    // encrypted-at-rest envelope (non-extractable wrapping key in IndexedDB).
    void migrateSessionDeviceShare().catch(() => {});
  }, []);

  const playAudio = useCallback((type: Parameters<typeof generateAudio>[1]) => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    generateAudio(audioContextRef.current, type);
  }, []);

  const handleGenerate = useCallback(async () => {
    setIsProcessing(true);
    setStatus('Composing your secret…');

    try {
      let code: string;
      let chunks: MusicalChunk[] = [];

      if (secretMode === 'library' && selectedLibraryPattern) {
        const pattern = STRUDEL_PATTERN_LIBRARY.find((p) => p.name === selectedLibraryPattern);
        if (!pattern) {
          setStatus('Please select a pattern from the library.');
          setIsProcessing(false);
          return;
        }
        code = pattern.code;
        setMusicalChunks([]);
        setSeedPhrase('');
        setRecallLines(humanizeNamedPattern(pattern.name, pattern.vibe));
        setStatus(`Pattern "${pattern.name}" loaded as your secret.`);
      } else if (secretMode === 'random') {
        const entropyBytes = generateEntropy();
        const encoded: EncodedPattern = encodePattern(entropyBytes);
        code = encoded.code;
        chunks = encoded.chunks;
        const phrase = chunksToSeedPhrase(chunks);
        setSeedPhrase(phrase);
        setMusicalChunks(chunks);
        setRecallLines(humanizeChunks(chunks));
        setStatus('Secret ready — listen, then write the paper key.');
      } else {
        if (!secretVibe.trim()) {
          setStatus('Please describe your vibe in Advanced settings.');
          setIsProcessing(false);
          return;
        }
        setShowExplainer(true);
        setInferenceStep(0);
        const stepTimer = setInterval(() => {
          setInferenceStep((prev) => {
            if (prev >= INFERENCE_STEPS.length - 1) {
              clearInterval(stepTimer);
              return prev;
            }
            return prev + 1;
          });
        }, 1500);
        try {
          const agentResponse = await generateStrudelCode(secretVibe, { useRealAI });
          clearInterval(stepTimer);
          setInferenceStep(INFERENCE_STEPS.length - 1);
          code = agentResponse.code;
          chunks = [];
          setMusicalChunks([]);
          setSeedPhrase('');
          setRecallLines(humanizeNamedPattern(secretVibe));
        } finally {
          setTimeout(() => setShowExplainer(false), 500);
        }
        setStatus('AI pattern generated — save your recovery details.');
      }

      setGeneratedCode(code);
      setQuizPassed(false);
      setPendingAcousticSecret(null);
      setPaperShare(null);
      setPaperShareSaved(false);
      setOnChainStatus('none');

      const dna = await extractSonicDNA(code);

      if (dna) {
        setDna(dna);
        setDnaHash(dna.hash);
        const blindingFactor = generateBlinding();
        setBlinding(blindingFactor);
        // R2 (THREAT_MODEL_REVIEW.md): persist session metadata only — the
        // generated code is the user's memorized secret and is deliberately
        // NEVER stored. Device theft must not yield both recovery factors.
        sessionManager.createSession(dna.salt, btcAddress || undefined, blindingFactor);
        const lines =
          secretMode === 'random'
            ? humanizeChunks(chunks)
            : secretMode === 'library' && selectedLibraryPattern
              ? humanizeNamedPattern(selectedLibraryPattern)
              : humanizeNamedPattern(secretVibe);
        const packed = packRecoverySecret(lines, code);
        setRecallLines(lines);
        setPackedSecret(packed);
        if (btcAddress) {
          saveRehearsal({ phrases: packed, btcAddress, code });
        }
        if (audioEnabled) playAudio('success');
      }
    } catch (error) {
      console.error(error);
      setStatus('Generation failed. Try random or library mode.');
    } finally {
      setIsProcessing(false);
    }
  }, [
    secretMode,
    selectedLibraryPattern,
    secretVibe,
    useRealAI,
    btcAddress,
    hasVisited,
    audioEnabled,
    playAudio,
  ]);

  useEffect(() => {
    if (!judgeDemoPending) return;
    if (wizardStep !== 3 || secretMode !== 'random' || btcAddress !== DEMO_BTC_ADDRESS) return;
    setJudgeDemoPending(false);
    void handleGenerate().then(() => {
      setQuizPassed(true);
    });
  }, [judgeDemoPending, wizardStep, secretMode, btcAddress, handleGenerate]);

  const handleJudgeDemo = useCallback(() => {
    setSecretMode('random');
    setSelectedLibraryPattern(null);
    setWizardStep(3);
    setJudgeDemoPending(true);
    setStatus('Demo — generating a random secret with the demo Bitcoin address…');
  }, []);

  const extractDnaFromCode = useCallback(async (newCode: string) => {
    const newDna = await extractSonicDNA(newCode);
    if (newDna) {
      setDna(newDna);
      setDnaHash(newDna.hash);
    }
  }, []);

  const debouncedExtractDna = useDebouncedCallback(extractDnaFromCode, 400);

  const handleCodeChange = useCallback(
    (newCode: string) => {
      setGeneratedCode(newCode);
      setQuizPassed(false);
      setPendingAcousticSecret(null);
      setPaperShare(null);
      setPaperShareSaved(false);
      debouncedExtractDna(newCode);
    },
    [debouncedExtractDna],
  );

  const preparePaperSplit = useCallback(async () => {
    if (!dnaHash || pendingAcousticSecret) return;
    try {
      const acousticSecret = generateAcousticSecret();
      const split = await createRecoverySplit(feltToBytes(acousticSecret), dnaHash);
      setPendingAcousticSecret(acousticSecret);
      sessionManager.updateSession({
        deviceShare: await encryptDeviceShare(split.deviceShare),
        secretDigest: split.secretDigest,
      });
      setPaperShare(split.paperShare);
      setStatus('Write down the paper key — shown once, before you lock.');
    } catch (splitError) {
      console.error('Recovery split failed:', splitError);
      setStatus('Could not create the paper key. You can still lock with this device plus the music.');
      setPaperShareSaved(true);
    }
  }, [dnaHash, pendingAcousticSecret]);

  const handleQuizPassed = useCallback(() => {
    setQuizPassed(true);
  }, []);

  useEffect(() => {
    if (!quizPassed || !dnaHash || pendingAcousticSecret || paperShare || paperShareSaved) return;
    void preparePaperSplit();
  }, [quizPassed, dnaHash, pendingAcousticSecret, paperShare, paperShareSaved, preparePaperSplit]);

  const handleCommitToStarknet = useCallback(async () => {
    if (!dnaHash || !isConnected) return;

    if (!btcAddress) {
      setStatus('⚠️ Please enter a Bitcoin address to link.');
      return;
    }

    if (!isValidBtcAddress(btcAddress)) {
      setStatus('❌ Invalid Bitcoin address format.');
      return;
    }

    if (!pendingAcousticSecret && !paperShareSaved) {
      setStatus('Write down the paper key first, then lock.');
      return;
    }

    setIsCommiting(true);
    setOnChainStatus('pending');
    setStatus('Locking recovery on-chain…');

    try {
      const acousticSecret = pendingAcousticSecret ?? generateAcousticSecret();
      if (!pendingAcousticSecret) {
        const split = await createRecoverySplit(feltToBytes(acousticSecret), dnaHash);
        sessionManager.updateSession({
          deviceShare: await encryptDeviceShare(split.deviceShare),
          secretDigest: split.secretDigest,
        });
      }
      await registerGuardian(btcAddress, dnaHash, blinding, acousticSecret);
      sessionManager.updateSession({ btcAddress });
      if (packedSecret) {
        saveRehearsal({ phrases: packedSecret, btcAddress, code: generatedCode });
      }
      setOnChainStatus('success');
      setStatus('Recovery locked. Try Recover with the card you copied.');
    } catch (error) {
      console.error(error);
      setOnChainStatus('failed');
      setStatus('Lock failed. Your paper key is still valid — connect a funded Starknet wallet and try again.');
    } finally {
      setIsCommiting(false);
    }
  }, [
    dnaHash,
    isConnected,
    btcAddress,
    blinding,
    registerGuardian,
    pendingAcousticSecret,
    paperShareSaved,
    packedSecret,
    generatedCode,
  ]);

  const handleDecentralizedBackup = useCallback(async () => {
    if (!generatedCode || !blinding || !btcAddress) {
      setStatus('Create a recovery first.');
      return;
    }

    if (!isConnected || !account) {
      setStatus('⚠️ Please connect your wallet to derive an encryption key.');
      return;
    }

    setIsBackingUp(true);
    setStatus('🔐 Deriving encryption key from your wallet...');

    try {
      // 1. Derive key from signature
      const signatureResult = await account.signMessage({
        message: "SonicGuardian Decentralized Backup - Signature used to derive your private encryption key. Never share this signature.",
      } as any);
      
      // Starknet signatures can be an array of felts
      const signatureStr = Array.isArray(signatureResult) 
        ? signatureResult.join('') 
        : typeof signatureResult === 'string' 
          ? signatureResult 
          : JSON.stringify(signatureResult);

      const encryptionKey = await deriveKeyFromSignature(signatureStr);

      setStatus('📦 Encrypting sonic identity & blinding factor...');
      
      // 2. Encrypt sensitive data
      const sensitiveData = JSON.stringify({
        code: generatedCode,
        blinding: blinding,
        btcAddress: btcAddress,
        dnaHash: dnaHash,
        timestamp: Date.now()
      });

      const encrypted = await encryptData(sensitiveData, encryptionKey);

      setStatus('🌐 Uploading to IPFS (Protocol Labs Track)...');

      // 3. Upload to IPFS
      const response = await uploadToIPFS(encrypted, {
        btcAddress: btcAddress.substring(0, 10) + '...', // Store only partial BTC address as hint
        type: 'acoustic_backup'
      });

      if (response) {
        setBackupCid(response.cid);
        setStatus(`✅ Securely backed up to IPFS! CID: ${response.cid.substring(0, 10)}...`);
        if (audioEnabled) playAudio('success');
      } else {
        throw new Error('IPFS upload failed');
      }
    } catch (error) {
      console.error('Backup failed:', error);
      setStatus('❌ Backup failed. Signature was either rejected or network error.');
    } finally {
      setIsBackingUp(false);
    }
  }, [generatedCode, blinding, btcAddress, isConnected, account, dnaHash, audioEnabled, playAudio]);

  const handleVerifyOnChain = useCallback(async () => {
    setStatus('Reading commitment from contract...');
    const commitment = await getCommitment(btcAddress);
    if (commitment && commitment !== '0') {
      setStatus(`✅ On-chain verified! Commitment: ${commitment.slice(0, 10)}...`);
    } else {
      setStatus('⚠️ No commitment found on-chain');
    }
  }, [btcAddress, getCommitment]);

  const handlePatternSelect = useCallback((_code: string, name: string) => {
    setSecretMode('library');
    setSelectedLibraryPattern(name);
    setWizardStep(1);
    setStatus(`Pattern "${name}" selected — finish the steps to lock it in.`);
  }, []);

  const visualizerTheme = currentTheme === 'dark' ? 'dark' : 'light';

  return (
    <div className="relative min-h-dvh bg-[color:var(--background)] selection:bg-[color:var(--color-primary)] selection:text-white pt-[calc(3.5rem+env(safe-area-inset-top))] sm:pt-20 pb-[calc(5rem+env(safe-area-inset-bottom))]">
      <Header />
      <div className="noise" />
      <div className="bg-sonic-wash" />

      <main id="main-content" className="relative z-10 container mx-auto px-4 sm:px-6 py-4 sm:py-10 flex flex-col items-center">
        <PageHero
          compact={hasVisited}
          badge={hasVisited ? undefined : 'Musical recovery'}
          title="Sonic Guardian"
          subtitle="Replace your seed phrase with a musical secret. Remember the music. Keep one paper backup. Recover years later without revealing the pattern."
          onHelp={() => setShowHelp(true)}
          actions={
            <JudgeDemoButton
              onRun={handleJudgeDemo}
              loading={judgeDemoPending || isProcessing}
              disabled={isProcessing}
            />
          }
        />

        <div className="w-full max-w-6xl grid grid-cols-1 gap-8 items-start">
          <div className="w-full" ref={formContainerRef}>
            <MintWizard
              wizardStep={wizardStep}
              setWizardStep={setWizardStep}
              secretMode={secretMode}
              setSecretMode={setSecretMode}
              selectedLibraryPattern={selectedLibraryPattern}
              setSelectedLibraryPattern={setSelectedLibraryPattern}
              secretVibe={secretVibe}
              setSecretVibe={setSecretVibe}
              btcAddress={btcAddress}
              setBtcAddress={setBtcAddress}
              validationStates={validationStates}
              setStatus={setStatus}
              vibeValidation={validationStates.get('custom-vibe')}
              generatedCode={generatedCode}
              dnaHash={dnaHash}
              musicalChunks={musicalChunks}
              seedPhrase={seedPhrase}
              isProcessing={isProcessing}
              isConnected={isConnected}
              isCommiting={isCommiting}
              onChainStatus={onChainStatus}
              onGenerate={handleGenerate}
              onCommit={handleCommitToStarknet}
              onCodeChange={handleCodeChange}
              onVerifyOnChain={handleVerifyOnChain}
              onDecentralizedBackup={handleDecentralizedBackup}
              isBackingUp={isBackingUp}
              backupCid={backupCid}
              paperShareSaved={paperShareSaved}
              paperSharePending={!!paperShare}
              dnaSequence={dna?.dna}
              visualizerTheme={visualizerTheme}
              recallLines={recallLines}
              packedSecret={packedSecret}
              quizPassed={quizPassed}
              onQuizPassed={handleQuizPassed}
            />
            {(status || showExplainer) && (
              <div className="max-w-2xl mx-auto mt-4 space-y-3">
                {status && <StatusBanner message={status} />}
                <InferenceExplainer isVisible={showExplainer} currentStep={inferenceStep} />
              </div>
            )}

            <details className="max-w-2xl mx-auto mt-8 group">
              <summary className="cursor-pointer list-none text-sm font-medium text-[color:var(--color-muted)] hover:text-[color:var(--color-foreground)] flex items-center gap-2">
                <span className="group-open:rotate-90 transition-transform text-xs">▶</span>
                Explore more patterns
              </summary>
              <div className="mt-4">
                <StrudelLabs onPatternSelect={handlePatternSelect} />
              </div>
            </details>

            <div className="max-w-2xl mx-auto mt-6 flex flex-wrap justify-center gap-2">
              <button
                type="button"
                onClick={() => setShowExplanations(!showExplanations)}
                className="text-sm px-3 py-2 rounded-full border border-[color:var(--color-border)] text-[color:var(--color-muted)] hover:text-[color:var(--color-foreground)]"
              >
                {showExplanations ? 'Hide how it works' : 'How it works'}
              </button>
            </div>
          </div>
        </div>

        {/* AI toggle — compact */}
        {secretMode === 'vibe' && (
          <div
            className="fixed z-40 right-4 pointer-events-none"
            style={{ bottom: 'max(1rem, env(safe-area-inset-bottom))' }}
          >
            <button
              type="button"
              onClick={() => {
                const enabled = !isRealAIEnabled();
                setRealAIEnabled(enabled);
                setUseRealAI(enabled);
              }}
              className={`pointer-events-auto px-3 py-2 rounded-full flex items-center gap-2 text-xs font-medium border transition-all active:scale-95 ${
                useRealAI
                  ? 'border-[color:var(--color-success)]/40 text-[color:var(--color-success)] bg-[color:var(--color-success)]/10'
                  : 'border-[color:var(--color-border)] text-[color:var(--color-muted)] bg-[color:var(--background)]/90 backdrop-blur-sm'
              }`}
              aria-label={useRealAI ? 'AI enabled' : 'AI disabled'}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${useRealAI ? 'bg-[color:var(--color-success)] animate-pulse' : 'bg-[color:var(--color-muted)]'}`} />
              AI {useRealAI ? 'on' : 'off'}
            </button>
          </div>
        )}

        {showExplanations && (
          <section className="mt-12 w-full max-w-2xl px-2 space-y-3">
            <p className="text-sm font-semibold text-center">Three keys. Any two recover you.</p>
            <RecoveryFactors pattern="pending" device="pending" paper="pending" />
          </section>
        )}
      </main>

      <footer className="relative z-10 py-10 mt-10 border-t border-[color:var(--color-border)] text-center space-y-2">
        <p className="text-sm text-[color:var(--color-muted)]">
          Sonic Guardian · musical recovery · 2026
        </p>
        <a
          href="/pool"
          className="text-xs text-[color:var(--color-muted)] hover:text-[color:var(--color-foreground)] underline-offset-2 hover:underline"
        >
          Privacy pool demo
        </a>
      </footer>

      {paperShare && (
        <PaperShareCard
          share={paperShare}
          onClose={() => {
            setPaperShare(null);
            setPaperShareSaved(true);
          }}
        />
      )}

      <HelpModal isOpen={showHelp} onClose={() => setShowHelp(false)} />
    </div>
  );
}
