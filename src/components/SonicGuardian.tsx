'use client';

import React, { useState, useRef, useEffect } from 'react';
import { extractSonicDNA, SonicDNA } from '../lib/dna';
import { generateStrudelCode } from '../lib/ai-agent';
import { generateAudio } from '../lib/audio';
import {
  sessionManager,
  preferencesManager,
  isAudioEnabled,
  setAudioEnabled,
  isRealAIEnabled,
  setRealAIEnabled
} from '../lib/storage';
import { getCurrentTheme, setTheme } from '../lib/theme';
import { SonicVisualizer } from '../lib/visualizer';
import { WalletButton } from './WalletButton';
import { useStarknetGuardian } from '../hooks/use-starknet-guardian';
import { playStrudelCode, stopStrudel, STRUDEL_PATTERN_LIBRARY } from '../lib/strudel';
import { generateBlinding, isValidBtcAddress } from '../lib/crypto';
import { 
  generateEntropy,
  encodePattern,
  chunksToSeedPhrase,
  type MusicalChunk,
  type EncodedPattern
} from '../lib/entropy-encoder';
import { StrudelEditor } from './StrudelEditor';
import GiftApp from './GiftApp';

interface SonicGuardianProps {
  onRecovery?: (hash: string) => void;
  onFailure?: () => void;
  initialMode?: 'protocol' | 'gift';
}

const ProtocolHeader = () => (
  <div className="flex items-center gap-4 mb-8 p-4 rounded-2xl bg-[color:var(--color-primary)]/5 border border-[color:var(--color-primary)]/20 animate-in fade-in slide-in-from-top-4 duration-700">
    <div className="w-12 h-12 rounded-full bg-[color:var(--color-primary)]/20 flex items-center justify-center text-xl">🛡️</div>
    <div>
      <h3 className="text-sm font-bold uppercase tracking-widest text-[color:var(--color-primary)]">Guardian Protocol Core</h3>
      <p className="text-[10px] text-[color:var(--color-muted)]">Enterprise-grade ZK-recovery for high-value Bitcoin assets.</p>
    </div>
  </div>
);

const ShowcaseHeader = () => (
  <div className="flex items-center gap-4 mb-8 p-4 rounded-2xl bg-[color:var(--color-accent)]/5 border border-[color:var(--color-accent)]/20 animate-in fade-in slide-in-from-top-4 duration-700">
    <div className="w-12 h-12 rounded-full bg-[color:var(--color-accent)]/20 flex items-center justify-center text-xl">🎁</div>
    <div>
      <h3 className="text-sm font-bold uppercase tracking-widest text-[color:var(--color-accent)]">Showcase: Bitcoin Birthday Cards</h3>
      <p className="text-[10px] text-[color:var(--color-muted)]">A frictionless "Vibe Coding" demo: Gift Bitcoin with a musical soul.</p>
    </div>
  </div>
);

export default function SonicGuardian({ onRecovery, onFailure, initialMode = 'protocol' }: SonicGuardianProps) {
  const [activeTab, setActiveTab] = useState<'protocol' | 'gift'>(initialMode);
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

  const visualizerContainerRef = useRef<HTMLDivElement>(null);
  const visualizerRef = useRef<SonicVisualizer | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  const { isConnected, registerGuardian, verifyRecovery, authorizeBtcRecovery } = useStarknetGuardian();
  const [isCommiting, setIsCommiting] = useState(false);
  const [onChainStatus, setOnChainStatus] = useState<'none' | 'pending' | 'success' | 'failed'>('none');
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);

  useEffect(() => {
    return () => { stopStrudel(); };
  }, []);

  useEffect(() => {
    // Set up visual feedback callback
    const { setDrawCallback } = require('../lib/strudel');
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
    setCurrentTheme(theme as any);
    setTheme(theme as any);
    const prefs = preferencesManager.get();
    setUseRealAI(prefs.useRealAI);
    setAudioState(prefs.audioEnabled);
  }, []);

  useEffect(() => {
    if (visualizerContainerRef.current) {
      visualizerRef.current = new SonicVisualizer({
        container: visualizerContainerRef.current,
        theme: currentTheme === 'dark' ? 'dark' : 'light'
      });
    }
    return () => visualizerRef.current?.dispose();
  }, [currentTheme]);

  const handleGenerate = async () => {
    setIsProcessing(true);
    setStatus('Generating Musical Seed Phrase...');

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
        
        setStatus(`Secure Pattern Generated (256 bits entropy, ${chunks.length} chunks)`);
      } else {
        // Use AI generation (less secure, but user-friendly)
        if (!secretVibe.trim()) {
          setStatus('Please define your sonic signature...');
          setIsProcessing(false);
          return;
        }
        
        setStatus('Agent synthesizing vibe into Strudel code...');
        const agentResponse = await generateStrudelCode(secretVibe, { useRealAI });
        code = agentResponse.code;
        chunks = [];
        entropy = 0;
        setStatus('Agent Synthesis Complete. Acoustic DNA extracted.');
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
        
        setStatus('Musical Guardian Ready. Hit ▶ to hear your key.');
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
      setStatus('Please enter a Bitcoin address to guard.');
      return;
    }
    
    if (!isValidBtcAddress(btcAddress)) {
      setStatus('Invalid Bitcoin address format.');
      return;
    }

    setIsCommiting(true);
    setOnChainStatus('pending');
    setStatus('Anchoring Bitcoin Guardian to Starknet...');

    try {
      // Register guardian with Pedersen commitment
      await registerGuardian(btcAddress, dnaHash, blinding);
      
      // Update session with BTC address
      sessionManager.updateSession({ btcAddress });
      
      setOnChainStatus('success');
      setStatus('Bitcoin Guardian Anchored. Your funds are protected.');
    } catch (error) {
      console.error(error);
      setOnChainStatus('failed');
      setStatus('On-Chain Commitment Failed. Check wallet.');
    } finally {
      setIsCommiting(false);
    }
  };

  const handlePlayback = async () => {
    if (!generatedCode) return;

    if (isAudioPlaying) {
      await stopStrudel();
      setIsAudioPlaying(false);
    } else {
      setIsAudioPlaying(true);
      const ok = await playStrudelCode(generatedCode);
      if (!ok) setIsAudioPlaying(false);
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
    const ok = await playStrudelCode(patternCode);
    if (!ok) {
      setPreviewPlayingId(null);
      setActiveHaps([]);
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
      setStatus('Idea loaded. Click Mint Sonic DNA to synthesize it.');
    } catch {
      setStatus('Could not generate idea. Try typing your own vibe.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRecovery = async () => {
    if (!recoveryVibe.trim()) {
      setStatus('Please recall your sonic signature...');
      return;
    }
    
    if (!btcAddress) {
      setStatus('Please enter the Bitcoin address to recover.');
      return;
    }

    setIsProcessing(true);
    setStatus('Verifying Acoustic Proof...');

    try {
      const agentResponse = await generateStrudelCode(recoveryVibe, { useRealAI });
      const dna = await extractSonicDNA(agentResponse.code, { includeTimestamp: true });

      if (dna) {
        const session = sessionManager.getCurrentSession();
        
        // Local verification first
        const localMatch = dna.hash === session?.storedHash;
        
        if (!localMatch) {
          setStatus('Acoustic Signature Mismatch. Access Denied.');
          visualizerRef.current?.updateDNASequence(dna.dna);
          visualizerRef.current?.highlightParticles([]);
          sessionManager.addRecoveryAttempt(recoveryVibe.trim(), false, dna.hash);
          onFailure?.();
          if (audioEnabled) playAudio('error');
          setIsProcessing(false);
          return;
        }
        
        // On-chain verification if connected
        if (isConnected && session?.blinding) {
          setStatus('Verifying Zero-Knowledge Proof on Starknet...');
          const onChainMatch = await verifyRecovery(btcAddress, dna.hash, session.blinding);
          
          if (!onChainMatch) {
            setStatus('On-Chain Verification Failed. Guardian hash mismatch.');
            if (audioEnabled) playAudio('error');
            setIsProcessing(false);
            return;
          }
          
          // Authorize recovery
          setStatus('Validating Pedersen Commitment & Authorizing...');
          try {
            await authorizeBtcRecovery(btcAddress, dna.hash, session.blinding);
            setStatus('Recovery Authorized! You can now access your Bitcoin.');
            setDna(dna);
            visualizerRef.current?.updateDNASequence(dna.dna);
            visualizerRef.current?.highlightParticles(Array.from({ length: 12 }, (_, i) => i));
            sessionManager.addRecoveryAttempt(recoveryVibe.trim(), true, dna.hash);
            onRecovery?.(dna.hash);
            if (audioEnabled) playAudio('success');
          } catch (error) {
            console.error('Recovery authorization failed:', error);
            setStatus('Recovery Authorization Failed. Check wallet.');
            if (audioEnabled) playAudio('error');
          }
        } else {
          // Offline verification only
          setStatus('Acoustic Proof Verified (Offline Mode).');
          setDna(dna);
          visualizerRef.current?.updateDNASequence(dna.dna);
          visualizerRef.current?.highlightParticles(Array.from({ length: 12 }, (_, i) => i));
          sessionManager.addRecoveryAttempt(recoveryVibe.trim(), true, dna.hash);
          onRecovery?.(dna.hash);
          if (audioEnabled) playAudio('success');
        }
      }
    } catch (error) {
      console.error(error);
      setStatus('Verification Aborted.');
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
    <div className="relative min-h-screen bg-[color:var(--background)] selection:bg-[color:var(--color-primary)] selection:text-white">
      <div className="noise" />
      <div className="bg-gradient-mesh" />

      <main className="relative z-10 container mx-auto px-4 py-12 flex flex-col items-center">
        {/* Header — tight, just the badge + title */}
        <header className="text-center mb-6 space-y-3 max-w-2xl">
          <div className="inline-block px-3 py-1 rounded-full border border-[color:var(--color-primary)]/40 text-[color:var(--color-primary)] text-[10px] font-bold tracking-widest uppercase animate-pulse-soft">
            Starknet Privacy Track ✦ ZK-Acoustic Protocol
          </div>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tighter text-gradient leading-[1.05]">
            Sonic Guardian
          </h1>
        </header>

        {/* Core Protocol Container */}
        <div className="w-full max-w-6xl space-y-12">
          
          {/* Tab Selection */}
          <div className="flex justify-center gap-8 border-b border-[color:var(--color-border)] mb-12">
            <button 
              onClick={() => setActiveTab('protocol')}
              className={`pb-4 text-xs font-bold uppercase tracking-[0.3em] transition-all relative ${activeTab === 'protocol' ? 'text-[color:var(--color-primary)]' : 'text-[color:var(--color-muted)] hover:text-[color:var(--color-foreground)]'}`}
            >
              01. Protocol Core
              {activeTab === 'protocol' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[color:var(--color-primary)] shadow-[0_0_10px_var(--color-primary)]" />}
            </button>
            <button 
              onClick={() => setActiveTab('gift')}
              className={`pb-4 text-xs font-bold uppercase tracking-[0.3em] transition-all relative ${activeTab === 'gift' ? 'text-[color:var(--color-accent)]' : 'text-[color:var(--color-muted)] hover:text-[color:var(--color-foreground)]'}`}
            >
              02. Showcase: Gifting
              {activeTab === 'gift' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[color:var(--color-accent)] shadow-[0_0_10px_var(--color-accent)]" />}
              <span className="absolute -top-1 -right-4 px-1.5 py-0.5 rounded bg-[color:var(--color-accent)]/20 text-[color:var(--color-accent)] text-[7px] font-bold border border-[color:var(--color-accent)]/30">APP</span>
            </button>
          </div>

          {activeTab === 'gift' ? (
            <div className="space-y-8">
              <ShowcaseHeader />
              <GiftApp />
            </div>
          ) : (
            <div className="space-y-8">
              <ProtocolHeader />
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">

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
                  <p className="text-[10px] text-[color:var(--color-muted)] leading-snug">Bitcoin seed phrases get stolen, lost, or phished. Recovery is risky and exposes credentials.</p>
                </div>
                <div className="glass px-3 py-2 rounded-xl border border-[color:var(--color-primary)]/30 backdrop-blur-md max-w-[200px]">
                  <p className="text-[9px] font-bold text-[color:var(--color-primary)] uppercase tracking-widest mb-0.5">🎵 The Concept</p>
                  <p className="text-[10px] text-[color:var(--color-muted)] leading-snug">Your vibe becomes a memorable recovery key. Acoustic DNA generates zero-knowledge proofs for Bitcoin multisig.</p>
                </div>
                <div className="glass px-3 py-2 rounded-xl border border-[color:var(--color-success)]/30 backdrop-blur-md max-w-[200px]">
                  <p className="text-[9px] font-bold text-[color:var(--color-success)] uppercase tracking-widest mb-0.5">🔒 The Utility</p>
                  <p className="text-[10px] text-[color:var(--color-muted)] leading-snug">Private Bitcoin recovery via Pedersen commitments on Starknet. Prove ownership without exposing credentials.</p>
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
              {STRUDEL_PATTERN_LIBRARY.map((pattern) => (
                <button
                  key={pattern.name}
                  onClick={() => setSelectedPatternId(pattern.name)}
                  className={`group p-4 rounded-xl border transition-all text-left ${
                    selectedPatternId === pattern.name
                      ? 'border-[color:var(--color-primary)] bg-[color:var(--color-primary)]/10 scale-105 shadow-lg shadow-[color:var(--color-primary)]/20'
                      : 'border-[color:var(--color-border)] hover:border-[color:var(--color-primary)]/40 hover:scale-102'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-2 transition-all ${
                    selectedPatternId === pattern.name
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
                      className={`px-4 py-2 rounded-lg border transition-all flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest ${
                        previewPlayingId === selectedPatternId
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
                  
                  <div className={`bg-black/80 rounded-xl p-6 font-mono text-xs text-blue-400 border shadow-2xl relative group transition-all duration-150 ${
                    previewPlayingId === selectedPatternId && activeHaps.length > 0
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
                    
                    <code className={`whitespace-pre-wrap break-all leading-relaxed tracking-wider block ${
                      previewPlayingId === selectedPatternId && activeHaps.length > 0 ? 'mt-6' : ''
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
                </div>
              </div>
            )}
          </div>

          {/* Interface Cards */}
          <div className="lg:col-span-12 max-w-4xl mx-auto w-full grid grid-cols-1 md:grid-cols-2 gap-8">

            {/* Input Side - Streamlined */}
            <div className="glass rounded-[var(--border-radius)] p-8 space-y-6 flex flex-col justify-between">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold tracking-tight">
                    {phase === 'registration' ? 'Create Guardian' : 'Recover Access'}
                  </h2>
                  <div className="flex gap-2">
                    <WalletButton />
                    <button
                      onClick={() => {
                        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
                        setCurrentTheme(newTheme);
                        setTheme(newTheme);
                      }}
                      className="p-2 rounded-full hover:bg-[color:var(--color-foreground)]/5 transition-colors"
                    >
                      {currentTheme === 'dark' ? '☀️' : '🌙'}
                    </button>
                    <button
                      onClick={() => {
                        const newState = !audioEnabled;
                        setAudioEnabled(newState);
                        setAudioState(newState);
                      }}
                      className={`p-2 rounded-full transition-colors ${audioEnabled ? 'bg-[color:var(--color-primary)]/10 text-[color:var(--color-primary)]' : 'hover:bg-[color:var(--color-foreground)]/5'}`}
                    >
                      {audioEnabled ? '🔊' : '🔇'}
                    </button>
                  </div>
                </div>

                {phase === 'registration' ? (
                  // Registration Flow - Secure First
                  <div className="space-y-4">
                    <div className="p-4 rounded-xl bg-[color:var(--color-success)]/5 border border-[color:var(--color-success)]/20">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 bg-[color:var(--color-success)] rounded-full animate-pulse" />
                        <p className="text-[10px] font-bold text-[color:var(--color-success)] uppercase tracking-widest">
                          Secure Mode • 256-bit Entropy
                        </p>
                      </div>
                      <p className="text-[10px] text-[color:var(--color-muted)] leading-relaxed">
                        System generates cryptographically secure musical pattern. Memorize the chunks for recovery.
                      </p>
                    </div>

                    <div className="relative group">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-[color:var(--color-muted)] mb-2 block">
                        Bitcoin Address to Guard
                      </label>
                      <input
                        type="text"
                        value={btcAddress}
                        onChange={(e) => setBtcAddress(e.target.value)}
                        placeholder="bc1q... or 1... or 3..."
                        className="w-full bg-transparent border-b-2 border-[color:var(--color-border)] py-3 focus:border-[color:var(--color-accent)] focus:outline-none transition-all duration-500 font-mono text-sm"
                        disabled={isProcessing}
                      />
                      <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-[color:var(--color-accent)] group-focus-within:w-full transition-all duration-700" />
                      {btcAddress && !isValidBtcAddress(btcAddress) && (
                        <p className="text-[9px] text-[color:var(--color-error)] mt-1">Invalid Bitcoin address format</p>
                      )}
                    </div>

                    {/* Advanced: Custom Pattern (collapsed by default) */}
                    {!useSecureGeneration && (
                      <div className="relative group animate-in fade-in slide-in-from-top-2 duration-300">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-[color:var(--color-muted)] mb-2 block">
                          Custom Vibe (Advanced)
                        </label>
                        <input
                          type="text"
                          value={secretVibe}
                          onChange={(e) => setSecretVibe(e.target.value)}
                          placeholder="e.g. A fast, dark industrial techno loop"
                          className="w-full bg-transparent border-b-2 border-[color:var(--color-border)] py-3 focus:border-[color:var(--color-primary)] focus:outline-none transition-all duration-500 font-light text-sm italic"
                          disabled={isProcessing}
                        />
                        <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-[color:var(--color-primary)] group-focus-within:w-full transition-all duration-700" />
                      </div>
                    )}

                    <button
                      onClick={() => setUseSecureGeneration(!useSecureGeneration)}
                      className="text-[9px] text-[color:var(--color-muted)] hover:text-[color:var(--color-primary)] transition-colors underline"
                    >
                      {useSecureGeneration ? '→ Use custom vibe instead' : '← Back to secure mode'}
                    </button>

                    {dnaHash && (
                      <div className="pt-4 animate-in fade-in slide-in-from-top-4 duration-700">
                        <button
                          onClick={handleCommitToStarknet}
                          disabled={isCommiting || !isConnected || !btcAddress || !isValidBtcAddress(btcAddress)}
                          className={`w-full py-4 rounded-xl border-2 transition-all flex items-center justify-center gap-2 text-xs font-bold tracking-widest uppercase ${
                            onChainStatus === 'success'
                              ? 'border-[color:var(--color-success)] text-[color:var(--color-success)] bg-[color:var(--color-success)]/5'
                              : 'border-[color:var(--color-primary)]/30 text-[color:var(--color-primary)] hover:border-[color:var(--color-primary)] disabled:opacity-50 disabled:cursor-not-allowed'
                          }`}
                        >
                          {onChainStatus === 'success' ? (
                            <>✨ Guardian Anchored</>
                          ) : (
                            <>
                              {isConnected ? '🔒 Anchor to Starknet' : '⚠️ Connect Wallet First'}
                              {isCommiting && <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />}
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  // Recovery Flow
                  <div className="space-y-4">
                    <div className="p-4 rounded-xl bg-[color:var(--color-accent)]/5 border border-[color:var(--color-accent)]/20">
                      <p className="text-[10px] text-[color:var(--color-muted)] leading-relaxed">
                        Enter your musical chunks or vibe to recover access to your Bitcoin guardian.
                      </p>
                    </div>

                    <div className="relative group">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-[color:var(--color-muted)] mb-2 block">
                        Recovery Phrase
                      </label>
                      <input
                        type="text"
                        value={recoveryVibe}
                        onChange={(e) => setRecoveryVibe(e.target.value)}
                        placeholder="Enter your musical chunks..."
                        className="w-full bg-transparent border-b-2 border-[color:var(--color-border)] py-3 focus:border-[color:var(--color-primary)] focus:outline-none transition-all duration-500 font-light text-sm"
                        disabled={isProcessing}
                      />
                      <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-[color:var(--color-primary)] group-focus-within:w-full transition-all duration-700" />
                    </div>

                    <div className="relative group">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-[color:var(--color-muted)] mb-2 block">
                        Bitcoin Address to Recover
                      </label>
                      <input
                        type="text"
                        value={btcAddress}
                        onChange={(e) => setBtcAddress(e.target.value)}
                        placeholder="bc1q... or 1... or 3..."
                        className="w-full bg-transparent border-b-2 border-[color:var(--color-border)] py-3 focus:border-[color:var(--color-accent)] focus:outline-none transition-all duration-500 font-mono text-sm"
                        disabled={isProcessing}
                      />
                      <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-[color:var(--color-accent)] group-focus-within:w-full transition-all duration-700" />
                      {btcAddress && !isValidBtcAddress(btcAddress) && (
                        <p className="text-[9px] text-[color:var(--color-error)] mt-1">Invalid Bitcoin address format</p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-4 pt-4 border-t border-[color:var(--color-border)]">
                <button
                  onClick={phase === 'registration' ? handleGenerate : handleRecovery}
                  disabled={isProcessing}
                  className="w-full py-5 rounded-2xl bg-[color:var(--color-foreground)] text-[color:var(--background)] font-bold tracking-widest uppercase text-sm hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-3 overflow-hidden group relative"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-[color:var(--color-primary)] to-[color:var(--color-accent)] opacity-0 group-hover:opacity-100 transition-opacity" />
                  <span className="relative z-10">
                    {isProcessing ? 'Processing...' : (
                      phase === 'registration' 
                        ? 'Generate Guardian'
                        : 'Verify & Recover'
                    )}
                  </span>
                  {isProcessing && <div className="w-4 h-4 border-2 border-[color:var(--background)] border-t-transparent rounded-full animate-spin relative z-10" />}
                </button>

                <button
                  onClick={() => {
                    setIsLocked(!isLocked);
                    setPhase(phase === 'registration' ? 'recovery' : 'registration');
                    setStatus('');
                  }}
                  className="w-full py-3 rounded-xl border border-[color:var(--color-border)] text-[color:var(--color-muted)] text-xs font-bold uppercase tracking-widest hover:text-[color:var(--color-foreground)] hover:border-[color:var(--color-foreground)] transition-all"
                >
                  {phase === 'registration' ? 'Switch to Recovery →' : '← Back to Registration'}
                </button>
              </div>
            </div>

            {/* Tech Output Side */}
            <div className="glass rounded-[var(--border-radius)] p-8 flex flex-col justify-between overflow-hidden relative">
              {/* Strudel Logo/Watermark */}
              <div className="absolute -right-4 -bottom-4 opacity-5 font-bold text-8xl pointer-events-none tracking-tighter italic">STRUDEL</div>

              <div className="space-y-6 relative z-10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-[color:var(--color-success)] animate-pulse" />
                    <h3 className="text-xs font-bold uppercase tracking-[0.3em] text-[color:var(--color-muted)]">Live Stream Analysis</h3>
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
                            Protocol ⇄ ZK-Acoustic ready. Sonic DNA will appear here once synthesized.
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
                          <h4 className="text-[10px] font-bold uppercase tracking-widest text-[color:var(--color-primary)]">Your Sonic Guardian</h4>
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
                        Edit the code above to customize your pattern. Changes update your guardian's DNA hash.
                      </p>
                    </div>

                    {/* Gene Network Breakdown */}
                    {dna && (
                      <div className="space-y-6 pt-6 border-t border-white/5">
                        <div className="flex items-center justify-between">
                          <h4 className="text-[10px] font-bold uppercase tracking-widest text-[color:var(--color-muted)]">
                            {musicalChunks.length > 0 ? 'Musical Seed Phrase' : 'Acoustic Signature Breakdown'}
                          </h4>
                        </div>

                        {musicalChunks.length > 0 ? (
                          <div className="space-y-4">
                            <div className="p-4 rounded-xl border border-[color:var(--color-warning)]/30 bg-[color:var(--color-warning)]/5">
                              <p className="text-[9px] font-bold text-[color:var(--color-warning)] uppercase tracking-widest mb-2">
                                ⚠️ Save These Chunks Securely
                              </p>
                              <p className="text-[10px] text-[color:var(--color-muted)] mb-3">
                                Memorize or store in password manager. You'll need them for recovery.
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
                                  setStatus('Seed phrase copied to clipboard!');
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
                          Click "Use" to set as your guardian pattern, or generate a secure one below
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
                            Click ▶ on any pattern to preview, or generate a secure guardian below. Your acoustic signature will materialize here as cryptographic code.
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
          )}
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
    </div>
  );
}