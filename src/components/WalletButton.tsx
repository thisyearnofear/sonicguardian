'use client';

import React from 'react';
import { useAccount, useConnect, useDisconnect } from '@starknet-react/core';

export function WalletButton() {
    const { address, status } = useAccount();
    const { connect, connectors } = useConnect();
    const { disconnect } = useDisconnect();

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
        <div className="flex flex-col gap-4">
            {/* Primary Connectors */}
            <div className="flex flex-col gap-2">
                {connectors.map((connector) => (
                    <button
                        key={connector.id}
                        onClick={() => connect({ connector })}
                        className="w-full px-5 py-3 rounded-xl bg-[color:var(--color-primary)]/10 text-[color:var(--color-primary)] text-xs font-bold uppercase tracking-widest hover:bg-[color:var(--color-primary)]/20 transition-all border border-[color:var(--color-primary)]/20 shadow-[0_0_15px_rgba(129,140,248,0.1)] flex items-center justify-center gap-2"
                    >
                        <span>Connect {connector.name}</span>
                    </button>
                ))}
            </div>
            
            {/* Xverse Wallet Info for Bitcoin Track */}
            <div className="p-4 rounded-xl bg-gradient-to-br from-orange-500/10 via-red-500/5 to-transparent border border-orange-500/20 shadow-sm">
                <div className="flex items-start gap-2 mb-2">
                    <span className="text-sm">💡</span>
                    <p className="text-xs font-bold text-orange-400 uppercase tracking-tight">Pro Tip</p>
                </div>
                <p className="text-[11px] text-[color:var(--color-muted)] leading-relaxed">
                    Use <span className="font-bold text-white/90">Xverse Wallet</span> for Bitcoin integration. 
                    Xverse supports Starknet and enables seamless <span className="text-orange-300/80 italic">BTC ↔ STRK</span> swaps.
                </p>
                <a 
                    href="https://www.xverse.app/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="mt-3 px-3 py-1.5 bg-orange-500/10 hover:bg-orange-500/20 text-[10px] text-orange-400 font-bold uppercase tracking-widest rounded-lg border border-orange-500/20 transition-all inline-flex items-center gap-2 group"
                >
                    Download Xverse 
                    <span className="group-hover:translate-x-0.5 transition-transform">→</span>
                </a>
            </div>
        </div>
    );
}
