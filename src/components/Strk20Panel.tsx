'use client';

import React, { useState } from 'react';
import { useStrk20 } from '@/hooks/use-strk20';

interface Strk20PanelProps {
  onTxRecorded?: (hash: string) => void;
  setStatus?: (msg: string) => void;
  collapsible?: boolean;
}

function normalizeId(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '');
}

export function Strk20Panel({ onTxRecorded, setStatus, collapsible = false }: Strk20PanelProps) {
  const {
    isMainnet,
    isWalletConnected,
    wallets,
    supported,
    status,
    error,
    txHashes,
    connectPrivacyWallet,
    shieldRegistrationFee,
    demoPrivateTransfer,
    registrationFeeStr,
    transferAmountStr,
  } = useStrk20();

  const [open, setOpen] = useState(!collapsible);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [connecting, setConnecting] = useState(false);

  const pickable = wallets.filter((w) => {
    const id = normalizeId(w.name);
    return !id.includes('metamask');
  });

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
      setStatus?.(`Shielded ${registrationFeeStr} into STRK20 pool. Tx: ${hash.slice(0, 10)}…`);
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

  const isPending = status === 'pending' || status === 'connecting' || connecting;

  const body = (
    <div className="space-y-3">
      <p className="text-xs text-[color:var(--color-muted)] leading-relaxed">
        Optional: stake a small amount of STRK in the privacy pool before committing.
        Deposits are public; movement inside the pool is private.
      </p>

      {!isMainnet && (
        <p className="text-xs text-[color:var(--color-warning)]">
          Switch to <strong>Starknet mainnet</strong> to use the STRK20 pool.
        </p>
      )}

      {supported === null && (
        <button
          type="button"
          disabled={isPending}
          onClick={() => setPickerOpen(true)}
          className="w-full py-2.5 rounded-lg border border-[color:var(--color-border)] text-xs font-semibold text-[color:var(--color-foreground)] hover:border-[color:var(--color-accent)]/40 disabled:opacity-50"
        >
          {connecting ? 'Connecting…' : 'Connect privacy wallet'}
        </button>
      )}

      {supported === true && (
        <div className="flex flex-col sm:flex-row gap-2">
          <button
            type="button"
            disabled={isPending || !isWalletConnected}
            onClick={handleShield}
            className="flex-1 py-2.5 rounded-lg bg-[color:var(--color-accent)]/15 border border-[color:var(--color-accent)]/30 text-xs font-semibold text-[color:var(--color-accent)] disabled:opacity-50"
          >
            Shield {registrationFeeStr}
          </button>
          <button
            type="button"
            disabled={isPending || !isWalletConnected}
            onClick={handleTransfer}
            className="flex-1 py-2.5 rounded-lg border border-[color:var(--color-border)] text-xs font-semibold text-[color:var(--color-muted)] hover:text-[color:var(--color-foreground)] disabled:opacity-50"
          >
            Private transfer {transferAmountStr}
          </button>
        </div>
      )}

      {supported === false && (
        <p className="text-xs text-[color:var(--color-muted)]">
          Your wallet doesn&apos;t support STRK20 yet. Try Ready on mainnet, or use{' '}
          <a href="https://strk20.starknet.io/app" target="_blank" rel="noopener noreferrer" className="underline text-[color:var(--color-accent)]">
            strk20.starknet.io
          </a>
          .
        </p>
      )}

      {error && <p className="text-xs text-[color:var(--color-error)]">{error}</p>}

      {txHashes.length > 0 && (
        <details className="text-xs text-[color:var(--color-muted)]">
          <summary className="cursor-pointer font-medium">
            {txHashes.length} pool transaction{txHashes.length === 1 ? '' : 's'} recorded
          </summary>
          <ul className="mt-2 space-y-1 font-mono text-[10px] break-all">
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
                <p className="text-xs text-[color:var(--color-muted)]">No Starknet wallets detected.</p>
              ) : (
                pickable.map((w) => (
                  <button
                    key={w.name}
                    type="button"
                    disabled={connecting}
                    onClick={() => handleConnect(w)}
                    className="touch-target py-3 px-4 rounded-xl border border-[color:var(--color-border)] text-left text-sm font-medium hover:border-[color:var(--color-accent)]/40 disabled:opacity-50"
                  >
                    {w.name}
                  </button>
                ))
              )}
            </div>
            <button type="button" onClick={() => setPickerOpen(false)} className="w-full py-2 text-xs text-[color:var(--color-muted)]">
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );

  if (collapsible) {
    return (
      <details
        className="rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-foreground)]/[0.02] group"
        open={open}
        onToggle={(e) => setOpen((e.target as HTMLDetailsElement).open)}
      >
        <summary className="cursor-pointer list-none px-4 py-3 flex items-center justify-between gap-2">
          <span className="text-sm font-semibold">Private STRK stake (optional)</span>
          <span className="text-xs text-[color:var(--color-muted)] group-open:rotate-180 transition-transform">▾</span>
        </summary>
        <div className="px-4 pb-4">{body}</div>
      </details>
    );
  }

  return (
    <div className="p-4 rounded-xl border border-[color:var(--color-accent)]/20 bg-[color:var(--color-accent)]/5">
      <p className="text-sm font-semibold text-[color:var(--color-accent)] mb-2">Private STRK stake</p>
      {body}
    </div>
  );
}
