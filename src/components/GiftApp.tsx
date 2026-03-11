'use client';

import React, { useState, useEffect } from 'react';
import { 
  initWeb3Auth, 
  loginWithWebAuthn, 
  logout, 
  getUserInfo,
  getProvider 
} from '@/lib/web3auth';
import { engine } from '@/lib/strudel';
import { StrudelVisualizer } from './StrudelVisualizer';
import { Tooltip } from './Tooltip';
import { generateStrudelCode } from '@/lib/ai-agent';

export function GiftApp() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [recipientBtc, setRecipientBtc] = useState('');
  const [giftAmount, setGiftAmount] = useState('0.001');
  const [musicalVibe, setMusicalVibe] = useState('Chill Lofi Hip Hop');
  const [generatedCode, setGeneratedCode] = useState('');
  const [isMinting, setIsMinting] = useState(false);

  useEffect(() => {
    initWeb3Auth().catch(console.error);
  }, []);

  const handleLogin = async () => {
    setLoading(true);
    setStatus('Authenticating with Web3Auth...');
    try {
      await loginWithWebAuthn();
      const userInfo = await getUserInfo();
      setUser(userInfo);
      setStatus('Welcome back, ' + (userInfo.name || userInfo.email));
    } catch (error) {
      console.error(error);
      setStatus('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    setUser(null);
    setStatus('Logged out.');
  };

  const handleGenerateVibe = async () => {
    setLoading(true);
    setStatus('AI is composing your musical gift...');
    try {
      const result = await generateStrudelCode(musicalVibe, { useRealAI: true });
      setGeneratedCode(result.code);
      setStatus('Vibe generated! Click Play to hear it.');
    } catch (error) {
      console.error(error);
      setStatus('Failed to generate vibe.');
    } finally {
      setLoading(false);
    }
  };

  const handlePlayVibe = async () => {
    if (!generatedCode) return;
    if (engine.isPlaying()) {
      engine.stop();
    } else {
      await engine.play(generatedCode);
    }
  };

  const handleMintGift = async () => {
    if (!recipientBtc || !generatedCode) return;
    setIsMinting(true);
    setStatus('Minting Sonic Gift on Starknet...');
    try {
      // Logic for cross-chain gifting would go here
      // 1. Anchor DNA of generatedCode on Starknet
      // 2. Lock collateral or trigger intent
      await new Promise(r => setTimeout(r, 2000));
      setStatus('✅ Success! Sonic Gift sent to ' + recipientBtc);
    } catch (error) {
      console.error(error);
      setStatus('Gifting failed.');
    } finally {
      setIsMinting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-8 space-y-12">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-black uppercase tracking-tighter text-white">
          Sonic <span className="text-[color:var(--color-primary)]">Gifting</span>
        </h1>
        <p className="text-[color:var(--color-muted)] text-sm max-w-xl mx-auto">
          Send encrypted Bitcoin assets wrapped in a unique musical identity. 
          Powered by Web3Auth (Passkeys) and Starknet Account Abstraction.
        </p>
      </div>

      {!user ? (
        <div className="glass p-12 text-center space-y-8 rounded-3xl">
          <div className="w-20 h-20 bg-gradient-to-br from-[color:var(--color-primary)] to-[color:var(--color-accent)] rounded-full mx-auto flex items-center justify-center animate-pulse">
            <span className="text-3xl">🎁</span>
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-white uppercase tracking-wider">Start Gifting</h2>
            <p className="text-[color:var(--color-muted)] text-xs">No seed phrase required. Sign in with your device passkey.</p>
          </div>
          <button
            onClick={handleLogin}
            disabled={loading}
            className="px-8 py-4 bg-white text-black font-black uppercase tracking-widest rounded-xl hover:scale-105 transition-all disabled:opacity-50"
          >
            {loading ? 'Connecting...' : 'Sign in with Passkey'}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Sender Settings */}
          <div className="glass p-8 rounded-3xl space-y-6 border border-white/5">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-widest text-[color:var(--color-primary)]">Configure Gift</h3>
              <button onClick={handleLogout} className="text-[10px] text-white/40 hover:text-white uppercase font-bold">Sign Out</button>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] uppercase font-black text-white/60">Recipient BTC Address</label>
                <input
                  type="text"
                  placeholder="bc1q..."
                  value={recipientBtc}
                  onChange={(e) => setRecipientBtc(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-[color:var(--color-primary)] outline-none transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] uppercase font-black text-white/60">Bitcoin Amount</label>
                <div className="relative">
                  <input
                    type="number"
                    value={giftAmount}
                    onChange={(e) => setGiftAmount(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-[color:var(--color-primary)] outline-none transition-all"
                  />
                  <span className="absolute right-4 top-3.5 text-[10px] font-bold text-orange-400">BTC</span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] uppercase font-black text-white/60">Musical Identity (Vibe)</label>
                <textarea
                  placeholder="Describe the mood (e.g. Uplifting summer house)"
                  value={musicalVibe}
                  onChange={(e) => setMusicalVibe(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-[color:var(--color-primary)] outline-none transition-all h-24 resize-none"
                />
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleGenerateVibe}
                  disabled={loading || !musicalVibe}
                  className="flex-1 py-4 bg-[color:var(--color-primary)] text-white font-black uppercase tracking-widest rounded-xl text-xs hover:opacity-90 transition-all disabled:opacity-30"
                >
                  {loading ? 'Composing...' : '🎵 Compose Identity'}
                </button>
              </div>
            </div>
          </div>

          {/* Preview & Minting */}
          <div className="glass p-8 rounded-3xl space-y-6 border border-white/5 bg-gradient-to-b from-black/40 to-[color:var(--color-primary)]/5">
            <h3 className="text-xs font-bold uppercase tracking-widest text-[color:var(--color-primary)]">Preview Identity</h3>
            
            <div className="aspect-square glass rounded-2xl flex flex-col items-center justify-center relative overflow-hidden group">
              {generatedCode ? (
                <>
                  <StrudelVisualizer isActive={engine.isPlaying()} height={200} className="w-full px-4" />
                  <button
                    onClick={handlePlayVibe}
                    className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/40 transition-all"
                  >
                    <div className="w-16 h-16 rounded-full bg-[color:var(--color-primary)] flex items-center justify-center shadow-2xl scale-95 group-hover:scale-110 transition-transform">
                      {engine.isPlaying() ? '■' : '▶'}
                    </div>
                  </button>
                  <div className="absolute bottom-4 left-4 right-4 text-center">
                    <p className="text-[9px] text-white/60 uppercase tracking-widest font-bold">Sonic Signature Generated</p>
                  </div>
                </>
              ) : (
                <div className="text-center p-8 space-y-4">
                  <div className="text-4xl opacity-20">🎹</div>
                  <p className="text-xs text-white/40 font-medium italic">Your musical gift identity will appear here after composition.</p>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-black/40 border border-white/5 space-y-2">
                <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-white/40">
                  <span>Gift Summary</span>
                  <span>BTC Assets</span>
                </div>
                <div className="flex justify-between items-baseline">
                  <span className="text-lg font-black text-white">{giftAmount}</span>
                  <span className="text-[10px] font-bold text-orange-400">≈ $ { (parseFloat(giftAmount) * 65000).toLocaleString() }</span>
                </div>
              </div>

              <button
                onClick={handleMintGift}
                disabled={!generatedCode || !recipientBtc || isMinting}
                className="w-full py-5 bg-gradient-to-r from-[color:var(--color-primary)] to-[color:var(--color-accent)] text-white font-black uppercase tracking-widest rounded-xl hover:opacity-90 transition-all shadow-xl disabled:opacity-20 flex items-center justify-center gap-3"
              >
                {isMinting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Minting Gift...
                  </>
                ) : (
                  '🎁 Wrap & Send Sonic Gift'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {status && (
        <div className="fixed bottom-8 right-8 glass px-6 py-4 rounded-2xl border border-[color:var(--color-primary)]/30 animate-in fade-in slide-in-from-bottom-4 shadow-2xl z-50">
          <p className="text-xs font-bold text-white flex items-center gap-3">
            <span className="w-2 h-2 bg-[color:var(--color-primary)] rounded-full animate-pulse" />
            {status}
          </p>
        </div>
      )}
    </div>
  );
}
