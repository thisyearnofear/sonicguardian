'use client';

import React from 'react';
import { useAccount, useConnect, useDisconnect } from '@starknet-react/core';

export function WalletButton() {
    const { address, status } = useAccount();
    const { connect, connectors } = useConnect();
    const { disconnect } = useDisconnect();

    if (status === 'connected') {
        return (
            <div className="flex items-center gap-4">
                <span className="text-[10px] font-mono text-[color:var(--color-muted)] bg-[color:var(--color-foreground)]/5 px-3 py-1.5 rounded-full">
                    {address?.slice(0, 6)}...{address?.slice(-4)}
                </span>
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
