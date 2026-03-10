'use client';

import React, { useState } from 'react';
import { isValidBtcAddress } from '@/lib/crypto';
import { Tooltip } from './Tooltip';
import { useBitcoinWallet } from '@/hooks/use-bitcoin-wallet';

interface ValidationState {
  isValid: boolean;
  message: string;
  type: 'error' | 'warning' | 'success';
}

interface ProtocolFormProps {
  phase: 'registration' | 'recovery';
  btcAddress: string;
  setBtcAddress: (value: string) => void;
  secretVibe: string;
  setSecretVibe: (value: string) => void;
  recoveryVibe: string;
  setRecoveryVibe: (value: string) => void;
  dnaHash: string;
  useSecureGeneration: boolean;
  setUseSecureGeneration: (value: boolean) => void;
  isProcessing: boolean;
  isConnected: boolean;
  onChainStatus: 'none' | 'pending' | 'success' | 'failed';
  onGenerate: () => void;
  onRecovery: () => void;
  onCommit: () => void;
  onSwitchPhase: () => void;
  validationStates: Map<string, ValidationState>;
  isCommiting?: boolean;
  getCommitment?: (address: string) => Promise<string | null>;
  onVerifyOnChain?: () => void;
  onDecentralizedBackup?: () => void;
  isBackingUp?: boolean;
  backupCid?: string | null;
  setStatus?: (status: string) => void;
}

export function ProtocolForm({
  phase,
  btcAddress,
  setBtcAddress,
  secretVibe,
  setSecretVibe,
  recoveryVibe,
  setRecoveryVibe,
  dnaHash,
  useSecureGeneration,
  setUseSecureGeneration,
  isProcessing,
  isConnected,
  onChainStatus,
  onGenerate,
  onRecovery,
  onCommit,
  onSwitchPhase,
  validationStates,
  isCommiting = false,
  onVerifyOnChain,
  onDecentralizedBackup,
  isBackingUp = false,
  backupCid = null,
  setStatus,
}: ProtocolFormProps) {
  return (
    <div className="glass rounded-[var(--border-radius)] p-8 space-y-6 flex flex-col justify-between h-full">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold tracking-tight">
            {phase === 'registration' ? 'Mint Sonic Identity' : 'Verify Authorship'}
          </h2>
        </div>

        {phase === 'registration' ? (
          <RegistrationForm
            btcAddress={btcAddress}
            setBtcAddress={setBtcAddress}
            secretVibe={secretVibe}
            setSecretVibe={setSecretVibe}
            useSecureGeneration={useSecureGeneration}
            setUseSecureGeneration={setUseSecureGeneration}
            isProcessing={isProcessing}
            dnaHash={dnaHash}
            isConnected={isConnected}
            onChainStatus={onChainStatus}
            onCommit={onCommit}
            validationStates={validationStates}
            isCommiting={isCommiting}
            onVerifyOnChain={onVerifyOnChain}
            onDecentralizedBackup={onDecentralizedBackup}
            isBackingUp={isBackingUp}
            backupCid={backupCid}
            setStatus={setStatus}
          />
        ) : (
          <RecoveryForm
            btcAddress={btcAddress}
            setBtcAddress={setBtcAddress}
            recoveryVibe={recoveryVibe}
            setRecoveryVibe={setRecoveryVibe}
            isProcessing={isProcessing}
            validationStates={validationStates}
          />
        )}
      </div>

      <div className="space-y-4 pt-4 border-t border-[color:var(--color-border)] mt-auto">
        <button
          onClick={phase === 'registration' ? onGenerate : onRecovery}
          disabled={isProcessing || (phase === 'registration' && !btcAddress.trim()) || (phase === 'registration' && !isValidBtcAddress(btcAddress))}
          className="w-full py-5 rounded-2xl bg-[color:var(--color-foreground)] text-[color:var(--background)] font-bold tracking-widest uppercase text-sm hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 overflow-hidden group relative"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-[color:var(--color-primary)] to-[color:var(--color-accent)] opacity-0 group-hover:opacity-100 transition-opacity" />
          <span className="relative z-10">
            {isProcessing ? 'Processing...' : (
              phase === 'registration'
                ? 'Mint Sonic Identity'
                : 'Verify Authorship'
            )}
          </span>
          {isProcessing && <div className="w-4 h-4 border-2 border-[color:var(--background)] border-t-transparent rounded-full animate-spin relative z-10" />}
        </button>

        <button
          onClick={onSwitchPhase}
          className="w-full py-3 rounded-xl border border-[color:var(--color-border)] text-[color:var(--color-muted)] text-xs font-bold uppercase tracking-widest hover:text-[color:var(--color-foreground)] hover:border-[color:var(--color-foreground)] transition-all"
        >
          {phase === 'registration' ? 'Switch to Verification →' : '← Back to Minting'}
        </button>
      </div>
    </div>
  );
}

function RegistrationForm({
  btcAddress,
  setBtcAddress,
  secretVibe,
  setSecretVibe,
  useSecureGeneration,
  setUseSecureGeneration,
  isProcessing,
  dnaHash,
  isConnected,
  onChainStatus,
  onCommit,
  validationStates,
  isCommiting,
  onVerifyOnChain,
  onDecentralizedBackup,
  isBackingUp,
  backupCid,
  setStatus,
}: {
  btcAddress: string;
  setBtcAddress: (value: string) => void;
  secretVibe: string;
  setSecretVibe: (value: string) => void;
  useSecureGeneration: boolean;
  setUseSecureGeneration: (value: boolean) => void;
  isProcessing: boolean;
  dnaHash: string;
  isConnected: boolean;
  onChainStatus: 'none' | 'pending' | 'success' | 'failed';
  onCommit: () => void;
  validationStates: Map<string, ValidationState>;
  isCommiting: boolean;
  onVerifyOnChain?: () => void;
  onDecentralizedBackup?: () => void;
  isBackingUp: boolean;
  backupCid: string | null;
  setStatus?: (status: string) => void;
}) {
  const btcValidation = validationStates.get('btc-address');
  const vibeValidation = validationStates.get('custom-vibe');
  const { addresses, isConnected: isBtcConnected, connect: connectBtcWallet, disconnect: disconnectBtcWallet, isLoading: isBtcLoading, walletName } = useBitcoinWallet();
  const [copiedAddr, setCopiedAddr] = useState<string | null>(null);

  const handleConnectBtcWallet = async () => {
    await connectBtcWallet();
  };

  const handleDisconnectBtcWallet = () => {
    disconnectBtcWallet();
    if (!btcAddress || addresses.some(a => a.address === btcAddress)) {
      setBtcAddress('');
    }
  };

  const handleSelectBtcAddress = (addr: string) => {
    setBtcAddress(addr);
  };

  const handleCopyAddress = (addr: string) => {
    navigator.clipboard.writeText(addr);
    setCopiedAddr(addr);
    setTimeout(() => setCopiedAddr(null), 2000);
  };

  return (
    <div className="space-y-4">
      <div className="p-4 rounded-xl bg-[color:var(--color-success)]/5 border border-[color:var(--color-success)]/20 shadow-sm">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-2 h-2 bg-[color:var(--color-success)] rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
          <p className="text-[10px] font-bold text-[color:var(--color-success)] uppercase tracking-widest">
            Identity Mode • Random Pattern Generator
          </p>
        </div>
        <p className="text-[10px] text-[color:var(--color-muted)] leading-relaxed">
          System generates a unique musical pattern as your sonic identity. <span className="text-[color:var(--color-foreground)]/60 font-medium">This vibe serves as your on-chain fingerprint.</span>
        </p>
      </div>

      <div className="relative group">
        <div className="flex items-center justify-between mb-2">
          <label className="text-[10px] font-bold uppercase tracking-widest text-[color:var(--color-muted)] group-focus-within:text-[color:var(--color-accent)] transition-colors flex items-center gap-2">
            Bitcoin Address to Link
            <Tooltip id="bitcoin-address-validation">
              <span className="text-[color:var(--color-primary)] cursor-help">ⓘ</span>
            </Tooltip>
          </label>
          {isBtcConnected && (
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1 text-[9px] text-[color:var(--color-success)] font-bold uppercase tracking-widest">
                <span className="w-1.5 h-1.5 bg-[color:var(--color-success)] rounded-full" />
                {walletName || 'Bitcoin Wallet'} Connected
              </span>
              <button
                onClick={handleDisconnectBtcWallet}
                className="text-[9px] text-[color:var(--color-muted)] hover:text-[color:var(--color-error)] transition-colors"
                title="Disconnect Wallet"
              >
                ×
              </button>
            </div>
          )}
        </div>
        <div className="relative flex items-center">
          <input
            type="text"
            value={btcAddress}
            onChange={(e) => setBtcAddress(e.target.value)}
            placeholder="bc1q... or 1... or 3..."
            className="w-full bg-transparent border-b-2 border-[color:var(--color-border)] py-3 focus:border-[color:var(--color-accent)] focus:outline-none transition-all duration-500 font-mono text-sm pr-32"
            disabled={isProcessing}
          />

          {!isBtcConnected && (
            <button
              onClick={handleConnectBtcWallet}
              disabled={isBtcLoading}
              className="absolute right-0 top-1/2 -translate-y-1/2 text-[9px] px-3 py-1.5 rounded-lg bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 font-bold uppercase tracking-widest border border-orange-500/20 transition-all flex items-center gap-2"
            >
              {isBtcLoading ? '...' : '+ Bitcoin Wallet'}
            </button>
          )}
        </div>

        {isBtcConnected && addresses.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {addresses.map((addr) => (
              <button
                key={addr.address}
                onClick={() => handleSelectBtcAddress(addr.address)}
                onDoubleClick={() => handleCopyAddress(addr.address)}
                title="Click to select, double-click to copy"
                className={`text-[9px] px-2 py-1 rounded border transition-all flex items-center gap-1 ${
                  btcAddress === addr.address
                    ? 'bg-[color:var(--color-primary)] text-white border-[color:var(--color-primary)]'
                    : 'bg-transparent text-[color:var(--color-muted)] border-[color:var(--color-border)] hover:border-[color:var(--color-primary)]'
                }`}
              >
                <span className="opacity-70">{addr.purpose === 'ordinals' ? '🥀' : '₿'}</span>
                {copiedAddr === addr.address ? (
                  <span className="text-[color:var(--color-success)]">Copied!</span>
                ) : (
                  <span>{addr.address.slice(0, 12)}...</span>
                )}
              </button>
            ))}
          </div>
        )}
        
        <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-[color:var(--color-accent)] group-focus-within:w-full transition-all duration-700" />
        
        {btcValidation && (
          <div className={`mt-1.5 text-[9px] flex items-center gap-2 ${
            btcValidation.type === 'error' ? 'text-[color:var(--color-error)]' :
            btcValidation.type === 'warning' ? 'text-[color:var(--color-warning)]' :
            'text-[color:var(--color-success)]'
          }`}>
            <span className={`w-2 h-2 rounded-full ${
              btcValidation.type === 'error' ? 'bg-[color:var(--color-error)]' :
              btcValidation.type === 'warning' ? 'bg-[color:var(--color-warning)]' :
              'bg-[color:var(--color-success)]'
            }`} />
            {btcValidation.message}
          </div>
        )}
      </div>

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
          
          {vibeValidation && (
            <div className={`mt-1.5 text-[9px] flex items-center gap-2 ${
              vibeValidation.type === 'error' ? 'text-[color:var(--color-error)]' :
              vibeValidation.type === 'warning' ? 'text-[color:var(--color-warning)]' :
              'text-[color:var(--color-success)]'
            }`}>
              <span className={`w-2 h-2 rounded-full ${
                vibeValidation.type === 'error' ? 'bg-[color:var(--color-error)]' :
                vibeValidation.type === 'warning' ? 'bg-[color:var(--color-warning)]' :
                'bg-[color:var(--color-success)]'
              }`} />
              {vibeValidation.message}
            </div>
          )}
        </div>
      )}

        <button
          onClick={() => setUseSecureGeneration(!useSecureGeneration)}
          className="text-[9px] text-[color:var(--color-muted)] hover:text-[color:var(--color-primary)] transition-colors underline block"
        >
          {useSecureGeneration ? '→ Use custom vibe instead' : '← Back to pattern generator'}
        </button>

      {dnaHash && (
        <div className="pt-4 animate-in fade-in slide-in-from-top-4 duration-700 space-y-3">
          <button
            onClick={onCommit}
            disabled={isCommiting || !isConnected || !btcAddress || !isValidBtcAddress(btcAddress)}
            className={`w-full py-4 rounded-xl border-2 transition-all flex items-center justify-center gap-2 text-xs font-bold tracking-widest uppercase ${
              onChainStatus === 'success'
                ? 'border-[color:var(--color-success)] text-[color:var(--color-success)] bg-[color:var(--color-success)]/5'
                : 'border-[color:var(--color-primary)]/30 text-[color:var(--color-primary)] hover:border-[color:var(--color-primary)] disabled:opacity-50 disabled:cursor-not-allowed'
            }`}
          >
            {onChainStatus === 'success' ? (
              <>✨ Identity Anchored</>
            ) : (
              <>
                {isConnected ? '🔒 Commit Identity to Starknet' : '⚠️ Connect Wallet First'}
                {isCommiting && <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />}
              </>
            )}
          </button>

          {onChainStatus === 'success' && onVerifyOnChain && (
            <button
              onClick={onVerifyOnChain}
              className="w-full py-3 rounded-xl border border-[color:var(--color-accent)]/30 text-[color:var(--color-accent)] hover:border-[color:var(--color-accent)] transition-all text-xs font-medium tracking-wide"
            >
              🔍 Verify On-Chain
            </button>
          )}

          {onChainStatus === 'success' && onDecentralizedBackup && (
            <div className="pt-2 animate-in fade-in slide-in-from-top-4 duration-1000">
              <button
                onClick={onDecentralizedBackup}
                disabled={isBackingUp || !isConnected}
                className={`w-full py-4 rounded-xl border border-[color:var(--color-accent)]/30 text-[color:var(--color-accent)] hover:bg-[color:var(--color-accent)]/5 transition-all flex items-center justify-center gap-2 text-xs font-bold tracking-widest uppercase ${
                  backupCid ? 'border-[color:var(--color-success)] text-[color:var(--color-success)] bg-[color:var(--color-success)]/5' : ''
                }`}
              >
                {backupCid ? (
                  <>🌐 Backed up to IPFS</>
                ) : (
                  <>
                    💾 Decentralized Backup (PL Genesis)
                    {isBackingUp && <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />}
                  </>
                )}
              </button>
              {backupCid && (
                <div className="mt-2 p-2 rounded-lg bg-black/40 border border-white/5 flex items-center justify-between">
                  <span className="text-[8px] font-mono opacity-50 truncate mr-2">CID: {backupCid}</span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(backupCid);
                      if (setStatus) setStatus('CID copied to clipboard!');
                    }}
                    className="text-[8px] font-bold uppercase tracking-tighter hover:text-[color:var(--color-primary)] transition-colors"
                  >
                    Copy
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function RecoveryForm({
  btcAddress,
  setBtcAddress,
  recoveryVibe,
  setRecoveryVibe,
  isProcessing,
  validationStates,
}: {
  btcAddress: string;
  setBtcAddress: (value: string) => void;
  recoveryVibe: string;
  setRecoveryVibe: (value: string) => void;
  isProcessing: boolean;
  validationStates: Map<string, ValidationState>;
}) {
  const recoveryValidation = validationStates.get('recovery-phrase');
  const btcValidation = validationStates.get('btc-address');

  return (
    <div className="space-y-4">
      <div className="p-4 rounded-xl bg-[color:var(--color-accent)]/5 border border-[color:var(--color-accent)]/20 shadow-sm">
        <p className="text-[10px] text-[color:var(--color-muted)] leading-relaxed">
          Replay your <span className="text-[color:var(--color-accent)] font-bold">musical pattern</span> or vibe description to prove authorship of this sonic identity.
        </p>
      </div>

      <div className="relative group">
        <label className="text-[10px] font-bold uppercase tracking-widest text-[color:var(--color-muted)] mb-2 block flex items-center justify-between">
          <span>Verification Input (Pattern or IPFS CID)</span>
          {recoveryVibe.startsWith('Qm') && (
            <span className="text-[8px] text-[color:var(--color-success)] font-bold animate-pulse">IPFS CID Detected</span>
          )}
        </label>
        <input
          type="text"
          value={recoveryVibe}
          onChange={(e) => setRecoveryVibe(e.target.value)}
          placeholder="Chunks, Vibe or Qm..."
          className="w-full bg-transparent border-b-2 border-[color:var(--color-border)] py-3 focus:border-[color:var(--color-primary)] focus:outline-none transition-all duration-500 font-light text-sm"
          disabled={isProcessing}
        />
        <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-[color:var(--color-primary)] group-focus-within:w-full transition-all duration-700" />
        
        {recoveryValidation && (
          <div className={`mt-1.5 text-[9px] flex items-center gap-2 ${
            recoveryValidation.type === 'error' ? 'text-[color:var(--color-error)]' :
            recoveryValidation.type === 'warning' ? 'text-[color:var(--color-warning)]' :
            'text-[color:var(--color-success)]'
          }`}>
            <span className={`w-2 h-2 rounded-full ${
              recoveryValidation.type === 'error' ? 'bg-[color:var(--color-error)]' :
              recoveryValidation.type === 'warning' ? 'bg-[color:var(--color-warning)]' :
              'bg-[color:var(--color-success)]'
            }`} />
            {recoveryValidation.message}
          </div>
        )}
      </div>

      <div className="relative group">
        <label className="text-[10px] font-bold uppercase tracking-widest text-[color:var(--color-muted)] mb-2 block">
          Bitcoin Address to Verify
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
        
        {btcValidation && (
          <div className={`mt-1.5 text-[9px] flex items-center gap-2 ${
            btcValidation.type === 'error' ? 'text-[color:var(--color-error)]' :
            btcValidation.type === 'warning' ? 'text-[color:var(--color-warning)]' :
            'text-[color:var(--color-success)]'
          }`}>
            <span className={`w-2 h-2 rounded-full ${
              btcValidation.type === 'error' ? 'bg-[color:var(--color-error)]' :
              btcValidation.type === 'warning' ? 'bg-[color:var(--color-warning)]' :
              'bg-[color:var(--color-success)]'
            }`} />
            {btcValidation.message}
          </div>
        )}
      </div>
    </div>
  );
}
