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
        <div className="flex gap-2">
            {connectors.map((connector) => (
                <button
                    key={connector.id}
                    onClick={() => connect({ connector })}
                    className="px-4 py-2 rounded-xl bg-[color:var(--color-primary)]/10 text-[color:var(--color-primary)] text-[10px] font-bold uppercase tracking-widest hover:bg-[color:var(--color-primary)]/20 transition-all border border-[color:var(--color-primary)]/20 shadow-[0_0_15px_rgba(129,140,248,0.1)]"
                >
                    Connect {connector.name}
                </button>
            ))}
        </div>
    );
}
