'use client';

import React, { useState } from 'react';
import { useAccount, useDisconnect } from '@starknet-react/core';
import { ConnectWalletModal } from './ConnectWalletModal';

export function WalletButton() {
  const { address, status } = useAccount();
  const { disconnect } = useDisconnect();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [copied, setCopied] = React.useState(false);

  const copyAddress = () => {
    if (!address) return;
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (status === 'connected') {
    return (
      <div className="flex items-center gap-1.5 sm:gap-3">
        <button
          type="button"
          onClick={copyAddress}
          className="touch-target max-w-[140px] sm:max-w-none text-[10px] font-mono text-[color:var(--color-muted)] bg-[color:var(--color-foreground)]/5 px-2.5 sm:px-3 py-2 rounded-full border border-transparent hover:border-[color:var(--color-primary)]/20 truncate"
        >
          {copied ? 'Copied!' : `${address?.slice(0, 4)}…${address?.slice(-3)}`}
        </button>
        <button
          type="button"
          onClick={() => disconnect()}
          className="touch-target text-[10px] font-bold uppercase tracking-wider text-[color:var(--color-error)] px-2"
          aria-label="Disconnect wallet"
        >
          <span className="hidden sm:inline">Disconnect</span>
          <span className="sm:hidden">✕</span>
        </button>
      </div>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsModalOpen(true)}
        className="touch-target px-3 sm:px-5 py-2.5 rounded-xl bg-[color:var(--color-primary)] text-white text-[10px] font-bold uppercase tracking-wider sm:tracking-[0.2em] hover:bg-[color:var(--color-primary)]/90 active:scale-[0.98] transition-all shadow-[0_4px_15px_rgba(129,140,248,0.35)] whitespace-nowrap"
      >
        <span className="hidden min-[400px]:inline">Connect </span>Wallet
      </button>

      <ConnectWalletModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
}
