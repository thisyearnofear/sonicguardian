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
import { VisualizerPanel } from './VisualizerPanel';
import { InferenceExplainer, INFERENCE_STEPS } from './InferenceExplainer';
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
  const [showVisualizer, setShowVisualizer] = useState(false);
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

  const playAudio = useCallback((type: Parameters<typeof generateAudio>[1]) => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    generateAudio(audioContextRef.current, type);
  }, []);

  const handleGenerate = useCallback(async () => {
    setIsProcessing(true);
    setStatus('Generating your sonic identity...');

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
        setStatus(`Pattern "${pattern.name}" loaded as your secret.`);
      } else if (secretMode === 'random') {
        const entropyBytes = generateEntropy();
        const encoded: EncodedPattern = encodePattern(entropyBytes);
        code = encoded.code;
        chunks = encoded.chunks;
        const phrase = chunksToSeedPhrase(chunks);
        setSeedPhrase(phrase);
        setMusicalChunks(chunks);
        setStatus(`Random secret generated (${chunks.length} recovery chunks).`);
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
        } finally {
          setTimeout(() => setShowExplainer(false), 500);
        }
        setStatus('AI pattern generated — save your recovery details.');
      }

      setGeneratedCode(code);

      const dna = await extractSonicDNA(code);

      if (dna) {
        setDna(dna);
        setDnaHash(dna.hash);
        const blindingFactor = generateBlinding();
        setBlinding(blindingFactor);
        sessionManager.createSession(code, dna.hash, dna.salt, btcAddress || undefined, blindingFactor);
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
    void handleGenerate();
  }, [judgeDemoPending, wizardStep, secretMode, btcAddress, handleGenerate]);

  const handleJudgeDemo = useCallback(() => {
    setSecretMode('random');
    setSelectedLibraryPattern(null);
    setWizardStep(3);
    setJudgeDemoPending(true);
    setStatus('Judge demo — generating random identity with demo BTC address…');
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
      debouncedExtractDna(newCode);
    },
    [debouncedExtractDna],
  );

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

    setIsCommiting(true);
    setOnChainStatus('pending');
    setStatus('🔒 Committing Sonic Identity to Starknet (Pedersen Commitment)...');

    try {
      // Key decoupling: the secret whose public key is registered on-chain is a
      // RANDOM high-entropy key, not pattern-derived. The pattern is only one
      // Shamir factor for reconstructing it (see DIRECTION.md).
      const acousticSecret = generateAcousticSecret();
      await registerGuardian(btcAddress, dnaHash, blinding, acousticSecret);
      sessionManager.updateSession({ btcAddress });
      setOnChainStatus('success');
      setStatus('✅ Sonic Identity Anchored! Your pattern is now committed on-chain.');

      // M3 recovery split: split the random acoustic secret 2-of-3 —
      // share 1 = pattern (recomputed from DNA hash at recovery, never stored),
      // share 2 = device (persisted in the session), share 3 = paper (shown once).
      try {
        const split = await createRecoverySplit(feltToBytes(acousticSecret), dnaHash);
        sessionManager.updateSession({
          deviceShare: split.deviceShare,
          secretDigest: split.secretDigest,
        });
        setPaperShare(split.paperShare);
      } catch (splitError) {
        console.error('Recovery split failed:', splitError);
        setStatus(
          '⚠️ Identity anchored, but the recovery split failed — your guardian was created without backup shares.',
        );
      }
    } catch (error) {
      console.error(error);
      setOnChainStatus('failed');
      setStatus('❌ Transaction failed. Ensure your wallet has gas funds.');
    } finally {
      setIsCommiting(false);
    }
  }, [dnaHash, isConnected, btcAddress, blinding, registerGuardian]);

  const handleDecentralizedBackup = useCallback(async () => {
    if (!generatedCode || !blinding || !btcAddress) {
      setStatus('⚠️ Please mint a sonic identity first.');
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
    setStatus(`Pattern "${name}" selected — complete the wizard to mint.`);
  }, []);

  const visualizerTheme = currentTheme === 'dark' ? 'dark' : 'light';

  return (
    <div className="relative min-h-dvh bg-[color:var(--background)] selection:bg-[color:var(--color-primary)] selection:text-white pt-[calc(3.5rem+env(safe-area-inset-top))] sm:pt-20 pb-[calc(5rem+env(safe-area-inset-bottom))]">
      <Header />
      <div className="noise" />
      <div className="bg-gradient-mesh" />

      <main className="relative z-10 container mx-auto px-4 sm:px-6 py-4 sm:py-10 flex flex-col items-center">
        <PageHero
          compact={hasVisited}
          badge={hasVisited ? undefined : 'Privacy-first · Starknet'}
          title="Sonic Guardian"
          subtitle="Replace your seed phrase with a musical secret. Prove it's yours — years later — without anyone knowing what the music was."
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
          {showVisualizer && (
            <VisualizerPanel theme={visualizerTheme} dnaSequence={dna?.dna} />
          )}

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
            />
            {(status || showExplainer) && (
              <div className="max-w-2xl mx-auto mt-4 space-y-3">
                {status && <StatusBanner message={status} />}
                {paperShare && (
                  <PaperShareCard share={paperShare} onClose={() => setPaperShare(null)} />
                )}
                <InferenceExplainer isVisible={showExplainer} currentStep={inferenceStep} />
              </div>
            )}

            <details className="max-w-2xl mx-auto mt-8 group">
              <summary className="cursor-pointer list-none text-sm font-medium text-[color:var(--color-muted)] hover:text-[color:var(--color-foreground)] flex items-center gap-2">
                <span className="group-open:rotate-90 transition-transform text-xs">▶</span>
                Explore Strudel patterns
              </summary>
              <div className="mt-4">
                <StrudelLabs onPatternSelect={handlePatternSelect} />
              </div>
            </details>

            <div className="max-w-2xl mx-auto mt-6 flex flex-wrap justify-center gap-2">
              <button
                type="button"
                onClick={() => setShowVisualizer(!showVisualizer)}
                className="text-xs px-3 py-1.5 rounded-full border border-[color:var(--color-border)] text-[color:var(--color-muted)] hover:text-[color:var(--color-foreground)]"
              >
                {showVisualizer ? 'Hide visualizer' : 'Show visualizer'}
              </button>
              <button
                type="button"
                onClick={() => setShowExplanations(!showExplanations)}
                className="text-xs px-3 py-1.5 rounded-full border border-[color:var(--color-border)] text-[color:var(--color-muted)] hover:text-[color:var(--color-foreground)]"
              >
                {showExplanations ? 'Hide how it works' : 'How it works'}
              </button>
            </div>
          </div>
        </div>

        {/* AI toggle — compact */}
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

        {showExplanations && (
        <section className="mt-12 w-full max-w-4xl grid grid-cols-1 md:grid-cols-3 gap-6 px-2">
          <div className="p-4 rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-foreground)]/[0.02]">
            <p className="text-xs font-semibold text-[color:var(--color-primary)] mb-2">1 · Choose a secret</p>
            <p className="text-xs text-[color:var(--color-muted)] leading-relaxed">
              Random chunks, a curated pattern, or an AI vibe — your recovery factor stays in the browser.
            </p>
          </div>
          <div className="p-4 rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-foreground)]/[0.02]">
            <p className="text-xs font-semibold text-[color:var(--color-accent)] mb-2">2 · Zero-knowledge proof</p>
            <p className="text-xs text-[color:var(--color-muted)] leading-relaxed">
              Prove authorship with an acoustic signature. The contract checks your proof — not your pattern.
            </p>
          </div>
          <div className="p-4 rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-foreground)]/[0.02]">
            <p className="text-xs font-semibold text-[color:var(--color-success)] mb-2">3 · Starknet anchor</p>
            <p className="text-xs text-[color:var(--color-muted)] leading-relaxed">
              Only a Pedersen commitment and public key land on-chain. Audio preview is optional.
            </p>
          </div>
        </section>
        )}

        {/* Cross-chain + STRK20 */}
        <section className="mt-16 w-full max-w-4xl border-t border-[color:var(--color-border)] pt-12">
          <div className="text-center mb-8">
            <div className="inline-block px-3 py-1 rounded-full bg-[color:var(--color-accent)]/10 border border-[color:var(--color-accent)]/30 text-[color:var(--color-accent)] text-[10px] font-bold tracking-widest uppercase mb-4">
              STRK20 Private Sprint
            </div>
            <h2 className="text-xl font-bold tracking-tight mb-2">Private registration bonds</h2>
            <p className="text-[color:var(--color-muted)] text-xs max-w-xl mx-auto">
              Shield an optional STRK stake in the STRK20 pool before anchoring your sonic identity.
              See <code className="text-[10px]">docs/HACKATHON.md</code> for the judge demo path.
            </p>
          </div>
          <div className="opacity-60 text-center">
            <p className="text-[color:var(--color-muted)] text-[10px] uppercase tracking-widest">
              Cross-chain storage proofs — roadmap
            </p>
          </div>
        </section>
      </main>

      <footer className="relative z-10 py-12 mt-12 border-t border-[color:var(--color-border)] text-center">
        <p className="text-[color:var(--color-muted)] text-[10px] font-bold uppercase tracking-[0.5em]">
          Evolved from the Sound of Data • © 2026 Sonic Guardian
        </p>
      </footer>

      {/* Help Modal */}
      <HelpModal isOpen={showHelp} onClose={() => setShowHelp(false)} />
    </div>
  );
}
