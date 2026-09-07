'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useConnect } from '@starknet-react/core';
import { useBitcoinWallet } from '@/hooks/use-bitcoin-wallet';

interface ConnectWalletModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type WalletKind = 'starknet' | 'bitcoin';

export const BTC_ADDRESS_EVENT = 'sonic:btc-address';

export function publishBtcAddress(address: string) {
  if (typeof window === 'undefined' || !address) return;
  window.dispatchEvent(new CustomEvent(BTC_ADDRESS_EVENT, { detail: { address } }));
}

export function ConnectWalletModal({ isOpen, onClose }: ConnectWalletModalProps) {
  const { connect, connectors } = useConnect();
  const {
    addresses,
    isConnected: isBtcConnected,
    connect: connectBtc,
    isLoading: isBtcLoading,
    error: btcError,
    walletName,
  } = useBitcoinWallet();
  const [isAnimating, setIsAnimating] = useState(false);
  const [kind, setKind] = useState<WalletKind>('starknet');
  const dialogRef = useRef<HTMLDivElement>(null);

  const handleOverlayClick = useCallback(() => {
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (isOpen) {
      setIsAnimating(true);
      setKind('starknet');
      document.body.style.overflow = 'hidden';
      dialogRef.current?.focus();
    } else {
      const timer = setTimeout(() => setIsAnimating(false), 300);
      document.body.style.overflow = '';
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }

      if (e.key !== 'Tab' || !dialogRef.current) return;

      const focusableElements = dialogRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );
      const firstEl = focusableElements[0] as HTMLElement | undefined;
      const lastEl = focusableElements[focusableElements.length - 1] as HTMLElement | undefined;
      if (!firstEl || !lastEl) return;

      if (e.shiftKey) {
        if (document.activeElement === firstEl) {
          e.preventDefault();
          lastEl.focus();
        }
      } else if (document.activeElement === lastEl) {
        e.preventDefault();
        firstEl.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isBtcConnected || addresses.length === 0) return;
    const payment = addresses.find((a) => a.purpose === 'payment') ?? addresses[0];
    publishBtcAddress(payment.address);
  }, [isBtcConnected, addresses]);

  if (!isOpen && !isAnimating) return null;

  return (
    <div
      className={`fixed inset-0 z-[120] flex items-end sm:items-start justify-center transition-all duration-300 ${
        isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
      onClick={handleOverlayClick}
      role="presentation"
    >
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" aria-hidden />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="connect-wallet-title"
        ref={dialogRef}
        tabIndex={-1}
        className={`relative w-full sm:max-w-md bg-[color:var(--background)] border border-[color:var(--color-border)] shadow-2xl transition-all duration-300 ${
          isOpen ? 'translate-y-0' : 'translate-y-full sm:translate-y-4'
        } rounded-t-3xl sm:rounded-3xl max-h-[min(92dvh,calc(100dvh-5.5rem))] overflow-y-auto sm:mt-[calc(4.75rem+env(safe-area-inset-top))]`}
        style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 bg-[color:var(--background)] px-5 sm:px-6 pt-5 sm:pt-6 pb-3 border-b border-[color:var(--color-border)] space-y-4">
          <div className="w-10 h-1 rounded-full bg-[color:var(--color-border)] mx-auto sm:hidden" />
          <div className="space-y-1 text-center sm:text-left">
            <h2 id="connect-wallet-title" className="text-xl font-bold tracking-tight">
              Connect a wallet
            </h2>
            <p className="text-sm text-[color:var(--color-muted)]">
              Starknet locks and recovers. Bitcoin names the address you protect.
            </p>
          </div>
          <div
            className="grid grid-cols-2 p-0.5 rounded-xl bg-[color:var(--color-foreground)]/5 border border-[color:var(--color-border)]"
            role="tablist"
            aria-label="Wallet type"
          >
            <button
              type="button"
              role="tab"
              aria-selected={kind === 'starknet'}
              onClick={() => setKind('starknet')}
              className={`min-h-11 rounded-[10px] text-sm font-semibold ${
                kind === 'starknet'
                  ? 'bg-[color:var(--background)] text-[color:var(--foreground)] shadow-sm'
                  : 'text-[color:var(--color-muted)]'
              }`}
            >
              Starknet
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={kind === 'bitcoin'}
              onClick={() => setKind('bitcoin')}
              className={`min-h-11 rounded-[10px] text-sm font-semibold ${
                kind === 'bitcoin'
                  ? 'bg-[color:var(--background)] text-[color:var(--foreground)] shadow-sm'
                  : 'text-[color:var(--color-muted)]'
              }`}
            >
              Bitcoin
            </button>
          </div>
        </div>

        <div className="p-5 sm:p-6 space-y-4">
          {kind === 'starknet' ? (
            <>
              <p className="text-sm text-[color:var(--color-muted)]">
                Use this to lock on Create, or to finish Recover on-chain.
              </p>
              <div className="grid gap-2">
                {connectors.length === 0 && (
                  <p className="text-sm text-[color:var(--color-muted)]">
                    No Starknet wallet detected. Install Ready or Braavos, then refresh.
                  </p>
                )}
                {connectors.map((connector) => (
                  <button
                    key={connector.id}
                    type="button"
                    onClick={() => {
                      connect({ connector });
                      onClose();
                    }}
                    className="touch-target w-full flex items-center justify-between px-4 py-3.5 rounded-2xl bg-[color:var(--color-foreground)]/5 hover:bg-[color:var(--color-primary)]/10 border border-[color:var(--color-border)] hover:border-[color:var(--color-primary)]/30 transition-all active:scale-[0.98]"
                  >
                    <div className="flex items-center gap-3 text-left">
                      <div className="w-10 h-10 rounded-xl bg-[color:var(--color-foreground)]/10 flex items-center justify-center">
                        <span className="text-xl">{connector.name.charAt(0)}</span>
                      </div>
                      <div>
                        <div className="font-semibold text-sm">{connector.name}</div>
                        <div className="text-xs text-[color:var(--color-muted)]">Starknet</div>
                      </div>
                    </div>
                    <span className="text-sm font-semibold text-[color:var(--color-primary)]">Connect</span>
                  </button>
                ))}
              </div>
            </>
          ) : (
            <>
              <p className="text-sm text-[color:var(--color-muted)]">
                Fills the Bitcoin address field. No coins move.
              </p>
              {isBtcConnected ? (
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-[color:var(--color-success)]">
                    {walletName || 'Bitcoin wallet'} connected
                  </p>
                  {addresses.map((addr) => (
                    <button
                      key={addr.address}
                      type="button"
                      onClick={() => {
                        publishBtcAddress(addr.address);
                        onClose();
                      }}
                      className="w-full text-left px-4 py-3 rounded-xl border border-[color:var(--color-border)] font-mono text-xs break-all"
                    >
                      {addr.address}
                    </button>
                  ))}
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => void connectBtc()}
                  disabled={isBtcLoading}
                  className="btn-primary py-3.5"
                >
                  {isBtcLoading ? 'Connecting…' : 'Connect Bitcoin wallet'}
                </button>
              )}
              {btcError && <p className="text-sm text-[color:var(--color-warning)]">{btcError}</p>}
              <div className="flex gap-2 flex-wrap">
                <a
                  href="https://www.xverse.app/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-semibold text-orange-500"
                >
                  Get Xverse
                </a>
                <a
                  href="https://leather.io/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-semibold text-[color:var(--color-primary)]"
                >
                  Get Leather
                </a>
              </div>
            </>
          )}

          <button
            type="button"
            onClick={onClose}
            className="touch-target w-full py-3 text-sm font-semibold text-[color:var(--color-muted)]"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
