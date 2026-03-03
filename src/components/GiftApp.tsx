'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { GiftingService } from '@/lib/gifting';
import { GiftVault } from '@/lib/storage';
import { playStrudelCode, stopStrudel, setDrawCallback } from '@/lib/strudel';
import { extractSonicDNA, detectAndReconstructCode } from '@/lib/dna';
import { isValidBtcAddress } from '@/lib/crypto';
import {
  generateEntropy,
  encodePattern,
  chunksToSeedPhrase,
  type MusicalChunk
} from '@/lib/entropy-encoder';
import { StrudelVisualizer } from './StrudelVisualizer';
import { initWeb3Auth, socialLogin } from '@/lib/web3auth';
import { useStarknetGuardian } from '../hooks/use-starknet-guardian';
import { generateBlinding, pedersen, encryptData, deriveKeyFromSignature, decryptData } from '@/lib/crypto';
import { uploadToIPFS, downloadFromIPFS } from '@/lib/ipfs';
import { useAccount } from '@starknet-react/core';
import { WalletButton } from './WalletButton';
import { Tooltip } from './Tooltip';

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
  const [senderWallet, setSenderWallet] = useState<any>(null);
  const [giftCid, setGiftCid] = useState<string | null>(null);

  const { account } = useAccount();

  const giftingService = new GiftingService();

  // Initialize Web3Auth on mount
  useEffect(() => {
    initWeb3Auth().catch(console.error);
  }, []);

  // Setup draw callback for visualizer
  const [activeHaps, setActiveHaps] = useState<any[]>([]);

  useEffect(() => {
    setDrawCallback((haps: any[]) => {
      setActiveHaps(haps.filter((h: any) => h.isActive?.(performance.now() / 1000)));
    });

    return () => setDrawCallback(null);
  }, []);

  const handleGenerateGiftVibe = () => {
    const entropy = generateEntropy();
    const encoded = encodePattern(entropy);
    setGeneratedCode(encoded.code);
    setMusicalChunks(encoded.chunks);
    setStatus('Musical gift vibe generated! Hear it?');
    playStrudelCode(encoded.code);
  };

  const {
    isConnected,
    address,
    createOnChainGift,
    claimOnChainGift
  } = useStarknetGuardian();

  const handleCreateGift = async () => {
    if (!generatedCode || !address || !account) return;
    setIsProcessing(true);
    setStatus('Creating On-Chain Bitcoin Gift Vault...');

    try {
      const dna = await extractSonicDNA(generatedCode);
      if (!dna) throw new Error("DNA extraction failed");

      const blinding = generateBlinding();
      const commitment = await pedersen(dna.hash, blinding);
      const vaultId = `0x${commitment.substring(0, 16)}`;

      // 1 ETH = 10^18. For BTC usually 8 decimals but most bridged are 18.
      const amount = BigInt(Math.floor(parseFloat(btcAmount) * 10 ** 18));
      const tokenAddress = "0x03fe2b97c1fd33ed324546411f97df48074902b794ba2422f2f7fc8b48f98d02";

      await createOnChainGift(vaultId, commitment, amount, tokenAddress);

      // 2. Upload Encrypted Metadata to IPFS for the recipient
      setStatus('🔐 Encrypting Gift Card for IPFS Backup...');
      const sig = await account.signMessage({
        message: "SonicGuardian Gift Authorization - This signature encrypts your gift metadata so only you or your recipient can read it from IPFS.",
      } as any);
      const sigStr = Array.isArray(sig) ? sig.join('') : JSON.stringify(sig);
      const encKey = await deriveKeyFromSignature(sigStr);
      
      const payload = JSON.stringify({
        vaultId,
        amount: btcAmount,
        musicalChunks: musicalChunks.map(c => c.text),
        blinding,
        dnaHash: dna.hash,
        code: generatedCode
      });

      const encrypted = await encryptData(payload, encKey);
      setStatus('🌐 Pinning Gift to the Decentralized Web...');
      const ipfsResult = await uploadToIPFS(encrypted, { vaultId, type: 'gift' });
      
      if (ipfsResult) {
        setGiftCid(ipfsResult.cid);
      }

      const vault: GiftVault = {
        id: vaultId,
        sender: address,
        amount: btcAmount,
        commitment,
        blinding,
        status: 'locked',
        musicalChunks: musicalChunks.map(c => c.text),
        createdAt: Date.now(),
        cid: ipfsResult?.cid
      };

      setGiftVault(vault);
      setStatus('Success! Your Bitcoin is now locked in a Musical Vault.');
    } catch (error) {
      console.error(error);
      setStatus('Failed to create on-chain gift.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSocialLogin = async () => {
    setIsProcessing(true);
    setStatus('Onboarding via Social Login...');
    try {
      const result = await socialLogin('google');
      setStatus(`Welcome! Wallet created: ${result.address.substring(0, 10)}...`);
    } catch (error) {
      setStatus('Social login failed.');
    }
    setIsProcessing(false);
  };

  const handleClaimGift = async () => {
    if (!address || !claimChunks) return;
    setIsProcessing(true);
    setStatus('Analysis phase: determining recovery route...');

    try {
      let finalDnaHash = '';
      let finalBlinding = claimBlinding;
      let finalVaultId = claimVaultId;
      let finalCode = '';

      // 1. Check if input is an IPFS CID
      if (claimChunks.startsWith('Qm')) {
        setStatus('🌐 Fetching encrypted gift from IPFS...');
        const encryptedData = await downloadFromIPFS(claimChunks);
        if (!encryptedData) throw new Error('Could not find gift on IPFS');

        if (!account) throw new Error('Wallet not connected');

        setStatus('🔐 Deriving decryption key from your wallet...');
        const sig = await account.signMessage({
          message: "SonicGuardian Gift Authorization - This signature encrypts your gift metadata so only you or your recipient can read it from IPFS.",
        } as any);
        const sigStr = Array.isArray(sig) ? sig.join('') : JSON.stringify(sig);
        const decKey = await deriveKeyFromSignature(sigStr);
        
        setStatus('🔓 Decrypting gift metadata...');
        const decryptedData = await decryptData(encryptedData, decKey);
        const backup = JSON.parse(decryptedData);
        
        finalDnaHash = backup.dnaHash;
        finalBlinding = backup.blinding;
        finalVaultId = backup.vaultId;
        finalCode = backup.code;
        
        setStatus('✅ Gift metadata decrypted! Playing signature...');
        playStrudelCode(finalCode);
      } else {
        setStatus('Verifying Sonic Signature on Starknet...');
        const reconstructedCode = detectAndReconstructCode(claimChunks) || claimChunks;
        const dna = await extractSonicDNA(reconstructedCode);
        if (!dna) throw new Error("DNA extraction failed");
        
        finalDnaHash = dna.hash;
        finalCode = reconstructedCode;
      }

      await claimOnChainGift(
        finalVaultId,
        finalDnaHash,
        finalBlinding,
        address
      );

      setStatus('Success! The Bitcoin gift has been transferred to your wallet.');
      playStrudelCode(finalCode);
    } catch (error) {
      console.error(error);
      setStatus('Claim failed. The blockchain or decryption rejected the signature.');
    } finally {
      setIsProcessing(false);
    }
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
            <h2 className="text-3xl font-bold tracking-tight text-gradient">Sonic Greeting Card</h2>
            <p className="text-sm text-[color:var(--color-muted)]">Gift tokens with a custom sonic signature.</p>
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
                {generatedCode && (
                  <div className="ml-4 w-32">
                    <StrudelVisualizer isActive={activeHaps.length > 0} getActiveHaps={() => activeHaps} height={60} />
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-[color:var(--color-muted)]">Preview Card</h4>
              <div className="aspect-[4/3] bg-gradient-to-br from-[color:var(--color-primary)]/10 to-[color:var(--color-accent)]/10 rounded-2xl border border-white/10 p-6 flex flex-col justify-between relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-10 text-6xl">🎂</div>
                <div className="space-y-2 relative z-10">
                  <p className="text-xs font-bold uppercase tracking-widest opacity-50">Sonic Gift</p>
                  <p className="text-lg font-medium leading-tight">Your on-chain gift is wrapped in this sonic signature...</p>
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
            disabled={isProcessing || !generatedCode || !address}
            className="w-full py-5 rounded-2xl bg-[color:var(--color-foreground)] text-[color:var(--background)] font-bold tracking-widest uppercase text-sm hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
          >
            {isProcessing ? 'Processing...' : !address ? 'Connect Wallet to Create Gift' : '🎁 Create Gift Card'}
          </button>

          {giftVault && (
            <div className="glass rounded-xl p-6 border border-[color:var(--color-success)]/40 bg-[color:var(--color-success)]/5 space-y-3 animate-in fade-in duration-500">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-[color:var(--color-success)] rounded-full animate-pulse" />
                <p className="text-xs font-bold text-[color:var(--color-success)] uppercase tracking-widest">Gift Created Successfully!</p>
              </div>
              <p className="text-[10px] text-[color:var(--color-muted)]">Vault ID: <span className="font-mono text-[color:var(--color-foreground)]">{giftVault.id}</span></p>
              {giftVault.cid && (
                <div className="p-3 rounded-lg bg-black/40 border border-white/5 space-y-2">
                  <p className="text-[9px] font-bold text-[color:var(--color-primary)] uppercase tracking-tight">Decentralized Share Link (IPFS)</p>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[9px] font-mono opacity-60 truncate">ipfs://{giftVault.cid}</span>
                    <button 
                      onClick={() => {
                        navigator.clipboard.writeText(`https://sonicguardian.vercel.app/gift/${giftVault.cid}`);
                        setStatus('Gift Link copied!');
                      }}
                      className="text-[9px] font-bold uppercase text-[color:var(--color-primary)] hover:underline"
                    >
                      Copy Link
                    </button>
                  </div>
                </div>
              )}
              <p className="text-[10px] text-[color:var(--color-muted)] leading-relaxed italic">
                Share this link or the Vault ID + Chunks with your friend. They'll need to "sing" the pattern back to prove authorship and claim the gift.
              </p>
            </div>
          )}

          {status && <p className="text-center text-xs font-bold text-[color:var(--color-primary)] animate-pulse">{status}</p>}
        </div>
      ) : (
        <div className="glass rounded-3xl p-8 space-y-6 border border-[color:var(--color-accent)]/20">
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-bold tracking-tight text-gradient">Claim Your Gift</h2>
            <p className="text-sm text-[color:var(--color-muted)]">Login with Google to unlock your musical Bitcoin gift.</p>
          </div>

          {!address ? (
            <div className="space-y-4">
              <button
                onClick={handleSocialLogin}
                className="w-full py-5 rounded-2xl bg-white text-black font-bold tracking-widest uppercase text-sm flex items-center justify-center gap-3 hover:scale-[1.02] transition-all"
              >
                <img src="https://www.google.com/favicon.ico" className="w-4 h-4" />
                Login with Google
              </button>
              <div className="text-center text-[10px] text-[color:var(--color-muted)] font-bold uppercase tracking-widest">or</div>
              <WalletButton />
            </div>
          ) : (
            <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
              <div className="p-4 rounded-xl bg-[color:var(--color-success)]/10 border border-[color:var(--color-success)]/20 text-center">
                <p className="text-xs font-bold text-[color:var(--color-success)]">Wallet Ready: {address.substring(0, 16)}...</p>
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
                  <label className="text-[10px] font-bold uppercase tracking-widest text-[color:var(--color-muted)] mb-2 block flex justify-between">
                    <span>Musical Vibe Chunks or IPFS CID</span>
                    {claimChunks.startsWith('Qm') && (
                      <span className="text-[8px] text-[color:var(--color-success)] font-bold animate-pulse">IPFS Mode Active</span>
                    )}
                  </label>
                  <textarea
                    value={claimChunks}
                    onChange={(e) => setClaimChunks(e.target.value)}
                    placeholder="Type the chunks OR paste the Qm... CID from your friend"
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
