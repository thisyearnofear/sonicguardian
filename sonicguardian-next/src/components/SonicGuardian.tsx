import React, { useState, useRef, useEffect } from 'react';
import { extractSonicDNA, mockAgentGenerate } from '../lib/dna';

interface SonicGuardianProps {
  onRecoverySuccess?: (hash: string) => void;
  onRecoveryFailure?: () => void;
}

export default function SonicGuardian({ onRecoverySuccess, onRecoveryFailure }: SonicGuardianProps) {
  const [step, setStep] = useState<'registration' | 'recovery'>('registration');
  const [secretPrompt, setSecretPrompt] = useState('A slow, muffled industrial bassline');
  const [recoveryPrompt, setRecoveryPrompt] = useState('');
  const [storedHash, setStoredHash] = useState<string>('');
  const [generatedCode, setGeneratedCode] = useState<string>('');
  const [recoveryCode, setRecoveryCode] = useState<string>('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState('');
  const audioContextRef = useRef<AudioContext | null>(null);
  const oscillatorRef = useRef<OscillatorNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);

  // Initialize audio context
  useEffect(() => {
    audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    return () => {
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }
    };
  }, []);

  const generateIdentity = async () => {
    try {
      setStatus('idle');
      const code = mockAgentGenerate(secretPrompt);
      setGeneratedCode(code);
      
      // Play sound
      await playSound(code);
      
      // Extract DNA
      const dna = extractSonicDNA(code);
      if (dna) {
        setStoredHash(dna.hash);
        setStatus('success');
        setStatusMessage(`IDENTITY MINTED\nDNA Hash: ${dna.hash.substring(0, 16)}...`);
      } else {
        setStatus('error');
        setStatusMessage('Failed to generate DNA from code');
      }
    } catch (error) {
      console.error('Error generating identity:', error);
      setStatus('error');
      setStatusMessage('Error generating identity');
    }
  };

  const lockWallet = () => {
    stopSound();
    setStep('recovery');
  };

  const attemptRecovery = async () => {
    try {
      setStatus('idle');
      const code = mockAgentGenerate(recoveryPrompt);
      setRecoveryCode(code);
      
      // Play sound
      await playSound(code);
      
      // Extract DNA
      const dna = extractSonicDNA(code);
      if (dna) {
        if (dna.hash === storedHash) {
          setStatus('success');
          setStatusMessage(`✅ RECOVERY SUCCESSFUL\nDNA MATCHED: ${dna.hash.substring(0, 16)}...\nNew Private Key Generated.`);
          onRecoverySuccess?.(dna.hash);
        } else {
          setStatus('error');
          setStatusMessage(`❌ RECOVERY FAILED\nDNA MISMATCH.\nExpected: ${storedHash.substring(0, 8)}...\nGot: ${dna.hash.substring(0, 8)}...`);
          onRecoveryFailure?.();
        }
      } else {
        setStatus('error');
        setStatusMessage('Failed to extract DNA from recovery code');
      }
    } catch (error) {
      console.error('Error during recovery:', error);
      setStatus('error');
      setStatusMessage('Error during recovery');
    }
  };

  const playSound = async (code: string) => {
    try {
      if (!audioContextRef.current) return;
      
      // Resume audio context if suspended
      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
      }

      // Simple audio generation based on the code
      const now = audioContextRef.current.currentTime;
      
      // Create oscillator and gain node
      oscillatorRef.current = audioContextRef.current.createOscillator();
      gainNodeRef.current = audioContextRef.current.createGain();
      
      oscillatorRef.current.type = 'sawtooth';
      oscillatorRef.current.frequency.setValueAtTime(100, now);
      
      gainNodeRef.current.gain.setValueAtTime(0.1, now);
      gainNodeRef.current.gain.exponentialRampToValueAtTime(0.01, now + 1.0);
      
      oscillatorRef.current.connect(gainNodeRef.current);
      gainNodeRef.current.connect(audioContextRef.current.destination);
      
      oscillatorRef.current.start(now);
      oscillatorRef.current.stop(now + 1.0);
      
      setIsPlaying(true);
      
      // Stop after duration
      setTimeout(() => {
        setIsPlaying(false);
      }, 1000);
      
    } catch (error) {
      console.error('Error playing sound:', error);
    }
  };

  const stopSound = () => {
    if (oscillatorRef.current) {
      try {
        oscillatorRef.current.stop();
        oscillatorRef.current.disconnect();
      } catch (error) {
        // Ignore errors when stopping
      }
      oscillatorRef.current = null;
    }
    if (gainNodeRef.current) {
      gainNodeRef.current.disconnect();
      gainNodeRef.current = null;
    }
    setIsPlaying(false);
  };

  const getStatusClass = () => {
    switch (status) {
      case 'success': return 'bg-green-900/20 border-green-500 text-green-400';
      case 'error': return 'bg-red-900/20 border-red-500 text-red-400';
      default: return 'bg-gray-800 border-gray-600 text-gray-300';
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-green-400 mb-2">Sonic Guardian</h1>
            <p className="text-gray-400">Zero-Knowledge Acoustic Identity Recovery for Starknet</p>
          </div>

          {/* Registration Panel */}
          {step === 'registration' && (
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h2 className="text-2xl font-semibold mb-4 text-green-400">1. Create Identity</h2>
              <p className="text-gray-300 mb-4">
                Enter a "Secret Vibe" only you know. This will generate your acoustic DNA.
              </p>
              
              <div className="space-y-4">
                <input
                  type="text"
                  value={secretPrompt}
                  onChange={(e) => setSecretPrompt(e.target.value)}
                  placeholder="e.g. A fast, crunchy techno beat..."
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500"
                />
                
                <button
                  onClick={generateIdentity}
                  disabled={isPlaying}
                  className="w-full py-3 px-4 bg-green-500 text-black font-bold rounded-lg hover:bg-green-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isPlaying ? 'Generating...' : 'Generate & Mint Identity'}
                </button>

                {generatedCode && (
                  <div className="mt-6">
                    <h3 className="text-sm font-semibold text-gray-400 mb-2">Generated Code:</h3>
                    <div className="bg-black p-4 rounded-lg font-mono text-sm text-green-400 overflow-x-auto">
                      {generatedCode}
                    </div>
                  </div>
                )}

                {storedHash && (
                  <div className="mt-4 p-4 border-2 rounded-lg border-dashed border-green-500">
                    <h3 className="text-sm font-semibold text-green-400 mb-2">Identity Status</h3>
                    <div className="text-sm text-gray-300">
                      <div className="font-mono text-green-400">{storedHash.substring(0, 16)}...</div>
                      <div className="text-xs text-gray-500 mt-1">DNA Hash (Truncated)</div>
                    </div>
                    <button
                      onClick={lockWallet}
                      className="mt-4 w-full py-2 px-4 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-500 transition-colors"
                    >
                      Simulate Wallet Lock (Lose Key)
                    </button>
                  </div>
                )}

                {status !== 'idle' && (
                  <div className={`mt-4 p-4 border-2 rounded-lg ${getStatusClass()}`}>
                    <div className="font-mono whitespace-pre-wrap">{statusMessage}</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Recovery Panel */}
          {step === 'recovery' && (
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h2 className="text-2xl font-semibold mb-4 text-blue-400">2. Recover Wallet</h2>
              <p className="text-red-400 mb-2">⚠️ WALLET LOCKED. KEY LOST.</p>
              <p className="text-gray-300 mb-4">
                To rotate your key, prove you know the Sonic Secret.
              </p>
              
              <div className="space-y-4">
                <input
                  type="text"
                  value={recoveryPrompt}
                  onChange={(e) => setRecoveryPrompt(e.target.value)}
                  placeholder="What was your secret vibe?"
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
                
                <button
                  onClick={attemptRecovery}
                  disabled={isPlaying || !recoveryPrompt.trim()}
                  className="w-full py-3 px-4 bg-blue-500 text-white font-bold rounded-lg hover:bg-blue-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isPlaying ? 'Generating Proof...' : 'Generate Proof & Recover'}
                </button>

                {recoveryCode && (
                  <div className="mt-6">
                    <h3 className="text-sm font-semibold text-gray-400 mb-2">Recovery Code:</h3>
                    <div className="bg-black p-4 rounded-lg font-mono text-sm text-blue-400 overflow-x-auto">
                      {recoveryCode}
                    </div>
                  </div>
                )}

                {status !== 'idle' && (
                  <div className={`mt-4 p-4 border-2 rounded-lg ${getStatusClass()}`}>
                    <div className="font-mono whitespace-pre-wrap">{statusMessage}</div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}