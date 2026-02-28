'use client';

import React from 'react';
import { WalletButton } from './WalletButton';
import { MusicalChunk } from '../lib/entropy-encoder';
import { isValidBtcAddress } from '../lib/crypto';

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
}: ProtocolFormProps) {
  return (
    <div className="glass rounded-[var(--border-radius)] p-8 space-y-6 flex flex-col justify-between">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold tracking-tight">
            {phase === 'registration' ? 'Create Guardian' : 'Recover Access'}
          </h2>
          <WalletButton />
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
          />
        ) : (
          <RecoveryForm
            btcAddress={btcAddress}
            setBtcAddress={setBtcAddress}
            recoveryVibe={recoveryVibe}
            setRecoveryVibe={setRecoveryVibe}
            isProcessing={isProcessing}
          />
        )}
      </div>

      <div className="space-y-4 pt-4 border-t border-[color:var(--color-border)]">
        <button
          onClick={phase === 'registration' ? onGenerate : onRecovery}
          disabled={isProcessing}
          className="w-full py-5 rounded-2xl bg-[color:var(--color-foreground)] text-[color:var(--background)] font-bold tracking-widest uppercase text-sm hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-3"
        >
          {isProcessing ? 'Processing...' : phase === 'registration' ? 'Generate Guardian' : 'Verify & Recover'}
        </button>

        <button
          onClick={onSwitchPhase}
          className="w-full py-3 rounded-xl border border-[color:var(--color-border)] text-[color:var(--color-muted)] text-xs font-bold uppercase tracking-widest hover:text-[color:var(--color-foreground)] hover:border-[color:var(--color-foreground)] transition-all"
        >
          {phase === 'registration' ? 'Switch to Recovery' : 'Back to Registration'}
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
}) {
  return (
    <div className="space-y-4">
      <div className="p-4 rounded-xl bg-[color:var(--color-success)]/5 border border-[color:var(--color-success)]/20">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-2 h-2 bg-[color:var(--color-success)] rounded-full animate-pulse" />
          <p className="text-[10px] font-bold text-[color:var(--color-success)] uppercase tracking-widest">
            Secure Mode - 256-bit Entropy
          </p>
        </div>
        <p className="text-[10px] text-[color:var(--color-muted)]">
          System generates cryptographically secure musical pattern.
        </p>
      </div>

      <div className="relative">
        <label className="text-[10px] font-bold uppercase tracking-widest text-[color:var(--color-muted)] mb-2 block">
          Bitcoin Address
        </label>
        <input
          type="text"
          value={btcAddress}
          onChange={(e) => setBtcAddress(e.target.value)}
          placeholder="bc1q... or 1... or 3..."
          className="w-full bg-transparent border-b-2 border-[color:var(--color-border)] py-3 focus:border-[color:var(--color-accent)] focus:outline-none font-mono text-sm"
          disabled={isProcessing}
        />
        {btcAddress && !isValidBtcAddress(btcAddress) && (
          <p className="text-[9px] text-red-500 mt-1">Invalid Bitcoin address</p>
        )}
      </div>

      {!useSecureGeneration && (
        <div className="relative">
          <label className="text-[10px] font-bold uppercase tracking-widest text-[color:var(--color-muted)] mb-2 block">
            Custom Vibe (Advanced)
          </label>
          <input
            type="text"
            value={secretVibe}
            onChange={(e) => setSecretVibe(e.target.value)}
            placeholder="e.g. A fast, dark industrial techno loop"
            className="w-full bg-transparent border-b-2 border-[color:var(--color-border)] py-3 focus:border-[color:var(--color-primary)] focus:outline-none font-light text-sm italic"
            disabled={isProcessing}
          />
        </div>
      )}

      <button
        onClick={() => setUseSecureGeneration(!useSecureGeneration)}
        className="text-[9px] text-[color:var(--color-muted)] hover:text-[color:var(--color-primary)] underline"
      >
        {useSecureGeneration ? 'Use custom vibe instead' : 'Use secure mode'}
      </button>

      {dnaHash && (
        <button
          onClick={onCommit}
          disabled={!isConnected || !btcAddress || !isValidBtcAddress(btcAddress) || onChainStatus === 'pending'}
          className={`w-full py-4 rounded-xl border-2 text-xs font-bold tracking-widest uppercase ${
            onChainStatus === 'success'
              ? 'border-green-500 text-green-500 bg-green-500/5'
              : 'border-[color:var(--color-primary)] text-[color:var(--color-primary)] hover:border-[color:var(--color-primary)] disabled:opacity-50'
          }`}
        >
          {onChainStatus === 'success' ? 'Anchored' : isConnected ? 'Anchor to Starknet' : 'Connect Wallet First'}
        </button>
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
}: {
  btcAddress: string;
  setBtcAddress: (value: string) => void;
  recoveryVibe: string;
  setRecoveryVibe: (value: string) => void;
  isProcessing: boolean;
}) {
  return (
    <div className="space-y-4">
      <div className="p-4 rounded-xl bg-[color:var(--color-accent)]/5 border border-[color:var(--color-accent)]/20">
        <p className="text-[10px] text-[color:var(--color-muted)]">
          Enter your musical chunks or vibe to recover access.
        </p>
      </div>

      <div>
        <label className="text-[10px] font-bold uppercase tracking-widest text-[color:var(--color-muted)] mb-2 block">
          Recovery Phrase
        </label>
        <input
          type="text"
          value={recoveryVibe}
          onChange={(e) => setRecoveryVibe(e.target.value)}
          placeholder="Enter your musical chunks..."
          className="w-full bg-transparent border-b-2 border-[color:var(--color-border)] py-3 focus:border-[color:var(--color-primary)] focus:outline-none font-light text-sm"
          disabled={isProcessing}
        />
      </div>

      <div>
        <label className="text-[10px] font-bold uppercase tracking-widest text-[color:var(--color-muted)] mb-2 block">
          Bitcoin Address
        </label>
        <input
          type="text"
          value={btcAddress}
          onChange={(e) => setBtcAddress(e.target.value)}
          placeholder="bc1q... or 1... or 3..."
          className="w-full bg-transparent border-b-2 border-[color:var(--color-border)] py-3 focus:border-[color:var(--color-accent)] focus:outline-none font-mono text-sm"
          disabled={isProcessing}
        />
      </div>
    </div>
  );
}
