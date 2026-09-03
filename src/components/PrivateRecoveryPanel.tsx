'use client';

import React, { useState } from 'react';
import { usePrivateRecovery } from '@/hooks/use-private-recovery';
import { StatusBanner } from './StatusBanner';

interface PrivateRecoveryPanelProps {
  btcAddress: string;
  dnaHash: string;
  /** Shamir-reconstructed acoustic secret (decoupled path); omit for legacy guardians */
  acousticSecret?: string | null;
  disabled?: boolean;
}

function normalizeId(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '');
}

export function PrivateRecoveryPanel({ btcAddress, dnaHash, acousticSecret, disabled }: PrivateRecoveryPanelProps) {
  const {
    isMainnet,
    helperDeployed,
    status,
    error,
    txHash,
    wallets,
    supported,
    connectPrivacyWallet,
    authorizePrivately,
  } = usePrivateRecovery();

  const [pickerOpen, setPickerOpen] = useState(false);
  const [connecting, setConnecting] = useState(false);

  const pickable = wallets.filter((w) => !normalizeId(w.name).includes('metamask'));
  const isPending = status === 'pending' || connecting;

  const handleAuthorize = () => authorizePrivately(btcAddress, dnaHash, acousticSecret ?? undefined);

  const handleConnect = async (wallet: (typeof wallets)[0]) => {
    setConnecting(true);
    try {
      await connectPrivacyWallet(wallet);
      setPickerOpen(false);
    } finally {
      setConnecting(false);
    }
  };

  return (
    <div
      className="rounded-xl border border-[color:var(--color-primary)]/25 bg-[color:var(--color-primary)]/5 p-4 space-y-3"
      data-testid="private-recovery-panel"
    >
      <div>
        <p className="text-sm font-semibold">Private recovery authority</p>
        <p className="text-xs text-[color:var(--color-muted)] mt-1 leading-relaxed">
          Authorize Bitcoin recovery via STRK20 — the pool invokes your anonymizer, verifies your
          sonic ZK proof, and emits recovery on-chain with no public link to you.
        </p>
      </div>

      {!isMainnet && (
        <p className="text-xs text-[color:var(--color-warning)]">Switch to Starknet mainnet.</p>
      )}

      {!helperDeployed && isMainnet && (
        <p className="text-xs text-[color:var(--color-muted)]">
          Deploy <code className="text-[10px]">RecoveryInvokeHelper</code> and set{' '}
          <code className="text-[10px]">NEXT_PUBLIC_RECOVERY_HELPER_MAINNET</code> — see{' '}
          <code className="text-[10px]">docs/HACKATHON.md</code>.
        </p>
      )}

      {status === 'success' && txHash && (
        <StatusBanner message={`Private recovery authorized. Tx: ${txHash.slice(0, 18)}…`} />
      )}

      {error && <p className="text-xs text-[color:var(--color-error)]">{error}</p>}

      <div className="flex flex-col sm:flex-row gap-2">
        {supported === null && (
          <button
            type="button"
            disabled={isPending || disabled}
            onClick={() => setPickerOpen(true)}
            className="flex-1 py-2.5 rounded-lg border border-[color:var(--color-border)] text-xs font-semibold disabled:opacity-50"
          >
            Connect privacy wallet
          </button>
        )}
        <button
          type="button"
          disabled={
            disabled ||
            isPending ||
            !isMainnet ||
            !helperDeployed ||
            !dnaHash ||
            supported !== true
          }
          onClick={handleAuthorize}
          className="flex-1 py-2.5 rounded-lg bg-[color:var(--color-primary)] text-white text-xs font-semibold disabled:opacity-50"
        >
          {isPending ? 'Authorizing privately…' : 'Authorize via STRK20 pool'}
        </button>
      </div>

      {pickerOpen && (
        <div className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/70" onClick={() => !connecting && setPickerOpen(false)} aria-hidden />
          <div className="relative w-full sm:max-w-sm bg-[color:var(--background)] border border-[color:var(--color-border)] rounded-t-2xl sm:rounded-2xl p-5 space-y-3">
            <p className="text-sm font-bold">Privacy-enabled wallet</p>
            <div className="grid gap-2">
              {pickable.map((w) => (
                <button
                  key={w.name}
                  type="button"
                  disabled={connecting}
                  onClick={() => handleConnect(w)}
                  className="py-3 px-4 rounded-xl border border-[color:var(--color-border)] text-left text-sm font-medium disabled:opacity-50"
                >
                  {w.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
