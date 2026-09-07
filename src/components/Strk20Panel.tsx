'use client';

import React, { useState } from 'react';
import { useStrk20 } from '@/hooks/use-strk20';

interface Strk20PanelProps {
  onTxRecorded?: (hash: string) => void;
  setStatus?: (msg: string) => void;
}

function normalizeId(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function formatShielded(hex: string | null): string {
  if (!hex || hex === '0x0' || hex === '0') return '0 STRK';
  try {
    const wei = BigInt(hex);
    const whole = wei / 10n ** 18n;
    const frac = (wei % 10n ** 18n).toString().padStart(18, '0').slice(0, 4);
    const trimmed = `${whole}.${frac}`.replace(/\.?0+$/, '');
    return `${trimmed || '0'} STRK`;
  } catch {
    return '—';
  }
}

const STEPS = [
  { key: 'shield', title: 'Shield', hint: 'Move STRK into the private pool' },
  { key: 'transfer', title: 'Transfer', hint: 'Send privately inside the pool' },
  { key: 'unshield', title: 'Unshield', hint: 'Bring STRK back to your wallet' },
] as const;

export function Strk20Panel({ onTxRecorded, setStatus }: Strk20PanelProps) {
  const {
    isMainnet,
    isWalletConnected,
    wallets,
    supported,
    status,
    error,
    txHashes,
    shieldedBalance,
    connectPrivacyWallet,
    shieldRegistrationFee,
    demoPrivateTransfer,
    demoUnshield,
    registrationFeeStr,
    transferAmountStr,
  } = useStrk20();

  const [pickerOpen, setPickerOpen] = useState(false);
  const [connecting, setConnecting] = useState(false);

  const pickable = wallets.filter((w) => {
    const id = normalizeId(w.name);
    return !id.includes('metamask');
  });

  const completed = Math.min(txHashes.length, 3);
  const activeStep = Math.min(completed, 2);
  const loopDone = completed >= 3;

  const handleConnect = async (wallet: (typeof wallets)[0]) => {
    setConnecting(true);
    try {
      await connectPrivacyWallet(wallet);
      setPickerOpen(false);
    } finally {
      setConnecting(false);
    }
  };

  const handleShield = async () => {
    const hash = await shieldRegistrationFee();
    if (hash) {
      setStatus?.(`Shielded ${registrationFeeStr}. Tx: ${hash.slice(0, 10)}…`);
      onTxRecorded?.(hash);
    }
  };

  const handleTransfer = async () => {
    const hash = await demoPrivateTransfer();
    if (hash) {
      setStatus?.(`Private transfer sent. Tx: ${hash.slice(0, 10)}…`);
      onTxRecorded?.(hash);
    }
  };

  const handleUnshield = async () => {
    const hash = await demoUnshield();
    if (hash) {
      setStatus?.(`Unshielded ${transferAmountStr} back to your wallet. Tx: ${hash.slice(0, 10)}…`);
      onTxRecorded?.(hash);
    }
  };

  const isPending = status === 'pending' || status === 'connecting' || connecting;
  const canAct = supported === true && isWalletConnected && isMainnet && !isPending;

  return (
    <div
      className="glass rounded-[var(--border-radius)] p-4 sm:p-8 w-full max-w-2xl mx-auto space-y-6"
      data-testid="strk20-panel"
    >
      <div>
        <h2 className="sr-only" data-testid="pool-panel-title">
          Privacy pool
        </h2>
        <p className="text-sm text-[color:var(--color-muted)] leading-relaxed">
          Three steps, in order. Deposits are public; movement inside the pool is private.
        </p>
      </div>

      <div className="flex items-center justify-between gap-2" aria-label="Pool loop progress">
        {STEPS.map((step, i) => {
          const done = completed > i;
          const current = activeStep === i && !loopDone;
          return (
            <React.Fragment key={step.key}>
              <div className={`flex-1 min-w-0 text-center ${current ? 'opacity-100' : done ? 'opacity-100' : 'opacity-45'}`}>
                <div
                  className={`mx-auto w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 ${
                    done
                      ? 'border-[color:var(--color-success)] text-[color:var(--color-success)]'
                      : current
                        ? 'border-[color:var(--color-primary)] text-[color:var(--color-primary)]'
                        : 'border-[color:var(--color-border)] text-[color:var(--color-muted)]'
                  }`}
                >
                  {done ? '✓' : i + 1}
                </div>
                <p className="text-xs font-semibold mt-1.5 truncate">{step.title}</p>
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className={`h-0.5 w-8 mb-5 ${
                    completed > i ? 'bg-[color:var(--color-success)]/50' : 'bg-[color:var(--color-border)]'
                  }`}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>

      <div className="rounded-xl border border-[color:var(--color-border)] px-4 py-3 flex items-center justify-between gap-3">
        <p className="text-sm text-[color:var(--color-muted)]">Shielded balance</p>
        <p className="text-sm font-mono font-semibold" data-testid="shielded-balance">
          {supported === true ? formatShielded(shieldedBalance) : '—'}
        </p>
      </div>

      {!isMainnet && (
        <p className="text-sm text-[color:var(--color-warning)]">
          Switch the header wallet to Starknet mainnet to run the loop.
        </p>
      )}

      {supported === null && (
        <button
          type="button"
          disabled={isPending}
          onClick={() => setPickerOpen(true)}
          className="btn-primary py-3.5"
        >
          {connecting ? 'Connecting…' : 'Connect a privacy wallet'}
        </button>
      )}

      {supported === false && (
        <p className="text-sm text-[color:var(--color-muted)] leading-relaxed">
          This wallet cannot use the pool yet. Try Ready on mainnet, or the official{' '}
          <a
            href="https://strk20.starknet.io/app"
            target="_blank"
            rel="noopener noreferrer"
            className="underline text-[color:var(--color-primary)]"
          >
            STRK20 app
          </a>
          .
        </p>
      )}

      {supported === true && !loopDone && (
        <div className="space-y-3">
          <p className="text-sm font-semibold">{STEPS[activeStep].title}</p>
          <p className="text-sm text-[color:var(--color-muted)]">{STEPS[activeStep].hint}</p>
          {activeStep === 0 && (
            <button type="button" disabled={!canAct} onClick={() => void handleShield()} className="btn-primary py-3.5">
              {isPending ? 'Shielding…' : `1 · Shield ${registrationFeeStr}`}
            </button>
          )}
          {activeStep === 1 && (
            <button type="button" disabled={!canAct} onClick={() => void handleTransfer()} className="btn-primary py-3.5">
              {isPending ? 'Sending…' : `2 · Private transfer ${transferAmountStr}`}
            </button>
          )}
          {activeStep === 2 && (
            <button type="button" disabled={!canAct} onClick={() => void handleUnshield()} className="btn-primary py-3.5">
              {isPending ? 'Unshielding…' : `3 · Unshield ${transferAmountStr} to wallet`}
            </button>
          )}
        </div>
      )}

      {loopDone && (
        <p className="text-sm text-[color:var(--color-success)] font-semibold">
          Loop complete — shield, private transfer, and unshield are on-chain.
        </p>
      )}

      {error && <p className="text-sm text-[color:var(--color-error)]">{error}</p>}

      {txHashes.length > 0 && (
        <details className="text-sm text-[color:var(--color-muted)]">
          <summary className="cursor-pointer font-medium">
            {txHashes.length} transaction{txHashes.length === 1 ? '' : 's'} recorded
          </summary>
          <ul className="mt-2 space-y-1 font-mono text-xs break-all">
            {txHashes.map((h) => (
              <li key={h}>{h}</li>
            ))}
          </ul>
        </details>
      )}

      {pickerOpen && (
        <div className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center">
          <div
            className="absolute inset-0 bg-black/70"
            onClick={() => !connecting && setPickerOpen(false)}
            aria-hidden
          />
          <div className="relative w-full sm:max-w-sm bg-[color:var(--background)] border border-[color:var(--color-border)] rounded-t-2xl sm:rounded-2xl p-5 space-y-3">
            <p className="text-sm font-bold">Choose wallet</p>
            <div className="grid gap-2">
              {pickable.length === 0 ? (
                <p className="text-sm text-[color:var(--color-muted)]">No Starknet wallets detected.</p>
              ) : (
                pickable.map((w) => (
                  <button
                    key={w.name}
                    type="button"
                    disabled={connecting}
                    onClick={() => void handleConnect(w)}
                    className="touch-target py-3 px-4 rounded-xl border border-[color:var(--color-border)] text-left text-sm font-medium hover:border-[color:var(--color-primary)]/40 disabled:opacity-50"
                  >
                    {w.name}
                  </button>
                ))
              )}
            </div>
            <button type="button" onClick={() => setPickerOpen(false)} className="w-full py-2 text-sm text-[color:var(--color-muted)]">
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
