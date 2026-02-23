'use client';

import React from 'react';
import { StarknetConfig, argent, braavos, useInjectedConnectors, jsonRpcProvider } from '@starknet-react/core';
import { mainnet, sepolia } from '@starknet-react/chains';

/**
 * Starknet Provider Configuration
 * Updated to support latest RPC spec versions and custom RPC endpoints.
 */
export function StarknetProvider({ children }: { children: React.ReactNode }) {
    const { connectors } = useInjectedConnectors({
        recommended: [argent(), braavos()],
        includeRecommended: 'onlyIfNoConnectors',
        order: 'random'
    });

    // Custom RPC provider with environment variable support for production stability
    const provider = jsonRpcProvider({
        rpc: (chain) => {
            const rpcUrl = chain.id === mainnet.id
                ? process.env.NEXT_PUBLIC_STARKNET_MAINNET_RPC
                : process.env.NEXT_PUBLIC_STARKNET_SEPOLIA_RPC;

            return { nodeUrl: rpcUrl || chain.rpcUrls.public.http[0] };
        }
    });

    return (
        <StarknetConfig
            chains={[mainnet, sepolia]}
            provider={provider}
            connectors={connectors}
            autoConnect
        >
            {children}
        </StarknetConfig>
    );
}
