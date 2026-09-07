'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { isValidBtcAddress } from '@/lib/crypto';
import { DEMO_BTC_ADDRESS, isDemoBtcAddress } from '@/lib/demo-btc';
import { STRUDEL_PATTERN_LIBRARY } from '@/lib/strudel-patterns';
import type { MusicalChunk } from '@/lib/entropy-encoder';
import { assessSecretEntropy } from '@/lib/entropy-estimate';
import { Tooltip } from './Tooltip';
import { useBitcoinWallet } from '@/hooks/use-bitcoin-wallet';
import { FlowState } from './FlowState';
import { RecoveryFactors } from './RecoveryFactors';
import { VisualizerPanel } from './VisualizerPanel';
import dynamic from 'next/dynamic';

const StrudelEditor = dynamic(
  () => import('./StrudelEditor').then((m) => m.StrudelEditor),
  {
    ssr: false,
    loading: () => (
      <p className="text-xs text-[color:var(--color-muted)]">Loading pattern editor…</p>
    ),
  },
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
  paperShareSaved?: boolean;
  paperSharePending?: boolean;
  dnaSequence?: string;
  visualizerTheme?: 'light' | 'dark';
}

const STEPS = [
  { num: 1 as const, label: 'Secret', desc: 'Choose what you will remember' },
  { num: 2 as const, label: 'Address', desc: 'Bitcoin address to protect' },
  { num: 3 as const, label: 'Lock', desc: 'Save your keys and lock it in' },
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
              <span className="text-[11px] font-semibold mt-1.5 truncate w-full text-center">
                {step.label}
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
            <span className="text-xs text-[color:var(--color-success)] font-semibold">
              {walletName || 'Wallet'} ✓
            </span>
            <button type="button" onClick={() => { disconnectBtcWallet(); setBtcAddress(''); }} className="text-xs text-[color:var(--color-muted)] hover:text-[color:var(--color-error)]">×</button>
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
          <button type="button" onClick={() => connectBtcWallet()} disabled={isBtcLoading} className="text-xs px-3 py-2 rounded-lg bg-orange-500/10 text-orange-400 font-semibold border border-orange-500/20">
            {isBtcLoading ? 'Connecting…' : 'Connect Bitcoin wallet'}
          </button>
        )}
        <button
          type="button"
          onClick={() => { setBtcAddress(DEMO_BTC_ADDRESS); setStatus?.('Demo address loaded.'); }}
          disabled={isProcessing || usingDemoAddress}
          className="text-xs px-3 py-2 rounded-lg bg-[color:var(--color-primary)]/10 text-[color:var(--color-primary)] font-semibold border border-[color:var(--color-primary)]/20 disabled:opacity-50"
        >
          {usingDemoAddress ? 'Demo address in use' : 'Use demo address'}
        </button>
      </div>

      {btcWalletError && <p className="mt-2 text-xs text-[color:var(--color-warning)]">{btcWalletError}</p>}
      {usingDemoAddress && (
        <p className="mt-2 text-xs text-[color:var(--color-warning)]">Demo only — not for real funds.</p>
      )}

      {isBtcConnected && addresses.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {addresses.map((addr) => (
            <button
              key={addr.address}
              type="button"
              onClick={() => setBtcAddress(addr.address)}
              onDoubleClick={() => { navigator.clipboard.writeText(addr.address); setCopiedAddr(addr.address); setTimeout(() => setCopiedAddr(null), 2000); }}
              className={`text-xs px-2 py-1 rounded border ${btcAddress === addr.address ? 'bg-[color:var(--color-primary)] text-white border-[color:var(--color-primary)]' : 'border-[color:var(--color-border)] text-[color:var(--color-muted)]'}`}
            >
              {copiedAddr === addr.address ? 'Copied!' : `${addr.address.slice(0, 12)}…`}
            </button>
          ))}
        </div>
      )}

      {btcValidation && (
        <p className={`mt-2 text-xs ${btcValidation.type === 'error' ? 'text-[color:var(--color-error)]' : 'text-[color:var(--color-success)]'}`}>
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
    paperShareSaved = false,
    paperSharePending = false,
    dnaSequence,
    visualizerTheme = 'dark',
  } = props;

  const [showAdvanced, setShowAdvanced] = useState(false);
  const btcValidation = validationStates.get('btc-address');
  const featuredPatterns = STRUDEL_PATTERN_LIBRARY.slice(0, 6);

  const canProceedStep1 =
    secretMode === 'random' ||
    (secretMode === 'library' && selectedLibraryPattern) ||
    (secretMode === 'vibe' && secretVibe.trim().length >= 10);

  // Entropy budget disclosure (DIRECTION.md M4): show the effective secret
  // strength for the chosen mode. Non-blocking for now — hard enforcement
  // arrives with the multi-factor recovery flow.
  const entropyEstimate = assessSecretEntropy(
    secretMode,
    secretMode === 'vibe' ? secretVibe : undefined,
  );

  const canProceedStep2 = btcAddress.trim() && isValidBtcAddress(btcAddress);

  return (
    <div className="glass rounded-[var(--border-radius)] p-4 sm:p-8 w-full max-w-2xl mx-auto">
      <div className="mb-6">
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight" data-testid="mint-wizard-title">
          Create your recovery
        </h2>
        <p className="text-sm text-[color:var(--color-muted)] mt-2 leading-relaxed">
          Pick a musical secret, link a Bitcoin address, then write down the paper key. The music never leaves this browser.
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
                Random pattern
                <span className="text-xs font-normal text-[color:var(--color-success)] ml-auto">Recommended</span>
              </p>
              <p className="text-xs text-[color:var(--color-muted)] mt-1.5">
                Strong entropy turned into short musical phrases you can remember.
              </p>
            </button>

            <button
              type="button"
              onClick={() => setSecretMode('library')}
              className={`card-select ${secretMode === 'library' ? 'card-select-active' : 'hover:border-[color:var(--color-primary)]/30'}`}
            >
              <p className="text-sm font-bold">Curated pattern</p>
              <p className="text-xs text-[color:var(--color-muted)] mt-1.5">
                Pick from the library — faster for a demo, weaker as a real secret.
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
                  className={`p-3 rounded-lg border text-left text-xs transition-all ${selectedLibraryPattern === p.name ? 'border-[color:var(--color-primary)] bg-[color:var(--color-primary)]/10' : 'border-[color:var(--color-border)]'}`}
                >
                  <span className="font-bold block">{p.name}</span>
                  <span className="text-[11px] text-[color:var(--color-muted)] line-clamp-2">{p.vibe}</span>
                </button>
              ))}
            </div>
          )}

          {entropyEstimate && entropyEstimate.verdict !== 'sufficient' && (
            <div
              className="mt-3 p-3 rounded-lg border border-[color:var(--color-warning)]/40 bg-[color:var(--color-warning)]/5"
              data-testid="entropy-warning"
            >
              <p className="text-xs font-bold text-[color:var(--color-warning)]">
                Weak secret — {entropyEstimate.bits} effective bits
              </p>
              <p className="text-xs text-[color:var(--color-muted)] mt-1 leading-relaxed">
                {entropyEstimate.message}
              </p>
            </div>
          )}

          <details className="group pt-2">
            <summary className="text-xs font-semibold text-[color:var(--color-muted)] cursor-pointer hover:text-[color:var(--color-primary)] list-none flex items-center gap-2">
              <span className="group-open:rotate-90 transition-transform">▶</span> Advanced — describe a vibe
            </summary>
            <div className="mt-3 pl-4 border-l border-[color:var(--color-border)]">
              <button
                type="button"
                onClick={() => setSecretMode('vibe')}
                className={`text-xs mb-2 ${secretMode === 'vibe' ? 'text-[color:var(--color-primary)] font-bold' : 'text-[color:var(--color-muted)]'}`}
              >
                Generate a pattern from a description
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
              {secretMode === 'vibe' && (
                <p className="text-xs text-[color:var(--color-muted)] mt-1.5">
                  AI generates a pattern from your description — use something evocative for best results.
                </p>
              )}
              {secretMode === 'vibe' && vibeValidation && (
                <p className="text-xs mt-1 text-[color:var(--color-muted)]">{vibeValidation.message}</p>
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
            <button type="button" onClick={() => setWizardStep(1)} className="touch-target flex-1 py-3 rounded-xl border border-[color:var(--color-border)] text-xs font-semibold text-[color:var(--color-muted)]">
              ← Back
            </button>
            <button
              type="button"
              disabled={!canProceedStep2}
              onClick={() => setWizardStep(3)}
              className="btn-primary flex-[2] py-3"
            >
              Next — Hear and lock
            </button>
          </div>
        </div>
      )}

      {/* Step 3 — Review & Lock */}
      {wizardStep === 3 && (
        <div className="space-y-5 animate-in fade-in duration-300">
          {!dnaHash ? (
            <FlowState
              variant="empty"
              icon="♩"
              title="Ready to hear your secret"
              description="We’ll turn your choice into a pattern you can see, hear, and remember. Then you lock it in."
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
                    Composing…
                  </>
                ) : (
                  'Generate the pattern'
                )}
              </button>
            </FlowState>
          ) : (
            <>
              {dnaSequence && (
                <div className="space-y-2">
                  <p className="text-sm font-semibold">This is the sound of your key</p>
                  <VisualizerPanel theme={visualizerTheme} dnaSequence={dnaSequence} />
                </div>
              )}

              {onChainStatus === 'success' ? (
                <div className="space-y-4">
                  <FlowState
                    variant="success"
                    icon="♩"
                    title="Recovery is locked in"
                    description="Any two of these three keys can bring you back. Finish the paper step if the sheet is still open."
                  />
                  <RecoveryFactors
                    pattern="ready"
                    device="ready"
                    paper={paperShareSaved ? 'ready' : paperSharePending ? 'needed' : 'missing'}
                  />
                </div>
              ) : (
                <p className="text-sm text-[color:var(--color-muted)]">
                  Remember the phrases below. They are the key you carry in your head.
                </p>
              )}

              {musicalChunks.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-[color:var(--color-warning)]">
                    Remember these phrases
                  </p>
                  {musicalChunks.map((chunk, i) => (
                    <div key={i} className="flex gap-2 p-3 rounded-lg bg-[color:var(--color-foreground)]/5 border border-[color:var(--color-border)] text-sm">
                      <span className="text-[color:var(--color-primary)] font-bold">{i + 1}.</span>
                      <span className="flex-1">{chunk.text}</span>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => { navigator.clipboard.writeText(seedPhrase || musicalChunks.map(c => c.text).join(' · ')); setStatus?.('Phrases copied.'); }}
                    className="w-full min-h-11 py-2 rounded-lg border border-[color:var(--color-primary)]/30 text-sm font-semibold text-[color:var(--color-primary)]"
                  >
                    Copy phrases
                  </button>
                </div>
              )}

              {onChainStatus !== 'success' && (
                <div className="space-y-2">
                  <p className="field-label mb-0">Lock it on-chain</p>
                  <button
                    type="button"
                    onClick={onCommit}
                    disabled={isCommiting || !isConnected}
                    className="btn-primary py-4"
                  >
                    {isConnected ? 'Lock recovery' : 'Connect wallet to lock'}
                    {isCommiting && <span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin ml-2" />}
                  </button>
                  {!isConnected && (
                    <p className="text-sm text-center text-[color:var(--color-muted)]">
                      Use Connect wallet in the header — that’s your Starknet wallet, separate from Bitcoin.
                    </p>
                  )}
                </div>
              )}

              {onChainStatus === 'success' && (
                <div className="flex flex-col gap-2">
                  <Link
                    href="/verify"
                    prefetch
                    className="btn-primary py-3.5 text-center"
                    data-testid="nav-to-verify"
                  >
                    Try recovery
                  </Link>
                  <details className="text-sm text-[color:var(--color-muted)]">
                    <summary className="cursor-pointer font-medium">More options</summary>
                    <div className="mt-3 flex flex-col gap-2">
                      {onVerifyOnChain && (
                        <button type="button" onClick={onVerifyOnChain} className="min-h-11 py-2 rounded-lg border border-[color:var(--color-border)] text-sm font-semibold">
                          Check the on-chain lock
                        </button>
                      )}
                      {onDecentralizedBackup && (
                        <button type="button" onClick={onDecentralizedBackup} disabled={isBackingUp} className="min-h-11 py-2 rounded-lg border border-[color:var(--color-border)] text-sm font-semibold">
                          {backupCid ? 'Backed up to IPFS' : 'Optional IPFS backup'}
                        </button>
                      )}
                      <Link href="/pool" prefetch className="min-h-11 py-2 rounded-lg border border-[color:var(--color-border)] text-sm font-semibold text-center">
                        Privacy pool demo
                      </Link>
                    </div>
                  </details>
                </div>
              )}

              <details className="group" open={showAdvanced} onToggle={(e) => setShowAdvanced((e.target as HTMLDetailsElement).open)}>
                <summary className="text-xs font-semibold text-[color:var(--color-muted)] cursor-pointer list-none">
                  ▶ Hear and edit the pattern
                </summary>
                {generatedCode && (
                  <div className="mt-3">
                    <StrudelEditor initialCode={generatedCode} onCodeChange={onCodeChange} />
                    <p className="text-xs text-[color:var(--color-muted)] mt-2">
                      Playback can fail in some browsers. The phrases above still work as your secret.
                    </p>
                  </div>
                )}
              </details>
            </>
          )}

          <button type="button" onClick={() => setWizardStep(2)} className="w-full py-2 text-sm font-semibold text-[color:var(--color-muted)] hover:text-[color:var(--color-foreground)]">
            ← Back to address
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
          Already set up? Recover
        </Link>
      </div>
    </div>
  );
});
