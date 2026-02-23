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

interface SonicGuardianProps {
  onRecovery?: (hash: string) => void;
  onFailure?: () => void;
}

export default function SonicGuardian({ onRecovery, onFailure }: SonicGuardianProps) {
  const [phase, setPhase] = useState<'registration' | 'recovery'>('registration');
  const [secretVibe, setSecretVibe] = useState('');

  const FREQUENCY_PRESETS = [
    { name: 'Deep Sea Pulse', vibe: 'a low, slow sub-bass sine wave with character' },
    { name: 'Industrial Chaos', vibe: 'distorted fast sawtooth rhythms with high-pass resonance' },
    { name: 'Stellar Resonance', vibe: 'harmonic triangle oscillators layered with slow modulation' }
  ];
  const [generatedCode, setGeneratedCode] = useState('');
  const [dna, setDna] = useState<SonicDNA | null>(null);
  const [dnaHash, setDnaHash] = useState('');
  const [recoveryVibe, setRecoveryVibe] = useState('');
  const [status, setStatus] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [useRealAI, setUseRealAI] = useState(false);
  const [audioEnabled, setAudioState] = useState(true);
  const [currentTheme, setCurrentTheme] = useState<'light' | 'dark' | 'system'>('dark');

  const visualizerContainerRef = useRef<HTMLDivElement>(null);
  const visualizerRef = useRef<SonicVisualizer | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  const { isConnected, registerIdentity, verifyIdentity } = useStarknetGuardian();
  const [isCommiting, setIsCommiting] = useState(false);
  const [onChainStatus, setOnChainStatus] = useState<'none' | 'pending' | 'success' | 'failed'>('none');

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
    if (!secretVibe.trim()) {
      setStatus('Please define your sonic signature...');
      return;
    }

    setIsProcessing(true);
    setStatus('Synthesizing Acoustic DNA...');

    try {
      const agentResponse = await generateStrudelCode(secretVibe, { useRealAI });
      setGeneratedCode(agentResponse.code);

      const dna = await extractSonicDNA(agentResponse.code, { includeTimestamp: true });

      if (dna) {
        setDna(dna);
        setDnaHash(dna.hash);
        sessionManager.createSession(secretVibe.trim(), dna.hash, dna.salt);
        setStatus('Identity Minted. Your frequency is unique.');

        visualizerRef.current?.updateDNASequence(dna.dna);
        visualizerRef.current?.playGenerationAnimation();

        if (audioEnabled) playAudio('success');
      }
    } catch (error) {
      console.error(error);
      setStatus('Synthesis Failed. Environmental Noise too high.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCommitToStarknet = async () => {
    if (!dnaHash || !isConnected) return;

    setIsCommiting(true);
    setOnChainStatus('pending');
    setStatus('Anchoring identity to Starknet...');

    try {
      await registerIdentity(dnaHash);
      setOnChainStatus('success');
      setStatus('Identity Permanently Anchored to Starknet.');
    } catch (error) {
      console.error(error);
      setOnChainStatus('failed');
      setStatus('On-Chain Commitment Failed. Check wallet.');
    } finally {
      setIsCommiting(false);
    }
  };

  const handleRecovery = async () => {
    if (!recoveryVibe.trim()) {
      setStatus('Please recall your sonic signature...');
      return;
    }

    setIsProcessing(true);
    setStatus('Analyzing Proof of Frequency...');

    try {
      const agentResponse = await generateStrudelCode(recoveryVibe, { useRealAI });
      const dna = await extractSonicDNA(agentResponse.code, { includeTimestamp: true });

      if (dna) {
        const session = sessionManager.getCurrentSession();
        const success = dna.hash === session?.storedHash;

        if (success) {
          // On-chain verification if connected
          if (isConnected) {
            setStatus('Verifying Proof on Starknet...');
            const onChainMatch = await verifyIdentity(dna.hash);
            if (!onChainMatch) {
              setStatus('On-Chain Proof Verification Failed.');
              if (audioEnabled) playAudio('error');
              return;
            }
          }

          setStatus('Frequency Match Confirmed. Access Granted.');
          setDna(dna);
          visualizerRef.current?.updateDNASequence(dna.dna);
          visualizerRef.current?.highlightParticles(Array.from({ length: 12 }, (_, i) => i));
          sessionManager.addRecoveryAttempt(recoveryVibe.trim(), true, dna.hash);
          onRecovery?.(dna.hash);
          if (audioEnabled) playAudio('success');
        } else {
          setStatus('Frequency Mismatch. Identity Unverified.');
          visualizerRef.current?.updateDNASequence(dna.dna);
          visualizerRef.current?.highlightParticles([]);
          sessionManager.addRecoveryAttempt(recoveryVibe.trim(), false, dna.hash);
          onFailure?.();
          if (audioEnabled) playAudio('error');
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
        {/* Header Section */}
        <header className="text-center mb-16 space-y-4 max-w-2xl">
          <div className="inline-block px-4 py-1 rounded-full border border-[color:var(--color-primary)] text-[color:var(--color-primary)] text-xs font-bold tracking-widest uppercase mb-4 animate-pulse-soft">
            Starknet Privacy Track | ZK-Acoustic Protocol
          </div>
          <h1 className="text-6xl md:text-8xl font-bold tracking-tighter text-gradient leading-[1.1]">
            Sonic Guardian
          </h1>
          <p className="text-[color:var(--color-muted)] text-lg md:text-xl font-light">
            Anonymous Credentials via <span className="text-[color:var(--color-foreground)] font-medium">Acoustic Proofs</span>
          </p>
        </header>

        {/* Core Protocol Container */}
        <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">

          {/* Visualizer - The Heart of the System */}
          <div className="lg:col-span-12 flex flex-col items-center justify-center mb-12">
            <div
              ref={visualizerContainerRef}
              className="relative w-full h-[300px] md:h-[500px] animate-float"
            >
              {/* Central Glow */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-[color:var(--color-primary)] rounded-full blur-[100px] opacity-30" />
            </div>

            <div className="mt-8 flex gap-3 text-[10px] font-bold tracking-[0.2em] uppercase text-[color:var(--color-muted)]">
              <span className="flex items-center gap-1"><div className="w-1 h-1 bg-[color:var(--color-primary)] rounded-full" /> Quantum State</span>
              <span className="flex items-center gap-1"><div className="w-1 h-1 bg-[color:var(--color-accent)] rounded-full" /> Resonant Frequency</span>
              <span className="flex items-center gap-1"><div className="w-1 h-1 bg-[color:var(--color-success)] rounded-full" /> DNA Integrity</span>
            </div>
          </div>

          {/* Interface Cards */}
          <div className="lg:col-span-12 max-w-4xl mx-auto w-full grid grid-cols-1 md:grid-cols-2 gap-8">

            {/* Input Side */}
            <div className="glass rounded-[var(--border-radius)] p-8 space-y-8 flex flex-col justify-between">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold tracking-tight">
                    {phase === 'registration' ? 'Mint Credential' : 'Prove Ownership'}
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

                <div className="space-y-4">
                  <div>
                    <h3 className="text-[10px] font-bold uppercase tracking-widest text-[color:var(--color-muted)] mb-3">Frequency Library (Strudel Mechanisms)</h3>
                    <div className="flex flex-wrap gap-2">
                      {FREQUENCY_PRESETS.map((preset) => (
                        <button
                          key={preset.name}
                          onClick={() => phase === 'registration' ? setSecretVibe(preset.vibe) : setRecoveryVibe(preset.vibe)}
                          className="px-3 py-1 text-[10px] border border-[color:var(--color-border)] rounded-full hover:border-[color:var(--color-primary)] hover:text-[color:var(--color-primary)] transition-all uppercase tracking-wider bg-[color:var(--color-foreground)]/5"
                        >
                          {preset.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  <p className="text-sm text-[color:var(--color-muted)] leading-relaxed">
                    {phase === 'registration'
                      ? "Define a unique acoustic landscape. This 'vibe' generates an anonymous credential anchored on Starknet."
                      : "Recall your sonic signature. Verify your credential via ZK-Social Proof of Frequency."}
                  </p>

                  <div className="relative group">
                    <input
                      type="text"
                      value={phase === 'registration' ? secretVibe : recoveryVibe}
                      onChange={(e) => phase === 'registration' ? setSecretVibe(e.target.value) : setRecoveryVibe(e.target.value)}
                      placeholder={phase === 'registration' ? "e.g. A fast, dark industrial techno loop" : "Synthesize your recall phrase..."}
                      className="w-full bg-transparent border-b-2 border-[color:var(--color-border)] py-4 focus:border-[color:var(--color-primary)] focus:outline-none transition-all duration-500 font-light text-xl italic"
                      disabled={isProcessing}
                    />
                    <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-[color:var(--color-primary)] group-focus-within:w-full transition-all duration-700" />
                  </div>

                  {dnaHash && phase === 'registration' && (
                    <div className="pt-4 animate-in fade-in slide-in-from-top-4 duration-700">
                      <button
                        onClick={handleCommitToStarknet}
                        disabled={isCommiting || !isConnected}
                        className={`w-full py-4 rounded-xl border-2 transition-all flex items-center justify-center gap-2 text-xs font-bold tracking-widest uppercase ${onChainStatus === 'success'
                          ? 'border-[color:var(--color-success)] text-[color:var(--color-success)] bg-[color:var(--color-success)]/5'
                          : 'border-[color:var(--color-primary)]/30 text-[color:var(--color-primary)] hover:border-[color:var(--color-primary)]'
                          }`}
                      >
                        {onChainStatus === 'success' ? (
                          <>✨ Anchored to Starknet</>
                        ) : (
                          <>
                            {isConnected ? '🔒 Anchor to Starknet (ZK-Privacy)' : '⚠️ Connect Wallet to Anchor'}
                            {isCommiting && <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />}
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-4 pt-4">
                <button
                  onClick={phase === 'registration' ? handleGenerate : handleRecovery}
                  disabled={isProcessing}
                  className="w-full py-5 rounded-2xl bg-[color:var(--color-foreground)] text-[color:var(--background)] font-bold tracking-widest uppercase text-sm hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-3 overflow-hidden group relative"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-[color:var(--color-primary)] to-[color:var(--color-accent)] opacity-0 group-hover:opacity-100 transition-opacity" />
                  <span className="relative z-10">{isProcessing ? 'Synthesizing...' : (phase === 'registration' ? 'Mint Sonic DNA' : 'Verify Identity')}</span>
                  {isProcessing && <div className="w-4 h-4 border-2 border-[color:var(--background)] border-t-transparent rounded-full animate-spin relative z-10" />}
                </button>

                <div className="flex gap-4">
                  <button
                    onClick={() => {
                      setIsLocked(!isLocked);
                      setPhase(phase === 'registration' ? 'recovery' : 'registration');
                      setStatus('');
                    }}
                    className="flex-1 py-3 rounded-xl border border-[color:var(--color-border)] text-[color:var(--color-muted)] text-xs font-bold uppercase tracking-widest hover:text-[color:var(--color-foreground)] hover:border-[color:var(--color-foreground)] transition-all"
                  >
                    Switch Protocol ⇄
                  </button>
                </div>
              </div>
            </div>

            {/* Tech Output Side */}
            <div className="glass rounded-[var(--border-radius)] p-8 flex flex-col justify-between overflow-hidden relative">
              {/* Strudel Logo/Watermark */}
              <div className="absolute -right-4 -bottom-4 opacity-5 font-bold text-8xl pointer-events-none tracking-tighter italic">STRUDEL</div>

              <div className="space-y-6 relative z-10">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[color:var(--color-success)] animate-pulse" />
                  <h3 className="text-xs font-bold uppercase tracking-[0.3em] text-[color:var(--color-muted)]">Live Stream Analysis</h3>
                </div>

                {status ? (
                  <div className="animate-in fade-in slide-in-from-left-2 duration-300">
                    <p className="text-xl font-medium tracking-tight leading-snug">
                      {status}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3 opacity-30">
                    <div className="h-4 w-3/4 bg-[color:var(--color-border)] rounded animate-pulse" />
                    <div className="h-4 w-1/2 bg-[color:var(--color-border)] rounded animate-pulse" />
                  </div>
                )}

                {generatedCode && (
                  <div className="space-y-4 animate-in zoom-in-95 duration-500">
                    <div>
                      <h4 className="text-[10px] font-bold uppercase tracking-widest text-[color:var(--color-primary)] mb-2">Deterministic Strudel Output</h4>
                      <div className="bg-black/80 rounded-xl p-6 font-mono text-xs text-blue-400 border border-blue-500/20 shadow-2xl overflow-hidden group relative">
                        <div className="absolute top-0 right-0 p-2 opacity-30 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => navigator.clipboard.writeText(generatedCode)} className="text-white">📋</button>
                        </div>
                        <code className="whitespace-pre-wrap break-all leading-relaxed tracking-wider">
                          {generatedCode.split(/(\(|\)|\.|\"|\')/).map((part, i) => {
                            if (['(', ')', '.'].includes(part)) return <span key={i} className="opacity-40">{part}</span>;
                            if (part === '"' || part === "'") return <span key={i} className="text-pink-400">{part}</span>;
                            if (['s', 'slow', 'fast', 'distort', 'lpf', 'hpf', 'gain', 'stack'].includes(part))
                              return <span key={i} className="text-white font-bold">{part}</span>;
                            return <span key={i}>{part}</span>;
                          })}
                        </code>
                      </div>
                    </div>

                    {/* Gene Network Breakdown */}
                    {dna && (
                      <div className="space-y-3">
                        <h4 className="text-[10px] font-bold uppercase tracking-widest text-[color:var(--color-muted)]">Acoustic Signature Breakdown</h4>
                        <div className="flex flex-wrap gap-2">
                          {dna.features.map((feature: string) => (
                            <div
                              key={feature}
                              className="group relative flex items-center gap-2 px-3 py-1.5 rounded-full bg-[color:var(--color-primary)]/5 border border-[color:var(--color-primary)]/20 text-[color:var(--color-primary)] text-[10px] font-bold uppercase tracking-wider hover:bg-[color:var(--color-primary)]/10 transition-all cursor-default overflow-hidden"
                            >
                              <div className="absolute inset-0 bg-gradient-to-r from-[color:var(--color-primary)]/0 to-[color:var(--color-primary)]/10 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                              <div className="w-1.5 h-1.5 rounded-full bg-[color:var(--color-primary)] shadow-[0_0_8px_var(--color-primary)]" />
                              {feature}
                            </div>
                          ))}
                        </div>

                        {/* Pattern Matrix: A rhythmic grid that flickers to represent the live pattern structure */}
                        <div className="grid grid-cols-8 gap-1 pt-2 opacity-20">
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
                    )}

                    {dnaHash && (
                      <div className="grid grid-cols-2 gap-4 pt-2">
                        <div>
                          <h4 className="text-[10px] font-bold uppercase tracking-widest text-[color:var(--color-muted)] mb-1">DNA Hash</h4>
                          <p className="font-mono text-[10px] truncate opacity-60 italic">{dnaHash}</p>
                        </div>
                        <div className="text-right">
                          <h4 className="text-[10px] font-bold uppercase tracking-widest text-[color:var(--color-muted)] mb-1">State</h4>
                          <p className="text-[10px] font-bold text-[color:var(--color-success)] uppercase tracking-widest">Immutable</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {!generatedCode && !status && (
                  <div className="flex flex-col items-center justify-center h-full py-12 text-center space-y-4">
                    <div className="text-4xl opacity-20 animate-float italic font-bold">Waiting for input...</div>
                    <p className="text-xs text-[color:var(--color-muted)] max-w-[200px]">Sonic DNA will appear here once the protocol is initiated.</p>
                  </div>
                )}
              </div>

              {/* Bottom Info */}
              <div className="pt-8 border-t border-[color:var(--color-border)] mt-8 flex justify-between items-center text-[9px] font-bold uppercase tracking-widest text-[color:var(--color-muted)]">
                <div>v1.2.0 Stable Network</div>
                <div className="flex gap-4">
                  <a href="https://strudel.cc" target="_blank" className="hover:text-[color:var(--color-primary)] transition-colors">Strudel.cc</a>
                  <a href="#" className="hover:text-[color:var(--color-primary)] transition-colors">Whitepaper</a>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Floating AI Toggle */}
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
            {useRealAI ? 'Neural Synthesis Active' : 'Neural Agent Idle'}
          </button>
        </div>
        {/* Protocol Analysis Section */}
        <section className="mt-24 w-full max-w-4xl grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="space-y-4">
            <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-[color:var(--color-primary)]">01. Anonymous Credentials</h4>
            <p className="text-xs text-[color:var(--color-muted)] leading-relaxed">
              Your "vibe" is processed through a deterministic LLM that translates musical subjective data into <span className="text-[color:var(--color-foreground)] font-medium">Starknet-ready commitments</span>.
            </p>
          </div>
          <div className="space-y-4">
            <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-[color:var(--color-accent)]">02. ZK-Sonic Verifier</h4>
            <p className="text-xs text-[color:var(--color-muted)] leading-relaxed">
              We leverage Cairo's efficiency to verify Sigma-style acoustic proofs, enabling <span className="text-[color:var(--color-foreground)] font-medium">Anonymous Authentication</span> for any dApp.
            </p>
          </div>
          <div className="space-y-4">
            <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-[color:var(--color-success)]">03. Social Recovery Integration</h4>
            <p className="text-xs text-[color:var(--color-muted)] leading-relaxed">
              Integrates with <span className="text-[color:var(--color-foreground)] font-medium">Sumo Login</span> and shielding protocols to provide a privacy-first frontend for the Starknet ecosystem.
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