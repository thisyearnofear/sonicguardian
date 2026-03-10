'use client';

import React, { useState, useRef, useEffect } from 'react';
import { extractSonicDNA, SonicDNA } from '@/lib/dna';
import { generateStrudelCode } from '@/lib/ai-agent';
import { generateAudio } from '@/lib/audio';
import {
  sessionManager,
  preferencesManager,
  isAudioEnabled,
  setAudioEnabled,
  isRealAIEnabled,
  setRealAIEnabled
} from '@/lib/storage';
import { getCurrentTheme, setTheme } from '@/lib/theme';
import { SonicVisualizer } from '@/lib/visualizer';
import { Header } from './Header';
import { useStarknetGuardian } from '../hooks/use-starknet-guardian';
import { playStrudelCode, stopStrudel, setDrawCallback, STRUDEL_PATTERN_LIBRARY } from '@/lib/strudel';
import { generateBlinding, isValidBtcAddress, encryptData, deriveKeyFromSignature, decryptData } from '@/lib/crypto';
import { uploadToIPFS, downloadFromIPFS } from '@/lib/ipfs';
import { useAccount } from '@starknet-react/core';
import { MobileUtils } from '@/lib/mobile';
import {
  generateEntropy,
  encodePattern,
  chunksToSeedPhrase,
  type MusicalChunk,
  type EncodedPattern
} from '@/lib/entropy-encoder';
import { StrudelEditor } from './StrudelEditor';
import { PatternExplorer } from './PatternExplorer';
import { HelpModal } from './HelpModal';
import { WelcomeModal } from './WelcomeModal';
import { Tooltip } from './Tooltip';
import { ProtocolForm } from './ProtocolForm';
import { TutorialTrigger } from './InteractiveTutorial';

interface SonicGuardianProps {
  onRecovery?: (hash: string) => void;
  onFailure?: () => void;
}

export default function SonicGuardian({ onRecovery, onFailure }: SonicGuardianProps) {
  const [phase, setPhase] = useState<'registration' | 'recovery'>('registration');
  const [secretVibe, setSecretVibe] = useState('');
  const [btcAddress, setBtcAddress] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');
  const [musicalChunks, setMusicalChunks] = useState<MusicalChunk[]>([]);
  const [seedPhrase, setSeedPhrase] = useState('');
  const [dna, setDna] = useState<SonicDNA | null>(null);
  const [dnaHash, setDnaHash] = useState('');
  const [blinding, setBlinding] = useState('');
  const [recoveryVibe, setRecoveryVibe] = useState('');
  const [status, setStatus] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [useRealAI, setUseRealAI] = useState(false);
  const [audioEnabled, setAudioState] = useState(true);
  const [currentTheme, setCurrentTheme] = useState<'light' | 'dark' | 'system'>('dark');
  const [showOnboarding, setShowOnboarding] = useState(true);
  const [previewPlayingId, setPreviewPlayingId] = useState<string | null>(null);
  const [selectedPatternId, setSelectedPatternId] = useState<string | null>(null);
  const [useSecureGeneration, setUseSecureGeneration] = useState(true);
  const [activeHaps, setActiveHaps] = useState<any[]>([]);
  const [isMobile, setIsMobile] = useState(false);
  const [progressIndicator, setProgressIndicator] = useState<any>(null);
  const [tooltips, setTooltips] = useState<Map<string, any>>(new Map());
  const [validationStates, setValidationStates] = useState<Map<string, { isValid: boolean; message: string; type: 'error' | 'warning' | 'success' }>>(new Map());
  const [showPatternExplorer, setShowPatternExplorer] = useState(false);
  const [showAllPatterns, setShowAllPatterns] = useState(false);

  const visualizerContainerRef = useRef<HTMLDivElement>(null);
  const visualizerRef = useRef<SonicVisualizer | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const formContainerRef = useRef<HTMLDivElement>(null);

  const { 
    isConnected, 
    registerGuardian, 
    verifyRecovery, 
    authorizeBtcRecovery, 
    getCommitment,
    authorizeWithAcousticSignature,
    verifyAcousticProof 
  } = useStarknetGuardian();
  const [isCommiting, setIsCommiting] = useState(false);
  const [onChainStatus, setOnChainStatus] = useState<'none' | 'pending' | 'success' | 'failed'>('none');
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  
  // Decentralized Backup State
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [backupCid, setBackupCid] = useState<string | null>(null);

  const { account } = useAccount();

  useEffect(() => {
    // Show welcome modal for first-time visitors
    const hasVisited = localStorage.getItem('sonic_guardian_visited');
    if (!hasVisited) {
      setShowWelcome(true);
      localStorage.setItem('sonic_guardian_visited', 'true');
    }
  }, []);

  useEffect(() => {
    return () => { stopStrudel(); };
  }, []);

  useEffect(() => {
    // Set up visual feedback callback
    setDrawCallback((haps: any[], time: number) => {
      // Filter to only active haps (currently playing)
      const active = haps.filter((h: any) => h.isActive(time));
      setActiveHaps(active);
    });

    return () => {
      setDrawCallback(null);
    };
  }, []);

  useEffect(() => {
    const theme = getCurrentTheme();
    setTheme(theme);
    const prefs = preferencesManager.get();
    setUseRealAI(prefs.useRealAI);
    setAudioState(prefs.audioEnabled);
  }, [phase]);

  useEffect(() => {
    // Initialize mobile detection
    const deviceInfo = MobileUtils.getDeviceInfo();
    setIsMobile(deviceInfo.isMobile);

    // Initialize mobile utilities if on mobile
    if (deviceInfo.isMobile) {
      // Optimize form inputs for mobile
      if (formContainerRef.current) {
        MobileUtils.optimizeFormInputs(formContainerRef.current);
      }

      // Set up progress indicator
      const progress = MobileUtils.createProgressIndicator(document.body);
      setProgressIndicator(progress);

      // Add contextual help tooltips
      const btcInput = document.querySelector('input[placeholder*="bc1q"]') as HTMLElement;
      if (btcInput) {
        const tooltip = MobileUtils.createTooltip(
          btcInput,
          'Enter your Bitcoin address to link to your sonic identity on Starknet.',
          'top'
        );
        setTooltips(prev => new Map(prev.set('btc-address', tooltip)));
      }
    }

    // Fix mobile viewport issues
    const cleanupViewport = MobileUtils.fixMobileViewport();

    return () => {
      visualizerRef.current?.dispose();
      cleanupViewport();
      if (progressIndicator) {
        progressIndicator.destroy();
      }
      tooltips.forEach(tooltip => tooltip.destroy());
    };
  }, [currentTheme, phase]);

  // Real-time validation for Bitcoin address
  useEffect(() => {
    if (btcAddress.trim() === '') {
      setValidationStates(prev => new Map(prev.set('btc-address', {
        isValid: true,
        message: 'Enter a Bitcoin address to link to your sonic identity',
        type: 'success'
      })));
      return;
    }

    if (!isValidBtcAddress(btcAddress)) {
      setValidationStates(prev => new Map(prev.set('btc-address', {
        isValid: false,
        message: 'Invalid Bitcoin address format. Please enter a valid bc1q, 1, or 3 address.',
        type: 'error'
      })));
    } else {
      setValidationStates(prev => new Map(prev.set('btc-address', {
        isValid: true,
        message: 'Valid Bitcoin address format',
        type: 'success'
      })));
    }
  }, [btcAddress, phase]);

  // Real-time validation for recovery phrase
  useEffect(() => {
    if (recoveryVibe.trim() === '') {
      setValidationStates(prev => new Map(prev.set('recovery-phrase', {
        isValid: true,
        message: 'Enter your musical pattern or vibe to verify your identity',
        type: 'success'
      })));
      return;
    }

    if (recoveryVibe.trim().length < 5) {
      setValidationStates(prev => new Map(prev.set('recovery-phrase', {
        isValid: false,
        message: 'Verification input should be at least 5 characters long',
        type: 'warning'
      })));
    } else {
      setValidationStates(prev => new Map(prev.set('recovery-phrase', {
        isValid: true,
        message: 'Valid recovery phrase format',
        type: 'success'
      })));
    }
  }, [recoveryVibe, phase]);

  // Real-time validation for custom vibe
  useEffect(() => {
    if (!useSecureGeneration && secretVibe.trim() !== '') {
      if (secretVibe.trim().length < 10) {
        setValidationStates(prev => new Map(prev.set('custom-vibe', {
          isValid: false,
          message: 'Custom vibe should be more descriptive (at least 10 characters)',
          type: 'warning'
        })));
      } else if (secretVibe.trim().length > 200) {
        setValidationStates(prev => new Map(prev.set('custom-vibe', {
          isValid: false,
          message: 'Custom vibe should be concise (under 200 characters)',
          type: 'warning'
        })));
      } else {
        setValidationStates(prev => new Map(prev.set('custom-vibe', {
          isValid: true,
          message: 'Good vibe description for AI synthesis',
          type: 'success'
        })));
      }
    } else {
      setValidationStates(prev => new Map(prev.set('custom-vibe', {
        isValid: true,
        message: 'Using secure 256-bit entropy generation',
        type: 'success'
      })));
    }
  }, [secretVibe, useSecureGeneration, phase]);

  useEffect(() => {
    if (visualizerContainerRef.current) {
      visualizerRef.current = new SonicVisualizer({
        container: visualizerContainerRef.current,
        theme: currentTheme === 'dark' ? 'dark' : 'light'
      });
    }
    return () => visualizerRef.current?.dispose();
  }, [currentTheme, phase]);

  const handleGenerate = async () => {
    setIsProcessing(true);
    setStatus('Minting Sonic Identity...');

    try {
      let code: string;
      let chunks: MusicalChunk[];
      let entropy: number;

      if (useSecureGeneration) {
        // Generate 256-bit entropy and encode to musical pattern
        const entropyBytes = generateEntropy();
        const encoded: EncodedPattern = encodePattern(entropyBytes);

        code = encoded.code;
        chunks = encoded.chunks;
        entropy = 256; // Full 256-bit entropy

        // Generate human-readable seed phrase
        const phrase = chunksToSeedPhrase(chunks);
        setSeedPhrase(phrase);
        setMusicalChunks(chunks);

        setStatus(`Random Pattern Generated (256 bits entropy, ${chunks.length} chunks)`);
      } else {
        // Use AI generation (less secure, but user-friendly)
        if (!secretVibe.trim()) {
          setStatus('Please define your musical vibe...');
          setIsProcessing(false);
          return;
        }

        const agentResponse = await generateStrudelCode(secretVibe, { useRealAI });
        code = agentResponse.code;
        chunks = [];
        entropy = 0;
      }

      setGeneratedCode(code);

      const dna = await extractSonicDNA(code, { includeTimestamp: true });

      if (dna) {
        setDna(dna);
        setDnaHash(dna.hash);

        // Generate blinding factor for Pedersen commitment
        const blindingFactor = generateBlinding();
        setBlinding(blindingFactor);

        // Store session with pattern code (not just description!)
        sessionManager.createSession(
          code, // ✅ Store actual pattern code
          dna.hash,
          dna.salt,
          btcAddress || undefined,
          blindingFactor
        );

        setStatus('Sonic Identity Ready. Hit ▶ to hear your signature.');
        setShowOnboarding(false);
        visualizerRef.current?.updateDNASequence(dna.dna);
        visualizerRef.current?.highlightParticles(Array.from({ length: 8 }, (_, i) => i));
        if (audioEnabled) playAudio('success');
      }
    } catch (error) {
      console.error(error);
      setStatus('Generation Failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCommitToStarknet = async () => {
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
      await registerGuardian(btcAddress, dnaHash, blinding);
      sessionManager.updateSession({ btcAddress });
      setOnChainStatus('success');
      setStatus('✅ Sonic Identity Anchored! Your pattern is now committed on-chain.');
    } catch (error) {
      console.error(error);
      setOnChainStatus('failed');
      setStatus('❌ Transaction failed. Ensure your wallet has gas funds.');
    } finally {
      setIsCommiting(false);
    }
  };

  const handleDecentralizedBackup = async () => {
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
  };

  const handlePlayback = async () => {
    if (!generatedCode) return;

    if (isAudioPlaying) {
      await stopStrudel();
      setIsAudioPlaying(false);
    } else {
      setStatus('Initializing audio engine...');
      setIsAudioPlaying(true);
      const ok = await playStrudelCode(generatedCode);
      if (!ok) {
        setIsAudioPlaying(false);
        setStatus('❌ Failed to start audio. Please try again.');
      } else {
        setStatus('Playing your sonic signature...');
      }
    }
  };

  const handlePreviewPattern = async (patternCode: string, id: string) => {
    if (previewPlayingId === id) {
      await stopStrudel();
      setPreviewPlayingId(null);
      setActiveHaps([]);
      return;
    }
    
    if (previewPlayingId) {
      await stopStrudel();
    }
    
    setActiveHaps([]);
    setPreviewPlayingId(id);
    setStatus(`Playing preview: ${id}...`);
    
    const ok = await playStrudelCode(patternCode);
    if (!ok) {
      setPreviewPlayingId(null);
      setActiveHaps([]);
      setStatus('❌ Audio engine busy or initialization failed. Try clicking again.');
    }
  };

  const handleSuggestIdea = async () => {
    setStatus('Generating sonic ideas via Venice AI...');
    setIsProcessing(true);
    try {
      const response = await generateStrudelCode(
        'Give me one single evocative sentence describing a unique musical vibe or mood — no code, just a description.',
        { useRealAI }
      );
      // The AI will return a vibe description, set it as the input
      const idea = response.code.replace(/[`"']/g, '').trim();
      setSecretVibe(idea);
      setStatus('Idea loaded. Click Mint Sonic Identity to synthesize it.');
    } catch {
      setStatus('Could not generate idea. Try typing your own vibe.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRecovery = async () => {
    if (!recoveryVibe.trim() || !btcAddress) {
      setStatus('Please provide your vibe (or CID) and Bitcoin address.');
      return;
    }

    setIsProcessing(true);
    setStatus('Verifying authorship of sonic identity...');

    try {
      let finalDnaHash = '';
      let finalCode = '';

      // 1. Resolve DNA (from IPFS or Vibe)
      if (recoveryVibe.startsWith('Qm')) {
        setStatus('🌐 Fetching encrypted identity from IPFS...');
        const encryptedData = await downloadFromIPFS(recoveryVibe);
        if (!encryptedData) throw new Error('Could not find identity on IPFS');
        if (!account) throw new Error('Wallet not connected');

        setStatus('🔐 Deriving decryption key from your wallet...');
        const signatureResult = await account.signMessage({
          message: "SonicGuardian Decentralized Backup - Signature used to derive your private encryption key. Never share this signature.",
        } as any);
        const signatureStr = Array.isArray(signatureResult) ? signatureResult.join('') : JSON.stringify(signatureResult);
        const decryptionKey = await deriveKeyFromSignature(signatureStr);
        
        setStatus('🔓 Decrypting sonic identity...');
        const decryptedData = await decryptData(encryptedData, decryptionKey);
        const backup = JSON.parse(decryptedData);
        finalDnaHash = backup.dnaHash;
        finalCode = backup.code;
      } else {
        setStatus('Extracting DNA from musical pattern...');
        const agentResponse = await generateStrudelCode(recoveryVibe, { useRealAI });
        const dna = await extractSonicDNA(agentResponse.code);
        if (!dna) throw new Error('DNA extraction failed');
        finalDnaHash = dna.hash;
        finalCode = agentResponse.code;
      }

      // 2. TRUE ZK PROOF: Authorize via Acoustic Signature
      // This proves knowledge of DNA without revealing it on-chain
      setStatus('🔮 Generating ZK-Proof (Acoustic Signature)...');
      await authorizeWithAcousticSignature(btcAddress, finalDnaHash);

      setStatus('✅ Authorship Verified! ZK-Signature matches on-chain public key.');
      
      // Update visualizer
      const recoveryDna = await extractSonicDNA(finalCode);
      if (recoveryDna) {
        setDna(recoveryDna);
        setGeneratedCode(finalCode);
        visualizerRef.current?.updateDNASequence(recoveryDna.dna);
        visualizerRef.current?.highlightParticles(Array.from({ length: 12 }, (_, i) => i));
      }

      sessionManager.addRecoveryAttempt(recoveryVibe.trim(), true, finalDnaHash);
      onRecovery?.(finalDnaHash);
    } catch (error) {
      console.error(error);
      setStatus('❌ Verification Failed. Pattern mismatch or decryption error.');
      onFailure?.();
    } finally {
      setIsProcessing(false);
    }
  };

  const playAudio = (type: any) => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    generateAudio(audioContextRef.current, type);
  };



  return (
    <div className="relative min-h-screen bg-[color:var(--background)] selection:bg-[color:var(--color-primary)] selection:text-white pt-20">
      <Header />
      <div className="noise" />
      <div className="bg-gradient-mesh" />

      <main className="relative z-10 container mx-auto px-4 py-12 flex flex-col items-center">
        {/* Header — tight, just the badge + title */}
        <header className="text-center mb-6 space-y-3 max-w-2xl relative">
          <div className="inline-block px-3 py-1 rounded-full border border-[color:var(--color-primary)]/40 text-[color:var(--color-primary)] text-[10px] font-bold tracking-widest uppercase animate-pulse-soft">
            Starknet Privacy Track ✦ Sonic Identity Protocol
          </div>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tighter text-gradient leading-[1.05]">
            Sonic Guardian
          </h1>

          {/* Help Button */}
          <button
            onClick={() => setShowHelp(true)}
            className="absolute top-0 right-0 w-8 h-8 rounded-full border border-[color:var(--color-primary)]/30 text-[color:var(--color-primary)] hover:border-[color:var(--color-primary)] hover:bg-[color:var(--color-primary)]/10 transition-all flex items-center justify-center text-sm font-bold"
            aria-label="Help"
          >
            ?
          </button>
        </header>

        {/* Core Protocol Container */}
        <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">

          {/* Visualizer — full size, with narrative overlaid inside */}
          <div className="lg:col-span-12 flex flex-col items-center justify-center mb-4">
            <div
              ref={visualizerContainerRef}
              className="relative w-full h-[300px] md:h-[500px] animate-float"
            >
              {/* Central Glow */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-[color:var(--color-primary)] rounded-full blur-[100px] opacity-30" />

              {/* Problem → Concept → Utility — float over the visualizer */}
              <div className="absolute bottom-4 left-0 right-0 flex flex-col sm:flex-row gap-2 px-4 justify-center">
                <div className="glass px-3 py-2 rounded-xl border border-red-500/20 backdrop-blur-md max-w-[200px]">
                  <p className="text-[9px] font-bold text-red-400 uppercase tracking-widest mb-0.5">😩 The Problem</p>
                  <p className="text-[10px] text-[color:var(--color-muted)] leading-snug">On-chain identity is invisible — addresses are opaque, impersonal, and impossible to verify humanly.</p>
                </div>
                <div className="glass px-3 py-2 rounded-xl border border-[color:var(--color-primary)]/30 backdrop-blur-md max-w-[200px]">
                  <p className="text-[9px] font-bold text-[color:var(--color-primary)] uppercase tracking-widest mb-0.5">🎵 The Concept</p>
                  <p className="text-[10px] text-[color:var(--color-muted)] leading-snug">Your vibe becomes your on-chain identity. Musical patterns create human-verifiable, privacy-preserving signatures.</p>
                </div>
                <div className="glass px-3 py-2 rounded-xl border border-[color:var(--color-success)]/30 backdrop-blur-md max-w-[200px]">
                  <p className="text-[9px] font-bold text-[color:var(--color-success)] uppercase tracking-widest mb-0.5">🔒 The Utility</p>
                  <p className="text-[10px] text-[color:var(--color-muted)] leading-snug">Commit your sonic identity to Starknet via Pedersen commitments. Verify authorship without revealing your pattern.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Pattern Showcase Section - Interactive Demo */}
          <div className="lg:col-span-12 mb-12">
            <div className="text-center mb-6">
              <h3 className="text-sm font-bold uppercase tracking-[0.3em] text-[color:var(--color-muted)] mb-2">
                Strudel Synthesis Library
              </h3>
              <p className="text-xs text-[color:var(--color-muted)]">
                Click to select • Then hit ▶ to hear
              </p>
            </div>

            {/* Pattern Cards Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
              {(showAllPatterns ? STRUDEL_PATTERN_LIBRARY : STRUDEL_PATTERN_LIBRARY.slice(0, 6)).map((pattern) => (
                <button
                  key={pattern.name}
                  onClick={() => setSelectedPatternId(pattern.name)}
                  className={`group p-4 rounded-xl border transition-all text-left ${selectedPatternId === pattern.name
                    ? 'border-[color:var(--color-primary)] bg-[color:var(--color-primary)]/10 scale-105 shadow-lg shadow-[color:var(--color-primary)]/20'
                    : 'border-[color:var(--color-border)] hover:border-[color:var(--color-primary)]/40 hover:scale-102'
                    }`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-2 transition-all ${selectedPatternId === pattern.name
                    ? 'bg-[color:var(--color-primary)]/20 text-[color:var(--color-primary)]'
                    : 'bg-[color:var(--color-foreground)]/5 text-[color:var(--color-muted)]'
                    }`}>
                    {selectedPatternId === pattern.name ? '✓' : '♪'}
                  </div>
                  <p className="text-[10px] font-bold mb-1">{pattern.name}</p>
                  <p className="text-[8px] text-[color:var(--color-muted)] line-clamp-2">{pattern.vibe}</p>
                </button>
              ))}
            </div>

            {/* Progressive Disclosure Toggle */}
            <div className="flex justify-center mb-8">
              <button
                onClick={() => setShowAllPatterns(!showAllPatterns)}
                className="px-6 py-2 rounded-full border border-[color:var(--color-primary)]/30 text-[color:var(--color-primary)] text-[10px] font-bold uppercase tracking-widest hover:bg-[color:var(--color-primary)]/10 transition-all flex items-center gap-2"
              >
                {showAllPatterns ? '↑ Show Less' : `↓ Show All (${STRUDEL_PATTERN_LIBRARY.length})`}
              </button>
            </div>

            {/* Code Display Section - Shows when pattern selected */}
            {selectedPatternId && (
              <div className="animate-in fade-in slide-in-from-top-4 duration-500">
                <div className="glass rounded-xl p-6 max-w-3xl mx-auto">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <h4 className="text-xs font-bold uppercase tracking-widest text-[color:var(--color-primary)]">
                        {STRUDEL_PATTERN_LIBRARY.find(p => p.name === selectedPatternId)?.name}
                      </h4>
                      <span className="px-2 py-0.5 rounded bg-[color:var(--color-primary)]/10 border border-[color:var(--color-primary)]/20 text-[8px] font-bold text-[color:var(--color-primary)] uppercase">
                        Strudel Code
                      </span>
                    </div>
                    <button
                      onClick={() => handlePreviewPattern(
                        STRUDEL_PATTERN_LIBRARY.find(p => p.name === selectedPatternId)!.code,
                        selectedPatternId
                      )}
                      className={`px-4 py-2 rounded-lg border transition-all flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest ${previewPlayingId === selectedPatternId
                        ? 'bg-[color:var(--color-primary)]/20 border-[color:var(--color-primary)] text-[color:var(--color-primary)]'
                        : 'bg-black/40 border-white/10 text-white/60 hover:text-white hover:border-white/30'
                        }`}
                    >
                      {previewPlayingId === selectedPatternId ? (
                        <><span className="w-2 h-2 bg-[color:var(--color-primary)] rounded-full animate-pulse" /> Stop</>
                      ) : (
                        <>▶ Play</>
                      )}
                    </button>
                  </div>

                  <div className={`bg-black/80 rounded-xl p-6 font-mono text-xs text-blue-400 border shadow-2xl relative group transition-all duration-150 ${previewPlayingId === selectedPatternId && activeHaps.length > 0
                    ? 'border-[color:var(--color-primary)] shadow-[0_0_30px_rgba(var(--color-primary-rgb),0.3)] scale-[1.01]'
                    : 'border-blue-500/20'
                    }`}>
                    <button
                      onClick={() => navigator.clipboard.writeText(STRUDEL_PATTERN_LIBRARY.find(p => p.name === selectedPatternId)!.code)}
                      className="absolute top-3 right-3 p-2 rounded bg-white/5 hover:bg-white/10 text-white/40 hover:text-white/80 transition-all text-xs"
                      title="Copy code"
                    >
                      📋
                    </button>

                    {/* Activity indicator */}
                    {previewPlayingId === selectedPatternId && activeHaps.length > 0 && (
                      <div className="absolute top-3 left-3 flex items-center gap-2">
                        <span className="w-2 h-2 bg-[color:var(--color-primary)] rounded-full animate-pulse" />
                        <span className="text-[8px] text-[color:var(--color-primary)] font-bold uppercase tracking-wider">
                          {activeHaps.length} event{activeHaps.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                    )}

                    <code className={`whitespace-pre-wrap break-all leading-relaxed tracking-wider block ${previewPlayingId === selectedPatternId && activeHaps.length > 0 ? 'mt-6' : ''
                      }`}>
                      {STRUDEL_PATTERN_LIBRARY.find(p => p.name === selectedPatternId)?.code.split(/(\(|\)|\.|\"|\')/).map((part, i) => {
                        if (['(', ')', '.'].includes(part)) return <span key={i} className="opacity-40">{part}</span>;
                        if (part === '"' || part === "'") return <span key={i} className="text-pink-400">{part}</span>;
                        if (['note', 's', 'slow', 'fast', 'distort', 'lpf', 'lpq', 'gain', 'stack', 'room'].includes(part))
                          return <span key={i} className="text-white font-bold">{part}</span>;
                        return <span key={i}>{part}</span>;
                      })}
                    </code>
                  </div>

                  <p className="text-[9px] text-[color:var(--color-muted)] mt-3 text-center italic">
                    This pattern demonstrates Strudel's live coding syntax • Hear how code becomes sound
                  </p>

                  {/* Learn Strudel CTA */}
                  <div className="mt-6 pt-6 border-t border-[color:var(--color-border)]">
                    <button
                      onClick={() => setShowPatternExplorer(true)}
                      className="w-full py-4 rounded-xl bg-gradient-to-r from-[color:var(--color-primary)]/20 to-[color:var(--color-accent)]/20 border border-[color:var(--color-primary)]/30 text-[color:var(--color-primary)] font-bold text-xs uppercase tracking-widest hover:from-[color:var(--color-primary)]/30 hover:to-[color:var(--color-accent)]/30 transition-all flex items-center justify-center gap-3"
                    >
                      🎓 Explore 16+ Strudel Features
                      <span className="px-2 py-0.5 rounded bg-[color:var(--color-primary)]/20 text-[9px]">Interactive</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Interface Cards */}
          <div className="lg:col-span-12 max-w-5xl mx-auto w-full grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">

            {/* Input Side - Streamlined */}
            <ProtocolForm
              phase={phase}
              btcAddress={btcAddress}
              setBtcAddress={setBtcAddress}
              secretVibe={secretVibe}
              setSecretVibe={setSecretVibe}
              recoveryVibe={recoveryVibe}
              setRecoveryVibe={setRecoveryVibe}
              dnaHash={dnaHash}
              useSecureGeneration={useSecureGeneration}
              setUseSecureGeneration={setUseSecureGeneration}
              isProcessing={isProcessing}
              isConnected={isConnected}
              onChainStatus={onChainStatus}
              onGenerate={handleGenerate}
              onRecovery={handleRecovery}
              onCommit={handleCommitToStarknet}
              onSwitchPhase={() => {
                setIsLocked(!isLocked);
                setPhase(phase === 'registration' ? 'recovery' : 'registration');
                setStatus('');
              }}
              validationStates={validationStates}
              isCommiting={isCommiting}
              onVerifyOnChain={async () => {
                setStatus('Reading commitment from contract...');
                const commitment = await getCommitment(btcAddress);
                if (commitment && commitment !== '0') {
                  setStatus(`✅ On-chain verified! Commitment: ${commitment.slice(0, 10)}...`);
                } else {
                  setStatus('⚠️ No commitment found on-chain');
                }
              }}
              onDecentralizedBackup={handleDecentralizedBackup}
              isBackingUp={isBackingUp}
              backupCid={backupCid}
              setStatus={setStatus}
            />

            {/* Tech Output Side */}
            <div className="glass rounded-[var(--border-radius)] p-8 flex flex-col justify-between overflow-hidden relative">
              {/* Strudel Logo/Watermark */}
              <div className="absolute -right-4 -bottom-4 opacity-5 font-bold text-8xl pointer-events-none tracking-tighter italic">STRUDEL</div>

              <div className="space-y-6 relative z-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[color:var(--color-success)] animate-pulse" />
                  <h3 className="text-xs font-bold uppercase tracking-[0.3em] text-[color:var(--color-muted)]">Live Sonic Identity Analysis</h3>
                </div>
                {!status && !generatedCode && (
                  <div className="flex gap-1">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="w-1 h-3 bg-[color:var(--color-primary)]/20 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.1}s` }} />
                    ))}
                  </div>
                )}
              </div>

                {status ? (
                  <div className="animate-in fade-in slide-in-from-left-2 duration-300">
                    <p className="text-xl font-medium tracking-tight leading-snug">
                      {status}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="p-4 rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-foreground)]/[0.02] border-dashed relative overflow-hidden group">
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[color:var(--color-primary)]/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-[2000ms] infinite" />
                      <div className="relative z-10 space-y-3">
                        <div className="flex items-center justify-between text-[9px] font-mono text-[color:var(--color-muted)] border-b border-[color:var(--color-border)] pb-2 mb-2">
                          <span className="flex items-center gap-1.5">
                            <span className="w-1 h-1 bg-[color:var(--color-success)] rounded-full animate-pulse" />
                            NETWORK_STABLE
                          </span>
                          <span className="opacity-50">v1.2.0-ACX</span>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[10px] font-mono text-[color:var(--color-muted)] leading-relaxed">
                            <span className="text-[color:var(--color-primary)]">▸</span> <span className="text-[color:var(--color-primary)] font-bold">SYSTEM_READY:</span> Waiting for acoustic input...
                          </p>
                          <p className="text-[10px] font-mono text-[color:var(--color-muted)]/60 leading-relaxed italic">
                            Protocol ready. Your sonic identity will appear here once minted.
                          </p>
                        </div>
                        <div className="pt-2 grid grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <div className="flex justify-between text-[8px] font-bold text-[color:var(--color-muted)]/40 uppercase">
                              <span>Env Noise</span>
                              <span>-84dB</span>
                            </div>
                            <div className="h-0.5 bg-[color:var(--color-border)]/30 rounded-full overflow-hidden">
                              <div className="h-full bg-[color:var(--color-primary)]/40 w-1/3 animate-pulse" />
                            </div>
                          </div>
                          <div className="space-y-1">
                            <div className="flex justify-between text-[8px] font-bold text-[color:var(--color-muted)]/40 uppercase">
                              <span>Quantum Drift</span>
                              <span>0.002%</span>
                            </div>
                            <div className="h-0.5 bg-[color:var(--color-border)]/30 rounded-full overflow-hidden">
                              <div className="h-full bg-[color:var(--color-accent)]/40 w-1/2 animate-pulse" />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {generatedCode && (
                  <div className="space-y-4 animate-in zoom-in-95 duration-500">
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <h4 className="text-[10px] font-bold uppercase tracking-widest text-[color:var(--color-primary)]">Your Sonic Identity</h4>
                          <span className="px-1.5 py-0.5 rounded bg-[color:var(--color-primary)]/10 border border-[color:var(--color-primary)]/20 text-[8px] font-bold text-[color:var(--color-primary)] uppercase tracking-tighter">Live Code</span>
                        </div>
                      </div>

                      {/* Strudel Editor - Full REPL Experience */}
                      <StrudelEditor
                        initialCode={generatedCode}
                        onCodeChange={(newCode) => {
                          setGeneratedCode(newCode);
                          // Regenerate DNA hash when code changes
                          extractSonicDNA(newCode, { includeTimestamp: true }).then(newDna => {
                            if (newDna) {
                              setDna(newDna);
                              setDnaHash(newDna.hash);
                            }
                          });
                        }}
                        readOnly={false}
                      />

                      <p className="text-[9px] text-[color:var(--color-muted)] mt-3 italic">
                        Edit the code above to customize your pattern. Changes update your identity's DNA hash.
                      </p>
                    </div>

                    {/* Gene Network Breakdown */}
                    {dna && (
                      <div className="space-y-6 pt-6 border-t border-white/5">
                        <div className="flex items-center justify-between">
                          <h4 className="text-[10px] font-bold uppercase tracking-widest text-[color:var(--color-muted)]">
                            {musicalChunks.length > 0 ? 'Sonic Identity Details' : 'Acoustic Signature Breakdown'}
                          </h4>
                        </div>

                        {musicalChunks.length > 0 ? (
                          <div className="space-y-4">
                            <div className="p-4 rounded-xl border border-[color:var(--color-warning)]/30 bg-[color:var(--color-warning)]/5">
                              <p className="text-[9px] font-bold text-[color:var(--color-warning)] uppercase tracking-widest mb-2">
                                💾 Your Identity Details
                              </p>
                              <p className="text-[10px] text-[color:var(--color-muted)] mb-3">
                                Save these details to verify your sonic identity in the future.
                              </p>
                              <div className="space-y-2">
                                {musicalChunks.map((chunk, i) => (
                                  <div
                                    key={i}
                                    className="flex items-start gap-3 p-2 rounded-lg bg-[color:var(--color-foreground)]/5 border border-[color:var(--color-border)]"
                                  >
                                    <span className="text-[10px] font-bold text-[color:var(--color-primary)] min-w-[20px]">
                                      {i + 1}.
                                    </span>
                                    <span className="text-[11px] font-medium text-[color:var(--color-foreground)] flex-1">
                                      {chunk.text}
                                    </span>
                                    <span className="text-[8px] text-[color:var(--color-muted)] opacity-50">
                                      {chunk.bits}b
                                    </span>
                                  </div>
                                ))}
                              </div>
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(seedPhrase);
                                  setStatus('Identity details copied to clipboard!');
                                }}
                                className="mt-3 w-full py-2 rounded-lg bg-[color:var(--color-primary)]/10 border border-[color:var(--color-primary)]/30 text-[10px] font-bold text-[color:var(--color-primary)] hover:bg-[color:var(--color-primary)]/20 transition-all"
                              >
                                📋 Copy All Chunks
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div>
                              <h4 className="text-[10px] font-bold uppercase tracking-widest text-[color:var(--color-primary)] mb-3 opacity-60">Resonant Features</h4>
                              <div className="flex flex-wrap gap-2">
                                {dna.features.map((feature: string) => (
                                  <div
                                    key={feature}
                                    className="group relative flex items-center gap-2 px-3 py-1.5 rounded-full bg-[color:var(--color-primary)]/5 border border-[color:var(--color-primary)]/20 text-[color:var(--color-primary)] text-[10px] font-bold uppercase tracking-wider hover:bg-[color:var(--color-primary)]/10 transition-all cursor-default"
                                  >
                                    <div className="w-1.5 h-1.5 rounded-full bg-[color:var(--color-primary)] shadow-[0_0_8px_var(--color-primary)]" />
                                    {feature}
                                  </div>
                                ))}
                              </div>
                            </div>

                            <div>
                              <h4 className="text-[10px] font-bold uppercase tracking-widest text-[color:var(--color-primary)] mb-3 opacity-60">Pattern Intensity</h4>
                              <div className="grid grid-cols-4 sm:grid-cols-8 gap-1 opacity-20">
                                {Array.from({ length: 16 }).map((_, i) => (
                                  <div
                                    key={i}
                                    className="aspect-square bg-[color:var(--color-primary)] rounded-sm animate-pulse"
                                    style={{
                                      animationDelay: `${i * 100}ms`,
                                      opacity: 0.2 + (Math.sin(i * 0.5) * 0.1)
                                    }}
                                  />
                                ))}
                              </div>
                            </div>
                          </div>
                        )}

                        {dnaHash && (
                          <div className="flex flex-col sm:flex-row justify-between gap-4 pt-4 border-t border-white/5">
                            <div className="overflow-hidden flex-1">
                              <h4 className="text-[10px] font-bold uppercase tracking-widest text-[color:var(--color-muted)] mb-1">DNA Hash</h4>
                              <p className="font-mono text-[9px] sm:text-[10px] truncate opacity-60 italic">{dnaHash}</p>
                            </div>
                            {musicalChunks.length > 0 && (
                              <div className="sm:text-center shrink-0">
                                <h4 className="text-[10px] font-bold uppercase tracking-widest text-[color:var(--color-muted)] mb-1">Entropy</h4>
                                <p className="text-[10px] font-bold text-[color:var(--color-success)] uppercase tracking-widest flex items-center gap-2">
                                  🔒 256 bits
                                </p>
                              </div>
                            )}
                            <div className="sm:text-right shrink-0">
                              <h4 className="text-[10px] font-bold uppercase tracking-widest text-[color:var(--color-muted)] mb-1">State</h4>
                              <p className="text-[10px] font-bold text-[color:var(--color-success)] uppercase tracking-widest flex items-center gap-2 sm:justify-end">
                                <span className="w-1 h-1 bg-[color:var(--color-success)] rounded-full animate-ping" />
                                Immutable Anchor
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {!generatedCode && !status && (
                  <div className="flex flex-col items-center justify-center h-full py-12 text-center space-y-6">
                    {previewPlayingId ? (
                      // Show the currently playing preview pattern
                      <div className="w-full space-y-4 animate-in fade-in duration-500">
                        <div className="flex items-center justify-center gap-2 mb-4">
                          <div className="w-2 h-2 bg-[color:var(--color-primary)] rounded-full animate-pulse" />
                          <p className="text-xs font-bold text-[color:var(--color-primary)] uppercase tracking-widest">
                            Now Playing: {STRUDEL_PATTERN_LIBRARY.find(p => p.name === previewPlayingId)?.name}
                          </p>
                        </div>
                        <div className="bg-black/60 rounded-xl p-6 font-mono text-xs text-blue-400 border border-blue-500/20 shadow-2xl max-w-[500px] mx-auto">
                          <code className="whitespace-pre-wrap break-all leading-relaxed tracking-wider">
                            {STRUDEL_PATTERN_LIBRARY.find(p => p.name === previewPlayingId)?.code.split(/(\(|\)|\.|\"|\')/).map((part, i) => {
                              if (['(', ')', '.'].includes(part)) return <span key={i} className="opacity-40">{part}</span>;
                              if (part === '"' || part === "'") return <span key={i} className="text-pink-400">{part}</span>;
                              if (['s', 'slow', 'fast', 'distort', 'lpf', 'hpf', 'gain', 'stack', 'note', 'room'].includes(part))
                                return <span key={i} className="text-white font-bold">{part}</span>;
                              return <span key={i}>{part}</span>;
                            })}
                          </code>
                        </div>
                        <p className="text-[9px] text-[color:var(--color-muted)] italic">
                          Click a pattern above to preview, or mint your own sonic identity below
                        </p>
                      </div>
                    ) : (
                      // Default empty state
                      <>
                        <div className="relative">
                          <div className="absolute inset-0 bg-[color:var(--color-primary)] blur-3xl opacity-10 animate-pulse" />
                          <div className="relative text-6xl opacity-30 animate-float">🎵</div>
                        </div>
                        <div className="space-y-3 max-w-[280px]">
                          <div className="text-2xl font-bold opacity-40 italic tracking-tight">Ready to synthesize</div>
                          <p className="text-[10px] text-[color:var(--color-muted)] leading-relaxed">
                            Click ▶ on any pattern to preview, or mint your own sonic identity below. Your acoustic signature will materialize here as creative code.
                          </p>
                          <div className="flex items-center justify-center gap-2 pt-2">
                            <div className="w-1 h-1 bg-[color:var(--color-primary)] rounded-full animate-ping" />
                            <div className="w-1 h-1 bg-[color:var(--color-accent)] rounded-full animate-ping" style={{ animationDelay: '0.2s' }} />
                            <div className="w-1 h-1 bg-[color:var(--color-success)] rounded-full animate-ping" style={{ animationDelay: '0.4s' }} />
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Bottom Info */}
              <div className="pt-8 border-t border-[color:var(--color-border)] mt-8 flex justify-between items-center text-[9px] font-bold uppercase tracking-widest text-[color:var(--color-muted)]">
                <div>v1.2.0 Stable Network</div>
                <div className="flex gap-4">
                  <a href="https://strudel.cc" target="_blank" className="hover:text-[color:var(--color-primary)] transition-colors">Strudel.cc</a>
                  <a href="/docs/STARKNET.md" target="_blank" className="hover:text-[color:var(--color-primary)] transition-colors">Dev Docs</a>
                  <a href="/docs/SKILL.md" target="_blank" className="hover:text-[color:var(--color-primary)] transition-colors text-[color:var(--color-accent)]">AI Agent Skill</a>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Floating AI Toggle (Venice AI Focus) */}
        <div className="fixed bottom-8 right-8 z-50">
          <button
            onClick={() => {
              const enabled = !isRealAIEnabled();
              setRealAIEnabled(enabled);
              setUseRealAI(enabled);
            }}
            className={`glass px-6 py-3 rounded-full flex items-center gap-3 font-bold text-xs tracking-widest uppercase transition-all hover:scale-105 active:scale-95 ${useRealAI ? 'text-[color:var(--color-success)] shadow-[0_0_20px_rgba(16,185,129,0.3)]' : 'text-[color:var(--color-muted)]'}`}
          >
            <div className={`w-2 h-2 rounded-full ${useRealAI ? 'bg-[color:var(--color-success)] animate-pulse' : 'bg-[color:var(--color-muted)]'}`} />
            {useRealAI ? 'Venice AI Synthesis' : 'Inference Offline'}
          </button>
        </div>

        {/* Interactive Tutorial Trigger */}
        <TutorialTrigger onTrigger={() => {
          // Logic to trigger tutorial can be added here
          console.log('Tutorial triggered');
        }} />

        {/* Protocol Analysis Section */}
        <section className="mt-24 w-full max-w-4xl grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="space-y-4">
            <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-[color:var(--color-primary)]">01. Agentic Synthesis</h4>
            <p className="text-xs text-[color:var(--color-muted)] leading-relaxed">
              Your "vibe" is translated agentically by <span className="text-[color:var(--color-foreground)] font-medium">Venice AI</span> into valid Strudel pattern code, bridging intuition with cryptographic precision.
            </p>
          </div>
          <div className="space-y-4">
            <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-[color:var(--color-accent)]">02. Acoustic Verification</h4>
            <p className="text-xs text-[color:var(--color-muted)] leading-relaxed">
              We leverage Cairo's efficiency to verify the resulting <span className="text-[color:var(--color-foreground)] font-medium">Acoustic Proofs</span>, ensuring your identity is both heard and cryptographically sound.
            </p>
          </div>
          <div className="space-y-4">
            <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-[color:var(--color-success)]">03. Privacy Anchoring</h4>
            <p className="text-xs text-[color:var(--color-muted)] leading-relaxed">
              Credentials are anchored to Starknet using <span className="text-[color:var(--color-foreground)] font-medium">Shielded Protocols</span>, ensuring a privacy-first experience for the entire ecosystem.
            </p>
          </div>
        </section>
      </main>

      <footer className="relative z-10 py-12 mt-12 border-t border-[color:var(--color-border)] text-center">
        <p className="text-[color:var(--color-muted)] text-[10px] font-bold uppercase tracking-[0.5em]">
          Evolved from the Sound of Data • © 2026 Sonic Guardian
        </p>
      </footer>

      {/* Pattern Explorer Modal */}
      {showPatternExplorer && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/90 backdrop-blur-sm"
            onClick={() => setShowPatternExplorer(false)}
          />

          {/* Modal Content */}
          <div className="relative w-full max-w-7xl max-h-[90vh] overflow-y-auto bg-[color:var(--background)] rounded-3xl border border-[color:var(--color-border)] shadow-2xl animate-in fade-in zoom-in-95 duration-300">
            {/* Close Button */}
            <button
              onClick={() => setShowPatternExplorer(false)}
              className="absolute top-4 right-4 z-10 px-4 py-2 rounded-full bg-[color:var(--color-foreground)] text-[color:var(--background)] font-bold text-xs uppercase tracking-wider hover:scale-105 transition-all"
            >
              ✕ Close
            </button>

            {/* Pattern Explorer Component */}
            <PatternExplorer onPatternSelect={(code) => {
              // Optionally handle pattern selection
              console.log('Pattern selected from explorer:', code);
            }} />
          </div>
        </div>
      )}

      {/* Help Modal */}
      <HelpModal isOpen={showHelp} onClose={() => setShowHelp(false)} />

      {/* Welcome Modal */}
      {showWelcome && <WelcomeModal onClose={() => setShowWelcome(false)} />}
    </div>
  );
}
