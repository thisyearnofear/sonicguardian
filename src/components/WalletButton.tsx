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
            <div className="flex items-center gap-4">
                <button
                    onClick={copyAddress}
                    className="group flex items-center gap-2 text-[10px] font-mono text-[color:var(--color-muted)] bg-[color:var(--color-foreground)]/5 px-3 py-1.5 rounded-full hover:bg-[color:var(--color-foreground)]/10 transition-all border border-transparent hover:border-[color:var(--color-primary)]/20 cursor-pointer"
                >
                    <span className="group-hover:text-[color:var(--color-primary)] transition-colors">
                        {copied ? 'Copied!' : `${address?.slice(0, 6)}...${address?.slice(-4)}`}
                    </span>
                    {!copied && (
                        <svg className="w-2.5 h-2.5 opacity-40 group-hover:opacity-100 group-hover:text-[color:var(--color-primary)] transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 002-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
                        </svg>
                    )}
                </button>
                <button
                    onClick={() => disconnect()}
                    className="text-[10px] font-bold uppercase tracking-widest text-[color:var(--color-error)] hover:opacity-80 transition-opacity"
                >
                    Disconnect
                </button>
            </div>
        );
    }

    return (
        <>
            <button
                onClick={() => setIsModalOpen(true)}
                className="px-5 py-2.5 rounded-xl bg-[color:var(--color-primary)] text-white text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-[color:var(--color-primary)]/90 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_4px_15px_rgba(129,140,248,0.4)] flex items-center gap-2"
            >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                Connect Wallet
            </button>

            <ConnectWalletModal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
            />
        </>
    );
}
