'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { isValidBtcAddress } from '@/lib/crypto';
import { DEMO_BTC_ADDRESS, isDemoBtcAddress } from '@/lib/demo-btc';
import { STRUDEL_PATTERN_LIBRARY } from '@/lib/strudel-patterns';
import type { MusicalChunk } from '@/lib/entropy-encoder';
import { Tooltip } from './Tooltip';
import { useBitcoinWallet } from '@/hooks/use-bitcoin-wallet';
import { FlowState } from './FlowState';
import dynamic from 'next/dynamic';

const StrudelEditor = dynamic(
  () => import('./StrudelEditor').then((m) => m.StrudelEditor),
  {
    ssr: false,
    loading: () => (
      <p className="text-[10px] text-[color:var(--color-muted)]">Loading pattern editor…</p>
    ),
  },
);

const Strk20Panel = dynamic(
  () => import('./Strk20Panel').then((m) => m.Strk20Panel),
  { ssr: false },
);

export type SecretMode = 'random' | 'library' | 'vibe';

interface ValidationState {
  isValid: boolean;
  message: string;
  type: 'error' | 'warning' | 'success';
}

export interface MintWizardProps {
  wizardStep: 1 | 2 | 3;
  setWizardStep: (step: 1 | 2 | 3) => void;
  secretMode: SecretMode;
  setSecretMode: (mode: SecretMode) => void;
  selectedLibraryPattern: string | null;
  setSelectedLibraryPattern: (name: string | null) => void;
  secretVibe: string;
  setSecretVibe: (v: string) => void;
  btcAddress: string;
  setBtcAddress: (v: string) => void;
  validationStates: Map<string, ValidationState>;
  setStatus?: (s: string) => void;
  vibeValidation?: ValidationState;
  generatedCode: string;
  dnaHash: string;
  musicalChunks: MusicalChunk[];
  seedPhrase: string;
  isProcessing: boolean;
  isConnected: boolean;
  isCommiting: boolean;
  onChainStatus: 'none' | 'pending' | 'success' | 'failed';
  onGenerate: () => void;
  onCommit: () => void;
  onCodeChange: (code: string) => void;
  onVerifyOnChain?: () => void;
  onDecentralizedBackup?: () => void;
  isBackingUp?: boolean;
  backupCid?: string | null;
}

const STEPS = [
  { num: 1 as const, label: 'Secret', short: '1', desc: 'Choose your recovery factor' },
  { num: 2 as const, label: 'Link', short: '2', desc: 'Bitcoin address to protect' },
  { num: 3 as const, label: 'Commit', short: '3', desc: 'Anchor on Starknet' },
];

function StepIndicator({
  current,
  onStep,
}: {
  current: 1 | 2 | 3;
  onStep: (s: 1 | 2 | 3) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-2 mb-8">
      {STEPS.map((step, i) => {
        const done = current > step.num;
        const active = current === step.num;
        return (
          <React.Fragment key={step.num}>
            <button
              type="button"
              onClick={() => done && onStep(step.num)}
              disabled={!done && !active}
              className={`flex flex-col items-center flex-1 min-w-0 transition-opacity ${
                done ? 'cursor-pointer opacity-100' : active ? 'opacity-100' : 'opacity-40'
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${
                  active
                    ? 'border-[color:var(--color-primary)] bg-[color:var(--color-primary)]/20 text-[color:var(--color-primary)]'
                    : done
                      ? 'border-[color:var(--color-success)] bg-[color:var(--color-success)]/10 text-[color:var(--color-success)]'
                      : 'border-[color:var(--color-border)] text-[color:var(--color-muted)]'
                }`}
              >
                {done ? '✓' : step.num}
              </div>
              <span className="text-[10px] font-semibold mt-1.5 truncate w-full text-center">
                <span className="sm:hidden">{step.short}</span>
                <span className="hidden sm:inline">{step.label}</span>
              </span>
            </button>
            {i < STEPS.length - 1 && (
              <div
                className={`h-0.5 flex-1 max-w-[40px] mb-5 transition-colors ${
                  current > step.num ? 'bg-[color:var(--color-success)]/50' : 'bg-[color:var(--color-border)]'
                }`}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

function BtcAddressField({
  btcAddress,
  setBtcAddress,
  btcValidation,
  isProcessing,
  setStatus,
}: {
  btcAddress: string;
  setBtcAddress: (v: string) => void;
  btcValidation?: ValidationState;
  isProcessing: boolean;
  setStatus?: (s: string) => void;
}) {
  const {
    addresses,
    isConnected: isBtcConnected,
    connect: connectBtcWallet,
    disconnect: disconnectBtcWallet,
    isLoading: isBtcLoading,
    walletName,
    error: btcWalletError,
  } = useBitcoinWallet();
  const [copiedAddr, setCopiedAddr] = useState<string | null>(null);
  const usingDemoAddress = isDemoBtcAddress(btcAddress);

  useEffect(() => {
    if (!isBtcConnected || addresses.length === 0 || btcAddress.trim()) return;
    const payment = addresses.find((a) => a.purpose === 'payment') ?? addresses[0];
    setBtcAddress(payment.address);
  }, [isBtcConnected, addresses, btcAddress, setBtcAddress]);

  return (
    <div className="relative group" id="btc-address-input">
      <div className="flex items-center justify-between mb-1">
        <label className="field-label flex items-center gap-2">
          Bitcoin address to protect
          <Tooltip id="bitcoin-address-validation">
            <span className="text-[color:var(--color-primary)] cursor-help">ⓘ</span>
          </Tooltip>
        </label>
        {isBtcConnected && (
          <div className="flex items-center gap-2">
            <span className="text-[9px] text-[color:var(--color-success)] font-bold uppercase">
              {walletName || 'Wallet'} ✓
            </span>
            <button type="button" onClick={() => { disconnectBtcWallet(); setBtcAddress(''); }} className="text-[9px] text-[color:var(--color-muted)] hover:text-[color:var(--color-error)]">×</button>
          </div>
        )}
      </div>

      <p className="text-xs text-[color:var(--color-muted)] mb-3">
        Paste, connect, or use the demo address — no funds required.
      </p>

      <input
        type="text"
        value={btcAddress}
        onChange={(e) => setBtcAddress(e.target.value)}
        placeholder="bc1q... or 1... or 3..."
        className="input-mobile font-mono"
        autoComplete="off"
        autoCapitalize="off"
        autoCorrect="off"
        spellCheck={false}
        disabled={isProcessing}
      />

      <div className="mt-3 flex flex-wrap gap-2">
        {!isBtcConnected && (
          <button type="button" onClick={() => connectBtcWallet()} disabled={isBtcLoading} className="text-[9px] px-3 py-1.5 rounded-lg bg-orange-500/10 text-orange-400 font-bold uppercase border border-orange-500/20">
            {isBtcLoading ? 'Connecting…' : 'Connect Wallet'}
          </button>
        )}
        <button
          type="button"
          onClick={() => { setBtcAddress(DEMO_BTC_ADDRESS); setStatus?.('Demo address loaded.'); }}
          disabled={isProcessing || usingDemoAddress}
          className="text-[9px] px-3 py-1.5 rounded-lg bg-[color:var(--color-primary)]/10 text-[color:var(--color-primary)] font-bold uppercase border border-[color:var(--color-primary)]/20 disabled:opacity-50"
        >
          {usingDemoAddress ? 'Demo Active' : 'Use Demo Address'}
        </button>
      </div>

      {btcWalletError && <p className="mt-2 text-[9px] text-[color:var(--color-warning)]">{btcWalletError}</p>}
      {usingDemoAddress && (
        <p className="mt-2 text-[9px] text-[color:var(--color-warning)]">Demo only — not for real funds.</p>
      )}

      {isBtcConnected && addresses.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {addresses.map((addr) => (
            <button
              key={addr.address}
              type="button"
              onClick={() => setBtcAddress(addr.address)}
              onDoubleClick={() => { navigator.clipboard.writeText(addr.address); setCopiedAddr(addr.address); setTimeout(() => setCopiedAddr(null), 2000); }}
              className={`text-[9px] px-2 py-1 rounded border ${btcAddress === addr.address ? 'bg-[color:var(--color-primary)] text-white border-[color:var(--color-primary)]' : 'border-[color:var(--color-border)] text-[color:var(--color-muted)]'}`}
            >
              {copiedAddr === addr.address ? 'Copied!' : `${addr.address.slice(0, 12)}…`}
            </button>
          ))}
        </div>
      )}

      {btcValidation && (
        <p className={`mt-2 text-[9px] ${btcValidation.type === 'error' ? 'text-[color:var(--color-error)]' : 'text-[color:var(--color-success)]'}`}>
          {btcValidation.message}
        </p>
      )}
    </div>
  );
}

export const MintWizard = React.memo(function MintWizard(props: MintWizardProps) {
  const {
    wizardStep,
    setWizardStep,
    secretMode,
    setSecretMode,
    selectedLibraryPattern,
    setSelectedLibraryPattern,
    secretVibe,
    setSecretVibe,
    btcAddress,
    setBtcAddress,
    validationStates,
    setStatus,
    vibeValidation,
    generatedCode,
    dnaHash,
    musicalChunks,
    seedPhrase,
    isProcessing,
    isConnected,
    isCommiting,
    onChainStatus,
    onGenerate,
    onCommit,
    onCodeChange,
    onVerifyOnChain,
    onDecentralizedBackup,
    isBackingUp,
    backupCid,
  } = props;

  const [showAdvanced, setShowAdvanced] = useState(false);
  const btcValidation = validationStates.get('btc-address');
  const featuredPatterns = STRUDEL_PATTERN_LIBRARY.slice(0, 6);

  const canProceedStep1 =
    secretMode === 'random' ||
    (secretMode === 'library' && selectedLibraryPattern) ||
    (secretMode === 'vibe' && secretVibe.trim().length >= 10);

  const canProceedStep2 = btcAddress.trim() && isValidBtcAddress(btcAddress);

  return (
    <div className="glass rounded-[var(--border-radius)] p-4 sm:p-8 w-full max-w-2xl mx-auto">
      <div className="mb-6">
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight" data-testid="mint-wizard-title">
          Create your sonic identity
        </h2>
        <p className="text-sm text-[color:var(--color-muted)] mt-2 leading-relaxed">
          Three steps. Your secret never leaves the browser — only a cryptographic commitment goes on-chain.
        </p>
      </div>

      <StepIndicator current={wizardStep} onStep={setWizardStep} />

      {/* Step 1 — Secret */}
      {wizardStep === 1 && (
        <div className="space-y-5 animate-in fade-in duration-300">
          <p className="field-label">How should we create your secret?</p>

          <div className="grid gap-3">
            <button
              type="button"
              onClick={() => setSecretMode('random')}
              className={`card-select ${secretMode === 'random' ? 'card-select-active' : 'hover:border-[color:var(--color-primary)]/30'}`}
            >
              <p className="text-sm font-bold flex items-center gap-2">
                <span aria-hidden>🎲</span> Random pattern
                <span className="text-[10px] font-normal text-[color:var(--color-success)] ml-auto">Recommended</span>
              </p>
              <p className="text-xs text-[color:var(--color-muted)] mt-1.5">
                Secure entropy turned into memorable musical chunks you can write down.
              </p>
            </button>

            <button
              type="button"
              onClick={() => setSecretMode('library')}
              className={`card-select ${secretMode === 'library' ? 'card-select-active' : 'hover:border-[color:var(--color-primary)]/30'}`}
            >
              <p className="text-sm font-bold flex items-center gap-2">
                <span aria-hidden>🎹</span> Curated pattern
              </p>
              <p className="text-xs text-[color:var(--color-muted)] mt-1.5">
                Pick from the pattern library — great for demos and quick starts.
              </p>
            </button>
          </div>

          {secretMode === 'library' && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2">
              {featuredPatterns.map((p) => (
                <button
                  key={p.name}
                  type="button"
                  onClick={() => setSelectedLibraryPattern(p.name)}
                  className={`p-3 rounded-lg border text-left text-[10px] transition-all ${selectedLibraryPattern === p.name ? 'border-[color:var(--color-primary)] bg-[color:var(--color-primary)]/10' : 'border-[color:var(--color-border)]'}`}
                >
                  <span className="font-bold block">{p.name}</span>
                  <span className="text-[8px] text-[color:var(--color-muted)] line-clamp-2">{p.vibe}</span>
                </button>
              ))}
            </div>
          )}

          <details className="group pt-2">
            <summary className="text-[9px] font-bold uppercase tracking-widest text-[color:var(--color-muted)] cursor-pointer hover:text-[color:var(--color-primary)] list-none flex items-center gap-2">
              <span className="group-open:rotate-90 transition-transform">▶</span> Advanced — custom vibe (AI)
            </summary>
            <div className="mt-3 pl-4 border-l border-[color:var(--color-border)]">
              <button
                type="button"
                onClick={() => setSecretMode('vibe')}
                className={`text-[10px] mb-2 ${secretMode === 'vibe' ? 'text-[color:var(--color-primary)] font-bold' : 'text-[color:var(--color-muted)]'}`}
              >
                Use AI vibe → pattern (requires inference)
              </button>
              {secretMode === 'vibe' && (
                <input
                  type="text"
                  value={secretVibe}
                  onChange={(e) => setSecretVibe(e.target.value)}
                  placeholder="e.g. dark industrial techno loop"
                  className="w-full bg-transparent border-b border-[color:var(--color-border)] py-2 text-sm focus:outline-none focus:border-[color:var(--color-primary)]"
                />
              )}
              {secretMode === 'vibe' && vibeValidation && (
                <p className="text-[9px] mt-1 text-[color:var(--color-muted)]">{vibeValidation.message}</p>
              )}
            </div>
          </details>

          <button
            type="button"
            disabled={!canProceedStep1}
            onClick={() => setWizardStep(2)}
            className="btn-primary py-4"
          >
            Next — Link address
          </button>
        </div>
      )}

      {/* Step 2 — Identifier */}
      {wizardStep === 2 && (
        <div className="space-y-5 animate-in fade-in duration-300">
          <BtcAddressField
            btcAddress={btcAddress}
            setBtcAddress={setBtcAddress}
            btcValidation={btcValidation}
            isProcessing={isProcessing}
            setStatus={setStatus}
          />
          <div className="flex flex-col-reverse sm:flex-row gap-3">
            <button type="button" onClick={() => setWizardStep(1)} className="touch-target flex-1 py-3 rounded-xl border border-[color:var(--color-border)] text-[10px] font-bold uppercase text-[color:var(--color-muted)]">
              ← Back
            </button>
            <button
              type="button"
              disabled={!canProceedStep2}
              onClick={() => setWizardStep(3)}
              className="btn-primary flex-[2] py-3"
            >
              Next — Review & commit
            </button>
          </div>
        </div>
      )}

      {/* Step 3 — Review & Commit */}
      {wizardStep === 3 && (
        <div className="space-y-5 animate-in fade-in duration-300">
          {!dnaHash ? (
            <FlowState
              variant="empty"
              icon="✨"
              title="Ready to generate"
              description="Your secret and Bitcoin address are set. Generate your identity fingerprint — recovery chunks appear here."
            >
              <button
                type="button"
                onClick={onGenerate}
                disabled={isProcessing}
                className="w-full max-w-xs mx-auto py-3.5 rounded-xl bg-[color:var(--color-primary)] text-white font-bold text-sm disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isProcessing ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Generating…
                  </>
                ) : (
                  'Generate identity'
                )}
              </button>
            </FlowState>
          ) : (
            <>
              {onChainStatus === 'success' ? (
                <FlowState
                  variant="success"
                  icon="🔒"
                  title="Identity anchored"
                  description="Your Pedersen commitment is on Starknet. Save your recovery chunks — you'll need them to verify."
                />
              ) : (
                <div className="p-4 rounded-xl border border-[color:var(--color-success)]/30 bg-[color:var(--color-success)]/5">
                  <p className="text-xs font-semibold text-[color:var(--color-success)] mb-2">Identity fingerprint</p>
                  <p className="font-mono text-[10px] break-all text-[color:var(--color-muted)]">{dnaHash.slice(0, 32)}…</p>
                </div>
              )}

              {musicalChunks.length > 0 && (
                <div className="space-y-2">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[color:var(--color-warning)]">
                    Save these chunks — your recovery key
                  </p>
                  {musicalChunks.map((chunk, i) => (
                    <div key={i} className="flex gap-2 p-2 rounded-lg bg-[color:var(--color-foreground)]/5 border border-[color:var(--color-border)] text-[11px]">
                      <span className="text-[color:var(--color-primary)] font-bold">{i + 1}.</span>
                      <span className="flex-1">{chunk.text}</span>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => { navigator.clipboard.writeText(seedPhrase || musicalChunks.map(c => c.text).join(' · ')); setStatus?.('Recovery chunks copied!'); }}
                    className="w-full py-2 rounded-lg border border-[color:var(--color-primary)]/30 text-[10px] font-bold text-[color:var(--color-primary)] uppercase"
                  >
                    Copy recovery chunks
                  </button>
                </div>
              )}

              <Strk20Panel setStatus={setStatus} collapsible />

              <div className="space-y-2">
                <p className="field-label mb-0">Anchor on Starknet</p>
                <button
                  type="button"
                  onClick={onCommit}
                  disabled={isCommiting || !isConnected || onChainStatus === 'success'}
                  className={`w-full py-4 rounded-xl border-2 font-bold text-sm flex items-center justify-center gap-2 transition-all ${
                    onChainStatus === 'success'
                      ? 'border-[color:var(--color-success)] text-[color:var(--color-success)] bg-[color:var(--color-success)]/5'
                      : 'border-[color:var(--color-primary)]/40 text-[color:var(--color-primary)] hover:bg-[color:var(--color-primary)]/5 disabled:opacity-50'
                  }`}
                >
                  {onChainStatus === 'success' ? '✨ Identity anchored' : isConnected ? 'Commit to Starknet' : 'Connect wallet to commit'}
                  {isCommiting && <span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />}
                </button>
                {!isConnected && (
                  <p className="text-xs text-center text-[color:var(--color-muted)]">
                    Use the wallet button in the header.
                  </p>
                )}
              </div>

              {onChainStatus === 'success' && (
                <div className="flex flex-col gap-2">
                  {onVerifyOnChain && (
                    <button type="button" onClick={onVerifyOnChain} className="py-2 rounded-lg border border-[color:var(--color-accent)]/30 text-[10px] font-bold uppercase text-[color:var(--color-accent)]">
                      Verify on-chain
                    </button>
                  )}
                  {onDecentralizedBackup && (
                    <button type="button" onClick={onDecentralizedBackup} disabled={isBackingUp} className="py-2 rounded-lg border border-[color:var(--color-accent)]/30 text-[10px] font-bold uppercase text-[color:var(--color-accent)]">
                      {backupCid ? '🌐 Backed up to IPFS' : '💾 Backup to IPFS'}
                    </button>
                  )}
                  <Link
                    href="/verify"
                    prefetch
                    className="py-3.5 rounded-xl bg-[color:var(--color-accent)] text-white text-sm font-bold text-center block hover:opacity-90 transition-opacity"
                    data-testid="nav-to-verify"
                  >
                    Test recovery →
                  </Link>
                </div>
              )}

              <details className="group" open={showAdvanced} onToggle={(e) => setShowAdvanced((e.target as HTMLDetailsElement).open)}>
                <summary className="text-[9px] font-bold uppercase tracking-widest text-[color:var(--color-muted)] cursor-pointer list-none">
                  ▶ Advanced — edit pattern & preview audio (optional)
                </summary>
                {generatedCode && (
                  <div className="mt-3">
                    <StrudelEditor initialCode={generatedCode} onCodeChange={onCodeChange} />
                    <p className="text-[9px] text-[color:var(--color-muted)] mt-2 italic">
                      Editing updates your DNA hash. Playback may fail — identity still works from the code text.
                    </p>
                  </div>
                )}
              </details>
            </>
          )}

          <button type="button" onClick={() => setWizardStep(2)} className="w-full py-2 text-[10px] font-bold uppercase text-[color:var(--color-muted)] hover:text-[color:var(--color-foreground)]">
            ← Back to identifier
          </button>
        </div>
      )}

      <div className="mt-6 pt-4 border-t border-[color:var(--color-border)] text-center">
        <Link
          href="/verify"
          prefetch
          className="text-sm text-[color:var(--color-muted)] hover:text-[color:var(--color-foreground)] transition-colors"
          data-testid="nav-to-verify"
        >
          Already minted? Verify authorship
        </Link>
      </div>
    </div>
  );
});
