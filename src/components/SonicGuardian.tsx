'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { extractSonicDNA } from '../lib/dna';
import { generateStrudelCode } from '../lib/ai-agent';
import { generateAudio } from '../lib/audio';
import {
  sessionManager,
  preferencesManager,
  isAudioEnabled,
  setAudioEnabled,
  areAnimationsEnabled,
  setAnimationsEnabled,
  isRealAIEnabled,
  setRealAIEnabled
} from '../lib/storage';
import { getCurrentTheme, setTheme } from '../lib/theme';
import { SonicVisualizer } from '../lib/visualizer';

interface SonicGuardianProps {
  onRecovery?: (hash: string) => void;
  onFailure?: () => void;
}

export default function SonicGuardian({ onRecovery, onFailure }: SonicGuardianProps) {
  const [phase, setPhase] = useState<'registration' | 'recovery'>('registration');
  const [secretVibe, setSecretVibe] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');
  const [dnaHash, setDnaHash] = useState('');
  const [recoveryVibe, setRecoveryVibe] = useState('');
  const [recoveryHash, setRecoveryHash] = useState('');
  const [status, setStatus] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [useRealAI, setUseRealAI] = useState(false);
  const [currentTheme, setCurrentTheme] = useState<'light' | 'dark' | 'system'>('system');

  // 3D Visualizer refs
  const visualizerContainerRef = useRef<HTMLDivElement>(null);
  const visualizerRef = useRef<SonicVisualizer | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Initialize theme and preferences
  useEffect(() => {
    const theme = getCurrentTheme();
    setCurrentTheme(theme as any);
    setTheme(theme as any);

    const prefs = preferencesManager.get();
    setUseRealAI(prefs.useRealAI);
  }, []);

  // Initialize 3D visualizer
  useEffect(() => {
    if (visualizerContainerRef.current) {
      visualizerRef.current = new SonicVisualizer({
        container: visualizerContainerRef.current,
        theme: currentTheme === 'dark' ? 'dark' : 'light',
        particleCount: 50
      });
    }

    return () => {
      if (visualizerRef.current) {
        visualizerRef.current.dispose();
        visualizerRef.current = null;
      }
    };
  }, [currentTheme]);

  // Update visualizer theme when theme changes
  useEffect(() => {
    if (visualizerRef.current) {
      // Dispose and recreate with new theme
      visualizerRef.current.dispose();
      visualizerRef.current = new SonicVisualizer({
        container: visualizerContainerRef.current!,
        theme: currentTheme === 'dark' ? 'dark' : 'light',
        particleCount: 50
      });
    }
  }, [currentTheme]);

  const handleGenerate = async () => {
    if (!secretVibe.trim()) {
      setStatus('Please enter a secret vibe');
      return;
    }

    setIsProcessing(true);
    setStatus('Generating sonic identity...');

    try {
      // Generate code using AI agent
      const agentResponse = await generateStrudelCode(secretVibe, { useRealAI });
      setGeneratedCode(agentResponse.code);

      // Extract DNA with enhanced security
      const dna = await extractSonicDNA(agentResponse.code, {
        includeTimestamp: true
      });

      if (dna) {
        setDnaHash(dna.hash);

        // Create session
        const session = sessionManager.createSession(
          secretVibe.trim(),
          dna.hash,
          dna.salt
        );

        setStatus('✅ Identity minted! Your sonic DNA is ready.');

        // Animate 3D visualizer
        if (visualizerRef.current) {
          visualizerRef.current.updateDNASequence(dna.dna);
          visualizerRef.current.playGenerationAnimation();
        }

        // Play success sound
        if (isAudioEnabled()) {
          playAudio('success');
        }
      } else {
        setStatus('❌ Failed to generate DNA. Try a different vibe.');
      }
    } catch (error) {
      console.error('Generation error:', error);
      setStatus('❌ Failed to generate code. Please try again.');
    }

    setIsProcessing(false);
  };

  const handleLock = () => {
    setIsLocked(true);
    setPhase('recovery');
    setStatus('🔒 Wallet locked. Ready for recovery.');

    // Reset visualizer
    if (visualizerRef.current) {
      visualizerRef.current.resetParticles();
    }

    if (isAudioEnabled()) {
      playAudio('lock');
    }
  };

  const handleRecovery = async () => {
    if (!recoveryVibe.trim()) {
      setStatus('Please enter your secret vibe');
      return;
    }

    setIsProcessing(true);
    setStatus('Generating proof...');

    try {
      // Generate code from recovery prompt
      const agentResponse = await generateStrudelCode(recoveryVibe, { useRealAI });
      const dna = await extractSonicDNA(agentResponse.code, {
        includeTimestamp: true
      });

      if (dna) {
        setRecoveryHash(dna.hash);

        // Compare hashes
        const session = sessionManager.getCurrentSession();
        const success = dna.hash === session?.storedHash;

        if (success) {
          setStatus('✅ Recovery successful! Identity verified.');

          // Animate success in visualizer
          if (visualizerRef.current) {
            visualizerRef.current.updateDNASequence(dna.dna);
            // Highlight all particles as matching
            visualizerRef.current.highlightParticles(
              Array.from({ length: 50 }, (_, i) => i)
            );
          }

          sessionManager.addRecoveryAttempt(recoveryVibe.trim(), true, dna.hash);
          onRecovery?.(dna.hash);

          if (isAudioEnabled()) {
            playAudio('success');
          }
        } else {
          setStatus('❌ Recovery failed. Vibe does not match.');

          // Show mismatch in visualizer
          if (visualizerRef.current) {
            visualizerRef.current.updateDNASequence(dna.dna);
            // Highlight no particles (showing mismatch)
            visualizerRef.current.highlightParticles([]);
          }

          sessionManager.addRecoveryAttempt(recoveryVibe.trim(), false, dna.hash);
          onFailure?.();

          if (isAudioEnabled()) {
            playAudio('error');
          }
        }
      } else {
        setStatus('❌ Failed to generate proof.');
      }
    } catch (error) {
      console.error('Recovery error:', error);
      setStatus('❌ Failed to generate proof. Please try again.');
    }

    setIsProcessing(false);
  };

  const handleReset = () => {
    sessionManager.clearSession();
    setPhase('registration');
    setSecretVibe('');
    setGeneratedCode('');
    setDnaHash('');
    setRecoveryVibe('');
    setRecoveryHash('');
    setStatus('');
    setIsLocked(false);
    setIsProcessing(false);

    // Reset visualizer
    if (visualizerRef.current) {
      visualizerRef.current.resetParticles();
    }

    if (isAudioEnabled()) {
      playAudio('reset');
    }
  };

  const playAudio = (type: 'success' | 'error' | 'lock' | 'reset' = 'success') => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }

    generateAudio(audioContextRef.current, type);
  };

  const toggleAudio = () => {
    const enabled = !isAudioEnabled();
    setAudioEnabled(enabled);
    if (enabled) {
      playAudio('success');
    }
  };

  const toggleAnimations = () => {
    const enabled = !areAnimationsEnabled();
    setAnimationsEnabled(enabled);
  };

  const toggleTheme = () => {
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    setCurrentTheme(newTheme);
    setTheme(newTheme);
  };

  const toggleRealAI = () => {
    const enabled = !useRealAI;
    setUseRealAI(enabled);
    setRealAIEnabled(enabled);
    setStatus(enabled ? '🤖 Real AI enabled' : '🤖 Mock agent enabled');
  };

  return (
    <div className="min-h-screen transition-colors duration-300 bg-[color:var(--color-background)] text-[color:var(--color-foreground)]">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-6xl font-bold bg-gradient-to-r from-[color:var(--color-primary)] via-[color:var(--color-accent)] to-[color:var(--color-success)] bg-clip-text text-transparent mb-4 animate-pulse">
            Sonic Guardian
          </h1>
          <p className="text-[color:var(--color-muted)] text-xl">Acoustic DNA Identity System</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* 3D Visualizer */}
          <div className="lg:col-span-1">
            <div
              ref={visualizerContainerRef}
              className="w-full h-[600px] rounded-2xl border border-[color:var(--color-border)] shadow-[var(--box-shadow)] overflow-hidden"
              style={{
                background: currentTheme === 'dark' ? '#0b1220' : '#ffffff'
              }}
            >
              {/* Visualizer will be injected here */}
            </div>

            {/* Visualizer Controls */}
            <div className="mt-4 flex flex-wrap gap-2 justify-center">
              <span className="px-3 py-1 bg-[color:var(--color-background)] border border-[color:var(--color-border)] rounded-full text-sm text-[color:var(--color-muted)]">
                Interactive 3D Visualization
              </span>
              <span className="px-3 py-1 bg-[color:var(--color-background)] border border-[color:var(--color-border)] rounded-full text-sm text-[color:var(--color-muted)]">
                Hover to Rotate • Scroll to Zoom
              </span>
            </div>
          </div>

          {/* Main Interface */}
          <div className="lg:col-span-1 space-y-6">
            {/* Controls */}
            <div className="flex flex-wrap gap-4 justify-center">
              <button
                onClick={toggleAudio}
                className="px-4 py-2 rounded-lg border border-[color:var(--color-border)] hover:bg-[color:var(--color-foreground)]/5 transition-colors"
              >
                🔊 Audio: {isAudioEnabled() ? 'ON' : 'OFF'}
              </button>

              <button
                onClick={toggleAnimations}
                className="px-4 py-2 rounded-lg border border-[color:var(--color-border)] hover:bg-[color:var(--color-foreground)]/5 transition-colors"
              >
                ✨ Animations: {areAnimationsEnabled() ? 'ON' : 'OFF'}
              </button>

              <button
                onClick={toggleTheme}
                className="px-4 py-2 rounded-lg border border-[color:var(--color-border)] hover:bg-[color:var(--color-foreground)]/5 transition-colors"
              >
                🌓 Theme: {currentTheme}
              </button>

              <button
                onClick={toggleRealAI}
                className={`px-4 py-2 rounded-lg border border-[color:var(--color-border)] transition-colors ${useRealAI
                  ? 'bg-[color:var(--color-success)]/20 border-[color:var(--color-success)] text-[color:var(--color-success)]'
                  : 'hover:bg-[color:var(--color-foreground)]/5'
                  }`}
              >
                🤖 AI: {useRealAI ? 'REAL' : 'MOCK'}
              </button>
            </div>

            {/* Registration Phase */}
            {phase === 'registration' && (
              <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                {/* Secret Vibe Input */}
                <div className="bg-[color:var(--color-background)] border border-[color:var(--color-border)] rounded-[var(--border-radius)] p-6 shadow-[var(--box-shadow)]">
                  <label className="block text-[color:var(--color-foreground)] text-sm font-medium mb-2">
                    Secret Vibe (Your Recovery Phrase)
                  </label>
                  <input
                    type="text"
                    value={secretVibe}
                    onChange={(e) => setSecretVibe(e.target.value)}
                    placeholder="e.g., A slow, muffled industrial bassline"
                    className="w-full px-4 py-3 rounded-[var(--border-radius)] border border-[color:var(--color-border)] bg-[color:var(--color-background)] text-[color:var(--color-foreground)] placeholder-[color:var(--color-muted)] focus:outline-none focus:ring-2 focus:ring-[color:var(--color-primary)]/50 focus:border-transparent transition-colors"
                    disabled={isProcessing}
                  />
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-4">
                  <button
                    onClick={handleGenerate}
                    disabled={isProcessing}
                    className="flex-1 bg-gradient-to-r from-[color:var(--color-primary)] via-[color:var(--color-accent)] to-[color:var(--color-success)] text-white py-4 px-6 rounded-[var(--border-radius)] font-semibold hover:opacity-90 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-[var(--box-shadow)] text-lg"
                  >
                    {isProcessing ? 'Generating...' : 'Generate & Mint Identity'}
                  </button>

                  <button
                    onClick={() => playAudio('success')}
                    className="bg-[color:var(--color-background)] border border-[color:var(--color-border)] text-[color:var(--color-foreground)] px-6 py-4 rounded-[var(--border-radius)] hover:bg-[color:var(--color-foreground)]/5 transition-colors font-semibold"
                  >
                    Test Audio
                  </button>
                </div>

                {/* Generated Code */}
                {generatedCode && (
                  <div className="bg-[color:var(--color-background)] border border-[color:var(--color-border)] rounded-[var(--border-radius)] p-6">
                    <h3 className="text-[color:var(--color-foreground)] font-semibold mb-2">Generated Strudel Code:</h3>
                    <pre className="text-[color:var(--color-muted)] text-sm font-mono bg-[color:var(--color-background)] p-4 rounded-[var(--border-radius)] overflow-auto">{generatedCode}</pre>
                  </div>
                )}

                {/* DNA Hash */}
                {dnaHash && (
                  <div className="bg-gradient-to-r from-[color:var(--color-success)]/20 to-[color:var(--color-accent)]/20 border border-[color:var(--color-success)]/50 rounded-[var(--border-radius)] p-6">
                    <h3 className="text-[color:var(--color-success)] font-semibold mb-2">Sonic DNA Hash:</h3>
                    <p className="text-[color:var(--color-success)]/80 font-mono text-sm break-all">{dnaHash}</p>
                  </div>
                )}

                {/* Lock Button */}
                <button
                  onClick={handleLock}
                  disabled={!dnaHash || isLocked || isProcessing}
                  className="w-full bg-gradient-to-r from-[color:var(--color-error)] to-[color:var(--color-warning)] text-white py-4 px-6 rounded-[var(--border-radius)] font-semibold hover:opacity-90 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-[var(--box-shadow)] text-lg"
                >
                  Simulate Wallet Lock
                </button>
              </div>
            )}

            {/* Recovery Phase */}
            {phase === 'recovery' && (
              <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                {/* Recovery Vibe Input */}
                <div className="bg-[color:var(--color-background)] border border-[color:var(--color-border)] rounded-[var(--border-radius)] p-6 shadow-[var(--box-shadow)]">
                  <label className="block text-[color:var(--color-foreground)] text-sm font-medium mb-2">
                    Recovery Vibe
                  </label>
                  <input
                    type="text"
                    value={recoveryVibe}
                    onChange={(e) => setRecoveryVibe(e.target.value)}
                    placeholder="Enter the same vibe you used during registration"
                    className="w-full px-4 py-3 rounded-[var(--border-radius)] border border-[color:var(--color-border)] bg-[color:var(--color-background)] text-[color:var(--color-foreground)] placeholder-[color:var(--color-muted)] focus:outline-none focus:ring-2 focus:ring-[color:var(--color-primary)]/50 focus:border-transparent transition-colors"
                    disabled={isProcessing}
                  />
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-4">
                  <button
                    onClick={handleRecovery}
                    disabled={isProcessing}
                    className="flex-1 bg-gradient-to-r from-[color:var(--color-success)] via-[color:var(--color-primary)] to-[color:var(--color-accent)] text-white py-4 px-6 rounded-[var(--border-radius)] font-semibold hover:opacity-90 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-[var(--box-shadow)] text-lg"
                  >
                    {isProcessing ? 'Verifying...' : 'Generate Proof & Recover'}
                  </button>

                  <button
                    onClick={() => playAudio('success')}
                    className="bg-[color:var(--color-background)] border border-[color:var(--color-border)] text-[color:var(--color-foreground)] px-6 py-4 rounded-[var(--border-radius)] hover:bg-[color:var(--color-foreground)]/5 transition-colors font-semibold"
                  >
                    Test Audio
                  </button>
                </div>

                {/* Recovery Hash */}
                {recoveryHash && (
                  <div className="bg-gradient-to-r from-[color:var(--color-primary)]/20 to-[color:var(--color-accent)]/20 border border-[color:var(--color-primary)]/50 rounded-[var(--border-radius)] p-6">
                    <h3 className="text-[color:var(--color-primary)] font-semibold mb-2">Recovery Hash:</h3>
                    <p className="text-[color:var(--color-primary)]/80 font-mono text-sm break-all">{recoveryHash}</p>
                  </div>
                )}

                {/* Status */}
                <div className="bg-[color:var(--color-background)] border border-[color:var(--color-border)] rounded-[var(--border-radius)] p-6">
                  <h3 className="text-[color:var(--color-foreground)] font-semibold mb-2">Status:</h3>
                  <p className={`font-medium ${status.includes('successful') ? 'text-[color:var(--color-success)]' :
                    status.includes('failed') ? 'text-[color:var(--color-error)]' :
                      'text-[color:var(--color-foreground)]'
                    }`}>
                    {status}
                  </p>
                </div>

                {/* Reset */}
                <div className="flex gap-4">
                  <button
                    onClick={handleReset}
                    className="flex-1 bg-[color:var(--color-background)] border border-[color:var(--color-border)] text-[color:var(--color-foreground)] py-4 px-6 rounded-[var(--border-radius)] font-semibold hover:bg-[color:var(--color-foreground)]/5 transition-colors"
                  >
                    Reset System
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}