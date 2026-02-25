'use client';

import React, { useState, useEffect } from 'react';
import { GiftingService, GiftVault } from '../lib/gifting';
import { playStrudelCode, stopStrudel } from '../lib/strudel';
import { extractSonicDNA } from '../lib/dna';
import { 
  generateEntropy, 
  encodePattern, 
  chunksToSeedPhrase,
  type MusicalChunk 
} from '../lib/entropy-encoder';

const VibeVisualizer = ({ isActive }: { isActive: boolean }) => (
  <div className="flex items-center gap-1 h-8">
    {[1, 2, 3, 4, 5].map((i) => (
      <div 
        key={i} 
        className={`w-1 bg-[color:var(--color-primary)] rounded-full transition-all duration-300 ${isActive ? 'animate-bounce' : 'h-2 opacity-30'}`}
        style={{ 
          height: isActive ? `${Math.random() * 100 + 20}%` : '8px',
          animationDelay: `${i * 0.1}s`,
          animationDuration: `${0.5 + Math.random()}s`
        }}
      />
    ))}
  </div>
);

export default function GiftApp() {
  const [mode, setMode] = useState<'send' | 'claim'>('send');
  const [btcAmount, setBtcAmount] = useState('0.001');
  const [musicalChunks, setMusicalChunks] = useState<MusicalChunk[]>([]);
  const [generatedCode, setGeneratedCode] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState('');
  const [giftVault, setGiftVault] = useState<GiftVault | null>(null);
  const [claimVaultId, setClaimVaultId] = useState('');
  const [claimChunks, setClaimChunks] = useState('');
  const [claimBlinding, setClaimBlinding] = useState('');
  const [recipientWallet, setRecipientWallet] = useState<any>(null);

  const giftingService = new GiftingService(process.env.NEXT_PUBLIC_STARKZAP_API_KEY || 'demo_key');

  const handleGenerateGiftVibe = () => {
    const entropy = generateEntropy();
    const encoded = encodePattern(entropy);
    setGeneratedCode(encoded.code);
    setMusicalChunks(encoded.chunks);
    setStatus('Musical gift vibe generated! Hear it?');
    playStrudelCode(encoded.code);
  };

  const handleCreateGift = async () => {
    if (!generatedCode) return;
    setIsProcessing(true);
    setStatus('Creating Bitcoin Gift Vault via Starkzap...');
    
    // Mock sender address for demo
    const senderAddress = "0x123...sender"; 
    
    const vault = await giftingService.createGift(
      senderAddress,
      btcAmount,
      generatedCode,
      musicalChunks.map(c => c.text)
    );

    if (vault) {
      setGiftVault(vault);
      setStatus('Gift Vault Created! Give the card to your friend.');
    } else {
      setStatus('Failed to create gift vault.');
    }
    setIsProcessing(false);
  };

  const handleSocialLogin = async () => {
    setIsProcessing(true);
    setStatus('Onboarding via Starkzap Social Login...');
    try {
      const result = await giftingService.socialLogin('google');
      setRecipientWallet(result);
      setStatus(`Welcome! Wallet created: ${result.address.substring(0, 10)}...`);
    } catch (error) {
      setStatus('Social login failed.');
    }
    setIsProcessing(false);
  };

  const handleClaimGift = async () => {
    if (!recipientWallet || !claimChunks) return;
    setIsProcessing(true);
    setStatus('Verifying Vibe & Claiming Bitcoin...');

    // In a real app, we'd reconstruct the code from chunks
    // For demo, we'll assume the chunks are correctly entered
    const success = await giftingService.claimGift(
      claimVaultId,
      recipientWallet.address,
      generatedCode, // Reconstructed in reality
      claimBlinding
    );

    if (success) {
      setStatus('Success! Bitcoin has been moved to your wallet.');
    } else {
      setStatus('Claim failed. Is the vibe correct?');
    }
    setIsProcessing(false);
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-6 space-y-8 animate-in fade-in duration-700">
      <div className="flex justify-center gap-4 mb-8">
        <button 
          onClick={() => setMode('send')}
          className={`px-6 py-2 rounded-full font-bold text-xs tracking-widest uppercase transition-all ${mode === 'send' ? 'bg-[color:var(--color-primary)] text-white' : 'glass text-[color:var(--color-muted)]'}`}
        >
          🎁 Send a Gift
        </button>
        <button 
          onClick={() => setMode('claim')}
          className={`px-6 py-2 rounded-full font-bold text-xs tracking-widest uppercase transition-all ${mode === 'claim' ? 'bg-[color:var(--color-primary)] text-white' : 'glass text-[color:var(--color-muted)]'}`}
        >
          ✨ Claim a Gift
        </button>
      </div>

      {mode === 'send' ? (
        <div className="glass rounded-3xl p-8 space-y-6 border border-[color:var(--color-primary)]/20">
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-bold tracking-tight text-gradient">Bitcoin Birthday Card</h2>
            <p className="text-sm text-[color:var(--color-muted)]">Attach BTC to a musical vibe and send it to anyone.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <label className="text-[10px] font-bold uppercase tracking-widest text-[color:var(--color-muted)] block">Gift Amount (BTC)</label>
              <input 
                type="text" 
                value={btcAmount}
                onChange={(e) => setBtcAmount(e.target.value)}
                className="w-full bg-transparent border-b-2 border-[color:var(--color-border)] py-3 focus:border-[color:var(--color-primary)] focus:outline-none font-mono text-xl"
              />
              
              <div className="flex items-center justify-between">
                <button 
                  onClick={handleGenerateGiftVibe}
                  className="flex-1 py-4 rounded-xl border border-[color:var(--color-primary)] text-[color:var(--color-primary)] font-bold tracking-widest uppercase text-xs hover:bg-[color:var(--color-primary)]/10 transition-all flex items-center justify-center gap-2"
                >
                  🎵 Generate Musical Vibe
                </button>
                {generatedCode && <div className="ml-4"><VibeVisualizer isActive={true} /></div>}
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-[color:var(--color-muted)]">Preview Card</h4>
              <div className="aspect-[4/3] bg-gradient-to-br from-[color:var(--color-primary)]/10 to-[color:var(--color-accent)]/10 rounded-2xl border border-white/10 p-6 flex flex-col justify-between relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-10 text-6xl">🎂</div>
                <div className="space-y-2 relative z-10">
                  <p className="text-xs font-bold uppercase tracking-widest opacity-50">Happy Birthday!</p>
                  <p className="text-lg font-medium leading-tight">Your Bitcoin gift is waiting inside this vibe...</p>
                </div>
                
                <div className="space-y-2 relative z-10">
                  {musicalChunks.length > 0 ? (
                    musicalChunks.map((c, i) => (
                      <div key={i} className="text-[10px] font-mono opacity-60">• {c.text}</div>
                    ))
                  ) : (
                    <div className="text-[10px] font-mono opacity-30 italic">Chunks will appear here</div>
                  )}
                </div>
                
                <div className="flex justify-between items-end relative z-10">
                  <div className="text-[10px] font-bold tracking-tighter uppercase opacity-40">Sonic Guardian x Starkzap</div>
                  <div className="text-xl font-bold text-[color:var(--color-primary)]">{btcAmount} BTC</div>
                </div>
              </div>
            </div>
          </div>

          <button 
            onClick={handleCreateGift}
            disabled={isProcessing || !generatedCode}
            className="w-full py-5 rounded-2xl bg-[color:var(--color-foreground)] text-[color:var(--background)] font-bold tracking-widest uppercase text-sm hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
          >
            {isProcessing ? 'Processing...' : '🎁 Create Gift Card'}
          </button>
          
          {status && <p className="text-center text-xs font-bold text-[color:var(--color-primary)] animate-pulse">{status}</p>}
        </div>
      ) : (
        <div className="glass rounded-3xl p-8 space-y-6 border border-[color:var(--color-accent)]/20">
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-bold tracking-tight text-gradient">Claim Your Gift</h2>
            <p className="text-sm text-[color:var(--color-muted)]">Login with Google to unlock your musical Bitcoin gift.</p>
          </div>

          {!recipientWallet ? (
            <button 
              onClick={handleSocialLogin}
              className="w-full py-5 rounded-2xl bg-white text-black font-bold tracking-widest uppercase text-sm flex items-center justify-center gap-3 hover:scale-[1.02] transition-all"
            >
              <img src="https://www.google.com/favicon.ico" className="w-4 h-4" />
              Continue with Google
            </button>
          ) : (
            <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
              <div className="p-4 rounded-xl bg-[color:var(--color-success)]/10 border border-[color:var(--color-success)]/20 text-center">
                <p className="text-xs font-bold text-[color:var(--color-success)]">Wallet Ready: {recipientWallet.address.substring(0, 16)}...</p>
              </div>
              
              <div className="space-y-4">
                <div className="relative group">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-[color:var(--color-muted)] mb-2 block">Gift Vault ID</label>
                  <input 
                    type="text" 
                    value={claimVaultId}
                    onChange={(e) => setClaimVaultId(e.target.value)}
                    placeholder="Enter the ID from your card..."
                    className="w-full bg-transparent border-b-2 border-[color:var(--color-border)] py-3 focus:border-[color:var(--color-primary)] focus:outline-none font-mono text-sm"
                  />
                </div>

                <div className="relative group">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-[color:var(--color-muted)] mb-2 block">Musical Vibe Chunks</label>
                  <textarea 
                    value={claimChunks}
                    onChange={(e) => setClaimChunks(e.target.value)}
                    placeholder="Type the chunks exactly as they appear on the card..."
                    className="w-full bg-transparent border-2 border-[color:var(--color-border)] rounded-xl p-4 focus:border-[color:var(--color-primary)] focus:outline-none font-mono text-sm h-32"
                  />
                </div>
              </div>

              <button 
                onClick={handleClaimGift}
                disabled={isProcessing || !claimChunks}
                className="w-full py-5 rounded-2xl bg-[color:var(--color-foreground)] text-[color:var(--background)] font-bold tracking-widest uppercase text-sm hover:scale-[1.02] transition-all disabled:opacity-50"
              >
                {isProcessing ? 'Claiming...' : '✨ Unlock Bitcoin'}
              </button>
            </div>
          )}
          
          {status && <p className="text-center text-xs font-bold text-[color:var(--color-primary)] animate-pulse">{status}</p>}
        </div>
      )}
    </div>
  );
}
